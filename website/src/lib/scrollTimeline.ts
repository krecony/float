import { PAYMENT_TOTAL } from "@/lib/payment";

export type ScreenPhase =
  | "idle"
  | "tapping"
  | "processing"
  | "notifying"
  | "approving"
  | "success"
  | "hidden";

export type PhoneRole =
  | "terminal"
  | "payment"
  | "approver1"
  | "approver2";

export type ApproverStatus = "idle" | "notified" | "approved";

export interface PhoneTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}

export interface TimelineState {
  phase: ScreenPhase;
  phones: Record<PhoneRole, PhoneTransform>;
  phoneHighlights: Record<PhoneRole, number>;
  approverStatuses: [ApproverStatus, ApproverStatus];
  approvalCount: number;
  balance: number;
  nfcIntensity: number;
  successIntensity: number;
  showNfcPulse: boolean;
  nfcBeamIntensity: number;
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp01(t);
}

function easeInOut(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function phaseT(p: number, start: number, end: number) {
  if (p <= start) return 0;
  if (p >= end) return 1;
  return easeInOut((p - start) / (end - start));
}

/** Short glow pulse when a device performs its story action (0–1). */
function actionPulse(progress: number, peak: number, width = 0.06) {
  const half = width / 2;
  if (progress < peak - half || progress > peak + half) return 0;
  const t = 1 - Math.abs(progress - peak) / half;
  return easeInOut(t);
}

export function getPhoneHighlights(
  progress: number
): Record<PhoneRole, number> {
  return {
    payment: actionPulse(progress, 0.28, 0.07),
    terminal: actionPulse(progress, 0.74, 0.1),
    approver1: actionPulse(progress, 0.58, 0.07),
    approver2: actionPulse(progress, 0.66, 0.07),
  };
}

export function getScreenPhase(progress: number): ScreenPhase {
  if (progress >= 0.72) return "success";
  if (progress >= 0.52) return "approving";
  if (progress >= 0.42) return "notifying";
  if (progress >= 0.32) return "processing";
  if (progress >= 0.12) return "tapping";
  return "idle";
}

export function getApproverStatus(
  progress: number,
  index: 0 | 1
): ApproverStatus {
  if (progress < 0.42) return "idle";
  if (index === 0) {
    if (progress >= 0.58) return "approved";
    if (progress >= 0.42) return "notified";
  }
  if (progress >= 0.66) return "approved";
  if (progress >= 0.42) return "notified";
  return "idle";
}

export function getApprovalCount(progress: number): number {
  let count = 0;
  if (getApproverStatus(progress, 0) === "approved") count++;
  if (getApproverStatus(progress, 1) === "approved") count++;
  return count;
}

export function getBalance(progress: number): number {
  const base = 1240.5;
  if (progress < 0.72) return base;
  const t = phaseT(progress, 0.72, 0.86);
  return lerp(base, base - PAYMENT_TOTAL, t);
}

export function getPhoneTransforms(
  progress: number,
  isMobile: boolean
): Record<PhoneRole, PhoneTransform> {
  const scaleMul = isMobile ? 0.78 : 1;
  const globalOpacity = 1;
  const globalScale = 1;

  const floatFade = phaseT(progress, 0.12, 0.2);
  const floatY = floatFade * Math.sin(progress * Math.PI * 3) * 0.035;
  const tapT = phaseT(progress, 0.12, 0.28);
  const postTapT = phaseT(progress, 0.28, 0.48);
  const nfcT = phaseT(progress, 0.28, 0.42);

  const paymentStart: [number, number, number] = isMobile
    ? [1.25, 0.3, 0.25]
    : [2.05, 0.35, 0.4];
  const paymentEnd: [number, number, number] = isMobile
    ? [-0.5, 0, 0.5]
    : [-0.95, -0.05, 0.6];

  const paymentAtTerminal: [number, number, number] = [
    lerp(paymentStart[0], paymentEnd[0], tapT),
    lerp(paymentStart[1], paymentEnd[1], tapT),
    lerp(paymentStart[2], paymentEnd[2], tapT),
  ];
  const paymentHoldBack: [number, number, number] = isMobile
    ? [-0.35, 0.12, 0.42]
    : [-0.72, 0.08, 0.52];

  const paymentPos: [number, number, number] = [
    lerp(paymentAtTerminal[0], paymentHoldBack[0], postTapT),
    lerp(paymentAtTerminal[1], paymentHoldBack[1], postTapT) + floatY,
    lerp(paymentAtTerminal[2], paymentHoldBack[2], postTapT),
  ];

  const paymentRot: [number, number, number] = [
    lerp(0.1, -0.18, tapT),
    lerp(-0.38, 0.42, tapT + postTapT * 0.35),
    lerp(0.04, 0.08, tapT),
  ];

  const terminalBase: [number, number, number] = isMobile
    ? [-1.25, 0.1, 0.15]
    : [-2.05, 0.15, 0.1];

  const approverParallax = phaseT(progress, 0.12, 0.5) * 0.12;

  return {
    terminal: {
      position: [
        terminalBase[0],
        terminalBase[1] + floatY,
        terminalBase[2],
      ],
      rotation: [0.06, 0.38 + nfcT * 0.1, 0],
      scale: 1.08 * scaleMul * globalScale,
      opacity: globalOpacity,
    },
    approver1: {
      position: isMobile
        ? [0.85, 0.55, -0.75]
        : [
            1.15 + approverParallax * 0.1,
            0.5 + floatY,
            -1.05 - approverParallax * 0.2,
          ],
      rotation: [0.05, -0.25, 0.02],
      scale: 0.86 * scaleMul * globalScale,
      opacity: globalOpacity,
    },
    approver2: {
      position: isMobile
        ? [-0.55, 0.45, -0.8]
        : [
            -0.15 - approverParallax * 0.1,
            0.35 + floatY,
            -1.1 - approverParallax * 0.15,
          ],
      rotation: [0.04, 0.2, -0.02],
      scale: 0.86 * scaleMul * globalScale,
      opacity: globalOpacity,
    },
    payment: {
      position: paymentPos,
      rotation: paymentRot,
      scale: 0.96 * scaleMul * globalScale,
      opacity: globalOpacity,
    },
  };
}

export function getTimelineState(
  progress: number,
  isMobile: boolean
): TimelineState {
  const phase = getScreenPhase(progress);
  const nfcT = phaseT(progress, 0.28, 0.42);
  const successT = phaseT(progress, 0.72, 0.86);
  const beamT = phaseT(progress, 0.12, 0.45);

  return {
    phase,
    phones: getPhoneTransforms(progress, isMobile),
    phoneHighlights: getPhoneHighlights(progress),
    approverStatuses: [
      getApproverStatus(progress, 0),
      getApproverStatus(progress, 1),
    ],
    approvalCount: getApprovalCount(progress),
    balance: getBalance(progress),
    nfcIntensity: nfcT,
    successIntensity: successT,
    showNfcPulse: progress >= 0.28 && progress < 0.46,
    nfcBeamIntensity: beamT * (1 - phaseT(progress, 0.42, 0.48)),
  };
}
