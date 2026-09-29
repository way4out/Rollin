import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const htmlFiles=[];
function walk(dir){
  for(const name of fs.readdirSync(dir)){
    if([".git","node_modules","_site"].includes(name)) continue;
    const full=path.join(dir,name);
    const st=fs.statSync(full);
    if(st.isDirectory()) walk(full);
    else if(name.toLowerCase().endsWith(".html")) htmlFiles.push(full);
  }
}
walk(root);

const external=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const refs=[];
for(const file of htmlFiles){
  const src=fs.readFileSync(file,"utf8");
  for(const m of src.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)){
    const raw=m[1].trim();
    if(!raw||raw.startsWith("#")||external.test(raw)||raw.startsWith("data:")||raw.startsWith("javascript:")) continue;
    const clean=raw.split("#")[0].split("?")[0];
    if(!clean) continue;
    let target;
    if(clean.startsWith("/Rollin/")) target=path.join(root,clean.slice("/Rollin/".length));
    else if(clean.startsWith("/")) continue;
    else target=path.resolve(path.dirname(file),clean);
    if(clean.endsWith("/")) target=path.join(target,"index.html");
    else if(!path.extname(target)) target=path.join(target,"index.html");
    refs.push({file:path.relative(root,file),raw,target});
  }
}
const broken=[];
for(const r of refs){
  if(!fs.existsSync(r.target)) broken.push(r);
}
if(broken.length){
  console.error("Broken local HTML links:");
  for(const b of broken) console.error(`- ${b.file} -> ${b.raw}`);
  process.exit(1);
}
console.log(`Rollin local-link audit passed: ${htmlFiles.length} HTML files, ${refs.length} local href/src references checked.`);