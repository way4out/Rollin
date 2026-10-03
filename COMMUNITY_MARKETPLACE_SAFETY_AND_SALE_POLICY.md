# Rollin Community Marketplace — Public Seller & 1-Tap Sale Gate

Any authenticated Rollin account may submit an individual listing. A submission is not public or purchasable until it passes the marketplace safety/authority review.

## Individual listing contract
- Every listing has its own name, category, description, asking price and seller identity.
- Every listing has an individual detail/share URL, image metadata when supplied, 1-Tap Buy after approval, optional 1-Tap Onchain payment request, and payment/fulfillment receipt metadata.

## Safety gate
1. Seller attests they are authorized to sell the item.
2. Seller attests ownership/title/licensing information is truthful.
3. Seller attests the listing is not stolen, counterfeit, infringing, illegal, unsafe, regulated without required approvals, or otherwise prohibited.
New community listings are inactive with sale_gate=community_review. Only an authorized Rollin administrator can approve and publish them.

## Regulated/high-value assets
Vehicles, aircraft, boats, motorcycles, real estate, securities, businesses, financial products, controlled goods, and other regulated/high-value transactions require the applicable title, registration, licensing, KYC/AML, escrow, broker, tax, transfer, or jurisdiction-specific process before publication or settlement.

## Purchase flow
Approved active listings use secure checkout. 1-Tap Buy selects the item and starts checkout. 1-Tap Onchain prepares the Base payment request; the buyer must still authorize and broadcast the transaction. Bankr direct wallet transfers require a properly permissioned server-side Wallet API key and recipient/spend controls.

## Pricing
Seller asking prices are not presented as independently verified market values. Market-reference fields must be labeled until a real item-specific comparable/valuation source is connected.

## Source catalog
The catalog is an index of individually addressable listings. A catalog entry does not itself prove ownership or legal sale authority; the active product record and community review gate control public purchase eligibility.