# Local Reader — Implementation Plan

> **Offline-first PDF/Text-to-Audiobook web app.** Everything runs on-device. No backend, no API keys, no cloud AI.

---

## 1. Final Architecture Decision

**Chosen:** Browser PWA + **dual TTS layer** (Web Speech API baseline → Kokoro-82M local neural TTS).

```
User
 ↓
React + TS + Vite UI (Tailwind)
 ↓
Input Layer ── Text paste / TXT / MD
           └── PDF upload
 ↓
PDF.js (Web Worker)  ── extract text locally
 ↓
Text Cleaner ── normalize whitespace, strip headers/footers, fix hyphenation
 ↓
Text Chunker ── paragraphs → sentences → speech-safe chunks
 ↓
TTS Provider (abstraction)
   ├── BrowserSpeechProvider  (Web Speech API — instant, zero download)
   └── KokoroProvider          (ONNX Runtime Web + Transformers.js — neural, exportable)
 ↓
Audio Playback ── Web Audio API / SpeechSynthesis queue
 ↓
Player UI ── play/pause/skip/speed/voice + sentence highlight
 ↓
IndexedDB ── documents, progress, settings, cached model
 ↓
Service Worker + Cache API ── offline app shell
```

### Why this hybrid
- **Web Speech API = default.** Zero download, instant start, works on first visit. Good enough for "just read it to me."
- **Kokoro-82M = opt-in upgrade.** ~86–150 MB one-time download, cached in IndexedDB. 8–9× better quality, and **can export audio** (WAV/MP3). Web Speech API cannot export.
- The `TTSProvider` interface means the UI never touches either engine directly — we can add Piper/XTTS later without UI rewrites.

### Rejected options
- **Web Speech API only** — no audio export, robotic, broken on Firefox Android / iOS background.
- **Tauri desktop** — better export UX but no mobile, needs installers + Rust, slower to ship. Keep as a possible V2.
- **Hybrid PWA+Desktop now** — too complex for MVP.

### Vercel deployment note (important)
- The app ships as **static assets** → deploys free to Vercel (or Netlify/Cloudflare/GH Pages). No serverless functions needed.
- **The Kokoro model is NOT hosted on Vercel.** It loads from the HuggingFace / jsDelivr CDN on first use (Transformers.js default), then caches to IndexedDB. This avoids blowing Vercel's 100 GB/month free bandwidth and keeps first deploy tiny.
- After first model download, everything is offline-capable.

---

## 2. Tech Stack (locked)

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18/19 + TypeScript | Mature, typed, huge ecosystem |
| Build | Vite | Fast, static output, ideal client-side |
| Styling | Tailwind CSS | Responsive + dark mode built-in |
| State | Zustand | Tiny, no boilerplate, good for player state |
| PDF | pdfjs-dist (PDF.js) | Mozilla-maintained, local extraction |
| TTS baseline | Web Speech API | Native, zero download |
| TTS neural | @huggingface/transformers + kokoro-js / onnxruntime-web | Local, exportable, Apache-2.0 |
| Storage | IndexedDB (via `idb`) | Documents, progress, settings, model cache |
| Offline | vite-plugin-pwa (Workbox) | Service worker + manifest + precache |
| Audio export | Web Audio + MediaRecorder / wav encode | WAV now, MP3 optional (lamejs) |
| Testing | Vitest + Testing Library + Playwright | Unit + component + offline E2E |
| Deploy | Vercel (static) | Free, static hosting |

---

## 3. Project Structure

```
text-to-audio-tool/
├── public/
│   ├── icons/                 # PWA icons (192, 512, maskable)
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers.tsx      # theme, store hydration
│   ├── components/
│   │   ├── common/            # Button, Modal, Toast, Icon, ProgressBar
│   │   ├── upload/            # DropZone, PasteArea, FilePicker
│   │   ├── reader/            # ReaderView, SentenceHighlight, DocTitle
│   │   ├── player/            # PlayerBar, SpeedControl, VoicePicker, SeekControls
│   │   └── settings/          # SettingsPanel, ThemeToggle, StorageManager
│   ├── features/
│   │   ├── documents/         # doc model, import/list logic
│   │   ├── pdf/               # pdf load orchestration
│   │   ├── tts/               # provider selection, queue orchestration
│   │   ├── playback/          # play state machine, progress tracking
│   │   └── settings/          # settings slice
│   ├── services/
│   │   ├── pdf/pdfService.ts
│   │   ├── tts/
│   │   │   ├── TTSProvider.ts          # interface
│   │   │   ├── BrowserSpeechProvider.ts
│   │   │   └── KokoroProvider.ts
│   │   ├── storage/db.ts               # IndexedDB (idb wrapper)
│   │   └── audio/exporter.ts           # WAV/MP3 export
│   ├── workers/
│   │   ├── pdf.worker.ts
│   │   └── tts.worker.ts               # Kokoro inference off main thread
│   ├── hooks/                 # useTTS, usePlayback, useVoices, useDocuments
│   ├── utils/                 # textClean.ts, chunker.ts, sanitize.ts, sentenceSplit.ts
│   ├── types/                 # shared TS types
│   ├── store/                 # zustand slices
│   ├── main.tsx
│   └── index.css
├── tests/                     # unit + e2e
├── ARCHITECTURE.md
├── README.md
├── PLAN.md
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── vercel.json                # static build + SPA rewrites + headers
```

