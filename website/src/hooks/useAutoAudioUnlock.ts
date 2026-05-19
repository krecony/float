"use client";

import { useEffect } from "react";
import { preloadSounds, subscribeAudioUnlock } from "@/lib/soundEffects";

/** Preload audio; real unlock happens on scroll/wheel/touch via useScrollStoryProgress. */
export function useAutoAudioUnlock(onUnlocked?: () => void) {
  useEffect(() => {
    preloadSounds();
    if (!onUnlocked) return;
    return subscribeAudioUnlock(onUnlocked);
  }, [onUnlocked]);
}
