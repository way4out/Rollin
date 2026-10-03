# Stellar Lotto

Public Base-first web/PWA shell for a capacity-gated lottery architecture.

## Current live model

- $0.10 per share in the intended production pool-accounting model.
- Draw unlocks only when the configured pool capacity is full.
- No scheduled timer draw.
- Production winner selection must use independently verifiable randomness.
- Production payout must be winner-only and released once.
- Demo mode never moves funds.

## Exact asset rule

Production acceptance is limited to USDC on Base plus **exactly 24 verified BANKR StellarQR token contract addresses**. Every other token must be rejected. Token identity is by contract address, never ticker/name.

The 24 exact addresses are intentionally not guessed or fabricated. Paid play remains disabled until they are supplied and independently verified.

## Production architecture

Wallet -> eligibility/compliance gate -> ticket contract -> escrow/pool -> verifiable randomness -> draw finalization -> winner verification -> claim/settlement.

The website/database must never be the source of truth for funds, tickets, winners, or payouts.

## Launch / discovery

Live application: https://stellar-lotto.onrender.com

GitHub source: https://github.com/way4out/Rollin/tree/stellar-lotto-live

Base ecosystem: https://www.base.org/ecosystem

Base's current ecosystem page describes its directory as third-party projects and states that listings are not endorsements. The project should therefore present itself accurately as an independent StellarNet Business LLC application.

Base also provides an Onchain Registry route for builders to submit apps and content for potential discovery. Submission does not guarantee placement or promotion.

## Security / legal gate

Paid play requires applicable operator authorization, jurisdiction and age controls, KYC/AML/sanctions screening where required, responsible-play controls, geofencing, tax/reporting handling, audited smart contracts, a verifiable randomness source, and real onchain settlement.

Do not describe demo randomness as production randomness and do not claim Coinbase/Base endorsement, listing, investment, or promotion unless officially granted.

## Deployment

This directory is served as a static PWA on Render with automatic deployment from the `stellar-lotto-live` branch.
