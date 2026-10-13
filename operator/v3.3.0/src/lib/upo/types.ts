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
  dampedFlags: boolean[];
  /** Operative stress used for each agent after damping, before the increment. */
  agentStress: number[];
  decodedAction: string;
  actionCosineSimilarity: number;
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
