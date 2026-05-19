"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  HERO_RELEASE_FADE_PX,
  INTRO_HERO_BLEND_PX,
  mapScrollToStory,
  PIN_BUFFER_PX,
  STORY_COMPLETE,
} from "@/lib/scrollConfig";
import { isStoryLocked, lockStory } from "@/lib/storyLock";

/**
 * Scroll progress from window.scrollY vs track offset.
 * Progress only moves forward (peak); scrolling back moves the page but not the story.
 */
export function useScrollStoryProgress(trackRef: RefObject<HTMLElement | null>) {
  const peakRef = useRef(isStoryLocked() ? 1 : 0);
  const completedRef = useRef(isStoryLocked());
  const progressRef = useRef(isStoryLocked() ? 1 : 0);
  const targetProgressRef = useRef(isStoryLocked() ? 1 : 0);
  const [progress, setProgress] = useState(isStoryLocked() ? 1 : 0);
  const [heroBlend, setHeroBlend] = useState(isStoryLocked() ? 1 : 0);
  const [heroVisibility, setHeroVisibility] = useState(isStoryLocked() ? 0 : 1);

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    if (!isStoryLocked()) {
      peakRef.current = 0;
      completedRef.current = false;
      progressRef.current = 0;
      targetProgressRef.current = 0;
      setProgress(0);
      setHeroBlend(0);
      setHeroVisibility(1);
    }

    const track = trackRef.current;
    if (!track) return;

    const commit = (v: number) => {
      if (Math.abs(progressRef.current - v) < 0.0001) return;
      progressRef.current = v;
      setProgress(v);
    };

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      peakRef.current = 1;
      targetProgressRef.current = 1;
      lockStory();
      setHeroBlend(1);
    };

    const measure = () => {
      if (completedRef.current) return peakRef.current;

      const start = track.offsetTop;
      const scrollRange = track.offsetHeight - window.innerHeight;
      if (scrollRange <= PIN_BUFFER_PX + 1) return peakRef.current;

      const y = window.scrollY;
      if (y < start) return 0;

      const scrolled = y - start;
      if (scrolled < PIN_BUFFER_PX) return 0;

      const raw = (scrolled - PIN_BUFFER_PX) / (scrollRange - PIN_BUFFER_PX);
      return mapScrollToStory(raw);
    };

    const updateHeroBlend = () => {
      const start = track.offsetTop;
      const blendStart = Math.max(0, start - INTRO_HERO_BLEND_PX);
      const blend =
        start <= blendStart
          ? 1
          : Math.min(
              1,
              Math.max(0, (window.scrollY - blendStart) / (start - blendStart))
            );
      setHeroBlend(blend);
    };

    const updateHeroVisibility = () => {
      const releaseStart = track.offsetTop + track.offsetHeight - window.innerHeight;
      const fadeProgress =
        HERO_RELEASE_FADE_PX <= 0
          ? 1
          : (window.scrollY - releaseStart) / HERO_RELEASE_FADE_PX;
      setHeroVisibility(1 - Math.min(1, Math.max(0, fadeProgress)));
    };

    let raf = 0;
    let lastTs = 0;

    const tick = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(40, ts - lastTs);
      lastTs = ts;

      updateHeroBlend();
      updateHeroVisibility();

      if (!completedRef.current) {
        const measured = measure();
        if (measured > peakRef.current + 0.0001) {
          peakRef.current = measured;
          targetProgressRef.current = measured;
        }

        if (peakRef.current >= STORY_COMPLETE) {
          finish();
        }
      }

      const target = completedRef.current ? 1 : targetProgressRef.current;
      const current = progressRef.current;
      const smoothing = 1 - Math.exp(-dt / 90);
      const next =
        Math.abs(target - current) < 0.0005
          ? target
          : current + (target - current) * smoothing;

      if (next > current + 0.00005 || completedRef.current) {
        commit(next);
      }

      raf = requestAnimationFrame(tick);
    };

    const update = () => {
      if (!completedRef.current) {
        const measured = measure();
        if (measured > peakRef.current + 0.0001) {
          peakRef.current = measured;
          targetProgressRef.current = measured;
        }
      }
      updateHeroBlend();
      updateHeroVisibility();
    };

    if (completedRef.current) {
      progressRef.current = 1;
      targetProgressRef.current = 1;
      setProgress(1);
      setHeroBlend(1);
      setHeroVisibility(0);
    }

    update();
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [trackRef]);

  return { progress, progressRef, heroBlend, heroVisibility };
}
