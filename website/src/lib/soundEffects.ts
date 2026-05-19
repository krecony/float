const SOUNDS = {
  tapContact: "/sounds/tap-contact.mp3",
  applePay: "/sounds/apple-pay.mp3",
  approval: "/sounds/approval.mp3",
} as const;

type SoundKey = keyof typeof SOUNDS;
export type SoundKind = "tap" | "approve" | "success";

const buffers: Partial<Record<SoundKey, AudioBuffer>> = {};
let ctx: AudioContext | null = null;
let unlocked = false;
let resumePending = false;
let loading: Promise<void> | null = null;
const unlockListeners = new Set<() => void>();

function notifyUnlock() {
  unlockListeners.forEach((cb) => cb());
}

export function markAudioUnlocked() {
  if (unlocked) return;
  unlocked = true;
  notifyUnlock();
}

function getRunningContext(): AudioContext | null {
  if (!ctx || ctx.state !== "running") return null;
  return ctx;
}

async function loadBuffers() {
  const audioCtx = getRunningContext();
  if (!audioCtx) return;

  await Promise.all(
    (Object.entries(SOUNDS) as [SoundKey, string][]).map(async ([key, url]) => {
      if (buffers[key]) return;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.arrayBuffer();
        buffers[key] = await audioCtx.decodeAudioData(data);
      } catch {
        /* optional assets */
      }
    })
  );
}

export function preloadSounds() {
  if (!unlocked) return;
  if (!loading) {
    loading = loadBuffers().catch(() => {
      loading = null;
    });
  }
}

/**
 * Call only from wheel / touch / pointerdown handlers — never from scroll or rAF.
 * Creates AudioContext at most once; calls resume() at most once until running.
 */
export function unlockAudioFromGesture(): boolean {
  if (typeof window === "undefined") return false;
  if (unlocked) return true;

  if (!ctx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return false;
    ctx = new Ctx();
  }

  if (ctx.state === "running") {
    markAudioUnlocked();
    preloadSounds();
    return true;
  }

  if (ctx.state !== "suspended" || resumePending) {
    return false;
  }

  resumePending = true;
  void ctx
    .resume()
    .then(() => {
      resumePending = false;
      if (ctx?.state === "running") {
        markAudioUnlocked();
        preloadSounds();
      }
    })
    .catch(() => {
      resumePending = false;
    });

  return unlocked;
}

export function subscribeAudioUnlock(listener: () => void) {
  if (unlocked) listener();
  unlockListeners.add(listener);
  return () => {
    unlockListeners.delete(listener);
  };
}

export async function primeAudio(): Promise<boolean> {
  return unlocked;
}

export function isAudioUnlocked() {
  return unlocked;
}

function playBuffer(key: SoundKey, volume: number) {
  const audioCtx = getRunningContext();
  const buffer = buffers[key];
  if (!audioCtx || !buffer) return false;

  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(0);
  return true;
}

export function playSynth(kind: SoundKind, volume = 1) {
  const audioCtx = getRunningContext();
  if (!audioCtx) return false;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (kind === "tap") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.04);
    gain.gain.setValueAtTime(0.22 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (kind === "approve") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, now);
    osc.frequency.setValueAtTime(659, now + 0.07);
    osc.frequency.setValueAtTime(784, now + 0.14);
    gain.gain.setValueAtTime(0.2 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.22);
  } else {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.setValueAtTime(523, now + 0.08);
    osc.frequency.setValueAtTime(659, now + 0.16);
    osc.frequency.setValueAtTime(784, now + 0.24);
    gain.gain.setValueAtTime(0.24 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  return true;
}

function play(kind: SoundKind, bufferKey: SoundKey, volume: number) {
  if (!unlocked) return false;
  if (playBuffer(bufferKey, volume)) return true;
  return playSynth(kind, volume);
}

export function playTapContact() {
  return play("tap", "tapContact", 0.95);
}

export function playNfcPayment() {
  return play("success", "applePay", 1);
}

export const playPaymentConfirmation = playNfcPayment;
export const playNfcTap = playNfcPayment;

export function playApprove() {
  return play("approve", "approval", 0.9);
}

export function playSuccess() {
  return play("success", "approval", 0.85);
}
