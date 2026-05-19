"use client";

import { ContactShadows } from "@react-three/drei";
import type { TimelineState } from "@/lib/scrollTimeline";
import { colors } from "@/lib/colors";
import { Phone3D } from "./Phone3D";
import { TerminalScreen } from "./screens/TerminalScreen";
import { MemberApprovalScreen } from "./screens/MemberApprovalScreen";
import { PaymentScreen } from "./screens/PaymentScreen";
import { NfcPulse } from "./effects/NfcPulse";
import { NfcBeam } from "./effects/NfcBeam";
import { SuccessGlow } from "./effects/SuccessGlow";

const APPROVERS = [
  { name: "Alex", initials: "AK", accent: colors.gradientB },
  { name: "Jordan", initials: "JO", accent: colors.gradientC },
] as const;

interface SceneProps {
  timeline: TimelineState;
}

export function Scene({ timeline }: SceneProps) {
  const { phones } = timeline;
  const terminal = phones.terminal.position;
  const payment = phones.payment.position;

  const nfcMid: [number, number, number] = [
    (terminal[0] + payment[0]) / 2,
    (terminal[1] + payment[1]) / 2 + 0.05,
    (terminal[2] + payment[2]) / 2 + 0.2,
  ];

  return (
    <>
      <color attach="background" args={["#050508"]} />
      <fog attach="fog" args={["#050508", 7, 16]} />

      <ambientLight intensity={0.3} />
      <pointLight position={[-4, 3, 2]} intensity={1.4} color="#7c3aed" />
      <pointLight position={[4, 2, 3]} intensity={1.1} color="#06b6d4" />
      <pointLight position={[0, -2, 4]} intensity={0.7} color="#ec4899" />
      <directionalLight position={[2, 5, 3]} intensity={0.5} color="#ffffff" />
      <hemisphereLight
        args={["#7c3aed", "#050508", 0.35]}
        position={[0, 3, 0]}
      />

      <Phone3D
        role="terminal"
        isWide
        screen={<TerminalScreen phase={timeline.phase} />}
      />
      <Phone3D
        role="approver1"
        screen={
          <MemberApprovalScreen
            phase={timeline.phase}
            status={timeline.approverStatuses[0]}
            memberName={APPROVERS[0].name}
            initials={APPROVERS[0].initials}
            accentColor={APPROVERS[0].accent}
          />
        }
      />
      <Phone3D
        role="approver2"
        screen={
          <MemberApprovalScreen
            phase={timeline.phase}
            status={timeline.approverStatuses[1]}
            memberName={APPROVERS[1].name}
            initials={APPROVERS[1].initials}
            accentColor={APPROVERS[1].accent}
          />
        }
      />
      <Phone3D
        role="payment"
        screen={
          <PaymentScreen phase={timeline.phase} />
        }
      />

      <NfcBeam
        from={terminal}
        to={payment}
        intensity={timeline.nfcBeamIntensity}
        visible={timeline.showNfcPulse}
      />

      <NfcPulse
        position={nfcMid}
        intensity={timeline.nfcIntensity}
        visible={timeline.showNfcPulse}
      />
      <NfcPulse
        position={[
          terminal[0] + 0.15,
          terminal[1] + 0.05,
          terminal[2] + 0.25,
        ]}
        intensity={timeline.nfcIntensity * 0.8}
        visible={timeline.showNfcPulse}
      />
      <NfcPulse
        position={[payment[0] - 0.1, payment[1], payment[2] + 0.2]}
        intensity={timeline.nfcIntensity * 0.8}
        visible={timeline.showNfcPulse}
      />

      <SuccessGlow intensity={timeline.successIntensity} />

      <ContactShadows
        position={[0, -1.15, 0]}
        opacity={0.45}
        scale={14}
        blur={2.8}
        far={4.5}
        color="#000000"
      />
    </>
  );
}
