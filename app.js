import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://qwjjaxzmneawwppcpaap.supabase.co";
const SUPABASE_KEY = "sb_publishable_X1eIeVVNUOHuhmL_10bkDw_1HuT4Vcq";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const FALLBACK_PRODUCTS = [
  {id:1,name:"The Multiverse Market Starter Bundle",cat:"Featured",price:12000,icon:"✦",desc:"Launch bundle with member perks.",tag:"FEATURED",repeat:true},
  {id:2,name:"Caffeine Daily Pack",cat:"Caffeine",price:7500,icon:"☕",desc:"Consumable bundle designed for repeat purchase.",tag:"REPEAT",repeat:true},
  {id:3,name:"Aeth Tech Pass",cat:"Digital",price:25000,icon:"◈",desc:"Digital access product.",tag:"DIGITAL"},
  {id:4,name:"Auto Care Credit",cat:"Auto",price:40000,icon:"◉",desc:"Service-credit marketplace product.",tag:"SERVICE"},
  {id:5,name:"Emrld Member Drop",cat:"Drops",price:32000,icon:"◆",desc:"Limited member drop.",tag:"DROP"},
  {id:6,name:"Balloon Creator Kit",cat:"Balloon",price:9000,icon:"○",desc:"Creator bundle with sharing tools.",tag:"SHARE"},
  {id:7,name:"Telp Connect Pack",cat:"Telp",price:16000,icon:"⌁",desc:"Communications service product.",tag:"SERVICE"},
  {id:8,name:"Blzet Collectible",cat:"Collectibles",price:21000,icon:"✺",desc:"Collectible/access utility.",tag:"ACCESS"}
];

let PRODUCTS = [...FALLBACK_PRODUCTS];

async function loadProducts(){
  const {data,error}=await supabase.from("products").select("id,merchant_id,name,category,description,price_cents,currency,icon,tag,repeat_purchase,active,inventory,metadata").eq("active",true).order("id",{ascending:true});
  if(error){console.warn("Live product catalog unavailable; using fallback catalog.",error);return false}
  const live=(data||[]).map(p=>({id:Number(p.id),merchant_id:p.merchant_id||null,name:p.name,cat:p.category||"Featured",price:Number(p.price_cents||0),currency:(p.currency||"usd").toLowerCase(),icon:p.icon||"✦",desc:p.description||"",tag:p.tag||"LIVE",repeat:!!p.repeat_purchase,inventory:p.inventory,metadata:p.metadata||{}})).filter(p=>Number.isFinite(p.id)&&p.price>=0);
  if(live.length){PRODUCTS=live;return true}
  return false;
}

const APP_BASE=new URL("./",import.meta.url).pathname;
function route(page,query=""){const p=page.replace(/^\/+|\/+$/g,"");const target=p==="home"?APP_BASE:APP_BASE+p+"/";location.href=target+(query?("?"+query):"")}
const TELCOM_PROMO = '<div class="telcom-scroll-banner" role="region" aria-label="Quantum Telecom promotion"><div class="telcom-scroll-track"><a href="https://buy.stripe.com/28E00leF9bjm6Yf09UdIA06" class="telcom-banner-link">QUANTUM TELCOM · eSIM · $4 START + $4/MONTH · 1-TAP BUY →</a><a href="https://buy.stripe.com/9B6eVf1Snafi1DV7CmdIA07" class="telcom-banner-link">PHYSICAL SIM · $4 START + $4/MONTH · 1-TAP BUY · SHIPPING/ACTIVATION SUBJECT TO PROVIDER ELIGIBILITY →</a><a href="'+APP_BASE+'shop/?category=Telecom" class="telcom-banner-link">GLOBAL MARKETPLACE · 1-TAP BUY · SHARE · CAPACITY UPGRADE →</a></div></div>';

const NAV = [
  ["home","⌂","Home"],["shop","▦","Shop"],["packages","⬇","Packages"],["drops","◈","Drops"],["rewards","★","Rewards"],
  ["wallet","◉","Wallet"],["profile","●","Profile"],["crypto","₿","Crypto"],["gaia","♧","Gaia"],["merchant","◇","Sell"]
];

