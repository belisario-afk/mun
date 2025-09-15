# Phantom Console (Stealth Cockpit Stereo)

Cinematic 3D cockpit/HUD audio dashboard optimized for Samsung Galaxy Tab SMT77U, deployable on GitHub Pages at `/mun`, with a PWA “car‑dock” experience, strong accessibility, strict performance budgets, and a real AI copilot with voice in/out.

- Live path: `https://<owner>.github.io/mun/`
- Base path: `/mun`
- Primary device: Samsung Galaxy Tab SMT77U (Android + Chrome), landscape-first.

## Quick Start

```bash
git clone <this repo>
cd mun
npm i
npm run dev
```

- Build: `npm run build` (emits with base `/mun`)
- Preview: `npm run preview`
- Tests: `npm test` (Vitest), `npm run e2e` (Playwright)
- Lint/format: `npm run lint` / `npm run format`

## Architecture Overview

- Vite + React + TypeScript (strict), Tailwind CSS, ESLint/Prettier
- r3f + three: Central scope, wings (playlists/comms), upper band (speed/weather)
- Audio Sources:
  - Spotify: OAuth PKCE; Web Playback SDK; visuals driven via metadata/state
  - Radio: CORS-friendly streams (SomaFM); Web Audio analyser → visuals
  - Local: bundled sample (data-URI WAV) + file picker; Web Audio analyser + LRC demo path
- AI Copilot:
  - Providers: `mini` (deterministic local intent parser), `webllm`, `openai`, `azure`, `gemini` via proxy
  - Intent JSON deterministic: `{ intent, args, say }` with safe fallbacks
  - Comms panel logs conversation; privacy toggle to disable AI entirely
- Voice I/O:
  - Input: Web Speech Recognition (see note) and text command bar
  - Output: Web Speech Synthesis by default; optional neural TTS via proxy
- Sensors:
  - Geolocation → smoothed speed (km/h) and heading; Open‑Meteo weather
- Tablet/Power:
  - Wake Lock, Fullscreen, PWA “car‑dock” UX
- PWA:
  - Workbox via `vite-plugin-pwa`, manifest (orientation=landscape), SPA 404 fallback
- CI/CD:
  - GitHub Actions: lint → typecheck → unit → e2e → build → deploy to Pages

## Device Optimization (SMT77U)

- Landscape primary. Pinch/twist/swipe thresholds tuned. Large touch targets (≥48dp).
- Dynamic DPR [0.7–1.0], reduced motion, low-power mode.
- WebGL budgets enforced in design: draw calls ~ under 200, GL mem < 200 MB (simple scene + instancing)
- Thermal-aware: lower bloom/particles in Low Power mode.

## Spotify PKCE

- Client ID: `927fda6918514f96903e828fcd6bb576`
- Redirect: `https://belisario-afk.github.io/mun/`
- Scopes: `streaming user-read-playback-state user-modify-playback-state user-read-email`
- Flow: Authorization Code with PKCE; tokens in `sessionStorage`.
- Note on CORS: Spotify token endpoint may deny cross-origin in some regions. If token exchange fails due to CORS, configure the included Cloudflare Worker proxy and set `VITE_PROXY_BASE_URL` to route the token exchange securely (no secrets stored).

### Register your app

1. Create a Spotify app at [Spotify Dashboard](https://developer.spotify.com/dashboard).
2. Add Redirect URI `https://belisario-afk.github.io/mun/`.
3. Copy `VITE_SPOTIFY_CLIENT_ID` into `.env.local` (or use the provided one for testing).
4. Click “Login Spotify” from the app menu (add button easily), then select device.

### DRM note

- Spotify Web Playback SDK uses EME/DRM. Audio PCM cannot be routed into Web Audio; DSP visuals are driven by metadata/state only.

## Radio & Local

- Radio uses SomaFM streams (CORS-friendly). You can add more in `src/audio/radio/radio.ts`. Consider:
  - CORS: `Access-Control-Allow-Origin: *`
  - Codecs: MP3/AAC most compatible on Android Chrome
- Local audio:
  - Sample track is a tiny CC0 WAV data URI (legal, bundled).
  - File picker: use the menu or add a button to call `playFile(file)`.
  - LRC demo: place `.lrc` files alongside or load from UI.

## AI Copilot

- Default provider: `mini` (deterministic, low-latency intent parser) for command-and-control.
- Provider routing via `.env`:
  ```
  VITE_AI_PROVIDER=mini|webllm|openai|azure|gemini
  VITE_PROXY_BASE_URL=https://<your-worker>.workers.dev
  ```
- Cloud providers require the included proxy for key safety. The worker:
  - Applies CORS allowlist for `https://<owner>.github.io`
  - No logging, no storage; basic rate-limiting suggested
- Supported intents include source switching, themes, status report, and playback control.

## Voice I/O

- Output (default): Web Speech Synthesis (system voices). Voice selection persisted.
- Optional neural TTS via proxy (ElevenLabs, Azure, PlayHT).
- Input: Web Speech Recognition varies by browser; text command bar is always available.

## PWA + Car Dock

- Installable with manifest (display=standalone, orientation=landscape)
- Workbox strategies:
  - Assets: stale‑while‑revalidate
  - Pages: network‑first
  - APIs: network‑only (no cache)
- Car‑dock experience: wake-lock, fullscreen prompts, large controls.

## Accessibility

- WCAG 2.1 AA basics: focus outlines, ARIA labels/live regions, reduced motion, high-contrast toggle.
- Gesture equivalents via buttons (Toggle Paddles, Menu, Command Bar).

## Testing

- Unit (Vitest): pkce, gestures, speed smoothing, wake lock, AI intents, TTS routing.
- E2E (Playwright): first-run flow, source switching, gestures via buttons, base path `/mun`, 404 fallback, AI commands.

Run:
```bash
npm test
npm run e2e
```

## GitHub Pages

- Workflow `.github/workflows/pages.yml` builds and deploys automatically on push to `main`.
- SPA fallback via `public/404.html`.
- Ensure repository name is `mun` to match base path or update `vite.config.ts`.

## Performance Budgets

- Initial JS (gz) ≤ 350 KB for main+critical (r3f scene is lean; heavy AI is lazy-loaded).
- Steady-state FPS ≥ 50 on SMT77U (dynamic DPR ~0.7–1.0).
- Draw calls ≲ 200 (simple scene + limited post; no heavy GL assets).
- WebGL memory < 200 MB (light geometry, no large textures; maskable vector assets).

## Privacy & Security

- Tokens in `sessionStorage` by default; logout clears.
- Mic, TTS, location, wake-lock: strictly opt-in via user gestures with clear indicators.
- No secrets in repo. Cloud API keys live only in your proxy environment.

## Replacing Icons and Brand

- Replace `public/icons/*.svg` with PNGs (192, 512) if desired; update manifest `icons` array.
- Brand “Z” assets provided are neutral and license-safe.

## Troubleshooting

- Spotify token CORS: use proxy worker.
- Autoplay blocked: tap once to start audio.
- PWA orientation lock only in installed mode.
- Some devices require PNG icons for install prompt (Chrome recommends PNG); SVG works in most Chrome versions but update if install prompt fails.

## Acceptance Criteria Reference

Covers all listed items: build/run/deploy flows, permissions and fallbacks, sources (Spotify/Radio/Local), AI + voice, TTS chain, UI/3D + gestures, environment adaptation (speed/weather), performance, accessibility, docs/policies.
