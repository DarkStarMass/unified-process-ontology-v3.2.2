import { SensorySemanticAdapter } from "./adapter";
import { createUPOConfig } from "./config";
import { runAllChecks } from "./diagnostics";
import { entryHash, logicalClock, MemoryManifold } from "./manifold";
import { buildUnitGroundTruth, cosine, dot, euclidean, l2, linspace, normalize, softmax, topologyPoint } from "./math";
import { UnifiedProcessOntology } from "./ontology";
import { HostileReferees } from "./referees";
import { DynamicStressRegulator } from "./regulator";
import { STREAM_CALIB, SeededRng, streamSeed } from "./rng";
import { CALM, ACTION_BINDINGS, groundTruthFromScenario } from "./scenario";
import { DeterministicSensorSynthesizer, residualStd } from "./sensors";
import { sha256Hex } from "./sha256";
import { DEFAULT_RUN, executeSingle, reproduceExportedRun, run50IterationStressTest, runDampingStudy, runJson, runMultiSeed, stressCsv, stressCsvName, EXPORT_SCHEMA } from "./studies";
import type { RunParams } from "./studies";
import { ParasympatheticSwarm, swarmDiversity } from "./swarm";
import { ContextRevisor, SensoryTriageAgent } from "./triage";
import { ACTION_NAMES, GENESIS_ANCHOR, MODALITY_PRIORS } from "./types";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function block1(): void {
  assert(
    sha256Hex("") === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "sha256 empty",
  );
  assert(
    sha256Hex("abc") === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "sha256 abc",
  );

  const rng = SeededRng.fromState(1, 2, 3, 4);
  const first = rng.nextUint32();
  assert(first === 11520, `xoshiro state(1,2,3,4) first word expected 11520, got ${first}`);

  const a = new SeededRng(streamSeed(42, 1));
  const b = new SeededRng(streamSeed(42, 1));
  const c = new SeededRng(streamSeed(42, 2));
  const seqA = [a.nextFloat(), a.normal(), a.uniform(-0.1, 0.1)];
  const seqB = [b.nextFloat(), b.normal(), b.uniform(-0.1, 0.1)];
  assert(seqA.every((v, i) => v === seqB[i]), "same stream seed must be bit-identical");
  assert(seqA[0] !== c.nextFloat(), "distinct streams must diverge");

  let mean = 0;
  let m2 = 0;
  const g = new SeededRng(7);
  const n = 4000;
  for (let i = 0; i < n; i++) {
    const z = g.normal();
    mean += z;
    m2 += z * z;
  }
  mean /= n;
  const variance = m2 / n - mean * mean;
  assert(Math.abs(mean) < 0.08, `normal mean ${mean}`);
  assert(Math.abs(variance - 1) < 0.12, `normal variance ${variance}`);

  const gt = buildUnitGroundTruth(512);
  assert(Math.abs(l2(gt) - 1) < 1e-12, "ground truth norm");
  assert(gt.every((v) => v === gt[0]), "ground truth is constant");
  const phase = linspace(0.1, 1.0, 16);
  assert(phase[0] === 0.1 && Math.abs(phase[15] - 1) < 1e-12, "linspace endpoints");
  assert(Math.abs(phase[1] - (0.1 + 0.9 / 15)) < 1e-12, "linspace step");

  const sm = softmax([1, 0.8, 1.2]);
  assert(Math.abs(sm.reduce((s, x) => s + x, 0) - 1) < 1e-12, "softmax sums to 1");
  assert(sm[2] > sm[0] && sm[0] > sm[1], "softmax order");

  const p = topologyPoint(0, 20, 0.25, 1.35);
  assert(Math.abs(p.x - (0 - 9.5) * 0.85) < 1e-12, "topology x for n=20");
  assert(p.y === 0 && p.z === 0, "topology origin at reference post/dPre");

  const cfg = createUPOConfig();
  assert(cfg.latentDim === 512 && cfg.groundTruth.length === 512, "default dim");
  assert(Math.abs(cosine(cfg.groundTruth, cfg.groundTruth) - 1) < 1e-12, "gt cosine");

  let threw = false;
  try {
    createUPOConfig({ dampingFactor: 1 });
  } catch {
    threw = true;
  }
  assert(threw, "dampingFactor = 1 must throw");

  threw = false;
  try {
    createUPOConfig({ tolerance: -0.01 });
  } catch {
    threw = true;
  }
  assert(threw, "negative tolerance must throw");

  threw = false;
  try {
    createUPOConfig({ numAgents: 1, enableInertiaInversion: true, inversionCompetes: false });
  } catch {
    threw = true;
  }
  assert(threw, "probe excluded with a single agent must throw");

  threw = false;
  try {
    createUPOConfig({ latentDim: 4, groundTruth: [1, 0, 0, 0] });
  } catch {
    threw = true;
  }
  assert(!threw, "explicit unit ground truth of matching dim must be accepted");

  const small = createUPOConfig({ latentDim: 4 });
  assert(small.groundTruth.length === 4 && Math.abs(l2(small.groundTruth) - 1) < 1e-12, "dim-4 gt");

  threw = false;
  try {
    createUPOConfig({ groundTruth: [0.2, 0.3] });
  } catch {
    threw = true;
  }
  assert(threw, "non-unit ground truth must throw");

  console.log("[OK] Block 1: SHA-256, xoshiro128**, Box-Muller, S^(d-1), Softmax, Config fail-fast.");
}

