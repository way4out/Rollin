const http=require('http');
const crypto=require('crypto');
const PORT=process.env.PORT||10000;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(),microphone=(),geolocation=()','Strict-Transport-Security':'max-age=31536000; includeSubDomains'};
const json=(r,s,o)=>{r.writeHead(s,{'Content-Type':'application/json; charset=utf-8',...headers});r.end(JSON.stringify(o))};
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const env=k=>Boolean(process.env[k]);
const providerConfig={enphase:['ENPHASE_CLIENT_ID','ENPHASE_CLIENT_SECRET','ENPHASE_REFRESH_TOKEN','ENPHASE_API_KEY'],tesla:['TESLA_CLIENT_ID','TESLA_CLIENT_SECRET','TESLA_ACCESS_TOKEN'],shelly:['SHELLY_INTEGRATOR_TAG','SHELLY_INTEGRATOR_TOKEN'],modbus:['MODBUS_GATEWAY_URL','MODBUS_GATEWAY_TOKEN'],utility:['UTILITY_API_URL','UTILITY_API_TOKEN'],iso:['ISO_API_URL','ISO_API_TOKEN'],hardware:['HARDWARE_GATEWAY_URL','HARDWARE_GATEWAY_TOKEN']};
function providers(){return{
 enphase:{configured:env('ENPHASE_CLIENT_ID')&&env('ENPHASE_CLIENT_SECRET')&&env('ENPHASE_REFRESH_TOKEN')&&env('ENPHASE_API_KEY'),mode:'OAuth2 telemetry/control adapter'},
 tesla:{configured:env('TESLA_CLIENT_ID')&&env('TESLA_CLIENT_SECRET')&&env('TESLA_ACCESS_TOKEN'),mode:'Fleet/Powerhub energy adapter'},
 shelly:{configured:env('SHELLY_INTEGRATOR_TAG')&&env('SHELLY_INTEGRATOR_TOKEN'),mode:'Cloud telemetry/control adapter'},
 modbus:{configured:env('MODBUS_GATEWAY_URL')&&env('MODBUS_GATEWAY_TOKEN'),mode:'authorized gateway adapter'},
 utility:{configured:env('UTILITY_API_URL')&&env('UTILITY_API_TOKEN'),mode:'tariff/settlement adapter'},
 iso:{configured:env('ISO_API_URL')&&env('ISO_API_TOKEN'),mode:'market/settlement adapter'},
 hardware:{configured:env('HARDWARE_GATEWAY_URL')&&env('HARDWARE_GATEWAY_TOKEN'),mode:'authorized device gateway'},
 payments:{configured:env('STRIPE_SECRET_KEY')||env('PAYMENT_PROVIDER_TOKEN'),mode:'verified payment adapter'},
 ai:{configured:env('OPENAI_API_KEY')||env('AI_PROVIDER_API_KEY'),mode:'AI provider adapter'}
}};
async function providerRead(p){
 const cfg=providers()[p]; if(!cfg?.configured)return{ok:false,provider:p,status:'not_configured',action:'connect_authorized_credentials'};
 const urls={enphase:process.env.ENPHASE_API_URL,tesla:process.env.TESLA_API_URL,shelly:process.env.SHELLY_API_URL,modbus:process.env.MODBUS_GATEWAY_URL,utility:process.env.UTILITY_API_URL,iso:process.env.ISO_API_URL,hardware:process.env.HARDWARE_GATEWAY_URL};
 try{const u=urls[p];if(!u)throw Error('provider_url_missing');const token=(p==='enphase'?process.env.ENPHASE_API_KEY:null)||(p==='tesla'?process.env.TESLA_ACCESS_TOKEN:null)||(p==='shelly'?process.env.SHELLY_INTEGRATOR_TOKEN:null)||(p==='modbus'?process.env.MODBUS_GATEWAY_TOKEN:null)||(p==='utility'?process.env.UTILITY_API_TOKEN:null)||(p==='iso'?process.env.ISO_API_TOKEN:null)||(p==='hardware'?process.env.HARDWARE_GATEWAY_TOKEN:null);const z=await fetch(u,{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});const t=await z.text();if(!z.ok)throw Error('provider_http_'+z.status);let data;try{data=JSON.parse(t)}catch{data={raw:t}};return{ok:true,provider:p,status:'connected',data,qhash:sha({p,data})}}catch(e){return{ok:false,provider:p,status:'error',error:e.message}}}
http.createServer(async(req,res)=>{try{
 if(req.url==='/health')return json(res,200,{ok:true,service:'quantum24-hardware-gateway',time:new Date().toISOString(),providers:providers(),physicalActuation:'fail-closed until authorized hardware provider is configured',guaranteedProfit:false,tokenAppreciation:false});
 if(req.url==='/api/providers')return json(res,200,{ok:true,providers:providers(),required:'real provider credentials supplied by the authorized owner',qhash:sha(providers())});
 if(req.url==='/api/telemetry'){const results={};for(const p of ['enphase','tesla','shelly','modbus','utility','iso','hardware'])results[p]=await providerRead(p);return json(res,200,{ok:true,results,generatedAt:new Date().toISOString(),physicalGeneration:'reported only from provider telemetry',qhash:sha(results)})}
 if(req.url==='/api/control'&&req.method==='POST')return json(res,403,{ok:false,error:'control_locked',reason:'authorized hardware endpoint and explicit provider authorization required',rfTransmission:false,qhash:sha({locked:true})});
 return json(res,404,{ok:false,error:'not_found'});
}catch(e){return json(res,500,{ok:false,error:e.message})}}).listen(PORT,'0.0.0.0',()=>console.log('Quantum24 hardware gateway listening on '+PORT));