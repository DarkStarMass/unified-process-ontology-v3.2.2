import type { SensorySemanticAdapter } from "./adapter";
import { normalize } from "./math";
import { DeterministicSensorSynthesizer } from "./sensors";
import { fuseModalities } from "./triage";
import { MODALITY_PRIORS, type ActionName } from "./types";

/** Assumption C17: a named rest state, not a measured truth. */
export type Scenario = { env: number; noise: number; internal: number; seed: number };

export const CALM: Scenario = { env: 0.2, noise: 0.1, internal: 0, seed: 0 };

export type GroundTruthMode = "uniform" | "calm";

/**
 * Unit direction of the triage fusion at a scenario.
 * Uses the same adapter as the run, and does not enter the swarm.
 * Assumption C20: `internal` is recorded on the scenario but is not an input
 * of the synthesizer, so it does not move this prototype.
 */
export function groundTruthFromScenario(adapter: SensorySemanticAdapter, scenario: Scenario): number[] {
  const raw = DeterministicSensorSynthesizer.synthesize(scenario.env, scenario.noise, scenario.seed);
  const inputs = adapter.ingest(raw.visual, raw.auditory, raw.imu);
  return normalize(fuseModalities(inputs, MODALITY_PRIORS).vector);
}

export type ActionBinding = { action: ActionName; scenario: Scenario };

/**
 * Placeholder assignment, correction C20. Not a measured motor policy.
 * Three environment levels are separable with the current sensors; noise is not.
 */
export const ACTION_BINDINGS: readonly ActionBinding[] = [
  { action: "MOTOR_PROCEED_GENTLY", scenario: { env: 0.2, noise: 1.0, internal: 0.3, seed: 0 } },
  { action: "PROMPT_LLM_CAUTION", scenario: { env: 0.8, noise: 1.0, internal: 0.3, seed: 0 } },
  { action: "MOTOR_STOP_IMMEDIATELY", scenario: { env: 1.4, noise: 1.0, internal: 0.3, seed: 0 } },
];
