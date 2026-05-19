/** Persists across remounts within the same tab — story plays once. */
let locked = false;

export function isStoryLocked() {
  return locked;
}

export function lockStory() {
  locked = true;
}
