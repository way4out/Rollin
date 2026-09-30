# OEQL URI Scheme — Registration-Ready Draft

## Intended scheme
**Scheme:** `oeql`

**Canonical form:** `oeql://<authority>/<path>`

The scheme identifies resources in the OEQL application protocol and may resolve through an OEQL-aware application, resolver, or HTTPS gateway.

## Status
This is a registration-ready implementation draft. It does **not** itself register `oeql` with IANA or grant global standards authority.

IANA's URI Scheme Registry states that permanent registration follows the applicable RFC 7595 process and mailing-list review; provisional registration is a separate path.

## Syntax
- Scheme: `oeql`
- Authority: URI authority component.
- Path: hierarchical resource path.
- Query: optional implementation-defined parameters.
- Fragment: optional client-side identifier.

## Resolution
1. OEQL-aware applications SHOULD resolve through their configured authoritative control plane.
2. Web clients MAY use an HTTPS gateway.
3. Resolvers MUST distinguish authoritative records from cached or unverified records.
4. Authorization records SHOULD expose issuer, subject, scope, validity, revocation state, and record hash.

## Security
Implementations SHOULD use authenticated transport and cryptographic signatures for authoritative records. Private signing keys MUST remain outside public static assets.

## Rights
This specification does not itself transfer trademark, DNS, registry, IANA, ICANN, or third-party ownership. A controller can grant only rights it actually owns or is legally authorized to grant.

## Change control
StellarNet LLC may publish revisions of the implementation it controls. Standardization status remains governed by the applicable IETF/IANA process.

## Registration checklist
- [ ] Final specification reviewed
- [ ] Security considerations reviewed
- [ ] Interoperability examples published
- [ ] Contact/change-controller information finalized
- [ ] IANA provisional/permanent procedure selected
- [ ] Required mailing-list review completed
- [ ] IANA submission actually filed
- [ ] Registry status verified after acceptance
