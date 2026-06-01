'use client';

/**
 * Tiny synthesized sound engine (WebAudio, no assets) ported from sound.jsx.
 * Off by default, persisted. Spin whir, reel ticks, win chime, near-miss thud.
 */
type Listener = (enabled: boolean) => void;

interface ToneOpts {
  freq?: number;
  type?: OscillatorType;
  t?: number;
  dur?: number;
  gain?: number;
  slideTo?: number | null;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private readonly subs = new Set<Listener>();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.enabled = localStorage.getItem('dgz_sound') === '1';
      } catch {
        /* ignore */
      }
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      try {
        this.ctx = Ctor ? new Ctor() : null;
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone({ freq = 440, type = 'sine', t = 0, dur = 0.15, gain = 0.18, slideTo = null }: ToneOpts) {
    const c = this.ensure();
    if (!c) return;
    const now = c.currentTime + t;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  subscribe(fn: Listener): () => void {
    this.subs.add(fn);
    return () => {
      this.subs.delete(fn);
    };
  }

  toggle(): void {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('dgz_sound', this.enabled ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (this.enabled) this.ensure();
    for (const f of this.subs) f(this.enabled);
  }

  /** Call inside a user gesture so the AudioContext can start. */
  unlock(): void {
    this.ensure();
  }

  spin(): void {
    if (!this.enabled) return;
    this.tone({ freq: 180, type: 'sawtooth', dur: 0.3, gain: 0.07, slideTo: 420 });
  }

  land(i = 0): void {
    if (!this.enabled) return;
    this.tone({ freq: 900 + i * 120, type: 'square', dur: 0.06, gain: 0.09 });
  }

  nearMiss(): void {
    if (!this.enabled) return;
    this.tone({ freq: 360, type: 'triangle', dur: 0.18, gain: 0.12 });
    this.tone({ freq: 280, type: 'triangle', t: 0.16, dur: 0.26, gain: 0.12 });
  }

  win(big = false): void {
    if (!this.enabled) return;
    const notes = big ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
    notes.forEach((f, i) => this.tone({ freq: f, type: 'triangle', t: i * 0.09, dur: 0.3, gain: 0.14 }));
    if (big) notes.forEach((f, i) => this.tone({ freq: f * 2, type: 'sine', t: 0.5 + i * 0.08, dur: 0.4, gain: 0.08 }));
  }
}

export const Sound = new SoundEngine();
