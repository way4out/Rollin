const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||10000,ROOT=__dirname;
const BASE_RPC=process.env.BASE_RPC_URL||'https://mainnet.base.org';
const MERCHANT=(process.env.QUANTUM_MERCHANT||'0x13653b6b8bd4b274da565faf6fa894e3418a6d10').toLowerCase();
const USDC='0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'.toLowerCase();
const products={
'Quantum24 Nano':0.24,'Quantum24 Micro':1,'Quantum24 Starter':5,'Quantum24 Basic':10,
'Quantum24 Mini':12,'Quantum24 Core':19.24,'Quantum24 Genesis':24,'Quantum24 Plus':49,
'Quantum24 Priority':99,'Quantum24 Pro':249,'Quantum24 Business':499,'Quantum24 Enterprise':999,
'Quantum24 Scale':2499,'Quantum24 Quantum':9999,'Quantum24 Apex':24000,'Quantum24 Ultra':99999
};
const quotes=new Map();
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
const send=(r,s,t,b)=>{r.writeHead(s,{'Content-Type':t,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'});r.end(b)};
const json=(r,s,o)=>send(r,s,'application/json; charset=utf-8',JSON.stringify(o));
function body(q){return new Promise((ok,bad)=>{let x='';q.on('data',c=>{if(x.length<20000)x+=c});q.on('end',()=>{try{ok(x?JSON.parse(x):{})}catch(e){bad(e)}})})}
async function rpc(method,params=[]){const z=await fetch(BASE_RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});const j=await z.json();if(j.error)throw Error(j.error.message||'Base RPC error');return j.result}
function bi(x){return BigInt(x||'0x0')}
async function ethPrice(){const z=await fetch('https://api.coinbase.com/v2/exchange-rates/ETH?currency=USD');const j=await z.json();const p=Number(j?.data?.rates?.ETH);if(!p||!Number.isFinite(p))throw Error('ETH price unavailable');return p}
async function createIntent(product){
 const usd=products[product]; if(!usd)return null;
 const price=await ethPrice(); const ethWei=BigInt(Math.ceil((usd/price)*1e18));
 const id='Q24-'+crypto.randomBytes(12).toString('hex');
 quotes.set(id,{product,usd,ethWei,created:Date.now()});
 for(const [k,v] of quotes)if(Date.now()-v.created>15*60*1000)quotes.delete(k);
 return {id,product,amountUsd:usd,ethWei:'0x'+ethWei.toString(16),ethPriceUsd:price,network:'base',merchant:MERCHANT};
}
async function verifyPayment(b){
 const tx=String(b.txHash||''); if(!/^0x[a-fA-F0-9]{64}$/.test(tx))return {ok:false,error:'invalid_tx_hash'};
 const rec=await rpc('eth_getTransactionReceipt',[tx]); if(!rec)return {ok:true,confirmed:false,status:'pending'};
 if(rec.status!=='0x1')return {ok:false,confirmed:true,status:'reverted'};
 const q=quotes.get(String(b.intentId||'')); if(!q)return {ok:false,confirmed:true,status:'unknown_or_expired_intent'};
 const token=String(b.token||'USDC').toUpperCase();
 if(token==='USDC'){
  const topic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a7f5c5a4d1';
  const want=BigInt(Math.round(q.usd*1e6));
  const logs=(rec.logs||[]).filter(l=>String(l.address).toLowerCase()===USDC&&String(l.topics?.[0]).toLowerCase()===topic);
  const match=logs.some(l=>String(l.topics?.[1]||'').toLowerCase().endsWith(String(b.from||'').replace(/^0x/,'').toLowerCase())&&String(l.topics?.[2]||'').toLowerCase().endsWith(MERCHANT.slice(2))&&bi(l.data)>=want);
  if(!match)return {ok:false,confirmed:true,status:'confirmed_wrong_payment'};
  return {ok:true,confirmed:true,status:'paid',txHash:tx,product:q.product,token,amountUsd:q.usd,explorer:'https://basescan.org/tx/'+tx};
 }
 if(token!=='ETH')return {ok:false,confirmed:true,status:'unsupported_token'};
 const tr=await rpc('eth_getTransactionByHash',[tx]);
 if(!tr||String(tr.from||'').toLowerCase()!==String(b.from||'').toLowerCase()||String(tr.to||'').toLowerCase()!==MERCHANT)return {ok:false,confirmed:true,status:'confirmed_wrong_recipient'};
 if(bi(tr.value)!==q.ethWei)return {ok:false,confirmed:true,status:'confirmed_wrong_amount'};
 return {ok:true,confirmed:true,status:'paid',txHash:tx,product:q.product,token:'ETH',amountUsd:q.usd,explorer:'https://basescan.org/tx/'+tx};
}
http.createServer(async(q,r)=>{try{
 if(q.url==='/api/health')return json(r,200,{ok:true,service:'quantum24-gains',network:'base',time:new Date().toISOString(),pricePoints:Object.keys(products).length});
 if(q.url==='/api/config')return json(r,200,{ok:true,network:'base',merchant:MERCHANT,usdc:USDC,bankrApiConfigured:Boolean(process.env.BANKR_API_KEY),directOnchainPayments:true,pricePoints:products});
 if(q.url==='/api/eth-price')return json(r,200,{ok:true,usd:await ethPrice()});
 if(q.url==='/api/intent'&&q.method==='POST'){const b=await body(q);const x=await createIntent(String(b.product||''));if(!x)return json(r,400,{ok:false,error:'unknown_product'});return json(r,201,{ok:true,status:'ready',...x,message:'Ready for wallet approval; no funds moved.'})}
 if(q.url==='/api/verify'&&q.method==='POST')return json(r,200,await verifyPayment(await body(q)));
 if(q.method==='GET'){let p=new URL(q.url,'http://localhost').pathname;if(p==='/')p='/index.html';const f=path.normalize(path.join(ROOT,p));if(!f.startsWith(ROOT))return send(r,403,'text/plain','Forbidden');return fs.readFile(f,(e,d)=>e?send(r,404,'text/plain','Quantum24 page not found'):send(r,200,mime[path.extname(f)]||'application/octet-stream',d))}
 return json(r,404,{ok:false,error:'not_found'});
}catch(e){return json(r,500,{ok:false,error:'server_error',message:e.message})}}).listen(PORT,'0.0.0.0',()=>console.log('Quantum24 listening on '+PORT));