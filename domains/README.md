# Rollin free-domain deployment map

Rollin is prepared to run from free hosting and free subdomain services without claiming ownership of a paid TLD.

## Free public deployment

- GitHub Pages: `https://way4out.github.io/Rollin/`
- Candidate free subdomain: `rollin.runs-on.dev`
- Candidate free subdomain: `rollin.owns.it.com`

## Important ownership boundary

A free subdomain is a granted namespace, not permanent ownership of the parent domain. The runs-on.dev registry currently states that names are free, but may be reclaimed and that the parent domain belongs to Advance Labs. It also limits claims to one name per GitHub account. Therefore this repository does **not** represent a completed claim.

The owns.it.com registry likewise requires a GitHub-based registration workflow and maintainer acceptance.

## Rollin application routing

The Rollin application is designed so any approved free hostname can point to the same public application. No paid-domain purchase is required for the GitHub Pages deployment.

## Claim/attach procedure

1. Sign in to the free registry using the GitHub account that will own the record.
2. Claim `rollin` if the registry reports it available.
3. Point the resulting hostname to the deployed Rollin application using the registry's supported URL/CNAME record.
4. Verify HTTPS and the public application before treating the hostname as active.

This file intentionally does not claim that an external registry has approved a name. External registry ownership must be confirmed by that registry.
