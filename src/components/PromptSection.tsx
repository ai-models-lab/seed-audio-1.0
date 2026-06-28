import React, { useState } from "react";
import { Preset, VoiceOption } from "../types";
import { AUDIO_PRESETS } from "../utils/presets";
import { Sparkles, MessageSquare, Flame, Check, HelpCircle, FileText, ChevronRight, Play } from "lucide-react";

interface PromptSectionProps {
  onGenerate: (promptText: string, presetType: string) => void;
  isGeneratingScript: boolean;
}

export default function PromptSection({ onGenerate, isGeneratingScript }: PromptSectionProps) {
  const [activePreset, setActivePreset] = useState<Preset>(AUDIO_PRESETS[0]);
  const [promptText, setPromptText] = useState(AUDIO_PRESETS[0].prompt);

  const handleSelectPreset = (preset: Preset) => {
    setActivePreset(preset);
    setPromptText(preset.prompt);
  };

  const handleTriggerGenerate = () => {
    if (!promptText.trim()) return;
    onGenerate(promptText, activePreset.name);
  };

  return (
    <div id="prompt-section-card" className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-zinc-900 text-lg">AI Audio Scene Director</h3>
      </div>
      
      {/* Preset Category Chips */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Choose a Production Preset
        </label>
        <div className="flex flex-wrap gap-2">
          {AUDIO_PRESETS.map((preset) => {
            const isSelected = activePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm scale-102"
                    : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600"
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Description */}
      <div className="mb-4 bg-zinc-50 rounded-2xl p-4 border border-zinc-100/50">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Preset Description</span>
        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{activePreset.description}</p>
      </div>

      {/* Prompt Text Area */}
      <div className="relative mb-5">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Describe Your Sound Stage Prompt
        </label>
        <textarea
          id="sound-stage-prompt-input"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={4}
          maxLength={600}
          placeholder="E.g., An epic voice narration over intense cinematic waves..."
          className="w-full rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none bg-zinc-50/20"
        />
        <div className="absolute right-3 bottom-3 text-[10px] text-zinc-400 font-mono">
          {promptText.length}/600 chars
        </div>
      </div>

      {/* Action Button */}
      <button
        id="write-script-and-design-scene-btn"
        onClick={handleTriggerGenerate}
        disabled={isGeneratingScript || !promptText.trim()}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-all duration-200 cursor-pointer"
      >
        {isGeneratingScript ? (
          <>
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Writing Script & Designing Sound Stage...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-400" />
            Write Script & Design Scene
          </>
        )}
      </button>

      {/* Director Pro Tip */}
      <div className="flex gap-2.5 items-start mt-4 p-3.5 bg-amber-50/50 rounded-xl border border-amber-100/50">
        <HelpCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <strong>Director Pro-Tip:</strong> Our engine parses instructions like <code>[whispering]</code> or <code>[excited]</code> for expressiveness, and inserts atmospheric triggers under the timeline automatically!
        </p>
      </div>
    </div>
  );
}
