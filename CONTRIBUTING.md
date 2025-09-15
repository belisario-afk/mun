# Contributing

## Development

- Node 18+
- `npm i`
- `npm run dev`

## Code style

- TypeScript strict, ESLint, Prettier.
- No TODO/TBD stubs. Provide complete implementations or graceful fallbacks.
- Keep initial bundle small; lazy-load heavy providers (AI, maps).

## Commits

- Conventional commits enforced by commitlint.

## Tests

- Add unit tests (Vitest) and e2e (Playwright) for new user flows.
- E2E must emulate mobile/tablet with landscape orientation.

## Pull Requests

- Include screenshots or short clips for visual changes.
- Update docs and changelog entries (Changesets).
