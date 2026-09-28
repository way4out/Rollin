import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const ROLLIN_SUPABASE_URL="https://qwjjaxzmneawwppcpaap.supabase.co";
const ROLLIN_SUPABASE_KEY="sb_publishable_X1eIeVVNUOHuhmL_10bkDw_1HuT4Vcq";
const rollinSupabase=createClient(ROLLIN_SUPABASE_URL,ROLLIN_SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let rollinSession=null,rollinProfile=null;
async function rollinBoot(){
 const s=await rollinSupabase.auth.getSession(); rollinSession=s.data.session;
 await rollinLoadProfile();
 const r=await rollinSupabase.from("products").select("id,name,category,price_cents,icon,description,tag,repeat_purchase").eq("active",true).order("id");
 if(!r.error&&r.data&&r.data.length){PRODUCTS.splice(0,PRODUCTS.length,...r.data.map(p=>({id:Number(p.id),name:p.name,cat:p.category,price:Number(p.price_cents)/100,icon:p.icon,desc:p.description,tag:p.tag,repeat:p.repeat_purchase})));}
 rollinApplyFavorites(); render();
 rollinSupabase.auth.onAuthStateChange(async(_event,sess)=>{rollinSession=sess;await rollinLoadProfile();render()});
}
async function rollinLoadProfile(){
 if(!rollinSession){rollinProfile=null;return}
 const r=await rollinSupabase.from("profiles").select("id,email,display_name,role,referral_code,rewards_balance,tier").eq("id",rollinSession.user.id).maybeSingle();
 rollinProfile=r.data||null;
}
async function rollinApplyFavorites(){
 if(!rollinSession)return;
 const r=await rollinSupabase.from("favorites").select("product_id").eq("user_id",rollinSession.user.id);
 if(!r.error&&r.data)state.favorites=r.data.map(x=>Number(x.product_id)); save();
}
async function startCheckout(){
 if(!rollinSession){location.hash="profile";toast("Sign in before checkout");return}
 const items=cartItems(); if(!items.length){toast("Cart is empty");return}
 const r=await rollinSupabase.functions.invoke("create-checkout-session",{body:{items:items.map(x=>({product_id:x.p.id,quantity:x.qty})),origin:location.origin+location.pathname}});
 if(r.error){toast(r.error.message||"Checkout unavailable");return}
 if(r.data&&r.data.url){location.href=r.data.url}else toast((r.data&&r.data.error)||"Checkout unavailable");
}
async function signIn(){
 const email=$("#authEmail")&&$("#authEmail").value.trim(),password=$("#authPassword")&&$("#authPassword").value;
 if(!email||!password)return toast("Enter email and password");
 const r=await rollinSupabase.auth.signInWithPassword({email,password}); if(r.error)return toast(r.error.message); toast("Signed in");
}
async function signUp(){
 const email=$("#newEmail")&&$("#newEmail").value.trim(),password=$("#newPassword")&&$("#newPassword").value,name=$("#newName")&&$("#newName").value.trim();
 if(!email||!password)return toast("Enter email and password");
 const r=await rollinSupabase.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:location.origin+location.pathname}});
 if(r.error)return toast(r.error.message); toast(r.data.session?"Account created":"Check your email to confirm your account");
}
async function signOut(){await rollinSupabase.auth.signOut();rollinSession=null;rollinProfile=null;toast("Signed out");render()}
async function rollinLoadOrders(){
 const box=$("#ordersBox"); if(!box||!rollinSession)return;
 const r=await rollinSupabase.from("orders").select("id,total_cents,status,created_at").eq("user_id",rollinSession.user.id).order("created_at",{ascending:false});
 if(r.error){box.innerHTML="<div class=\"empty\">Unable to load orders.</div>";return}
 box.innerHTML=r.data&&r.data.length?"<table class=\"table\"><tr><th>Order</th><th>Total</th><th>Status</th></tr>"+r.data.map(o=>"<tr><td>"+o.id.slice(0,8)+"</td><td>$"+(Number(o.total_cents)/100).toFixed(2)+"</td><td>"+o.status+"</td></tr>").join("")+"</table>":"<div class=\"empty\">No orders yet.</div>";
}
function profile(){
 if(!rollinSession){shell("<div class=\"eyebrow\">ACCOUNT</div><h2>Join Rollin</h2><section class=\"section split\"><div class=\"feature\"><span class=\"tag\">SIGN IN</span><h3>Welcome back</h3><input id=\"authEmail\" class=\"search full\" type=\"email\" placeholder=\"Email\"><input id=\"authPassword\" class=\"search full\" type=\"password\" placeholder=\"Password\"><button class=\"primary full\" onclick=\"signIn()\">Sign in</button></div><div class=\"feature\"><span class=\"tag\">NEW ACCOUNT</span><h3>Create account</h3><input id=\"newName\" class=\"search full\" placeholder=\"Display name\"><input id=\"newEmail\" class=\"search full\" type=\"email\" placeholder=\"Email\"><input id=\"newPassword\" class=\"search full\" type=\"password\" placeholder=\"Password (6+ characters)\"><button class=\"secondary full\" onclick=\"signUp()\">Create account</button><p class=\"muted\">Email confirmation may be required.</p></div></section>","Account");return}
 shell("<div class=\"eyebrow\">PROFILE</div><h2>Your Rollin workspace</h2><div class=\"split section\"><div class=\"feature\"><h3>"+(rollinProfile&&rollinProfile.display_name||"Rollin member")+"</h3><p class=\"muted\">"+(rollinProfile&&rollinProfile.email||"")+"</p><p>Tier: <strong>"+(rollinProfile&&rollinProfile.tier||"Free")+"</strong></p><p>Rewards: <strong>"+(rollinProfile&&rollinProfile.rewards_balance||0)+"</strong></p><p>Referral: <strong>"+(rollinProfile&&rollinProfile.referral_code||"")+"</strong></p></div><div class=\"feature\"><h3>Account</h3><p class=\"muted\">Orders and rewards are stored server-side.</p><button class=\"secondary\" onclick=\"signOut()\">Sign out</button></div></div><section class=\"section\"><h2>Orders</h2><div id=\"ordersBox\" class=\"empty\">Loading orders…</div></section>","Profile");
 rollinLoadOrders();
}
function rewards(){shell("<div class=\"eyebrow\">LOYALTY</div><h2>Rewards</h2><p class=\"muted\">Rewards are tied to verified purchases.</p><section class=\"section stats\"><div class=\"stat\">Credits<strong>"+(rollinProfile?rollinProfile.rewards_balance:0)+"</strong></div><div class=\"stat\">Membership<strong>"+(rollinProfile?rollinProfile.tier:"Guest")+"</strong></div><div class=\"stat\">Favorites<strong>"+state.favorites.length+"</strong></div><div class=\"stat\">Referral<strong>"+(rollinProfile?rollinProfile.referral_code.slice(-6):"—")+"</strong></div></section><section class=\"section split\"><div class=\"feature\"><span class=\"tag\">MEMBERSHIP</span><h2>Rollin Member</h2><p class=\"muted\">Recurring billing infrastructure is ready for a configured Stripe price.</p></div><div class=\"feature\"><span class=\"tag\">REFERRAL</span><h2>Share & earn</h2><p class=\"muted\">"+(rollinProfile?rollinProfile.referral_code:"Sign in to get a code.")+"</p><button class=\"secondary\" onclick=\"copyReferral()\">Copy referral</button></div></section>","Rewards")}
async function subscribe(){const email=$("#email")&&$("#email").value.trim();if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast("Enter a valid email");const r=await rollinSupabase.from("newsletter_subscribers").upsert({email,user_id:rollinSession?rollinSession.user.id:null});if(r.error)return toast(r.error.message);toast("You are on the Rollin list")}
async function merchantLead(){const email=$("#merchantEmail")&&$("#merchantEmail").value.trim();if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast("Enter a valid email");const r=await rollinSupabase.from("merchant_leads").insert({email,user_id:rollinSession?rollinSession.user.id:null});if(r.error)return toast(r.error.message);toast("Merchant interest saved")}
async function toggleFav(id){state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):state.favorites.concat(id);save();if(rollinSession){if(state.favorites.includes(id))await rollinSupabase.from("favorites").upsert({user_id:rollinSession.user.id,product_id:id});else await rollinSupabase.from("favorites").delete().eq("user_id",rollinSession.user.id).eq("product_id",id)}render()}
function copyReferral(){if(!rollinProfile)return toast("Sign in first");copyText(location.origin+location.pathname+"?ref="+encodeURIComponent(rollinProfile.referral_code))}
window.startCheckout=startCheckout;window.signIn=signIn;window.signUp=signUp;window.signOut=signOut;window.copyReferral=copyReferral;window.subscribe=subscribe;window.merchantLead=merchantLead;
rollinBoot().catch(e=>console.error("Rollin backend boot failed",e));
const PRODUCTS=[
{id:1,name:"Rollin Starter Bundle",cat:"Featured",price:120,icon:"✦",desc:"Launch bundle with member perks.",tag:"FEATURED",repeat:true},
{id:2,name:"Caffeine Daily Pack",cat:"Caffeine",price:75,icon:"☕",desc:"Consumable bundle designed for repeat purchase.",tag:"REPEAT",repeat:true},
{id:3,name:"Aeth Tech Pass",cat:"Digital",price:250,icon:"◈",desc:"Digital access product.",tag:"DIGITAL"},
{id:4,name:"Auto Care Credit",cat:"Auto",price:400,icon:"◉",desc:"Service-credit marketplace product.",tag:"SERVICE"},
{id:5,name:"Emrld Member Drop",cat:"Drops",price:320,icon:"◆",desc:"Limited member drop.",tag:"DROP"},
{id:6,name:"Balloon Creator Kit",cat:"Balloon",price:90,icon:"○",desc:"Creator bundle with sharing tools.",tag:"SHARE"},
{id:7,name:"Telp Connect Pack",cat:"Telp",price:160,icon:"⌁",desc:"Communications service product.",tag:"SERVICE"},
{id:8,name:"Blzet Collectible",cat:"Collectibles",price:210,icon:"✺",desc:"Collectible/access utility.",tag:"ACCESS"}
];
const NAV=[["home","⌂","Home"],["shop","▦","Shop"],["drops","◈","Drops"],["rewards","★","Rewards"],["wallet","◉","Wallet"],["profile","●","Profile"],["gaia","♧","Gaia"],["merchant","◇","Sell"]];
const DEFAULT={cart:{},orders:[],rewards:0,tier:"Free",ref:"ROLLIN-"+Math.random().toString(36).slice(2,8).toUpperCase(),theme:"dark",favorites:[],newsletter:false,merchantLeads:[]};
let state=loadState();
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("en-US").format(n)+" ROLLIN";
function loadState(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem("rollin-state")||"{}")}}catch{return {...DEFAULT}}}
function save(){localStorage.setItem("rollin-state",JSON.stringify(state))}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),1900)}
function navHtml(){return NAV.map(([id,ic,label])=>\`<button class="nav-link" data-nav="\${id}" aria-label="\${label}"><span>\${ic}</span><span>\${label}</span></button>\`).join("")}
$("#desktopNav").innerHTML=navHtml();$("#mobileNav").innerHTML=navHtml();
document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-nav]"); if(nav){location.hash=nav.dataset.nav;return}
 const add=e.target.closest("[data-add]"); if(add){addToCart(+add.dataset.add);return}
 const fav=e.target.closest("[data-fav]"); if(fav){toggleFav(+fav.dataset.fav);return}
 const share=e.target.closest("[data-share]"); if(share){shareProduct(+share.dataset.share);return}
 const qty=e.target.closest("[data-qty]"); if(qty){changeQty(+qty.dataset.id,+qty.dataset.qty);return}
 const remove=e.target.closest("[data-remove]"); if(remove){removeFromCart(+remove.dataset.remove);return}
 const product=e.target.closest("[data-product]"); if(product){openProduct(+product.dataset.product)}
});
$("#themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";applyTheme();save()};
$("#walletBtn").onclick=()=>location.hash="wallet";
window.addEventListener("hashchange",render);
window.addEventListener("storage",()=>{state=loadState();render()});
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
applyTheme();render();

function applyTheme(){document.documentElement.dataset.theme=state.theme}
function cartItems(){return Object.entries(state.cart).map(([id,qty])=>({p:PRODUCTS.find(p=>p.id===+id),qty:+qty})).filter(x=>x.p&&x.qty>0)}
function cartCount(){return cartItems().reduce((n,x)=>n+x.qty,0)}
function cartTotal(){return cartItems().reduce((n,x)=>n+x.p.price*x.qty,0)}
function shell(content,title=""){document.title=title?title+" — Rollin":"Rollin — Shop. Earn. Unlock. Repeat.";$("#view").innerHTML=\`<div class="page">\${content}<footer class="footer"><strong>Rollin</strong> is a commerce platform. Catalog/cart/rewards work locally in this browser. Real payment settlement, merchant fulfillment, email delivery and blockchain verification require production provider credentials.</footer></div>\`;window.scrollTo(0,0)}
function productCard(p){
 const fav=state.favorites.includes(p.id);
 return \`<article class="card">
 <button class="product-art" data-product="\${p.id}" aria-label="View \${p.name}"><span>\${p.icon}</span><span class="art-glow"></span></button>
 <div class="card-body"><span class="tag">\${p.tag}</span><h3>\${p.name}</h3><p class="muted">\${p.desc}</p>
 <div class="price">\${money(p.price)} <small>· catalog</small></div>
 <div class="card-actions"><button class="primary" data-add="\${p.id}">Add</button><button class="secondary" data-share="\${p.id}">Share</button><button class="fav \${fav?"on":""}" data-fav="\${p.id}" aria-label="Favorite">\${fav?"♥":"♡"}</button></div></div></article>\`
}
function home(){
 shell(\`<section class="hero"><div class="hero-card"><div class="eyebrow">ROLLIN COMMERCE OS</div><h1>SHOP.<br>EARN.<br>REPEAT.</h1><p>One fast, mobile-first place for products, drops, rewards, referrals and merchant tools.</p><div class="hero-actions"><button class="primary" onclick="location.hash='shop'">Explore Shop →</button><button class="secondary" onclick="location.hash='merchant'">Sell on Rollin</button></div><div class="trust-row"><span>✓ Mobile-first</span><span>✓ PWA-ready</span><span>✓ Human-first</span></div></div>
 <div class="wallet-card"><div><div class="eyebrow">ROLLIN WALLET</div><div class="balance">—</div><div class="status"><span class="dot"></span> Verification required</div></div><div><p class="muted">No fabricated balances or transactions.</p><button class="secondary" onclick="location.hash='wallet'">Open Wallet</button></div></div></section>
 <section class="section stats"><div class="stat">Cart<strong>\${cartCount()}</strong></div><div class="stat">Orders<strong>\${state.orders.length}</strong></div><div class="stat">Rewards<strong>\${state.rewards}</strong></div><div class="stat">Tier<strong>\${state.tier}</strong></div></section>
 <section class="section"><div class="section-head"><h2>Trending</h2><button class="secondary" onclick="location.hash='shop'">All products</button></div><div class="grid">\${PRODUCTS.slice(0,4).map(productCard).join("")}</div></section>
 <section class="section feature-grid"><div class="feature"><div class="feature-icon">↻</div><h3>Repeat commerce</h3><p class="muted">Replenishment and membership flows are built into the UX.</p></div><div class="feature"><div class="feature-icon">↗</div><h3>Built to spread</h3><p class="muted">Share links and referral identity are first-class actions.</p></div><div class="feature"><div class="feature-icon">◇</div><h3>Merchant engine</h3><p class="muted">Catalog, campaigns, loyalty and analytics surfaces are ready for a backend.</p></div></section>
 <section class="section newsletter"><div><div class="eyebrow">ROLLIN SIGNAL</div><h2>Get drops and store alerts</h2><p class="muted">Optional local signup until an email provider is connected.</p></div><div class="inline-form"><input id="email" class="search" type="email" autocomplete="email" placeholder="you@example.com"><button class="primary" onclick="subscribe()">Join</button></div></section>\`)
}
function shop(){
 shell(\`<div class="section-head"><div><div class="eyebrow">MARKETPLACE</div><h2>Discover your next buy</h2></div><button class="secondary" onclick="location.hash='cart'">Cart (\${cartCount()})</button></div>
 <div class="toolbar"><input id="search" class="search" autocomplete="off" placeholder="Search products, categories…"><select id="filter" class="search"><option value="all">All categories</option>\${[...new Set(PRODUCTS.map(p=>p.cat))].map(c=>\`<option>\${c}</option>\`).join("")}</select><button class="secondary" onclick="location.hash='drops'">Live drops</button></div><div id="shopGrid" class="grid">\${PRODUCTS.map(productCard).join("")}</div>\`);
 const filter=()=>{const q=$("#search").value.trim().toLowerCase(),c=$("#filter").value;const list=PRODUCTS.filter(p=>(c==="all"||p.cat===c)&&(p.name+" "+p.cat+" "+p.desc).toLowerCase().includes(q));$("#shopGrid").innerHTML=list.length?list.map(productCard).join(""):'<div class="empty wide">No matching products.</div>'};$("#search").oninput=filter;$("#filter").onchange=filter
}
function drops(){shell(\`<div class="drop-banner"><div class="eyebrow">DROP CENTER</div><h2>Member Drop</h2><p class="muted">Availability shown here is catalog data, not manufactured scarcity.</p><div class="count">LIVE</div></div><div class="grid section">\${PRODUCTS.filter(p=>p.tag==="DROP").map(productCard).join("")}</div><section class="section notice">Referral link: <button class="secondary" onclick="copyText(location.origin+location.pathname+'?ref='+state.ref)">Copy \${state.ref}</button></section>\`)}
function rewards(){shell(\`<div class="eyebrow">LOYALTY</div><h2>Rewards</h2><p class="muted">Credits are local demo rewards until a real loyalty backend is connected.</p><section class="section stats"><div class="stat">Credits<strong>\${state.rewards}</strong></div><div class="stat">Membership<strong>\${state.tier}</strong></div><div class="stat">Favorites<strong>\${state.favorites.length}</strong></div><div class="stat">Referral<strong>\${state.ref.slice(-6)}</strong></div></section><section class="section split"><div class="feature"><span class="tag">MEMBERSHIP</span><h2>Rollin Member</h2><p class="muted">Early access and member benefits.</p><button class="primary" onclick="upgradeTier()">Choose Member</button></div><div class="feature"><span class="tag">REFERRAL</span><h2>Share & earn</h2><p class="muted">Code: <strong>\${state.ref}</strong></p><button class="secondary" onclick="copyText(location.origin+location.pathname+'?ref='+state.ref)">Copy referral link</button></div></section>\`)}
function wallet(){shell(\`<div class="eyebrow">WALLET</div><h2>Wallet</h2><div class="notice section"><strong>Status:</strong> live network and transaction signing are disabled until production wallet/payment infrastructure is configured.</div><section class="section split"><div class="feature"><h3>Account</h3><p class="muted">No private keys are stored by Rollin.</p><button class="secondary" onclick="toast('Production wallet connection is not enabled yet')">Connect wallet</button></div><div class="feature"><h3>Treasury</h3><p class="muted">Settlement address configuration should be supplied server-side before launch.</p></div></section>\`)}
function profile(){shell(\`<div class="eyebrow">PROFILE</div><h2>Your Rollin workspace</h2><div class="split section"><div class="feature"><h3>Referral identity</h3><p class="muted">\${state.ref}</p><button class="secondary" onclick="copyText(state.ref)">Copy</button></div><div class="feature"><h3>Saved favorites</h3><p class="muted">\${state.favorites.length} saved products.</p><button class="secondary" onclick="location.hash='shop'">Browse</button></div></div><section class="section"><h2>Orders</h2>\${state.orders.length?'<table class="table"><tr><th>Order</th><th>Total</th><th>Status</th></tr>'+state.orders.map(o=>\`<tr><td>\${o.id}</td><td>\${money(o.total)}</td><td>\${o.status}</td></tr>\`).join("")+'</table>':'<div class="empty">No orders yet.</div>'}</section>\`)}
function cart(){
 const items=cartItems();shell(\`<div class="section-head"><div><div class="eyebrow">CART</div><h2>\${cartCount()} item\${cartCount()===1?"":"s"}</h2></div><button class="secondary" onclick="location.hash='shop'">Continue shopping</button></div>
 \${items.length?'<div class="cart-list">'+items.map(({p,qty})=>\`<div class="cart-row"><div class="mini-art">\${p.icon}</div><div class="cart-info"><h3>\${p.name}</h3><p class="muted">\${money(p.price)} each</p></div><div class="qty"><button data-qty="-1" data-id="\${p.id}" aria-label="Decrease">−</button><strong>\${qty}</strong><button data-qty="1" data-id="\${p.id}" aria-label="Increase">+</button></div><strong>\${money(p.price*qty)}</strong><button class="secondary" data-remove="\${p.id}">Remove</button></div>\`).join("")+'</div><section class="section split"><div class="feature"><h3>Total</h3><div class="balance">'+money(cartTotal())+'</div><p class="muted">Demo catalog total.</p></div><div class="feature"><h3>Checkout</h3><p class="muted">Payment is gated until production credentials are configured.</p><button class="primary" onclick="location.hash='checkout'">Continue →</button></div></section>':'<div class="empty">Your cart is empty.<br><button class="primary" style="margin-top:14px" onclick="location.hash='shop'">Start shopping</button></div>'}\`)
}
function checkout(){
 const items=cartItems(),total=cartTotal();shell(\`<div class="eyebrow">CHECKOUT</div><h2>Checkout</h2><div class="split section"><div class="feature"><h3>Order summary</h3>\${items.length?items.map(({p,qty})=>\`<p>\${p.name} × \${qty}<strong class="float">\${money(p.price*qty)}</strong></p>\`).join(""):'<p class="muted">Cart is empty.</p>'}<hr><h3>Total <span class="float">\${money(total)}</span></h3></div><div class="feature"><h3>Payment gate</h3><div class="notice">No real charge can occur in this GitHub Pages deployment. The demo-order flow below verifies the cart lifecycle without pretending a payment happened.</div><button class="primary full" \${items.length?"":"disabled"} onclick="createDemoOrder()">Create demo order</button></div></div>\`)
}
function merchant(){shell(\`<div class="eyebrow">MERCHANT OS</div><h2>Sell on Rollin</h2><p class="muted">A commercial surface for stores, creators and service providers.</p><div class="feature-grid section">\${["Storefronts","Products & inventory","Subscriptions","Drops & campaigns","Customer loyalty","Analytics","Promoted discovery","Settlement"].map(x=>\`<div class="feature"><span class="tag">READY</span><h3>\${x}</h3><p class="muted">Production connector required for live data.</p></div>\`).join("")}</div><section class="section newsletter"><div><h2>Merchant launch list</h2><p class="muted">Save merchant interest locally until a backend is connected.</p></div><div class="inline-form"><input id="merchantEmail" class="search" type="email" autocomplete="email" placeholder="merchant@example.com"><button class="primary" onclick="merchantLead()">Request access</button></div></section>\`)}
function gaia(){shell(\`<div class="eyebrow">PEOPLE • PLANET • PROSPERITY</div><h2>Gaia Mode</h2><p class="muted">Human-first commerce with transparent claims and user choice.</p><section class="section stats"><div class="stat">Privacy<strong>Minimized</strong></div><div class="stat">Accessibility<strong>First-class</strong></div><div class="stat">Performance<strong>Lightweight</strong></div><div class="stat">Choice<strong>User-controlled</strong></div></section><section class="section feature-grid"><div class="feature"><h3>Clear commerce</h3><p class="muted">Transparent pricing, consent, cancellation and policies.</p></div><div class="feature"><h3>Durable web</h3><p class="muted">Static-first architecture reduces unnecessary runtime cost.</p></div><div class="feature"><h3>Real revenue</h3><p class="muted">Commerce, memberships, merchant services and digital goods can be connected to real providers.</p></div></section>\`)}
function openProduct(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;$("#modal").innerHTML=\`<div class="modal-box"><div class="modal-head"><div><span class="tag">\${p.tag}</span><h2>\${p.name}</h2></div><button class="close" onclick="closeModal()">×</button></div><div class="product-modal-art">\${p.icon}</div><p class="muted">\${p.desc}</p><div class="balance">\${money(p.price)}</div><button class="primary full" onclick="addToCart(\${p.id});closeModal()">Add to cart</button><button class="secondary full" onclick="closeModal()">Continue browsing</button></div>\`;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
function addToCart(id){if(!PRODUCTS.some(p=>p.id===id))return;state.cart[id]=(state.cart[id]||0)+1;save();toast("Added to cart");render()}
function changeQty(id,delta){const next=(state.cart[id]||0)+delta;if(next<=0)delete state.cart[id];else state.cart[id]=next;save();render()}
function removeFromCart(id){delete state.cart[id];save();toast("Removed");render()}
function toggleFav(id){state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();render()}
function createDemoOrder(){const items=cartItems(),total=cartTotal();if(!items.length)return toast("Cart is empty");state.orders.unshift({id:"DEMO-"+Date.now().toString(36).toUpperCase(),total,status:"DEMO — not charged",createdAt:new Date().toISOString()});state.rewards+=Math.max(1,Math.floor(total/10));state.cart={};save();toast("Demo order created");setTimeout(()=>location.hash="profile",500)}
function upgradeTier(){state.tier="Member";save();toast("Member tier selected")}
function subscribe(){const v=$("#email")?.value.trim();if(!v||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v))return toast("Enter a valid email");state.newsletter=true;save();toast("You're on the Rollin list")}
function merchantLead(){const v=$("#merchantEmail")?.value.trim();if(!v||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v))return toast("Enter a valid email");if(!state.merchantLeads.includes(v))state.merchantLeads.push(v);save();toast("Merchant interest saved")}
async function shareProduct(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;const url=location.origin+location.pathname+"#shop?product="+id+"&ref="+state.ref;try{if(navigator.share)await navigator.share({title:p.name,text:"Discover this on Rollin",url});else await copyText(url);toast("Share link ready")}catch{}}
async function copyText(value){try{await navigator.clipboard.writeText(value);toast("Copied")}catch{const ta=document.createElement("textarea");ta.value=value;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();toast("Copied")}}
function render(){const page=(location.hash.slice(1)||"home").split("?")[0];document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x.dataset.nav===page));({home,shop,drops,rewards,wallet,profile,cart,checkout,merchant,gaia}[page]||home)()}
window.closeModal=closeModal;window.addToCart=addToCart;window.changeQty=changeQty;window.removeFromCart=removeFromCart;window.upgradeTier=upgradeTier;window.createDemoOrder=createDemoOrder;window.subscribe=subscribe;window.merchantLead=merchantLead;window.copyText=copyText;window.render=render;