function block2(): void {
  const cfg = createUPOConfig({ seed: 42, maxLogSize: 4, latentDim: 4, numAgents: 8, tolerance: 0.3 });
  const manifold = new MemoryManifold(cfg, logicalClock());
  assert(manifold.verifyChainIntegrity(), "empty manifold is intact");

  const h0 = manifold.appendTransition("a", "one", [0.1, 0.2, 0.3, 0.4]);
  const h1 = manifold.appendTransition("b", "two", [0.2, 0.2, 0.2, 0.2]);
  assert(manifold.size === 2, "size after two appends");
  assert(manifold.entries()[1].prevHash === h0, "link 1 cites hash 0");
  assert(h1 === entryHash(manifold.entries()[1]), "returned hash is entry hash");
  assert(manifold.verifyChainIntegrity(), "chain of 2");
  assert(manifold.entries()[0].prevHash === GENESIS_ANCHOR, "genesis anchor");

  const live = manifold.entries();
  live[1].action = "tampered";
  assert(!manifold.verifyChainIntegrity(), "C4: tail tamper must fail verification");
  live[1].action = "two";
  assert(manifold.verifyChainIntegrity(), "restored tail verifies");

  live[0].prevHash = "forged";
  assert(!manifold.verifyChainIntegrity(), "C4: forged genesis edge must fail");
  live[0].prevHash = GENESIS_ANCHOR;
  assert(manifold.verifyChainIntegrity(), "restored genesis verifies");

  manifold.appendTransition("c", "three", [1, 0, 0, 0]);
  manifold.appendTransition("d", "four", [0, 1, 0, 0]);
  assert(manifold.size === 4, "full buffer");
  const beforeOverflow = entryHash(manifold.entries()[0]);
  manifold.appendTransition("e", "five", [0, 0, 1, 0]);
  assert(manifold.size === 4, "ring cap held");
  assert(manifold.entries()[0].actor === "b", "oldest dropped");
  assert(manifold.entries()[0].prevHash === beforeOverflow, "anchor is dropped hash");
  assert(manifold.verifyChainIntegrity(), "overflow suffix plus anchor verifies");
  manifold.entries()[0].prevHash = "forged-mid";
  assert(!manifold.verifyChainIntegrity(), "forged retained edge fails");

  const reg = new DynamicStressRegulator(createUPOConfig());
  assert(reg.evaluateEnvironment(0.25) === 0.85, "base threshold");
  assert(reg.evaluateEnvironment(0.3) === 0.5, "emergency at exactly 0.30");
  assert(reg.evaluateEnvironment(0.299999) === 0.85, "just below activation stays base");

  const swarmCfg = createUPOConfig({
    seed: 1,
    numAgents: 8,
    latentDim: 4,
    dampingFactor: 0.8,
    stressIncrement: 0.05,
    enableInertiaInversion: true,
    maxLogSize: 64,
  });
  const swarmManifold = new MemoryManifold(swarmCfg, logicalClock());
  const base = [0.2, 0.2, 0.2, 0.2];
  const swarm = new ParasympatheticSwarm(swarmCfg);
  const result = swarm.generateAndDampen(base, 0.42, 0.5, swarmManifold);
  const expectFlags = [false, false, true, false, true, false, true, false];
  assert(
    result.dampedFlags.every((f, i) => f === expectFlags[i]),
    `damping schedule ${result.dampedFlags.join(",")} != ${expectFlags.join(",")}`,
  );
  assert(result.interventions === 3, `interventions ${result.interventions}`);
  assert(result.inversionMetric < -0.999, `inversion ${result.inversionMetric}`);
  assert(Math.abs(cosine(result.paths[0].vector, base) + 1) < 1e-12, "agent 0 is exact negation");
  assert(swarmManifold.verifyChainIntegrity(), "swarm lineage intact");
  assert(result.agentStress[0] === 0.42, "agent 0 operative stress");
  assert(Math.abs(result.agentStress[2] - 0.416) < 1e-12, "agent 2 damped stress");

  const refs = new HostileReferees(
    createUPOConfig({ latentDim: 2, tolerance: 0.3, groundTruth: buildUnitGroundTruth(2) }),
  );
  const gt2 = buildUnitGroundTruth(2);
  const far = { vector: [-gt2[0], -gt2[1]], lineage: "x", confidence: 1 };
  const crit = refs.critique([far]);
  const expectedDist = euclidean(far.vector, gt2);
  assert(Math.abs(crit.distances[0] - expectedDist) < 1e-12, "referee distance");
  assert(Math.abs(expectedDist - 2) < 1e-9, "antipode on S^1 is distance 2");
  assert(crit.critiqued[0].confidence === Math.max(0, 1 - expectedDist * 0.3), "referee confidence");

  let mismatch = false;
  try {
    refs.critique([{ vector: [1, 0, 0], lineage: "", confidence: 1 }]);
  } catch {
    mismatch = true;
  }
  assert(mismatch, "referee dimension mismatch must throw");

  const triCfg = createUPOConfig({ latentDim: 2, maxLogSize: 8 });
  const triMan = new MemoryManifold(triCfg, logicalClock());
  const triage = new SensoryTriageAgent(new ContextRevisor(), triMan);
  const blind = triage.processOverload({
    visual: { vector: [1, 0], energy: 1 },
    auditory: { vector: [0, 1], energy: 1 },
    haptic: { vector: [0, 1], energy: 1 },
  });
  const prior = softmax([1, 0.8, 1.2].map((p) => p * Math.log1p(1)));
  assert(Math.abs(blind.weights.visual - prior[0]) < 1e-12, "equal energy recovers log1p-prior softmax");
  const energetic = triage.processOverload({
    visual: { vector: [1, 0], energy: 10 },
    auditory: { vector: [0, 1], energy: 0.01 },
    haptic: { vector: [0, 1], energy: 0.01 },
  });
  const energeticExpected = softmax([Math.log1p(10), 0.8 * Math.log1p(0.01), 1.2 * Math.log1p(0.01)]);
  assert(
    Math.abs(energetic.weights.visual - energeticExpected[0]) < 1e-12,
    `log1p visual weight ${energetic.weights.visual}`,
  );
  assert(energetic.weights.visual < 0.95, "C9 must not one-hot a finite energy gap");
  assert(energetic.weights.visual > energetic.weights.haptic, "larger energy still leads");
  assert(triMan.verifyChainIntegrity(), "triage lineage");

  let empty = false;
  try {
    triage.processOverload({});
  } catch {
    empty = true;
  }
  assert(empty, "empty triage throws");

  console.log("[OK] Block 2: Ring lineage C4, allostase, damping schedule, inversion, referees, energy salience.");
}

