"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useScrollStoryProgress } from "@/hooks/useScrollStoryProgress";
import { useTimelineSounds } from "@/hooks/useTimelineSounds";
import { getHeroSectionHeight } from "@/lib/scrollConfig";
import { IntroSection } from "@/components/IntroSection";
import { HeroSection } from "@/components/hero/HeroSection";
import { CssFallback } from "@/components/hero/CssFallback";

export function LandingPage() {
  const trackRef = useRef<HTMLElement>(null);
  const [unveiled, setUnveiled] = useState(false);
  const { progress, progressRef, heroBlend } =
    useScrollStoryProgress(trackRef);
  const [isMobile, setIsMobile] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [ready, setReady] = useState(false);

  useTimelineSounds(progress, ready && unveiled);

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (unveiled) return;

    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const blockScroll = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });

    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
    };
  }, [unveiled]);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let webgl = true;
    try {
      const canvas = document.createElement("canvas");
      webgl = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      webgl = false;
    }

    setIsMobile(window.innerWidth < 768);
    setUseFallback(reduced || !webgl);
    setReady(true);

    const mq = window.matchMedia("(max-width: 767px)");
    const onMq = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  return (
    <main
      className="relative min-h-0"
      style={{ background: "#050508", overflowAnchor: "none" }}
    >
      <IntroSection
        opacity={1 - heroBlend}
        unveiled={unveiled}
        onUnveil={() => setUnveiled(true)}
      />

      {/* Scroll runway — no sticky (avoids canvas jump) */}
      <section
        ref={trackRef}
        aria-hidden
        className="pointer-events-none"
        style={{ height: getHeroSectionHeight() }}
      />

      {/* Fixed viewport canvas — never unsticks or reflows */}
      <div
        className="fixed inset-0 z-[5] h-[100dvh] w-full overflow-hidden"
        style={{
          opacity: heroBlend,
          visibility: heroBlend > 0.01 ? "visible" : "hidden",
          pointerEvents: "none",
          background: "#050508",
          willChange: "opacity",
        }}
      >
        {ready &&
          (useFallback ? (
            <CssFallback progress={progress} isMobile={isMobile} />
          ) : (
            <HeroSection
              progress={progress}
              progressRef={progressRef}
              isMobile={isMobile}
            />
          ))}
      </div>
    </main>
  );
}
