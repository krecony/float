"use client";

import { useEffect, useRef } from "react";
import { playStorySoundsBetween } from "@/lib/playStorySounds";
import { unlockAudioFromGesture } from "@/lib/soundEffects";

let unlockListenersInstalled = false;

function installAudioUnlock() {
  if (typeof window === "undefined" || unlockListenersInstalled) return;
  unlockListenersInstalled = true;

  const onGesture = () => unlockAudioFromGesture();

  window.addEventListener("wheel", onGesture, { passive: true });
  window.addEventListener("touchstart", onGesture, { passive: true });
  window.addEventListener("pointerdown", onGesture);
}

export function useTimelineSounds(
  progress: number,
  enabled: boolean,
  isMobile: boolean
) {
  const prevProgress = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    installAudioUnlock();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const prev = prevProgress.current;
    playStorySoundsBetween(prev, progress, isMobile);
    prevProgress.current = progress;
  }, [progress, enabled, isMobile]);

  return null;
}
