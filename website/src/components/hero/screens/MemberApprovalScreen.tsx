"use client";

import type { ApproverStatus, ScreenPhase } from "@/lib/scrollTimeline";
import { formatEuro, SHARE_AMOUNT } from "@/lib/payment";
import { colors } from "@/lib/colors";
import { SplitAmount } from "@/components/ui/SplitAmount";

interface MemberApprovalScreenProps {
  phase: ScreenPhase;
  status: ApproverStatus;
  memberName: string;
  initials: string;
  accentColor: string;
}

export function MemberApprovalScreen({
  phase,
  status,
  memberName,
  initials,
  accentColor,
}: MemberApprovalScreenProps) {
  const showRequest =
    status === "notified" ||
    status === "approved" ||
    phase === "notifying" ||
    phase === "approving";
  const isApproved = status === "approved";
  const canApprove = status === "notified";

  return (
    <div className="flex h-full w-full flex-col gap-2 p-3 text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{
              background: `${accentColor}33`,
              color: accentColor,
            }}
          >
            {initials}
          </div>
          <span className="truncate text-sm font-semibold">{memberName}</span>
        </div>
        {showRequest && !isApproved && (
          <span
            className="relative flex h-4 w-4 shrink-0 items-center justify-center"
            aria-hidden
          >
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ background: accentColor }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ background: accentColor }}
            />
          </span>
        )}
      </div>

      {showRequest ? (
        <div
          className="flex flex-1 flex-col gap-2 rounded-xl p-3"
          style={{
            background: colors.surface,
            border: `1px solid ${canApprove ? `${accentColor}55` : colors.surfaceBorder}`,
            boxShadow: canApprove ? `0 0 20px ${accentColor}28` : undefined,
          }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Payment request
          </p>
          <SplitAmount compact />
          <p className="text-[11px] font-medium" style={{ color: accentColor }}>
            From your account: {formatEuro(SHARE_AMOUNT)}
          </p>

          <button
            type="button"
            className={`mt-auto w-full rounded-xl py-3 text-sm font-bold uppercase tracking-wide ${
              canApprove ? "animate-pulse" : ""
            }`}
            style={{
              background: isApproved
                ? `${colors.approveAccent}22`
                : canApprove
                  ? `linear-gradient(135deg, ${accentColor}, ${colors.approveAccent})`
                  : "rgba(255,255,255,0.08)",
              color: isApproved ? colors.approveAccent : "#fff",
              border: isApproved
                ? `1px solid ${colors.approveAccent}55`
                : "none",
            }}
          >
            {isApproved ? "✓ Approved" : "Approve"}
          </button>
        </div>
      ) : (
        <div
          className="flex flex-1 items-center justify-center rounded-xl p-4"
          style={{ background: colors.surface }}
        >
          <p className="text-center text-xs text-zinc-500">Waiting for payment…</p>
        </div>
      )}
    </div>
  );
}
