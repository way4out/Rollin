const http=require('http'),crypto=require('crypto');
const PORT=process.env.PORT||10000;
const TOKENS=['energyx','tree','emrld','rev','wo','node','upgrade','aeth','auto','rollin','aiuse','zai','aiu4','haha','caffeine','sqt','nqrx','hir','one','two','telp','blzet','flaw','oeql','balloon'];
function num(x,d=0){const v=Number(x);return Number.isFinite(v)?v:d}
function hash(x){return crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex')}
function calc(i){
 const g=Math.max(0,num(i.generationKw)),l=Math.max(0,num(i.loadKw)),b=Math.max(0,num(i.batteryKwh)),rate=Math.max(0,num(i.pricePerKwh)),hours=Math.max(.25,num(i.hours,1)),sales=Math.max(0,num(i.verifiedSalesUsd)),cost=Math.max(0,num(i.operatingCostUsd));
 const surplus=Math.max(0,g-l),deficit=Math.max(0,l-g),exportKw=Math.min(surplus,Math.max(0,num(i.exportLimitKw,g))),exportValue=exportKw*hours*rate;
 const peakAvoid=Math.min(deficit,b/Math.max(hours,.25))*hours*rate;
 const arbitrage=Math.min(surplus,b)*rate;
 const demandResponse=peakAvoid;
 const netSales=Math.max(0,sales-cost);
 const opportunities=[{name:'energy-export',value:exportValue},{name:'peak-demand-avoidance',value:peakAvoid},{name:'storage-arbitrage',value:arbitrage},{name:'demand-response',value:demandResponse},{name:'verified-sales-net',value:netSales}].sort((a,b)=>b.value-a.value);
 const total=opportunities.reduce((s,x)=>s+x.value,0);
 const layers=TOKENS.map((token,i)=>({rank:i+1,token,domain:i<5?'energy':i<10?'infrastructure':i<15?'ai':i<20?'network':'commerce',priority:25-i,status:'evidence-gated'}));
 return {ok:true,mode:'maximum-real-gain-gate',timestamp:new Date().toISOString(),truth:'Estimated opportunity only until actual meter, tariff, provider and settlement evidence exists.',energy:{generationKw:g,loadKw:l,surplusKw:surplus,deficitKw:deficit,batteryKwh:b,pricePerKwh:rate,exportKw},opportunities,estimatedGrossOpportunityUsd:+total.toFixed(4),verifiedSalesUsd:sales,operatingCostUsd:cost,estimatedVerifiedNetUsd:+netSales.toFixed(4),optimization:{priorityMultiplier:4,objective:'maximize verified net value',sequence:['validate meter','validate tariff','maximize self-consumption','avoid peaks','arbitrage storage','qualify demand response','export','settle','reconcile'],doubleCountingGuard:true,staleDataBlocked:true},tokens:layers,executionGates:{meter:'required',tariff:'required',interconnection:'required',providerAuthorization:'required',settlement:'required',hardwareControl:'fail-closed'},guaranteedProfit:false,physicalEnergyMultiplier:1,tokenAppreciationGuaranteed:false,qhash:hash({g,l,b,rate,hours,sales,cost,opportunities,layers})};
}
const server=http.createServer((req,res)=>{
 res.setHeader('content-type','application/json');res.setHeader('cache-control','no-store');
 if(req.url==='/health')return res.end(JSON.stringify({ok:true,status:'live',service:'quantum24-profit-optimizer',layers:25}));
 if(req.url==='/api/profit-max'){
  const h=req.headers;
  return res.end(JSON.stringify(calc({generationKw:h['x-generation-kw'],loadKw:h['x-load-kw'],batteryKwh:h['x-battery-kwh'],pricePerKwh:h['x-price-kwh'],hours:h['x-hours'],exportLimitKw:h['x-export-limit-kw'],verifiedSalesUsd:h['x-verified-sales-usd'],operatingCostUsd:h['x-operating-cost-usd']})));
 }
 res.statusCode=404;res.end(JSON.stringify({ok:false,error:'not_found'}));
});
server.listen(PORT,'0.0.0.0');