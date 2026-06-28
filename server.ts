import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("GEMINI_API_KEY is not configured. Running in local fallback mode.");
}

// 1. API: Generate high-fidelity audio production script (using gemini-3.5-flash)
app.post("/api/generate-script", async (req, res) => {
  const { prompt, presetType } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  const systemInstruction = `You are a professional audio director, sound designer, and copywriter.
Your goal is to turn a user's prompt into a complete, ready-to-render multi-track audio script (voiceover narration, character dialogues, sound effects (SFX), and music cues).

The user is requesting an audio production for: ${presetType || "General Concept"}.
Prompt: "${prompt}"

Format your response as a valid JSON object matching this schema exactly:
{
  "title": "A short engaging title for the audio track",
  "description": "A brief overview of the audio track",
  "musicStyle": "A description of the background music (e.g., 'ambient lo-fi', 'cinematic orchestral', 'cyberpunk synth wave')",
  "ambientSfx": "A description of the general environment sfx (e.g., 'rainy city street', 'quiet coffee shop', 'sci-fi spaceship hum')",
  "segments": [
    {
      "speaker": "Specify narrator name or character name (e.g., 'Narrator', 'Voice 1: Joe', 'Voice 2: Jane', 'SFX: Thunder', 'MUSIC: Rise')",
      "text": "The script lines to be spoken. If speaker is 'SFX' or 'MUSIC', describe the audio action (e.g., 'Distant rolling thunder climbs then fades', 'A soft synth pad chord fades in'). Keep spoken text natural and punchy.",
      "emotion": "Select one: 'cheerful', 'whispering', 'serious', 'excited', 'calm', 'dramatic', 'scared', 'authoritative', 'none'",
      "voiceName": "Select from: 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr' (Kore is warm/professional, Puck is high/energetic, Charon is deep/authoritative, Fenrir is dark/mysterious, Zephyr is soft/breezy). Choose appropriate voices for dialogue.",
      "duration": 5
    }
  ]
}

Ensure the output is 100% valid JSON and nothing else. No markdown wrappers like \`\`\`json.`;

  if (!ai) {
    // Return mock script when API is missing
    return res.json(getMockScript(prompt, presetType));
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a script for: "${prompt}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text || "";
    const parsedData = JSON.parse(text.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini script generation failed, falling back to procedural script:", error);
    return res.json(getMockScript(prompt, presetType));
  }
});

// 2. API: Generate actual speech using gemini-3.1-flash-tts-preview
app.post("/api/generate-tts", async (req, res) => {
  const { text, voiceName, emotion } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required." });
  }

  if (!ai) {
    return res.json({ success: false, fallback: true, reason: "No API key configured." });
  }

  try {
    const speakPrompt = `Say ${emotion || "naturally"}: ${text}`;
    const selectedVoice = voiceName || "Kore"; // Kore, Puck, Charon, Fenrir, Zephyr

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: speakPrompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      return res.json({ success: true, audioData: base64Audio });
    } else {
      throw new Error("No audio payload returned from Gemini TTS.");
    }
  } catch (error: any) {
    console.error("Gemini TTS generation failed:", error);
    return res.json({ success: false, fallback: true, reason: error.message || "Failed to generate TTS" });
  }
});

