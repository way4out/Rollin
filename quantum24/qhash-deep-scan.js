const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname;
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
  let current=sha(JSON.stringify(files.map(x=>[x.file,x.sha256])));
  const rounds=[];
  for(let pass=1;pass<=4;pass++){current=sha(pass+'|'+current+'|'+sha(JSON.stringify({files:files.length,referenced})));rounds.push({pass,qhash:current});}
  return {ok:referenced.length===0,status:referenced.length?'MISMATCHES_FOUND':'CLEAN',algorithm:'SHA-256',passes:4,fileCount:files.length,files,routeMismatches:referenced,finalQHash:current,truth:'Static source integrity and route-reference scan only; it does not prove external providers, physical devices, payments, RF, energy or satellite execution.'};
}
module.exports={scan};