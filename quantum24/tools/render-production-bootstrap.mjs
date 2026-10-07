import process from "node:process";

const API = "https://api.render.com/v1";
const key = process.env.RENDER_API_KEY;
const ownerId = process.env.RENDER_OWNER_ID || "tea-dau4r3093c1s73cnsr4g";
const serviceId = process.env.RENDER_SERVICE_ID || "srv-db1ot35g1s2s73b6l8kg";
const kvName = process.env.RENDER_KV_NAME || "quantum24-shared";
const region = process.env.RENDER_REGION || "oregon";
const kvPlan = process.env.RENDER_KV_PLAN || "1g";
const servicePlan = process.env.RENDER_SERVICE_PLAN || "0.5c-512mb";
const min = Number(process.env.RENDER_AUTOSCALE_MIN || 2);
const max = Number(process.env.RENDER_AUTOSCALE_MAX || 10);

if (!key) throw new Error("RENDER_API_KEY is required; never commit it.");

async function api(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
      ...(init.headers || {})
    }
  });
  const body = await res.text();
  let data; try { data = JSON.parse(body); } catch { data = { raw: body }; }
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} -> ${res.status}: ${body.slice(0,500)}`);
  return data;
}

const services = await api(`/services/${serviceId}`);
if (services.ownerId !== ownerId) throw new Error("Service owner does not match configured workspace.");

let kvs = await api(`/key-value?ownerId=${ownerId}&limit=100`);
kvs = kvs.items || kvs;
let kv = kvs.find(x => x.name === kvName);

if (!kv) {
  kv = await api("/key-value", {
    method: "POST",
    body: JSON.stringify({
      name: kvName, ownerId, region, plan: kvPlan,
      persistenceMode: "journal_snapshot",
      maxmemoryPolicy: "noeviction"
    })
  });
} else if (kv.plan !== kvPlan || kv.options?.persistenceMode !== "journal_snapshot") {
  kv = await api(`/key-value/${kv.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      plan: kvPlan,
      persistenceMode: "journal_snapshot",
      maxmemoryPolicy: "noeviction"
    })
  });
}

const conn = await api(`/key-value/${kv.id}/connection-info`);
if (!conn.internalConnectionString) throw new Error("Valkey internal connection string unavailable.");

await api(`/services/${serviceId}`, {
  method: "PATCH",
  body: JSON.stringify({
    serviceDetails: { plan: servicePlan }
  })
});

await api(`/services/${serviceId}/env-vars`, {
  method: "PUT",
  body: JSON.stringify({
    envVars: [
      { key: "REDIS_URL", value: conn.internalConnectionString },
      { key: "Q24_SHARED_CHANNEL", value: "quantum24:global" },
      { key: "Q24_SHARED_PREFIX", value: "quantum24:" }
    ]
  })
});

await api(`/services/${serviceId}/autoscaling`, {
  method: "PUT",
  body: JSON.stringify({
    enabled: true,
    min, max,
    criteria: {
      cpu: { enabled: true, percentage: 60 },
      memory: { enabled: true, percentage: 70 }
    }
  })
});

await api(`/services/${serviceId}/deploys`, {
  method: "POST",
  body: JSON.stringify({ clearCache: false })
});

console.log(JSON.stringify({
  ok: true,
  serviceId,
  kvId: kv.id,
  kvPlan,
  persistence: "journal_snapshot",
  servicePlan,
  autoscaling: { enabled: true, min, max, cpu: 60, memory: 70 },
  redisUrlConfigured: true,
  secret: "connection string not printed"
}, null, 2));
