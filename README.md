# 📖 Local Reader

**Turn any PDF or text into audio — fully on your device.** No cloud, no account, no API keys. Your documents never leave your machine.

Paste text or drop a PDF and listen while you work, exercise, commute, or drive.

---

## Why

Most "read aloud" tools upload your documents to a server and need a subscription. Local Reader does everything **in your browser**:

- 🔒 **Private** — documents are processed on-device and never uploaded.
- 📴 **Offline-first** — after the first load, it works with no internet (installable PWA).
- 💸 **Free** — no API keys, no paid TTS service, no backend.
- 🎧 **Real audiobook controls** — play/pause, skip, speed, voice selection, sentence highlighting.

## Status

🚧 **Early development.** Building in phases — see [`PLAN.md`](./PLAN.md).

- [x] **Phase 0** — Project scaffold + deployable PWA shell
- [ ] Phase 1 — Text → speech (Web Speech API) with full player
- [ ] Phase 2 — PDF upload + local text extraction
- [ ] Phase 3 — Offline / PWA hardening
- [ ] Phase 4 — Kokoro neural TTS + audio export
- [ ] Phase 5 — Robustness, a11y, mobile polish
- [ ] Phase 6 — Tests + docs

## Architecture (short version)

100% client-side. React + TypeScript + Vite, deployed as static assets to Vercel.

```
UI → PDF.js (extract) → text clean → chunk → TTS provider → audio player
                                                  │
                            ┌─────────────────────┴──────────────────────┐
                            │ Web Speech API (default, instant)           │
                            │ Kokoro-82M neural TTS (opt-in, exportable)  │
                            └─────────────────────────────────────────────┘
     IndexedDB: documents · reading position · settings · cached model
     Service Worker: offline app shell
```

The large neural TTS model loads from a public CDN on first use and is cached in
IndexedDB — it is **not** hosted on our server, keeping hosting free and static.

Full design in [`PLAN.md`](./PLAN.md) and (soon) `ARCHITECTURE.md`.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · idb · PDF.js · Transformers.js (Kokoro) · vite-plugin-pwa (Workbox)

## Development

```bash
npm install
npm run gen:icons   # one-time: generate PWA icons
npm run dev         # start dev server
npm run build       # production build → dist/
npm run preview     # preview the production build
npm run lint
npm test
```

## Deployment

Static hosting — no server. The repo is wired for **Vercel** (`vercel.json`), but any
static host works (Netlify, Cloudflare Pages, GitHub Pages). Hosting only serves the
frontend assets; all document processing happens in the user's browser.

## Privacy

Local Reader does not upload your documents, does not use analytics, and makes no
network calls to process your files. The only optional network use is a one-time
download of the neural voice model from a public CDN (skippable — the built-in
browser voices need no download at all).

## License

MIT (planned).
