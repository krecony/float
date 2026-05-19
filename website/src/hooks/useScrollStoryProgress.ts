"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
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
  const [progress, setProgress] = useState(isStoryLocked() ? 1 : 0);
  const [heroBlend, setHeroBlend] = useState(isStoryLocked() ? 1 : 0);

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    if (!isStoryLocked()) {
      peakRef.current = 0;
      completedRef.current = false;
      progressRef.current = 0;
      setProgress(0);
      setHeroBlend(0);
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
      lockStory();
      commit(1);
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

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        updateHeroBlend();

        if (completedRef.current) {
          commit(peakRef.current);
          return;
        }

        const measured = measure();

        if (measured > peakRef.current + 0.0001) {
          peakRef.current = measured;
          commit(measured);
        }

        if (peakRef.current >= STORY_COMPLETE) {
          finish();
        }
      });
    };

    if (completedRef.current) {
      progressRef.current = 1;
      setProgress(1);
      setHeroBlend(1);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [trackRef]);

  return { progress, progressRef, heroBlend };
}
