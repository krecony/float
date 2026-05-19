"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface NfcPulseProps {
  position: [number, number, number];
  intensity: number;
  visible: boolean;
}

export function NfcPulse({ position, intensity, visible }: NfcPulseProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!meshRef.current || !matRef.current || !visible) return;
    const t = state.clock.elapsedTime * 2.5;
    const scale = 0.35 + (Math.sin(t) * 0.5 + 0.5) * 0.55 * intensity;
    meshRef.current.scale.setScalar(scale);
    matRef.current.opacity = (0.35 + Math.sin(t) * 0.2) * intensity;
  });

  if (!visible || intensity < 0.01) return null;

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.35, 0.42, 48]} />
      <meshBasicMaterial
        ref={matRef}
        color="#06b6d4"
        transparent
        opacity={0.4 * intensity}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
