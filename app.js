import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://qwjjaxzmneawwppcpaap.supabase.co";
const SUPABASE_KEY = "sb_publishable_X1eIeVVNUOHuhmL_10bkDw_1HuT4Vcq";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const FALLBACK_PRODUCTS = [
  {id:1,name:"Rollin Starter Bundle",cat:"Featured",price:12000,icon:"✦",desc:"Launch bundle with member perks.",tag:"FEATURED",repeat:true},
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
  const {data,error}=await supabase.from("products").select("id,name,category,description,price_cents,currency,icon,tag,repeat_purchase,active,inventory").eq("active",true).order("id",{ascending:true});
  if(error){console.warn("Live product catalog unavailable; using fallback catalog.",error);return false}
  const live=(data||[]).map(p=>({id:Number(p.id),name:p.name,cat:p.category||"Featured",price:Number(p.price_cents||0),currency:(p.currency||"usd").toLowerCase(),icon:p.icon||"✦",desc:p.description||"",tag:p.tag||"LIVE",repeat:!!p.repeat_purchase,inventory:p.inventory})).filter(p=>Number.isFinite(p.id)&&p.price>=0);
  if(live.length){PRODUCTS=live;return true}
  return false;
}

const NAV = [
  ["home","⌂","Home"],["shop","▦","Shop"],["drops","◈","Drops"],["rewards","★","Rewards"],
  ["wallet","◉","Wallet"],["profile","●","Profile"],["gaia","♧","Gaia"],["merchant","◇","Sell"]
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
function loadState(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem("rollin-state")||"{}")}}catch{return {...DEFAULT}}}
function save(){localStorage.setItem("rollin-state",JSON.stringify(state))}
function toast(msg){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2200)}
function applyTheme(){document.documentElement.dataset.theme=state.theme||"dark"}
function cartItems(){return Object.entries(state.cart||{}).map(([id,qty])=>({p:PRODUCTS.find(p=>p.id===Number(id)),qty:Number(qty)})).filter(x=>x.p&&x.qty>0)}
function cartCount(){return cartItems().reduce((n,x)=>n+x.qty,0)}
function cartTotal(){return cartItems().reduce((n,x)=>n+x.p.price*x.qty,0)}
function navHtml(){return NAV.map(([id,ic,label])=>'<button class="nav-link" data-nav="'+id+'" aria-label="'+label+'"><span>'+ic+'</span><span>'+label+'</span></button>').join("")}

function shell(content,title=""){
  document.title = title ? title+" — Rollin" : "Rollin — Shop. Earn. Unlock. Repeat.";
  $("#view").innerHTML='<div class="page">'+content+'<footer class="footer"><strong>Rollin</strong> commerce. Payments are processed by Stripe Checkout; card data is not stored by this site.</footer></div>';
  window.scrollTo({top:0,behavior:"instant"});
}
function productCard(p){
  const fav=state.favorites.includes(p.id);
  return '<article class="card">'+
    '<button class="product-art" data-product="'+p.id+'" aria-label="View '+esc(p.name)+'"><span>'+esc(p.icon)+'</span><span class="art-glow"></span></button>'+
    '<div class="card-body"><span class="tag">'+esc(p.tag)+'</span><h3>'+esc(p.name)+'</h3><p class="muted">'+esc(p.desc)+'</p>'+
    '<div class="price">'+money(p.price)+'</div><div class="card-actions">'+
    '<button class="primary" data-add="'+p.id+'">Add</button><button class="secondary" data-share="'+p.id+'">Share</button>'+
    '<button class="fav '+(fav?"on":"")+'" data-fav="'+p.id+'" aria-label="Favorite">'+(fav?"♥":"♡")+'</button></div></div></article>';
}

