"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface NfcBeamProps {
  from: [number, number, number];
  to: [number, number, number];
  intensity: number;
  visible: boolean;
}

export function NfcBeam({ from, to, intensity, visible }: NfcBeamProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const { position, rotation, length } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    );
    const euler = new THREE.Euler().setFromQuaternion(quat);
    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      length: len,
    };
  }, [from, to]);

  useFrame((state) => {
    if (!meshRef.current || !matRef.current || !visible) return;
    const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
    matRef.current.opacity = intensity * 0.55 * pulse;
    meshRef.current.scale.set(1, 1 + pulse * 0.15, 1);
  });

  if (!visible || intensity < 0.02 || length < 0.1) return null;

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <cylinderGeometry args={[0.02, 0.02, length, 8]} />
      <meshBasicMaterial
        ref={matRef}
        color="#06b6d4"
        transparent
        opacity={intensity * 0.5}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
