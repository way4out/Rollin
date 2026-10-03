# Stellar Lotto

Public live web/PWA shell for a Base-native, transparent lottery architecture.

## Safety status

Paid/real-money play is intentionally disabled. A real-money lottery requires legal authorization in each jurisdiction where it is offered, plus age/KYC/AML, responsible-gaming, sanctions, geofencing, tax/reporting and independently audited smart-contract controls.

## Asset rule

Production acceptance is limited to:
- USDC on Base
- exactly the 24 verified BANKR StellarQR token contract addresses

The application must reject every other token. Token identity must be checked by contract address, not ticker/name.

The exact 24 addresses are not embedded yet because the supplied BANKR app page does not expose them to the connected retrieval tools. Do not guess them.

## Architecture target

Wallet -> eligibility/compliance gate -> ticket contract -> escrow/pool -> verifiable randomness -> draw finalization -> winner verification -> claim/settlement.

Never make the website/database the source of truth for funds, tickets, winners, or payouts.

## Deployment

This directory is designed to be served as a static PWA.