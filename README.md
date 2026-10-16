# Unified Process Ontology

Browser operator and historical sources for the Unified Process Ontology.
The executable reference is the TypeScript kernel **3.3.0-Master**.
Older Python and HTML files stay in the tree as frozen history, not as a second ontology.

## v3.3.0 Operator

Full 512-D kernel on the unit sphere S^511. Not the shortened HTML kernel from the PDF master.

Path: `operator/v3.3.0/`

- Kernel: `operator/v3.3.0/src/lib/upo/`
- Console, 3D topology, eight master diagnostics, stress test, multi-seed, damping grid, CSV and JSON export
- Languages in the console: Deutsch, English, Français, Italiano (selector, top right; persisted locally)

Pipeline, one pass:

1. `DeterministicSensorSynthesizer` — vision 16-D, audio 8-D, IMU 6-D
2. `SensorySemanticAdapter` — affine map, energy `||Wx+b||` before unit projection, cosine decode
3. `SensoryTriageAgent` — score is prior × log1p(energy); priors visual 1.0, auditory 0.8, haptic 1.2
4. `ParasympatheticSwarm` — 20 agents, damping, agent 0 as inertia-inversion probe
5. `HostileReferees` — sphere distance to the unit ground truth, confidence collapse
6. L2 collapse of the winner, then action decode

Default run: seed 42, 20 agents, damping 0.8, tolerance 0.3, stress increment 0.05, env 0.32, noise 0.42, internal stress 0.42.

Nine named actions, plus `UNDECIDED` when the cosine margin is below the threshold. If `actionMinMargin` is null, the kernel calibrates that threshold (C16). An explicit number, including 0.05, still overrides.

`PROMPT_LLM_CAUTION`, `MOTOR_STOP_IMMEDIATELY`, `MOTOR_PROCEED_GENTLY`, `MOTOR_TURN_LEFT`, `MOTOR_TURN_RIGHT`, `ACTIVATE_WARNING_LIGHTS`, `SYSTEM_RECALIBRATE`, `EXTERNAL_OVERRIDE_EMERGENCY`, `EXTERNAL_NAVIGATE_HOME`.

The nine vectors are seeded unit vectors. The names are labels, not a measured motor policy.

### Assumptions

- **A1** State hashes are canonical JSON (components to 6 decimals, half-away-from-zero) and SHA-256, cut to 16 hex characters. Not Python `repr(list)`.
- **A2** Randomness is xoshiro128** plus Box-Muller. Four streams (`sensor`, `swarm`, `adapter`, `calib`) come from the master seed via SplitMix32. `calib` is only the action-margin null sample and does not move the other three. Not bit-identical to NumPy PCG64 or CPython MT19937.
- **A3** The clock is injectable. Diagnostics and the boot run use a logical UTC clock so the SHA-256 lineage is process-stable. Manual runs stamp real UTC.

### Corrections against the PDF master

Named in `operator/v3.3.0/src/lib/upo/assumptions.ts`. They repair dead or forgeable steps. They are not silent deviations.

