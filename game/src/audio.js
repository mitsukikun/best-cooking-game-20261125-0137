// SPDX-License-Identifier: MIT
// audio.js — tiny WebAudio bleeps for Dapur Kilat: chop thock, sizzle,
// pickup plip, serve ding and a low deny buzz. No audio files, no network.

export function createSoundBank() {
  let ctx = null;
  let sizzleNodes = null;

  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    const ac = ensureContext();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(g).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  }

  function noise(dur, gain, filterFreq) {
    const ac = ensureContext();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(ac.destination);
    src.start();
  }

  return {
    unlock() { ensureContext(); },
    chop() { noise(0.08, 0.5, 900); tone(180, 0.07, 'triangle', 0.25, 90); },
    pickup() { tone(520, 0.08, 'sine', 0.2, 760); },
    place() { tone(300, 0.08, 'sine', 0.2, 210); },
    deny() { tone(140, 0.16, 'sawtooth', 0.12, 110); },
    ding() { tone(880, 0.25, 'sine', 0.25); tone(1318, 0.35, 'sine', 0.18); },
    serve() { tone(660, 0.12, 'sine', 0.25); tone(880, 0.12, 'sine', 0.25); tone(1320, 0.3, 'sine', 0.22); },
    startSizzle() {
      const ac = ensureContext();
      if (!ac || sizzleNodes) return;
      const len = ac.sampleRate;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 4000;
      const g = ac.createGain();
      g.gain.value = 0.05;
      src.connect(filter).connect(g).connect(ac.destination);
      src.start();
      sizzleNodes = { src, g };
    },
    stopSizzle() {
      if (!sizzleNodes) return;
      try { sizzleNodes.src.stop(); } catch { /* already stopped */ }
      sizzleNodes = null;
    },
  };
}