function block3(): void {
  const raw = DeterministicSensorSynthesizer.synthesize(0.32, 0.42, 42);
  assert(raw.visual.length === 16 && raw.auditory.length === 8 && raw.imu.length === 6, "sensor shapes");
  assert(raw.imu[0] === 9.81, "gravity component");
  const raw2 = DeterministicSensorSynthesizer.synthesize(0.32, 0.42, 42);
  assert(raw.visual.every((v, i) => v === raw2.visual[i]), "sensor synthesis is bit-stable");
  const louder = DeterministicSensorSynthesizer.synthesize(0.32, 1.5, 42);
  assert(louder.visual.some((v, i) => v !== raw.visual[i]), "noise level changes vision (C2)");
  assert(louder.imu[3] !== raw.imu[3], "noise level changes gyro");

  const cfg = createUPOConfig({ seed: 42, maxLogSize: 64, debug: false });
  const adapter = new SensorySemanticAdapter(cfg.latentDim, cfg.seed, cfg.actionMinMargin);
  const inputs = adapter.ingest(raw.visual, raw.auditory, raw.imu);
  for (const key of ["visual", "auditory", "haptic"]) {
    assert(Math.abs(l2(inputs[key].vector) - 1) < 1e-9, `${key} not unit`);
    assert(inputs[key].energy > 0, `${key} energy`);
  }

  const ortho = adapter.computeOrthogonalityStats();
  assert(adapter.boundActions.length === 3, `bound actions ${adapter.boundActions.length}`);
  assert(ortho.max < 0.95 && Number.isFinite(ortho.min), `bound prototypes max=${ortho.max}`);

  let bad = false;
  try {
    adapter.embedHaptic(new Float64Array([1, 2]));
  } catch (err) {
    bad = err instanceof Error && err.message.includes("shape (6,)");
  }
  assert(bad, "IMU shape fail-fast");

  const upo = new UnifiedProcessOntology(cfg, logicalClock());
  const metrics = upo.perceiveAndExecuteDetailed(inputs, 0.42, 0.32, adapter);
  assert(Math.abs(l2(metrics.finalState.vector) - 1) < 1e-9, "final norm");
  assert(
    metrics.finalState.confidence === metrics.postConfidences[metrics.winnerIndex],
    "confidence lost during L2 collapse",
  );
  assert(metrics.inversionMetric < -0.99, `inversion ${metrics.inversionMetric}`);
  assert(metrics.activeThreshold === 0.5, "env 0.32 selects emergency threshold");
  assert(
    metrics.decodedAction === "UNDECIDED" ||
      (ACTION_NAMES as readonly string[]).includes(metrics.decodedAction),
    metrics.decodedAction,
  );
  assert(Number.isFinite(metrics.actionMargin) && metrics.actionMargin >= 0, "action margin");
  assert(upo.manifold.verifyChainIntegrity(), "pipeline chain");
  assert(upo.manifold.size === cfg.numAgents + 5, `log size ${upo.manifold.size}`);

  const prior = softmax([1, 0.8, 1.2]);
  const weightDelta = Math.max(
    Math.abs(metrics.triageWeights.visual - prior[0]),
    Math.abs(metrics.triageWeights.auditory - prior[1]),
    Math.abs(metrics.triageWeights.haptic - prior[2]),
  );
  assert(weightDelta > 1e-3, `C1 delta=${weightDelta}`);

  const upoB = new UnifiedProcessOntology(cfg, logicalClock());
  const adapterB = new SensorySemanticAdapter(cfg.latentDim, cfg.seed, cfg.actionMinMargin);
  const metricsB = upoB.perceiveAndExecuteDetailed(
    adapterB.ingest(raw.visual, raw.auditory, raw.imu),
    0.42,
    0.32,
    adapterB,
  );
  assert(metrics.distPostCollapse === metricsB.distPostCollapse, "non-deterministic distance");
  assert(metrics.decodedAction === metricsB.decodedAction, "non-deterministic action");
  assert(metrics.finalState.lineage === metricsB.finalState.lineage, "logical clock lineage diverged");

  const zeroBase = createUPOConfig({
    latentDim: 4,
    numAgents: 1,
    enableInertiaInversion: true,
    inversionCompetes: true,
    maxLogSize: 16,
  });
  const zeroOnto = new UnifiedProcessOntology(zeroBase, logicalClock());
  let collapsed = false;
  try {
    zeroOnto.perceiveAndExecute({ only: { vector: [0, 0, 0, 0], energy: 1 } }, 0.1, 0.1);
  } catch (err) {
    collapsed = err instanceof Error && err.message.includes("zero L2");
  }
  assert(collapsed, "zero winner must fail in collapse");

  console.log("[OK] Block 3: Sensor shapes, sphere projection, action orthogonality, full 512D pipeline, determinism.");
}

