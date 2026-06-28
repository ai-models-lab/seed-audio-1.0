import React, { useState, useEffect } from "react";
import { AudioScript, Segment } from "./types";
import { AUDIO_PRESETS, VOICE_OPTIONS } from "./utils/presets";
import { renderFullScene, base64ToAudioBuffer } from "./utils/audioEngine";

import PromptSection from "./components/PromptSection";
import AudioTimeline from "./components/AudioTimeline";
import ListenExamples from "./components/ListenExamples";
import GuideSection from "./components/GuideSection";
import FAQSection from "./components/FAQSection";

import {
  Sparkles,
  Volume2,
  Sliders,
  Music,
  Trash2,
  Plus,
  Check,
  RotateCcw,
  Edit2,
  Save,
  Mic,
  AlertCircle,
  FileText,
  Play,
  Settings,
  HelpCircle
} from "lucide-react";

// Procedural voice generator helper for immediate fallback and examples loading
function createProceduralVoiceBuffer(text: string, voiceName: string, audioCtx: AudioContext): AudioBuffer {
  const words = text.split(" ");
  const wordCount = words.length;
  // approximate 0.4s per word, minimum 1.5s
  const duration = Math.max(1.5, wordCount * 0.45);
  const sampleRate = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  // Base pitch based on character voice selection
  let pitch = 200;
  if (voiceName === "Puck") pitch = 290;
  if (voiceName === "Charon") pitch = 115;
  if (voiceName === "Fenrir") pitch = 145;
  if (voiceName === "Zephyr") pitch = 240;

  for (let i = 0; i < channelData.length; i++) {
    const t = i / sampleRate;
    
    // Pulse-train voice carrier signal
    const carrier = Math.sin(2 * Math.PI * pitch * t) + 
                    0.4 * Math.sin(4 * Math.PI * pitch * t) + 
                    0.25 * Math.sin(6 * Math.PI * pitch * t);
    
    // Syllables gate rhythm envelope
    const syllableIndex = Math.floor(t / 0.45);
    const syllableTime = t % 0.45;
    const isSilenced = syllableIndex >= wordCount || syllableTime > 0.32;
    const envelope = isSilenced ? 0 : Math.sin(Math.PI * (syllableTime / 0.32));
    
    // Soft random speech noise filter
    const noise = (Math.random() * 2 - 1) * 0.1;
    
    channelData[i] = (carrier * 0.3 + noise) * envelope * 0.45;
  }
  return buffer;
}

