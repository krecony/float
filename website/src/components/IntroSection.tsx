"use client";

import { FloatMark } from "@/components/ui/FloatMark";
import { GradientOrb } from "@/components/ui/GradientOrb";
import { colors } from "@/lib/colors";
import { unlockAudioFromGesture } from "@/lib/soundEffects";
import { GROUPPAY_GITHUB_URL } from "@/lib/site";

interface IntroSectionProps {
  opacity?: number;
  unveiled?: boolean;
  onUnveil?: () => void;
}

export function IntroSection({
  opacity = 1,
  unveiled = false,
  onUnveil,
}: IntroSectionProps) {
  const handleContinue = () => {
    unlockAudioFromGesture();
    onUnveil?.();
  };

  return (
    <section
      className="relative z-20 flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      style={{
        background: colors.bgDeep,
        opacity,
        willChange: opacity < 1 ? "opacity" : undefined,
      }}
    >
      <GradientOrb
        className="-left-[15%] top-[10%] opacity-30"
        color={colors.gradientA}
        size="45vh"
      />
      <GradientOrb
        className="-right-[10%] bottom-[15%] opacity-25"
        color={colors.gradientB}
        delay={2}
        size="40vh"
      />

      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="flex items-center justify-center gap-3">
          <FloatMark className="float-mark h-12 w-12 drop-shadow-[0_10px_26px_rgba(34,211,238,0.22)]" />
          <span
            className="text-xs font-semibold tracking-[0.3em] uppercase"
            style={{ color: colors.gradientB }}
          >
            Float
          </span>
        </div>
        <h1 className="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          Float through group payments without the dinner-table chaos
        </h1>
        <p className="mt-6 text-base leading-relaxed text-zinc-400 md:text-lg">
          A cinematic demo for quick shared spending: one person taps, everyone
          approves in realtime, and the whole group stays synced as the moment
          moves.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href={GROUPPAY_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/4 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-cyan-300/40 hover:bg-white/8"
          >
            GitHub
          </a>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={unveiled}
          aria-hidden={unveiled}
          tabIndex={unveiled ? -1 : 0}
          className={`mt-10 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-8 py-3 text-sm font-medium tracking-wide text-cyan-100 transition-colors hover:border-cyan-400/70 hover:bg-cyan-400/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
            unveiled ? "invisible pointer-events-none" : ""
          }`}
          style={
            unveiled
              ? undefined
              : { animation: "intro-continue-pulse 2.8s ease-in-out infinite" }
          }
        >
          Click to scroll and unveil
        </button>
      </div>
    </section>
  );
}
