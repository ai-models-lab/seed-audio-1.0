export interface Segment {
  speaker: string;
  text: string;
  emotion: 'cheerful' | 'whispering' | 'serious' | 'excited' | 'calm' | 'dramatic' | 'scared' | 'authoritative' | 'none';
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  duration: number;
  audioUrl?: string; // Cache generated speech audio
  isGenerating?: boolean;
}

export interface AudioScript {
  title: string;
  description: string;
  musicStyle: string;
  ambientSfx: string;
  segments: Segment[];
}

export interface Preset {
  id: string;
  name: string;
  iconName: string;
  description: string;
  prompt: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'unisex';
  accent: string;
  vibe: string;
  sampleDescription: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
