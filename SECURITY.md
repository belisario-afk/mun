# Security Policy

- No secrets are committed to the repo.
- Spotify uses Authorization Code with PKCE; no client secret is required.
- Tokens are stored in `sessionStorage` by default. You can switch to `localStorage` in code at your own risk.
- All cloud AI/TTS providers are only accessible via the included proxy (Cloudflare Worker example).
  - Enforce CORS allowlist
  - Avoid logging bodies or headers containing tokens
  - Implement basic rate limiting
- Dependencies are pinned to stable versions; PRs must pass CI, including type checks and tests.
- Report vulnerabilities via GitHub Issues or Security Advisories.
