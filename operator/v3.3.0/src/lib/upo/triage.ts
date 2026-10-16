import { l2, softmax } from "./math";
import type { MemoryManifold } from "./manifold";
import { LayerType, MODALITY_PRIORS, type ModalChannel, type State } from "./types";

export class ContextRevisor {
  readonly baseWeights: Record<string, number> = { ...MODALITY_PRIORS };
}

export function fuseModalities(
  inputs: Record<string, ModalChannel>,
  priors: Record<string, number>,
): { vector: number[]; weights: Record<string, number> } {
  const ordered = Object.keys(inputs);
  if (ordered.length === 0) throw new Error("Sensory Triage: empty inputs");
  const scores = ordered.map((k) => {
    const prior = priors[k] ?? 1;
    return prior * Math.log1p(inputs[k].energy);
  });
  const sm = softmax(scores);
  const weights: Record<string, number> = {};
  ordered.forEach((k, i) => {
    weights[k] = sm[i];
  });
  const dim = inputs[ordered[0]].vector.length;
  const vector = new Array<number>(dim).fill(0);
  for (let i = 0; i < dim; i++) {
    let s = 0;
    for (const k of ordered) s += weights[k] * inputs[k].vector[i];
    vector[i] = s;
  }
  return { vector, weights };
}

export class SensoryTriageAgent {
  constructor(
    readonly revisor: ContextRevisor,
    readonly manifold: MemoryManifold,
  ) {}

  /**
   * Stable softmax over prior * log1p(energy).
   * C1 kept energy as ||Wx+b|| before the sphere projection.
   * C9 compresses that energy: the linear product was one-hot on haptics.
   * If energy is omitted, L2(vector) is used.
   */
  processOverload(inputs: Record<string, ModalChannel | number[]>): { state: State; weights: Record<string, number> } {
    const keys = Object.keys(inputs);
    if (keys.length === 0) throw new Error("Sensory Triage: empty inputs");

    const channels = new Map<string, ModalChannel>();
    const dims = new Set<number>();
    for (const key of keys) {
      const raw = inputs[key];
      const channel: ModalChannel = Array.isArray(raw)
        ? { vector: raw, energy: l2(raw) }
        : raw;
      if (channel.vector.length === 0) throw new Error(`Sensory Triage: empty vector for ${key}`);
      if (!Number.isFinite(channel.energy) || channel.energy < 0) {
        throw new Error(`Sensory Triage: energy for ${key} must be finite and >= 0.`);
      }
      dims.add(channel.vector.length);
      channels.set(key, channel);
    }
    if (dims.size > 1) {
      throw new Error(`Sensory Triage: inconsistent dimensions ${[...dims].join(",")}`);
    }

    const ordered = [...channels.keys()];
    const plain: Record<string, ModalChannel> = {};
    for (const key of ordered) plain[key] = channels.get(key)!;
    const fused = fuseModalities(plain, this.revisor.baseWeights);
    const lineage = this.manifold.appendTransition(LayerType.SALIENCE.toUpperCase(), "triage", fused.vector);
    return { state: { vector: fused.vector, lineage, confidence: 1 }, weights: fused.weights };
  }
}