function block4(): void {
  const report = runAllChecks();
  for (const c of report.checks) {
    if (!c.ok) throw new Error(`Diagnostic ${c.id} ${c.name} failed: ${c.detail}`);
  }
  assert(report.checks.length === 8, "eight master checks");
  assert(report.ok, "diagnostics aggregate");

  const stressA = run50IterationStressTest(42);
  const stressB = run50IterationStressTest(42);
  assert(stressA.records.length === 50, "50 iterations");
  assert(stressA.chainIntact && stressA.records.every((r) => r.chainIntact), "stress chain");
  assert(stressA.records[0].noiseLevel === 0.1, "noise start");
  assert(stressA.records[49].noiseLevel === 4.02, `noise end ${stressA.records[49].noiseLevel}`);
  assert(stressA.records[0].simulatedEnvironmentStress === 0.2, "env start");
  assert(stressA.records[0].activeThreshold === 0.85, "thr start");
  assert(stressA.records[3].activeThreshold === 0.85, "thr still base at it 3");
  assert(stressA.records[4].simulatedEnvironmentStress === 0.32, "env it 4");
  assert(stressA.records[4].activeThreshold === 0.5, "thr drop at it 4");
  assert(stressA.records[49].simulatedEnvironmentStress === 1.5, "env end");
  assert(stressA.records[49].activeThreshold === 0.5, "thr end");
  assert(
    stressA.records.every((r, i) => r.distPostCollapse === stressB.records[i].distPostCollapse && r.winnerAgent === stressB.records[i].winnerAgent),
    "stress test not reproducible",
  );
  assert(stressA.records.every((r) => r.stabilityProxy > 0 && r.stabilityProxy <= 1), "proxy range");

  const seeds = runMultiSeed(DEFAULT_RUN);
  assert(seeds.length === 5, "five seeds");
  assert(seeds.every((s) => s.chainIntact && s.inversion < -0.99), "multi-seed inversion/chain");
  const again = runMultiSeed(DEFAULT_RUN);
  assert(seeds.every((s, i) => s.distPost === again[i].distPost && s.action === again[i].action), "multi-seed drift");

  const grid = runDampingStudy(DEFAULT_RUN);
  assert(grid.length === 9, "3x3 damping grid");
  const counts = new Set(grid.map((r) => r.interventions));
  assert(counts.size > 1, `damping grid did not move interventions: ${[...counts].join(",")}`);
  assert(grid.every((r) => r.confidence >= 0 && r.confidence <= 1), "grid confidence range");

  console.log("[OK] Block 4: 8 diagnostics, 50-iteration stress, multi-seed, damping grid.");
  console.log("--- diagnostic detail ---");
  for (const c of report.checks) console.log(`  [${c.ok ? "OK" : "FAIL"}] ${c.id} ${c.name}: ${c.detail}`);
  console.log(
    `  stress it0 thr=${stressA.records[0].activeThreshold} int=${stressA.records[0].swarmPanicInterventions} conf=${stressA.records[0].systemConfidencePostReferee.toFixed(4)}`,
  );
  console.log(
    `  stress it4 thr=${stressA.records[4].activeThreshold} int=${stressA.records[4].swarmPanicInterventions} conf=${stressA.records[4].systemConfidencePostReferee.toFixed(4)}`,
  );
  console.log(
    `  stress it49 thr=${stressA.records[49].activeThreshold} int=${stressA.records[49].swarmPanicInterventions} conf=${stressA.records[49].systemConfidencePostReferee.toFixed(4)}`,
  );
}

function metricsOf(params: RunParams) {
  return executeSingle({ ...params, clock: logicalClock("2026-02-02T00:00:00.000Z") }).metrics;
}

