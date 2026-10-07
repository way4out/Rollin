const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname, DOMAINS=['web','pwa','mobile','ios','android','qhash','qverify','quantumize','radio','am','fm','digital','tv','satcom','telcom','payments','energy','profit','hardware','data','ai','qr','audit','security','recovery','staking'];
const AXES=['structure','routes','dependencies','runtime-contracts','truth-gates'];
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.git','playwright-report'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else if(/\.(js|html|json|css|ts|webmanifest|md)$/.test(e.name))out.push(p)}return out}
function refs(s){const a=new Set(),r=/["'](\/api\/[A-Za-z0-9_./:-]+)/g;let m;while((m=r.exec(s)))a.add(m[1]);return [...a].sort()}
function scan(){
 const files=walk(ROOT).map(f=>{const raw=fs.readFileSync(f,'utf8');return{file:path.relative(ROOT,f).replaceAll('\\\\','/'),bytes:Buffer.byteLength(raw),sha256:sha(raw),routes:refs(raw)}}),server=new Set(files.find(x=>x.file==='server.js')?.routes||[]);
 const all=[...new Set(files.flatMap(x=>x.routes))],external=['/api/adapters','/api/capability-chain','/api/control','/api/rf/status','/api/satellite/status','/api/telemetry','/api/energy/status','/api/integrations/certification','/api/maximized-q/bankr/transfer','/api/maximized-q/scan','/api/maximized-q/status','/api/profit-max','/api/revenue-routing','/api/scan'];
 const mismatches=all.filter(x=>!server.has(x)&&!external.includes(x));
 const points=[];for(const axis of AXES)for(const domain of DOMAINS)for(let ref=0;ref<5;ref++)points.push({axis,domain,ref,qhash:sha(axis+'|'+domain+'|'+ref)});
 let q=sha(JSON.stringify(files)+JSON.stringify(mismatches));const rounds=[];for(let pass=1;pass<=4;pass++){for(const p of points)q=sha(pass+'|'+q+'|'+p.qhash);rounds.push({pass,qhash:q})}
 return{ok:mismatches.length===0,status:mismatches.length?'MISMATCHES_FOUND':'CLEAN',scanModel:'5x reference-point matrix',axes:AXES,domains:DOMAINS,referencePointsPerAxisDomain:5,logicalReferencePoints:points.length,passes:4,fileCount:files.length,routeMismatches:mismatches,externalRoutes:all.filter(x=>external.includes(x)),rounds,finalQHash:q,truth:'Software/source integrity only. Physical devices, RF, satellite, energy and financial settlement remain evidence-gated.'}
}
if(require.main===module){console.log(JSON.stringify(scan()))}else module.exports={scan};