---

## 4. Phased Task Breakdown

Legend: `[ ]` todo · each task is small and independently verifiable.

### Phase 0 — Project Scaffold & Deploy Pipeline (½ day)
Goal: empty app deploys to Vercel and installs as a PWA.

- [ ] `P0-1` Init Vite + React + TS project
- [ ] `P0-2` Add Tailwind CSS + base theme tokens (light/dark/system)
- [ ] `P0-3` Add ESLint + Prettier + strict tsconfig
- [ ] `P0-4` Add Zustand store skeleton + `idb` storage service
- [ ] `P0-5` Add `vite-plugin-pwa` (manifest + placeholder service worker)
- [ ] `P0-6` Add `vercel.json` (SPA rewrites, cache headers for assets)
- [ ] `P0-7` Push to the repo you create, connect Vercel, confirm first deploy is green
- [ ] `P0-8` Verify "Install app" prompt appears + basic offline shell loads

### Phase 1 — Text Input + Web Speech TTS (MVP core) ✅ DONE
Goal: paste text → hear it, with real controls. Ships useful value fast.

- [x] `P1-1` `TTSProvider` interface (speak/pause/resume/stop/seek, events, voices)
- [x] `P1-2` `BrowserSpeechProvider` (async voice loading via `onvoiceschanged`)
- [x] `P1-3` `useVoices` hook — dynamic voice list grouped by language
- [x] `P1-4` Text cleaner util (whitespace normalize, dashes, quotes)
- [x] `P1-5` Sentence splitter + chunker (≤200–250 chars, never break words)
- [x] `P1-6` TTS queue orchestrator (auto-advance, recover on error, track index)
- [x] `P1-7` Paste/text input component
- [x] `P1-8` Player bar: play / pause / resume / stop
- [x] `P1-9` Skip ±10s (chunk-relative) + restart
- [x] `P1-10` Speed control (0.5×–3× presets + custom)
- [x] `P1-11` Voice + language picker (persisted)
- [x] `P1-12` Sentence-level highlight synced to current chunk
- [x] `P1-13` Progress indicator (chunk N / total, approx time)
- [x] `P1-14` Persist current document + reading position to IndexedDB
- [x] `P1-15` "Continue where you stopped" on reload

### Phase 2 — PDF Pipeline ✅ DONE
Goal: drop a PDF → clean readable text → same player.

- [x] `P2-1` Integrate `pdfjs-dist` with worker
- [x] `P2-2` Extract text page by page (PDF.js worker + yielding, non-blocking)
- [x] `P2-3` File validation (type, size limit, friendly errors)
- [x] `P2-4` Drag & drop + file picker upload UI + progress
- [x] `P2-5` Paragraph reconstruction from PDF text items (geometry-based)
- [x] `P2-6` Header/footer + page-number stripping (repeated-line detection)
- [x] `P2-7` Hyphenation fix (join `word-\nbreak`) — via cleanText
- [x] `P2-8` Detect image-only/scanned pages → clear "OCR required" message
- [x] `P2-9` Handle empty / no-text-extracted PDFs gracefully
- [x] `P2-10` Multi-page + large-PDF incremental handling
- [x] `P2-11` Reader view renders extracted doc (text rendered safely by React)

### Phase 3 — Offline / PWA Hardening (1–2 days)
Goal: works fully offline after first load.

- [ ] `P3-1` Workbox precache app shell (JS/CSS/fonts/icons)
- [ ] `P3-2` Runtime cache strategy for PDF.js worker + assets
- [ ] `P3-3` Offline fallback UI + online/offline status indicator
- [ ] `P3-4` IndexedDB document library (list, open, delete)
- [ ] `P3-5` Settings persistence (voice, speed, skip, theme, highlight)
- [ ] `P3-6` "Clear all local data" button (wipes IndexedDB + caches)
- [ ] `P3-7` Manual offline test: online load → airplane mode → reload → paste text → TTS works
- [ ] `P3-8` Privacy banner ("documents never leave your device")

### Phase 4 — Kokoro Neural TTS + Audio Export (3–4 days)
Goal: optional high-quality voice + downloadable audio.

