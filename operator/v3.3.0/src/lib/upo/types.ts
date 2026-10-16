export const LayerType = {
  SALIENCE: "salience",
  GENESIS: "genesis",
  REFLECTION: "reflection",
  PARASYMPATHETIC: "parasympathetic",
  ALIGNMENT: "alignment",
  COGNITIVE: "cognitive",
} as const;

export type LayerTypeName = (typeof LayerType)[keyof typeof LayerType];

export type UPOConfig = {
  numAgents: number;
  baseStressThreshold: number;
  emergencyStressThreshold: number;
  stressActivationLimit: number;
  dampingFactor: number;
  stressIncrement: number;
  tolerance: number;
  latentDim: number;
  groundTruth: readonly number[];
  seed: number;
  maxLogSize: number;
  enableInertiaInversion: boolean;
  /** When false, an inertia-inverted agent 0 is a probe and cannot win. Correction C6. */
  inversionCompetes: boolean;
  /** Multiplier on dimension-scaled swarm noise. Correction C10. Default 1. */
  noiseScale: number;
  /** Minimum cosine gap required to name an action. Null means the adapter calibrates it. Correction C16. */
  actionMinMargin: number | null;
  /** Quantile of the null margin used when actionMinMargin is null. Correction C16. */
  actionMarginQuantile: number;
  debug: boolean;
};

export type AccessLogEntry = {
  timestamp: string;
  actor: string;
  action: string;
  targetStateHash: string;
  prevHash: string;
};

export type State = {
  vector: number[];
  lineage: string;
  confidence: number;
  /** Agent 0 under inertia inversion. Visible, but excluded from the decision unless inversionCompetes. */
  isInversionProbe?: boolean;
};

export type ModalChannel = {
  vector: number[];
  /** ||Wx+b|| before unit projection. Correction C1. */
  energy: number;
};

export type ExecutionMetrics = {
  finalState: State;
  winnerIndex: number;
  distPreCollapse: number;
  distPostCollapse: number;
  stabilityProxy: number;
  inversionMetric: number;
  activeThreshold: number;
  interventions: number;
  triageWeights: Record<string, number>;
  preConfidences: number[];
  postConfidences: number[];
  agentDistances: number[];
  /** Euclidean distance of the unit direction to ground truth. Correction C7. */
  sphereDistances: number[];
  dampedFlags: boolean[];
  /** Operative stress used for each agent after damping, before the increment. */
  agentStress: number[];
  /** True for the inertia probe (agent 0 when inversion is on). */
  inversionProbe: boolean[];
  /** Best eligible confidence is <= 0. Correction C6. */
  degenerate: boolean;
  /** Eligible agents sharing the winning confidence and sphere distance. */
  tieCount: number;
  /** Tolerance at which every eligible confidence becomes 0. Correction C15. */
  toleranceCritical: number;
  /** toleranceCritical minus the configured tolerance. Negative means already degenerate. */
  toleranceHeadroom: number;
  /** 1 minus the mean pairwise cosine of non-probe agents. Correction C18. */
  swarmDiversity: number;
  decodedAction: string;
  actionCosineSimilarity: number;
  actionMargin: number;
  actionRunnerUp: string;
  /** Threshold actually used by the decoder. Resolved even when config stores null. */
  actionMinMargin: number;
  actionMarginQuantile: number;
  /** Share of the calibration sample whose margin is at least the threshold. */
  actionNullRate: number;
};

export type Clock = () => string;

export const ACTION_NAMES = [
  "PROMPT_LLM_CAUTION",
  "MOTOR_STOP_IMMEDIATELY",
  "MOTOR_PROCEED_GENTLY",
  "MOTOR_TURN_LEFT",
  "MOTOR_TURN_RIGHT",
  "ACTIVATE_WARNING_LIGHTS",
  "SYSTEM_RECALIBRATE",
  "EXTERNAL_OVERRIDE_EMERGENCY",
  "EXTERNAL_NAVIGATE_HOME",
] as const;

export type ActionName = (typeof ACTION_NAMES)[number];

export const MODALITY_PRIORS: Record<string, number> = {
  visual: 1.0,
  auditory: 0.8,
  haptic: 1.2,
};

export const GENESIS_ANCHOR = "0x0_genesis";
