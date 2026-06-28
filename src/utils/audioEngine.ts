import { AudioScript, Segment } from "../types";

// Convers base64 from server to AudioBuffer
export async function base64ToAudioBuffer(base64: string, audioCtx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await audioCtx.decodeAudioData(bytes.buffer);
}

// Simple WAV Encoder
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = raw PCM
  const bitDepth = 16;
  
  let result;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }
  
  const bufferLength = result.length * 2;
  const wavBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(wavBuffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLength, true);
  
  floatTo16BitPCM(view, 44, result);
  
  return new Blob([view], { type: 'audio/wav' });
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Procedural Synth: Generates background ambient pad music
export function synthesizeMusicBed(
  audioCtx: BaseAudioContext,
  style: string,
  duration: number,
  destination: AudioNode
) {
  const isSuspense = style.toLowerCase().includes("suspense") || style.toLowerCase().includes("orchestral") || style.toLowerCase().includes("cinematic");
  const isLofi = style.toLowerCase().includes("lo-fi") || style.toLowerCase().includes("lofi") || style.toLowerCase().includes("beats");
  const isCyber = style.toLowerCase().includes("cyber") || style.toLowerCase().includes("synth") || style.toLowerCase().includes("wave");

  // Create synth filter
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 2.0;
  filter.frequency.value = isCyber ? 1200 : isSuspense ? 600 : 800;
  filter.connect(destination);

  // Modulation LFO for cozy analog movement
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.15; // Slow sweep
  lfoGain.gain.value = 200; // Sweep range
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  // Create fundamental oscillators for chord structure
  // Roots for chord progressions in minor 7th / warm lofi chords
  const rootFreq = isSuspense ? 110 : isCyber ? 146.83 : 130.81; // A2, D3, C3
  let frequencies = [rootFreq, rootFreq * 1.5, rootFreq * 1.88, rootFreq * 2.25]; // Dyads & overtones

  if (isCyber) {
    frequencies = [rootFreq, rootFreq * 1.2, rootFreq * 1.5, rootFreq * 1.8]; // Minor 7th mood
  } else if (isLofi) {
    frequencies = [rootFreq, rootFreq * 1.25, rootFreq * 1.5, rootFreq * 1.875]; // Major 7th mood
  }

  frequencies.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    osc.type = isCyber ? "sawtooth" : "sine";
    osc.frequency.value = freq;
    
    // Add subtle detuning
    osc.detune.value = (idx - 1.5) * 8;

    const oscGain = audioCtx.createGain();
    oscGain.gain.value = 0.0;
    
    // Smooth volume fade-in and hold
    oscGain.gain.setValueAtTime(0, 0);
    oscGain.gain.linearRampToValueAtTime(0.08, 3);
    oscGain.gain.setValueAtTime(0.08, duration - 4);
    oscGain.gain.linearRampToValueAtTime(0, duration);

    osc.connect(oscGain);
    oscGain.connect(filter);

    osc.start(0);
    osc.stop(duration);
  });

  // If Lofi style, add a procedurally generated vinyl crackle and slow bass drum click
  if (isLofi) {
    // White noise generator for vinyl static
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 1000;
    noiseFilter.Q.value = 1.0;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.015; // Soft vinyl static

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(destination);

    noiseSource.start(0);
    noiseSource.stop(duration);

    // Dynamic procedural lofi kick beat (every 2 seconds)
    for (let t = 1; t < duration - 2; t += 2) {
      const kickOsc = audioCtx.createOscillator();
      const kickGain = audioCtx.createGain();
      kickOsc.connect(kickGain);
      kickGain.connect(destination);

      kickOsc.frequency.setValueAtTime(150, t);
      kickOsc.frequency.exponentialRampToValueAtTime(50, t + 0.15);

      kickGain.gain.setValueAtTime(0, t);
      kickGain.gain.linearRampToValueAtTime(0.18, t + 0.01);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      kickOsc.start(t);
      kickOsc.stop(t + 0.5);
    }
  }

  // If Suspense style, add deep string drone sweeps
  if (isSuspense) {
    const droneOsc = audioCtx.createOscillator();
    droneOsc.type = "sawtooth";
    droneOsc.frequency.value = 55; // A1 deep drone

    const droneFilter = audioCtx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 150;

    const droneGain = audioCtx.createGain();
    droneGain.gain.setValueAtTime(0, 0);
    droneGain.gain.linearRampToValueAtTime(0.06, 4);
    droneGain.gain.setValueAtTime(0.06, duration - 3);
    droneGain.gain.linearRampToValueAtTime(0, duration);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(destination);

    droneOsc.start(0);
    droneOsc.stop(duration);
  }
}

