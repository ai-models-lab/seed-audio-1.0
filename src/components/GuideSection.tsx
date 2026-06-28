import React from "react";
import { Sparkles, Smile, Volume2, MessageSquare, AlertCircle } from "lucide-react";

export default function GuideSection() {
  const emotionalTriggers = [
    { tag: "[whispering]", description: "Lowers volume, increases breathiness, creating intimacy or suspense." },
    { tag: "[laughing]", description: "Inserts natural chuckles or giggles during word transitions." },
    { tag: "[cheerful]", description: "Raises pitch, increases speech rate, adds optimistic tone." },
    { tag: "[scared]", description: "Adds rapid trembling pauses, shallow breathing, and pitch shifts." },
    { tag: "[short pause]", description: "Inserts 0.5s of realistic silence for pacing and phrasing." }
  ];

  return (
    <div id="guide-section-card" className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-zinc-900 text-lg">Seed Audio Prompting Guide</h3>
      </div>
      
      <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
        The Doubao Seed Audio 1.0 engine is highly multi-modal. By embedding specific contextual tags directly inside your text script, you can direct emotional expression, speed, and pacing of the AI voice generator.
      </p>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {emotionalTriggers.map((t) => (
          <div key={t.tag} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {t.tag}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">{t.description}</p>
          </div>
        ))}
      </div>

      {/* Scripting example */}
      <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 font-mono text-xs text-zinc-300">
        <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider mb-2.5">
          <span>Expression Formatting Example</span>
          <span className="text-amber-400">Direct-style Prompt</span>
        </div>
        <p className="mb-2">
          <span className="text-indigo-400 font-bold">Joe:</span> [whispering] Wait, did you hear that knock?
        </p>
        <p className="mb-2">
          <span className="text-emerald-400 font-bold">Jane:</span> [scared] I... I don't know. Let's not open it. [short pause] Please.
        </p>
        <p>
          <span className="text-violet-400 font-bold">Narrator:</span> [serious] A dark shadow stretched across the floor.
        </p>
      </div>
    </div>
  );
}
