"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SuccessGlowProps {
  intensity: number;
}

export function SuccessGlow({ intensity }: SuccessGlowProps) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!lightRef.current) return;
    const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
    lightRef.current.intensity = intensity * 4 * pulse;
  });

  if (intensity < 0.01) return null;

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0.5, 1]}
      color="#22c55e"
      intensity={intensity * 4}
      distance={8}
    />
  );
}
