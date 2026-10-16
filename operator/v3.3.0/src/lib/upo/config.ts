import { buildUnitGroundTruth, l2 } from "./math";
import type { UPOConfig } from "./types";

export type UPOConfigInput = {
  numAgents?: number;
  baseStressThreshold?: number;
  emergencyStressThreshold?: number;
  stressActivationLimit?: number;
  dampingFactor?: number;
  stressIncrement?: number;
  tolerance?: number;
  latentDim?: number;
  groundTruth?: readonly number[];
  seed?: number;
  maxLogSize?: number;
  enableInertiaInversion?: boolean;
  inversionCompetes?: boolean;
  noiseScale?: number;
  actionMinMargin?: number | null;
  actionMarginQuantile?: number;
  debug?: boolean;
};

function finite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`UPOConfig: ${name} must be finite, got ${value}.`);
}

export function createUPOConfig(input: UPOConfigInput = {}): UPOConfig {
  const latentDim = input.latentDim ?? 512;
  if (!Number.isInteger(latentDim) || latentDim <= 0) {
    throw new Error("UPOConfig: latentDim must be a strictly positive integer.");
  }
  const groundTruth = input.groundTruth
    ? Array.from(input.groundTruth)
    : buildUnitGroundTruth(latentDim);
  if (groundTruth.length !== latentDim) {
    throw new Error(
      `UPOConfig: len(groundTruth)=${groundTruth.length} != latentDim=${latentDim}`,
    );
  }
  for (const x of groundTruth) {
    if (!Number.isFinite(x)) throw new Error("UPOConfig: groundTruth contains a non-finite component.");
  }
  const gtNorm = l2(groundTruth);
  if (Math.abs(gtNorm - 1) >= 1e-9) {
    throw new Error(`UPOConfig: groundTruth must have L2 norm 1, got ${gtNorm}.`);
  }

  const numAgents = input.numAgents ?? 20;
  const dampingFactor = input.dampingFactor ?? 0.8;
  const tolerance = input.tolerance ?? 0.3;
  const stressIncrement = input.stressIncrement ?? 0.05;
  const seed = input.seed ?? 42;
  const maxLogSize = input.maxLogSize ?? 1000;
  const baseStressThreshold = input.baseStressThreshold ?? 0.85;
  const emergencyStressThreshold = input.emergencyStressThreshold ?? 0.5;
  const stressActivationLimit = input.stressActivationLimit ?? 0.3;

  if (!Number.isInteger(numAgents) || numAgents < 1 || numAgents > 128) {
    throw new Error("UPOConfig: numAgents must be an integer in [1, 128].");
  }
  if (!Number.isInteger(seed)) throw new Error("UPOConfig: seed must be an integer.");
  if (!Number.isInteger(maxLogSize) || maxLogSize < 1 || maxLogSize > 100_000) {
    throw new Error("UPOConfig: maxLogSize must be an integer in [1, 100000].");
  }
  finite("dampingFactor", dampingFactor);
  if (!(dampingFactor > 0 && dampingFactor < 1)) {
    throw new Error(`UPOConfig: dampingFactor=${dampingFactor} must be in (0, 1).`);
  }
  finite("tolerance", tolerance);
  if (tolerance < 0) throw new Error("UPOConfig: tolerance must be non-negative.");
  finite("stressIncrement", stressIncrement);
  if (stressIncrement < 0) throw new Error("UPOConfig: stressIncrement must be non-negative.");
  finite("baseStressThreshold", baseStressThreshold);
  finite("emergencyStressThreshold", emergencyStressThreshold);
  finite("stressActivationLimit", stressActivationLimit);
  if (baseStressThreshold <= 0 || emergencyStressThreshold <= 0) {
    throw new Error("UPOConfig: stress thresholds must be strictly positive.");
  }

  const enableInertiaInversion = input.enableInertiaInversion ?? true;
  const inversionCompetes = input.inversionCompetes ?? false;
  const noiseScale = input.noiseScale ?? 1;
  const actionMinMargin = input.actionMinMargin === undefined ? null : input.actionMinMargin;
  const actionMarginQuantile = input.actionMarginQuantile ?? 0.99;
  if (typeof inversionCompetes !== "boolean") {
    throw new Error("UPOConfig: inversionCompetes must be a boolean.");
  }
  if (enableInertiaInversion && !inversionCompetes && numAgents < 2) {
    throw new Error(
      "UPOConfig: excluding the inertia probe from selection requires numAgents >= 2.",
    );
  }
  finite("noiseScale", noiseScale);
  if (noiseScale < 0) throw new Error("UPOConfig: noiseScale must be non-negative.");
  if (actionMinMargin !== null) {
    finite("actionMinMargin", actionMinMargin);
    if (actionMinMargin < 0) throw new Error("UPOConfig: actionMinMargin must be non-negative.");
  }
  finite("actionMarginQuantile", actionMarginQuantile);
  if (!(actionMarginQuantile > 0 && actionMarginQuantile <= 1)) {
    throw new Error("UPOConfig: actionMarginQuantile must be in (0, 1].");
  }

  return Object.freeze({
    numAgents,
    baseStressThreshold,
    emergencyStressThreshold,
    stressActivationLimit,
    dampingFactor,
    stressIncrement,
    tolerance,
    latentDim,
    groundTruth: Object.freeze(groundTruth),
    seed,
    maxLogSize,
    enableInertiaInversion,
    inversionCompetes,
    noiseScale,
    actionMinMargin,
    actionMarginQuantile,
    debug: input.debug ?? false,
  });
}