function block5(): void {
  const tied = metricsOf({ ...DEFAULT_RUN, tolerance: 1, seed: 42 });
  assert(tied.postConfidences.every((c) => c === 0), `T1 confidences not all zero: ${tied.postConfidences[0]}`);
  assert(tied.inversionProbe[0] === true, "T1 agent 0 is the probe");
  assert(tied.winnerIndex !== 0, `T1 probe won, index ${tied.winnerIndex}`);
  assert(tied.degenerate === true, "T1 all-zero must be flagged");

  const stress = run50IterationStressTest(42);
  const probeWins = stress.records.filter((r) => r.winnerAgent === 0).length;
  assert(probeWins === 0, `T2 probe wins ${probeWins}/50`);
  let previousInternal = -1;
  for (const row of stress.records) {
    assert(row.internalStress > previousInternal, `T stress plateau at ${row.iteration}`);
    previousInternal = row.internalStress;
  }
  assert(stress.records[43].simulatedEnvironmentStress < 1.5, "env plateau starts later than it 43");
  assert(stress.records[44].simulatedEnvironmentStress === 1.5, "documented env cap at iteration 44");
  assert(stress.records[49].internalStress < 1.5, `internal end ${stress.records[49].internalStress}`);

  const refs = new HostileReferees(createUPOConfig({ latentDim: 8, tolerance: 0.4 }));
  const v = [0.2, -0.4, 0.1, 0.3, -0.2, 0.05, 0.2, -0.1];
  const scaleA = refs.critique([{ vector: v, lineage: "a", confidence: 0.8 }]).critiqued[0].confidence;
  const scaleB = refs.critique([{ vector: v.map((x) => 3 * x), lineage: "b", confidence: 0.8 }]).critiqued[0].confidence;
  assert(Math.abs(scaleA - scaleB) < 1e-12, `T3 ${scaleA} vs ${scaleB}`);
  const rawA = refs.critique([{ vector: v, lineage: "a", confidence: 0.8 }]).distances[0];
  const rawB = refs.critique([{ vector: v.map((x) => 3 * x), lineage: "b", confidence: 0.8 }]).distances[0];
  assert(Math.abs(rawA - rawB) > 1e-6, "T3 raw distance must still see the length");

  const haptic = new SensorySemanticAdapter(512, 42);
  const lowImu = DeterministicSensorSynthesizer.synthesize(0.2, 0.42, 42);
  const highImu = DeterministicSensorSynthesizer.synthesize(1.5, 0.42, 42);
  assert(lowImu.imu[0] === 9.81 && highImu.imu[0] === 9.81, "raw gravity preserved");
  const hapticCos = cosine(haptic.embedHaptic(lowImu.imu).vector, haptic.embedHaptic(highImu.imu).vector);
  assert(hapticCos < 0.95, `T4 haptic cosine ${hapticCos}`);

  const weightKeys = ["visual", "auditory", "haptic"] as const;
  let crossEnv = 0;
  const atLow = metricsOf({ ...DEFAULT_RUN, envStress: 0.2, seed: 42 });
  const atHigh = metricsOf({ ...DEFAULT_RUN, envStress: 1.5, seed: 42 });
  for (const env of [0.2, 0.8, 1.5]) {
    for (const seed of [42, 101, 2026]) {
      const row = metricsOf({ ...DEFAULT_RUN, envStress: env, seed });
      for (const key of weightKeys) {
        assert(row.triageWeights[key] <= 0.9, `T5 ${key}=${row.triageWeights[key]} env=${env} seed=${seed}`);
      }
    }
  }
  for (const key of weightKeys) {
    crossEnv = Math.max(crossEnv, Math.abs(atLow.triageWeights[key] - atHigh.triageWeights[key]));
  }
  assert(crossEnv > 0.01, `T5 env delta ${crossEnv}`);

  for (const stressValue of [0.25, 0.5, 1, 1.5]) {
    const cfg = createUPOConfig({
      seed: 42,
      numAgents: 20,
      latentDim: 512,
      stressIncrement: 0,
      noiseScale: 1,
      enableInertiaInversion: true,
      maxLogSize: 64,
    });
    const manifold = new MemoryManifold(cfg, logicalClock());
    const base = buildUnitGroundTruth(512);
    const swarm = new ParasympatheticSwarm(cfg).generateAndDampen(base, stressValue, 10, manifold);
    let sum = 0;
    let count = 0;
    for (const path of swarm.paths) {
      if (path.isInversionProbe) continue;
      sum += cosine(path.vector, base);
      count += 1;
    }
    const mean = sum / count;
    const expected = 1 / Math.sqrt(1 + stressValue * stressValue);
    assert(Math.abs(mean - expected) < 0.05, `T6 stress ${stressValue} mean ${mean} expected ${expected}`);
  }

  const undecided = new SensorySemanticAdapter(512, 42, 0.5).decodeDetailed(buildUnitGroundTruth(512));
  assert(undecided.margin < 0.5 && undecided.action === "UNDECIDED", `T7 ${undecided.action} margin ${undecided.margin}`);
  const named = new SensorySemanticAdapter(64, 7, 0.05);
  const prototype = Array.from(named.actionSpace.MOTOR_STOP_IMMEDIATELY);
  const decisive = named.decodeDetailed(prototype);
  assert(decisive.action === "MOTOR_STOP_IMMEDIATELY" && decisive.margin >= 0.05, `T7 named ${decisive.action} ${decisive.margin}`);

  for (const tolerance of [0, 0.25, 0.5, 0.75, 1, 1.5]) {
    for (const seed of [42, 101, 2026]) {
      const row = metricsOf({ ...DEFAULT_RUN, tolerance, seed });
      const eligible = row.postConfidences.filter((_, i) => !row.inversionProbe[i]);
      const allZero = eligible.every((c) => c <= 0);
      assert(row.degenerate === allZero, `T8 degenerate tol=${tolerance} seed=${seed} flag=${row.degenerate}`);
      if (row.inversionProbe[0]) assert(row.winnerIndex !== 0, `T8 probe won tol=${tolerance} seed=${seed}`);
      assert(Number.isFinite(row.distPostCollapse), "T8 finite distance");
    }
  }

  const off = metricsOf({ ...DEFAULT_RUN, enableInertiaInversion: false, tolerance: 1, seed: 42 });
  assert(off.inversionProbe.every((flag) => flag === false), "inversion off clears the probe");
  assert(off.degenerate === true, "tolerance 1 stays degenerate with inversion off");

  const exported = executeSingle({ ...DEFAULT_RUN, clock: logicalClock("2026-02-02T00:00:00.000Z") });
  const replay = reproduceExportedRun(runJson(exported));
  assert(replay.ok, `export replay ${replay.detail}`);

  console.log("[OK] Block 5: T1–T8, stress without internal plateau, JSON replay.");
  console.log(
    `  T4 haptic cos=${hapticCos.toFixed(4)} T5 envDelta=${crossEnv.toFixed(4)} T1 winner=A${tied.winnerIndex} degenerate=${tied.degenerate}`,
  );
}

function unitDraw(rng: SeededRng, dim: number): number[] {
  const raw = new Array<number>(dim);
  for (let i = 0; i < dim; i++) raw[i] = rng.normal();
  return normalize(raw);
}

