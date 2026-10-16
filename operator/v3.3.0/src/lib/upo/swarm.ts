import { cosine, dot, l2, normalize } from "./math";
import type { MemoryManifold } from "./manifold";
import { STREAM_SWARM, SeededRng, streamSeed } from "./rng";
import { LayerType, type State, type UPOConfig } from "./types";

export type SwarmResult = {
  paths: State[];
  interventions: number;
  inversionMetric: number;
  dampedFlags: boolean[];
  agentStress: number[];
};

/** 1 minus the mean pairwise cosine of agents that are not the inversion probe. */
export function swarmDiversity(vectors: readonly (readonly number[])[], probe: readonly boolean[]): number {
  const vs: number[][] = [];
  for (let i = 0; i < vectors.length; i++) {
    if (probe[i]) continue;
    vs.push(normalize(vectors[i]));
  }
  let sum = 0;
  let n = 0;
  for (let i = 0; i < vs.length; i++) {
    for (let j = i + 1; j < vs.length; j++) {
      sum += dot(vs[i], vs[j]);
      n += 1;
    }
  }
  return n === 0 ? 0 : 1 - sum / n;
}

export class ParasympatheticSwarm {
  private readonly rng: SeededRng;

  constructor(readonly config: UPOConfig) {
    this.rng = new SeededRng(streamSeed(config.seed, STREAM_SWARM));
  }

  generateAndDampen(
    base: readonly number[],
    initialStress: number,
    threshold: number,
    manifold: MemoryManifold,
  ): SwarmResult {
    if (!Number.isFinite(initialStress) || !Number.isFinite(threshold)) {
      throw new Error("Swarm: stress and threshold must be finite.");
    }
    if (base.length !== this.config.latentDim) {
      throw new Error(`Swarm: base dim ${base.length} != latentDim ${this.config.latentDim}`);
    }

    const paths: State[] = [];
    const dampedFlags: boolean[] = [];
    const agentStress: number[] = [];
    let current = initialStress;
    let interventions = 0;
    let inversionMetric = 1;

    for (let i = 0; i < this.config.numAgents; i++) {
      let isDamped = false;
      let action: string;
      if (current >= threshold) {
        current *= this.config.dampingFactor;
        interventions += 1;
        isDamped = true;
        action = `damped@${threshold.toFixed(2)}`;
      } else {
        action = `normal_${i}`;
      }

      const variation = new Array<number>(base.length);
      let isInversionProbe = false;
      if (i === 0 && this.config.enableInertiaInversion) {
        for (let j = 0; j < base.length; j++) {
          variation[j] = Math.abs(base[j]) > 1e-3 ? -base[j] : 0;
        }
        inversionMetric = cosine(variation, base);
        isInversionProbe = true;
      } else {
        const sigma = (current * this.config.noiseScale * l2(base)) / Math.sqrt(base.length);
        const amplitude = Math.sqrt(3) * sigma;
        for (let j = 0; j < base.length; j++) {
          variation[j] = base[j] + this.rng.uniform(-amplitude, amplitude);
        }
        if (i === 0) inversionMetric = cosine(variation, base);
      }

      const lineage = manifold.appendTransition(`agent_${i}`, action, variation);
      const confidence = Math.max(0, 1 - current * 0.5);
      paths.push({ vector: variation, lineage, confidence, isInversionProbe });
      dampedFlags.push(isDamped);
      agentStress.push(current);
      current += this.config.stressIncrement;
    }

    manifold.appendTransition(
      LayerType.PARASYMPATHETIC.toUpperCase(),
      `interventions=${interventions}|inv_cos=${inversionMetric.toFixed(4)}`,
      new Array<number>(this.config.latentDim).fill(0),
    );

    return { paths, interventions, inversionMetric, dampedFlags, agentStress };
  }
}
