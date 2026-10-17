# Changelog

One line per correction. Wording follows `operator/v3.3.0/src/lib/upo/assumptions.ts`. C1–C19 were already on `main` at `2254ad6` (tag `v3.3.0-C19`). C20–C22 landed together on 2026-10-17 because the adapter carries the bound prototypes and the optional quality channel in one tree.

## 2026-10-17

- C20 (M15) — Three action prototypes. 90/90 hits, margin 0.1296–0.2329, threshold 0.0711, prototype cosine 0.325–0.817. Six names unbound.
- C21 (M16) — Quality channel, off by default. Consensus cosine noise 0.1 vs 3.0 stays 0.9807–0.9865. Nine-scenario grid 10/36, 0 above threshold 0.0102. Target missed. Channel kept.
- C22 (M17) — Export schema `upo-run-2` with `clockMode`. Stress CSV fields `winnerIndex`, `Modus`, `Aktion_gebunden`. `upo-run-1` still replays.

## Already in v3.3.0-C19

- C15 — `toleranceCritical` on the standard run is 0.5676. Degenerate exactly when tolerance reaches it.
- C16 — Null-margin threshold on nine random vectors was 0.0916 (in-sample 0.0100, holdout 0.0103). Explicit 0.05 hit rate 0.1177.
- C17 — Rest-reference ground truth. Eligible mean sphere 0.4310. Calm stress sphere 0.4490 to 1.2454, proxy span 0.4651.
- C18 — `swarmDiversity` on the standard run is 0.1600. Isolated at stress 0 / 0.2 / 0.5 / 1.0: 0, 0.0383, 0.1981, 0.4941.
- C19 — JSON import rejects oversized, unreadable, and schema-foreign payloads. Head hash compared only with a named logical origin.
- C14 — Python PDF master is frozen history. The TypeScript kernel is the executable reference.
- C13 — Export schema `upo-run-1` named the stress plateau: environment stays at 1.5 from iteration 44.
- C12 — Property tests T1–T8 sit beside the eight master checks.
- C11 — Decoder returns `UNDECIDED` under the margin. 0.05 is only an explicit override.
- C10 — Swarm noise scales with the base. Expected cosine `1/sqrt(1+(stress·noiseScale)^2)`.
- C9 — Triage score is prior × log1p(energy).
- C8 — Haptic embedding subtracts rest gravity `[9.81, 0, 0, 0, 0, 0]`.
- C7 — Referee confidence uses sphere distance. A zero vector has sphere distance 2.
- C6 — Agent 0 is an inertia probe and does not win unless `inversionCompetes` is on.
- C5 — Seed is an integer, reduced to uint32.
- C4 — Ring buffer checks the oldest anchor and the newest head hash.
- C3 — Ground truth follows `latentDim` and must have unit norm.
- C2 — Sensor noise and internal stress are separate arguments.
- C1 — Salience uses `||Wx+b||` before the sphere projection.
