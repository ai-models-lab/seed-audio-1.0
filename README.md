# Seed Audio AI Generator & Sound Stage 🎵

An immersive, full-scene **Seed Audio** multi-track sound stage designed to generate realistic voiceovers, multi-speaker dialogue, environmental sound effects, dynamic atmospheric background pads, and background music beds simultaneously from a single descriptive prompt. 

Powered by the latest **Doubao Seed Audio 1.0** (or **Bytedance Seed Audio**) workflows and integrated with **Gemini TTS** (`gemini-3.1-flash-tts-preview`) models, this interactive web studio serves as the ultimate **AI audio generator** and **AI voice generator** for video ads, storytelling, short dramas, audiobooks, podcasts, and localization.

---

## 🚀 Key Features & SEO Capabilities

This repository is optimized to target high-intent AI audio search queries like **seed audio**, **see audio**, and **seedance audio** while satisfying Google's search algorithms through highly engaging, interactive tool layouts.

- **Exact Exact Matches Supported:** 
  - `seed audio ai`, `seed audio ai generator`, `seed audio ai voice`, `seed audio voice generator`
  - `seedance audio`, `see audio`, `doubao seed audio`, `doubao seed audio 1.0`, `bytedance seed audio`
- **Multi-Track Dialogue Sequencing:** Generate custom dialogue scripts between distinct voice options with customized emotional expressions. Fully supports **seed audio dialogue generator** and **AI dialogue generator** needs.
- **Vocal Emotion Tagging:** Embed tags like `[whispering]`, `[scared]`, `[cheerful]`, `[serious]`, or `[short pause]` directly inline.
- **Ambient & Sound Design Synthesis:** Seamlessly generates environmental noise beds (like rain, forest wind, lofi static) and triggered cues (door knocks, digital swooshes) using a Web Audio synthesizer, acting as a powerful **seed audio sound effects generator**, **AI sound effects generator**, and **seed audio music generator**.
- **Instant Local Fallback:** No API Key configured? Our advanced procedurally synthesized speech carrier algorithm kicks in, letting you mix, arrange, and download standard `.wav` tracks locally in the browser immediately.
- **Export Publishable WAV Assets:** Ideal for social marketing channels (TikTok Video Ads, YouTube Shorts, Podcast Openers).

---

## 🛠️ Architecture & Core Modules

The project is structured following modular full-stack conventions using **Vite**, **React**, **TypeScript**, and **Express**:

1. **Vite Development Middleware:** Integrated straight into our Node.js back-end in `server.ts` to coordinate seamless production compilation and client serving.
2. **Web Audio Synthesizer Engine (`src/utils/audioEngine.ts`):** 
   - Uses `OfflineAudioContext` for instant, fast compilation of multiple concurrent audio tracks into a clean 16-bit PCM RIFF Wave blob.
   - Programmatic synthesis of custom, warm lo-fi kick drums, vinyl static sweeps, deep cinematic suspense drones, wind waves, and thunderous rain.
   - Syndicates vocals (fetched from Gemini TTS `/api/generate-tts` endpoint) with scheduled millisecond offset scheduling.
3. **AI Script Assistant:** Directs the **gemini-3.5-flash** engine to parse creative user prompts and output structured multi-track timelines detailing sound design recommendations and narrator voices.
4. **Interactive Timeline Canvas:** Visualizes each track (Dialogue Track 1, SFX Track 2, Music Bed Track 3) with full scrub bars, seek coordinates, and custom individual volume gain mixer knobs.

---

## 📁 Technical Keywords Layer & Directory Map

```text
/
├── server.ts               # Express back-end serving script generation and gemini-3.1-flash-tts-preview endpoints
├── src/
│   ├── types.ts            # Global schema declarations (Segments, AudioScript, VoiceOptions)
│   ├── App.tsx             # Primary visual dashboard container and state manager
│   ├── components/
│   │   ├── AudioTimeline.tsx   # Interactive mixer, slider tracks, visual spectrum, and WAV download trigger
│   │   ├── PromptSection.tsx   # Creative scene generator and production template selector (TikTok Ad, Podcast, Drama)
│   │   ├── ListenExamples.tsx  # Interactive click-to-load demo showcases
│   │   ├── GuideSection.tsx    # Emotion tagging tutorial (whispering, laughing, excited, scared, paused)
│   │   └── FAQSection.tsx      # Comprehensive SEO FAQ answering search variations
│   ├── utils/
│   │   ├── audioEngine.ts  # Web Audio API synthesizers, noise generators, and Offline WAV compiler
│   │   └── presets.ts      # Structured constant definitions for mock playbacks
```

---

## ⚡ Quick Start & Deployment

### 1. Prerequisites
Ensure you have **Node.js** (v18+) installed.

### 2. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY"
APP_URL="http://localhost:3000"
```

### 3. Install Dependencies & Build
```bash
# Install packages
npm install

# Run the full-stack development server
npm run dev

# Compile the application for production deployment
npm run build

# Start the compiled bundle CJS server
npm run start
```

---

## 🎯 Production Intent & Long-tail SEO Focus

This sound-stage solution is strategically designed to satisfy long-tail searches around:
- **seed audio text to speech** or **text to speech AI**
- **seed audio scene generator** or **AI audio generator**
- **podcast voice generator** or **video voiceover generator**
- **seed audio voice cloning** workflows

With high-fidelity layout styles, rich visual negative space, professional JetBrains Mono and Inter typography combinations, and zero boilerplate fluff, this repository is ready to be launched as a production-level SEO asset.

---
*Created in Google AI Studio. Empowered by Gemini AI.*
