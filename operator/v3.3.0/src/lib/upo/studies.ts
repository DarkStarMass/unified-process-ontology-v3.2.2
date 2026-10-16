import { SensorySemanticAdapter } from "./adapter";
import { KERNEL_NOTES, KERNEL_VERSION } from "./assumptions";
import { createUPOConfig, type UPOConfigInput } from "./config";
import { entryHash, logicalClock, utcNow } from "./manifold";
import { UnifiedProcessOntology } from "./ontology";
import { CALM, groundTruthFromScenario, type GroundTruthMode, type Scenario } from "./scenario";
import { DeterministicSensorSynthesizer } from "./sensors";
import type { Clock, ExecutionMetrics, UPOConfig } from "./types";

export type RunParams = {
  envStress: number;
  internalStress: number;
  noiseLevel: number;
  dampingFactor: number;
  tolerance: number;
  stressIncrement: number;
  seed: number;
  numAgents: number;
  enableInertiaInversion: boolean;
  inversionCompetes?: boolean;
  noiseScale?: number;
  actionMinMargin?: number | null;
  actionMarginQuantile?: number;
  groundTruthMode?: GroundTruthMode;
  scenario?: Scenario;
  /** When set, and clock is omitted, the run uses this logical UTC origin. */
  logicalOrigin?: string;
  maxLogSize?: number;
  clock?: Clock;
};

export const DEFAULT_RUN: RunParams = {
  envStress: 0.32,
  internalStress: 0.42,
  noiseLevel: 0.42,
  dampingFactor: 0.8,
  tolerance: 0.3,
  stressIncrement: 0.05,
  seed: 42,
  numAgents: 20,
  enableInertiaInversion: true,
  groundTruthMode: "uniform",
  maxLogSize: 1000,
};

export type SingleRun = {
  params: RunParams;
  config: UPOConfig;
  metrics: ExecutionMetrics;
  chainIntact: boolean;
  logSize: number;
  log: ReturnType<UnifiedProcessOntology["manifold"]["entries"]>;
  orthogonality: { min: number; max: number; mean: number };
};

function configFromParams(params: RunParams, groundTruth?: readonly number[]): UPOConfig {
  const input: UPOConfigInput = {
    seed: params.seed,
    dampingFactor: params.dampingFactor,
    tolerance: params.tolerance,
    stressIncrement: params.stressIncrement,
    numAgents: params.numAgents,
    enableInertiaInversion: params.enableInertiaInversion,
    inversionCompetes: params.inversionCompetes,
    noiseScale: params.noiseScale,
    actionMinMargin: params.actionMinMargin === undefined ? null : params.actionMinMargin,
    actionMarginQuantile: params.actionMarginQuantile,
    maxLogSize: params.maxLogSize ?? 1000,
    groundTruth,
    debug: false,
  };
  return createUPOConfig(input);
}

function openAdapter(params: RunParams): SensorySemanticAdapter {
  return new SensorySemanticAdapter(
    512,
    params.seed,
    params.actionMinMargin === undefined ? null : params.actionMinMargin,
    params.actionMarginQuantile,
  );
}

export function executeSingle(params: RunParams): SingleRun {
  const adapter = openAdapter(params);
  const mode = params.groundTruthMode ?? "uniform";
  const scenario = params.scenario ?? CALM;
  const groundTruth = mode === "calm" ? groundTruthFromScenario(adapter, scenario) : undefined;
  const config = configFromParams(params, groundTruth);
  const clock = params.clock ?? (params.logicalOrigin ? logicalClock(params.logicalOrigin) : utcNow);
  const upo = new UnifiedProcessOntology(config, clock);
  const raw = DeterministicSensorSynthesizer.synthesize(params.envStress, params.noiseLevel, params.seed);
  const inputs = adapter.ingest(raw.visual, raw.auditory, raw.imu);
  const metrics = upo.perceiveAndExecuteDetailed(inputs, params.internalStress, params.envStress, adapter);
  return {
    params,
    config,
    metrics,
    chainIntact: upo.manifold.verifyChainIntegrity(),
    logSize: upo.manifold.size,
    log: upo.manifold.entries(),
    orthogonality: adapter.computeOrthogonalityStats(),
  };
}

export type StressRecord = {
  iteration: number;
  noiseLevel: number;
  simulatedEnvironmentStress: number;
  activeThreshold: number;
  swarmPanicInterventions: number;
  winnerAgent: number;
  distPreCollapse: number;
  distPostCollapse: number;
  stabilityProxy: number;
  winnerPreConfidence: number;
  systemConfidencePostReferee: number;
  decodedAction: string;
  actionMargin: number;
  degenerate: boolean;
  internalStress: number;
  chainIntact: boolean;
  toleranceCritical: number;
  toleranceHeadroom: number;
  swarmDiversity: number;
  meanSphere: number;
};

