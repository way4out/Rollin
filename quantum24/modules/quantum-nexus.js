/* Quantum24 Nexus — high-tech browser game v1 */
(()=>{const root=document.getElementById('q24-nexus');if(!root)return;
const c=document.getElementById('q24-nexus-canvas'),x=c.getContext('2d');const hud={lvl:document.getElementById('qn-level'),xp:document.getElementById('qn-xp'),energy:document.getElementById('qn-energy'),score:document.getElementById('qn-score'),scan:document.getElementById('qn-scan-state'),mission:document.getElementById('qn-mission')};
let W=0,H=0,dpr=1,last=performance.now(),keys={},touch={x:0,y:0,active:false},state=JSON.parse(localStorage.getItem('q24-nexus-v1')||'null')||{x:0,y:0,z:0,energy:100,xp:0,level:1,score:0,crystals:0,mission:0,pulses:0};
let stars=Array.from({length:180},()=>({x:Math.random()*2-1,y:Math.random()*2-1,z:Math.random(),s:Math.random()*2+0.4}));let nodes=[];
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=c.clientWidth;H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function save(){localStorage.setItem('q24-nexus-v1',JSON.stringify(state))}
function addNode(){let a=Math.random()*Math.PI*2,r=500+Math.random()*1500;nodes.push({x:state.x+Math.cos(a)*r,y:state.y+Math.sin(a)*r,z:Math.random()*700+100,e:Math.random()>0.45?'crystal':'drone',hit:0})}
for(let i=0;i<18;i++)addNode();
function project(wx,wy,wz){let dx=wx-state.x,dy=wy-state.y,dist=Math.hypot(dx,dy)+1;let scale=360/dist;return [W/2+dx*scale,H/2+dy*scale*.55-wz*.12,scale]}
function pulse(){if(state.energy<18)return;state.energy-=18;state.pulses++;state.score+=250;nodes.forEach(n=>{if(Math.hypot(n.x-state.x,n.y-state.y)<650)n.hit=1});state.xp+=40;level();save()}
function level(){let need=state.level*250;if(state.xp>=need){state.xp-=need;state.level++;state.energy=100;state.score+=1000}}
function scan(){hud.scan.textContent='455/455 • CONSENSUS SWEEP';hud.scan.classList.add('qn-hot');setTimeout(()=>hud.scan.classList.remove('qn-hot'),900)}
function update(dt){let ax=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),ay=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);if(touch.active){ax=touch.x;ay=touch.y}let m=Math.hypot(ax,ay)||1,s=260+(keys.shift?180:0);state.x+=ax/m*s*dt;state.y+=ay/m*s*dt;state.energy=Math.min(100,state.energy+dt*3);
nodes.forEach(n=>{n.hit=Math.max(0,n.hit-dt);if(Math.hypot(n.x-state.x,n.y-state.y)<75&&n.e==='crystal'){n.e='taken';state.crystals++;state.xp+=60;state.score+=100;level()}});
nodes=nodes.filter(n=>n.e!=='taken');while(nodes.length<18)addNode();if(state.mission<5&&state.crystals>=state.mission+1)state.mission++;save()}
function draw(){x.clearRect(0,0,W,H);let g=x.createRadialGradient(W/2,H*.45,0,W/2,H*.45,Math.max(W,H)*.8);g.addColorStop(0,'#122642');g.addColorStop(.55,'#050914');g.addColorStop(1,'#02040a');x.fillStyle=g;x.fillRect(0,0,W,H);
stars.forEach(s=>{s.z-=.004;if(s.z<.02)s.z=1;let px=(s.x/s.z)*W*.45+W/2,py=(s.y/s.z)*H*.45+H/2;if(px<0||px>W||py<0||py>H)return;x.fillStyle='rgba(120,220,255,'+(1-s.z)+')';x.fillRect(px,py,s.s*(1-s.z)*2,s.s*(1-s.z)*2)});
/* quantum horizon */
x.save();x.translate(W/2,H*.63);x.strokeStyle='rgba(80,210,255,.13)';x.lineWidth=1;for(let i=1;i<18;i++){let yy=i*i*3; x.beginPath();x.moveTo(-W,yy);x.lineTo(W,yy);x.stroke()}for(let i=-12;i<=12;i++){x.beginPath();x.moveTo(i*70,0);x.lineTo(i*160,500);x.stroke()}x.restore();
nodes.forEach(n=>{let p=project(n.x,n.y,n.z);if(p[2]<.03)return;let r=Math.max(3,18*p[2]);x.beginPath();x.arc(p[0],p[1],r,0,Math.PI*2);x.fillStyle=n.hit?'#fff':'#62e8ff';x.shadowBlur=22;x.shadowColor='#62e8ff';x.fill();x.shadowBlur=0});
/* ship */
x.save();x.translate(W/2,H/2);let glow=x.createRadialGradient(0,0,3,0,0,90);glow.addColorStop(0,'rgba(98,232,255,.35)');glow.addColorStop(1,'transparent');x.fillStyle=glow;x.beginPath();x.arc(0,0,90,0,Math.PI*2);x.fill();x.strokeStyle='#7df2ff';x.lineWidth=2;x.beginPath();x.moveTo(0,-30);x.lineTo(24,24);x.lineTo(0,14);x.lineTo(-24,24);x.closePath();x.stroke();x.fillStyle='#a78bfa';x.fill();x.restore();
hud.lvl.textContent='LVL '+state.level;hud.xp.textContent=state.xp+'/'+(state.level*250)+' XP';hud.energy.textContent=Math.round(state.energy)+'%';hud.score.textContent=state.score.toLocaleString();hud.mission.textContent=state.mission<5?'MISSION '+(state.mission+1)+': FIND QUANTUM NODE':'MISSION COMPLETE • FREE EXPEDITION'}
requestAnimationFrame(loop)}
function loop(t){let dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw()}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault();if(e.key===' ')pulse();if(e.key.toLowerCase()==='q')scan()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function bind(id,fn){document.getElementById(id)?.addEventListener('click',fn)}bind('qn-pulse',pulse);bind('qn-scan',scan);bind('qn-reset',()=>{localStorage.removeItem('q24-nexus-v1');location.reload()});
const pad=document.getElementById('qn-pad');pad?.addEventListener('pointermove',e=>{let r=pad.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2),m=Math.hypot(dx,dy)||1;touch={x:Math.max(-1,Math.min(1,dx/m)),y:Math.max(-1,Math.min(1,dy/m)),active:true}});pad?.addEventListener('pointerdown',()=>touch.active=true);pad?.addEventListener('pointerup',()=>touch.active=false);pad?.addEventListener('pointerleave',()=>touch.active=false);
scan();loop(performance.now());
})();