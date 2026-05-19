/**
 * Extra scroll (beyond one viewport) that drives the full story 0→1.
 * Higher = same scroll speed, but the animation takes longer to play through.
 */
export const ANIMATION_SCROLL_VH = 200;

/** Story locks at this progress — plays once per page load */
export const STORY_COMPLETE = 0.97;

/** Pixels into hero track before story progress begins */
export const PIN_BUFFER_PX = 16;

/** Crossfade intro → hero over this many pixels before the hero track */
export const INTRO_HERO_BLEND_PX = 140;

export function getHeroSectionHeight() {
  return `calc(100vh + ${ANIMATION_SCROLL_VH}vh)`;
}

export function mapScrollToStory(raw: number): number {
  return Math.min(1, Math.max(0, raw));
}

export function getDownloadOpacity(storyProgress: number): number {
  if (storyProgress < 0.72) return 0;
  if (storyProgress >= 0.9) return 1;
  return (storyProgress - 0.72) / (0.9 - 0.72);
}
