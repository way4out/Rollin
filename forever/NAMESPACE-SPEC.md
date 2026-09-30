# OEQL Forever Unbounded Namespace Specification

## Canonical model
oeql://<name>.forever[/<hierarchical-path>]

The namespace is virtual and generated on demand. It is not represented as a finite array and is never fully enumerated.

## Capacity
No hardcoded namespace total is part of the protocol. Expansion occurs through hierarchical paths, namespaces, dimensions, versions, and content-addressed identifiers.

Implementations MUST paginate by cursor or explicit path and MUST NOT loop to a declared global total.

## Authorization
A controlled issuance record may contain 1–100 signers. The record identifies the authorized party, scope, term, renewal/revocation state, and hash. The default commercial interpretation is lease/license, not transfer of underlying namespace rights.

## Resolution
oeql:// is an application/deep-link scheme in this implementation. HTTPS is the compatibility transport. Global standardization is separate from this software and must use the applicable standards process.

## Legal boundary
The implementation grants only rights actually held or authorized by its controller. It does not create global DNS, IANA, ICANN, trademark, or third-party domain rights merely by deployment.