function home(){
 shell('<section class="hero"><div class="hero-card"><div class="eyebrow">ROLLIN COMMERCE OS</div><h1>SHOP.<br>EARN.<br>REPEAT.</h1><p>One fast, mobile-first place for products, drops, rewards, referrals and merchant growth.</p><div class="hero-actions"><button class="primary" onclick="location.hash=\'shop\'">Explore Shop →</button><button class="secondary" onclick="location.hash=\'merchant\'">Sell on Rollin</button></div><div class="trust-row"><span>✓ Mobile-first</span><span>✓ PWA-ready</span><span>✓ Human-first</span></div></div><div class="wallet-card"><div><div class="eyebrow">ROLLIN ACCOUNT</div><div class="balance">'+(session?(profileData?.tier||"Free"):"Guest")+'</div><div class="status"><span class="dot"></span>'+(session?"Signed in":"Guest mode")+'</div></div><div><p class="muted">'+cartCount()+' item(s) in cart.</p><button class="secondary" onclick="location.hash=\'cart\'">Open Cart</button></div></div></section>'+
 '<section class="section stats"><div class="stat">Cart<strong>'+cartCount()+'</strong></div><div class="stat">Orders<strong>'+((profileData&&profileData.orders_count)||0)+'</strong></div><div class="stat">Rewards<strong>'+((profileData&&profileData.rewards_balance)||0)+'</strong></div><div class="stat">Tier<strong>'+esc(profileData?.tier||"Guest")+'</strong></div></section>'+
 '<section class="section"><div class="section-head"><h2>Trending</h2><button class="secondary" onclick="location.hash=\'shop\'">All products</button></div><div class="grid">'+PRODUCTS.slice(0,4).map(productCard).join("")+'</div></section>'+
 '<section class="section feature-grid"><div class="feature"><div class="feature-icon">↻</div><h3>Repeat commerce</h3><p class="muted">Replenishment-ready shopping experiences.</p></div><div class="feature"><div class="feature-icon">↗</div><h3>Built to spread</h3><p class="muted">Share links and referral identity are first-class actions.</p></div><div class="feature"><div class="feature-icon">◇</div><h3>Merchant engine</h3><p class="muted">A foundation for catalog and merchant growth.</p></div></section>'+
 '<section class="section newsletter"><div><div class="eyebrow">ROLLIN SIGNAL</div><h2>Get drops and store alerts</h2><p class="muted">Join the Rollin list.</p></div><div class="inline-form"><input id="email" class="search" type="email" autocomplete="email" placeholder="you@example.com"><button class="primary" onclick="subscribe()">Join</button></div></section>');
}
function shop(){
 shell('<div class="section-head"><div><div class="eyebrow">MARKETPLACE</div><h2>Discover your next buy</h2></div><button class="secondary" onclick="location.hash=\'cart\'">Cart ('+cartCount()+')</button></div>'+
 '<div class="toolbar"><input id="search" class="search" autocomplete="off" placeholder="Search products, categories…"><select id="filter" class="search"><option value="all">All categories</option>'+[...new Set(PRODUCTS.map(p=>p.cat))].map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join("")+'</select></div><div id="shopGrid" class="grid">'+PRODUCTS.map(productCard).join("")+'</div>');
 const filter=()=>{const q=$("#search").value.trim().toLowerCase(),c=$("#filter").value;const list=PRODUCTS.filter(p=>(c==="all"||p.cat===c)&&(p.name+" "+p.cat+" "+p.desc).toLowerCase().includes(q));$("#shopGrid").innerHTML=list.length?list.map(productCard).join(""):'<div class="empty wide">No matching products.</div>'};
 $("#search").oninput=filter;$("#filter").onchange=filter;
}
function drops(){shell('<div class="drop-banner"><div class="eyebrow">DROP CENTER</div><h2>Member Drop</h2><p class="muted">Catalog availability is shown from the live product database.</p><div class="count">LIVE</div></div><div class="grid section">'+PRODUCTS.filter(p=>p.tag==="DROP").map(productCard).join("")+'</div>')}
function rewards(){
 if(!session){shell('<div class="eyebrow">LOYALTY</div><h2>Rewards</h2><div class="notice section">Sign in to access verified purchase rewards and your referral identity.<br><button class="primary" onclick="location.hash=\'profile\'">Sign in</button></div>');return}
 shell('<div class="eyebrow">LOYALTY</div><h2>Rewards</h2><p class="muted">Rewards are credited from verified successful payments.</p><section class="section stats"><div class="stat">Credits<strong>'+((profileData&&profileData.rewards_balance)||0)+'</strong></div><div class="stat">Membership<strong>'+esc(profileData?.tier||"Free")+'</strong></div><div class="stat">Favorites<strong>'+state.favorites.length+'</strong></div><div class="stat">Referral<strong>'+esc((profileData?.referral_code||"").slice(-6))+'</strong></div></section><section class="section split"><div class="feature"><span class="tag">MEMBERSHIP</span><h2>Rollin Member</h2><p class="muted">Membership billing can be connected to a live recurring Stripe Price when configured.</p></div><div class="feature"><span class="tag">REFERRAL</span><h2>Share & earn</h2><p class="muted">'+esc(profileData?.referral_code||"")+'</p><button class="secondary" onclick="copyReferral()">Copy referral link</button></div></section>');
}
async function confirmCryptoPayment(){const pid=Number(document.querySelector("#cryptoPaymentId")?.value),tx=document.querySelector("#cryptoTxHash")?.value.trim();if(!pid||!tx)return toast("Enter the payment ID and Base transaction hash");const {data,error}=await supabase.functions.invoke("confirm-crypto-payment",{body:{payment_id:pid,tx_hash:tx}});if(error||data?.error)return toast(error?.message||data?.error||"Confirmation failed");toast("USDC payment confirmed");location.hash="profile"}
async function createCryptoCheckout(){if(!session){location.hash="profile";return}const items=cartItems();if(!items.length)return toast("Cart is empty");const b=document.querySelector("#cryptoCheckoutBtn");if(b){b.disabled=true;b.textContent="Preparing USDC checkout…"}const {data,error}=await supabase.functions.invoke("create-crypto-checkout",{body:{items:items.map(x=>({product_id:x.p.id,quantity:x.qty}))}});if(error||data?.error){toast(error?.message||data?.error||"Crypto checkout unavailable");if(b){b.disabled=false;b.textContent="Create USDC payment →"}return}const box=document.querySelector("#cryptoPaymentResult");if(box)box.innerHTML='<div class="notice"><strong>Send '+esc(data.amount_usdc)+' USDC on Base</strong><p class="muted">Receiving address</p><code class="address">'+esc(data.receiving_address)+'</code><button class="secondary" onclick="copyText('+JSON.stringify(data.receiving_address)+')">Copy address</button><p class="muted">Payment ID: '+esc(String(data.payment_id))+' · expires '+esc(new Date(data.expires_at).toLocaleTimeString())+'</p><p class="muted">Only send USDC on Base to this address. The payment is not marked paid until on-chain confirmation.</p><input id="cryptoPaymentId" class="search full" value="'+esc(String(data.payment_id))+'" inputmode="numeric" placeholder="Payment ID"><input id="cryptoTxHash" class="search full" placeholder="Base transaction hash (0x…)"><button class="secondary full" onclick="confirmCryptoPayment()">Confirm payment →</button></div>';if(b){b.disabled=false;b.textContent="Create USDC payment →"}}
function crypto(){shell('<div class="eyebrow">ROLLIN CRYPTO</div><h2>Crypto Center</h2><p class="muted">Base USDC checkout with a dedicated on-chain payment record.</p><section class="section grid"><div class="feature"><span class="tag">BASE</span><h3>Base / USDC</h3><p class="muted">Create a payment request for the current cart and send USDC on Base.</p><button id="cryptoCheckoutBtn" class="primary" onclick="createCryptoCheckout()">Create USDC payment →</button><div id="cryptoPaymentResult"></div></div><div class="feature"><span class="tag">COINBASE</span><h3>Coinbase Business</h3><p class="muted">Business payment, transfer and treasury rail.</p><a class="secondary" href="https://www.coinbase.com/business" target="_blank" rel="noopener">Open Coinbase Business</a></div><div class="feature"><span class="tag">WALLETS</span><h3>Wallets</h3><p class="muted">Trust Wallet, Coinbase Wallet and compatible EVM wallets can be used to send USDC on Base.</p></div><div class="feature"><span class="tag">EXCHANGES</span><h3>Exchange rails</h3><p class="muted">Robinhood, Kraken and Binance remain treasury/provider adapters; credentials must stay server-side.</p></div></section><section class="section notice"><strong>Security:</strong> private keys and exchange secrets never belong in the Rollin browser or GitHub repository.</section>');}
function wallet(){shell('<div class="eyebrow">WALLET</div><h2>Wallet</h2><div class="notice section"><strong>Commerce wallet:</strong> Rollin keeps customer payment credentials out of the browser. Stripe Checkout handles payment authorization and settlement.</div><section class="section split"><div class="feature"><h3>Account</h3><p class="muted">'+(session?"Signed in as "+esc(session.user.email||"member"):"Guest checkout requires an account.")+'</p><button class="secondary" onclick="location.hash=\'profile\'">'+(session?"Open profile":"Sign in")+'</button></div><div class="feature"><h3>Orders</h3><p class="muted">Verified orders appear in your account after payment confirmation.</p><button class="secondary" onclick="location.hash=\'profile\'">View orders</button></div></section>')}
async function profile(){
 if(!session){shell('<div class="eyebrow">ACCOUNT</div><h2>Join Rollin</h2><section class="section split"><div class="feature"><span class="tag">SIGN IN</span><h3>Welcome back</h3><input id="authEmail" class="search full" type="email" placeholder="Email"><input id="authPassword" class="search full" type="password" placeholder="Password"><button class="primary full" onclick="signIn()">Sign in</button></div><div class="feature"><span class="tag">NEW ACCOUNT</span><h3>Create account</h3><input id="newName" class="search full" placeholder="Display name"><input id="newEmail" class="search full" type="email" placeholder="Email"><input id="newPassword" class="search full" type="password" placeholder="Password (6+ characters)"><button class="secondary full" onclick="signUp()">Create account</button><p class="muted">Email confirmation may be required.</p></div></section>');return}
 const {data:orders,error}=await supabase.from("orders").select("id,total_cents,status,created_at").eq("user_id",session.user.id).order("created_at",{ascending:false});
 const rows=error?'<div class="empty">Unable to load orders.</div>':orders?.length?'<table class="table"><tr><th>Order</th><th>Total</th><th>Status</th></tr>'+orders.map(o=>'<tr><td>'+esc(o.id.slice(0,8))+'</td><td>'+money(o.total_cents)+'</td><td>'+esc(o.status)+'</td></tr>').join("")+'</table>':'<div class="empty">No orders yet.</div>';
 shell('<div class="eyebrow">PROFILE</div><h2>Your Rollin workspace</h2><div class="split section"><div class="feature"><h3>'+esc(profileData?.display_name||"Rollin member")+'</h3><p class="muted">'+esc(session.user.email||"")+'</p><p>Tier: <strong>'+esc(profileData?.tier||"Free")+'</strong></p><p>Rewards: <strong>'+((profileData?.rewards_balance)||0)+'</strong></p><p>Referral: <strong>'+esc(profileData?.referral_code||"")+'</strong></p><button class="secondary" onclick="copyReferral()">Copy referral</button></div><div class="feature"><h3>Account</h3><p class="muted">Your orders and verified rewards are stored server-side.</p><button class="secondary" onclick="signOut()">Sign out</button></div></div><section class="section"><h2>Orders</h2>'+rows+'</section>');
}
function cart(){
 const items=cartItems();
 shell('<div class="section-head"><div><div class="eyebrow">CART</div><h2>Your cart</h2></div><button class="secondary" onclick="location.hash=\'shop\'">Continue shopping</button></div>'+
 (items.length?'<section class="section">'+items.map(x=>'<div class="cart-row"><div><strong>'+esc(x.p.name)+'</strong><div class="muted">'+money(x.p.price)+' each</div></div><div class="qty"><button data-qty="-1" data-id="'+x.p.id+'">−</button><strong>'+x.qty+'</strong><button data-qty="1" data-id="'+x.p.id+'">+</button></div><strong>'+money(x.p.price*x.qty)+'</strong><button class="secondary" data-remove="'+x.p.id+'">Remove</button></div>').join("")+'</section><section class="section notice"><strong>Total: '+money(cartTotal())+'</strong><button class="primary" onclick="location.hash=\'checkout\'">Checkout →</button></section>':'<div class="empty section">Your cart is empty.<br><button class="primary" onclick="location.hash=\'shop\'">Shop now</button></div>'));
}
function checkout(){
 const items=cartItems();
 if(!items.length){location.hash="cart";return}
 shell('<div class="eyebrow">CHECKOUT</div><h2>Secure Checkout</h2><div class="split section"><div class="feature"><h3>Order summary</h3>'+items.map(x=>'<p>'+esc(x.p.name)+' × '+x.qty+' <strong class="float">'+money(x.p.price*x.qty)+'</strong></p>').join("")+'<hr><h3>Total <span class="float">'+money(cartTotal())+'</span></h3></div><div class="feature"><h3>Payment</h3><div class="notice">Stripe-hosted checkout handles card payment details. Rollin does not receive your card number.</div><div class="crypto-pay section"><strong>Crypto</strong><p class="muted">Base / USDC and supported wallet rails are available through the Rollin Crypto Center.</p><button class="secondary" onclick="location.hash='crypto'">Open Crypto Center →</button></div>'+(session?'<button class="primary full" onclick="startCheckout()">Pay securely →</button>':'<button class="primary full" onclick="location.hash=\'profile\'">Sign in to checkout →</button>')+'</div></div>',"Checkout");
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
  if(!session || !["merchant","admin"].includes(profileData?.role))return toast("Merchant access is not approved");
  const name=$("#productName")?.value.trim(),category=$("#productCategory")?.value.trim()||"Featured",description=$("#productDescription")?.value.trim(),price=Number($("#productPrice")?.value),inventoryRaw=$("#productInventory")?.value.trim();
  if(!name)return toast("Product name is required");
  if(!Number.isFinite(price)||price<0)return toast("Enter a valid price");
  const inventory=inventoryRaw===""?null:Math.max(0,Math.floor(Number(inventoryRaw)));
  if(inventoryRaw!==""&&!Number.isFinite(inventory))return toast("Enter valid inventory");
  const payload={merchant_id:session.user.id,name,category,description,price_cents:Math.round(price*100),currency:"usd",icon:$("#productIcon")?.value.trim()||"✦",tag:$("#productTag")?.value.trim()||"MERCHANT",repeat_purchase:!!$("#productRepeat")?.checked,active:true,inventory};
  const {error}=await supabase.from("products").insert(payload);
  if(error)return toast(error.message);
  toast("Product published");["productName","productCategory","productDescription","productPrice","productInventory","productIcon","productTag"].forEach(id=>{const el=$("#"+id);if(el)el.value=""});$("#productRepeat").checked=false;
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
async function loadMerchantDashboard(){
  if(!session || !["merchant","admin"].includes(profileData?.role)) return;
  const {data,error}=await supabase.rpc("merchant_dashboard");
  const box=$("#merchantOrders"); if(!box)return;
  if(error){box.innerHTML='<div class="notice">Unable to load sales: '+esc(error.message)+'</div>';return}
  const rows=data||[];
  const paid=rows.filter(r=>["paid","completed","succeeded"].includes(String(r.status||"").toLowerCase()));
  const revenue=paid.reduce((n,r)=>n+Number(r.line_total_cents||0),0);
  const units=paid.reduce((n,r)=>n+Number(r.quantity||0),0);
  const uniqueOrders=new Set(paid.map(r=>r.order_id)).size;
  $("#merchantStats").innerHTML='<div class="stat">Revenue<strong>'+money(revenue)+'</strong></div><div class="stat">Orders<strong>'+uniqueOrders+'</strong></div><div class="stat">Units<strong>'+units+'</strong></div><div class="stat">All lines<strong>'+rows.length+'</strong></div>';
  if(!rows.length){box.innerHTML='<div class="empty">No orders for your products yet.</div>';return}
  box.innerHTML='<div class="table-wrap"><table class="table"><tr><th>Order</th><th>Date</th><th>Customer</th><th>Product</th><th>Qty</th><th>Line total</th><th>Status</th></tr>'+rows.map(r=>'<tr><td>'+esc(String(r.order_id).slice(0,8))+'</td><td>'+esc(new Date(r.created_at).toLocaleDateString())+'</td><td>'+esc(r.customer_email||"—")+'</td><td>'+esc(r.product_name)+'</td><td>'+esc(r.quantity)+'</td><td>'+money(r.line_total_cents)+'</td><td>'+esc(r.status)+'</td></tr>').join("")+'</table></div>';
}
function merchant(){
 if(!session){shell('<div class="eyebrow">MERCHANTS</div><h2>Sell on Rollin</h2><p class="muted">Sign in first, then request merchant onboarding.</p><section class="section feature"><button class="primary" onclick="location.hash=\'profile\'">Sign in / create account</button></section>');return}
 if(!["merchant","admin"].includes(profileData?.role)){
  shell('<div class="eyebrow">MERCHANTS</div><h2>Sell on Rollin</h2><p class="muted">Your account is currently <strong>'+esc(profileData?.role||"customer")+'</strong>. Request merchant onboarding below.</p><section class="section split"><div class="feature"><span class="tag">ONBOARDING</span><h3>Tell us about your business</h3><input id="merchantEmail" class="search full" type="email" value="'+esc(session.user.email||"")+'" placeholder="Business email"><input id="merchantBusiness" class="search full" placeholder="Business name"><textarea id="merchantNote" class="search full" placeholder="What do you sell?"></textarea><button class="primary full" onclick="merchantLead()">Request access</button></div><div class="feature"><span class="tag">HOW IT WORKS</span><h3>Protected seller console</h3><p class="muted">Approved merchants get catalog and sales access limited to their own products.</p></div></section>');return}
 shell('<div class="eyebrow">MERCHANT CONSOLE</div><h2>Sell & manage</h2><p class="muted">Run your catalog and monitor verified order activity from one place.</p><section id="merchantStats" class="section stats"><div class="stat">Revenue<strong>—</strong></div><div class="stat">Orders<strong>—</strong></div><div class="stat">Units<strong>—</strong></div><div class="stat">All lines<strong>—</strong></div></section><section class="section feature"><span class="tag">NEW PRODUCT</span><div class="split"><div><input id="productName" class="search full" placeholder="Product name"><input id="productCategory" class="search full" placeholder="Category" value="Featured"><textarea id="productDescription" class="search full" placeholder="Description"></textarea></div><div><input id="productPrice" class="search full" type="number" min="0" step="0.01" placeholder="Price (USD)"><input id="productInventory" class="search full" type="number" min="0" step="1" placeholder="Inventory (blank = unlimited)"><input id="productIcon" class="search full" placeholder="Icon" value="✦"><input id="productTag" class="search full" placeholder="Tag" value="MERCHANT"><label class="muted"><input id="productRepeat" type="checkbox"> Repeat purchase</label></div></div><button class="primary full" onclick="createMerchantProduct()">Publish product</button></section><section class="section"><div class="section-head"><h2>Managed products</h2><button class="secondary" onclick="loadMerchantCatalog()">Refresh</button></div><div id="merchantCatalog"><div class="empty">Loading catalog…</div></div></section><section class="section"><div class="section-head"><div><div class="eyebrow">SALES</div><h2>Order activity</h2></div><button class="secondary" onclick="loadMerchantDashboard()">Refresh</button></div><div id="merchantOrders"><div class="empty">Loading sales…</div></div></section>');
 loadMerchantCatalog();loadMerchantDashboard();
}
function gaia(){shell('<div class="eyebrow">GAIA</div><h2>Human-first commerce</h2><section class="section feature-grid"><div class="feature"><h3>Transparent</h3><p class="muted">No fabricated balances, scarcity or transactions.</p></div><div class="feature"><h3>Accessible</h3><p class="muted">Responsive layouts and large touch targets across devices.</p></div><div class="feature"><h3>Responsible</h3><p class="muted">Payments, identity and sensitive credentials stay with their proper providers.</p></div></section>')}
function render(){
 const page=(location.hash.slice(1)||"home").split("?")[0];
 document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x.dataset.nav===page));
 ({home,shop,crypto,drops,rewards,wallet,profile,cart,checkout,merchant,gaia}[page]||home)();
}
function openProduct(id){
 const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
 $("#modal").innerHTML='<div class="modal-backdrop" onclick="closeModal()"></div><div class="modal-card"><button class="modal-close" onclick="closeModal()">×</button><div class="product-art large"><span>'+esc(p.icon)+'</span></div><span class="tag">'+esc(p.tag)+'</span><h2>'+esc(p.name)+'</h2><p class="muted">'+esc(p.desc)+'</p><div class="price">'+money(p.price)+'</div><button class="primary full" onclick="addToCart('+p.id+');closeModal()">Add to cart</button></div>';
 $("#modal").classList.remove("hidden");
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
 const url=location.origin+location.pathname+"#shop?product="+id;
 try{if(navigator.share)await navigator.share({title:p.name,text:"Check out "+p.name+" on Rollin",url});else await navigator.clipboard.writeText(url);toast("Share link ready")}catch{}
}
async function startCheckout(){
 if(!session){location.hash="profile";return}
 const items=cartItems();if(!items.length){toast("Cart is empty");return}
 const button=document.querySelector("#view .primary");
 if(button){button.disabled=true;button.textContent="Opening secure checkout…"}
 const idempotencyKey=crypto.randomUUID();
 const {data,error}=await supabase.functions.invoke("create-checkout-session",{body:{items:items.map(x=>({product_id:x.p.id,quantity:x.qty})),origin:location.origin+location.pathname,idempotency_key:idempotencyKey}});
 if(error){toast(error.message||"Checkout unavailable");if(button){button.disabled=false;button.textContent="Pay securely →"}return}
 if(data?.url){location.href=data.url}else{toast(data?.error||"Checkout unavailable");if(button){button.disabled=false;button.textContent="Pay securely →"}}
}
async function loadProfile(){
 if(!session){profileData=null;return}
 const {data,error}=await supabase.from("profiles").select("id,email,display_name,role,referral_code,rewards_balance,tier").eq("id",session.user.id).maybeSingle();
 if(!error)profileData=data;
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
async function signUp(){
 const name=$("#newName")?.value.trim(),email=$("#newEmail")?.value.trim(),password=$("#newPassword")?.value;
 if(!email||!password)return toast("Enter email and password");
 if(password.length<6)return toast("Password must be at least 6 characters");
 const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:location.origin+location.pathname}});
 if(error)return toast(error.message);
 toast(data.session?"Account created":"Check your email to confirm your account");
}
async function signOut(){await supabase.auth.signOut();session=null;profileData=null;toast("Signed out");render()}
async function subscribe(){
 const email=$("#email")?.value.trim();if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast("Enter a valid email");
 const {error}=await supabase.from("newsletter_subscribers").insert({email,user_id:session?.user?.id||null});
 if(error&&error.code!=="23505")return toast(error.message);toast("You're on the Rollin list");
}
async function merchantLead(){
 const email=$("#merchantEmail")?.value.trim(),business_name=$("#merchantBusiness")?.value.trim(),note=$("#merchantNote")?.value.trim();
 if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast("Enter a valid email");
 const {error}=await supabase.from("merchant_leads").insert({email,business_name,note,user_id:session?.user?.id||null});
 if(error)return toast(error.message);toast("Merchant interest saved");
}
async function copyReferral(){
 if(!profileData?.referral_code)return toast("Sign in first");
 copyText(location.origin+location.pathname+"?ref="+encodeURIComponent(profileData.referral_code));
}
async function copyText(text){
 try{await navigator.clipboard.writeText(text);toast("Copied")}catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();toast("Copied")}
}

