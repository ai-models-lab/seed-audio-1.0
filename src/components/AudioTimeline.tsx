import React, { useState, useEffect, useRef } from "react";
import { AudioScript, Segment } from "../types";
import { Play, Pause, Square, Download, Volume2, Sliders, Music, VolumeX, Radio, Check, Sparkles } from "lucide-react";
import { synthesizeMusicBed, synthesizeAmbientSfx, renderFullScene, base64ToAudioBuffer } from "../utils/audioEngine";

interface AudioTimelineProps {
  script: AudioScript;
  voiceBuffers: Map<number, AudioBuffer>;
  isGeneratingAll: boolean;
  onDownloadAll: () => void;
  onRenderWav: () => Promise<void>;
  isRenderingWav: boolean;
  renderedWavUrl: string | null;
}

export default function AudioTimeline({
  script,
  voiceBuffers,
  isGeneratingAll,
  onDownloadAll,
  onRenderWav,
  isRenderingWav,
  renderedWavUrl
}: AudioTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [voiceVolume, setVoiceVolume] = useState(1.0);
  const [sfxVolume, setSfxVolume] = useState(0.4);
  const [musicVolume, setMusicVolume] = useState(0.25);
  const [isMuted, setIsMuted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const playStateRef = useRef<{
    startTime: number;
    pauseOffset: number;
    intervalId?: number;
    activeSources: any[];
  }>({
    startTime: 0,
    pauseOffset: 0,
    activeSources: []
  });

  // Calculate total duration
  const totalDuration = script.segments.reduce((acc, seg) => acc + seg.duration, 0) || 10;

  // Cleanup on unmount or script change
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [script]);

  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const startPlayback = async () => {
    initAudioCtx();
    const ctx = audioCtxRef.current!;
    
    // Clear old active sources
    stopPlayback();

    setIsPlaying(true);
    const startT = ctx.currentTime;
    playStateRef.current.startTime = startT - playStateRef.current.pauseOffset;
    
    // Create master tracks
    const voiceGain = ctx.createGain();
    voiceGain.gain.value = isMuted ? 0 : voiceVolume;

    const sfxGain = ctx.createGain();
    sfxGain.gain.value = isMuted ? 0 : sfxVolume;

    const musicGain = ctx.createGain();
    musicGain.gain.value = isMuted ? 0 : musicVolume;

    voiceGain.connect(ctx.destination);
    sfxGain.connect(ctx.destination);
    musicGain.connect(ctx.destination);

    const sources: any[] = [];

    // 1. Play procedural Ambient Music Bed
    try {
      synthesizeMusicBed(ctx, script.musicStyle, totalDuration, musicGain);
    } catch (e) {
      console.error("Synthesize music failed:", e);
    }

    // 2. Play procedural Environment SFX
    try {
      synthesizeAmbientSfx(ctx, script.ambientSfx, totalDuration, sfxGain);
    } catch (e) {
      console.error("Synthesize ambient SFX failed:", e);
    }

    // 3. Play Speech segments at their respective timeline offsets
    let currentOffset = 0;
    
    script.segments.forEach((seg, idx) => {
      const segStart = currentOffset;
      const segEnd = currentOffset + seg.duration;
      currentOffset = segEnd;

      // Only schedule if it's in the future of the current resume position
      const pauseOffset = playStateRef.current.pauseOffset;
      if (segEnd <= pauseOffset) return;

      const triggerDelay = Math.max(0, segStart - pauseOffset);

      if (seg.speaker.startsWith("SFX:")) {
        // Synthesize brief targeted sound effect
        const sfxType = seg.text.toLowerCase();
        
        const triggerSFX = () => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(sfxGain);

          if (sfxType.includes("knock")) {
            for (let k = 0; k < 3; k++) {
              const kt = ctx.currentTime + k * 0.35;
              osc.frequency.setValueAtTime(140, kt);
              osc.frequency.exponentialRampToValueAtTime(10, kt + 0.1);
              gain.gain.setValueAtTime(0, kt);
              gain.gain.linearRampToValueAtTime(0.5, kt + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.001, kt + 0.15);
            }
            osc.start();
            osc.stop(ctx.currentTime + 1.5);
          } else if (sfxType.includes("swoosh") || sfxType.includes("whoosh")) {
            const bufferSize = ctx.sampleRate * 1.5;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            const filterNode = ctx.createBiquadFilter();
            filterNode.type = "bandpass";
            filterNode.frequency.setValueAtTime(120, ctx.currentTime);
            filterNode.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.6);
            filterNode.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 1.3);

            const sGain = ctx.createGain();
            sGain.gain.setValueAtTime(0, ctx.currentTime);
            sGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.4);
            sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);

            noiseSource.connect(filterNode);
            filterNode.connect(sGain);
            sGain.connect(sfxGain);

            noiseSource.start();
            noiseSource.stop(ctx.currentTime + 1.4);
          } else {
            // Beep tone
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
          }
        };

        const timeoutId = setTimeout(triggerSFX, triggerDelay * 1000);
        sources.push({ type: "timeout", id: timeoutId });

      } else {
        // Voice node
        const buffer = voiceBuffers.get(idx);
        
        if (buffer) {
          // Play the real Gemini TTS audio
          const voiceSource = ctx.createBufferSource();
          voiceSource.buffer = buffer;
          voiceSource.connect(voiceGain);

          const speechOffset = Math.max(0, pauseOffset - segStart);
          voiceSource.start(ctx.currentTime + triggerDelay, speechOffset);
          sources.push({ type: "node", source: voiceSource });
        } else {
          // Speak fallback using standard browser SpeechSynthesis if Gemini audio is absent
          const triggerSpeechFallback = () => {
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(seg.text);
              
              // Map voice parameters roughly
              if (seg.voiceName === "Puck") {
                utterance.pitch = 1.3;
                utterance.rate = 1.15;
              } else if (seg.voiceName === "Charon") {
                utterance.pitch = 0.7;
                utterance.rate = 0.9;
              } else if (seg.voiceName === "Fenrir") {
                utterance.pitch = 0.8;
                utterance.rate = 0.85;
              } else if (seg.voiceName === "Zephyr") {
                utterance.pitch = 1.1;
                utterance.rate = 0.95;
              } else {
                utterance.pitch = 1.0;
                utterance.rate = 1.0;
              }

              // Try matching accents/genders in available voices
              const voices = window.speechSynthesis.getVoices();
              const isFemale = seg.voiceName === "Kore" || seg.voiceName === "Zephyr";
              const targetVoice = voices.find(v => {
                const name = v.name.toLowerCase();
                if (isFemale) return name.includes("female") || name.includes("google us female") || name.includes("zira") || name.includes("samantha");
                return name.includes("male") || name.includes("david") || name.includes("microsoft");
              });
              if (targetVoice) utterance.voice = targetVoice;

              window.speechSynthesis.speak(utterance);
            }
          };

          const timeoutId = setTimeout(triggerSpeechFallback, triggerDelay * 1000);
          sources.push({ type: "timeout", id: timeoutId });
        }
      }
    });

    // Start timer interval to animate the slider
    const interval = window.setInterval(() => {
      const elapsed = ctx.currentTime - playStateRef.current.startTime;
      if (elapsed >= totalDuration) {
        stopPlayback();
      } else {
        setCurrentTime(elapsed);
      }
    }, 100);

    playStateRef.current.activeSources = sources;
    playStateRef.current.intervalId = interval;
  };

  const pausePlayback = () => {
    if (!isPlaying) return;
    const ctx = audioCtxRef.current;
    if (ctx) {
      const elapsed = ctx.currentTime - playStateRef.current.startTime;
      playStateRef.current.pauseOffset = Math.min(elapsed, totalDuration);
    }
    stopPlayback(true);
  };

  const stopPlayback = (keepOffset = false) => {
    setIsPlaying(false);
    if (!keepOffset) {
      playStateRef.current.pauseOffset = 0;
      setCurrentTime(0);
    }

    if (playStateRef.current.intervalId) {
      clearInterval(playStateRef.current.intervalId);
      playStateRef.current.intervalId = undefined;
    }

    // Stop active audio nodes
    playStateRef.current.activeSources.forEach(src => {
      if (src.type === "node" && src.source) {
        try {
          src.source.stop();
        } catch (e) {}
      } else if (src.type === "timeout" && src.id) {
        clearTimeout(src.id);
      }
    });
    playStateRef.current.activeSources = [];

    // Cancel browser TTS speech if any
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Convert time to mm:ss
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate timeline grid positions
  let currentAccumulator = 0;
  const blocks = script.segments.map((seg, idx) => {
    const widthPercent = (seg.duration / totalDuration) * 100;
    const leftPercent = (currentAccumulator / totalDuration) * 100;
    currentAccumulator += seg.duration;
    return {
      ...seg,
      leftPercent,
      widthPercent,
      index: idx
    };
  });

  return (
    <div id="audio-timeline-card" className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-zinc-900 text-lg">Interactive Audio Timeline</h3>
          </div>
          <p className="text-sm text-zinc-500">
            {script.title ? `Previewing: "${script.title}"` : "Mix, arrange and listen to generated multi-track audio."}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              id="pause-playback-btn"
              onClick={pausePlayback}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-white" /> Pause
            </button>
          ) : (
            <button
              id="play-playback-btn"
              onClick={startPlayback}
              disabled={isGeneratingAll}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> Play Studio
            </button>
          )}

          <button
            id="stop-playback-btn"
            onClick={() => stopPlayback(false)}
            className="p-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
            title="Stop & Reset"
          >
            <Square className="w-4 h-4" />
          </button>

          {renderedWavUrl ? (
            <a
              id="download-wav-btn"
              href={renderedWavUrl}
              download={`${script.title ? script.title.replace(/\s+/g, "_") : "seed_audio"}.wav`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download WAV
            </a>
          ) : (
            <button
              id="render-wav-btn"
              onClick={onRenderWav}
              disabled={isRenderingWav || isGeneratingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-60 text-zinc-700 font-medium text-sm transition-colors cursor-pointer"
            >
              {isRenderingWav ? (
                <>
                  <span className="h-4 w-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Render Scene
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Spectrum / Waveform animation during playback */}
      {isPlaying && (
        <div className="flex items-center justify-between gap-1 h-8 px-4 mb-6 bg-indigo-50/50 rounded-xl border border-indigo-100/50 overflow-hidden animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-500 animate-spin" />
            <span className="text-xs font-mono font-medium text-indigo-600">LIVE SYNTHESIS FEED ACTIVE</span>
          </div>
          <div className="flex items-end gap-[3px] h-full pb-1">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="w-[3px] bg-indigo-500 rounded-full"
                style={{
                  height: `${Math.max(15, Math.floor(Math.random() * 100))}%`,
                  transition: "height 80ms ease-in-out"
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Multi-Track Canvas Timeline */}
      <div className="space-y-4 mb-6">
        
        {/* Timeline Header Ruler */}
        <div className="relative h-6 border-b border-zinc-100 mb-2">
          <div className="absolute left-0 bottom-1 text-[10px] font-mono text-zinc-400">00:00</div>
          <div className="absolute right-0 bottom-1 text-[10px] font-mono text-zinc-400">{formatTime(totalDuration)}</div>
          {/* Halfway tick */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[10px] font-mono text-zinc-400">{formatTime(totalDuration / 2)}</div>
          
          {/* Current playhead line */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-indigo-600 z-10 transition-all duration-100"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-indigo-600 border border-white shadow-sm" />
          </div>
        </div>

        {/* 1. VOICE & DIALOGUE TRACK */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-44 flex items-center gap-2 shrink-0">
            <Volume2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-zinc-700">Voice & Dialogue</span>
            <span className="ml-auto text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">Track 1</span>
          </div>
          <div className="relative w-full h-16 bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden flex items-center">
            {/* Visual blocks */}
            {blocks.map((b) => {
              const hasAudio = voiceBuffers.has(b.index);
              const isActive = currentTime >= b.leftPercent * totalDuration / 100 && currentTime < (b.leftPercent + b.widthPercent) * totalDuration / 100;

              return (
                <div
                  key={b.index}
                  className={`absolute h-12 rounded-lg border flex flex-col justify-center px-3 transition-all ${
                    b.speaker.startsWith("SFX:") ? "hidden" : ""
                  } ${
                    isActive
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-sm z-20 scale-[1.01]"
                      : hasAudio
                      ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                      : "bg-zinc-100/80 border-zinc-200 text-zinc-600"
                  }`}
                  style={{
                    left: `${b.leftPercent}%`,
                    width: `${b.widthPercent}%`
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold truncate max-w-[80%]">
                      {b.speaker} ({b.voiceName})
                    </span>
                    {hasAudio && !isActive && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                  </div>
                  <span className="text-[9px] truncate opacity-90 font-mono">
                    {b.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. SOUND EFFECTS (SFX) TRACK */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-44 flex items-center gap-2 shrink-0">
            <Sliders className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-semibold text-zinc-700">Sound Effects</span>
            <span className="ml-auto text-[10px] font-mono bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded">Track 2</span>
          </div>
          <div className="relative w-full h-14 bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden flex items-center">
            {blocks.map((b) => {
              if (!b.speaker.startsWith("SFX:")) return null;
              const isActive = currentTime >= b.leftPercent * totalDuration / 100 && currentTime < (b.leftPercent + b.widthPercent) * totalDuration / 100;

              return (
                <div
                  key={b.index}
                  className={`absolute h-10 rounded-lg border flex flex-col justify-center px-3 transition-all ${
                    isActive
                      ? "bg-violet-600 border-violet-700 text-white shadow-sm z-20 scale-[1.01]"
                      : "bg-violet-50 border-violet-200 text-violet-900"
                  }`}
                  style={{
                    left: `${b.leftPercent}%`,
                    width: `${b.widthPercent}%`
                  }}
                >
                  <span className="text-[10px] font-bold truncate">{b.speaker}</span>
                  <span className="text-[9px] truncate opacity-90 font-mono">{b.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. MUSIC BED & AMBIENCE TRACK */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-44 flex items-center gap-2 shrink-0">
            <Music className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-zinc-700">Ambient Music Bed</span>
            <span className="ml-auto text-[10px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Track 3</span>
          </div>
          <div className="relative w-full h-12 bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden flex items-center">
            {/* Ambient visual background wave */}
            <div className="absolute inset-0 flex items-center justify-around px-4 opacity-15 pointer-events-none">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] bg-emerald-600 rounded-full"
                  style={{ height: `${20 + Math.sin(i * 0.4) * 60}%` }}
                />
              ))}
            </div>
            
            {/* Wave overlay block */}
            <div className="absolute left-2 right-2 h-8 bg-emerald-50 border border-emerald-100/70 rounded-lg flex items-center px-3 justify-between">
              <span className="text-[10px] font-bold text-emerald-900 truncate">
                🎵 {script.musicStyle || "ambient cinematic synth wave"} + 🍃 {script.ambientSfx || "natural wind"}
              </span>
              <span className="text-[9px] font-mono text-emerald-700 shrink-0">Continuous Bed</span>
            </div>
          </div>
        </div>

      </div>

      {/* Tracks Mixer Panel */}
      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-zinc-600" />
          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Timeline Studio Mixer</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Vol 1 */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span className="font-medium text-zinc-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Dialogue Track
              </span>
              <span className="font-mono">{Math.round(voiceVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={voiceVolume}
              onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Vol 2 */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span className="font-medium text-zinc-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Sound FX
              </span>
              <span className="font-mono">{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
              className="w-full accent-violet-600 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Vol 3 */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span className="font-medium text-zinc-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Background Bed
              </span>
              <span className="font-mono">{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

        </div>
      </div>

    </div>
  );
}
