import { cosine } from "./math";
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
      if (i === 0 && this.config.enableInertiaInversion) {
        for (let j = 0; j < base.length; j++) {
          variation[j] = Math.abs(base[j]) > 1e-3 ? -base[j] : 0;
        }
        inversionMetric = cosine(variation, base);
      } else {
        for (let j = 0; j < base.length; j++) {
          variation[j] = base[j] + this.rng.uniform(-0.1, 0.1) * current;
        }
        if (i === 0) inversionMetric = cosine(variation, base);
      }

      const lineage = manifold.appendTransition(`agent_${i}`, action, variation);
      const confidence = Math.max(0, 1 - current * 0.5);
      paths.push({ vector: variation, lineage, confidence });
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
