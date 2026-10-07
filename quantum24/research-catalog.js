'use strict';
const crypto=require('crypto');
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');

const catalog=[
 {id:'warp-subluminal-positive-energy',field:'general relativity',status:'theoretical',implementable:'simulation only',claim:'Some warp-drive metrics have been constructed with positive energy for subluminal cases; this is not a demonstrated propulsion system.',sourceClass:'peer-reviewed/theoretical'},
 {id:'warp-superluminal-quantum-inequality',field:'general relativity',status:'theoretical',implementable:'simulation only',claim:'Superluminal warp metrics remain constrained by energy conditions and quantum inequalities; no demonstrated physical implementation.',sourceClass:'peer-reviewed/theoretical'},
 {id:'higgs-field-engineering',field:'particle physics',status:'experimental science',implementable:'measurement/modeling',claim:'The Higgs field is experimentally established; controllable macroscopic propulsion or energy extraction from it is not established.',sourceClass:'established physics'},
 {id:'quantum-sensing',field:'quantum technology',status:'demonstrated',implementable:'hardware integration',claim:'Quantum sensing and metrology are active experimental technologies.',sourceClass:'university/experimental'},
 {id:'quantum-networking',field:'quantum information',status:'demonstrated/research',implementable:'hardware integration',claim:'Entangled photons and quantum networking experiments are active research areas.',sourceClass:'university/experimental'},
 {id:'quantum-materials',field:'condensed matter',status:'demonstrated/research',implementable:'simulation + lab',claim:'Superconducting, topological, moire and other quantum materials are active research targets.',sourceClass:'university/experimental'},
 {id:'ai-guided-materials',field:'materials science',status:'demonstrated/research',implementable:'software pipeline',claim:'AI-guided materials discovery and autonomous experimentation are active research directions.',sourceClass:'university/experimental'},
 {id:'vacuum-energy',field:'quantum field theory',status:'hypothesis/theory',implementable:'simulation only',claim:'Vacuum fluctuations are real quantum phenomena, but extracting net usable energy from the vacuum is not established.',sourceClass:'theoretical'},
 {id:'wormholes',field:'general relativity',status:'theoretical',implementable:'simulation only',claim:'Wormhole geometries are mathematical solutions in some theories; traversable macroscopic wormholes have not been demonstrated.',sourceClass:'theoretical'},
 {id:'casimir-effect',field:'quantum electrodynamics',status:'demonstrated',implementable:'lab measurement',claim:'Casimir forces are experimentally measurable; they do not provide demonstrated net free energy.',sourceClass:'experimental'}
];

const universitySources=[
 ['Princeton Quantum Initiative','https://quantum.princeton.edu/'],
 ['Harvard Quantum Science and Engineering','https://seas.harvard.edu/quantum-science-engineering'],
 ['Washington State University Quantum Physics','https://physics.wsu.edu/overview-research/quantum-physics/'],
 ['Arizona State University Quantum Science','https://news.asu.edu/20250602-science-and-technology-your-crash-course-quantum-science']
];

function researchScan(){
 const verified=catalog.filter(x=>x.status==='demonstrated'||x.status==='demonstrated/research');
 const theoretical=catalog.filter(x=>x.status==='theoretical'||x.status==='hypothesis/theory');
 return {
  ok:true,version:1,generatedAt:new Date().toISOString(),
  scope:'frontier physics and quantum engineering evidence map',
  evidencePolicy:'IMPLEMENT only demonstrated engineering paths; simulate theoretical paths; never relabel hypotheses as physical capability.',
  catalog,categories:{demonstratedOrResearch:verified.length,theoretical:theoretical.length,total:catalog.length},
  universitySources,qhash:sha(catalog)
 };
}
module.exports={researchScan,catalog,universitySources};
