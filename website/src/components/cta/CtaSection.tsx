"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GradientOrb } from "@/components/ui/GradientOrb";
import { colors } from "@/lib/colors";

export function CtaSection() {
  const ref = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const parallaxX = useTransform(springX, [-0.5, 0.5], [-12, 12]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-24"
      style={{ background: colors.bgDeep }}
    >
      <GradientOrb
        className="-left-[10%] top-[15%] opacity-35"
        color={colors.gradientA}
        size="50vh"
      />
      <GradientOrb
        className="-right-[5%] bottom-[10%] opacity-30"
        color={colors.gradientB}
        delay={2}
        size="45vh"
      />
      <GradientOrb
        className="left-[40%] top-[5%] opacity-25"
        color={colors.gradientC}
        delay={4}
        size="35vh"
      />

      <motion.div
        className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center"
        style={{ x: parallaxX, y: parallaxY }}
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="mb-6 text-xs font-semibold tracking-[0.3em] uppercase"
          style={{ color: colors.gradientB }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          GroupPay
        </motion.span>

        <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          Convenient group transactions start now
        </h1>

        <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-400 md:text-lg">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>

        <motion.a
          href="#"
          className="group relative mt-10 inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 text-sm font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${colors.gradientA}, ${colors.gradientB})`,
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10">Download APK</span>
          <motion.span
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.2), transparent)",
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.a>
      </motion.div>
    </section>
  );
}
