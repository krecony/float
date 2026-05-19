import {
  markSoundPlayed,
  wasSoundPlayed,
  type SoundMilestone,
} from "@/lib/timelineSoundState";
import {
  isAudioUnlocked,
  playApprove,
  playNfcPayment,
  playTapContact,
  subscribeAudioUnlock,
} from "@/lib/soundEffects";

const MILESTONES: Record<SoundMilestone, number> = {
  tap: 0.28,
  approve1: 0.56,
  approve2: 0.64,
  success: 0.74,
};

const pending = new Set<SoundMilestone>();

function fire(key: SoundMilestone) {
  if (wasSoundPlayed(key)) return;
  markSoundPlayed(key);

  switch (key) {
    case "tap":
      playTapContact();
      break;
    case "approve1":
    case "approve2":
      playApprove();
      break;
    case "success":
      playNfcPayment();
      break;
  }
}

function milestonesBetween(prev: number, curr: number): SoundMilestone[] {
  return (Object.keys(MILESTONES) as SoundMilestone[])
    .filter((key) => {
      const threshold = MILESTONES[key];
      return prev < threshold && curr >= threshold;
    })
    .sort((a, b) => MILESTONES[a] - MILESTONES[b]);
}

function getAllowedMilestones(isMobile: boolean) {
  return isMobile
    ? (["tap", "success"] as const)
    : (["tap", "approve1", "approve2", "success"] as const);
}

function flushPending() {
  if (!isAudioUnlocked()) return;
  const keys = [...pending].sort((a, b) => MILESTONES[a] - MILESTONES[b]);
  pending.clear();
  keys.forEach(fire);
}

let flushInstalled = false;

function ensureFlushOnUnlock() {
  if (flushInstalled) return;
  flushInstalled = true;
  subscribeAudioUnlock(flushPending);
}

/** Play milestones crossed between prev and curr; queues if audio not unlocked yet. */
export function playStorySoundsBetween(
  prev: number,
  curr: number,
  isMobile: boolean
) {
  if (curr <= prev) return;

  ensureFlushOnUnlock();
  const allowed = new Set<SoundMilestone>(getAllowedMilestones(isMobile));

  for (const key of milestonesBetween(prev, curr)) {
    if (!allowed.has(key)) continue;
    if (wasSoundPlayed(key)) continue;
    if (!isAudioUnlocked()) {
      pending.add(key);
      continue;
    }
    fire(key);
  }
}