const DEFAULT = {
  cart:{}, theme:"dark", favorites:[], newsletter:false
};
let state = loadState();
let session = null;
let profileData = null;
const $ = (s)=>document.querySelector(s);
const money = (cents)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(cents||0)/100);
const esc = (v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function loadState(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem("multiverse-market-state")||"{}")}}catch{return {...DEFAULT}}}
function save(){localStorage.setItem("multiverse-market-state",JSON.stringify(state))}
function toast(msg){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2200)}
function applyTheme(){document.documentElement.dataset.theme=state.theme||"dark"}
function cartItems(){return Object.entries(state.cart||{}).map(([id,qty])=>({p:PRODUCTS.find(p=>p.id===Number(id)),qty:Number(qty)})).filter(x=>x.p&&x.qty>0)}
function cartCount(){return cartItems().reduce((n,x)=>n+x.qty,0)}
function cartTotal(){return cartItems().reduce((n,x)=>n+x.p.price*x.qty,0)}
function navHtml(){return NAV.map(([id,ic,label])=>'<a class="nav-link" data-nav="'+id+'" href="'+APP_BASE+id+'/'" aria-label="'+label+'"><span>'+ic+'</span><span>'+label+'</span></a>').join("")}

function shell(content,title=""){
  document.title = title ? title+" — The Multiverse Market" : "The Multiverse Market — Shop. Earn. Unlock. Repeat.";
  $("#view").innerHTML=TELCOM_PROMO+'<div class="page">'+content+'<footer class="footer"><strong>The Multiverse Market</strong> commerce. Payments are processed by Stripe Checkout; card data is not stored by this site.</footer></div>';
  window.scrollTo({top:0,behavior:"instant"});
}
function productCard(p){
  const fav=state.favorites.includes(p.id), img=p.metadata?.image_url;
  return '<article class="card">'+
    '<button class="product-art" data-product="'+p.id+'" aria-label="View '+esc(p.name)+'">'+(img?'<img class="product-image" src="'+esc(img)+'" alt="'+esc(p.name)+'">':'<span>'+esc(p.icon)+'</span>')+'<span class="art-glow"></span></button>'+
    '<div class="card-body"><span class="tag">'+esc(p.tag)+'</span><h3>'+esc(p.name)+'</h3><p class="muted">'+esc(p.desc)+'</p>'+
    '<div class="price">'+money(p.price)+'</div><div class="card-actions">'+
    '<button class="primary" data-buy="'+p.id+'">1-Tap Buy</button><button class="primary" onclick="buyOnchainNow('+p.id+')">1-Tap Onchain</button><button class="secondary" data-add="'+p.id+'">Add</button><button class="secondary" data-share="'+p.id+'">Share</button>'+
    '<button class="fav '+(fav?"on":"")+'" data-fav="'+p.id+'" aria-label="Favorite">'+(fav?"♥":"♡")+'</button></div></div></article>';
}

async function buyNow(productId){const p=PRODUCTS.find(x=>x.id===Number(productId));if(!p)return toast("Listing unavailable");const external=p.metadata?.external_checkout;if(external){window.location.href=external;return}state.cart={[productId]:1};save();await startCheckout();}
async function buyOnchainNow(productId){const p=PRODUCTS.find(x=>x.id===Number(productId));if(!p)return toast("Listing unavailable");if(!session){route("profile");return}state.cart={[productId]:1};save();route("crypto","autobuy=1");}
const COPY_PACKAGES=[
{id:"stellarnet-llc-website",name:"StellarNet LLC Website",price_cents:3500000,scope:"Public company website and recreation data"},
{id:"multiverse-market-github-pages",name:"The Multiverse Market GitHub Pages Deployment",price_cents:2500000,scope:"Public The Multiverse Market deployment and recreation data"},
{id:"multiverse-market-marketplace-source",name:"The Multiverse Market Marketplace Application / Source",price_cents:35000000,scope:"Marketplace application source and recreation data"},
{id:"stellarnet-marketplace-render",name:"StellarNet Marketplace Render Deployment",price_cents:5000000,scope:"Marketplace deployment configuration and recreation data"},
{id:"nftqr-application",name:"StellarNet NFTQR Application",price_cents:22500000,scope:"NFTQR application source/configuration and recreation data"},
{id:"nftqr-public",name:"StellarNet NFTQR Public Deployment",price_cents:2000000,scope:"Public NFTQR deployment and recreation data"},
{id:"stellarnet-render",name:"StellarNet Primary Render Deployment",price_cents:2500000,scope:"Primary deployment configuration and recreation data"},
{id:"stellarnet-limited-free",name:"StellarNet Limited Free Deployment",price_cents:1250000,scope:"Limited-free deployment configuration and recreation data"},
{id:"oeql-quantum-telecom-live",name:"OEQL Quantum Telecom Live Application",price_cents:17500000,scope:"Quantum Telecom live application and recreation data"},
{id:"oeql-quantum-telecom",name:"OEQL Quantum Telecom Deployment",price_cents:5000000,scope:"Quantum Telecom deployment and recreation data"},
{id:"oeql-quantum-telecom-phone",name:"OEQL Quantum Telecom Phone",price_cents:5000000,scope:"Quantum Telecom Phone deployment and recreation data"},
{id:"oeql-quantum-telecom-7g-plus",name:"OEQL Quantum Telecom 7G+ Deployment",price_cents:5000000,scope:"Quantum Telecom 7G+ deployment and recreation data"},
{id:"oeql-quantum-telecom-api",name:"OEQL Quantum Telecom API",price_cents:15000000,scope:"Quantum Telecom API source/configuration and recreation data"},
{id:"oeql-bank-forever",name:"OEQL Bank Forever Application",price_cents:25000000,scope:"OEQL Bank Forever application source/configuration and recreation data"},
{id:"oeql-source-poinhi",name:"OEQL Source + POINHI Architecture",price_cents:45000000,scope:"OEQL source and documented POINHI architecture"},
{id:"telephone-nftqr-source",name:"Telephone / NFTQR Source",price_cents:30000000,scope:"Telephone/NFTQR source and recreation data"},
{id:"aetheros-source",name:"AetherOS Source",price_cents:35000000,scope:"AetherOS source and recreation data"},
{id:"poinhi-23-gate-69-lane",name:"POINHI 23-Gate / 69-Lane Architecture",price_cents:15000000,scope:"Documented 23-gate/69-lane software architecture"},
{id:"poinhi-69n",name:"POINHI 69^n Recursive Architecture",price_cents:7500000,scope:"Documented 69^n recursive orchestration architecture"}
];
function packageManifest(p){return {schema:"stellarnet.copy-package.v1",package_id:p.id,name:p.name,scope:p.scope,rights:"single_download_copy_right",download_policy:"one verified paid entitlement -> one download token; token consumed atomically",payment:{chain:"base",processor:"BANKR"},integrity:{hash:"generated_server_side_at_release"}}}
function packages(){shell('<div class="eyebrow">STELLARNET 1-TAP ACQUISITION MARKET</div><h2>19 Individual Sellables · 1-Tap Pay</h2><p class="muted">Every sellable has its own price and purchase control. Tap once to initiate the secure checkout; verified Base settlement is required before any one-use copy entitlement is issued.</p><section class="section stats"><div class="stat">Listings<strong>'+COPY_PACKAGES.length+'</strong></div><div class="stat">Rail<strong>Base</strong></div><div class="stat">Processor<strong>BANKR</strong></div><div class="stat">Gross asks<strong>$295.25M</strong></div></section><section class="section grid">'+COPY_PACKAGES.map(p=>'<article class="feature"><span class="tag">1-TAP · BASE · BANKR</span><h3>'+esc(p.name)+'</h3><p class="muted">'+esc(p.scope)+'</p><div class="price">'+money(p.price_cents)+'</div><button class="primary full" onclick="buyCopyPackage(\''+p.id+'\')">1-Tap Pay + Buy</button><button class="secondary full" onclick="previewCopyPackage(\''+p.id+'\')">Preview manifest</button></article>').join("")+'</section><section class="section notice"><strong>Settlement:</strong> Base/BANKR checkout is initiated server-side; no BANKR key is exposed in the browser. Fulfillment occurs only after verified payment.</section>')}
function previewCopyPackage(id){const p=COPY_PACKAGES.find(x=>x.id===id);if(!p)return;const blob=new Blob([JSON.stringify(packageManifest(p),null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=p.id+"-manifest.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("Manifest downloaded; payment is not included")}
async function buyCopyPackage(id){if(!COPY_PACKAGES.find(x=>x.id===id))return;if(!session){route("profile");return}toast("Preparing one-use Base/BANKR entitlement…");const {data,error}=await supabase.functions.invoke("create-copy-package-checkout",{body:{package_id:id,origin:location.origin+APP_BASE+"packages/"}});if(error||data?.error)return toast(error?.message||data?.error||"Copy checkout is not configured yet");if(data?.checkout_url)location.href=data.checkout_url;else toast("Payment intent created; awaiting verified settlement")}
function growthRecommendations(){return PRODUCTS.filter(p=>!state.favorites.includes(p.id)).slice(0,4)}
function home(){
 shell('<section class="hero"><div class="hero-card"><div class="eyebrow">THE MULTIVERSE MARKET COMMERCE OS</div><h1>SHOP.<br>EARN.<br>REPEAT.</h1><p>One fast, mobile-first place for products, drops, rewards, referrals and merchant growth.</p><div class="hero-actions"><a class="primary" href="shop/">Explore Shop →</a><a class="secondary" href="merchant/">Sell on The Multiverse Market</a></div><div class="trust-row"><span>✓ Mobile-first</span><span>✓ PWA-ready</span><span>✓ Human-first</span></div></div><div class="wallet-card"><div><div class="eyebrow">THE MULTIVERSE MARKET ACCOUNT</div><div class="balance">'+(session?(profileData?.tier||"Free"):"Guest")+'</div><div class="status"><span class="dot"></span>'+(session?"Signed in":"Guest mode")+'</div></div><div><p class="muted">'+cartCount()+' item(s) in cart.</p><a class="secondary" href="cart/">Open Cart</a></div></div></section>'+
 '<section class="section stats"><div class="stat">Cart<strong>'+cartCount()+'</strong></div><div class="stat">Orders<strong>'+((profileData&&profileData.orders_count)||0)+'</strong></div><div class="stat">Rewards<strong>'+((profileData&&profileData.rewards_balance)||0)+'</strong></div><div class="stat">Tier<strong>'+esc(profileData?.tier||"Guest")+'</strong></div></section>'+
 '<section class="section feature-grid"><div class="feature"><span class="tag">POINHI • 23 GATES</span><h3>1-Tap $24 package</h3><p class="muted">$1 allocation for each of the 23 Yin/Yang/Yong gates plus a $1 USDC settlement credit. Base USDC checkout is live.</p><a class="primary" href="shop/?product=1156">1-Tap Pay — $24 USDC →</a><p class="muted">USD₮/Tether is not enabled as a live rail until its exact supported network and contract are verified.</p></div></section><section class="section"><div class="feature welcome-banner"><span class="tag">GROW TOGETHER</span><h3>🎁 Invite friends to The Multiverse Market</h3><p class="muted">New members get 500 Rewards through your invite link.</p><button class="primary" onclick="copyReferral()">Copy my invite →</button></div><div class="section-head"><h2>Trending</h2><a class="secondary" href="shop/">All products</a></div><div class="grid">'+PRODUCTS.slice(0,4).map(productCard).join("")+'</div></section>'+
 '<section class="section feature-grid"><div class="feature"><div class="feature-icon">↻</div><h3>Repeat commerce</h3><p class="muted">Replenishment-ready shopping experiences.</p></div><div class="feature"><div class="feature-icon">↗</div><h3>Built to spread</h3><p class="muted">Share links and referral identity are first-class actions.</p></div><div class="feature"><div class="feature-icon">◇</div><h3>Merchant engine</h3><p class="muted">A foundation for catalog and merchant growth.</p></div></section>'+
 '<section class="section newsletter"><div><div class="eyebrow">THE MULTIVERSE MARKET SIGNAL</div><h2>Get drops and store alerts</h2><p class="muted">Join the The Multiverse Market list.</p></div><div class="inline-form"><input id="email" class="search" type="email" autocomplete="email" placeholder="you@example.com"><button class="primary" onclick="subscribe()">Join</button></div></section>');
}
function shop(){
 shell('<div class="section-head"><div><div class="eyebrow">MARKETPLACE</div><h2>Discover your next buy</h2></div><a class="secondary" href="cart/">Cart ('+cartCount()+')</button></div>'+
 '<div class="toolbar"><input id="search" class="search" autocomplete="off" placeholder="Search products, categories…"><select id="filter" class="search"><option value="all">All categories</option>'+[...new Set(PRODUCTS.map(p=>p.cat))].map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join("")+'</select></div><div id="shopGrid" class="grid">'+PRODUCTS.map(productCard).join("")+'</div>');
 const filter=()=>{const q=$("#search").value.trim().toLowerCase(),c=$("#filter").value;const list=PRODUCTS.filter(p=>(c==="all"||p.cat===c)&&(p.name+" "+p.cat+" "+p.desc).toLowerCase().includes(q));$("#shopGrid").innerHTML=list.length?list.map(productCard).join(""):'<div class="empty wide">No matching products.</div>'};
 $("#search").oninput=filter;$("#filter").onchange=filter;
 const productId=new URLSearchParams(location.search).get("product");
 if(productId) setTimeout(()=>openProduct(Number(productId)),0);
}
function drops(){shell('<div class="drop-banner"><div class="eyebrow">DROP CENTER</div><h2>Member Drop</h2><p class="muted">Catalog availability is shown from the live product database.</p><div class="count">LIVE</div></div><div class="grid section">'+PRODUCTS.filter(p=>p.tag==="DROP").map(productCard).join("")+'</div>')}
function rewards(){
 if(!session){shell('<div class="eyebrow">LOYALTY</div><h2>Rewards</h2><div class="notice section">Sign in to access verified purchase rewards and your referral identity.<br><button class="primary" onclick="route(\'profile\')">Sign in</button></div>');return}
 shell('<div class="eyebrow">LOYALTY</div><h2>Rewards</h2><section class="section feature welcome-banner"><span class="tag">NEW MEMBER PERK</span><h2>🎁 Get 500 Rewards just for joining</h2><p class="muted">Share your referral link and your friend gets 500 too. You earn 250 when they join through your link.</p><button class="primary" onclick="copyReferral()">Invite a friend →</button></section><p class="muted">Rewards are credited from verified successful payments.</p><section class="section stats"><div class="stat">Credits<strong>'+((profileData&&profileData.rewards_balance)||0)+'</strong></div><div class="stat">Membership<strong>'+esc(profileData?.tier||"Free")+'</strong></div><div class="stat">Favorites<strong>'+state.favorites.length+'</strong></div><div class="stat">Referral<strong>'+esc((profileData?.referral_code||"").slice(-6))+'</strong></div></section><section class="section split"><div class="feature"><span class="tag">MEMBERSHIP</span><h2>The Multiverse Market Member</h2><p class="muted">Membership billing can be connected to a live recurring Stripe Price when configured.</p></div><div class="feature"><span class="tag">REFERRAL</span><h2>Share & earn</h2><p class="muted">'+esc(profileData?.referral_code||"")+'</p><button class="secondary" onclick="copyReferral()">Copy referral link</button></div></section>');
}
async function confirmCryptoPayment(){const pid=Number(document.querySelector("#cryptoPaymentId")?.value),tx=document.querySelector("#cryptoTxHash")?.value.trim();if(!pid||!tx)return toast("Enter the payment ID and Base transaction hash");const {data,error}=await supabase.functions.invoke("confirm-crypto-payment",{body:{payment_id:pid,tx_hash:tx}});if(error||data?.error)return toast(error?.message||data?.error||"Confirmation failed");toast("USDC payment confirmed");route("profile")}
const USDC_CONTRACT="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
async function createCryptoCheckout(asset="USDC"){if(!session){route("profile");return}const items=cartItems();if(!items.length)return toast("Cart is empty");const b=document.querySelector("#cryptoCheckoutBtn");if(b){b.disabled=true;b.textContent="Preparing "+asset+" 1-Tap checkout…"}const {data,error}=await supabase.functions.invoke("create-crypto-checkout",{body:{asset,items:items.map(x=>({product_id:x.p.id,quantity:x.qty}))}});if(error||data?.error){toast(error?.message||data?.error||"Stablecoin checkout unavailable");if(b){b.disabled=false;b.textContent="Create "+asset+" payment →"}return}const box=document.querySelector("#cryptoPaymentResult");if(box)box.innerHTML='<div class="notice"><strong>1-Tap '+esc(data.asset)+' · '+esc(data.amount_usd)+' USD</strong>'+(data.discount_bps?'<p><strong>POINHI gated stablecoin discount: '+esc(String(data.discount_bps/100))+'%</strong></p>':"")+'<p class="muted">Network: '+esc(data.network)+' · Receiving address</p><code class="address">'+esc(data.receiving_address)+'</code><button class="secondary" onclick="copyText('+JSON.stringify(data.receiving_address)+')">Copy address</button><p class="muted">Payment ID: '+esc(String(data.payment_id))+' · expires '+esc(new Date(data.expires_at).toLocaleTimeString())+'</p><p class="muted">Send only the selected stablecoin on the displayed network. Payment is marked paid only after on-chain confirmation.</p><input id="cryptoPaymentId" class="search full" value="'+esc(String(data.payment_id))+'" inputmode="numeric"><input id="cryptoTxHash" class="search full" placeholder="Transaction hash (0x…)"><button class="secondary full" onclick="confirmCryptoPayment()">Confirm onchain payment →</button></div>';if(b){b.disabled=false;b.textContent="Create "+asset+" payment →"}}
function crypto(){shell('<div class="eyebrow">THE MULTIVERSE MARKET · POINHI</div><h2>Onchain Stablecoin Center</h2><p class="muted">23 gated POINHI marketplace units with 1-Tap stablecoin checkout. Base USDC and Ethereum USDt rails are available where supported.</p><section class="section grid"><div class="feature"><span class="tag">USDC · BASE</span><h3>1-Tap USDC</h3><p class="muted">POINHI-gated purchases receive a 5% stablecoin checkout discount.</p><button id="cryptoCheckoutBtn" class="primary" onclick="createCryptoCheckout('USDC')">Pay with USDC →</button></div><div class="feature"><span class="tag">USD₮ · ETHEREUM</span><h3>1-Tap USDt</h3><p class="muted">USDt checkout uses Tether’s supported Ethereum ERC-20 rail.</p><button class="primary" onclick="createCryptoCheckout('USDT')">Pay with USDt →</button></div><div id="cryptoPaymentResult" class="feature"></div></section><section class="section notice"><strong>23-gate POINHI:</strong> Yin 01–08 · Yang 09–16 · Yong 17–23. These are gated marketplace access units; this build does not claim that a new blockchain token contract was minted.</section><section class="section notice"><strong>Network safety:</strong> Tether's official supported-protocol list does not list Base for USDt, so USDt is routed to Ethereum rather than pretending Base USDt is supported.</section>');if(new URLSearchParams(location.search).get("autobuy")==="1")setTimeout(()=>createCryptoCheckout("USDC"),0);}
async function refreshCustomerOrders(){if(!session)return;const {data,error}=await supabase.from("orders").select("id,total_cents,status,created_at,shipping_status,carrier,tracking_number,tracking_url").eq("user_id",session.user.id).order("created_at",{ascending:false}).limit(50);if(error)return toast("Could not refresh orders");const box=$("#customerOrders");if(!box)return;box.innerHTML=data?.length?'<div class="table-wrap"><table class="table"><tr><th>Order</th><th>Total</th><th>Status</th><th>Shipping</th></tr>'+data.map(o=>'<tr><td>'+esc(o.id.slice(0,8))+'</td><td>'+money(o.total_cents)+'</td><td>'+esc(o.status)+'</td><td><strong>'+esc(o.shipping_status||"unfulfilled")+'</strong>'+(o.tracking_number?' · '+esc(o.carrier||"Tracking")+' '+esc(o.tracking_number):"")+(o.tracking_url?' <a href="'+esc(o.tracking_url)+'" target="_blank" rel="noopener">Track</a>':"")+'</td></tr>').join("")+'</table></div>':'<div class="empty">No orders yet.</div>'}
function wallet(){shell('<div class="eyebrow">WALLET</div><h2>Wallet</h2><div class="notice section"><strong>Commerce wallet:</strong> The Multiverse Market keeps customer payment credentials out of the browser. Stripe Checkout handles payment authorization and settlement.</div><section class="section split"><div class="feature"><h3>Account</h3><p class="muted">'+(session?"Signed in as "+esc(session.user.email||"member"):"Guest checkout requires an account.")+'</p><button class="secondary" onclick="route(\'profile\')">'+(session?"Open profile":"Sign in")+'</button></div><div class="feature"><h3>Orders</h3><p class="muted">Verified orders and fulfillment tracking appear below.</p><button class="secondary" onclick="refreshCustomerOrders()">Refresh orders</button></div></section><section class="section"><div class="section-head"><h2>Your orders</h2><button class="secondary" onclick="refreshCustomerOrders()">Refresh</button></div><div id="customerOrders"><div class="empty">Loading…</div></div></section>');refreshCustomerOrders()}
async function profile(){
 if(!session){shell('<div class="eyebrow">ACCOUNT</div><h2>Join The Multiverse Market</h2><section class="section split"><div class="feature"><span class="tag">SIGN IN</span><h3>Welcome back</h3><input id="authEmail" class="search full" type="email" placeholder="Email"><input id="authPassword" class="search full" type="password" placeholder="Password"><button class="primary full" onclick="signIn()">Sign in</button></div><div class="feature"><span class="tag">NEW ACCOUNT</span><h3>Create account</h3><input id="newName" class="search full" placeholder="Display name"><input id="newEmail" class="search full" type="email" placeholder="Email"><input id="newPassword" class="search full" type="password" placeholder="Password (6+ characters)"><button class="secondary full" onclick="signUp()">Create account</button><p class="muted">Email confirmation may be required.</p></div></section>');return}
 const {data:orders,error}=await supabase.from("orders").select("id,total_cents,status,created_at,shipping_status,carrier,tracking_number,tracking_url").eq("user_id",session.user.id).order("created_at",{ascending:false});
 const rows=error?'<div class="empty">Unable to load orders.</div>':orders?.length?'<table class="table"><tr><th>Order</th><th>Total</th><th>Status</th></tr>'+orders.map(o=>'<tr><td>'+esc(o.id.slice(0,8))+'</td><td>'+money(o.total_cents)+'</td><td>'+esc(o.status)+'</td></tr>').join("")+'</table>':'<div class="empty">No orders yet.</div>';
 shell('<div class="eyebrow">PROFILE</div><h2>Your The Multiverse Market workspace</h2><div class="split section"><div class="feature"><h3>'+esc(profileData?.display_name||"The Multiverse Market member")+'</h3><p class="muted">'+esc(session.user.email||"")+'</p><p>Tier: <strong>'+esc(profileData?.tier||"Free")+'</strong></p><p>Rewards: <strong>'+((profileData?.rewards_balance)||0)+'</strong></p><p>Referral: <strong>'+esc(profileData?.referral_code||"")+'</strong></p><button class="secondary" onclick="copyReferral()">Copy referral</button></div><div class="feature"><h3>Account</h3><p class="muted">Your orders and verified rewards are stored server-side.</p><button class="secondary" onclick="signOut()">Sign out</button></div></div><section class="section"><h2>Orders</h2>'+rows+'</section>');
}
function cart(){
 const items=cartItems();
 shell('<div class="section-head"><div><div class="eyebrow">CART</div><h2>Your cart</h2></div><a class="secondary" href="shop/">Continue shopping</a></div>'+
 (items.length?'<section class="section">'+items.map(x=>'<div class="cart-row"><div><strong>'+esc(x.p.name)+'</strong><div class="muted">'+money(x.p.price)+' each</div></div><div class="qty"><button data-qty="-1" data-id="'+x.p.id+'">−</button><strong>'+x.qty+'</strong><button data-qty="1" data-id="'+x.p.id+'">+</button></div><strong>'+money(x.p.price*x.qty)+'</strong><button class="secondary" data-remove="'+x.p.id+'">Remove</button></div>').join("")+'</section><section class="section notice"><strong>Total: '+money(cartTotal())+'</strong><a class="primary" href="/The Multiverse Market/checkout/">Checkout →</a></section>':'<div class="empty section">Your cart is empty.<br><a class="primary" href="shop/">Shop now</a></div>'));
}
function checkout(){
 const items=cartItems();
 if(!items.length){route("cart");return}
 shell('<div class="eyebrow">CHECKOUT</div><h2>Secure Checkout</h2><div class="split section"><div class="feature"><h3>Order summary</h3>'+items.map(x=>'<p>'+esc(x.p.name)+' × '+x.qty+' <strong class="float">'+money(x.p.price*x.qty)+'</strong></p>').join("")+'<hr><h3>Total <span class="float">'+money(cartTotal())+'</span></h3></div><div class="feature"><h3>Payment</h3><div class="notice">Stripe-hosted checkout handles card payment details. The Multiverse Market does not receive your card number. <strong>Physical items:</strong> shipping address and shipping option are collected securely during checkout.</div><div class="crypto-pay section"><strong>Crypto</strong><p class="muted">Base / USDC and supported wallet rails are available through the The Multiverse Market Crypto Center.</p><button class="secondary" onclick="route(\'crypto\')">Open Crypto Center →</button></div>'+(session?'<button class="primary full" onclick="startCheckout()">Pay securely →</button>':'<button class="primary full" onclick="route(\'profile\')">Sign in to checkout →</button>')+'</div></div>',"Checkout");
}
async function loadMerchantCatalog(){
  if(!session || !["merchant","admin"].includes(profileData?.role)) return;
  const {data,error}=await supabase.from("products").select("id,name,category,description,price_cents,currency,icon,tag,repeat_purchase,active,inventory").eq("merchant_id",session.user.id).order("id",{ascending:false});
  const box=$("#merchantCatalog"); if(!box)return;
  if(error){box.innerHTML='<div class="notice">Unable to load your catalog: '+esc(error.message)+'</div>';return}
  if(!data?.length){box.innerHTML='<div class="empty">No merchant products yet. Create your first listing above.</div>';return}
  box.innerHTML='<div class="merchant-products">'+data.map(p=>'<div class="cart-row merchant-product '+(p.active?"":"inactive")+'"><div><span class="tag">'+esc(p.tag||"LIVE")+'</span><strong>'+esc(p.name)+'</strong><div class="muted">'+esc(p.category||"Featured")+' · '+money(p.price_cents)+' · '+(p.active?"Active":"Inactive")+(p.inventory==null?"":" · "+p.inventory+" in stock")+'</div></div><div class="card-actions"><button class="secondary" data-edit-product="'+p.id+'">Edit</button><button class="secondary" data-toggle-product="'+p.id+'" data-active="'+p.active+'">'+(p.active?"Deactivate":"Activate")+'</button></div></div>').join("")+'</div>';
}
async function createMerchantProduct(){
  if(!session)return toast("Sign in to post an item");
  const name=$("#productName")?.value.trim(),category=$("#productCategory")?.value.trim()||"Featured",description=$("#productDescription")?.value.trim(),price=Number($("#productPrice")?.value),inventoryRaw=$("#productInventory")?.value.trim();
  if(!name)return toast("Product name is required");
  if(!Number.isFinite(price)||price<0)return toast("Enter a valid price");
  const inventory=inventoryRaw===""?null:Math.max(0,Math.floor(Number(inventoryRaw)));
  if(inventoryRaw!==""&&!Number.isFinite(inventory))return toast("Enter valid inventory");
  const attestations={seller:!!$("#sellerAttestation")?.checked,ownership:!!$("#ownershipAttestation")?.checked,prohibited:!!$("#prohibitedAttestation")?.checked};
  if(!attestations.seller||!attestations.ownership||!attestations.prohibited)return toast("Complete all seller safety attestations");
  const payload={merchant_id:session.user.id,name,category,description,price_cents:Math.round(price*100),currency:"usd",icon:$("#productIcon")?.value.trim()||"✦",tag:$("#productTag")?.value.trim()||"USER LISTING",repeat_purchase:!!$("#productRepeat")?.checked,active:false,inventory,sale_gate:"community_review",seller_attested:true,ownership_attested:true,prohibited_goods_attested:true,sale_terms_version:"multiverse-market-community-v1",metadata:{shippable:!!$("#productShippable")?.checked,image_url:$("#productImage")?.value.trim()||"",shareable:true,one_tap_buy:true,review_status:"pending"}};
  const {data:created,error}=await supabase.from("products").insert(payload).select("id").single();
  if(error)return toast(error.message);
  const {error:reviewError}=await supabase.from("marketplace_listing_reviews").insert({product_id:created.id,seller_user_id:session.user.id,status:"pending",seller_attestation:true,ownership_attestation:true,prohibited_goods_attestation:true,terms_version:"multiverse-market-community-v1"});
  if(reviewError){await supabase.from("products").delete().eq("id",created.id).eq("merchant_id",session.user.id);return toast(reviewError.message)}
  toast("Submitted for safety review — not yet public");["productName","productCategory","productDescription","productImage","productPrice","productInventory","productIcon","productTag"].forEach(id=>{const el=$("#"+id);if(el)el.value=""});$("#productRepeat").checked=false;$("#sellerAttestation").checked=false;$("#ownershipAttestation").checked=false;$("#prohibitedAttestation").checked=false;
  await loadProducts();await loadMerchantCatalog();render();
}
async function editMerchantProduct(id){
  if(!session)return;
  const {data:p,error}=await supabase.from("products").select("id,name,category,description,price_cents,icon,tag,repeat_purchase,inventory").eq("id",id).eq("merchant_id",session.user.id).maybeSingle();
  if(error||!p)return toast("Product not found");
  const name=prompt("Product name",p.name);if(name===null)return;
  const price=prompt("Price in USD",String((p.price_cents/100).toFixed(2)));if(price===null)return;
  const description=prompt("Description",p.description||"");if(description===null)return;
  const category=prompt("Category",p.category||"Featured");if(category===null)return;
  const inventory=prompt("Inventory (blank = unlimited)",p.inventory==null?"":String(p.inventory));if(inventory===null)return;
  const n=Number(price),inv=inventory.trim()===""?null:Math.max(0,Math.floor(Number(inventory)));
  if(!Number.isFinite(n)||n<0|| (inventory.trim()!==""&&!Number.isFinite(inv)))return toast("Invalid product values");
  const {error:updateError}=await supabase.from("products").update({name:name.trim(),price_cents:Math.round(n*100),description,category,inventory}).eq("id",id).eq("merchant_id",session.user.id);
  if(updateError)return toast(updateError.message);
  toast("Product updated");await loadProducts();await loadMerchantCatalog();render();
}
async function toggleMerchantProduct(id,active){
  if(!session)return;
  const {error}=await supabase.from("products").update({active}).eq("id",id).eq("merchant_id",session.user.id);
  if(error)return toast(error.message);
  toast(active?"Product activated":"Product deactivated");await loadProducts();await loadMerchantCatalog();
}
async function updateFulfillment(orderId,status){
 if(!session)return toast("Sign in required");
 const carrier=prompt("Carrier (UPS, USPS, FedEx, DHL, etc.)","");if(carrier===null)return;
 const tracking=status==="shipped"||status==="delivered"?prompt("Tracking number",""):null;if((status==="shipped"||status==="delivered")&&tracking===null)return;
 const trackingUrl=(status==="shipped"||status==="delivered")?prompt("Tracking URL (optional)",""):null;
 const {data,error}=await supabase.functions.invoke("update-fulfillment",{body:{order_id:orderId,shipping_status:status,carrier,tracking_number:tracking||"",tracking_url:trackingUrl||""}});
 if(error||data?.error)return toast(error?.message||data?.error||"Fulfillment update failed");
 toast("Fulfillment updated");loadMerchantDashboard();
}
async function loadMerchantDashboard(){
 if(!session || !["merchant","admin"].includes(profileData?.role)) return;
 const {data,error}=await supabase.functions.invoke("merchant-dashboard",{body:{}});
 const box=$("#merchantOrders"); if(!box)return;
 if(error){box.innerHTML='<div class="notice">Unable to load sales: '+esc(error.message)+'</div>';return}
 const rows=data?.rows||[];
 const paid=rows.filter(r=>["paid","completed","succeeded"].includes(String(r.status||"").toLowerCase()));
 const revenue=paid.reduce((n,r)=>n+Number(r.line_total_cents||0),0);
 const units=paid.reduce((n,r)=>n+Number(r.quantity||0),0);
 const uniqueOrders=new Set(paid.map(r=>r.order_id)).size;
 $("#merchantStats").innerHTML='<div class="stat">Revenue<strong>'+money(revenue)+'</strong></div><div class="stat">Orders<strong>'+uniqueOrders+'</strong></div><div class="stat">Units<strong>'+units+'</strong></div><div class="stat">All lines<strong>'+rows.length+'</strong></div>';
 if(!rows.length){box.innerHTML='<div class="empty">No orders for your products yet.</div>';return}
 box.innerHTML='<div class="table-wrap"><table class="table"><tr><th>Order</th><th>Date</th><th>Customer</th><th>Product</th><th>Qty</th><th>Line total</th><th>Status</th><th>Fulfillment</th></tr>'+rows.map(r=>'<tr><td>'+esc(String(r.order_id).slice(0,8))+'</td><td>'+esc(new Date(r.created_at).toLocaleDateString())+'</td><td>'+esc(r.customer_email||"—")+'</td><td>'+esc(r.product_name)+'</td><td>'+esc(r.quantity)+'</td><td>'+money(r.line_total_cents)+'</td><td>'+esc(r.status)+'</td><td><strong>'+esc(r.shipping_status||"unfulfilled")+'</strong>'+(r.tracking_number?'<br><a href="'+esc(r.tracking_url||"#")+'" target="_blank" rel="noopener">'+esc(r.carrier||"Tracking")+' '+esc(r.tracking_number)+'</a>':"")+'<br><button class="secondary" onclick="updateFulfillment('+JSON.stringify(r.order_id)+',\'processing\')">Process</button> <button class="secondary" onclick="updateFulfillment('+JSON.stringify(r.order_id)+',\'shipped\')">Ship</button> <button class="secondary" onclick="updateFulfillment('+JSON.stringify(r.order_id)+',\'delivered\')">Deliver</button></td></tr>').join("")+'</table></div>';
}
async function loadMyListings(){
 if(!session)return;
 const {data,error}=await supabase.from("products").select("id,name,category,price_cents,active,inventory,metadata").eq("merchant_id",session.user.id).order("created_at",{ascending:false}).limit(100);
 const box=$("#myListings");if(!box)return;
 if(error){box.innerHTML='<div class="empty">Could not load your listings.</div>';return}
 box.innerHTML=data?.length?'<div class="table-wrap"><table class="table"><tr><th>Item</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr>'+data.map(p=>'<tr><td>'+esc(p.name)+'<br><span class="muted">'+esc(p.category||"Featured")+'</span></td><td>'+money(p.price_cents)+'</td><td>'+esc(p.inventory==null?"Unlimited":String(p.inventory))+'</td><td>'+esc(p.active?"Live":"Hidden")+'</td><td><button class="secondary" onclick="editMerchantProduct('+p.id+')">Edit</button> <button class="secondary" onclick="toggleMerchantProduct('+p.id+','+(!p.active)+')">'+(p.active?"Hide":"Publish")+'</button></td></tr>').join("")+'</table></div>':'<div class="empty">You have not posted an item yet.</div>';
}
let connectInstance=null;
async function loadSellerConnectStatus(){
 if(!session)return;
 const box=$("#sellerConnect");if(!box)return;
 const {data,error}=await supabase.functions.invoke("seller-connect",{body:{action:"status"}});
 if(error||data?.error){box.innerHTML='<div class="notice">Seller payments setup is unavailable right now.</div>';return}
 if(!data?.connected){box.innerHTML='<div class="feature"><span class="tag">SELLER PAYMENTS</span><h3>Get paid through The Multiverse Market</h3><p class="muted">Complete Stripe verification inside The Multiverse Market to receive marketplace payouts.</p><button class="primary" onclick="startSellerOnboarding()">Set up seller payouts →</button></div>';return}
 const s=data.status||{};const ready=!!s.charges_enabled&&!!s.payouts_enabled;
 box.innerHTML='<div class="feature"><span class="tag">SELLER PAYMENTS</span><h3>'+(ready?'Payouts ready':'Finish seller verification')+'</h3><p class="muted">'+(ready?'Your connected account is enabled for charges and payouts.':'Stripe still needs information before charges or payouts can be enabled.')+'</p><div class="trust-row"><span>Charges: '+(s.charges_enabled?'✓ enabled':'Pending')+'</span><span>Payouts: '+(s.payouts_enabled?'✓ enabled':'Pending')+'</span><span>Verification: '+(s.details_submitted?'✓ submitted':'Pending')+'</span></div><button class="primary" onclick="startSellerOnboarding()">'+(ready?'Manage seller account →':'Continue verification →')+'</button></div>';
}
async function startSellerOnboarding(){
 if(!session)return route("profile");
 const box=$("#sellerConnect");if(box)box.innerHTML='<div class="feature"><span class="tag">SELLER PAYMENTS</span><h3>Loading secure Stripe onboarding…</h3><p class="muted">Your verification form stays inside The Multiverse Market.</p></div>';
 const {data,error}=await supabase.functions.invoke("seller-connect",{body:{action:"ensure"}});
 if(error||data?.error){if(box)box.innerHTML='<div class="notice">'+esc(error?.message||data?.error||"Could not create seller account")+'</div>';return}
 const sessionRes=await supabase.functions.invoke("seller-connect",{body:{action:"session"}});
 if(sessionRes.error||sessionRes.data?.error){if(box)box.innerHTML='<div class="notice">'+esc(sessionRes.error?.message||sessionRes.data?.error||"Could not open onboarding")+'</div>';return}
 const clientSecret=sessionRes.data?.client_secret;const publishableKey=sessionRes.data?.publishable_key;if(!clientSecret||!publishableKey){if(box)box.innerHTML='<div class="notice">Stripe Connect needs the live publishable key configured on the backend.</div>';return;}
 try{
   const mod=await import("https://cdn.jsdelivr.net/npm/@stripe/connect-js@latest/+esm");
   const loadConnectAndInitialize=mod.loadConnectAndInitialize;
   if(!loadConnectAndInitialize)throw new Error("Stripe Connect JS could not initialize");
   connectInstance=loadConnectAndInitialize({publishableKey,fetchClientSecret:async()=>clientSecret});
   const host=document.createElement("div");host.className="section feature";
   const onboarding=connectInstance.create("account-onboarding");
   onboarding.setOnExit(()=>loadSellerConnectStatus());
   host.appendChild(onboarding);
   if(box){box.innerHTML="";box.appendChild(host)}
 }catch(e){if(box)box.innerHTML='<div class="notice">Stripe onboarding could not load. Please refresh and try again.</div>'}
}
function merchant(){
 if(!session){shell('<div class="eyebrow">SELL ON THE MULTIVERSE MARKET</div><h2>Post an item</h2><p class="muted">Create an account to list an item for other customers to discover and buy.</p><section class="section feature"><button class="primary" onclick="route(\'profile\')">Sign in / create account</button></section>');return}
 shell('<div class="eyebrow">SELL ON THE MULTIVERSE MARKET</div><h2>Post an item</h2><p class="muted">Anyone with a The Multiverse Market account can submit a public listing. New community listings are held inactive until the safety/ownership gate is approved; approved listings become individually shareable and 1-Tap buyable.</p><section id="sellerConnect" class="section"></section><section class="section notice"><strong>Community sale gate:</strong> do not list stolen, counterfeit, infringing, illegal, unsafe, regulated, or otherwise prohibited goods. You must have authority to sell the item and provide truthful ownership/title/licensing information. Approval is not legal advice or a guarantee of title.</section><section class="section feature"><span class="tag">LISTING</span><div class="split"><div><input id="productName" class="search full" placeholder="Item name"><input id="productCategory" class="search full" placeholder="Category" value="Marketplace"><textarea id="productDescription" class="search full" placeholder="Describe the item"></textarea><input id="productImage" class="search full" type="url" placeholder="Product image URL (optional)"></div><div><input id="productPrice" class="search full" type="number" min="0" step="0.01" placeholder="Price (USD)"><input id="productInventory" class="search full" type="number" min="0" step="1" placeholder="Inventory (blank = unlimited)"><input id="productIcon" class="search full" placeholder="Icon" value="✦"><input id="productTag" class="search full" placeholder="Tag" value="USER LISTING"><label class="muted"><input id="productRepeat" type="checkbox"> Repeat purchase</label><br><label class="muted"><input id="productShippable" type="checkbox" checked> Physical item — collect shipping address</label><hr><label class="muted"><input id="sellerAttestation" type="checkbox"> I am authorized to sell this item.</label><br><label class="muted"><input id="ownershipAttestation" type="checkbox"> I have truthful ownership/title/licensing information.</label><br><label class="muted"><input id="prohibitedAttestation" type="checkbox"> This listing is not prohibited or unlawful.</label></div></div><button class="primary full" onclick="createMerchantProduct()">Submit for safety review</button></section><section class="section"><div class="section-head"><div><div class="eyebrow">MY LISTINGS</div><h2>Your posted items</h2></div><button class="secondary" onclick="loadMyListings()">Refresh</button></div><div id="myListings"><div class="empty">Loading…</div></div></section><section class="section"><div class="section-head"><div><div class="eyebrow">SELLER CENTER</div><h2>Your sales & fulfillment</h2></div><button class="secondary" onclick="loadSellerDashboard()">Refresh</button></div><div id="sellerStats" class="stats"><div class="stat">Revenue<strong>—</strong></div><div class="stat">Orders<strong>—</strong></div><div class="stat">Units<strong>—</strong></div><div class="stat">Lines<strong>—</strong></div></div><div id="sellerOrders"><div class="empty">Loading sales…</div></div></section>');
 loadMyListings();loadSellerDashboard();loadSellerConnectStatus();
}
async function updateSellerFulfillment(orderId,status){
 if(!session)return;
 const carrier=prompt("Carrier (optional)",""); if(carrier===null)return;
 const tracking=prompt("Tracking number (optional)",""); if(tracking===null)return;
 const trackingUrl=tracking?prompt("Tracking URL (optional)","")||"":""; 
 const {data,error}=await supabase.functions.invoke("seller-fulfillment",{body:{order_id:orderId,shipping_status:status,carrier,tracking_number:tracking,tracking_url:trackingUrl}});
 if(error||data?.error)return toast(error?.message||data?.error||"Fulfillment update failed");
 toast("Fulfillment updated"); loadSellerDashboard();
}
async function loadSellerDashboard(){
 if(!session)return;
 const {data,error}=await supabase.functions.invoke("seller-dashboard");
 const stats=$("#sellerStats"),box=$("#sellerOrders"); if(!stats||!box)return;
 if(error||data?.error){stats.innerHTML='<div class="stat">Seller center<strong>Unavailable</strong></div>';box.innerHTML='<div class="notice">Seller data could not be loaded.</div>';return}
 stats.innerHTML='<div class="stat">Revenue<strong>'+money(data.revenue_cents||0)+'</strong></div><div class="stat">Orders<strong>'+esc(data.orders||0)+'</strong></div><div class="stat">Units<strong>'+esc(data.units||0)+'</strong></div><div class="stat">Lines<strong>'+esc((data.lines||[]).length)+'</strong></div>';
 box.innerHTML=data.lines?.length?'<div class="table-wrap"><table class="table"><tr><th>Order</th><th>Item</th><th>Qty</th><th>Status</th><th>Shipping</th></tr>'+data.lines.map(x=>'<tr><td>'+esc(String(x.order_id).slice(0,8))+'</td><td>'+esc(x.product_name)+'</td><td>'+esc(x.quantity)+'</td><td>'+esc(x.order?.status||"")+'</td><td>'+esc(x.order?.shipping_status||"unfulfilled")+(x.order?.tracking_number?' · '+esc(x.order.carrier||"Tracking")+' '+esc(x.order.tracking_number):"")+'</td></tr>').join("")+'</table></div>':'<div class="empty">No customer sales yet.</div>';
}
function gaia(){shell('<div class="eyebrow">GAIA</div><h2>Human-first commerce</h2><section class="section feature-grid"><div class="feature"><h3>Transparent</h3><p class="muted">No fabricated balances, scarcity or transactions.</p></div><div class="feature"><h3>Accessible</h3><p class="muted">Responsive layouts and large touch targets across devices.</p></div><div class="feature"><h3>Responsible</h3><p class="muted">Payments, identity and sensitive credentials stay with their proper providers.</p></div></section>')}
async function seller(){
 const sellerId=new URLSearchParams(location.search).get("id");
 if(!sellerId){shell('<div class="notice">Seller not found.</div>');return}
 const {data:profile}=await supabase.from("profiles").select("id,display_name,tier").eq("id",sellerId).maybeSingle();
 const products=PRODUCTS.filter(p=>p.merchant_id===sellerId);
 const name=profile?.display_name||"The Multiverse Market Seller";
 shell('<div class="section-head"><div><div class="eyebrow">SELLER STORE</div><h2>'+esc(name)+'</h2><p class="muted">'+esc(profile?.tier||"Seller")+' · '+products.length+' active products</p></div><button class="secondary" onclick="route("shop")">Back to Shop</button></div><section class="section seller-hero feature"><div class="seller-avatar">'+esc(name.slice(0,1).toUpperCase())+'</div><h2>'+esc(name)+'</h2><p class="muted">Browse this seller’s The Multiverse Market catalog.</p></section><section class="section"><div class="grid">'+(products.length?products.map(productCard).join(""):'<div class="empty wide">No active products yet.</div>')+'</div></section>');
}
async function communityReview(){
 if(!session||profileData?.role!=="admin"){shell('<div class="section notice">Community review is restricted to authorized The Multiverse Market administrators.</div>');return}
 const {data,error}=await supabase.from("marketplace_listing_reviews").select("id,product_id,seller_user_id,status,created_at,products!inner(name,category,description,price_cents)").eq("status","pending").order("created_at",{ascending:true});
 if(error){shell('<div class="section notice">'+esc(error.message)+'</div>');return}
 const rows=(data||[]).map(x=>'<article class="section feature"><span class="tag">PENDING REVIEW</span><h3>'+esc(x.products?.name||"Listing")+'</h3><p class="muted">'+esc(x.products?.category||"Marketplace")+' · '+money(x.products?.price_cents||0)+'</p><p>'+esc(x.products?.description||"")+'</p><div class="card-actions"><button class="primary" onclick="approveCommunityListing(\''+x.id+'\','+x.product_id+')">Approve & publish</button><button class="secondary" onclick="rejectCommunityListing(\''+x.id+'\','+x.product_id+')">Reject</button></div></article>').join("");
 shell('<div class="eyebrow">COMMUNITY SAFETY</div><h2>Listing review queue</h2><p class="muted">Approve only after checking seller authority, ownership/title/licensing representations, and legality. Approval activates the listing for 1-Tap purchase.</p>'+(rows||'<div class="empty section">No pending listings.</div>'));
}
async function approveCommunityListing(reviewId,productId){
 if(!session||profileData?.role!=="admin")return;
 const {error:rerr}=await supabase.from("marketplace_listing_reviews").update({status:"approved",reviewer_user_id:session.user.id,reviewed_at:new Date().toISOString()}).eq("id",reviewId).eq("status","pending");
 if(rerr)return toast(rerr.message);
 const {error:perr}=await supabase.from("products").update({active:true,sale_gate:"standard"}).eq("id",productId);
 if(perr)return toast(perr.message);
 toast("Listing approved and published");communityReview();
}
async function rejectCommunityListing(reviewId,productId){
 if(!session||profileData?.role!=="admin")return;
 const {error:rerr}=await supabase.from("marketplace_listing_reviews").update({status:"rejected",reviewer_user_id:session.user.id,reviewed_at:new Date().toISOString()}).eq("id",reviewId).eq("status","pending");
 if(rerr)return toast(rerr.message);
 await supabase.from("products").update({active:false}).eq("id",productId);
 toast("Listing rejected");communityReview();
}
function notFound(){shell('<section class="section feature"><div class="eyebrow">THE MULTIVERSE MARKET</div><h2>Page not found</h2><p class="muted">That destination is not available. Use the buttons below to continue.</p><div class="hero-actions"><button class="primary" onclick="route(\'home\')">Home</button><button class="secondary" onclick="route(\'shop\')">Shop</button><button class="secondary" onclick="route(\'profile\')">Profile</button></div></section>', "Page not found")}
document.addEventListener("click",e=>{const b=e.target.closest("[data-buy]");if(b){e.preventDefault();buyNow(Number(b.dataset.buy));}});
function render(){
 const relative=location.pathname.startsWith(APP_BASE)?location.pathname.slice(APP_BASE.length):"";
 const page=(relative.split("/").filter(Boolean)[0]||"home").toLowerCase();
 document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x.dataset.nav===page));
 ({home,shop,packages,crypto,drops,rewards,wallet,profile,cart,checkout,merchant,gaia,seller,communityReview}[page]||notFound)();
}
async function openProduct(id){
 const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
 const image=p.metadata?.image_url;
 $("#modal").innerHTML='<div class="modal-backdrop" onclick="closeModal()"></div><div class="modal-card"><button class="modal-close" onclick="closeModal()">×</button><div class="product-modal-art">'+(image?'<img class="product-image large-image" src="'+esc(image)+'" alt="'+esc(p.name)+'">':'<span>'+esc(p.icon)+'</span>')+'</div><span class="tag">'+esc(p.tag)+'</span><h2>'+esc(p.name)+'</h2><p class="muted">'+esc(p.desc)+'</p><div class="price">'+money(p.price)+'</div><div class="card-actions"><button class="primary" onclick="buyNow('+p.id+');closeModal()">1-Tap Buy</button><button class="primary" onclick="buyOnchainNow('+p.id+');closeModal()">1-Tap Onchain</button><button class="secondary" onclick="addToCart('+p.id+');closeModal()">Add to cart</button><button class="secondary" onclick="shareProduct('+p.id+')">Share listing</button></div><div class="notice">Purchase is payment-gated. Ownership, title, licensing, shipping, taxes, and regulated-item requirements remain the seller/buyer responsibility.</div><div id="productReviews"><div class="muted">Loading reviews…</div></div></div>';
 $("#modal").classList.remove("hidden"); await loadProductReviews(p.id);
}
function closeModal(){$("#modal").classList.add("hidden");$("#modal").innerHTML=""}
function addToCart(id){state.cart[id]=(Number(state.cart[id])||0)+1;save();toast("Added to cart");render()}
function changeQty(id,delta){state.cart[id]=Math.max(0,(Number(state.cart[id])||0)+delta);if(!state.cart[id])delete state.cart[id];save();render()}
function removeFromCart(id){delete state.cart[id];save();render();toast("Removed")}
async function toggleFav(id){
 if(state.favorites.includes(id))state.favorites=state.favorites.filter(x=>x!==id);else state.favorites.push(id);
 save();
 if(session){
   if(state.favorites.includes(id))await supabase.from("favorites").upsert({user_id:session.user.id,product_id:id});
   else await supabase.from("favorites").delete().eq("user_id",session.user.id).eq("product_id",id);
 }
 render();
}
async function shareProduct(id){
 const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
 const url=location.origin+APP_BASE+"shop/?product="+encodeURIComponent(id);
 try{if(navigator.share)await navigator.share({title:p.name,text:"Check out "+p.name+" on The Multiverse Market",url});else await navigator.clipboard.writeText(url);toast("Share link ready")}catch{}
}
async function loadProductReviews(productId){
 const box=$("#productReviews"); if(!box)return;
 const {data,error}=await supabase.from("product_reviews").select("rating,title,body,created_at").eq("product_id",productId).order("created_at",{ascending:false}).limit(30);
 if(error){box.innerHTML='<div class="section notice">Reviews are temporarily unavailable.</div>';return}
 const avg=data?.length?(data.reduce((n,r)=>n+Number(r.rating||0),0)/data.length).toFixed(1):"—";
 box.innerHTML='<section class="section"><div class="section-head"><h3>Reviews</h3><span class="tag">★ '+avg+'</span></div>'+(data?.length?data.map(r=>'<article class="review"><strong>'+("★".repeat(Number(r.rating||0)))+'</strong><div><strong>'+esc(r.title||"Verified purchase")+'</strong><p class="muted">'+esc(r.body||"")+'</p></div></article>').join(""):'<div class="empty">No reviews yet.</div>')+'</section>';
 if(session) box.innerHTML+='<section class="section feature"><h3>Leave a review</h3><select id="reviewRating" class="search full"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><input id="reviewTitle" class="search full" placeholder="Title"><textarea id="reviewBody" class="search full" placeholder="What did you think?"></textarea><button class="secondary full" onclick="submitReview('+productId+')">Submit review</button></section>';
}
async function submitReview(productId){
 if(!session)return toast("Sign in to review a purchase");
 const rating=Number($("#reviewRating")?.value||0),title=$("#reviewTitle")?.value.trim(),body=$("#reviewBody")?.value.trim();
 const {data:items}=await supabase.from("order_items").select("order_id,orders!inner(id,user_id,status)").eq("product_id",productId).eq("orders.user_id",session.user.id);
 const order=(items||[]).find(x=>["paid","succeeded","complete","completed"].includes(String(x.orders?.status||"").toLowerCase()));
 if(!order)return toast("Only verified purchasers can review this item");
 const {error}=await supabase.from("product_reviews").insert({product_id:productId,user_id:session.user.id,order_id:order.order_id,rating,title,body});
 if(error)return toast(error.code==="23505"?"You already reviewed this purchase":"Could not submit review");
 toast("Review submitted"); await loadProductReviews(productId);
}
function isShippable(p){if(!p)return false;const m=p.metadata||{};if(typeof m.shippable==="boolean")return m.shippable;return !["digital","service","auto"].includes(String(p.cat||"").toLowerCase())}
async function startCheckout(){
 if(!session){route("profile");return}
 const items=cartItems();if(!items.length){toast("Cart is empty");return}
 const button=document.querySelector("#view .primary");
 if(button){button.disabled=true;button.textContent="Opening secure checkout…"}
 const idempotencyKey=crypto.randomUUID();
 const {data,error}=await supabase.functions.invoke("create-checkout-session",{body:{items:items.map(x=>({product_id:x.p.id,quantity:x.qty})),origin:location.origin+APP_BASE+"checkout/?checkout=success",idempotency_key:idempotencyKey}});
 if(error){toast(error.message||"Checkout unavailable");if(button){button.disabled=false;button.textContent="Pay securely →"}return}
 if(data?.url){location.href=data.url}else{toast(data?.error||"Checkout unavailable");if(button){button.disabled=false;button.textContent="Pay securely →"}}
}
async function loadProfile(){
 if(!session){profileData=null;return}
 const {data,error}=await supabase.from("profiles").select("id,email,display_name,role,referral_code,rewards_balance,tier").eq("id",session.user.id).maybeSingle();
 if(!error)profileData=data;
}
async function settleCheckoutRewards(){
 const q=new URLSearchParams(location.search);
 if(q.get("checkout")!=="success"||!session)return;
 toast("Payment received — verifying your The Multiverse Market Rewards…");
 for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,i?1500:500));await loadProfile();const {data}=await supabase.from("orders").select("id,status").eq("user_id",session.user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();if(data?.status==="paid"||data?.status==="succeeded"||data?.status==="complete"){toast("🎁 Purchase verified — Rewards added automatically");render();return}}
 toast("Payment received. Rewards will appear automatically once payment confirmation posts.");
}
async function loadFavorites(){
 if(!session)return;
 const {data}=await supabase.from("favorites").select("product_id").eq("user_id",session.user.id);
 if(data){state.favorites=data.map(x=>Number(x.product_id));save()}
}
async function signIn(){
 const email=$("#authEmail")?.value.trim(),password=$("#authPassword")?.value;
 if(!email||!password)return toast("Enter email and password");
 const {error}=await supabase.auth.signInWithPassword({email,password});
 if(error)return toast(error.message);toast("Signed in");
}
async function claimWelcome(){ const ref=new URLSearchParams(location.search).get("ref")||""; const {data,error}=await supabase.rpc("claim_welcome_reward",{p_referral_code:ref}); if(error)return; if(data?.claimed){toast("🎁 Welcome! +500 The Multiverse Market Rewards"); await loadProfile(); render()} }
async function signUp(){
 const name=$("#newName")?.value.trim(),email=$("#newEmail")?.value.trim(),password=$("#newPassword")?.value;
 if(!email||!password)return toast("Enter email and password");
 if(password.length<6)return toast("Password must be at least 6 characters");
 const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name,referral_code:new URLSearchParams(location.search).get("ref")||null},emailRedirectTo:location.origin+APP_BASE+"profile/"}});
 if(error)return toast(error.message);
 toast(data.session?"Account created — 🎁 500 Rewards ready":"Check your email to confirm your account"); if(data.session)setTimeout(claimWelcome,250);
}
async function signOut(){await supabase.auth.signOut();session=null;profileData=null;toast("Signed out");render()}
async function subscribe(){
 const email=$("#email")?.value.trim();if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast("Enter a valid email");
 const {error}=await supabase.from("newsletter_subscribers").insert({email,user_id:session?.user?.id||null});
 if(error&&error.code!=="23505")return toast(error.message);toast("You're on the The Multiverse Market list");
}
async function merchantLead(){
 const email=$("#merchantEmail")?.value.trim(),business_name=$("#merchantBusiness")?.value.trim(),note=$("#merchantNote")?.value.trim();
 if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast("Enter a valid email");
 const {error}=await supabase.from("merchant_leads").insert({email,business_name,note,user_id:session?.user?.id||null});
 if(error)return toast(error.message);toast("Merchant interest saved");
}
async function copyReferral(){
 if(!profileData?.referral_code)return toast("Sign in first");
 copyText(location.origin+APP_BASE+"profile/?ref="+encodeURIComponent(profileData.referral_code));
}
async function copyText(text){
 try{await navigator.clipboard.writeText(text);toast("Copied")}catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();toast("Copied")}
}

