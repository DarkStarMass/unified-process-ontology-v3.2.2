export { KERNEL_NOTES, KERNEL_VERSION } from "./assumptions";
export { SensorySemanticAdapter } from "./adapter";
export { createUPOConfig } from "./config";
export { runAllChecks } from "./diagnostics";
export type { DiagnosticCheck, DiagnosticReport } from "./diagnostics";
export { logicalClock, utcNow } from "./manifold";
export { UnifiedProcessOntology } from "./ontology";
export { DeterministicSensorSynthesizer } from "./sensors";
export {
  DEFAULT_RUN,
  MULTI_SEEDS,
  agentCsv,
  executeSingle,
  reproduceExportedRun,
  run50IterationStressTest,
  runDampingStudy,
  runJson,
  runMultiSeed,
  stressCsv,
} from "./studies";
export type { DampingRow, MultiSeedRow, RunParams, SingleRun, StressRecord } from "./studies";
export { ACTION_NAMES, LayerType, MODALITY_PRIORS } from "./types";
export type { ExecutionMetrics } from "./types";