/** Mean sphere distance of agents the referee is allowed to pick. The probe is excluded unless it competes. */
function eligibleSphereMean(
  distances: readonly number[],
  probe: readonly boolean[],
  inversionCompetes: boolean,
): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < distances.length; i++) {
    if (!inversionCompetes && probe[i]) continue;
    sum += distances[i];
    n += 1;
  }
  return n === 0 ? 0 : sum / n;
}

/** Master protocol: noise 0.10→4.02, env 0.20→1.50, 50 iterations, one ontology. */
export function run50IterationStressTest(
  seed = 42,
  groundTruthMode: GroundTruthMode = "uniform",
): { records: StressRecord[]; chainIntact: boolean } {
  const params: RunParams = {
    ...DEFAULT_RUN,
    seed,
    tolerance: 0.25,
    groundTruthMode,
    envStress: 0.2,
    noiseLevel: 0.1,
    internalStress: 0,
  };
  const adapter = openAdapter(params);
  const groundTruth = groundTruthMode === "calm" ? groundTruthFromScenario(adapter, CALM) : undefined;
  const cfg = createUPOConfig({
    seed,
    tolerance: 0.25,
    debug: false,
    groundTruth,
    actionMinMargin: null,
  });
  const upo = new UnifiedProcessOntology(cfg, logicalClock("2026-06-01T00:00:00.000Z"));
  const records: StressRecord[] = [];

  for (let it = 0; it < 50; it++) {
    const noise = Math.round((0.1 + it * 0.08) * 10000) / 10000;
    const envStress = Math.round(Math.min(1.5, 0.2 + it * 0.03) * 10000) / 10000;
    const raw = DeterministicSensorSynthesizer.synthesize(envStress, noise, seed + it);
    const inputs = adapter.ingest(raw.visual, raw.auditory, raw.imu);
    const internal = Math.min(1.5, noise * 0.25);
    const m = upo.perceiveAndExecuteDetailed(inputs, internal, envStress, adapter);
    records.push({
      iteration: it,
      noiseLevel: noise,
      simulatedEnvironmentStress: envStress,
      activeThreshold: m.activeThreshold,
      swarmPanicInterventions: m.interventions,
      winnerAgent: m.winnerIndex,
      distPreCollapse: m.distPreCollapse,
      distPostCollapse: m.distPostCollapse,
      stabilityProxy: m.stabilityProxy,
      winnerPreConfidence: m.preConfidences[m.winnerIndex],
      systemConfidencePostReferee: m.finalState.confidence,
      decodedAction: m.decodedAction,
      actionMargin: m.actionMargin,
      degenerate: m.degenerate,
      internalStress: internal,
      chainIntact: upo.manifold.verifyChainIntegrity(),
      toleranceCritical: m.toleranceCritical,
      toleranceHeadroom: m.toleranceHeadroom,
      swarmDiversity: m.swarmDiversity,
      meanSphere: eligibleSphereMean(m.sphereDistances, m.inversionProbe, cfg.inversionCompetes),
    });
  }
  return { records, chainIntact: upo.manifold.verifyChainIntegrity() };
}

export const MULTI_SEEDS = [42, 101, 2026, 7777, 99999] as const;

export type MultiSeedRow = {
  seed: number;
  winner: number;
  distPre: number;
  distPost: number;
  proxy: number;
  confidence: number;
  inversion: number;
  action: string;
  cosine: number;
  chainIntact: boolean;
};

export function runMultiSeed(base: RunParams, seeds: readonly number[] = MULTI_SEEDS): MultiSeedRow[] {
  return seeds.map((seed) => {
    const run = executeSingle({ ...base, seed, clock: logicalClock(`2026-03-01T00:00:00.000Z`) });
    const m = run.metrics;
    return {
      seed,
      winner: m.winnerIndex,
      distPre: m.distPreCollapse,
      distPost: m.distPostCollapse,
      proxy: m.stabilityProxy,
      confidence: m.finalState.confidence,
      inversion: m.inversionMetric,
      action: m.decodedAction,
      cosine: m.actionCosineSimilarity,
      chainIntact: run.chainIntact,
    };
  });
}

export type DampingRow = {
  damping: number;
  increment: number;
  interventions: number;
  winner: number;
  confidence: number;
  proxy: number;
  action: string;
};

const DAMP_GRID = [0.7, 0.8, 0.9] as const;
const INC_GRID = [0.03, 0.05, 0.08] as const;