// Procedural SFX generator: Generates environmental sound effects
export function synthesizeAmbientSfx(
  audioCtx: BaseAudioContext,
  ambientSfx: string,
  duration: number,
  destination: AudioNode
) {
  const isRain = ambientSfx.toLowerCase().includes("rain") || ambientSfx.toLowerCase().includes("thunder");
  const isWind = ambientSfx.toLowerCase().includes("wind") || ambientSfx.toLowerCase().includes("forest") || ambientSfx.toLowerCase().includes("breeze");
  const isCafe = ambientSfx.toLowerCase().includes("cafe") || ambientSfx.toLowerCase().includes("shop") || ambientSfx.toLowerCase().includes("keyboard");

  // Create noise buffer
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const filter = audioCtx.createBiquadFilter();
  const sfxGain = audioCtx.createGain();

  noiseSource.connect(filter);
  filter.connect(sfxGain);
  sfxGain.connect(destination);

  if (isRain) {
    // Rain sound: White noise through bandpass
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;
    sfxGain.gain.setValueAtTime(0, 0);
    sfxGain.gain.linearRampToValueAtTime(0.04, 2);
    sfxGain.gain.setValueAtTime(0.04, duration - 2);
    sfxGain.gain.linearRampToValueAtTime(0, duration);

    noiseSource.start(0);
    noiseSource.stop(duration);

    // Occasional thunder rumbling at t = 5, t = 15
    const thunderTimes = [5, 15, 25].filter(t => t < duration - 4);
    thunderTimes.forEach(t => {
      const thunderOsc = audioCtx.createOscillator();
      thunderOsc.type = "triangle";
      thunderOsc.frequency.setValueAtTime(30, t);
      thunderOsc.frequency.linearRampToValueAtTime(10, t + 3.0);

      const thunderGain = audioCtx.createGain();
      thunderGain.gain.setValueAtTime(0, t);
      thunderGain.gain.linearRampToValueAtTime(0.35, t + 0.5);
      thunderGain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);

      const thunderFilter = audioCtx.createBiquadFilter();
      thunderFilter.type = "lowpass";
      thunderFilter.frequency.value = 80;

      thunderOsc.connect(thunderFilter);
      thunderFilter.connect(thunderGain);
      thunderGain.connect(destination);

      thunderOsc.start(t);
      thunderOsc.stop(t + 4.0);
    });

  } else if (isWind) {
    // Wind: Lowpass filter modulated by a slow LFO sweep
    filter.type = "lowpass";
    filter.Q.value = 4.0;
    filter.frequency.value = 400;

    const windMod = audioCtx.createOscillator();
    const windModGain = audioCtx.createGain();
    windMod.frequency.value = 0.08; // Slow gust modulation
    windModGain.gain.value = 250; // Sweep frequency range
    windMod.connect(windModGain);
    windModGain.connect(filter.frequency);

    sfxGain.gain.setValueAtTime(0, 0);
    sfxGain.gain.linearRampToValueAtTime(0.05, 3);
    sfxGain.gain.setValueAtTime(0.05, duration - 2);
    sfxGain.gain.linearRampToValueAtTime(0, duration);

    windMod.start(0);
    noiseSource.start(0);
    windMod.stop(duration);
    noiseSource.stop(duration);

  } else {
    // Standard Spaceship Hum / Tech vibe
    filter.type = "lowpass";
    filter.frequency.value = 180;
    sfxGain.gain.setValueAtTime(0, 0);
    sfxGain.gain.linearRampToValueAtTime(0.03, 1);
    sfxGain.gain.setValueAtTime(0.03, duration - 1);
    sfxGain.gain.linearRampToValueAtTime(0, duration);

    const humOsc = audioCtx.createOscillator();
    humOsc.type = "sawtooth";
    humOsc.frequency.value = 60; // 60Hz electronic hum

    const humGain = audioCtx.createGain();
    humGain.gain.value = 0.02;

    humOsc.connect(humGain);
    humGain.connect(destination);

    noiseSource.start(0);
    humOsc.start(0);
    noiseSource.stop(duration);
    humOsc.stop(duration);
  }
}

