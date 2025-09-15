# Privacy Policy

Phantom Console processes the following data on your device:

- Spotify OAuth tokens: stored in `sessionStorage` by default and cleared on logout.
- Microphone: only when you enable voice input; visible status indicator. No audio is sent to servers unless you configure a cloud speech provider via proxy.
- Text-to-Speech: uses system TTS by default; optional neural TTS via your configured proxy. No content is stored.
- Geolocation: optional. Used to compute speed and heading, and to fetch weather (Open‑Meteo). Data is not persisted.
- Wake Lock / Fullscreen: only after user gesture.

Cloud AI/TTS providers:
- All cloud requests must go through your configured proxy. The proxy must enforce CORS allowlist for your Pages origin, avoid logging, and not store prompts or responses.

Analytics:
- None enabled by default. If you enable optional analytics, use anonymous event tracking only.

Contact:
- Open issues in the repository for questions related to privacy.
