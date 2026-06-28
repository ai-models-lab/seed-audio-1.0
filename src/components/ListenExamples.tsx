import React, { useState } from "react";
import { Play, Pause, Music, Sparkles, Check, Headphones, MessageSquare } from "lucide-react";
import { AudioScript } from "../types";

interface ListenExamplesProps {
  onLoadExample: (exampleId: string) => void;
  activeScriptTitle: string;
}

export default function ListenExamples({ onLoadExample, activeScriptTitle }: ListenExamplesProps) {
  const examples = [
    {
      id: "demo-ad",
      title: "TikTok Ad: Boost Your Focus",
      duration: "17 seconds",
      style: "Cyberpunk synth wave, fast-paced transitions",
      description: "Demonstrates high-energy narrator clips coupled with high-impact sound design.",
      type: "TikTok Video Ad"
    },
    {
      id: "demo-drama",
      title: "The Midnight Discovery",
      duration: "19 seconds",
      style: "Cinematic orchestral suspense, rain, door knock",
      description: "Demonstrates multi-character conversation, realistic knocks, and rain ambience.",
      type: "Short Drama"
    },
    {
      id: "demo-podcast",
      title: "Tech Horizon Podcast Intro",
      duration: "17 seconds",
      style: "Warm lo-fi beats, vinyl crackles",
      description: "Demonstrates warm comforting voiceover laid on a beautiful relaxing music track.",
      type: "Podcast Intro"
    }
  ];

  return (
    <div id="listen-examples-card" className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Headphones className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-zinc-900 text-lg">Featured Seed Audio Showcases</h3>
      </div>
      <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
        Click any showcase below to instantly load its multi-track timeline, complete with pre-configured voices, background sound beds, and sound effects.
      </p>

      <div className="space-y-4">
        {examples.map((ex) => {
          const isActive = activeScriptTitle === ex.title;
          return (
            <div
              key={ex.id}
              onClick={() => onLoadExample(ex.id)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                isActive
                  ? "bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-600/5"
                  : "bg-zinc-50/50 hover:bg-zinc-50 border-zinc-100/70"
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <div>
                  <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-1">
                    {ex.type}
                  </span>
                  <h4 className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5">
                    {ex.title}
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-medium text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                  {ex.duration}
                </span>
              </div>
              
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-2.5">
                {ex.description}
              </p>

              <div className="flex items-center justify-between text-[11px] border-t border-zinc-100/50 pt-2.5">
                <span className="text-zinc-500 italic truncate max-w-[70%]">
                  Style: {ex.style}
                </span>
                <span className="text-indigo-600 font-semibold flex items-center gap-1">
                  {isActive ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Loaded
                    </>
                  ) : (
                    "Load Studio"
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