/** Chapter 8.4 at the master operating point, not the live slider, unless base overrides env/noise. */
export function runDampingStudy(base: RunParams = DEFAULT_RUN): DampingRow[] {
  const rows: DampingRow[] = [];
  for (const damping of DAMP_GRID) {
    for (const increment of INC_GRID) {
      const run = executeSingle({
        ...base,
        seed: 42,
        dampingFactor: damping,
        stressIncrement: increment,
        tolerance: 0.25,
        clock: logicalClock("2026-04-01T00:00:00.000Z"),
      });
      const m = run.metrics;
      rows.push({
        damping,
        increment,
        interventions: m.interventions,
        winner: m.winnerIndex,
        confidence: m.finalState.confidence,
        proxy: m.stabilityProxy,
        action: m.decodedAction,
      });
    }
  }
  return rows;
}

export function stressCsv(records: readonly StressRecord[], headerLine?: string): string {
  const header = headerLine
    ? headerLine.split(",")
    : [
    "Iteration",
    "Noise_Level",
    "Simulated_Environment_Stress",
    "Internal_Stress",
    "Active_Threshold",
    "Swarm_Panic_Interventions",
    "Winner_Agent",
    "Dist_Pre_Collapse",
    "Dist_Post_Collapse",
    "Stability_Proxy",
    "Winner_Pre_Confidence",
    "System_Confidence_Post_Referee",
    "Decoded_Action",
    "Margin",
    "Degenerate",
    "TolCrit",
    "Headroom",
    "SwarmDiversity",
  ];
  const lines = [header.join(",")];
  for (const r of records) {
    lines.push([
      r.iteration,
      r.noiseLevel.toFixed(4),
      r.simulatedEnvironmentStress.toFixed(4),
      r.internalStress.toFixed(4),
      r.activeThreshold.toFixed(2),
      r.swarmPanicInterventions,
      r.winnerAgent,
      r.distPreCollapse.toFixed(6),
      r.distPostCollapse.toFixed(6),
      r.stabilityProxy.toFixed(6),
      r.winnerPreConfidence.toFixed(6),
      r.systemConfidencePostReferee.toFixed(6),
      r.decodedAction,
      r.actionMargin.toFixed(6),
      r.degenerate,
      r.toleranceCritical.toFixed(6),
      r.toleranceHeadroom.toFixed(6),
      r.swarmDiversity.toFixed(6),
    ].join(","));
  }
  return lines.join("\n") + "\n";
}

export function agentCsv(run: SingleRun, headerLine = "Agent,Damped,Stress,d_pre,d_sphere,Pre_Conf,Post_Conf,Probe,Winner"): string {
  const m = run.metrics;
  const lines = [headerLine];
  for (let i = 0; i < m.dampedFlags.length; i++) {
    lines.push([
      i,
      m.dampedFlags[i],
      m.agentStress[i].toFixed(4),
      m.agentDistances[i].toFixed(6),
      m.sphereDistances[i].toFixed(6),
      m.preConfidences[i].toFixed(6),
      m.postConfidences[i].toFixed(6),
      m.inversionProbe[i],
      i === m.winnerIndex,
    ].join(","));
  }
  return lines.join("\n") + "\n";
}

export const EXPORT_SCHEMA = "upo-run-1";
export const RNG_ID = "xoshiro128**/SplitMix32";

export function runJson(run: SingleRun): string {
  const m = run.metrics;
  return JSON.stringify(
    {
      schemaVersion: EXPORT_SCHEMA,
      kernelVersion: KERNEL_VERSION,
      notes: KERNEL_NOTES.map((note) => note.id),
      rng: RNG_ID,
      params: run.params,
      config: run.config,
      chainIntact: run.chainIntact,
      orthogonality: run.orthogonality,
      agents: m.agentStress.map((_, i) => ({
        index: i,
        stress: m.agentStress[i],
        pre: m.preConfidences[i],
        post: m.postConfidences[i],
        dPre: m.agentDistances[i],
        sphereDist: m.sphereDistances[i],
        isInversionProbe: m.inversionProbe[i],
        damped: m.dampedFlags[i],
      })),
      metrics: {
        winnerIndex: m.winnerIndex,
        tieCount: m.tieCount,
        degenerate: m.degenerate,
        distPreCollapse: m.distPreCollapse,
        distPostCollapse: m.distPostCollapse,
        stabilityProxy: m.stabilityProxy,
        inversionMetric: m.inversionMetric,
        activeThreshold: m.activeThreshold,
        interventions: m.interventions,
        triageWeights: m.triageWeights,
        preConfidences: m.preConfidences,
        postConfidences: m.postConfidences,
        agentDistances: m.agentDistances,
        sphereDistances: m.sphereDistances,
        dampedFlags: m.dampedFlags,
        agentStress: m.agentStress,
        inversionProbe: m.inversionProbe,
        decodedAction: m.decodedAction,
        actionCosineSimilarity: m.actionCosineSimilarity,
        actionMargin: m.actionMargin,
        actionRunnerUp: m.actionRunnerUp,
        actionMinMargin: m.actionMinMargin,
        actionMarginQuantile: m.actionMarginQuantile,
        actionNullRate: m.actionNullRate,
        toleranceCritical: m.toleranceCritical,
        toleranceHeadroom: m.toleranceHeadroom,
        swarmDiversity: m.swarmDiversity,
        confidence: m.finalState.confidence,
        lineage: m.finalState.lineage,
        finalVector: m.finalState.vector,
      },
      groundTruthMode: run.params.groundTruthMode ?? "uniform",
      scenario: (run.params.groundTruthMode ?? "uniform") === "calm" ? (run.params.scenario ?? CALM) : null,
      headHash: run.log.length === 0 ? "" : entryHash(run.log[run.log.length - 1]),
    },
    null,
    2,
  );
}

