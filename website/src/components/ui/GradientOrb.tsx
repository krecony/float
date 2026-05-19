"use client";

import { motion } from "framer-motion";

interface GradientOrbProps {
  className?: string;
  color: string;
  size?: string;
  delay?: number;
}

export function GradientOrb({
  className = "",
  color,
  size = "40vh",
  delay = 0,
}: GradientOrbProps) {
  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full blur-[100px] ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
      animate={{ x: [0, 24, 0], y: [0, -18, 0], scale: [1, 1.08, 1] }}
      transition={{
        duration: 14 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      aria-hidden
    />
  );
}
