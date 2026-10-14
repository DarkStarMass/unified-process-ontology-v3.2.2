import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, Play, ShieldCheck } from "lucide-react";
import { LanguageSwitch } from "@/components/upo/language-switch";
import { fill, type Messages } from "@/lib/i18n/messages";
import { useLocale } from "@/lib/i18n/locale";
import { KERNEL_NOTES } from "@/lib/upo/assumptions";
import { runAllChecks, type DiagnosticReport } from "@/lib/upo/diagnostics";
import { logicalClock } from "@/lib/upo/manifold";
import { topologyPoint } from "@/lib/upo/math";
import {
  DEFAULT_RUN,
  agentCsv,
  executeSingle,
  run50IterationStressTest,
  runDampingStudy,
  reproduceExportedRun,
  runJson,
  runMultiSeed,
  stressCsv,
  type DampingRow,
  type MultiSeedRow,
  type RunParams,
  type SingleRun,
  type StressRecord,
} from "@/lib/upo/studies";
import type { ActionName } from "@/lib/upo/types";
import { Button } from "@/components/ui/button";
import { FieldSlider } from "@/components/ui/slider";
import { FieldSwitch } from "@/components/ui/switch";
import { ConfidenceChart, StressChart } from "@/components/upo/charts";
import { Topology } from "@/components/upo/topology";

type Controls = Omit<RunParams, "clock">;

const STORAGE_KEY = "upo-operator-v330";

function n(value: number, digits: number): string {
  return value.toFixed(digits);
}

function download(filename: string, body: string, mime: string) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type Job = "run" | "diag" | "stress" | "seeds" | "grid" | "replay";

function gloss(messages: Messages, action: string): string {
  if (action === "UNDECIDED") return messages.undecided;
  return messages.actions[action as ActionName] ?? "";
}

