# StellarNet Marketplace Launch Manifest

Status: DEPLOYMENT_PREPARED
Lane model: POINHI logical lanes scale as 69^n by recursive depth n.
Public service: https://stellarnet-marketplace.onrender.com
Source: https://github.com/way4out/Rollin

## Categories
- Real Estate
- Cars + Trucks
- Motorcycles
- Boats
- Aircraft
- Businesses

## Commerce rules
- Every listing is an individual listing with its own ID, seller, price, currency, inventory/availability, category, images, disclosures, and checkout state.
- Buy actions must resolve the current listing price immediately before payment.
- Discounts are applied before authorization and shown as a separate line item.
- Never infer a market price when a verified listing/source price is unavailable.
- Regulated or jurisdiction-sensitive listings require seller verification and applicable documentation before publication/checkout.
- On-chain settlement must verify chain, token contract, recipient, amount, transaction receipt, and listing/order state before marking a sale complete.
- No private keys are stored in the browser or repository.

## Payment integration
Bankr/Base support is an integration target. A live Bankr API key or connected Bankr wallet is required for actual on-chain deployment/execution. Bankr's current API requires authenticated deployment calls and returns token address, pool ID, transaction hash and fee distribution.

## Image policy
Each listing should have a real raster image URL or seller-uploaded image. Placeholder imagery must not be represented as a real asset photograph.

## Release gate
Do not label a listing "sold", "paid", "on-chain", "verified", or "live" until the corresponding backend/on-chain evidence has been confirmed.

## One-tap purchase
The marketplace UI exposes a 1-Tap Buy action per active listing. It resolves the current listing record and routes to the configured secure checkout. A completed sale still requires successful payment and order verification.

## Required sale categories
- Auto / Cars + Trucks
- Aircraft / Planes
- Boats
- Businesses (subject to lawful sale and jurisdictional requirements)
- Motorcycles
- Real Estate: development, commercial, developed, undeveloped

## POINHI lane topology
69 base lanes; recursive depth n uses 69^n logical lanes. This is a software orchestration model, not a claim of infinite physical network capacity.