- [ ] `P4-1` `tts.worker.ts` — load Kokoro via transformers.js/kokoro-js off main thread
- [ ] `P4-2` `KokoroProvider` implementing `TTSProvider`
- [ ] `P4-3` First-run model download UX (progress bar, size warning, cancel)
- [ ] `P4-4` Cache model in IndexedDB; instant subsequent loads
- [ ] `P4-5` WebGPU detection → GPU path, CPU fallback
- [ ] `P4-6` Engine switcher in settings (Web Speech ↔ Kokoro) + capability notes
- [ ] `P4-7` Stream Kokoro audio buffers to Web Audio playback
- [ ] `P4-8` Audio export to WAV (per chunk concat → single file)
- [ ] `P4-9` Optional MP3 export (lamejs) — feature-flagged
- [ ] `P4-10` Verify Kokoro path works fully offline after model cached

### Phase 5 — Robustness, A11y, Mobile, Polish (2–3 days)
- [ ] `P5-1` Error boundary + user-friendly error toasts (no stack traces)
- [ ] `P5-2` Handle: no voices, TTS failure, unsupported browser, memory limits
- [ ] `P5-3` Keyboard nav + ARIA labels + visible focus + reduced-motion
- [ ] `P5-4` Mobile layout: large touch targets, responsive player
- [ ] `P5-5` Document mobile limits (iOS gesture, background playback)
- [ ] `P5-6` Sleep timer (bonus, easy win)
- [ ] `P5-7` Virtualized reader for very large docs
- [ ] `P5-8` Memory cleanup (release buffers, cancel queues on unmount)

### Phase 6 — Testing & Docs (2 days)  _(unit tests only — per locked decision)_
- [ ] `P6-1` Unit: chunker, sentence split, text cleaner, header/footer strip
- [ ] `P6-2` Unit: TTS queue sequencing, pause/resume, error recovery
- [ ] `P6-3` Unit: storage read/write/clear, settings persistence
- [ ] `P6-4` Unit: PDF text normalization / paragraph reconstruction helpers
- [ ] `P6-5` Performance report (10/50/100-page PDF + large text)
- [ ] `P6-6` Browser compatibility matrix
- [ ] `P6-7` `README.md` + `ARCHITECTURE.md` (diagrams, decisions, limits)
- [ ] _Deferred to V2:_ Playwright E2E (paste→play, PDF→play) + headless offline verification

---

## 5. Milestones

| Milestone | Delivers | Phases |
|---|---|---|
| **M1 — Deployable shell** | Live on Vercel, installable PWA | P0 |
| **M2 — MVP (paste→listen)** | Text-to-speech with controls, persisted | P1 |
| **M3 — PDF audiobook** | Drop PDF → clean text → listen | P2 |
| **M4 — True offline PWA** | Works with network disabled | P3 |
| **M5 — Neural voice + export** | Kokoro TTS + WAV/MP3 download | P4 |
| **M6 — Production polish** | A11y, mobile, tests, docs | P5–P6 |

Ship M1–M4 first (a genuinely useful free app). M5 is the differentiator. M6 makes it production-grade.

---

## 6. Definition of Done
- App deploys to Vercel as static site, installs as PWA.
- Paste text OR drop PDF → listen, with play/pause/skip/speed/voice/highlight.
- Reading position persists; "continue where you stopped" works.
- Fully functional offline after first load (verified with network off).
- Optional Kokoro neural voice with audio export.
- No backend, no API key, no document ever leaves the device.
- Tests green; README + ARCHITECTURE documented.

---

## 7. Locked Decisions
- **Scope:** Build all 6 milestones end-to-end in one autonomous run; only stop at the end (or if truly blocked). ✅
- **Execution:** Strictly sequential — one task at a time, feature-by-feature commits on `dev`. ✅
- **Neural TTS:** Include Kokoro-82M (opt-in). Default engine remains Web Speech API (instant). ✅
- **Audio export:** WAV **and** MP3 (MP3 via lamejs). ✅
- **Testing:** Unit tests only (Vitest) — chunker, cleaner, TTS queue, storage. No Playwright E2E for now. ✅
- **Model host:** HuggingFace/jsDelivr CDN, cached to IndexedDB (keeps Vercel bandwidth free). ✅
- **PDF size cap:** ~50 MB / 300 pages with a soft warning. ✅
- **Git flow:** Commits authored as the user (no AI attribution); work on `dev`; merge `dev`→`main` via git at each milestone (no PR). ✅

### User-side steps (cannot be automated here)
- Import the repo on Vercel once to get the live URL (every push then auto-deploys).
- Final real-device QA (iOS/Android browsers, installed PWA, live offline test).
