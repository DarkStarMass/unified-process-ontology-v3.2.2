import { SensorySemanticAdapter } from "./adapter";
import { createUPOConfig } from "./config";
import { logicalClock } from "./manifold";
import { l2 } from "./math";
import { UnifiedProcessOntology } from "./ontology";
import { DeterministicSensorSynthesizer } from "./sensors";

export type DiagnosticCheck = {
  id: number;
  name: string;
  ok: boolean;
  detail: string;
  facts?: Record<string, string | number>;
};

export type DiagnosticReport = {
  ok: boolean;
  checks: DiagnosticCheck[];
};

function check(
  id: number,
  name: string,
  ok: boolean,
  detail: string,
  facts?: Record<string, string | number>,
): DiagnosticCheck {
  return { id, name, ok, detail, facts };
}

/**
 * The eight master checks from UPO v3.3.0, plus the chain anchor from correction C4.
 * A failed check is recorded; later checks still run unless the pipeline itself throws.
 */
export function runAllChecks(): DiagnosticReport {
  const checks: DiagnosticCheck[] = [];
  const cfg = createUPOConfig({ seed: 42, maxLogSize: 25, debug: false });
  const clock = logicalClock();
  const upo = new UnifiedProcessOntology(cfg, clock);
  const adapter = new SensorySemanticAdapter(cfg.latentDim, cfg.seed, cfg.actionMinMargin);
  const raw = DeterministicSensorSynthesizer.synthesize(0.32, 0.42, 42);
  const inputs = adapter.ingest(raw.visual, raw.auditory, raw.imu);

  try {
    const gtNorm = l2(cfg.groundTruth);
    let sphereOk = Math.abs(gtNorm - 1) < 1e-9;
    const norms: string[] = [];
    for (const [sense, channel] of Object.entries(inputs)) {
      const n = l2(channel.vector);
      norms.push(`${sense}=${n.toFixed(12)}`);
      if (Math.abs(n - 1) >= 1e-9) sphereOk = false;
    }
    checks.push(check(
      1,
      "Einheitssphäre",
      sphereOk,
      sphereOk
        ? `Ground Truth und Embeddings auf S^${cfg.latentDim - 1} (||v||₂ = 1).`
        : `Normfehler GT=${gtNorm} ${norms.join(" ")}`,
      sphereOk ? { dim: cfg.latentDim - 1 } : undefined,
    ));
  } catch (err) {
    checks.push(check(1, "Einheitssphäre", false, err instanceof Error ? err.message : String(err)));
  }

  try {
    const base = upo.regulator.evaluateEnvironment(0.25);
    const emergency = upo.regulator.evaluateEnvironment(0.32);
    const ok = base === cfg.baseStressThreshold && emergency === cfg.emergencyStressThreshold;
    checks.push(check(
      2,
      "Allostase",
      ok,
      ok
        ? `env 0.25 → ${base.toFixed(2)}, env 0.32 → ${emergency.toFixed(2)}.`
        : `Schwellen falsch: ${base}, ${emergency}`,
      ok ? { base: base.toFixed(2), emergency: emergency.toFixed(2) } : undefined,
    ));
  } catch (err) {
    checks.push(check(2, "Allostase", false, err instanceof Error ? err.message : String(err)));
  }

  let firstMetrics: ReturnType<UnifiedProcessOntology["perceiveAndExecuteDetailed"]> | null = null;
  try {
    firstMetrics = upo.perceiveAndExecuteDetailed(inputs, 0.42, 0.32, adapter);
    const finalNorm = l2(firstMetrics.finalState.vector);
    const confOk = firstMetrics.finalState.confidence === firstMetrics.postConfidences[firstMetrics.winnerIndex];
    const ok = Math.abs(finalNorm - 1) < 1e-9 && confOk;
    checks.push(check(
      3,
      "L2-Collapse",
      ok,
      ok
        ? `||v_final||₂ = 1 und Konfidenz invariant (${firstMetrics.finalState.confidence.toFixed(6)}).`
        : `norm=${finalNorm} confOk=${confOk}`,
      ok ? { conf: firstMetrics.finalState.confidence.toFixed(6) } : undefined,
    ));
  } catch (err) {
    checks.push(check(3, "L2-Collapse", false, err instanceof Error ? err.message : String(err)));
  }

  try {
    const inv = firstMetrics?.inversionMetric ?? Number.NaN;
    const ok = inv < -0.99;
    checks.push(check(
      4,
      "Inertia-Inversion",
      ok,
      ok ? `cos(v₀, v_base) = ${inv.toFixed(6)}.` : `Inversion fehlgeschlagen: cos=${inv}`,
      Number.isFinite(inv) ? { inv: inv.toFixed(6) } : undefined,
    ));
  } catch (err) {
    checks.push(check(4, "Inertia-Inversion", false, err instanceof Error ? err.message : String(err)));
  }

  try {
    for (let i = 0; i < 3; i++) upo.perceiveAndExecuteDetailed(inputs, 0.42, 0.32, adapter);
    const capped = upo.manifold.size === cfg.maxLogSize;
    const intact = upo.manifold.verifyChainIntegrity();
    checks.push(check(
      5,
      "Ringpuffer und SHA-256",
      capped && intact,
      capped && intact
        ? `maxlen=${cfg.maxLogSize}, Anker und Head-Hash intakt.`
        : `size=${upo.manifold.size} intact=${intact}`,
      capped && intact ? { maxlen: cfg.maxLogSize } : undefined,
    ));
  } catch (err) {
    checks.push(check(5, "Ringpuffer und SHA-256", false, err instanceof Error ? err.message : String(err)));
  }

  try {
    const stats = adapter.computeOrthogonalityStats();
    const bound = adapter.boundActions.length;
    const ok = bound === 3 && stats.max < 0.95 && Number.isFinite(stats.min);
    checks.push(check(
      6,
      "Aktionsraum",
      ok,
      ok
        ? `gebunden=${bound}, cos min=${stats.min.toFixed(3)} max=${stats.max.toFixed(3)} mean=${stats.mean.toFixed(4)}.`
        : `Aktionsraum nicht belegt: gebunden=${bound} max=${stats.max}`,
      { min: stats.min.toFixed(3), max: stats.max.toFixed(3), mean: stats.mean.toFixed(4), bound },
    ));
  } catch (err) {
    checks.push(check(6, "Aktionsraum", false, err instanceof Error ? err.message : String(err)));
  }

  try {
    const upo2 = new UnifiedProcessOntology(cfg, logicalClock());
    const adapter2 = new SensorySemanticAdapter(cfg.latentDim, cfg.seed, cfg.actionMinMargin);
    const inputs2 = adapter2.ingest(raw.visual, raw.auditory, raw.imu);
    const metrics2 = upo2.perceiveAndExecuteDetailed(inputs2, 0.42, 0.32, adapter2);
    const distOk = firstMetrics !== null && firstMetrics.distPostCollapse === metrics2.distPostCollapse;
    const actOk = firstMetrics !== null && firstMetrics.decodedAction === metrics2.decodedAction;
    checks.push(check(
      7,
      "Determinismus",
      distOk && actOk,
      distOk && actOk
        ? `Zweiter Lauf identisch (d_post=${metrics2.distPostCollapse.toFixed(6)}, ${metrics2.decodedAction}).`
        : `Abweichung d_post ${firstMetrics?.distPostCollapse} vs ${metrics2.distPostCollapse}, action ${firstMetrics?.decodedAction} vs ${metrics2.decodedAction}`,
      distOk && actOk
        ? { dPost: metrics2.distPostCollapse.toFixed(6), action: metrics2.decodedAction }
        : undefined,
    ));
  } catch (err) {
    checks.push(check(7, "Determinismus", false, err instanceof Error ? err.message : String(err)));
  }

  try {
    let caught = false;
    try {
      adapter.embedHaptic(new Float64Array([1, 2]));
    } catch (err) {
      caught = err instanceof Error;
    }
    checks.push(check(
      8,
      "Fail-Fast Dimension",
      caught,
      caught ? "IMU-Shape (2,) wirft ValueError-äquivalent." : "Ungültige IMU-Dimension wurde akzeptiert.",
      caught ? {} : undefined,
    ));
  } catch (err) {
    checks.push(check(8, "Fail-Fast Dimension", false, err instanceof Error ? err.message : String(err)));
  }

  return { ok: checks.every((c) => c.ok), checks };
}
