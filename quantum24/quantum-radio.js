(function(){
const S={radio:'https://www.radio-browser.info/',tv:'https://iptv-org.github.io/',movies:'https://archive.org/details/movies',music:'https://musicbrainz.org/',satcom:'https://www.groundstation.space/',chronovisor:'https://archive.org/search?query=historical+recordings'};
const ENERGYX_CONTRACT='0xA6740F8F7030A877A460f2e82d77e3aC5e555BA3';
const TOKENS=['sqt','nqrx','hir','oeql','node','upgrade','rollin','aeth','aiuse','auto','zai','balloon','tree','one','haha','two','caffeine','aiu4','telp','blzet','flaw','wo','emrld','rev','energyx'];
const QRNFT={enabled:true,cap:96000,priceUsd:11,priceMode:'configured-sale-price',minting:'verify-provider-or-chain-before-claiming'};
window.QuantumRadio={
 registry:{tokenCount:TOKENS.length,tokens:TOKENS,energyPositive:{contract:ENERGYX_CONTRACT,status:'configured-unverified',network:'Base',role:'energy/grid accounting and integration metadata only'},qhash:{algorithm:'SHA-256',coverage:'integrated operations'},staking:{status:'integration-ready',execution:'requires verified pool/contract'},qrnft:QRNFT},
 launch:async function(kind){
  const label={radio:'Global AM/FM',tv:'Global TV',movies:'Legal Movies',music:'Legal Discography',satcom:'SatCom+',chronovisor:'Chronovisor Render'}[kind]||kind;
  try{await window.Quantum24QHash?.record('quantum_radio_launch',{kind,label,capability:'federated-legal-integration',energyContract:ENERGYX_CONTRACT,tokenCount:TOKENS.length});}catch(_){}
  if(kind==='vision'){return {ok:true,visibleLight:'browser-camera',nir:'hardware-required',nightVision:'hardware-required',laser:'hardware-required'};}
  if(kind==='comms'){location.hash='#comms';return {ok:true,capability:'device/provider dependent'};}
  if(S[kind])window.open(S[kind],'_blank','noopener,noreferrer');
  return {ok:true,kind,label};
 },
 getRegistry:function(){return JSON.parse(JSON.stringify(this.registry))}
};
})();