document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-nav]");if(nav){route(nav.dataset.nav);return}
 const add=e.target.closest("[data-add]");if(add){addToCart(Number(add.dataset.add));return}
 const fav=e.target.closest("[data-fav]");if(fav){toggleFav(Number(fav.dataset.fav));return}
 const share=e.target.closest("[data-share]");if(share){shareProduct(Number(share.dataset.share));return}
 const qty=e.target.closest("[data-qty]");if(qty){changeQty(Number(qty.dataset.id),Number(qty.dataset.qty));return}
 const remove=e.target.closest("[data-remove]");if(remove){removeFromCart(Number(remove.dataset.remove));return}
 const product=e.target.closest("[data-product]");if(product){openProduct(Number(product.dataset.product));return}
 const edit=e.target.closest("[data-edit-product]");if(edit){editMerchantProduct(Number(edit.dataset.editProduct));return}
 const toggle=e.target.closest("[data-toggle-product]");if(toggle){toggleMerchantProduct(Number(toggle.dataset.toggleProduct),toggle.dataset.active!=="true");return}
});
$("#desktopNav").innerHTML=navHtml();$("#mobileNav").innerHTML=navHtml();
$("#themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";applyTheme();save()};
$("#walletBtn").onclick=()=>route("wallet");
window.addEventListener("popstate",render);
if(session) setTimeout(claimWelcome,350);
window.addEventListener("storage",()=>{state=loadState();applyTheme();render()});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register(APP_BASE+"sw.js").catch(()=>{}));

