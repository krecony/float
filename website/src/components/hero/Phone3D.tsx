"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { getTimelineState, type PhoneRole } from "@/lib/scrollTimeline";
import { useTimeline } from "@/context/TimelineContext";

interface Phone3DProps {
  role: PhoneRole;
  screen: ReactNode;
  isWide?: boolean;
}

export function Phone3D({ role, screen, isWide = false }: Phone3DProps) {
  const { getTimeline, isMobile } = useTimeline();
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  const bodyW = isWide ? 0.68 : 0.44;
  const bodyH = isWide ? 0.98 : 0.92;
  const bodyD = 0.048;
  const screenW = isWide ? 260 : 188;
  const screenH = isWide ? 400 : 368;

  const zIndex =
    role === "payment"
      ? 40
      : role === "terminal"
        ? 30
        : role === "approver1"
          ? 15
          : 10;

  const initial = useMemo(
    () => getTimelineState(0, isMobile).phones[role],
    [role, isMobile]
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const tr = getTimeline().phones[role];
    group.position.set(...tr.position);
    group.rotation.set(...tr.rotation);
    group.scale.setScalar(tr.scale);
    if (screenRef.current) {
      screenRef.current.style.opacity = String(tr.opacity);
      const highlight = getTimeline().phoneHighlights[role];
      const el = screenRef.current;
      const borderAlpha = 0.08 + highlight * 0.55;
      el.style.border = `2px solid rgba(103, 232, 249, ${borderAlpha})`;
      el.style.boxShadow =
        highlight > 0.02
          ? `0 0 ${12 + highlight * 24}px rgba(6, 182, 212, ${highlight * 0.45}), 0 20px 50px rgba(0,0,0,0.5)`
          : "0 20px 50px rgba(0,0,0,0.5)";
    }
  });

  return (
    <group
      ref={groupRef}
      position={initial.position}
      rotation={initial.rotation}
      scale={initial.scale}
    >
      <RoundedBox
        args={[bodyW + 0.018, bodyH + 0.018, bodyD + 0.008]}
        radius={0.055}
        smoothness={6}
        position={[0, 0, -0.004]}
      >
        <meshStandardMaterial
          color="#27272a"
          metalness={0.95}
          roughness={0.15}
        />
      </RoundedBox>

      <RoundedBox
        args={[bodyW, bodyH, bodyD]}
        radius={0.05}
        smoothness={6}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#141416"
          metalness={0.9}
          roughness={0.2}
        />
      </RoundedBox>

      <mesh position={[bodyW / 2 + 0.006, 0.12, 0]}>
        <boxGeometry args={[0.008, 0.1, 0.024]} />
        <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[bodyW / 2 + 0.006, -0.08, 0]}>
        <boxGeometry args={[0.008, 0.06, 0.024]} />
        <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.01, bodyD / 2 + 0.002]}>
        <planeGeometry args={[bodyW * 0.9, bodyH * 0.92]} />
        <meshPhysicalMaterial
          color="#050508"
          metalness={0.1}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      <Html
        transform
        occlude={false}
        distanceFactor={isWide ? 2.15 : 2.45}
        position={[0, 0.01, bodyD / 2 + 0.012]}
        style={{
          width: screenW,
          height: screenH,
          pointerEvents: "none",
        }}
        zIndexRange={[zIndex, 0]}
      >
        <div
          ref={screenRef}
          className="relative overflow-hidden shadow-2xl"
          style={{
            width: screenW,
            height: screenH,
            borderRadius: isWide ? 18 : 22,
            background: "#0a0a0c",
            border: "2px solid rgba(255,255,255,0.08)",
            opacity: 1,
          }}
        >
          <div
            className="absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black"
            style={{ width: isWide ? 56 : 44, height: isWide ? 14 : 12 }}
          />
          <div
            className="h-full w-full overflow-hidden"
            style={{ paddingTop: isWide ? 20 : 18 }}
          >
            {screen}
          </div>
        </div>
      </Html>
    </group>
  );
}
