"use client";

import {
  createContext,
  useContext,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { TimelineState } from "@/lib/scrollTimeline";
import { getTimelineState } from "@/lib/scrollTimeline";

interface TimelineContextValue {
  timeline: TimelineState;
  progressRef: MutableRefObject<number>;
  isMobile: boolean;
  getTimeline: () => TimelineState;
}

const TimelineContext = createContext<TimelineContextValue | null>(null);

export function TimelineProvider({
  children,
  timeline,
  progressRef,
  isMobile,
}: {
  children: ReactNode;
  timeline: TimelineState;
  progressRef: MutableRefObject<number>;
  isMobile: boolean;
}) {
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  const value: TimelineContextValue = {
    timeline,
    progressRef,
    isMobile,
    getTimeline: () => getTimelineState(progressRef.current, isMobileRef.current),
  };

  return (
    <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
  );
}

export function useTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline must be used within TimelineProvider");
  return ctx;
}