function block6(): void {
  const standard = metricsOf(DEFAULT_RUN);
  assert(
    standard.toleranceCritical >= 0.55 && standard.toleranceCritical <= 0.6,
    `T11 standard crit ${standard.toleranceCritical}`,
  );
  for (let step = 0; step <= 30; step++) {
    const tolerance = (step * 1.5) / 30;
    const row = metricsOf({ ...DEFAULT_RUN, tolerance, seed: 42 });
    const predicted = tolerance >= row.toleranceCritical - 1e-9;
    assert(
      row.degenerate === predicted,
      `T11 tol=${tolerance} deg=${row.degenerate} crit=${row.toleranceCritical}`,
    );
  }

  const calibrated = new SensorySemanticAdapter(512, 42);
  assert(calibrated.minMargin > 0 && calibrated.minMargin < 0.5, `T10 threshold ${calibrated.minMargin}`);
  const fixed = metricsOf({ ...DEFAULT_RUN, actionMinMargin: 0.05 });
  const auto = metricsOf(DEFAULT_RUN);
  assert(fixed.winnerIndex === auto.winnerIndex, `T10 winner ${fixed.winnerIndex} vs ${auto.winnerIndex}`);
  assert(
    fixed.postConfidences.every((value, i) => value === auto.postConfidences[i]),
    "T10 confidences moved",
  );
  assert(fixed.distPostCollapse === auto.distPostCollapse, "T10 distance moved");
  const rng = new SeededRng(streamSeed(42, STREAM_CALIB));
  for (let i = 0; i < 4000; i++) unitDraw(rng, 512);
  let over = 0;
  let over05 = 0;
  const draws = 20000;
  for (let i = 0; i < draws; i++) {
    const margin = calibrated.marginOf(unitDraw(rng, 512));
    if (margin >= calibrated.minMargin) over += 1;
    if (margin >= 0.05) over05 += 1;
  }
  assert(over / draws <= 0.02, `T10 null rate ${over / draws}`);

  const calm = metricsOf({
    ...DEFAULT_RUN,
    envStress: CALM.env,
    noiseLevel: CALM.noise,
    internalStress: CALM.internal,
    seed: 42,
    tolerance: 0.25,
    groundTruthMode: "calm",
  });
  const eligible = calm.sphereDistances.filter((_, i) => !calm.inversionProbe[i]);
  const meanSphere = eligible.reduce((sum, value) => sum + value, 0) / eligible.length;
  assert(meanSphere < 0.6, `T9 mean sphere ${meanSphere}`);
  const calmStress = run50IterationStressTest(42, "calm");
  const proxies = calmStress.records.map((row) => row.stabilityProxy);
  const span = Math.max(...proxies) - Math.min(...proxies);
  assert(span > 0.3, `T9 proxy span ${span} from ${Math.min(...proxies)} to ${Math.max(...proxies)}`);
  assert(calmStress.records[0].meanSphere < 0.6, `T9 start ${calmStress.records[0].meanSphere}`);
  assert(
    calmStress.records[49].meanSphere > calmStress.records[0].meanSphere,
    `T9 growth ${calmStress.records[0].meanSphere} -> ${calmStress.records[49].meanSphere}`,
  );
  assert(calmStress.records.every((row) => row.degenerate === false), "T9 degenerate");
  const isolated = [0, 0.2, 0.5, 1].map((stressValue) => {
    const cfg = createUPOConfig({
      seed: 42,
      numAgents: 20,
      latentDim: 512,
      stressIncrement: 0,
      noiseScale: 1,
      enableInertiaInversion: true,
      maxLogSize: 64,
    });
    const manifold = new MemoryManifold(cfg, logicalClock("2026-08-01T00:00:00.000Z"));
    const swarm = new ParasympatheticSwarm(cfg).generateAndDampen(buildUnitGroundTruth(512), stressValue, 10, manifold);
    return swarmDiversity(
      swarm.paths.map((path) => path.vector),
      swarm.paths.map((path) => path.isInversionProbe === true),
    );
  });
  assert(Math.abs(isolated[0]) < 1e-12, `T diversity stress0 ${isolated[0]}`);
  assert(isolated[0] < isolated[1] && isolated[1] < isolated[2] && isolated[2] < isolated[3], `T diversity curve ${isolated.join(",")}`);
  assert(isolated[2] > 0.15 && isolated[2] < 0.25, `T diversity at 0.5 ${isolated[2]}`);
  assert(isolated[3] > 0.4 && isolated[3] < 0.6, `T diversity at 1 ${isolated[3]}`);
  assert(
    standard.swarmDiversity > 0.15 && standard.swarmDiversity < 0.17,
    `T diversity standard ${standard.swarmDiversity}`,
  );
  const uniformStress = run50IterationStressTest(42);
  const csv = stressCsv(uniformStress.records);
  assert(csv.includes("swarmDiversity"), "stress csv missing diversity");
  assert(csv.includes("winnerIndex") && csv.includes("Modus") && csv.includes("Aktion_gebunden"), "stress csv fields");
  assert(stressCsvName("uniform") === "upo-stress-50.csv" && stressCsvName("calm") === "upo-stress-50-calm.csv", "stress names");
  const header = csv.trim().split("\n")[0].split(",");
  const boundNames = new Set<string>(ACTION_BINDINGS.map((binding) => binding.action));
  const decodedAt = header.indexOf("decodedAction");
  const boundAt = header.indexOf("Aktion_gebunden");
  const winnerAt = header.indexOf("winnerIndex");
  const modeAt = header.indexOf("Modus");
  csv.trim().split("\n").slice(1).forEach((line, i) => {
    const cols = line.split(",");
    const row = uniformStress.records[i];
    assert(cols[winnerAt] === String(row.winnerAgent), `csv winnerIndex ${i}`);
    assert(cols[modeAt] === "uniform", `csv mode ${i}`);
    assert(cols[boundAt] === String(boundNames.has(row.decodedAction)), `csv bound ${i}`);
    assert(cols[decodedAt] === row.decodedAction, `csv action ${i}`);
  });
  assert(stressCsv(uniformStress.records, "calm").includes(",calm,"), "calm modus");
  assert(
    uniformStress.records.every((row, i) => row.winnerAgent === run50IterationStressTest(42).records[i].winnerAgent),
    "diversity changed a later stress winner",
  );

  assert(reproduceExportedRun("not-json").detail === "invalid json", "M14 invalid");
  assert(reproduceExportedRun("x".repeat(1_000_001)).detail === "too large", "M14 size");
  assert(reproduceExportedRun("{}").ok === false, "M14 empty object");
  assert(reproduceExportedRun('{"schemaVersion":"upo-run-1"}').detail === "schema violation", "M14 partial");
  const stamped = executeSingle({ ...DEFAULT_RUN, logicalOrigin: "2026-07-01T00:00:00.000Z" });
  const stampedReplay = reproduceExportedRun(runJson(stamped));
  assert(stampedReplay.ok, `M14 logical replay ${stampedReplay.detail}`);
  const tampered = JSON.parse(runJson(stamped)) as { headHash: string };
  tampered.headHash = "deadbeef";
  assert(reproduceExportedRun(JSON.stringify(tampered)).detail === "head hash", "M14 tampered head");

  console.log("[OK] Block 6: T9–T11, diversity, import guard.");
  console.log(
    `  T11 crit=${standard.toleranceCritical.toFixed(4)} T10 margin=${calibrated.minMargin.toFixed(4)} null=${(over / draws).toFixed(4)} over05=${(over05 / draws).toFixed(4)} inSample=${calibrated.nullRate.toFixed(4)}`,
  );
  console.log(
    `  T9 calm=${meanSphere.toFixed(4)} sphere0=${calmStress.records[0].meanSphere.toFixed(4)} sphere49=${calmStress.records[49].meanSphere.toFixed(4)} proxySpan=${span.toFixed(4)} proxy=${Math.min(...proxies).toFixed(4)}..${Math.max(...proxies).toFixed(4)} diversity=${standard.swarmDiversity.toFixed(4)} isolated=${isolated.map((v) => v.toFixed(4)).join(",")}`,
  );
}

