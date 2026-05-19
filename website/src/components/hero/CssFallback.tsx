"use client";

import type { CSSProperties, ReactNode } from "react";
import { getTimelineState, type PhoneRole } from "@/lib/scrollTimeline";
import { colors } from "@/lib/colors";
import { TerminalScreen } from "./screens/TerminalScreen";
import { MemberApprovalScreen } from "./screens/MemberApprovalScreen";
import { PaymentScreen } from "./screens/PaymentScreen";
import { AmbientGradients } from "./effects/AmbientGradients";

interface CssFallbackProps {
  progress: number;
  isMobile: boolean;
}

function PhoneFrame({
  children,
  className = "",
  style,
  highlight = 0,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  highlight?: number;
}) {
  const borderAlpha = 0.35 + highlight * 0.55;
  return (
    <div
      className={`relative overflow-hidden rounded-[1.4rem] border-2 shadow-2xl ${className}`}
      style={{
        width: 168,
        height: 320,
        background: "linear-gradient(180deg, #1c1c1f 0%, #0a0a0c 100%)",
        borderColor: `rgba(103, 232, 249, ${borderAlpha})`,
        boxShadow:
          highlight > 0.02
            ? `inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 ${12 + highlight * 24}px rgba(6, 182, 212, ${highlight * 0.45}), 0 20px 50px rgba(0,0,0,0.5)`
            : "inset 0 0 0 1px rgba(255,255,255,0.06), 0 20px 50px rgba(0,0,0,0.5)",
        ...style,
      }}
    >
      <div className="absolute top-2 left-1/2 z-10 h-2.5 w-10 -translate-x-1/2 rounded-full bg-black" />
      <div className="h-full overflow-hidden pt-4">{children}</div>
    </div>
  );
}

const APPROVERS = [
  { name: "Alex", initials: "AK", accent: colors.gradientB },
  { name: "Jordan", initials: "JO", accent: colors.gradientC },
] as const;

export function CssFallback({ progress, isMobile }: CssFallbackProps) {
  const timeline = getTimelineState(progress, isMobile);
  const { phones, phase, phoneHighlights } = timeline;

  const toStyle = (role: PhoneRole) => ({
    opacity: phones[role].opacity,
    transform: `translate(${phones[role].position[0] * 22}px, ${phones[role].position[1] * -32}px) scale(${phones[role].scale * 0.95})`,
  });

  return (
    <div
      className="relative flex h-screen w-full items-center justify-center overflow-hidden"
      style={{ background: "#050508" }}
    >
      <AmbientGradients />

      <div
        className="relative flex max-w-[95vw] flex-wrap items-center justify-center gap-2 px-2 md:gap-4"
      >
        <PhoneFrame
          className="z-10"
          style={toStyle("terminal")}
          highlight={phoneHighlights.terminal}
        >
          <TerminalScreen phase={phase} />
        </PhoneFrame>

        {!isMobile && (
          <PhoneFrame
            className="z-[5]"
            style={toStyle("approver1")}
            highlight={phoneHighlights.approver1}
          >
            <MemberApprovalScreen
              phase={phase}
              status={timeline.approverStatuses[0]}
              memberName={APPROVERS[0].name}
              initials={APPROVERS[0].initials}
              accentColor={APPROVERS[0].accent}
            />
          </PhoneFrame>
        )}

        {!isMobile && (
          <PhoneFrame
            className="z-[5]"
            style={toStyle("approver2")}
            highlight={phoneHighlights.approver2}
          >
            <MemberApprovalScreen
              phase={phase}
              status={timeline.approverStatuses[1]}
              memberName={APPROVERS[1].name}
              initials={APPROVERS[1].initials}
              accentColor={APPROVERS[1].accent}
            />
          </PhoneFrame>
        )}

        <PhoneFrame
          className="z-20"
          style={toStyle("payment")}
          highlight={phoneHighlights.payment}
        >
          <PaymentScreen phase={phase} />
        </PhoneFrame>
      </div>

      {timeline.showNfcPulse && (
        <div
          className="pointer-events-none absolute h-20 w-20 animate-ping rounded-full border-2 border-cyan-400/60"
          style={
            isMobile
              ? { left: "50%", top: "48%", transform: "translate(-50%, -50%)" }
              : { left: "42%", top: "46%" }
          }
        />
      )}
    </div>
  );
}
