(()=> {
  const root=document.createElement('section');
  root.id='q24-quantum-world';
  root.className='q24-world q24-world-v2';
  root.innerHTML=`
    <div class="q24-world-head">
      <div><span class="q24-kicker">QUANTUM24 • GAME UPGRADE</span><h2>Quantum World: Expedition</h2><p>Explore • gather • build • quest • survive • level up</p></div>
      <div class="q24-world-stats"><span id="q24wLevel">LV 1</span><span id="q24wXp">0 XP</span><span id="q24wDay">DAY 1</span><span id="q24wPos">0,0</span></div>
    </div>
    <div class="q24-world-stage">
      <canvas id="q24wCanvas" aria-label="Interactive Quantum World game"></canvas>
      <div class="q24-world-help">WASD / arrows move • drag looks • tap controls on mobile • collect resources • complete quests</div>
      <div class="q24-world-toast" id="q24wToast" role="status" aria-live="polite"></div>
    </div>
    <div class="q24-world-actions">
      <button id="q24wCollect" type="button">Collect</button><button id="q24wBuild" type="button">Build</button>
      <button id="q24wPlant" type="button">Plant</button><button id="q24wQuest" type="button">Quest</button>
      <button id="q24wPulse" type="button">Quantum Pulse</button><button id="q24wReset" type="button">New Run</button>
    </div>
    <div class="q24-mobile-pad" aria-label="Mobile movement controls">
      <button data-dir="up">▲</button><div><button data-dir="left">◀</button><button data-dir="down">▼</button><button data-dir="right">▶</button></div>
    </div>
    <div class="q24-game-hud">
      <div><b>Energy</b><span id="q24wEnergy">100/100</span></div><div><b>Inventory</b><span id="q24wInv">0</span></div>
      <div><b>Quest</b><span id="q24wQuestText">Explore 20 tiles</span></div><div><b>Streak</b><span id="q24wStreak">0</span></div>
    </div>
    <pre id="q24wOutput">Game initializing…</pre>
  `;
  const anchor=document.querySelector('#q24-hypermobile-ops')||document.querySelector('#q24-production')||document.body;
  anchor.parentNode.insertBefore(root,anchor);
  const c=root.querySelector('#q24wCanvas'),ctx=c.getContext('2d'),toast=root.querySelector('#q24wToast'),out=root.querySelector('#q24wOutput');
  const KEY='q24-world-v2';
  const defaults={version:2,day:1,x:0,y:0,angle:0,items:[],built:0,plants:0,collected:0,explored:0,level:1,xp:0,energy:100,inventory:{crystal:0,ore:0,seed:0},questsCompleted:0,streak:0,last:Date.now(),visited:{}};
  let state=Object.assign(defaults,JSON.parse(localStorage.getItem(KEY)||'null')||{});
  state.inventory=Object.assign(defaults.inventory,state.inventory||{});
  let keys={},drag=false,lastX=0,frame=0,pressed={};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const rand=(x,y)=>{let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
  const say=t=>{toast.textContent=t;clearTimeout(say.t);say.t=setTimeout(()=>toast.textContent='',1900)};
  const save=()=>{state.last=Date.now();localStorage.setItem(KEY,JSON.stringify(state));};
  function resize(){const d=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,Math.floor(c.clientWidth*d));c.height=Math.max(1,Math.floor(c.clientHeight*d));ctx.setTransform(d,0,0,d,0,0)}
  function project(wx,wy){const s=30,dx=wx-state.x,dy=wy-state.y,ca=Math.cos(state.angle),sa=Math.sin(state.angle),rx=dx*ca-dy*sa,ry=dx*sa+dy*ca;return [c.clientWidth/2+rx*s,c.clientHeight/2+ry*s*.62]}
  function tile(wx,wy){const r=rand(Math.floor(wx),Math.floor(wy));return r>.9?'crystal':r>.72?'ore':r>.48?'tree':'water'}
  function render(){
    const w=c.clientWidth,h=c.clientHeight;ctx.clearRect(0,0,w,h);
    const night=(state.day%4===0),cols=Math.ceil(w/30)+4,rows=Math.ceil(h/23)+4;
    ctx.fillStyle=night?'#050914':'#07131b';ctx.fillRect(0,0,w,h);
    for(let iy=-rows;iy<rows;iy++)for(let ix=-cols;ix<cols;ix++){
      const wx=Math.floor(state.x)+ix,wy=Math.floor(state.y)+iy,p=project(wx,wy),t=tile(wx,wy);
      if(p[0]<-50||p[0]>w+50||p[1]<-50||p[1]>h+50)continue;
      ctx.globalAlpha=.72;ctx.beginPath();ctx.moveTo(p[0],p[1]-13);ctx.lineTo(p[0]+15,p[1]-3);ctx.lineTo(p[0],p[1]+7);ctx.lineTo(p[0]-15,p[1]-3);ctx.closePath();
      ctx.fillStyle=t==='water'?'#10283d':t==='tree'?'#173d2d':t==='ore'?'#463b27':'#2b2250';ctx.fill();ctx.globalAlpha=1;
      if(t==='tree'){ctx.beginPath();ctx.arc(p[0],p[1]-12,7,0,Math.PI*2);ctx.fillStyle='#4f9b60';ctx.fill()}
      if(t==='crystal'){ctx.beginPath();ctx.moveTo(p[0],p[1]-19);ctx.lineTo(p[0]+6,p[1]-5);ctx.lineTo(p[0],p[1]);ctx.lineTo(p[0]-6,p[1]-5);ctx.closePath();ctx.fillStyle='#8ee8ff';ctx.fill()}
    }
    state.items.forEach(o=>{const p=project(o.x,o.y);ctx.fillStyle=o.type==='plant'?'#7fdf75':o.type==='build'?'#d7aa5b':'#8ee8ff';ctx.fillRect(p[0]-5,p[1]-16,10,10)});
    const p=project(state.x,state.y);ctx.beginPath();ctx.arc(p[0],p[1]-9,9,0,Math.PI*2);ctx.fillStyle='#f7fbff';ctx.fill();ctx.strokeStyle='#62e8ff';ctx.lineWidth=2;ctx.stroke();
    if(frame%2===0){ctx.beginPath();ctx.arc(p[0],p[1]-9,18+Math.sin(frame*.08)*3,0,Math.PI*2);ctx.strokeStyle='rgba(98,232,255,.3)';ctx.stroke()}
    root.querySelector('#q24wLevel').textContent='LV '+state.level;
    root.querySelector('#q24wXp').textContent=state.xp+' XP';
    root.querySelector('#q24wDay').textContent='DAY '+state.day;
    root.querySelector('#q24wPos').textContent=Math.round(state.x)+','+Math.round(state.y);
    root.querySelector('#q24wEnergy').textContent=Math.round(state.energy)+'/100';
    root.querySelector('#q24wInv').textContent=Object.values(state.inventory).reduce((a,b)=>a+b,0);
    root.querySelector('#q24wStreak').textContent=state.streak;
    requestAnimationFrame(()=>{frame++;render()});
  }
  function gainXp(n){state.xp+=n;const need=state.level*100;if(state.xp>=need){state.xp-=need;state.level++;state.energy=100;say('LEVEL UP • Quantum Level '+state.level)}}
  function move(dx,dy){const ca=Math.cos(state.angle),sa=Math.sin(state.angle);state.x=clamp(state.x+dx*ca-dy*sa,-999999,999999);state.y=clamp(state.y+dx*sa+dy*ca,-999999,999999);const k=Math.round(state.x)+','+Math.round(state.y);if(!state.visited[k]){state.visited[k]=1;state.explored++;gainXp(2)}state.energy=clamp(state.energy-.35,0,100);save()}
  function place(type){if(state.energy<4){say('Recharge energy by resting');return}const o={type,x:Math.round(state.x+(Math.random()-.5)*3),y:Math.round(state.y+(Math.random()-.5)*3)};state.items.push(o);if(type==='plant'){state.plants++;state.inventory.seed=Math.max(0,state.inventory.seed-1)}else state.built++;state.energy-=4;gainXp(15);save();say(type==='plant'?'Garden planted +15 XP':'Structure built +15 XP')}
  function collect(){const k=tile(Math.round(state.x),Math.round(state.y));const key=k==='crystal'?'crystal':k==='ore'?'ore':'seed';state.inventory[key]++;state.collected++;state.energy=clamp(state.energy+3,0,100);gainXp(10);save();say('Collected '+key+' • +10 XP')}
  function quest(){const target=20+state.level*5;if(state.explored>=target){state.explored-=target;state.questsCompleted++;state.streak++;gainXp(60);state.energy=100;save();say('QUEST COMPLETE • +60 XP')}else say('Quest: explore '+(target-state.explored)+' more tiles')}
  function pulse(){if(state.energy<20){say('Need 20 energy');return}state.energy-=20;gainXp(30);state.inventory.crystal++;save();say('QUANTUM PULSE • crystal found • +30 XP')}
  function reset(){if(confirm('Start a new Quantum expedition?')){state=JSON.parse(JSON.stringify(defaults));save();say('New expedition created')}}
  addEventListener('resize',resize);
  addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault()});
  addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  function tick(){let dx=0,dy=0;if(keys.w||keys.arrowup)dy-=.12;if(keys.s||keys.arrowdown)dy+=.12;if(keys.a||keys.arrowleft)dx-=.12;if(keys.d||keys.arrowright)dx+=.12;if(dx||dy)move(dx,dy);if(Date.now()-state.last>86400000){state.day++;save()}out.textContent=JSON.stringify({game:'Quantum World Expedition v2',level:state.level,xp:state.xp,day:state.day,position:[Math.round(state.x),Math.round(state.y)],explored:state.explored,inventory:state.inventory,built:state.built,plants:state.plants,collected:state.collected,questsCompleted:state.questsCompleted,streak:state.streak,energy:Math.round(state.energy),persistence:'localStorage',multiplayer:'not claimed; requires authenticated durable backend',truth:'Interactive client game state is real and locally persistent; external-world actions remain separately evidence-gated.'},null,2);requestAnimationFrame(tick)}
  c.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;c.setPointerCapture?.(e.pointerId)});c.addEventListener('pointermove',e=>{if(!drag)return;state.angle+=(e.clientX-lastX)*.01;lastX=e.clientX});c.addEventListener('pointerup',()=>drag=false);c.addEventListener('dblclick',()=>place('build'));
  root.querySelector('#q24wCollect').onclick=collect;root.querySelector('#q24wBuild').onclick=()=>place('build');root.querySelector('#q24wPlant').onclick=()=>place('plant');root.querySelector('#q24wQuest').onclick=quest;root.querySelector('#q24wPulse').onclick=pulse;root.querySelector('#q24wReset').onclick=reset;
  root.querySelectorAll('[data-dir]').forEach(b=>{const d=b.dataset.dir;b.addEventListener('pointerdown',()=>pressed[d]=true);b.addEventListener('pointerup',()=>pressed[d]=false);b.addEventListener('pointerleave',()=>pressed[d]=false)});
  const mobileTick=()=>{let dx=0,dy=0;if(pressed.up)dy-=.12;if(pressed.down)dy+=.12;if(pressed.left)dx-=.12;if(pressed.right)dx+=.12;if(dx||dy)move(dx,dy);requestAnimationFrame(mobileTick)};mobileTick();
  resize();render();tick();
})();