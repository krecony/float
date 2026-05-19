"use client";

import type { ScreenPhase } from "@/lib/scrollTimeline";
import { colors } from "@/lib/colors";
import { formatEuro, SHARE_AMOUNT } from "@/lib/payment";
import { SplitAmount } from "@/components/ui/SplitAmount";

interface PaymentScreenProps {
  phase: ScreenPhase;
}

export function PaymentScreen({ phase }: PaymentScreenProps) {
  const isTapping = phase === "tapping";
  const isSuccess = phase === "success";

  return (
    <div className="flex h-full w-full flex-col gap-2 p-3 text-white">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
          Pay
        </span>
        {isTapping && (
          <span
            className="animate-pulse rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: "rgba(6,182,212,0.2)",
              color: colors.gradientB,
            }}
          >
            Tap to pay
          </span>
        )}
      </div>

      <div
        className={`relative aspect-[1.55/1] w-full overflow-hidden rounded-2xl p-3 shadow-2xl transition-shadow duration-300 ${isTapping ? "scale-[1.02]" : ""}`}
        style={{
          background: colors.cardGradient,
          boxShadow: isSuccess
            ? `0 0 36px ${colors.approveAccent}55`
            : isTapping
              ? `0 0 28px ${colors.gradientB}44`
              : "0 8px 28px rgba(0,0,0,0.45)",
        }}
      >
        <span className="text-[10px] font-medium text-white/70 uppercase">
          Virtual card
        </span>
        <p className="mt-4 font-mono text-base tracking-[0.18em]">•••• 4820</p>
      </div>

      <div
        className="mt-auto space-y-2 rounded-xl px-3 py-2"
        style={{ background: colors.surface }}
      >
        <SplitAmount />
        <p
          className="text-[11px] font-medium"
          style={{ color: isSuccess ? colors.approveAccent : colors.gradientB }}
        >
          {isSuccess
            ? `Paid ${formatEuro(SHARE_AMOUNT)} from your share`
            : `You pay ${formatEuro(SHARE_AMOUNT)}`}
        </p>
      </div>
    </div>
  );
}