document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-nav]");if(nav){location.hash=nav.dataset.nav;return}
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
$("#walletBtn").onclick=()=>location.hash="wallet";
window.addEventListener("hashchange",render);
window.addEventListener("storage",()=>{state=loadState();applyTheme();render()});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));

window.closeModal=closeModal;window.addToCart=addToCart;window.changeQty=changeQty;window.removeFromCart=removeFromCart;
window.startCheckout=startCheckout;window.signIn=signIn;window.signUp=signUp;window.signOut=signOut;window.subscribe=subscribe;
window.merchantLead=merchantLead;window.loadMerchantDashboard=loadMerchantDashboard;window.createMerchantProduct=createMerchantProduct;window.loadMerchantCatalog=loadMerchantCatalog;window.editMerchantProduct=editMerchantProduct;window.toggleMerchantProduct=toggleMerchantProduct;window.copyReferral=copyReferral;window.copyText=copyText;window.money=money;window.render=render;

async function boot(){
 applyTheme();
 const s=await supabase.auth.getSession();session=s.data.session;
 await loadProfile();await loadFavorites();render();
 supabase.auth.onAuthStateChange(async(_event,s)=>{session=s;await loadProfile();if(s)await loadFavorites();render()});
}
boot().catch(e=>{console.error(e);toast("Rollin backend connection needs attention");render()});
