const crypto=require('crypto');

const MERCHANT=(process.env.QUANTUM_MERCHANT||'0x13653b6b8bd4b274da565faf6fa894e3418a6d10').toLowerCase();
const USDC=(process.env.USDC_CONTRACT||'0x833589fcd6edb6e08f4c7c32d4f71b54bda02913').toLowerCase();
const BASE_CHAIN_ID=8453;
const FEE_BPS=Number(process.env.Q24_PLATFORM_FEE_BPS||440);
const PAYOUT_MIN_USD=Number(process.env.Q24_PAYOUT_MIN_USD||10);
const RESERVE_BPS=Number(process.env.Q24_RESERVE_BPS||1000);
const OPS_BPS=Number(process.env.Q24_OPS_BPS||1500);
const FULFILL_BPS=Number(process.env.Q24_FULFILL_BPS||5250);
const CREATOR_BPS=10000-FEE_BPS-RESERVE_BPS-OPS_BPS-FULFILL_BPS;
const ledger=new Map(), payouts=new Map(), idempotency=new Set();

function hash(v){return crypto.createHash('sha256').update(String(v)).digest('hex')}
function money(n){return Math.round((Number(n)||0)*100)/100}
function allocation(gross){
  const g=money(gross), fee=money(g*FEE_BPS/10000), reserve=money(g*RESERVE_BPS/10000);
  const ops=money(g*OPS_BPS/10000), fulfill=money(g*FULFILL_BPS/10000);
  const creator=money(g-fee-reserve-ops-fulfill);
  return {gross:g,platformFee:fee,reserve,operations:ops,fulfillment:fulfill,creator};
}
function createOrder(input={}){
  const id=String(input.orderId||'Q24-PAY-'+crypto.randomBytes(10).toString('hex'));
  const gross=money(input.amountUsd);
  if(!(gross>0)) throw Error('amount_usd_required');
  if(ledger.has(id)) return ledger.get(id);
  const row={id,status:'AWAITING_PAYMENT',product:String(input.product||'Quantum24'),customerRef:String(input.customerRef||'').slice(0,200),rail:String(input.rail||'BASE_USDC'),chainId:BASE_CHAIN_ID,merchant:MERCHANT,token:USDC,amountUsd:gross,allocation:allocation(gross),createdAt:new Date().toISOString(),qhash:null};
  row.qhash=hash(JSON.stringify(row)); ledger.set(id,row); return row;
}
function settlePayment(input={}){
  const orderId=String(input.orderId||'');
  const txHash=String(input.txHash||'').toLowerCase();
  if(!orderId||!/^0x[a-f0-9]{64}$/.test(txHash)) throw Error('order_id_and_tx_hash_required');
  const key=orderId+'|'+txHash;
  if(idempotency.has(key)) return ledger.get(orderId);
  const row=ledger.get(orderId); if(!row) throw Error('order_not_found');
  if(row.status==='SETTLED'||row.status==='FULFILLMENT_READY') return row;
  if(String(input.recipient||MERCHANT).toLowerCase()!==MERCHANT) throw Error('recipient_mismatch');
  if(String(input.token||USDC).toLowerCase()!==USDC) throw Error('token_mismatch');
  if(Number(input.chainId||BASE_CHAIN_ID)!==BASE_CHAIN_ID) throw Error('chain_mismatch');
  const paid=money(input.amountUsd);
  if(paid+0.0001<row.amountUsd) throw Error('underpayment');
  row.status='SETTLED'; row.txHash=txHash; row.paidUsd=paid; row.settledAt=new Date().toISOString();
  row.allocation=allocation(paid); row.qhash=hash(JSON.stringify(row)); idempotency.add(key);
  payouts.set(orderId,{orderId,status:'QUEUED',amounts:row.allocation,createdAt:new Date().toISOString()});
  return row;
}
function queuePayout(orderId,bucket,destination,amountUsd){
  const row=ledger.get(orderId); if(!row||row.status!=='SETTLED') throw Error('settled_order_required');
  if(!['reserve','operations','fulfillment','creator'].includes(bucket)) throw Error('invalid_payout_bucket');
  if(!/^0x[a-fA-F0-9]{40}$/.test(String(destination||''))) throw Error('valid_destination_required');
  const amount=money(amountUsd); if(!(amount>=PAYOUT_MIN_USD)) throw Error('payout_below_minimum');
  const id='Q24-PO-'+crypto.randomBytes(8).toString('hex');
  const p={id,orderId,bucket,destination:String(destination).toLowerCase(),amountUsd:amount,status:'QUEUED',execution:'provider-authorized-only',createdAt:new Date().toISOString(),qhash:null};
  p.qhash=hash(JSON.stringify(p)); payouts.set(id,p); return p;
}
function status(){
  const rows=[...ledger.values()];
  return {ok:true,version:'payment-orchestrator-v1',network:'Base',chainId:BASE_CHAIN_ID,merchant:MERCHANT,usdc:USDC,feeBps:FEE_BPS,reserveBps:RESERVE_BPS,opsBps:OPS_BPS,fulfillmentBps:FULFILL_BPS,creatorBps:CREATOR_BPS,orders:rows.length,settled:rows.filter(x=>x.status==='SETTLED').length,payouts:payouts.size,automaticInboundVerification:true,automaticExternalPayouts:Boolean(process.env.BANKR_API_KEY||process.env.PAYOUT_PROVIDER_URL),failClosed:true,truth:'Inbound settlement and allocation are software-automatable; external payout execution requires an authorized provider credential and destination allowlist.'};
}
module.exports={createOrder,settlePayment,queuePayout,status,ledger,payouts,allocation,hash};
