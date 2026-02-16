const fs = require('fs');
const path = require('path');

// Generate a pleasant ascending 3-note chime: C5, E5, G5 (major chord)
const sampleRate = 22050;
const duration = 0.5;
const numSamples = Math.floor(sampleRate * duration);
const buffer = Buffer.alloc(44 + numSamples * 2);

// WAV header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);   // PCM
buffer.writeUInt16LE(1, 22);   // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);   // block align
buffer.writeUInt16LE(16, 34);  // bits per sample
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples * 2, 40);

// 3 ascending notes with gentle overlap and exponential decay
const notes = [
  { freq: 523.25, start: 0,    end: 0.22 },  // C5
  { freq: 659.25, start: 0.12, end: 0.37 },  // E5
  { freq: 783.99, start: 0.22, end: 0.5  },  // G5
];

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  let sample = 0;

  for (const note of notes) {
    if (t >= note.start && t < note.end) {
      const noteT = t - note.start;
      const attack = Math.min(noteT / 0.008, 1);
      const decay = Math.exp(-noteT * 7);
      const envelope = attack * decay;
      // Fundamental + soft overtone for warmth
      sample += Math.sin(2 * Math.PI * note.freq * noteT) * envelope * 0.3;
      sample += Math.sin(2 * Math.PI * note.freq * 2 * noteT) * envelope * 0.06;
    }
  }

  const clamped = Math.max(-1, Math.min(1, sample));
  buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
}

const outPath = path.join(__dirname, '..', 'assets', 'sounds', 'chime.wav');
fs.writeFileSync(outPath, buffer);
console.log('Created chime.wav:', buffer.length, 'bytes at', outPath);