function checkText(messages: Messages, id: number, ok: boolean, detail: string, facts?: Record<string, string | number>) {
  const block = messages.checks8[id];
  if (!block) return { name: String(id), detail };
  if (!ok) return { name: block.name, detail };
  return { name: block.name, detail: fill(block.ok, facts) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitize(partial: Partial<Controls>, base: Controls): Controls {
  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const int = (value: unknown, fallback: number) => {
    const v = num(value, fallback);
    return Number.isInteger(v) ? v : Math.round(v);
  };
  return {
    envStress: clamp(num(partial.envStress, base.envStress), 0, 1.5),
    internalStress: clamp(num(partial.internalStress, base.internalStress), 0, 1),
    noiseLevel: clamp(num(partial.noiseLevel, base.noiseLevel), 0, 4.5),
    dampingFactor: clamp(num(partial.dampingFactor, base.dampingFactor), 0.05, 0.99),
    tolerance: clamp(num(partial.tolerance, base.tolerance), 0, 1.5),
    stressIncrement: clamp(num(partial.stressIncrement, base.stressIncrement), 0, 0.2),
    seed: int(partial.seed, base.seed),
    numAgents: (() => {
      const agents = clamp(int(partial.numAgents, base.numAgents), 1, 40);
      const inversion =
        typeof partial.enableInertiaInversion === "boolean"
          ? partial.enableInertiaInversion
          : base.enableInertiaInversion;
      return inversion && agents < 2 ? 2 : agents;
    })(),
    enableInertiaInversion:
      typeof partial.enableInertiaInversion === "boolean"
        ? partial.enableInertiaInversion
        : base.enableInertiaInversion,
    maxLogSize: base.maxLogSize,
  };
}

function Panel({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        {aside ? <p className="font-mono text-xs tabular-nums text-muted">{aside}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-mono text-sm tabular-nums">{value}</span>
    </div>
  );
}

export function UpoConsole() {
  const { t } = useLocale();
  const [controls, setControls] = useState<Controls>(DEFAULT_RUN);
  const [diagnostics, setDiagnostics] = useState<DiagnosticReport | null>(null);
  const [run, setRun] = useState<SingleRun | null>(null);
  const [stress, setStress] = useState<StressRecord[] | null>(null);
  const [seeds, setSeeds] = useState<MultiSeedRow[] | null>(null);
  const [grid, setGrid] = useState<DampingRow[] | null>(null);
  const [busy, setBusy] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [restored, setRestored] = useState(false);
  const [replay, setReplay] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setDiagnostics(runAllChecks());
    setRun(executeSingle({ ...DEFAULT_RUN, clock: logicalClock() }));
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<Controls>;
      setControls((current) => sanitize(parsed, current));
      setRestored(true);
    } catch {
      setRestored(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));
  }, [controls, mounted]);

  const points = useMemo(() => {
    if (!run) return [];
    const m = run.metrics;
    return m.dampedFlags.map((damped, i) => {
      const p = topologyPoint(i, m.dampedFlags.length, m.postConfidences[i], m.agentDistances[i]);
      return { i, ...p, damped, winner: i === m.winnerIndex };
    });
  }, [run]);

  const confidenceRows = useMemo(() => {
    if (!run) return [];
    return run.metrics.preConfidences.map((pre, i) => ({
      i,
      pre,
      post: run.metrics.postConfidences[i],
    }));
  }, [run]);

  async function work(label: Job, job: () => void) {
    setBusy(label);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      job();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const weights = run?.metrics.triageWeights;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex flex-col gap-3">
          <div className="sticky top-0 z-30 -mx-4 flex justify-end bg-background/95 px-4 py-2 sm:-mx-6 sm:px-6">
            <LanguageSwitch />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-wide text-muted">UPO v3.3.0 MASTER · R^512 · S^511</p>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Operator</h1>
            <p className="max-w-3xl text-sm leading-normal text-muted">{t.lede}</p>
          </div>
        </header>

        <Panel title={t.controls} aside={restored ? t.restoredAside : t.defaultsAside}>
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            <FieldSlider label={t.env} value={controls.envStress} min={0} max={1.5} step={0.01} display={n(controls.envStress, 2)} onChange={(envStress) => setControls((c) => ({ ...c, envStress }))} />
            <FieldSlider label={t.internal} value={controls.internalStress} min={0} max={1} step={0.01} display={n(controls.internalStress, 2)} onChange={(internalStress) => setControls((c) => ({ ...c, internalStress }))} />
            <FieldSlider label={t.noise} value={controls.noiseLevel} min={0} max={4.5} step={0.01} display={n(controls.noiseLevel, 2)} onChange={(noiseLevel) => setControls((c) => ({ ...c, noiseLevel }))} />
            <FieldSlider label={t.damping} value={controls.dampingFactor} min={0.05} max={0.99} step={0.01} display={n(controls.dampingFactor, 2)} onChange={(dampingFactor) => setControls((c) => ({ ...c, dampingFactor }))} />
            <FieldSlider label={t.tolerance} value={controls.tolerance} min={0} max={1.5} step={0.01} display={n(controls.tolerance, 2)} onChange={(tolerance) => setControls((c) => ({ ...c, tolerance }))} />
            <FieldSlider label={t.increment} value={controls.stressIncrement} min={0} max={0.2} step={0.01} display={n(controls.stressIncrement, 2)} onChange={(stressIncrement) => setControls((c) => ({ ...c, stressIncrement }))} />
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">{t.seed}</span>
              <input
                className="h-11 rounded-sm border border-border bg-input px-3 font-mono text-foreground"
                inputMode="numeric"
                aria-label={t.seed}
                value={controls.seed}
                onChange={(e) => {
                  if (e.target.value === "" || e.target.value === "-") return;
                  const parsed = Number(e.target.value);
                  if (Number.isInteger(parsed)) setControls((c) => ({ ...c, seed: parsed }));
                }}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">{t.agents}</span>
              <input
                className="h-11 rounded-sm border border-border bg-input px-3 font-mono text-foreground"
                inputMode="numeric"
                aria-label={t.agents}
                value={controls.numAgents}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  if (Number.isInteger(parsed)) {
                    const next = clamp(parsed, 1, 40);
                    setControls((c) => ({
                      ...c,
                      numAgents: c.enableInertiaInversion && next < 2 ? 2 : next,
                    }));
                  }
                }}
              />
            </label>
          </div>
          <div className="mt-2 max-w-xs">
            <FieldSwitch
              label={t.inversion}
              checked={controls.enableInertiaInversion}
              onChange={(enableInertiaInversion) =>
                setControls((c) => ({
                  ...c,
                  enableInertiaInversion,
                  numAgents: enableInertiaInversion && c.numAgents < 2 ? 2 : c.numAgents,
                }))
              }
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button disabled={busy !== null || !run} onClick={() => void work("run", () => { setRestored(false); setRun(executeSingle(controls)); })}>
              <Play className="size-4" aria-hidden="true" />
              {busy === "run" ? t.running : t.run}
            </Button>
            <Button variant="secondary" disabled={busy !== null} onClick={() => void work("diag", () => setDiagnostics(runAllChecks()))}>
              <ShieldCheck className="size-4" aria-hidden="true" />
              {busy === "diag" ? t.checking : t.checks}
            </Button>
            <Button variant="secondary" disabled={busy !== null} onClick={() => void work("stress", () => setStress(run50IterationStressTest(controls.seed).records))}>
              {busy === "stress" ? t.stressBusy : t.stress}
            </Button>
            <Button variant="secondary" disabled={busy !== null} onClick={() => void work("seeds", () => setSeeds(runMultiSeed(controls)))}>
              {busy === "seeds" ? t.multiBusy : t.multi}
            </Button>
            <Button variant="secondary" disabled={busy !== null} onClick={() => void work("grid", () => setGrid(runDampingStudy(controls)))}>
              {busy === "grid" ? t.gridBusy : t.grid}
            </Button>
            <Button
              variant="secondary"
              disabled={busy !== null || !run}
              onClick={() => run && download("upo-agenten.csv", agentCsv(run, t.csvAgent), "text/csv")}
            >
              <Download className="size-4" aria-hidden="true" />
              {t.agentCsv}
            </Button>
            <Button
              variant="secondary"
              disabled={busy !== null || !stress}
              onClick={() => stress && download("upo-stress-50.csv", stressCsv(stress, t.csvStress), "text/csv")}
            >
              {t.stressCsv}
            </Button>
            <Button
              variant="secondary"
              disabled={busy !== null || !run}
              onClick={() => run && download("upo-lauf.json", runJson(run), "application/json")}
            >
              {t.json}
            </Button>
            <Button
              variant="secondary"
              disabled={busy !== null || !run}
              onClick={() =>
                run &&
                void work("replay", () => {
                  const verdict = reproduceExportedRun(runJson(run));
                  setReplay(verdict.ok ? t.replayOk : `${t.replayBad} ${verdict.detail}`);
                })
              }
            >
              {t.replay}
            </Button>
          </div>
          {restored ? <p className="mt-3 text-xs leading-normal text-muted">{t.restoredNote}</p> : null}
          {replay ? <p className="mt-3 text-xs leading-normal text-muted">{replay}</p> : null}
        </Panel>

        {error ? (
          <p className="rounded-sm border border-danger px-3 py-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title={t.telemetry} aside={run ? (run.chainIntact ? t.chainOk : t.chainBad) : t.booting}>
            {run && weights ? (
              <>
                <Metric label={t.threshold} value={n(run.metrics.activeThreshold, 2)} />
                <Metric label={t.interventions} value={String(run.metrics.interventions)} />
                <Metric label={t.dist} value={`${n(run.metrics.distPreCollapse, 4)} / ${n(run.metrics.distPostCollapse, 4)}`} />
                <Metric label={t.proxy} value={n(run.metrics.stabilityProxy, 4)} />
                <Metric label={t.inv} value={n(run.metrics.inversionMetric, 6)} />
                <Metric
                  label={t.confWinner}
                  value={`${n(run.metrics.preConfidences[run.metrics.winnerIndex], 4)} → ${n(run.metrics.finalState.confidence, 4)}`}
                />
                <Metric label={t.winner} value={`A${run.metrics.winnerIndex}`} />
                <Metric
                  label={t.action}
                  value={`${run.metrics.decodedAction}  cos ${n(run.metrics.actionCosineSimilarity, 4)}`}
                />
                <p className="-mt-1 mb-2 text-right text-xs leading-normal text-muted">{gloss(t, run.metrics.decodedAction)}</p>
                <Metric label={t.margin} value={`${n(run.metrics.actionMargin, 4)}  →  ${run.metrics.actionRunnerUp || "—"}`} />
                <Metric label={t.sphere} value={n(run.metrics.sphereDistances[run.metrics.winnerIndex], 4)} />
                <p className="mb-2 text-xs leading-normal text-muted">{t.actionPlaceholder}</p>
                <Metric label={t.lineage} value={run.metrics.finalState.lineage.slice(0, 16)} />
                <Metric
                  label={t.ortho}
                  value={`${n(run.orthogonality.min, 3)} / ${n(run.orthogonality.max, 3)} / ${n(run.orthogonality.mean, 4)}`}
                />
                {run.metrics.degenerate ? <p className="mt-3 text-sm text-danger">{t.degenerate}</p> : null}
                <div className="mt-4 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
                  {run.metrics.dampedFlags.map((damped, i) => (
                    <div
                      key={i}
                      title={run.metrics.inversionProbe[i] ? t.probe : undefined}
                      className={
                        "flex h-8 items-center justify-center rounded-sm border font-mono text-xs " +
                        (i === run.metrics.winnerIndex
                          ? "border-ok bg-ok text-primary-foreground"
                          : run.metrics.inversionProbe[i]
                            ? "border-dashed border-muted text-muted"
                            : damped
                              ? "border-primary text-foreground"
                              : "border-border text-muted")
                      }
                    >
                      A{i}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {(["visual", "auditory", "haptic"] as const).map((key) => (
                    <div key={key} className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-2 text-xs">
                      <span className="text-muted">{t.modality[key]}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-input">
                        <span className="block h-full bg-primary" style={{ width: `${(weights[key] ?? 0) * 100}%` }} />
                      </span>
                      <span className="text-right font-mono tabular-nums">{n(weights[key] ?? 0, 3)}</span>
                    </div>
                  ))}
                </div>
                {(["visual", "auditory", "haptic"] as const).some((key) => (weights[key] ?? 0) > 0.95) ? (
                  <p className="mt-2 text-xs leading-normal text-muted">
                    {t.hapticNote}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted">{t.computing}</p>
            )}
            <p className="mt-4 font-mono text-xs leading-relaxed text-muted">
              {t.formulaWhen}
              <br />
              {t.formulaConf}
              <br />
              {t.formulaProxy}
            </p>
          </Panel>

          <Panel title={t.topology} aside={t.orbit}>
            <Topology points={points} label={t.aria} />
            <p className="mt-3 text-xs leading-normal text-muted">
              {t.topoBody}
            </p>
          </Panel>
        </div>

        <Panel title={t.referee} aside={t.refereeAside}>
          {mounted && run ? (
            <ConfidenceChart rows={confidenceRows} winner={run.metrics.winnerIndex} before={t.before} after={t.after} />
          ) : (
            <div className="h-56" />
          )}
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title={t.diag} aside={diagnostics ? (diagnostics.ok ? "8 / 8" : t.deviation) : t.diagRunning}>
            {diagnostics ? (
              <ul className="flex flex-col">
                {diagnostics.checks.map((c) => {
                  const copy = checkText(t, c.id, c.ok, c.detail, c.facts);
                  return (
                  <li key={c.id} className="border-b border-border py-2 last:border-b-0">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{c.id}. {copy.name}</span>
                      <span className={c.ok ? "font-mono text-xs text-ok" : "font-mono text-xs text-danger"}>
                        {c.ok ? t.ok : t.fail}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-normal text-muted">{copy.detail}</p>
                  </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t.diagWait}</p>
            )}
          </Panel>

          <Panel title={t.audit} aside={run ? `${run.logSize} / ${run.config.maxLogSize}` : "0"}>
            {run ? (
              <ol className="max-h-80 overflow-auto font-mono text-xs leading-relaxed">
                {run.log.map((entry, i) => (
                  <li key={`${entry.timestamp}-${entry.actor}-${i}`} className="border-b border-border py-1.5 last:border-b-0">
                    <span className="text-muted">{entry.timestamp.slice(11, 19)}</span> {entry.actor} {entry.action}
                    <span className="text-muted"> {entry.targetStateHash}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">{t.auditEmpty}</p>
            )}
          </Panel>
        </div>

        <Panel title={t.stressTitle} aside={t.stressAside}>
          {stress && mounted ? (
            <StressChart records={stress} stability={t.stability} confidence={t.confidence} interventions={t.interventions} />
          ) : (
            <p className="text-sm text-muted">
              {t.stressEmpty}
            </p>
          )}
        </Panel>

        <Panel title={t.multiTitle} aside="42, 101, 2026, 7777, 99999">
          {seeds ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-left font-mono text-xs">
                <thead className="text-muted">
                  <tr>
                    {[t.cols.seed, t.cols.win, t.cols.dPre, t.cols.dPost, t.cols.proxy, t.cols.conf, t.cols.inv, t.cols.action].map((h) => (
                      <th key={h} className="border-b border-border px-2 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seeds.map((row) => (
                    <tr key={row.seed}>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{row.seed}</td>
                      <td className="border-b border-border px-2 py-2">A{row.winner}</td>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{n(row.distPre, 4)}</td>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{n(row.distPost, 4)}</td>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{n(row.proxy, 4)}</td>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{n(row.confidence, 4)}</td>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{n(row.inversion, 3)}</td>
                      <td className="border-b border-border px-2 py-2">
                        <span className="block">{row.action}</span>
                        <span className="block font-sans text-muted">{gloss(t, row.action)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">{t.multiEmpty}</p>
          )}
        </Panel>

        <Panel title={t.gridTitle} aside={t.gridAside}>
          {grid ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left font-mono text-xs">
                <thead className="text-muted">
                  <tr>
                    {[t.cols.damping, t.cols.increment, t.cols.interventions, t.cols.win, t.cols.conf, t.cols.proxy, t.cols.action].map((h) => (
                      <th key={h} className="border-b border-border px-2 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row) => (
                    <tr key={`${row.damping}-${row.increment}`}>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{n(row.damping, 2)}</td>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{n(row.increment, 2)}</td>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{row.interventions}</td>
                      <td className="border-b border-border px-2 py-2">A{row.winner}</td>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{n(row.confidence, 4)}</td>
                      <td className="border-b border-border px-2 py-2 tabular-nums">{n(row.proxy, 4)}</td>
                      <td className="border-b border-border px-2 py-2">
                        <span className="block">{row.action}</span>
                        <span className="block font-sans text-muted">{gloss(t, row.action)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">
              {t.gridEmpty}
            </p>
          )}
        </Panel>

        <Panel title={t.notes}>
          <ul className="flex flex-col gap-3">
            {KERNEL_NOTES.map((note) => (
              <li key={note.id} className="text-sm leading-normal">
                <span className="font-mono text-xs text-muted">{note.id}</span> {t.notesText[note.id] ?? note.text}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