// Helper: Provide rich fallback script templates matching the exact schema
function getMockScript(prompt: string, presetType: string = "General") {
  const cleanPrompt = prompt.substring(0, 80);
  
  if (presetType === "TikTok Video Ad") {
    return {
      title: "TikTok Ad: Boost Your Focus",
      description: `Engaging and fast-paced commercial script for: ${cleanPrompt}`,
      musicStyle: "cyberpunk synth wave",
      ambientSfx: "quiet coffee shop with soft typing",
      segments: [
        {
          speaker: "Narrator",
          text: "Are you still wasting hours trying to get in the zone? Stop scrolling.",
          emotion: "excited",
          voiceName: "Puck",
          duration: 4
        },
        {
          speaker: "SFX: Swoosh",
          text: "A sharp digital swoosh sound transition effect plays",
          emotion: "none",
          voiceName: "Kore",
          duration: 2
        },
        {
          speaker: "Voice 1: Joe",
          text: "I used to struggle too. Then I discovered this game-changing system.",
          emotion: "cheerful",
          voiceName: "Kore",
          duration: 5
        },
        {
          speaker: "Narrator",
          text: "Click the link below to unlock the absolute future of audio generation. Download now!",
          emotion: "authoritative",
          voiceName: "Charon",
          duration: 6
        }
      ]
    };
  } else if (presetType === "Short Drama") {
    return {
      title: "The Midnight Discovery",
      description: "An intense suspenseful dialogue script.",
      musicStyle: "cinematic orchestral suspense",
      ambientSfx: "rainy city street with distant thunder",
      segments: [
        {
          speaker: "Voice 1: Joe",
          text: "Did you hear that? I swear someone is standing right outside the door.",
          emotion: "whispering",
          voiceName: "Fenrir",
          duration: 5
        },
        {
          speaker: "Voice 2: Jane",
          text: "Calm down. It's just the wind. Or... wait. Did the lights just flicker?",
          emotion: "scared",
          voiceName: "Zephyr",
          duration: 6
        },
        {
          speaker: "SFX: Knock",
          text: "Three heavy, slow knocks echo on a wooden door",
          emotion: "none",
          voiceName: "Charon",
          duration: 3
        },
        {
          speaker: "Voice 1: Joe",
          text: "Don't open it. Whatever you do, do NOT open that door.",
          emotion: "dramatic",
          voiceName: "Fenrir",
          duration: 5
        }
      ]
    };
  } else if (presetType === "Podcast Intro") {
    return {
      title: "Tech Horizon Podcast Intro",
      description: "Warm, professional, and inviting podcast opener.",
      musicStyle: "ambient lo-fi beats",
      ambientSfx: "vinyl static crackle",
      segments: [
        {
          speaker: "Narrator",
          text: "Welcome back to Tech Horizon. The weekly podcast where we look into the future of humanity and artificial intelligence.",
          emotion: "cheerful",
          voiceName: "Kore",
          duration: 7
        },
        {
          speaker: "SFX: Vinyl Beat",
          text: "The lo-fi beat climbs up in volume, setting a warm mood",
          emotion: "none",
          voiceName: "Kore",
          duration: 4
        },
        {
          speaker: "Narrator",
          text: "Today, we're talking about Seed Audio, the revolutionary model reshaping text-to-speech forever. Let's dive in.",
          emotion: "calm",
          voiceName: "Kore",
          duration: 6
        }
      ]
    };
  } else {
    // Default general template
    return {
      title: "AI Audio Generation Showcase",
      description: `An immersive multitrack narrative for: ${cleanPrompt}`,
      musicStyle: "ambient cinematic pad",
      ambientSfx: "gentle forest breeze with distant birds",
      segments: [
        {
          speaker: "Narrator",
          text: "In the depths of technology, sound has found a new language.",
          emotion: "calm",
          voiceName: "Zephyr",
          duration: 5
        },
        {
          speaker: "Voice 1: Joe",
          text: "We can now describe entire audio scenes. Dialogue, sound effects, ambience—all aligned perfectly.",
          emotion: "serious",
          voiceName: "Charon",
          duration: 6
        },
        {
          speaker: "SFX: Forest breeze",
          text: "A serene, sweeping gust of wind rustles leaves",
          emotion: "none",
          voiceName: "Zephyr",
          duration: 3
        },
        {
          speaker: "Narrator",
          text: "Welcome to the future of sound design. Designed with Seed Audio.",
          emotion: "cheerful",
          voiceName: "Kore",
          duration: 5
        }
      ]
    };
  }
}

// 3. Vite middleware for development & static hosting in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static assets from dist/ folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
