/* Quantum24 Fusion Core — AetherOS + Universe Simulator+ + OEQL game layer */
(()=>{const R=document.getElementById('q24-fusion');if(!R)return;
const $=s=>R.querySelector(s), out=$('.qf-out'), mode=$('.qf-mode'), stat=$('.qf-stat');
const key='q24-fusion-v1';let PLAYER=localStorage.getItem('q24-player-id')||('guest-'+crypto.randomUUID());localStorage.setItem('q24-player-id',PLAYER);let S=JSON.parse(localStorage.getItem(key)||'null')||{mode:'UNIVERSE',tick:0,xp:0,energy:100,credits:1000,systems:3,discoveries:0,quests:0,hashes:0,links:0};
const modes={UNIVERSE:'Universe Simulator+ • procedural cosmos',AETHER:'AetherOS • DSi command layer',OEQL:'OEQL • bank/asset command layer',NEXUS:'Quantum Nexus • unified control'};
function save(){localStorage.setItem(key,JSON.stringify(S))}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return('00000000'+(h>>>0).toString(16)).slice(-8)}
async function sync(){try{const r=await fetch('/api/world/state?player='+encodeURIComponent(PLAYER));if(r.ok){const j=await r.json();S.serverXP=j.player?.xp||S.xp;S.serverDiscoveries=j.player?.discoveries||S.discoveries;}}catch(e){}}
async function worldAction(type){try{const r=await fetch('/api/world/action',{method:'POST',headers:{'content-type':'application/json','x-operation-id':'Q24-'+PLAYER+'-'+Date.now()},body:JSON.stringify({player:PLAYER,type})});if(r.ok){const j=await r.json();S.xp=Math.max(S.xp,j.player?.xp||0);S.discoveries=Math.max(S.discoveries,j.player?.discoveries||0);save();render()}}catch(e){}}
function render(){mode.textContent=S.mode;stat.textContent='LVL '+(1+Math.floor(S.xp/500))+' • XP '+S.xp+' • ENERGY '+S.energy+' • CRED '+S.credits+' • SYS '+S.systems;out.textContent=modes[S.mode]+'\nSTATE: '+JSON.stringify(S,null,2)}
function act(type){S.tick++;if(type==='jump'){S.energy=Math.max(0,S.energy-12);S.systems+=1;S.discoveries+=1;S.xp+=120;S.hashes++;out.textContent='UNIVERSE JUMP\nNew sector instantiated. QHash '+hash(JSON.stringify(S));}
if(type==='boot'){S.energy=Math.min(100,S.energy+25);S.xp+=50;S.links++;out.textContent='AETHEROS LINK\nDSi-compatible capability profile loaded. Hardware-specific actions remain gated.'}
if(type==='bank'){S.credits+=100;S.xp+=80;S.quests++;S.hashes++;out.textContent='OEQL MISSION\nSimulation credit +100. No real funds moved. Receipt QHash '+hash(JSON.stringify(S));}
if(type==='scan'){S.xp+=60;S.hashes++;out.textContent='FUSION SWEEP\nAETHEROS ✓  UNIVERSE ✓  OEQL ✓  NEXUS ✓\nRuntime hash: '+hash(JSON.stringify(S));}
if(type==='quest'){S.quests++;S.xp+=150;S.energy=Math.max(0,S.energy-5);out.textContent='QUEST GENERATED\nSynchronize three layers, verify proof, return to Nexus.'}
save();render()}
R.querySelectorAll('[data-qf]').forEach(b=>b.onclick=()=>{act(b.dataset.qf);if(['jump','quest'].includes(b.dataset.qf))worldAction('quest')});R.querySelector('[data-qglobal]')?.addEventListener('click',()=>worldAction('ping'));
R.querySelectorAll('[data-qmode]').forEach(b=>b.onclick=()=>{S.mode=b.dataset.qmode;save();render()});
R.querySelector('[data-qreset]').onclick=()=>{localStorage.removeItem(key);location.reload()};
R.querySelector('[data-qoeql]').onclick=()=>window.open('https://oeql-bank-forever.onrender.com/','_blank','noopener');
R.querySelector('[data-qaether]').onclick=()=>window.open('https://github.com/way4out/AetherOS','_blank','noopener');
setInterval(()=>{S.energy=Math.min(100,S.energy+1);S.tick++;save();render()},5000);render();sync();setInterval(sync,10000);
})();