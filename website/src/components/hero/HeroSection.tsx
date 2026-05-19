"use client";

import dynamic from "next/dynamic";
import { Suspense, type MutableRefObject } from "react";
import type { RootState } from "@react-three/fiber";
import type { Clock } from "three";
import { createR3FClock } from "@/lib/r3fClock";
import { getTimelineState } from "@/lib/scrollTimeline";
import { TimelineProvider } from "@/context/TimelineContext";
import { AmbientGradients } from "./effects/AmbientGradients";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  { ssr: false }
);

const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), {
  ssr: false,
});

interface HeroSectionProps {
  progress: number;
  progressRef: MutableRefObject<number>;
  isMobile: boolean;
}

export function HeroSection({
  progress,
  progressRef,
  isMobile,
}: HeroSectionProps) {
  const timeline = getTimelineState(progress, isMobile);

  const onCanvasCreated = (state: RootState) => {
    state.set({ clock: createR3FClock() as unknown as Clock });
  };

  return (
    <TimelineProvider
      timeline={timeline}
      progressRef={progressRef}
      isMobile={isMobile}
    >
      <div
        className="relative h-screen w-full overflow-hidden"
        style={{ background: "#050508" }}
      >
        <AmbientGradients />

        <div className="absolute inset-0 size-full">
          <Suspense fallback={null}>
            <Canvas
              className="!block !h-full !w-full touch-none"
              style={{ display: "block", width: "100%", height: "100%" }}
              camera={{ position: [0, 0.15, 5], fov: 42 }}
              dpr={1}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
              }}
              onCreated={onCanvasCreated}
            >
              <Scene timeline={timeline} />
            </Canvas>
          </Suspense>
        </div>

        {progress < 0.08 && (
          <p className="pointer-events-none absolute bottom-20 left-0 right-0 text-center text-xs font-medium tracking-widest text-zinc-500 uppercase">
            Scroll to pay
          </p>
        )}
      </div>
    </TimelineProvider>
  );
}
