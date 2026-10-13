import type { UPOConfig } from "./types";

/** Allostatic threshold: emergency when env stress reaches the activation limit. */
export class DynamicStressRegulator {
  currentThreshold: number;

  constructor(readonly config: UPOConfig) {
    this.currentThreshold = config.baseStressThreshold;
  }

  evaluateEnvironment(envStress: number): number {
    if (!Number.isFinite(envStress)) {
      throw new Error(`DynamicStressRegulator: env stress must be finite, got ${envStress}.`);
    }
    if (envStress >= this.config.stressActivationLimit) {
      this.currentThreshold = this.config.emergencyStressThreshold;
    } else {
      this.currentThreshold = this.config.baseStressThreshold;
    }
    return this.currentThreshold;
  }
}
