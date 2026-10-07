const crypto=require('crypto');
const DOMAINS=['carrier','satellite','broadcast','hardware','energy','financial','onchain'];
function hash(v){return crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');}
function status(env=process.env){
  const configured={
    carrier:Boolean(env.CARRIER_PROVIDER_URL&&env.CARRIER_PROVIDER_TOKEN),
    satellite:Boolean(env.SATCOM_PROVIDER_URL&&env.SATCOM_API_KEY),
    broadcast:Boolean(env.BROADCAST_PROVIDER_URL&&env.BROADCAST_PROVIDER_TOKEN),
    hardware:Boolean(env.HARDWARE_GATE_URL&&env.HARDWARE_GATE_TOKEN),
    energy:Boolean(env.ENERGY_GATE_URL&&env.ENERGY_GATE_HMAC_SECRET),
    financial:Boolean(env.BANKR_API_KEY),
    onchain:Boolean(env.BASE_RPC_URL||env.BASE_RPC_URLS)
  };
  return {
    ok:true,version:'Q24-REALITY-BRIDGE-v1',
    domains:DOMAINS.map(id=>({id,software:'LIVE',state:configured[id]?'CONNECTED_PENDING_VERIFICATION':'AUTH_REQUIRED',configured:configured[id],execution:'authorization-and-evidence-gated'})),
    lifecycle:['SIMULATED','DESIGNED','CONNECTED','DEPLOYED','VERIFIED'],
    policy:{noPhysicalClaimWithoutEvidence:true,noRfTransmitWithoutAuthorizedHardware:true,noCarrierActionWithoutProviderEvidence:true,noSatelliteActionWithoutProviderEvidence:true,noBroadcastActionWithoutProviderEvidence:true,noHardwareActuationWithoutDeviceEvidence:true,noFinancialWriteWithoutExplicitAuthorization:true,onchainReadVerification:true},
    qhash:hash(JSON.stringify(configured))
  };
}
module.exports={status,hash};
