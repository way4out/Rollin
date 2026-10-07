(()=> {
  const root=document.createElement('section');
  root.id='q24-quantum-world';
  root.className='q24-world';
  root.innerHTML=`
    <div class="q24-world-head">
      <div><span class="q24-kicker">QUANTUM24 • PERSISTENT WORLD</span><h2>Quantum World</h2><p>Explore • build • collect • create</p></div>
      <div class="q24-world-stats"><span id="q24wDay">DAY 1</span><span id="q24wPos">0,0</span><span id="q24wSave">LOCAL WORLD SAVED</span></div>
    </div>
    <div class="q24-world-stage"><canvas id="q24wCanvas" aria-label="Interactive Quantum World"></canvas><div class="q24-world-help">WASD / arrows to move • drag to look • tap/drag on mobile • double tap to place</div><div class="q24-world-toast" id="q24wToast" role="status"></div></div>
    <div class="q24-world-actions"><button id="q24wBuild" type="button">Build</button><button id="q24wPlant" type="button">Plant</button><button id="q24wCollect" type="button">Collect</button><button id="q24wReset" type="button">New World</button></div>
    <pre id="q24wOutput">World initializing…</pre>
  `;
  const anchor=document.querySelector('#q24-hypermobile-ops')||document.querySelector('#q24-production')||document.body;
  anchor.parentNode.insertBefore(root,anchor);
  const c=document.getElementById('q24wCanvas'),ctx=c.getContext('2d'),toast=document.getElementById('q24wToast'),out=document.getElementById('q24wOutput');
  const KEY='q24-world-v1';
  let state=JSON.parse(localStorage.getItem(KEY)||'null')||{day:1,x:0,y:0,angle:0,items:[],built:0,plants:0,collected:0,last:Date.now()};
  let keys={},drag=false,lastX=0;
  const rand=(x,y)=>{let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
  const save=()=>{state.last=Date.now();localStorage.setItem(KEY,JSON.stringify(state));document.getElementById('q24wSave').textContent='LOCAL WORLD SAVED'};
  const say=t=>{toast.textContent=t;clearTimeout(say.t);say.t=setTimeout(()=>toast.textContent='',1800)};
  function resize(){const d=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,Math.floor(c.clientWidth*d));c.height=Math.max(1,Math.floor(c.clientHeight*d));ctx.setTransform(d,0,0,d,0,0)}
  function project(wx,wy){const s=28,dx=wx-state.x,dy=wy-state.y,ca=Math.cos(state.angle),sa=Math.sin(state.angle),rx=dx*ca-dy*sa,ry=dx*sa+dy*ca;return [c.clientWidth/2+rx*s,c.clientHeight/2+ry*s*.62]}
  function draw(){if(!ctx)return;const w=c.clientWidth,h=c.clientHeight;ctx.clearRect(0,0,w,h);
    const cols=Math.ceil(w/28)+4,rows=Math.ceil(h/22)+4;
    for(let iy=-rows;iy<rows;iy++)for(let ix=-cols;ix<cols;ix++){const p=project(state.x+ix,state.y+iy),wx=Math.floor(state.x)+ix,wy=Math.floor(state.y)+iy;if(p[0]<-40||p[0]>w+40||p[1]<-40||p[1]>h+40)continue;const r=rand(wx,wy),tone=r>.82?'tree':r>.58?'grass':'water';ctx.beginPath();ctx.moveTo(p[0],p[1]-12);ctx.lineTo(p[0]+14,p[1]-3);ctx.lineTo(p[0],p[1]+6);ctx.lineTo(p[0]-14,p[1]-3);ctx.closePath();ctx.globalAlpha=.55;ctx.fillStyle=tone==='water'?'#10263c':tone==='tree'?'#193d2a':'#173027';ctx.fill();ctx.globalAlpha=1;if(tone==='tree'){ctx.beginPath();ctx.arc(p[0],p[1]-12,7,0,Math.PI*2);ctx.fillStyle='#4c8b52';ctx.fill();}}
    state.items.forEach(o=>{const p=project(o.x,o.y);ctx.fillStyle=o.type==='plant'?'#8bcf67':'#d6a85d';ctx.fillRect(p[0]-5,p[1]-15,10,10)});
    const p=project(state.x,state.y);ctx.beginPath();ctx.arc(p[0],p[1]-8,8,0,Math.PI*2);ctx.fillStyle='#e8f7ff';ctx.fill();ctx.strokeStyle='#8be9ff';ctx.stroke();
    document.getElementById('q24wDay').textContent='DAY '+state.day;document.getElementById('q24wPos').textContent=Math.round(state.x)+','+Math.round(state.y);
    requestAnimationFrame(draw);
  }
  function move(dx,dy){const ca=Math.cos(state.angle),sa=Math.sin(state.angle);state.x+=dx*ca-dy*sa;state.y+=dx*sa+dy*ca;save()}
  function place(type){const o={type,x:Math.round(state.x+(Math.random()-.5)*3),y:Math.round(state.y+(Math.random()-.5)*3)};state.items.push(o);if(type==='plant')state.plants++;else state.built++;save();say(type==='plant'?'Garden planted':'Structure built')}
  function collect(){if(state.items.length){state.items.shift();state.collected++;save();say('Resource collected')}else say('Explore to find resources')}
  function reset(){if(confirm('Start a new local Quantum World?')){state={day:1,x:0,y:0,angle:0,items:[],built:0,plants:0,collected:0,last:Date.now()};save();say('New world created')}}
  addEventListener('resize',resize);addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  function tick(){let dx=0,dy=0;if(keys.w||keys.arrowup)dy-=.12;if(keys.s||keys.arrowdown)dy+=.12;if(keys.a||keys.arrowleft)dx-=.12;if(keys.d||keys.arrowright)dx+=.12;if(dx||dy)move(dx,dy);if(Date.now()-state.last>86400000){state.day++;save()}out.textContent=JSON.stringify({world:'Quantum World v1',day:state.day,position:[Math.round(state.x),Math.round(state.y)],built:state.built,plants:state.plants,collected:state.collected,persistence:'localStorage',multiplayer:'ready for authenticated realtime backend',truth:'Client world state is genuinely interactive and locally persistent; no server persistence or multiplayer session is claimed without a configured backend.'},null,2);requestAnimationFrame(tick)}
  c.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX; c.setPointerCapture?.(e.pointerId)});c.addEventListener('pointermove',e=>{if(!drag)return;state.angle+=(e.clientX-lastX)*.01;lastX=e.clientX});c.addEventListener('pointerup',()=>drag=false);c.addEventListener('dblclick',()=>place('build'));
  document.getElementById('q24wBuild').onclick=()=>place('build');document.getElementById('q24wPlant').onclick=()=>place('plant');document.getElementById('q24wCollect').onclick=collect;document.getElementById('q24wReset').onclick=reset;
  resize();draw();tick();
})();