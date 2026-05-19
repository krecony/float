"use client";

import type { ScreenPhase } from "@/lib/scrollTimeline";
import { colors } from "@/lib/colors";
import { NfcIcon } from "@/components/ui/NfcIcon";
import { formatEuro, PAYMENT_TOTAL, SHARE_AMOUNT, GROUP_MEMBERS } from "@/lib/payment";

interface TerminalScreenProps {
  phase: ScreenPhase;
}

export function TerminalScreen({ phase }: TerminalScreenProps) {
  const isTapping = phase === "tapping";
  const isProcessing =
    phase === "processing" ||
    phase === "notifying" ||
    phase === "approving";
  const isPaid = phase === "success";
  const nfcActive = isTapping || isProcessing;

  const statusColor = isPaid
    ? colors.approveAccent
    : nfcActive
      ? colors.gradientB
      : "#3f3f46";

  return (
    <div className="flex h-full w-full flex-col bg-[#0c0c10] p-3 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
          Merchant terminal
        </span>
        <div
          className="h-2 w-2 rounded-full transition-colors duration-300"
          style={{
            backgroundColor: statusColor,
            boxShadow: nfcActive || isPaid ? `0 0 8px ${statusColor}` : "none",
          }}
        />
      </div>

      <div className="mt-3 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#111116] p-4">
        <div
          className={`flex flex-col items-center gap-2 transition-transform duration-300 ${isTapping ? "scale-105" : "scale-100"}`}
        >
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl ${nfcActive ? "animate-pulse" : ""}`}
            style={{
              background: nfcActive
                ? "rgba(6,182,212,0.12)"
                : "rgba(245,158,11,0.1)",
              border: `2px solid ${nfcActive ? colors.gradientB : colors.terminalAccent}44`,
              boxShadow: nfcActive
                ? `0 0 24px ${colors.gradientB}55`
                : undefined,
            }}
          >
            <NfcIcon
              size={44}
              color={nfcActive ? colors.gradientB : colors.terminalAccent}
              animated={nfcActive}
            />
          </div>

          {nfcActive && !isPaid && (
            <span
              className="animate-pulse text-[10px] font-semibold tracking-wide uppercase"
              style={{ color: colors.gradientB }}
            >
              {isTapping ? "Receiving tap…" : "Authorizing…"}
            </span>
          )}
        </div>

        <div className="w-full space-y-1 text-center">
          <p className="text-[10px] text-zinc-500 uppercase">Total charge</p>
          <p className="text-4xl font-bold tracking-tight tabular-nums">
            {isPaid ? "Paid ✓" : formatEuro(PAYMENT_TOTAL)}
          </p>
          {!isPaid && (
            <p className="text-[11px] text-zinc-400">
              {GROUP_MEMBERS} × {formatEuro(SHARE_AMOUNT)} per person
            </p>
          )}
        </div>

        {!isPaid && (
          <span
            className="rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{
              background: `${colors.terminalAccent}18`,
              color: colors.terminalAccent,
              border: `1px solid ${colors.terminalAccent}44`,
            }}
          >
            {isProcessing ? "Awaiting approvals" : "Ready to Pay"}
          </span>
        )}
      </div>

      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-white/10 transition-opacity duration-300"
        style={{ opacity: isProcessing && !isPaid ? 1 : 0 }}
      >
        <div
          className="h-full w-1/3 animate-[shimmer_1s_linear_infinite] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${colors.gradientB}, ${colors.terminalAccent})`,
          }}
        />
      </div>
    </div>
  );
}
