"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AudioUnlockProxy } from "@/components/AudioUnlockProxy";

/**
 * Renders children only after mount to avoid hydration mismatches
 * from WebGL, Lenis, matchMedia, and browser extensions.
 */
export function ClientRoot({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main
        className="min-h-screen"
        style={{ background: "#050508" }}
        suppressHydrationWarning
      />
    );
  }

  return (
    <>
      <AudioUnlockProxy />
      {children}
    </>
  );
}
