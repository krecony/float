import { Timer } from "three";

/**
 * Clock-compatible wrapper around THREE.Timer for @react-three/fiber.
 * Avoids the deprecated THREE.Clock constructor warning.
 */
export class R3FTimerClock {
  autoStart = true;
  startTime = 0;
  oldTime = 0;
  elapsedTime = 0;
  running = false;

  private readonly timer = new Timer();

  constructor() {
    if (typeof document !== "undefined") {
      this.timer.connect(document);
    }
  }

  start() {
    this.timer.reset();
    this.running = true;
    this.startTime = performance.now();
    this.oldTime = this.startTime;
    this.elapsedTime = 0;
  }

  stop() {
    this.getDelta();
    this.running = false;
    this.autoStart = false;
  }

  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }

  getDelta() {
    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }

    if (!this.running) return 0;

    this.timer.update();
    const delta = this.timer.getDelta();
    const now = performance.now();
    this.oldTime = now;
    this.elapsedTime = this.timer.getElapsed();
    return delta;
  }
}

export function createR3FClock() {
  return new R3FTimerClock();
}
