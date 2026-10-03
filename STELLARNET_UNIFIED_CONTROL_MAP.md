# StellarNet Unified Control Map

## Owner / umbrella
StellarNet LLC — Mesa, Arizona. This map is an integration/control-plane document for the public software properties; it does not itself transfer ownership, create blockchain assets, or establish legal compliance.

## Live verified application links currently wired in this repository
- The Multiverse Market: https://stellarnet-marketplace.onrender.com/
- OEQL Bank Forever: https://oeql-bank-forever.onrender.com/
- StellarNet Quantum Telecom Phone: https://oeql-quantum-telecom-phone.onrender.com/

## Commerce rails
- Base USDC checkout is the currently implemented on-chain checkout rail.
- Customer wallets authorize/broadcast payments; the marketplace verifies the Base transaction before finalizing an order.
- Private keys, Wallet API keys, and exchange secrets remain server-side.

## POINHI integration
- The marketplace database currently contains 23 individually gated POINHI Coin listings.
- Yin/Yang/Yong grouping is represented as marketplace metadata; these listings are not represented here as newly minted blockchain tokens.
- Any token contract, supply, price, or ownership claim must be verified from an authoritative chain explorer or issuer record before publication.

## Deployment rule
Only publish a link as live after its hosting service reports a live deployment and an application-level smoke test passes. Unknown Simulator+ and StellarQuantum URLs are intentionally not fabricated into this map.

## Next integration layer
Wire verified Simulator+, StellarQuantum, Telecom API, OEQL, marketplace, and Bankr-compatible server-side payment adapters behind a single StellarNet navigation/control plane once their canonical live URLs and deployment workspaces are available.