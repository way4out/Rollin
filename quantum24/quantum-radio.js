(function(){
const S={radio:'https://www.radio-browser.info/',tv:'https://iptv-org.github.io/',movies:'https://archive.org/details/movies',music:'https://musicbrainz.org/',satcom:'https://www.groundstation.space/',chronovisor:'https://archive.org/search?query=historical+recordings'};
window.QuantumRadio={launch:async function(kind){
 const label={radio:'Global AM/FM',tv:'Global TV',movies:'Legal Movies',music:'Legal Discography',satcom:'SatCom+',chronovisor:'Chronovisor Render'}[kind]||kind;
 try{await window.Quantum24QHash?.record('quantum_radio_launch',{kind,label,capability:'federated-legal-integration'});}catch(_){}
 if(kind==='vision'){return {ok:true,visibleLight:'browser-camera',nir:'hardware-required',nightVision:'hardware-required',laser:'hardware-required'};}
 if(kind==='comms'){location.hash='#comms';return {ok:true,capability:'device/provider dependent'};}
 if(S[kind])window.open(S[kind],'_blank','noopener,noreferrer');
 return {ok:true,kind,label};
}};
})();