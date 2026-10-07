const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname;
const EXTERNAL_ROUTE_ALLOWLIST=new Set(['/api/adapters','/api/capability-chain','/api/control','/api/rf/status','/api/satellite/status','/api/telemetry','/api/energy/status','/api/integrations/certification','/api/maximized-q/bankr/transfer','/api/maximized-q/scan','/api/maximized-q/status','/api/profit-max','/api/revenue-routing','/api/scan']);
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(['node_modules','.git','playwright-report'].includes(e.name))continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p,out);
    else if(/\.(js|html|json|css|ts|webmanifest)$/.test(e.name))out.push(p);
  }
  return out;
}
function routesFromSource(s){
  const out=new Set(),re=/["'](\/api\/[A-Za-z0-9_./:-]+)/g;let m;
  while((m=re.exec(s)))out.add(m[1].replace(/\/$/,''));
  return [...out].sort();
}
function scan(){
  const files=walk(ROOT).map(file=>{
    const raw=fs.readFileSync(file,'utf8');
    return {file:path.relative(ROOT,file).replaceAll('\\','/'),bytes:Buffer.byteLength(raw),sha256:sha(raw),routes:routesFromSource(raw)};
  });
  const serverRoutes=new Set(files.find(x=>x.file==='server.js')?.routes||[]);
  const referenced=[...new Set(files.flatMap(x=>x.routes))].filter(x=>!serverRoutes.has(x)&&x!=='/api');
  const externalRoutes=referenced.filter(x=>EXTERNAL_ROUTE_ALLOWLIST.has(x));
  const mismatches=referenced.filter(x=>!EXTERNAL_ROUTE_ALLOWLIST.has(x));
  let current=sha(JSON.stringify(files.map(x=>[x.file,x.sha256])));
  const rounds=[];
  for(let pass=1;pass<=4;pass++){current=sha(pass+'|'+current+'|'+sha(JSON.stringify({files:files.length,referenced,mismatches,externalRoutes})));rounds.push({pass,qhash:current});}
  return {ok:mismatches.length===0,status:mismatches.length?'MISMATCHES_FOUND':'CLEAN',algorithm:'SHA-256',passes:4,fileCount:files.length,files,routeMismatches:mismatches,externalRoutes,finalQHash:current,truth:'Static source integrity and route-reference scan only; it does not prove external providers, physical devices, payments, RF, energy or satellite execution.'};
}
module.exports={scan};