/**
 * Drop-in replacement for three/src/core/Clock.js (wired via next.config alias).
 * Uses THREE.Timer — no deprecation warning.
 */
export { R3FTimerClock as Clock } from "@/lib/r3fClock";
