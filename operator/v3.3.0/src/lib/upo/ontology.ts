import type { SensorySemanticAdapter } from "./adapter";
import { euclidean, l2 } from "./math";
import { MemoryManifold, utcNow } from "./manifold";
import { HostileReferees } from "./referees";
import { DynamicStressRegulator } from "./regulator";
import { ParasympatheticSwarm } from "./swarm";
import { ContextRevisor, SensoryTriageAgent } from "./triage";
import {
  LayerType,
  type Clock,
  type ExecutionMetrics,
  type ModalChannel,
  type State,
  type UPOConfig,
} from "./types";

function winnerIndexOf(confidences: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < confidences.length; i++) {
    if (confidences[i] > confidences[best]) best = i;
  }
  return best;
}

export class UnifiedProcessOntology {
  readonly manifold: MemoryManifold;
  readonly regulator: DynamicStressRegulator;
  readonly triage: SensoryTriageAgent;
  readonly swarm: ParasympatheticSwarm;
  readonly referees: HostileReferees;

  constructor(
    readonly config: UPOConfig,
    clock: Clock = utcNow,
  ) {
    this.manifold = new MemoryManifold(config, clock);
    this.regulator = new DynamicStressRegulator(config);
    this.triage = new SensoryTriageAgent(new ContextRevisor(), this.manifold);
    this.swarm = new ParasympatheticSwarm(config);
    this.referees = new HostileReferees(config);
  }

  perceiveAndExecuteDetailed(
    inputs: Record<string, ModalChannel | number[]>,
    internal: number,
    env: number,
    adapter: SensorySemanticAdapter | null = null,
  ): ExecutionMetrics {
    if (!Number.isFinite(internal)) throw new Error("internal stress must be finite.");
    const thr = this.regulator.evaluateEnvironment(env);
    this.manifold.appendTransition(
      "SYSTEM",
      `env=${env.toFixed(2)}->thr=${thr.toFixed(2)}`,
      new Array<number>(this.config.latentDim).fill(0),
    );

    const { state: current, weights: triageWeights } = this.triage.processOverload(inputs);
    const swarm = this.swarm.generateAndDampen(current.vector, internal, thr, this.manifold);
    const preConfs = swarm.paths.map((p) => p.confidence);
    const { critiqued, distances } = this.referees.critique(swarm.paths);
    const postConfs = critiqued.map((p) => p.confidence);
    const winnerIndex = winnerIndexOf(postConfs);
    const winner = critiqued[winnerIndex];
    const distPre = distances[winnerIndex];

    const lineage = this.manifold.appendTransition(
      LayerType.REFLECTION.toUpperCase(),
      `winner=agent_${winnerIndex}|conf=${winner.confidence.toFixed(4)}`,
      winner.vector,
    );
    const final = this.collapse({ vector: winner.vector, lineage, confidence: winner.confidence });
    const distPost = euclidean(final.vector, this.config.groundTruth);
    const stabilityProxy = 1 / (1 + distPost);

    let decodedAction = "UNBOUND";
    let actionCosine = 0;
    if (adapter) {
      const decoded = adapter.decodeDetailed(final.vector);
      decodedAction = decoded.action;
      actionCosine = decoded.cosine;
    }

    return {
      finalState: final,
      winnerIndex,
      distPreCollapse: distPre,
      distPostCollapse: distPost,
      stabilityProxy,
      inversionMetric: swarm.inversionMetric,
      activeThreshold: thr,
      interventions: swarm.interventions,
      triageWeights,
      preConfidences: preConfs,
      postConfidences: postConfs,
      agentDistances: distances,
      dampedFlags: swarm.dampedFlags,
      agentStress: swarm.agentStress,
      decodedAction,
      actionCosineSimilarity: actionCosine,
    };
  }

  perceiveAndExecute(
    inputs: Record<string, ModalChannel | number[]>,
    internal: number,
    env: number,
  ): State {
    return this.perceiveAndExecuteDetailed(inputs, internal, env, null).finalState;
  }

  private collapse(s: State): State {
    const n = l2(s.vector);
    if (n < 1e-12) throw new Error("Collapse Error: Winner vector has zero L2 norm.");
    const nv = s.vector.map((x) => x / n);
    const lineage = this.manifold.appendTransition(LayerType.COGNITIVE.toUpperCase(), "L2_collapse", nv);
    return { vector: nv, lineage, confidence: s.confidence };
  }
}
