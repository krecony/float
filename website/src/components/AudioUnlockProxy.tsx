"use client";

import { unlockAudioFromGesture } from "@/lib/soundEffects";

/** Fallback tap target — only used if the user clicks the page. */
export function AudioUnlockProxy() {
  return (
    <button
      type="button"
      aria-hidden
      tabIndex={-1}
      className="fixed top-0 left-0 h-px w-px opacity-0"
      onPointerDown={() => unlockAudioFromGesture()}
    />
  );
}
