"use client";

import { useSettingsStore } from "@/store/settingsStore";

// 8-bit style sound effects synthesized with the Web Audio API — no audio
// files, zero bundle weight. Square waves for that arcade cabinet feel.

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function beep(freq: number, ms: number, delayMs = 0, volume = 0.04) {
  if (!useSettingsStore.getState().sound) return;
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const start = ac.currentTime + delayMs / 1000;
  const end = start + ms / 1000;
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(end);
}

export const sfx = {
  click:   () => beep(880, 60),
  correct: () => { beep(523, 80); beep(659, 80, 80); beep(784, 120, 160); },
  wrong:   () => { beep(220, 120); beep(147, 200, 110); },
  snap:    () => { beep(1047, 50); beep(1319, 90, 50); },
  gameOver:() => { beep(392, 150); beep(330, 150, 140); beep(262, 300, 280); },
};
