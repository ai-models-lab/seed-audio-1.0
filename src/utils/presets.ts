import { Preset, VoiceOption, FAQItem } from "../types";

export const AUDIO_PRESETS: Preset[] = [
  {
    id: "tiktok-ad",
    name: "TikTok Video Ad",
    iconName: "Sparkles",
    description: "Fast-paced, hook-heavy script with high-impact sound design.",
    prompt: "A punchy, high-energy 15-second TikTok ad script introducing a revolutionary AI text-to-speech assistant. Start with a hook, insert a dramatic digital transition, and end with a strong CTA."
  },
  {
    id: "short-drama",
    name: "Suspenseful Short Drama",
    iconName: "Theater",
    description: "Multi-character conversational script with rich dramatic subtext.",
    prompt: "An intense, cinematic dialogue between two explorers who find a hidden artifact inside an ancient chamber. Include whispers, emotional shifts, background tremors, and heavy knocks."
  },
  {
    id: "podcast-intro",
    name: "Warm Podcast Opener",
    iconName: "Mic",
    description: "Welcoming and professional voiceover paired with soothing lo-fi beats.",
    prompt: "A professional and warm intro voiceover for 'The Cosmic Horizon Podcast'. Discuss the dawn of generative soundscapes and welcome the audience with relaxed background lofi."
  },
  {
    id: "game-trailer",
    name: "Epic Game Trailer",
    iconName: "Gamepad2",
    description: "Deep authoritative narration backed by booming cinematic hits.",
    prompt: "An epic, dark medieval fantasy trailer narrator voiceover. Speak with deep authority about an ancient dragon waking up, layered with wind, thunder, and orchestral suspense."
  },
  {
    id: "audiobook",
    name: "Audiobook Chapter",
    iconName: "BookOpen",
    description: "Balanced, immersive narrator flow with soft atmospheric cues.",
    prompt: "A comforting narration of a cozy evening in a wooden cabin during a winter storm. Highlight crackling fireplace sounds, gentle wind outside, and soft, breathing-like speech pauses."
  }
];

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "Kore",
    name: "Kore (Warm Professional)",
    gender: "female",
    accent: "US English",
    vibe: "Warm, professional, comforting, engaging",
    sampleDescription: "Perfect for documentaries, explainers, and audiobook narration."
  },
  {
    id: "Puck",
    name: "Puck (Energetic Youth)",
    gender: "male",
    accent: "US English",
    vibe: "Youthful, energetic, high-pace, enthusiastic",
    sampleDescription: "Ideal for TikTok ads, product launches, and video transitions."
  },
  {
    id: "Charon",
    name: "Charon (Deep Authority)",
    gender: "male",
    accent: "UK English",
    vibe: "Deep, resonant, dramatic, commanding",
    sampleDescription: "Best for movie/game trailers, news, and powerful speeches."
  },
  {
    id: "Fenrir",
    name: "Fenrir (Mysterious Narrator)",
    gender: "male",
    accent: "Nordic/US",
    vibe: "Dark, whispering, suspenseful, rich",
    sampleDescription: "Perfect for short horror dramas, thrillers, and mystery storytelling."
  },
  {
    id: "Zephyr",
    name: "Zephyr (Soft Breezy)",
    gender: "female",
    accent: "US English",
    vibe: "Soft, gentle, airy, relaxed",
    sampleDescription: "Great for meditation, sleep stories, and ambient background intros."
  }
];

export const SEO_FAQS: FAQItem[] = [
  {
    question: "What is Seed Audio (or Seedance Audio) AI?",
    answer: "Seed Audio is a groundbreaking multi-modal AI audio generation model (such as ByteDance's Doubao Seed Audio 1.0) capable of synthesizing entire audio scenes in a single prompt. Unlike traditional text-to-speech tools that only generate isolated voice narration, Seed Audio processes voiceover, multiple speaker dialogues, expressive non-verbal cues (like laughing, whispering, and breathing), ambient environmental background noise, and sound effects simultaneously, ensuring a perfectly mixed, natural-sounding audio export."
  },
  {
    question: "Is See Audio or Seed Audio the correct spelling?",
    answer: "While 'See Audio' is a common user misspelling, 'Seed Audio' or 'Seed-TTS' is the correct term for the highly advanced speech and dialog models developed by AI researchers. This applet bridges both search intents, providing a unified web preview studio to explore, generate, and edit multi-track voice assets."
  },
  {
    question: "How does the text-to-dialogue multi-speaker feature work?",
    answer: "By analyzing dialogue structures (such as 'Joe: ...' and 'Jane: ...'), Seed Audio automatically assigns distinctive prebuilt voice models (e.g., Puck, Charon, Kore) with custom emotional tags. The model sequences speaker turn-taking, matches appropriate pitches and pacing, and overlays custom environmental sounds directly underneath the spoken timeline."
  },
  {
    question: "What emotional prompts are supported in Seed Audio AI?",
    answer: "Seed Audio supports advanced expressive direction tags. You can embed inline prompt directives such as [cheerfully], [whispering], [laughing], [scared], or [short pause] directly into scripts. The AI voice engine processes these context tags to modulate tone, speed, spectral coloration, and breathing sounds naturally."
  },
  {
    question: "Can I download and use the generated audio commercially?",
    answer: "Yes, you can generate preview audio directly in our studio and download it as high-fidelity WAV files. All procedurally-synthesized sound effects, music beds, and Gemini-rendered TTS audio are royalty-free and can be exported for social video ads (TikTok, YouTube), podcasts, localization, short dramas, and storytelling work."
  }
];