const MAX_JSON_BYTES = 1_000_000;
const PARAM_KEYS = [
  "envStress",
  "internalStress",
  "noiseLevel",
  "dampingFactor",
  "tolerance",
  "stressIncrement",
  "seed",
  "numAgents",
  "enableInertiaInversion",
  "inversionCompetes",
  "noiseScale",
  "actionMinMargin",
  "actionMarginQuantile",
  "groundTruthMode",
  "maxLogSize",
  "logicalOrigin",
] as const;

export function reproduceExportedRun(json: string): { ok: boolean; detail: string } {
  if (typeof json !== "string") return { ok: false, detail: "invalid json" };
  if (json.length > MAX_JSON_BYTES) return { ok: false, detail: "too large" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, detail: "invalid json" };
  }
  try {
    if (!parsed || typeof parsed !== "object") return { ok: false, detail: "schema violation" };
    const body = parsed as {
      schemaVersion?: unknown;
      headHash?: unknown;
      params?: unknown;
      metrics?: unknown;
    };
    if (body.schemaVersion !== EXPORT_SCHEMA) {
      return { ok: false, detail: `schema ${typeof body.schemaVersion === "string" ? body.schemaVersion : "missing"}` };
    }
    if (!body.metrics || typeof body.metrics !== "object" || !body.params || typeof body.params !== "object") {
      return { ok: false, detail: "schema violation" };
    }
    const rawParams = body.params as Record<string, unknown>;
    const metrics = body.metrics as Record<string, unknown>;
    const numAgents = rawParams.numAgents;
    if (typeof numAgents !== "number" || !Number.isInteger(numAgents)) {
      return { ok: false, detail: "schema violation" };
    }
    if (!Array.isArray(metrics.postConfidences) || metrics.postConfidences.length !== numAgents) {
      return { ok: false, detail: "schema violation" };
    }
    const picked: Record<string, unknown> = {};
    for (const key of PARAM_KEYS) {
      if (rawParams[key] !== undefined) picked[key] = rawParams[key];
    }
    const params = { ...DEFAULT_RUN, ...picked } as RunParams;
    if (rawParams.scenario && typeof rawParams.scenario === "object") {
      params.scenario = rawParams.scenario as Scenario;
    }
    if (params.groundTruthMode !== "uniform" && params.groundTruthMode !== "calm") {
      return { ok: false, detail: "schema violation" };
    }
    const origin = typeof params.logicalOrigin === "string" ? params.logicalOrigin : null;
    const again = executeSingle({
      ...params,
      clock: logicalClock(origin ?? "2026-05-01T00:00:00.000Z"),
    });
    const m = again.metrics;
    const post = metrics.postConfidences as unknown[];
    const confOk = m.postConfidences.every((c, i) => typeof post[i] === "number" && Math.abs(c - (post[i] as number)) < 1e-9);
    const num = (key: string) => metrics[key];
    const sameNum = (key: string, value: number) => typeof num(key) === "number" && Math.abs(value - (num(key) as number)) < 1e-9;
    let ok =
      m.winnerIndex === metrics.winnerIndex &&
      m.degenerate === metrics.degenerate &&
      m.decodedAction === metrics.decodedAction &&
      m.tieCount === metrics.tieCount &&
      sameNum("actionMargin", m.actionMargin) &&
      sameNum("distPostCollapse", m.distPostCollapse) &&
      confOk;
    let hashOk = true;
    if (origin) {
      const againHash = again.log.length === 0 ? "" : entryHash(again.log[again.log.length - 1]);
      hashOk = againHash === body.headHash;
    }
    const matched = ok && hashOk;
    return {
      ok: matched,
      detail: matched
        ? "match"
        : !hashOk
          ? "head hash"
          : `winner ${String(metrics.winnerIndex)}->${m.winnerIndex} action ${String(metrics.decodedAction)}->${m.decodedAction} deg ${String(metrics.degenerate)}->${m.degenerate}`,
    };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "schema violation" };
  }
}
