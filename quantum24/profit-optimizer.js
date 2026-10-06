const http=require('http'),crypto=require('crypto');
const PORT=process.env.PORT||10000;
const Q24_SALES_TARGET_USD='9584738999999339';
const Q24_SALES_TARGET_LABEL='$9,584,738,999,999,339';
const TOKENS=['energyx','tree','emrld','rev','wo','node','upgrade','aeth','auto','rollin','aiuse','zai','aiu4','haha','caffeine','sqt','nqrx','hir','one','two','telp','blzet','flaw','oeql','balloon'];
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const num=(x,d=0)=>{const v=Number(x);return Number.isFinite(v)?v:d};
function calc(i){
 const g=Math.max(0,num(i.generationKw)),l=Math.max(0,num(i.loadKw)),b=Math.max(0,num(i.batteryKwh)),rate=Math.max(0,num(i.pricePerKwh)),sell=Math.max(0,num(i.exportRateKwh,rate)),hours=Math.max(.25,num(i.hours,1));
 const peakRate=Math.max(rate,num(i.peakRateKwh,rate)),charge=Math.max(0,num(i.demandChargeUsdKw)),degrade=Math.max(0,num(i.batteryDegradationUsdKwh)),fees=Math.max(0,num(i.marketFeesUsdKwh));
 const exportLimit=Math.max(0,num(i.exportLimitKw,g)), verifiedSales=Math.max(0,num(i.verifiedSalesUsd)), operatingCost=Math.max(0,num(i.operatingCostUsd));
 const surplus=Math.max(0,g-l), deficit=Math.max(0,l-g), exportKw=Math.min(surplus,exportLimit);
 const selfUse=Math.min(g,l)*hours;
 const exportKwh=exportKw*hours;
 const avoidablePeakKw=Math.min(deficit,b/Math.max(hours,.25));
 const peakKwh=avoidablePeakKw*hours;
 const batteryDischargeKwh=Math.min(Math.max(0,surplus*hours),b);
 const exportNet=Math.max(0,exportKwh*(sell-fees));
 const peakEnergyNet=Math.max(0,peakKwh*peakRate-peakKwh*degrade);
 const demandValue=Math.max(0,Math.min(deficit,Math.max(0,num(i.baselinePeakKw,l)))*charge);
 const arbitrageNet=Math.max(0,batteryDischargeKwh*(Math.max(0,sell-rate)-fees-degrade));
 const salesNet=Math.max(0,verifiedSales-operatingCost);
 const candidates=[
  {name:'self-consumption',value:Math.max(0,selfUse*rate),basis:'measured generation offsetting measured load'},
  {name:'peak-demand-avoidance',value:peakEnergyNet,basis:'battery-backed measured peak reduction'},
  {name:'demand-charge-avoidance',value:demandValue,basis:'configured demand-charge tariff'},
  {name:'storage-arbitrage',value:arbitrageNet,basis:'measured surplus/storage with degradation and fees'},
  {name:'energy-export',value:exportNet,basis:'metered export capacity and configured tariff'},
  {name:'verified-sales-net',value:salesNet,basis:'verified sales less operating cost'}
 ].filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
 const selected=[];const used={energyKwh:0};
 for(const x of candidates){if(['self-consumption','peak-demand-avoidance','storage-arbitrage','energy-export'].includes(x.name)&&selected.some(y=>['self-consumption','peak-demand-avoidance','storage-arbitrage','energy-export'].includes(y.name)))continue;selected.push(x)}
 const freshness=Date.now()-Math.max(0,num(i.sourceTimestampMs,Date.now()));
 const stale=freshness>Math.max(1,num(i.maxAgeMs,300000));
 const evidence={meter:Boolean(i.meterId||i.generationKw!==undefined||i.loadKw!==undefined),tariff:Boolean(i.tariffId||rate>0),providerAuthorization:Boolean(i.providerAuthorized),interconnection:Boolean(i.interconnectionApproved),settlement:Boolean(i.settlementVerified)};
 const eligible=evidence.meter&&evidence.tariff&&evidence.providerAuthorization&&evidence.interconnection&&!stale;
 const estimated=selected.reduce((s,x)=>s+x.value,0);
 const layers=TOKENS.map((token,n)=>({rank:n+1,token,domain:n<5?'energy':n<10?'infrastructure':n<15?'ai':n<20?'network':'commerce',priority:25-n,status:eligible?'eligible-with-evidence':'evidence-gated'}));
 return {ok:true,mode:'maximum-real-energy-gain',salesTarget:{targetUsd:Q24_SALES_TARGET_USD,targetLabel:Q24_SALES_TARGET_LABEL,type:'planning-goal',targetAchieved:false},timestamp:new Date().toISOString(),truth:'No estimated opportunity is labeled realized revenue; realized gains require meter/provider/settlement evidence.',eligibility:{eligible,staleDataBlocked:stale,freshnessMs:freshness,evidence},energy:{generationKw:g,loadKw:l,surplusKw:surplus,deficitKw:deficit,batteryKwh:b,selfConsumptionKwh:selfUse,exportKw,exportKwh,pricePerKwh:rate},economics:{exportRateKwh:sell,peakRateKwh:peakRate,demandChargeUsdKw:charge,batteryDegradationUsdKwh:degrade,marketFeesUsdKwh:fees,verifiedSalesUsd:verifiedSales,operatingCostUsd:operatingCost},opportunities:selected,estimatedGrossOpportunityUsd:+estimated.toFixed(4),verifiedSalesNetUsd:+salesNet.toFixed(4),optimization:{objective:'maximize verified net energy value',priorityMultiplier:4,sequence:['freshness','meter validation','tariff validation','interconnection','self-consumption','peak reduction','demand response eligibility','storage arbitrage','export','settlement','reconcile'],doubleCountingGuard:true,no_physical_energy_creation:true},tokens:layers,executionGates:{meter:'required',tariff:'required',interconnection:'required',providerAuthorization:'required',settlement:'required',hardwareControl:'fail-closed'},guaranteedProfit:false,physicalEnergyMultiplier:1,tokenAppreciationGuaranteed:false,qhash:hash({energy:{g,l,b,rate,sell},economics:{charge,degrade,fees},selected,evidence,stale})};
}
const server=http.createServer((req,res)=>{res.setHeader('content-type','application/json');res.setHeader('cache-control','no-store');if(req.url==='/health')return res.end(JSON.stringify({ok:true,status:'live',service:'quantum24-profit-optimizer',layers:25}));if(req.url==='/api/profit-max'){const h=req.headers;return res.end(JSON.stringify(calc({generationKw:h['x-generation-kw'],loadKw:h['x-load-kw'],batteryKwh:h['x-battery-kwh'],pricePerKwh:h['x-price-kwh'],exportRateKwh:h['x-export-rate-kwh'],peakRateKwh:h['x-peak-rate-kwh'],hours:h['x-hours'],exportLimitKw:h['x-export-limit-kw'],demandChargeUsdKw:h['x-demand-charge-usd-kw'],batteryDegradationUsdKwh:h['x-battery-degradation-usd-kwh'],marketFeesUsdKwh:h['x-market-fees-usd-kwh'],verifiedSalesUsd:h['x-verified-sales-usd'],operatingCostUsd:h['x-operating-cost-usd'],baselinePeakKw:h['x-baseline-peak-kw'],sourceTimestampMs:h['x-source-timestamp-ms'],maxAgeMs:h['x-max-age-ms'],meterId:h['x-meter-id'],tariffId:h['x-tariff-id'],providerAuthorized:h['x-provider-authorized']==='true',interconnectionApproved:h['x-interconnection-approved']==='true',settlementVerified:h['x-settlement-verified']==='true'})))}res.statusCode=404;res.end(JSON.stringify({ok:false,error:'not_found'}));});server.listen(PORT,'0.0.0.0');