const C19_POST =
  "0.3712961462,0.3381356005,0.3586775655,0.3421440443,0.3646221231,0.3447383450,0.3658161397,0.3379239220,0.3665673824,0.3387979450,0.3666600177,0.3445629017,0.3759183809,0.3498427654,0.3755494888,0.3413305366,0.3675970288,0.3419044594,0.3736134695,0.3424165945";
const C19_STRESS_WINNERS =
  "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,15,9,10,16,14,3,9,6,8,14,19,17,17,19,18,16,18,16,18,3,7,17,13,11,19,14,18,18,18,18,18,18,16";

function block7(): void {
  const base = metricsOf(DEFAULT_RUN);
  assert(base.winnerIndex === 12, `C19 winner ${base.winnerIndex}`);
  assert(
    base.postConfidences.map((value) => value.toFixed(10)).join(",") === C19_POST,
    "C19 confidences moved",
  );
  const stress = run50IterationStressTest(42);
  assert(
    stress.records.map((row) => row.winnerAgent).join(",") === C19_STRESS_WINNERS,
    "C19 stress winners moved",
  );
  assert(
    Math.abs(stress.records[0].systemConfidencePostReferee - 0.6046623736624417) < 1e-12,
    `C19 stress conf0 ${stress.records[0].systemConfidencePostReferee}`,
  );

  const noises = [0.1, 1.0, 3.0];
  const internals = [0, 0.5];
  const seeds = [42, 101, 2026, 7777, 99999];
  let hits = 0;
  let minMargin = Infinity;
  let maxMargin = -Infinity;
  let below = 0;
  const unbound = new Set<string>();
  for (const binding of ACTION_BINDINGS) {
    for (const noiseLevel of noises) {
      for (const internalStress of internals) {
        for (const seed of seeds) {
          const row = metricsOf({
            ...DEFAULT_RUN,
            envStress: binding.scenario.env,
            noiseLevel,
            internalStress,
            seed,
            tolerance: 0.25,
          });
          const named = row.decodedAction === binding.action && row.actionMargin + 1e-12 >= row.actionMinMargin;
          if (named) hits += 1;
          else below += 1;
          if (row.actionMargin < minMargin) minMargin = row.actionMargin;
          if (row.actionMargin > maxMargin) maxMargin = row.actionMargin;
          if (
            row.decodedAction !== "UNDECIDED" &&
            !ACTION_BINDINGS.some((item) => item.action === row.decodedAction)
          ) {
            unbound.add(row.decodedAction);
          }
        }
      }
    }
  }
  assert(hits === 90, `T12 hits ${hits} below ${below} margin ${minMargin}..${maxMargin}`);
  assert(minMargin >= 0.128 && maxMargin <= 0.25, `T12 margin ${minMargin}..${maxMargin}`);
  const stressActions = new Set(stress.records.map((row) => row.decodedAction).filter((name) => name !== "UNDECIDED"));
  assert(stressActions.size >= 2, `T12 stress actions ${[...stressActions].join(",")}`);

  const probe = new SensorySemanticAdapter(512, 42);
  const hold = new SeededRng(streamSeed(42, STREAM_CALIB));
  for (let i = 0; i < 4000; i++) unitDraw(hold, 512);
  let decided = 0;
  const draws = 20000;
  for (let i = 0; i < draws; i++) {
    const decoded = probe.decodeDetailed(unitDraw(hold, 512));
    if (decoded.action !== "UNDECIDED") decided += 1;
    if (decoded.action !== "UNDECIDED" && !probe.boundActions.includes(decoded.action)) unbound.add(decoded.action);
  }
  assert(decided / draws <= 0.02, `T13 null decisions ${decided / draws}`);
  assert(unbound.size === 0, `T14 unbound ${[...unbound].join(",")}`);
  for (const name of probe.unboundActions) {
    assert(!stress.records.some((row) => row.decodedAction === name), `T14 stress ${name}`);
  }

  console.log("[OK] Block 7: T12–T14, C19 winners unchanged.");
  console.log(
    `  T12 hits=${hits}/90 margin=${minMargin.toFixed(4)}..${maxMargin.toFixed(4)} thr=${base.actionMinMargin.toFixed(4)} stressActions=${[...stressActions].join(",")}`,
  );
  console.log(`  T13 decided=${(decided / draws).toFixed(4)} T14 unbound=${probe.unboundActions.length}`);
}

