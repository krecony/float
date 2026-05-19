/** Persists across component remounts so sounds never replay on a second pass. */
const played = {
  tap: false,
  approve1: false,
  approve2: false,
  success: false,
};

export type SoundMilestone = keyof typeof played;

export function wasSoundPlayed(key: SoundMilestone) {
  return played[key];
}

export function markSoundPlayed(key: SoundMilestone) {
  played[key] = true;
}

export function wereAllSoundsPlayed() {
  return played.tap && played.approve1 && played.approve2 && played.success;
}
