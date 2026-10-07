const http=require('http'),crypto=require('crypto');

const MAIN=process.env.Q24_MAIN_URL||'https://quantum24-gains.onrender.com';
const BANKR='https://api.bankr.bot';
const PORT=process.env.PORT||10000;
const CHAIN=8453;
const MERCHANT=(process.env.Q24_MERCHANT||'0x13653b6b8bd4b274da565faf6fa894e3418a6d10').toLowerCase();
const USDC='0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const EXEC_ENABLED=process.env.BANKR_AUTOMATION_ENABLED==='true';
const MAX_USD=Number(process.env.BANKR_MAX_AUTOMATION_USD||'0');
const EXEC_SECRET=process.env.Q24_EXECUTION_SECRET||'';
const cache={last:null,lastRun:0,runs:0};

function qhash(x){return crypto.createHash('sha256').update(String(x)).digest('hex')}
async function get(path,timeout=8000){
  const z=await fetch(MAIN+path,{headers:{Accept:'application/json','User-Agent':'Quantum24-MaxQ/1.0'},signal:AbortSignal.timeout(timeout)});
  const body=await z.text(); let data; try{data=JSON.parse(body)}catch{data={raw:body.slice(0,1000)}}
  return {ok:z.ok,status:z.status,data};
}
async function bankr(path,method='GET',body){
  if(!process.env.BANKR_API_KEY)throw new Error('bankr_api_key_required');
  const z=await fetch(BANKR+path,{method,headers:{'X-API-Key':process.env.BANKR_API_KEY,'Content-Type':'application/json','Accept':'application/json','User-Agent':'Quantum24-MaxQ/1.0'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
  const data=await z.json().catch(()=>({}));
  if(!z.ok)throw new Error(String(data.error||data.message||('bankr_http_'+z.status)));
  return data;
}
async function scan(){
  const started=Date.now();
  const paths=[
    ['/api/qscan?cursor=0&limit=256','qscan'],
    ['/api/research/scan','research'],
    ['/api/evidence/scan','evidence'],
    ['/api/qcore/verify','qcore'],
    ['/api/quantum/max-upgrade','architecture'],
    ['/api/infrastructure/adapters','adapters'],
    ['/api/infrastructure/settlement/status','settlement'],
    ['/api/qstats/live','qstats'],
    ['/api/live','baseLive'],
    ['/api/payments/status','payments'],
    ['/api/satcom-plus/status','satcom'],
    ['/api/radio/status','radio'],
    ['/api/device-integration/status','devices'],
    ['/api/expansion/status','expansion']
  ];
  const results={};
  for(const [p,k] of paths){try{results[k]=await get(p)}catch(e){results[k]={ok:false,error:e.name||'fetch_error'}}}
  const qscan=results.qscan?.data, qcore=results.qcore?.data, evidence=results.evidence?.data;
  const bankrConfigured=Boolean(process.env.BANKR_API_KEY);
  let bankrRead={state:bankrConfigured?'PENDING':'AUTH_REQUIRED'};
  if(bankrConfigured){try{const d=await bankr('/wallet/me');bankrRead={state:'VERIFIED',wallets:d.wallets||[],qhash:qhash(JSON.stringify(d))}}catch(e){bankrRead={state:'AUTH_ERROR',error:e.message}}}
  const states={
    qscan:qscan?.ok?'VERIFIED':'BLOCKED',
    qverify:qscan?.ok?'READY':'BLOCKED',
    research:results.research?.ok?'VERIFIED':'BLOCKED',
    evidence:evidence?.state||'EVIDENCE_REQUIRED',
    providerTelemetry:evidence?.chain?.evidence?.find(x=>x.step==='authenticated_measurement')?.state||'EVIDENCE_REQUIRED',
    economicOptimizer:results.architecture?.ok?'VERIFIED':'BLOCKED',
    authorizedAction:EXEC_ENABLED&&bankrConfigured?'ARMED':'BLOCKED',
    payment:bankrRead.state==='VERIFIED'?'AUTHORIZED':'BLOCKED',
    settlement:'EVIDENCE_REQUIRED',
    qhashReceipt:'VERIFIED',
    continuousRescan:'ACTIVE'
  };
  const chain={order:['qscan','qverify','research','evidence','providerTelemetry','economicOptimizer','authorizedAction','payment','settlement','qhashReceipt','continuousRescan'],states,bankr:bankrRead,physicalExecution:'FAIL_CLOSED',truth:'Only independently verified provider/chain receipts can advance a stage to LIVE.'};
  chain.qhash=qhash(JSON.stringify(chain));
  const out={ok:true,service:'quantum24-maximized-q',main:MAIN,merchant:MERCHANT,baseChainId:CHAIN,generatedAt:new Date().toISOString(),durationMs:Date.now()-started,chain,results:results};
  cache.last=out;cache.lastRun=Date.now();cache.runs++;
  return out;
}
async function executeTransfer(body,headers){
  if(!EXEC_ENABLED)return {ok:false,status:403,error:'automation_disabled'};
  if(!EXEC_SECRET||headers['x-q24-execution-secret']!==EXEC_SECRET)return {ok:false,status:401,error:'execution_authorization_required'};
  if(!process.env.BANKR_API_KEY)return {ok:false,status:503,error:'bankr_api_key_required'};
  const amount=String(body.amount||'');
  const amountUsd=Number(body.amountUsd||amount);
  const to=String(body.recipientAddress||'').toLowerCase();
  const token=String(body.token||'USDC').toUpperCase();
  if(!/^0x[a-f0-9]{40}$/.test(to))return {ok:false,status:400,error:'invalid_recipient'};
  if(to===MERCHANT)return {ok:false,status:400,error:'self_transfer_not_allowed'};
  if(!Number.isFinite(amountUsd)||amountUsd<=0||!(MAX_USD>0)||amountUsd>MAX_USD)return {ok:false,status:403,error:'automation_limit_exceeded',maxUsd:MAX_USD};
  if(!['USDC','ETH'].includes(token))return {ok:false,status:400,error:'asset_not_allowlisted'};
  const tokenAddress=token==='USDC'?USDC:'0x0000000000000000000000000000000000000000';
  const intent={chainId:CHAIN,merchant:MERCHANT,recipientAddress:to,token,amount,amountUsd,operationId:String(headers['x-operation-id']||'Q24-'+crypto.randomUUID())};
  intent.qhash=qhash(JSON.stringify(intent));
  const pre=await scan();
  const allowed=pre.chain.states.authorizedAction==='ARMED'&&pre.chain.states.payment==='AUTHORIZED';
  if(!allowed)return {ok:false,status:403,error:'maximized_q_gate_blocked',intentQHash:intent.qhash,chain:pre.chain};
  const result=await bankr('/wallet/transfer','POST',{tokenAddress,recipientAddress:to,amount,isNativeToken:token==='ETH',chain:'base'});
  const receipt={ok:true,status:'submitted',execution:'BANKR_WALLET_API',chainId:CHAIN,recipientAddress:to,token,amount,amountUsd,intentQHash:intent.qhash,bankr:result,qhash:qhash(JSON.stringify({intent,result}))};
  return receipt;
}
function send(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Strict-Transport-Security':'max-age=31536000; includeSubDomains'});res.end(JSON.stringify(obj))}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>20000){req.destroy();reject(new Error('body_too_large'))}});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});req.on('error',reject)})}
const server=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,'http://localhost');
    if(req.method==='GET'&&u.pathname==='/health')return send(res,200,{ok:true,service:'quantum24-maximized-q',status:'LIVE SOFTWARE',main:MAIN,bankrConfigured:Boolean(process.env.BANKR_API_KEY),automationEnabled:EXEC_ENABLED,maxAutomationUsd:MAX_USD});
    if(req.method==='GET'&&u.pathname==='/api/maximized-q/scan')return send(res,200,cache.last&&Date.now()-cache.lastRun<55000?cache.last:await scan());
    if(req.method==='POST'&&u.pathname==='/api/maximized-q/scan')return send(res,200,await scan());
    if(req.method==='POST'&&u.pathname==='/api/maximized-q/bankr/transfer'){try{return send(res,200,await executeTransfer(await body(req),req.headers))}catch(e){return send(res,502,{ok:false,status:502,error:e.message||'bankr_execution_failed'})}}
    if(req.method==='GET'&&u.pathname==='/api/maximized-q/status'){const s=cache.last||await scan();return send(res,200,{ok:true,chain:s.chain,lastRun:cache.lastRun||null,runs:cache.runs,automation:{enabled:EXEC_ENABLED,maxUsd:MAX_USD,bankrConfigured:Boolean(process.env.BANKR_API_KEY),secretConfigured:Boolean(EXEC_SECRET)},truth:'LIVE SOFTWARE is not the same as verified external execution.'})}
    return send(res,404,{ok:false,error:'not_found'});
  }catch(e){return send(res,500,{ok:false,error:'server_error'})}
});
server.listen(PORT,'0.0.0.0',()=>{console.log('Quantum24 Maximized-Q listening on '+PORT);scan().catch(()=>{})});