export default function App() {
  const [activeScript, setActiveScript] = useState<AudioScript>({
    title: "",
    description: "",
    musicStyle: "",
    ambientSfx: "",
    segments: []
  });

  const [voiceBuffers, setVoiceBuffers] = useState<Map<number, AudioBuffer>>(new Map());
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  
  const [isRenderingWav, setIsRenderingWav] = useState(false);
  const [renderedWavUrl, setRenderedWavUrl] = useState<string | null>(null);

  const [editingSegmentIndex, setEditingSegmentIndex] = useState<number | null>(null);
  const [editSpeaker, setEditSpeaker] = useState("");
  const [editVoiceName, setEditVoiceName] = useState<Segment["voiceName"]>("Kore");
  const [editEmotion, setEditEmotion] = useState<Segment["emotion"]>("calm");
  const [editText, setEditText] = useState("");
  const [editDuration, setEditDuration] = useState(5);

  const [apiMode, setApiMode] = useState<"gemini" | "synthesizer">("gemini");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load demo-ad initially on mount
  useEffect(() => {
    handleLoadDemo("demo-ad");
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Load a high-fidelity preset demo straight to the studio timeline
  const handleLoadDemo = (exampleId: string) => {
    let scriptData: AudioScript;
    
    if (exampleId === "demo-ad") {
      scriptData = {
        title: "TikTok Ad: Boost Your Focus",
        description: "Fast-paced, hook-heavy video ad production introducing AI audio.",
        musicStyle: "cyberpunk synth wave beats",
        ambientSfx: "quiet tech laboratory hum",
        segments: [
          {
            speaker: "Narrator",
            text: "Are you still wasting hours trying to get in the zone? Stop scrolling.",
            emotion: "excited",
            voiceName: "Puck",
            duration: 4
          },
          {
            speaker: "SFX: Digital Swoosh",
            text: "A dramatic sweep transition plays as track shifts",
            emotion: "none",
            voiceName: "Kore",
            duration: 2
          },
          {
            speaker: "Voice 1: Joe",
            text: "I used to struggle too. Then I discovered the power of Seed Audio.",
            emotion: "cheerful",
            voiceName: "Kore",
            duration: 5
          },
          {
            speaker: "Narrator",
            text: "Click below to unlock the absolute future of voice. Generate yours now!",
            emotion: "authoritative",
            voiceName: "Charon",
            duration: 6
          }
        ]
      };
    } else if (exampleId === "demo-drama") {
      scriptData = {
        title: "The Midnight Discovery",
        description: "An intense, cinematic dialogue in a rainy storm.",
        musicStyle: "cinematic orchestral suspense",
        ambientSfx: "heavy rain on rooftop with thunder",
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
            text: "Calm down. It's just the storm. Wait... Did the lights just flicker?",
            emotion: "scared",
            voiceName: "Zephyr",
            duration: 5
          },
          {
            speaker: "SFX: Wooden Knock",
            text: "Three heavy, slow knocks echo on a thick door",
            emotion: "none",
            voiceName: "Charon",
            duration: 3
          },
          {
            speaker: "Voice 1: Joe",
            text: "Don't open it. Whatever you do, do NOT open that door.",
            emotion: "dramatic",
            voiceName: "Fenrir",
            duration: 6
          }
        ]
      };
    } else {
      scriptData = {
        title: "Tech Horizon Podcast Intro",
        description: "Professional, relaxing opening with lofi music bed.",
        musicStyle: "ambient lo-fi beats",
        ambientSfx: "vinyl crackle static",
        segments: [
          {
            speaker: "Narrator",
            text: "Welcome back to Tech Horizon. The weekly podcast where we look into the future of humanity and artificial intelligence.",
            emotion: "cheerful",
            voiceName: "Kore",
            duration: 7
          },
          {
            speaker: "SFX: Record Scratch",
            text: "A gentle scratch sound as the rhythm drops in",
            emotion: "none",
            voiceName: "Kore",
            duration: 2
          },
          {
            speaker: "Narrator",
            text: "Today, we're talking about Seed Audio, the revolutionary vocal model. Let's dive in.",
            emotion: "calm",
            voiceName: "Kore",
            duration: 6
          }
        ]
      };
    }

    setActiveScript(scriptData);
    setRenderedWavUrl(null);
    setEditingSegmentIndex(null);

    // Pre-populate procedural buffers so that it plays beautifully instantly!
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffers = new Map<number, AudioBuffer>();
    scriptData.segments.forEach((seg, idx) => {
      if (!seg.speaker.startsWith("SFX:")) {
        buffers.set(idx, createProceduralVoiceBuffer(seg.text, seg.voiceName, audioCtx));
      }
    });
    setVoiceBuffers(buffers);
    triggerToast(`Loaded "${scriptData.title}" sample with instant playback!`);
  };

  // 2. Draft script using server-side Gemini 3.5 Flash
  const handleGenerateScript = async (promptText: string, presetType: string) => {
    setIsGeneratingScript(true);
    setRenderedWavUrl(null);
    setEditingSegmentIndex(null);
    
    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText, presetType })
      });

      if (!response.ok) throw new Error("Server failed to generate script.");
      const data: AudioScript = await response.json();
      
      setActiveScript(data);
      triggerToast("Designed scene successfully! Now generating vocal tracks...");
      
      // Auto-trigger speech generation for new segments!
      await generateAllVocals(data);

    } catch (error: any) {
      console.error(error);
      triggerToast("Failed to write AI script. Loading general preset fallback instead.");
      handleLoadDemo("demo-ad");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // 3. Render Speech for each segment using Gemini TTS
  const generateAllVocals = async (scriptObj: AudioScript) => {
    setIsGeneratingAll(true);
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const newBuffers = new Map<number, AudioBuffer>();

    for (let i = 0; i < scriptObj.segments.length; i++) {
      const seg = scriptObj.segments[i];
      if (seg.speaker.startsWith("SFX:")) continue;

      // Update UI loading state for this block
      try {
        const response = await fetch("/api/generate-tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: seg.text,
            voiceName: seg.voiceName,
            emotion: seg.emotion
          })
        });

        const data = await response.json();
        
        if (data.success && data.audioData) {
          // Success: Decode actual Gemini speech audio!
          const buffer = await base64ToAudioBuffer(data.audioData, audioCtx);
          newBuffers.set(i, buffer);
          setApiMode("gemini");
        } else {
          // Fallback: Create dynamic synthesized robotic speech instantly
          const buffer = createProceduralVoiceBuffer(seg.text, seg.voiceName, audioCtx);
          newBuffers.set(i, buffer);
          setApiMode("synthesizer");
        }
      } catch (err) {
        console.error("Vocal generation failed, loading local synth voice", err);
        const buffer = createProceduralVoiceBuffer(seg.text, seg.voiceName, audioCtx);
        newBuffers.set(i, buffer);
        setApiMode("synthesizer");
      }

      // Incrementally update state to show loaded blocks on timeline
      setVoiceBuffers(new Map(newBuffers));
    }

    setIsGeneratingAll(false);
    triggerToast("Vocal synthesis complete! Press 'Play' to hear the mixed studio preview.");
  };

  // 4. Manual trigger to regenerate vocal track
  const handleRegenerateVocals = () => {
    generateAllVocals(activeScript);
  };

  // 5. Offline render everything to WAV
  const handleRenderWav = async () => {
    setIsRenderingWav(true);
    try {
      const wavBlob = await renderFullScene(activeScript, voiceBuffers);
      const url = URL.createObjectURL(wavBlob);
      setRenderedWavUrl(url);
      triggerToast("Audio render complete! Downloadable WAV file is ready.");
    } catch (err) {
      console.error(err);
      triggerToast("WAV render failed. Try again.");
    } finally {
      setIsRenderingWav(false);
    }
  };

  // 6. Dialogue Segment Editor Actions
  const handleStartEdit = (idx: number) => {
    const seg = activeScript.segments[idx];
    setEditingSegmentIndex(idx);
    setEditSpeaker(seg.speaker);
    setEditVoiceName(seg.voiceName);
    setEditEmotion(seg.emotion);
    setEditText(seg.text);
    setEditDuration(seg.duration);
  };

  const handleSaveEdit = () => {
    if (editingSegmentIndex === null) return;

    const updatedSegments = [...activeScript.segments];
    updatedSegments[editingSegmentIndex] = {
      speaker: editSpeaker,
      voiceName: editVoiceName,
      emotion: editEmotion,
      text: editText,
      duration: editDuration
    };

    const newScript = {
      ...activeScript,
      segments: updatedSegments
    };

    setActiveScript(newScript);
    setEditingSegmentIndex(null);
    setRenderedWavUrl(null);

    // Re-render single segment voice buffer
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const newBuffers = new Map(voiceBuffers);
    if (!editSpeaker.startsWith("SFX:")) {
      newBuffers.set(editingSegmentIndex, createProceduralVoiceBuffer(editText, editVoiceName, audioCtx));
    } else {
      newBuffers.delete(editingSegmentIndex);
    }
    setVoiceBuffers(newBuffers);
    triggerToast("Segment updated.");
  };

  const handleAddSegment = () => {
    const newSeg: Segment = {
      speaker: "Narrator",
      voiceName: "Kore",
      emotion: "calm",
      text: "New script segment text block.",
      duration: 5
    };
    
    const newScript = {
      ...activeScript,
      segments: [...activeScript.segments, newSeg]
    };
    
    setActiveScript(newScript);
    setRenderedWavUrl(null);

    // Add voice buffer
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const newBuffers = new Map(voiceBuffers);
    newBuffers.set(newScript.segments.length - 1, createProceduralVoiceBuffer(newSeg.text, newSeg.voiceName, audioCtx));
    setVoiceBuffers(newBuffers);
    triggerToast("New dialogue segment added.");
  };

  const handleDeleteSegment = (idx: number) => {
    const updatedSegments = activeScript.segments.filter((_, i) => i !== idx);
    const newScript = {
      ...activeScript,
      segments: updatedSegments
    };

    // Re-index buffers map
    const newBuffers = new Map<number, AudioBuffer>();
    let bufIdx = 0;
    activeScript.segments.forEach((seg, i) => {
      if (i === idx) return; // skipped
      const oldBuf = voiceBuffers.get(i);
      if (oldBuf) {
        newBuffers.set(bufIdx, oldBuf);
      }
      bufIdx++;
    });

    setActiveScript(newScript);
    setVoiceBuffers(newBuffers);
    setRenderedWavUrl(null);
    setEditingSegmentIndex(null);
    triggerToast("Segment deleted.");
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans antialiased">
      
      {/* Toast Alert Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-zinc-800 text-sm animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Primary Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-2xl text-white shadow-sm shadow-indigo-200">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-zinc-900 text-base tracking-tight">Seed Audio</h1>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">Scene Producer 1.0</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 font-mono text-[10px]">
              <span className={`h-1.5 w-1.5 rounded-full ${apiMode === "gemini" ? "bg-indigo-500" : "bg-emerald-500"}`} />
              {apiMode === "gemini" ? "GEMINI AI ONLINE" : "LOCAL SYNTH ACTIVE"}
            </span>
            <button
              onClick={handleRegenerateVocals}
              disabled={isGeneratingAll}
              className="p-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-500 rounded-xl transition-colors cursor-pointer"
              title="Regenerate Vocal Clips"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Intro/Hero Text block */}
        <div className="max-w-3xl mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-3 font-display">
            The Multi-Track AI Sound Stage
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Describe characters, atmospheres, and cinematic soundtracks in plain prose. 
            Seed Audio builds complete soundscapes—sequencing voices, synthesizing environmental noise, and laying down rich lo-fi or dramatic music beds perfectly in sync.
          </p>
        </div>

        {/* Workspace Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column Controls (span 5) */}
          <div className="lg:col-span-5 space-y-8">
            <PromptSection
              onGenerate={handleGenerateScript}
              isGeneratingScript={isGeneratingScript}
            />
            
            <ListenExamples
              onLoadExample={handleLoadDemo}
              activeScriptTitle={activeScript.title}
            />
          </div>

          {/* Right Column Timeline View & Segment editor (span 7) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Visual multi-track timelines */}
            <AudioTimeline
              script={activeScript}
              voiceBuffers={voiceBuffers}
              isGeneratingAll={isGeneratingAll}
              onDownloadAll={handleRegenerateVocals}
              onRenderWav={handleRenderWav}
              isRenderingWav={isRenderingWav}
              renderedWavUrl={renderedWavUrl}
            />

            {/* Script Script Editor details */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm">Dialogue & Audio Sequence Script</h3>
                  <p className="text-xs text-zinc-500">Edit, add, or customize segments to shape your narrative.</p>
                </div>
                <button
                  id="add-segment-btn"
                  onClick={handleAddSegment}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Block
                </button>
              </div>

              {/* Editing Form */}
              {editingSegmentIndex !== null && (
                <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-5 mb-5 space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Edit Block #{editingSegmentIndex + 1}</span>
                    <button
                      onClick={() => setEditingSegmentIndex(null)}
                      className="text-xs text-zinc-400 hover:text-zinc-600 font-medium"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Speaker/Role</label>
                      <input
                        type="text"
                        value={editSpeaker}
                        onChange={(e) => setEditSpeaker(e.target.value)}
                        className="w-full text-xs rounded-xl border border-zinc-200 p-2.5 bg-white text-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Duration (sec)</label>
                      <input
                        type="number"
                        min="2"
                        max="15"
                        value={editDuration}
                        onChange={(e) => setEditDuration(parseInt(e.target.value) || 5)}
                        className="w-full text-xs rounded-xl border border-zinc-200 p-2.5 bg-white text-zinc-800"
                      />
                    </div>
                  </div>

                  {!editSpeaker.startsWith("SFX:") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Voice Character</label>
                        <select
                          value={editVoiceName}
                          onChange={(e) => setEditVoiceName(e.target.value as Segment["voiceName"])}
                          className="w-full text-xs rounded-xl border border-zinc-200 p-2.5 bg-white text-zinc-800"
                        >
                          {VOICE_OPTIONS.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Expression/Emotion</label>
                        <select
                          value={editEmotion}
                          onChange={(e) => setEditEmotion(e.target.value as Segment["emotion"])}
                          className="w-full text-xs rounded-xl border border-zinc-200 p-2.5 bg-white text-zinc-800"
                        >
                          <option value="calm">Calm (Neutral)</option>
                          <option value="cheerful">Cheerful (Happy)</option>
                          <option value="whispering">Whispering</option>
                          <option value="excited">Excited</option>
                          <option value="serious">Serious</option>
                          <option value="dramatic">Dramatic</option>
                          <option value="scared">Scared</option>
                          <option value="authoritative">Authoritative</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                      {editSpeaker.startsWith("SFX:") ? "Effect Action / Trigger Description" : "Spoken Text Content"}
                    </label>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="w-full text-xs rounded-xl border border-zinc-200 p-2.5 bg-white text-zinc-800 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveEdit}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Block
                  </button>
                </div>
              )}

              {/* Script Blocks Grid List */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {activeScript.segments.map((seg, idx) => {
                  const isSfx = seg.speaker.startsWith("SFX:");
                  const isEditing = editingSegmentIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all flex justify-between items-start gap-4 ${
                        isEditing
                          ? "border-indigo-200 bg-indigo-50/20"
                          : isSfx
                          ? "border-zinc-100 bg-zinc-50/20"
                          : "border-zinc-100 hover:border-zinc-200 bg-white"
                      }`}
                    >
                      <div className="space-y-1.5 max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isSfx ? "bg-violet-50 text-violet-700" : "bg-zinc-100 text-zinc-700"
                          }`}>
                            {seg.speaker}
                          </span>
                          {!isSfx && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Voice: {seg.voiceName} • {seg.emotion}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {seg.duration}s
                          </span>
                        </div>
                        <p className="text-xs text-zinc-700 leading-relaxed font-mono">
                          {seg.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(idx)}
                          className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Block"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSegment(idx)}
                          className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>

        {/* Guides & FAQs Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GuideSection />
          <FAQSection />
        </div>

      </main>

      {/* Structured footer for organic branding */}
      <footer className="border-t border-zinc-100 bg-white mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-zinc-400" />
            <span>© 2026 Seed Audio AI Studio. Powered by Doubao Seed Audio 1.0 & Gemini TTS models.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-600 transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-zinc-600 transition-colors">Developer API</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
