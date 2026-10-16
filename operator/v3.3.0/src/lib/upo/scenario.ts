import type { SensorySemanticAdapter } from "./adapter";
import { normalize } from "./math";
import { DeterministicSensorSynthesizer } from "./sensors";
import { fuseModalities } from "./triage";
import { MODALITY_PRIORS } from "./types";

/** Assumption C17: a named rest state, not a measured truth. */
export type Scenario = { env: number; noise: number; internal: number; seed: number };

export const CALM: Scenario = { env: 0.2, noise: 0.1, internal: 0, seed: 0 };

export type GroundTruthMode = "uniform" | "calm";

/**
 * Unit direction of the triage fusion at a scenario.
 * Uses the same adapter as the run, and does not enter the swarm.
 */
export function groundTruthFromScenario(adapter: SensorySemanticAdapter, scenario: Scenario): number[] {
  const raw = DeterministicSensorSynthesizer.synthesize(scenario.env, scenario.noise, scenario.seed);
  const inputs = adapter.ingest(raw.visual, raw.auditory, raw.imu);
  return normalize(fuseModalities(inputs, MODALITY_PRIORS).vector);
}