| ID | What changed |
| --- | --- |
| C1 | Salience used `||Wx+b||` before the sphere projection. After unit projection every modality has energy 1, so a linear product collapses onto the constant priors. |
| C2 | Sensor noise and internal stress are separate synthesizer arguments. The Tk GUI passed internal stress as `noise_level`. |
| C3 | Ground truth follows `latentDim` and must have unit norm. The PDF default factory always built 512 components. |
| C4 | The ring buffer also checks the oldest anchor and the newest head hash. Interior edges alone miss a forged genesis edge and a rewritten last entry. |
| C5 | Seed is an integer, reduced to uint32. The unseeded `random.Random()` branch is not offered. |
| C6 | Agent 0 with inertia inversion is a diagnostic probe (`isInversionProbe`) and does not decide while `inversionCompetes` is false (default). Ties break toward the smaller sphere distance. If the best eligible confidence is ≤ 0, the run is `degenerate`. |
| C7 | Referee confidence uses the Euclidean distance of the direction on the unit sphere, not the length of the noisy vector. Raw distance stays as `d_pre`. A zero vector has no direction; its sphere distance is 2. |
| C8 | The haptic embedding subtracts rest gravity `[9.81, 0, 0, 0, 0, 0]`. The raw IMU vector of the synthesizer is unchanged. A vanishing deviation is placed on axis e0 with energy 0 so the projection stays defined. |
| C9 | Revises C1. The triage score is prior × log1p(energy). The linear product produced a haptic one-hot `[0, 0, 1]` at seeds 42, 101 and 2026. With C8 and log1p the mix responds to the environment. |
| C10 | Swarm noise scales with the base. Per-component std = `stress * noiseScale * ||base|| / sqrt(d)`, `noiseScale` default 1, drawn uniform(`-a`, `a`) with `a = sqrt(3) * sigma`. Analytic cosine to the base is `1/sqrt(1+(stress*noiseScale)^2)`. |
| C11 | The action decoder requires a cosine margin of at least `actionMinMargin`, otherwise `UNDECIDED`. Since C16 the default is null (calibrate). 0.05 remains only as an explicit override. Earlier standard run at the fixed 0.05: best cosine 0.067, margin 0.025. |
| C12 | Self-tests T1–T8 check properties (probe does not win a tie, referee is scale-invariant, haptic cosine under 0.95, triage is not a unit mass, noise hits the analytic cosine, a small margin is `UNDECIDED`, a tolerance sweep does not throw). They do not replace the eight master checks. T9–T11 cover the rest reference, the calibrated margin, and the tolerance identity. |
| C13 | Export schema `upo-run-1` carries `schemaVersion`, `kernelVersion`, note ids, the full config, the RNG id `xoshiro128**/SplitMix32`, and per agent `stress`, `pre`, `post`, `d_pre`, `sphereDist`, `isInversionProbe`, plus `margin`, `degenerate`, `winner`, `tieCount`. In the stress test, internal stress is `min(1.5, noise*0.25)` and rises through iteration 49. Environment stress stays capped at 1.5 from iteration 44; that plateau is the master protocol and is named here. |
| C14 | The Python file of the PDF master is frozen as a historical specification. The executable reference is this TypeScript kernel. Known defects there: `math.cos` on a NumPy array raises `TypeError`; the GUI passes internal stress as `noise_level`; the HTML export loads Three.js from cdnjs and is not numerically identical. `operator/v3.3.0/python/m9_frozen_audio_check.py` checks only the corrected audio line and the gravity cosine. It is not a second ontology. |
| C15 | `toleranceCritical` is the max of pre-confidence / sphere distance over eligible agents. A run is degenerate exactly when tolerance is at least that value. Headroom is the difference. Measured on the standard run (uniform ground truth, seed 42): 0.5676. The slider marks it. A sweep from 0 to 1.5 satisfies `degenerate === (tolerance >= toleranceCritical)`. |
| C16 | When `actionMinMargin` is null, the threshold is the 99th percentile of a null distribution, index `floor(0.99 * n)` at n = 4000, on the extra stream `STREAM_CALIB`. Measured at seed 42: threshold 0.0916, in-sample rate 0.0100, independent draw n = 20000 after the calibration prefix 0.0103. The fixed threshold 0.05 is reached by 0.1177 of that draw. Winners and confidences stay the same. |
| C17 | Ground truth can be the triage direction of the rest scenario (env 0.2, noise 0.1, internal stress 0, seed 0), built with the same adapter and no swarm. That is a named assumption, not a measured truth. The default stays the uniform unit vector. Mean sphere distance of eligible agents, seed 42: rest scenario 0.4310. Stress test with that reference: 0.4490 at iteration 0, 1.2454 at iteration 49, proxy 0.4401 to 0.9052 (span 0.4651), no degenerate step. |
| C18 | `swarmDiversity` is 1 minus the mean pairwise cosine of non-probe agents. It is a swarm health number and does not change winners or confidences. Standard run: 0.1600. Isolated, increment 0, threshold 10, unit base, seed 42: stress 0 gives 0 (C10, sigma 0), 0.2 gives 0.0383, 0.5 gives 0.1981, 1.0 gives 0.4941. The Nachtrag band 0.20 to 0.36 does not hold on this kernel. |
| C19 | `reproduceExportedRun` rejects oversized, unreadable, and schema-foreign JSON with `ok: false` and does not throw. It copies only known parameter keys. The export includes `headHash`. Replay compares that hash only when the run recorded a logical-clock origin. |

### Operator layout

```text
operator/v3.3.0/src/lib/upo/     kernel, including scenario.ts
operator/v3.3.0/src/lib/i18n/    DE / EN / FR / IT
operator/v3.3.0/src/components/upo/   console, topology, charts, language switch
operator/v3.3.0/python/m9_frozen_audio_check.py
```

The console is a browser app (React, TypeScript). This repository snapshot is the source of that operator. It is not a standalone `npm install` of the hosting workspace: platform glue (auth, database, preview bridge) is intentionally not part of this tree.

### What the console runs

- One pass (`Lauf`) with seed, environment, noise, internal stress, damping, tolerance, agent count, inertia probe, and an optional rest-reference ground truth
- Eight master checks: unit sphere, allostasis, L2 collapse, inertia inversion, ring buffer and SHA-256, action space, determinism, fail-fast dimension
- Property tests T1–T11
- 50-iteration stress test, five-seed study, nine-point damping grid
- CSV of the stress series (including tolerance headroom and swarm diversity) and JSON (`upo-run-1`) of a single run, including a replay check
- Tolerance slider marks `toleranceCritical`. Below 0.1 headroom the console warns that the referee wipes every confidence

### Trust model

The SHA-256 chain is tamper evidence only together with a head hash stored outside the browser. Anyone who can recompute the chain can replace it, because the kernel runs in the browser. Replay is a determinism test, not a proof of authenticity: a JSON file with matching numbers can be written by hand.

`reproduceExportedRun` caps the payload at 1_000_000 bytes, rejects invalid JSON and schema mismatches, and passes only known parameter keys into `createUPOConfig`, which still validates them.

GitHub secret scanning is not enabled on this repository. The API reports that secret scanning is disabled and that GitHub Advanced Security is not enabled, so this client cannot turn the setting on. A code search of the current tree and a content scan of the historical Python sources at commits `472624bf` and `d61bb5e` found no API keys, tokens, or private keys.

## v3.2.6

Deterministic action space, distance logging, dynamic stress regulator, Tkinter GUI and HTML. Files under `src/v3_2_6/`.

## v3.2.2

Original version under `src/` (`unified_process_ontology_v3_2_2.py`, `upo_visualization.py`, `upo_animation.html`) and `data/zustandsvektoren.csv`.

## Status

Kernel version string: `3.3.0-Master`.
Randomness contract: xoshiro128** / SplitMix32, four streams. Not bit-equal to NumPy PCG64.
