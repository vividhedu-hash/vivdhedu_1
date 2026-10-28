/**
 * Procedural Web Audio API sound generator for tactile micro-interactions.
 * Zero external asset dependencies (no MP3/WAV files, 0KB network payload).
 * Synthesizes ultra-short acoustic micro-feedback mathematically in real time.
 */

let audioCtx: AudioContext | null = null;
let lastTickTime = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Check if sound is muted by the user (stored in localStorage).
 * Defaults to true (sound enabled for tactile immersion), but can be globally toggled.
 */
export function isAudioMuted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem("vividhedu_sound_enabled");
    return val === "false";
  } catch {
    return false;
  }
}

export function setAudioMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("vividhedu_sound_enabled", muted ? "false" : "true");
  } catch {}
}

/**
 * 35ms soft sine pop for button clicks, chip selections, and tabs.
 */
export function playUiPop(freq = 440): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Graceful fallback if audio context fails
  }
}

/**
 * 20ms ultra-subtle mechanical tick for range sliders and scrubbers.
 * Throttled to max 25 ticks/sec (40ms interval) to prevent acoustic pile-up.
 */
export function playSliderTick(freq = 560): void {
  if (isAudioMuted()) return;
  const nowMs = Date.now();
  if (nowMs - lastTickTime < 40) return;
  lastTickTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.02);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  } catch {}
}

/**
 * Two-tone harmonic success chime for scenario updates or calculation complete.
 */
export function playSuccessChime(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const playNote = (frequency: number, delay: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, now + delay);

      gain.gain.setValueAtTime(0.05, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };

    playNote(523.25, 0, 0.08); // C5
    playNote(659.25, 0.06, 0.12); // E5
  } catch {}
}
