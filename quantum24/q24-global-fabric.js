(()=>{
  const player=localStorage.getItem('q24-player-id')||('guest-'+(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)));
  localStorage.setItem('q24-player-id',player);
  let socket=null,retry=500,closed=false;
  function connect(){if(closed||socket)return;const proto=location.protocol==='https:'?'wss':'ws';try{socket=new WebSocket(proto+'://'+location.host+'/ws');socket.onopen=()=>{retry=500;window.Quantum24QHash?.record('global_ws_connected',{player});heartbeat()};socket.onmessage=e=>{try{const m=JSON.parse(e.data);window.dispatchEvent(new CustomEvent('q24:global',{detail:m}))}catch{}};socket.onclose=()=>{socket=null;if(!closed){setTimeout(connect,retry);retry=Math.min(15000,retry*2)}};socket.onerror=()=>{try{socket?.close()}catch{}}}catch{socket=null;setTimeout(connect,retry)}}
  async function heartbeat(){try{await fetch('/api/global-heartbeat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({player,deviceId:localStorage.getItem('q24:device-id')||'',locale:navigator.language||'en-US',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'})})}catch{}}
  window.Q24Global={player,send(type,data={}){const m=JSON.stringify({player,type,data});if(socket?.readyState===1)socket.send(m);else localStorage.setItem('q24:pending-global',m)},heartbeat,connected:()=>socket?.readyState===1};
  window.addEventListener('online',()=>{connect();heartbeat()});window.addEventListener('beforeunload',()=>{closed=true;try{socket?.close()}catch{}});connect();heartbeat();setInterval(()=>{if(!socket)connect();heartbeat()},30000);
})();
