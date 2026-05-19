"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FloatMark } from "@/components/ui/FloatMark";
import { GradientOrb } from "@/components/ui/GradientOrb";
import { colors } from "@/lib/colors";
import { APK_DOWNLOAD_PATH, GROUPPAY_GITHUB_URL } from "@/lib/site";
import { withBasePath } from "@/lib/basePath";

const FEATURES = [
  "Create shared travel groups — invite friends instantly with a simple join code",
  "Instant virtual cards — every group gets a ready-to-use shared debit card",
  "Tap to pay with NFC — seamless in-person payments from a shared balance",
  "Flexible bill splitting — choose exactly who joins each expense",
  "Collaborative approvals — purchases only go through after group confirmation",
  "Live updates in real time — every member sees approvals, rejections, and payment status instantly",
] as const;

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
      className="relative flex min-h-[135vh] w-full items-center justify-center overflow-hidden px-6 py-28"
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
        className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center"
        style={{ x: parallaxX, y: parallaxY }}
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <FloatMark className="float-mark h-14 w-14 drop-shadow-[0_14px_32px_rgba(34,211,238,0.24)]" />
          <span
            className="text-xs font-semibold tracking-[0.3em] uppercase"
            style={{ color: colors.gradientB }}
          >
            Float
          </span>
        </motion.div>

        <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          Float
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-400 md:text-lg">
          Real-time collaborative payments for group travel.
          <br />
          Create a shared virtual card, split purchases instantly, and approve
          transactions together before money moves.
        </p>

        <motion.div
          className="mt-12 w-full max-w-4xl rounded-[32px] border border-white/10 bg-white/[0.045] p-7 text-left backdrop-blur-sm md:p-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ delay: 0.12, duration: 0.65 }}
        >
          <p className="text-sm font-semibold tracking-[0.24em] text-cyan-100 uppercase">
            Features
          </p>
          <ul className="mt-6 space-y-4">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-sm leading-7 text-zinc-300 md:text-base"
              >
                <span
                  className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${colors.gradientA}, ${colors.gradientB})`,
                  }}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <motion.a
            href={withBasePath(APK_DOWNLOAD_PATH)}
            download
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 text-sm font-semibold text-white"
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

          <a
            href={GROUPPAY_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/4 px-8 py-4 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/8"
          >
            GitHub
          </a>

        </div>
      </motion.div>
    </section>
  );
}
