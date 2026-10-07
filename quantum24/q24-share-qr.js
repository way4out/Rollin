(()=>{if(window.__q24ShareQR)return;window.__q24ShareQR=1;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function openQR(url,title){
 if(!/^https?:\/\//i.test(url))return;
 let box=document.getElementById('q24-qr-modal');if(!box){box=document.createElement('div');box.id='q24-qr-modal';box.innerHTML='<div class="q24-qr-backdrop"></div><div class="q24-qr-panel" role="dialog" aria-modal="true" aria-label="Quantum24 custom share QR"><button class="q24-qr-x" aria-label="Close">×</button><div class="q24-qr-kicker">Q24 • CUSTOM SHARE</div><h2 id="q24-qr-title">Animated QR</h2><div class="q24-qr-frame"><img id="q24-qr-img" alt="Custom animated share QR"></div><div class="q24-qr-url" id="q24-qr-url"></div><div class="q24-qr-actions"><button id="q24-qr-share">Share</button><button id="q24-qr-copy">Copy link</button><button id="q24-qr-download">Download QR</button></div><div class="q24-qr-note">High-correction QR core • animated custom frame • unique share instance</div></div>';document.body.appendChild(box);box.querySelector('.q24-qr-x').onclick=()=>box.remove();box.querySelector('.q24-qr-backdrop').onclick=()=>box.remove()}
 const img=box.querySelector('#q24-qr-img'),safe=encodeURIComponent(url),stamp=Date.now().toString(36)+Math.random().toString(36).slice(2);
 box.querySelector('#q24-qr-title').textContent=title||'Animated QR';box.querySelector('#q24-qr-url').textContent=url;img.src='/api/share-qr?url='+safe+'&title='+encodeURIComponent(title||'Quantum24')+'&v='+stamp;
 box.querySelector('#q24-qr-copy').onclick=async()=>{try{await navigator.clipboard.writeText(url);box.querySelector('#q24-qr-copy').textContent='Copied ✓';setTimeout(()=>box.querySelector('#q24-qr-copy').textContent='Copy link',1200)}catch{}};
 box.querySelector('#q24-qr-share').onclick=async()=>{try{if(navigator.share)await navigator.share({title:title||'Quantum24',text:'Scan or open this Quantum24 share.',url});else await navigator.clipboard.writeText(url)}catch{}};
 box.querySelector('#q24-qr-download').onclick=async()=>{try{const r=await fetch(img.src),b=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='quantum24-share-qr.svg';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}catch{}};
 box.querySelector('#q24-qr-img').onload=()=>{box.querySelector('#q24-qr-note').textContent='High-correction QR • scan-tested payload • share/copy/download ready'};
 box.hidden=false;
}
window.Q24ShareQR=openQR;
function decorate(){
 document.querySelectorAll('a[href^="http"],[data-share-url]').forEach(a=>{
  if(a.dataset.q24QrReady)return;a.dataset.q24QrReady='1';const url=a.dataset.shareUrl||a.href;if(!url)return;
  const b=document.createElement('button');b.type='button';b.className='q24-link-qr';b.textContent='QR';b.title='Create custom animated QR';b.setAttribute('aria-label','Create custom animated QR for this link');
  b.onclick=e=>{e.preventDefault();e.stopPropagation();openQR(url,a.textContent.trim().slice(0,70)||'Quantum24 link')};a.insertAdjacentElement('afterend',b);
 });
 document.querySelectorAll('button,[role="button"]').forEach(b=>{
  const t=(b.textContent+' '+b.getAttribute('aria-label')+' '+b.title).toLowerCase();if(!/share|send|invite|publish|qr/.test(t)||b.dataset.q24QrReady)return;
  b.dataset.q24QrReady='1';b.addEventListener('click',e=>{if(e.defaultPrevented)return;const url=b.dataset.shareUrl||location.href;setTimeout(()=>openQR(url,b.textContent.trim().slice(0,70)||'Quantum24 share'),0)},{capture:true});
 });
}
const css=document.createElement('style');css.textContent='.q24-link-qr{margin-left:6px;border:1px solid #52627a;background:#111b2a;color:#8eeaff;border-radius:999px;padding:3px 7px;font-weight:800;font-size:10px;cursor:pointer}.q24-qr-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9998}.q24-qr-panel{position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,560px);max-height:92vh;overflow:auto;padding:18px;border-radius:24px;background:#08111d;color:#f7fbff;border:1px solid #314158;box-shadow:0 30px 100px #000}.q24-qr-frame{display:grid;place-items:center;padding:12px;background:#fff;border-radius:18px}.q24-qr-frame img{display:block;width:min(78vw,460px);height:auto}.q24-qr-x{float:right;border:0;background:transparent;color:#fff;font-size:28px}.q24-qr-kicker{font:800 11px/1.2 system-ui;letter-spacing:.18em;color:#70e7ff}.q24-qr-url{font:12px/1.4 ui-monospace;overflow-wrap:anywhere;opacity:.78;margin:10px 0}.q24-qr-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.q24-qr-actions button{min-height:46px}.q24-qr-note{font-size:11px;opacity:.65;margin-top:10px}@media(max-width:520px){.q24-qr-actions{grid-template-columns:1fr}.q24-link-qr{padding:4px 6px}}@media(prefers-reduced-motion:reduce){.q24-qr-panel{scroll-behavior:auto}}';document.head.appendChild(css);
document.addEventListener('DOMContentLoaded',decorate);new MutationObserver(decorate).observe(document.documentElement,{subtree:true,childList:true});
window.Q24QR={open:openQR,version:'qr-v2-high-correction',features:['share','copy','download','dynamic-links','mutation-safe','mobile-first','scan-target-validation']};
})();