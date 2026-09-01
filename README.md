# 📖 Local Reader

**Turn any PDF or text into audio — fully on your device.** No cloud, no account, no API keys. Your documents never leave your machine.

Paste text or drop a PDF and listen while you work, exercise, commute, or drive.

---

## Why

Most "read aloud" tools upload your documents to a server and need a subscription. Local Reader does everything **in your browser**:

- 🔒 **Private** — documents are processed on-device and never uploaded.
- 📴 **Offline-first** — after first load, the core app works with no internet (installable PWA).
- 💸 **Free** — no API keys, no paid TTS service, no backend.
- 🎧 **Real audiobook controls** — play/pause, skip, speed, voice selection, sentence highlighting, sleep timer.
- 🗣️ **Two voice engines** — instant built-in browser voices, or an opt-in neural voice (Kokoro) that also lets you **download the audio** as WAV/MP3.

## Features

- Paste text **or** drag-and-drop a PDF (local text extraction via PDF.js)
- Clean text pipeline: whitespace/hyphenation repair, paragraph preservation, header/footer & page-number stripping
- Robust chunked playback for very long documents (auto-advance, error recovery)
- Play / pause / stop / restart, skip ±(5–60s), previous/next section, **0.5×–3× speed**
- Dynamic voice selection grouped by language — shows the voices **actually on your device**
- Sentence-level highlighting synced to what's being spoken (no fake sync)
- "Continue where you stopped" — reading position is saved locally
- Recent-documents library, saved on-device
- Neural TTS (Kokoro-82M) with **WAV / MP3 export**
- Light / dark / system theme, adjustable font size
- Keyboard shortcuts, sleep timer, installable PWA
- One-click **Clear all local data**

## Quick start

```bash
npm install
npm run gen:icons   # one-time: generate PWA icons
npm run dev         # http://localhost:5173
```

Then paste text or drop a PDF and press **Listen**.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm test` | Run unit tests (Vitest) |

## Deployment

Static hosting — no server. Wired for **Vercel** (`vercel.json`); any static host works
(Netlify, Cloudflare Pages, GitHub Pages).

1. Import the repo on Vercel → it auto-detects Vite (`npm run build`, output `dist`).
2. Deploy. Every push to `main` is production; other branches get preview URLs.

Hosting only serves frontend assets — **all document processing happens in the browser**.

> The Kokoro neural model is **not** served from your host — it loads from a public CDN
> on first use and is cached locally. This keeps hosting static and within free bandwidth.

## Architecture

100% client-side. React + TypeScript + Vite, deployed as static assets.

```
UI → PDF.js (extract) → clean → chunk → PlaybackController → TTSProvider → audio
                                                                │
                          ┌─────────────────────────────────────┴───────────────┐
                          │ BrowserSpeechProvider (default, instant, offline)     │
                          │ KokoroProvider (opt-in neural, exportable WAV/MP3)    │
                          └───────────────────────────────────────────────────────┘
   IndexedDB: documents · progress · settings   |   Service Worker: offline shell
```

Full details, diagrams, and technology rationale in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
Development plan and task history in [`PLAN.md`](./PLAN.md).

## Browser support

| Feature | Chrome | Edge | Firefox | Safari | Android Chrome | iOS Safari |
|---|---|---|---|---|---|---|
| PDF extraction | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Browser-voice TTS | ✅ | ✅ | ✅ (desktop) | ✅ | ✅ | ✅¹ |
| Offline / PWA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅² |
| Sentence highlight | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Neural voice (Kokoro) | ✅³ | ✅³ | ✅ (wasm) | ⚠️ wasm | ⚠️ heavy | ⚠️ heavy |
| Audio export (WAV/MP3) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

¹ iOS requires a user tap to start speech; page-load autoplay is blocked.
² iOS PWA storage is more limited and may be evicted under pressure.
³ WebGPU accelerates Kokoro on Chrome/Edge; otherwise it runs on slower wasm.

**Firefox on Android** does not implement `SpeechSynthesis` — use the neural engine or another browser there.

## Known limitations

**Web Speech API (browser voices)**
- Cannot export audio (the API never exposes the synthesized buffer) — use the neural engine to export.
- Voice quality/availability depends entirely on the OS; some languages have no installed voice.
- Long single utterances can stall in Chromium — mitigated by chunking + a keep-alive.

**Neural voice (Kokoro)**
- First use downloads a ~86 MB model from a CDN (cached afterward) — needs network that one time.
- Best on Chrome/Edge with WebGPU; wasm fallback is slower and heavy on low-end/mobile devices.
- English is strongest; other languages are available but vary in quality. No voice exists for every language (e.g. Uzbek).

**PDF**
- Scanned/image-only PDFs have no extractable text → you'll get a clear "OCR required" message (OCR is not built in).
- Complex multi-column layouts and tables may extract in an imperfect reading order.

**Mobile**
- iOS requires a tap to start audio and limits background playback; long JS/large models are heavy on phones.
- The browser engine is the recommended path on mobile; the neural engine is best on desktop.

## Privacy

Local Reader does **not** upload your documents, use analytics, or make network calls to
process files. The only optional network use is the one-time neural-model download from a
public CDN (skippable — the built-in browser voices need no download). Everything else —
extraction, synthesis, storage — happens on your device. Use **Settings → Clear all local
data** to erase everything.

## Performance

Designed to stay responsive on long documents:

- **PDF extraction** runs page-by-page in PDF.js's worker and yields to the event loop between pages, so the UI never freezes. Expected rough guide (varies by device/PDF): ~10-page PDF in about a second; 100+ pages in a handful of seconds.
- **Playback** is incremental — text is chunked and synthesized one chunk at a time, so a 100,000-character document never goes into a single giant request and starts speaking almost immediately.
- **Rendering** uses `content-visibility` blocks, so thousands of chunks lay out lazily.
- **Browser engine** starts instantly (no download). **Neural engine** costs a one-time ~86 MB model download; generation is a few seconds per 100 words on CPU/wasm and well under a second with WebGPU.
- **Memory** is released on unmount (speech cancelled, PDF pages cleaned up, audio nodes stopped).

> Exact numbers depend on device and browser; measure on your target hardware. Real-device benchmarking is part of QA.

## Roadmap

**Shipped (MVP → V1)**
- Text + PDF input, offline PWA, chunked player, highlighting, persistence/resume, settings, document library
- Neural voice + WAV/MP3 export

**V2 ideas**
- EPUB / DOCX / TXT / web-page import
- Word-level highlighting with a capable engine
- Bookmarks, notes, chapters
- Download-cancel + partial/background export
- Playwright end-to-end + headless offline tests
- Optional Tauri desktop wrapper (system voices, seamless batch export)
- On-device translation / summarization

## License

MIT (planned).