window.route=route;window.packages=packages;window.buyCopyPackage=buyCopyPackage;window.previewCopyPackage=previewCopyPackage;window.closeModal=closeModal;window.addToCart=addToCart;window.submitReview=submitReview;window.loadSellerDashboard=loadSellerDashboard;window.updateSellerFulfillment=updateSellerFulfillment;window.changeQty=changeQty;window.removeFromCart=removeFromCart;
window.startCheckout=startCheckout;window.signIn=signIn;window.signUp=signUp;window.signOut=signOut;window.subscribe=subscribe;
window.startSellerOnboarding=startSellerOnboarding;window.loadSellerConnectStatus=loadSellerConnectStatus;window.merchantLead=merchantLead;window.loadMerchantDashboard=loadMerchantDashboard;window.updateFulfillment=updateFulfillment;window.createMerchantProduct=createMerchantProduct;window.loadMerchantCatalog=loadMerchantCatalog;window.editMerchantProduct=editMerchantProduct;window.toggleMerchantProduct=toggleMerchantProduct;window.copyReferral=copyReferral;window.copyText=copyText;window.money=money;window.render=render;

async function boot(){
 applyTheme();
 const s=await supabase.auth.getSession();session=s.data.session;
 await loadProfile();await loadFavorites();render();await settleCheckoutRewards();
 supabase.auth.onAuthStateChange(async(_event,s)=>{session=s;await loadProfile();if(s)await loadFavorites();render()});
}
boot().catch(e=>{console.error(e);toast("The Multiverse Market backend connection needs attention");render()});


function updateQuickCart(){const el=document.querySelector("#quickCartCount");if(el)el.textContent=String(cartCount())}document.addEventListener("click",e=>{if(e.target.closest("#quickCart"))route("cart");setTimeout(updateQuickCart,0)});setTimeout(updateQuickCart,500);