// Full Render Engine using OfflineAudioContext for instant generation of WAV
export async function renderFullScene(
  script: AudioScript,
  voiceBuffers: Map<number, AudioBuffer>
): Promise<Blob> {
  // Calculate total duration
  let totalDuration = 0;
  script.segments.forEach(seg => {
    totalDuration += seg.duration;
  });
  if (totalDuration === 0) totalDuration = 10;

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);

  // Main tracks volume nodes
  const voiceTrackNode = offlineCtx.createGain();
  voiceTrackNode.gain.value = 1.0;
  voiceTrackNode.connect(offlineCtx.destination);

  const sfxTrackNode = offlineCtx.createGain();
  sfxTrackNode.gain.value = 0.4;
  sfxTrackNode.connect(offlineCtx.destination);

  const musicTrackNode = offlineCtx.createGain();
  musicTrackNode.gain.value = 0.25;
  musicTrackNode.connect(offlineCtx.destination);

  // 1. Synthesize Procedural Music Bed
  synthesizeMusicBed(offlineCtx, script.musicStyle, totalDuration, musicTrackNode);

  // 2. Synthesize Procedural Environment SFX
  synthesizeAmbientSfx(offlineCtx, script.ambientSfx, totalDuration, sfxTrackNode);

  // 3. Render and schedule voice assets
  let currentOffset = 0;
  script.segments.forEach((seg, index) => {
    const nextOffset = currentOffset + seg.duration;

    if (seg.speaker.startsWith("SFX:")) {
      // Synthesize brief targeted sound effects
      const sfxType = seg.text.toLowerCase();
      const sfxSource = offlineCtx.createOscillator();
      const sfxVol = offlineCtx.createGain();
      sfxSource.connect(sfxVol);
      sfxVol.connect(sfxTrackNode);

      if (sfxType.includes("knock")) {
        // Wooden knocks
        for (let k = 0; k < 3; k++) {
          const kt = currentOffset + k * 0.4;
          sfxSource.frequency.setValueAtTime(150, kt);
          sfxSource.frequency.exponentialRampToValueAtTime(10, kt + 0.1);
          sfxVol.gain.setValueAtTime(0, kt);
          sfxVol.gain.linearRampToValueAtTime(0.5, kt + 0.01);
          sfxVol.gain.exponentialRampToValueAtTime(0.001, kt + 0.15);
        }
        sfxSource.start(currentOffset);
        sfxSource.stop(currentOffset + 1.5);
      } else if (sfxType.includes("swoosh") || sfxType.includes("whoosh")) {
        // White noise sweeping sweep
        const bufferSize = sampleRate * 1.5;
        const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

        const noiseSource = offlineCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const swooshFilter = offlineCtx.createBiquadFilter();
        swooshFilter.type = "bandpass";
        swooshFilter.frequency.setValueAtTime(100, currentOffset);
        swooshFilter.frequency.exponentialRampToValueAtTime(3000, currentOffset + 0.7);
        swooshFilter.frequency.exponentialRampToValueAtTime(200, currentOffset + 1.4);

        const swooshGain = offlineCtx.createGain();
        swooshGain.gain.setValueAtTime(0, currentOffset);
        swooshGain.gain.linearRampToValueAtTime(0.3, currentOffset + 0.5);
        swooshGain.gain.exponentialRampToValueAtTime(0.001, currentOffset + 1.4);

        noiseSource.connect(swooshFilter);
        swooshFilter.connect(swooshGain);
        swooshGain.connect(sfxTrackNode);

        noiseSource.start(currentOffset);
        noiseSource.stop(currentOffset + 1.5);
      } else {
        // Tone synth beep effect
        sfxSource.type = "sine";
        sfxSource.frequency.setValueAtTime(440, currentOffset);
        sfxSource.frequency.exponentialRampToValueAtTime(880, currentOffset + 0.3);
        sfxVol.gain.setValueAtTime(0, currentOffset);
        sfxVol.gain.linearRampToValueAtTime(0.1, currentOffset + 0.02);
        sfxVol.gain.exponentialRampToValueAtTime(0.001, currentOffset + 0.4);
        sfxSource.start(currentOffset);
        sfxSource.stop(currentOffset + 0.5);
      }
    } else {
      // It is a speaking voice line!
      const voiceBuffer = voiceBuffers.get(index);
      if (voiceBuffer) {
        // Play the real Gemini TTS generated audio
        const voiceSource = offlineCtx.createBufferSource();
        voiceSource.buffer = voiceBuffer;
        
        // Add subtle room reverb or equalizer for premium studio feel
        const voiceEQ = offlineCtx.createBiquadFilter();
        voiceEQ.type = "peaking";
        voiceEQ.frequency.value = 3000; // Enhance speech clarity
        voiceEQ.gain.value = 2.0;

        voiceSource.connect(voiceEQ);
        voiceEQ.connect(voiceTrackNode);

        voiceSource.start(currentOffset);
      } else {
        // Fallback: Synthesize beautiful retro voice simulation clicks/modulations inside WAV
        // in offline rendering, we add speech-like procedural chirps
        const voiceOsc = offlineCtx.createOscillator();
        voiceOsc.type = "triangle";
        voiceOsc.frequency.value = seg.voiceName === "Charon" ? 110 : seg.voiceName === "Puck" ? 300 : 220;

        const voiceGain = offlineCtx.createGain();
        voiceGain.gain.setValueAtTime(0, currentOffset);
        // Play soft pulses corresponding to syllables
        const wordCount = seg.text.split(" ").length;
        const syllableDuration = (seg.duration - 1) / (wordCount * 1.5);
        
        for (let w = 0; w < wordCount * 1.5; w++) {
          const t = currentOffset + w * syllableDuration * 1.2;
          if (t < nextOffset - 0.5) {
            voiceGain.gain.setValueAtTime(0, t);
            voiceGain.gain.linearRampToValueAtTime(0.08, t + 0.02);
            voiceGain.gain.exponentialRampToValueAtTime(0.001, t + syllableDuration * 0.9);
          }
        }

        voiceOsc.connect(voiceGain);
        voiceGain.connect(voiceTrackNode);
        voiceOsc.start(currentOffset);
        voiceOsc.stop(nextOffset);
      }
    }

    currentOffset = nextOffset;
  });

  // Render out the complete mixed scene buffer
  const renderedBuffer = await offlineCtx.startRendering();
  
  // Encode buffer into WAV
  return audioBufferToWav(renderedBuffer);
}
