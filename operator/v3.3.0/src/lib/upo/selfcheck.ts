import { SensorySemanticAdapter } from "./adapter";
import { createUPOConfig } from "./config";
import { runAllChecks } from "./diagnostics";
import { entryHash, logicalClock, MemoryManifold } from "./manifold";
import { buildUnitGroundTruth, cosine, euclidean, l2, linspace, softmax, topologyPoint } from "./math";
import { UnifiedProcessOntology } from "./ontology";
import { HostileReferees } from "./referees";
import { DynamicStressRegulator } from "./regulator";
import { SeededRng, streamSeed } from "./rng";
import { DeterministicSensorSynthesizer } from "./sensors";
import { sha256Hex } from "./sha256";
import { DEFAULT_RUN, run50IterationStressTest, runDampingStudy, runMultiSeed } from "./studies";
import { ParasympatheticSwarm } from "./swarm";
import { ContextRevisor, SensoryTriageAgent } from "./triage";
import { ACTION_NAMES, GENESIS_ANCHOR } from "./types";

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
  const prior = softmax([1, 0.8, 1.2]);
  assert(Math.abs(blind.weights.visual - prior[0]) < 1e-12, "unit energy recovers prior softmax");
  const energetic = triage.processOverload({
    visual: { vector: [1, 0], energy: 10 },
    auditory: { vector: [0, 1], energy: 0.01 },
    haptic: { vector: [0, 1], energy: 0.01 },
  });
  assert(energetic.weights.visual > 0.99, `visual energy must dominate, got ${energetic.weights.visual}`);
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
  const adapter = new SensorySemanticAdapter(cfg.latentDim, cfg.seed);
  const inputs = adapter.ingest(raw.visual, raw.auditory, raw.imu);
  for (const key of ["visual", "auditory", "haptic"]) {
    assert(Math.abs(l2(inputs[key].vector) - 1) < 1e-9, `${key} not unit`);
    assert(inputs[key].energy > 0, `${key} energy`);
  }

  const ortho = adapter.computeOrthogonalityStats();
  assert(
    Math.abs(ortho.mean) < 0.05 && ortho.max < 0.25,
    `action space not quasi-orthogonal max=${ortho.max} mean=${ortho.mean}`,
  );

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
  assert(ACTION_NAMES.includes(metrics.decodedAction as (typeof ACTION_NAMES)[number]), metrics.decodedAction);
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
  const adapterB = new SensorySemanticAdapter(cfg.latentDim, cfg.seed);
  const metricsB = upoB.perceiveAndExecuteDetailed(
    adapterB.ingest(raw.visual, raw.auditory, raw.imu),
    0.42,
    0.32,
    adapterB,
  );
  assert(metrics.distPostCollapse === metricsB.distPostCollapse, "non-deterministic distance");
  assert(metrics.decodedAction === metricsB.decodedAction, "non-deterministic action");
  assert(metrics.finalState.lineage === metricsB.finalState.lineage, "logical clock lineage diverged");

  const zeroBase = createUPOConfig({ latentDim: 4, numAgents: 1, enableInertiaInversion: true, maxLogSize: 16 });
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

block1();
block2();
block3();
block4();
