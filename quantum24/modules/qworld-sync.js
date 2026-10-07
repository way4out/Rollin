const crypto=require('crypto');
const players=new Map(),events=[];
function player(id){if(!players.has(id))players.set(id,{id,x:50,y:50,xp:0,energy:100,discoveries:0,updatedAt:Date.now()});return players.get(id)}
function state(id){return {ok:true,version:'qworld-v1',status:'CONNECTED',truth:'server-state',player:{...player(id)},players:[...players.values()].slice(-32).map(p=>({id:p.id,x:p.x,y:p.y,xp:p.xp,discoveries:p.discoveries})),events:events.slice(-25),serverTime:new Date().toISOString()}}
function action(id,a){const p=player(id);a=a||{};if(a.type==='move'){p.x=Math.max(5,Math.min(95,p.x+(Math.max(-5,Math.min(5,Number(a.dx)||0)))));p.y=Math.max(8,Math.min(92,p.y+(Math.max(-5,Math.min(5,Number(a.dy)||0)))));p.energy=Math.max(0,p.energy-1)}else if(a.type==='collect'){p.xp+=25;p.discoveries++;p.energy=Math.min(100,p.energy+20)}else if(a.type==='quest'){events.push({id:crypto.randomUUID(),type:'quest',player:id,text:'Locate and collect a Quantum node.',at:new Date().toISOString()})}else if(a.type!=='ping')return {ok:false,error:'unsupported_action'};p.updatedAt=Date.now();return state(id)}
module.exports={state,action};