function block8(): void {
  assert(Math.abs(residualStd([0, 1, 4, 9]) - 2) < 1e-12, "C21 residualStd");
  assert(MODALITY_PRIORS.quality === 0.6, `C21 prior ${MODALITY_PRIORS.quality}`);
  const off = new SensorySemanticAdapter(512, 42);
  assert(off.qualityChannel === false, "C21 default channel");
  assert(!("quality" in off.ingest(
    DeterministicSensorSynthesizer.synthesize(0.32, 0.42, 42).visual,
    DeterministicSensorSynthesizer.synthesize(0.32, 0.42, 42).auditory,
    DeterministicSensorSynthesizer.synthesize(0.32, 0.42, 42).imu,
  )), "C21 off ingest");
  const on = new SensorySemanticAdapter(512, 42, null, 0.99, true);
  assert(on.qualityChannel === true, "C21 channel flag");
  const raw = DeterministicSensorSynthesizer.synthesize(0.2, 0.1, 42);
  const ingested = on.ingest(raw.visual, raw.auditory, raw.imu);
  assert(ingested.quality !== undefined && Math.abs(l2(ingested.quality.vector) - 1) < 1e-9, "C21 quality sphere");
  const envs = [0.2, 0.8, 1.4];
  const expectedOff = [0.980250448244951, 0.9880263844122487, 0.9874321913902168];
  const expectedOn = [0.9806972591497566, 0.9865150604883886, 0.9849095212900795];
  envs.forEach((env, i) => {
    const quiet = groundTruthFromScenario(off, { env, noise: 0.1, internal: 0, seed: 42 });
    const loud = groundTruthFromScenario(off, { env, noise: 3.0, internal: 0, seed: 42 });
    const quietOn = groundTruthFromScenario(on, { env, noise: 0.1, internal: 0, seed: 42 });
    const loudOn = groundTruthFromScenario(on, { env, noise: 3.0, internal: 0, seed: 42 });
    assert(Math.abs(cosine(quiet, loud) - expectedOff[i]) < 1e-9, `C21 cosine off ${env} ${cosine(quiet, loud)}`);
    assert(Math.abs(cosine(quietOn, loudOn) - expectedOn[i]) < 1e-9, `C21 cosine on ${env} ${cosine(quietOn, loudOn)}`);
    assert(cosine(quietOn, loudOn) >= 0.9, `C21 unexpectedly separated ${env}`);
  });
  const noises = [0.1, 1.0, 3.0];
  const labels: string[] = [];
  const protos: number[][] = [];
  for (const env of envs) {
    for (const noise of noises) {
      labels.push(`${env}|${noise}`);
      protos.push(groundTruthFromScenario(on, { env, noise, internal: 0, seed: 0 }));
    }
  }
  const hold = new SeededRng(streamSeed(42, STREAM_CALIB));
  const sample = new Array<number>(4000);
  for (let i = 0; i < sample.length; i++) {
    const state = unitDraw(hold, 512);
    let best = -Infinity;
    let runner = -Infinity;
    for (const proto of protos) {
      const c = dot(state, proto);
      if (c > best) {
        runner = best;
        best = c;
      } else if (c > runner) runner = c;
    }
    sample[i] = best - runner;
  }
  sample.sort((a, b) => a - b);
  const threshold = sample[Math.floor(0.99 * 4000)];
  assert(Math.abs(threshold - 0.01021374225548307) < 1e-9, `C21 nine threshold ${threshold}`);
  let hits = 0;
  let above = 0;
  for (const env of envs) {
    for (const noise of noises) {
      for (const internalStress of [0, 0.5]) {
        for (const seed of [42, 101]) {
          const run = executeSingle({
            ...DEFAULT_RUN,
            envStress: env,
            noiseLevel: noise,
            internalStress,
            seed,
            tolerance: 0.25,
            qualityChannel: true,
          });
          let best = -Infinity;
          let runner = -Infinity;
          let idx = 0;
          const state = run.metrics.finalState.vector;
          for (let p = 0; p < protos.length; p++) {
            const c = dot(state, protos[p]);
            if (c > best) {
              runner = best;
              best = c;
              idx = p;
            } else if (c > runner) runner = c;
          }
          const named = labels[idx] === `${env}|${noise}`;
          if (named) hits += 1;
          if (named && best - runner + 1e-12 >= threshold) above += 1;
        }
      }
    }
  }
  assert(hits === 10 && above === 0, `C21 grid hits=${hits} above=${above}`);
  const weighted = executeSingle({ ...DEFAULT_RUN, qualityChannel: true });
  assert(Math.abs((weighted.metrics.triageWeights.quality ?? 0) - 0.1043274181811275) < 1e-9, "C21 weight");
  assert(weighted.metrics.winnerIndex === 12, `C21 on winner ${weighted.metrics.winnerIndex}`);
  console.log("[OK] Block 8: C21 quality channel stays a measured miss.");
  console.log(`  cosine on ${expectedOn.map((v) => v.toFixed(4)).join("/")} hits=${hits}/36 above=${above} thr=${threshold.toFixed(4)}`);
}

function block9(): void {
  const utc = executeSingle(DEFAULT_RUN);
  const utcBody = JSON.parse(runJson(utc)) as { schemaVersion: string; clockMode: string; metrics: { winnerIndex: number } };
  assert(utcBody.schemaVersion === EXPORT_SCHEMA && EXPORT_SCHEMA === "upo-run-2", `schema ${utcBody.schemaVersion}`);
  assert(utcBody.clockMode === "utc", `utc clock ${utcBody.clockMode}`);
  assert(utcBody.metrics.winnerIndex === utc.metrics.winnerIndex, "json winnerIndex");
  assert(reproduceExportedRun(runJson(utc)).ok, "v2 utc replay");

  const logical = executeSingle({ ...DEFAULT_RUN, logicalOrigin: "2026-10-17T00:00:00.000Z" });
  const logicalBody = JSON.parse(runJson(logical)) as { schemaVersion: string; clockMode: string; headHash: string };
  assert(logicalBody.clockMode === "logical", `logical clock ${logicalBody.clockMode}`);
  assert(reproduceExportedRun(runJson(logical)).ok, "v2 logical replay");

  const asV1 = JSON.parse(runJson(logical)) as { schemaVersion: string; clockMode?: string };
  asV1.schemaVersion = "upo-run-1";
  delete asV1.clockMode;
  const v1 = reproduceExportedRun(JSON.stringify(asV1));
  assert(v1.ok, `upo-run-1 replay ${v1.detail}`);

  const broken = JSON.parse(runJson(logical)) as { clockMode: string };
  broken.clockMode = "nope";
  assert(reproduceExportedRun(JSON.stringify(broken)).detail === "schema violation", "v2 clockMode");
  const injected = executeSingle({ ...DEFAULT_RUN, clock: logicalClock("2026-09-01T00:00:00.000Z") });
  assert(JSON.parse(runJson(injected)).clockMode === "logical", "injected clock");
  console.log("[OK] Block 9: upo-run-2 export, upo-run-1 still replays.");
}

block1();
block2();
block3();
block4();
block5();
block6();
block7();
block8();
block9();
