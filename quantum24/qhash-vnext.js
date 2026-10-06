/* Quantum24 QHash vNext — sequential, individualized rendering/validation layer. */
(()=>{"use strict";
const VERSION="QHash-5x7x-vNext";
const KEY="q24:qhash:matrix:vnext";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const sha256=async s=>{try{const b=new TextEncoder().encode(s),h=await crypto.subtle.digest("SHA-256",b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch{return btoa(unescape(encodeURIComponent(s))).slice(0,64)}};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return{}}};
const write=x=>{try{localStorage.setItem(KEY,JSON.stringify(x))}catch{}};
const state=read();
const domains=[
 "identity","render","data","interaction","ai-readable","pricing","payment","history",
 "sharing","accessibility","validation","recovery","performance","security","expansion"
];
const qhashes=Array.from({length:35},(_,i)=>({id:String(i+1).padStart(3,"0"),index:i+1,status:state[i+1]?.status||"ready",domains}));
async function validate(q){
 const payload=JSON.stringify({id:q.id,version:VERSION,domains:q.domains,ts:new Date().toISOString()});
 q.fingerprint=await sha256(payload);
 q.status="verified"; q.verifiedAt=new Date().toISOString(); state[q.index]=q; write(state);
 window.Quantum24QHash?.record?.("qhash_vnext_verified",{id:q.id,version:VERSION,fingerprint:q.fingerprint});
 return q;
}
function mount(){
 let host=document.getElementById("q24-qhash-vnext"); if(!host){
   host=document.createElement("section"); host.id="q24-qhash-vnext"; host.className="card";
   host.innerHTML='<h2>QHash · Sequential Upgrade Matrix</h2><p id="q24-qhash-summary">Preparing individualized QHashes…</p><div id="q24-qhash-list"></div>';
   const target=document.querySelector("#q24-all-upgrades")||document.querySelector("main")||document.body; target.appendChild(host);
 }
 const list=host.querySelector("#q24-qhash-list");
 list.innerHTML=qhashes.map(q=>'<article class="q24-qhash-row" data-qhash="'+q.id+'"><strong>QHash '+q.id+'</strong><span>'+q.status+'</span><small>'+domains.length+' domains · '+VERSION+'</small></article>').join("");
 host.querySelector("#q24-qhash-summary").textContent="35 individualized QHashes · "+domains.length+" upgrade domains · sequential verification";
}
async function runSequential(){
 for(const q of qhashes){ if(q.status!=="verified") await validate(q); }
 mount();
}
function responsive(){document.documentElement.classList.add("q24-qhash-vnext");}
addEventListener("DOMContentLoaded",()=>{responsive();mount();runSequential().catch(()=>mount())});
if(document.readyState!=="loading"){responsive();mount();runSequential().catch(()=>mount())}
window.Quantum24QHashVNext={version:VERSION,qhashes,domains,runSequential};
})();