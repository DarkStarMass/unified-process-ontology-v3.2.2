import { dot, l2 } from "./math";
import { STREAM_ADAPTER, STREAM_CALIB, SeededRng, streamSeed } from "./rng";
import { ACTION_BINDINGS, groundTruthFromScenario } from "./scenario";
import { compensateGravity, residualStd } from "./sensors";
import { ACTION_NAMES, type ActionName, type ModalChannel } from "./types";

export const DEFAULT_ACTION_MIN_MARGIN = 0.05;
export const DEFAULT_MARGIN_QUANTILE = 0.99;
export const DEFAULT_MARGIN_SAMPLE = 4000;

const marginCache = new Map<string, { threshold: number; nullRate: number; sample: number[] }>();

export type DecodeResult = {
  action: ActionName | "UNDECIDED";
  cosine: number;
  margin: number;
  runnerUp: ActionName | "";
  bound: boolean;
};

function matVec(w: Float64Array, x: ArrayLike<number>, rows: number, cols: number): Float64Array {
  if (x.length !== cols) throw new Error(`matVec: expected ${cols} features, got ${x.length}`);
  const out = new Float64Array(rows);
  for (let r = 0; r < rows; r++) {
    let s = 0;
    const off = r * cols;
    for (let c = 0; c < cols; c++) s += w[off + c] * x[c];
    out[r] = s;
  }
  return out;
}

function asUnitChannel(projected: Float64Array): ModalChannel {
  const energy = l2(projected);
  if (energy < 1e-12) throw new Error("Zero-norm vector encountered during projection.");
  const vector = new Array<number>(projected.length);
  for (let i = 0; i < projected.length; i++) vector[i] = projected[i] / energy;
  return { vector, energy };
}

/**
 * Projects 16D vision, 8D audio and 6D IMU onto S^(d-1)
 * and decodes a state by cosine against scenario prototypes.
 * Correction C20: only ACTION_BINDINGS take part. The other names are unbound.
 * Biases b_* are the zero vector specified in the master, so Wx+b = Wx.
 */
export class SensorySemanticAdapter {
  static readonly ACTION_NAMES = ACTION_NAMES;
  private readonly wVisual: Float64Array;
  private readonly wAuditory: Float64Array;
  private readonly wHaptic: Float64Array;
  private readonly wQuality: Float64Array;
  readonly actionSpace: Record<ActionName, Float64Array>;
  readonly boundActions: readonly ActionName[];
  readonly unboundActions: readonly ActionName[];
  readonly qualityChannel: boolean;
  readonly minMargin: number;
  readonly marginQuantile: number;
  readonly nullRate: number;

  constructor(
    readonly targetDim: number,
    readonly seed: number,
    minMargin: number | null = null,
    marginQuantile = DEFAULT_MARGIN_QUANTILE,
    qualityChannel = false,
  ) {
    if (!Number.isInteger(targetDim) || targetDim <= 0) {
      throw new Error("Adapter targetDim must be a positive integer.");
    }
    if (minMargin !== null && (!Number.isFinite(minMargin) || minMargin < 0)) {
      throw new Error("Adapter minMargin must be finite and >= 0.");
    }
    if (!Number.isFinite(marginQuantile) || !(marginQuantile > 0 && marginQuantile <= 1)) {
      throw new Error("Adapter marginQuantile must be in (0, 1].");
    }
    this.marginQuantile = marginQuantile;
    const rng = new SeededRng(streamSeed(seed, STREAM_ADAPTER));
    this.wVisual = this.fillNormal(rng, targetDim * 16, 0.1);
    this.wAuditory = this.fillNormal(rng, targetDim * 8, 0.1);
    this.wHaptic = this.fillNormal(rng, targetDim * 6, 0.1);
    this.qualityChannel = qualityChannel;
    this.wQuality = qualityChannel ? this.fillNormal(rng, targetDim * 3, 0.1) : new Float64Array(0);
    const seen = new Set<ActionName>();
    const bound: ActionName[] = [];
    const space = {} as Record<ActionName, Float64Array>;
    for (const binding of ACTION_BINDINGS) {
      if (seen.has(binding.action)) {
        throw new Error(`Adapter: duplicate binding ${binding.action}`);
      }
      seen.add(binding.action);
      bound.push(binding.action);
      const proto = groundTruthFromScenario(this, binding.scenario);
      if (proto.length !== targetDim) {
        throw new Error(`Adapter: prototype dim ${proto.length} != ${targetDim}`);
      }
      space[binding.action] = Float64Array.from(proto);
    }
    if (bound.length < 2) throw new Error("Adapter: at least two bound actions are required.");
    for (const name of ACTION_NAMES) {
      if (!seen.has(name)) space[name] = new Float64Array(targetDim);
    }
    this.boundActions = bound;
    this.unboundActions = ACTION_NAMES.filter((name) => !seen.has(name));
    this.actionSpace = space;
    const calibrated = this.calibrateNullMargin(marginQuantile, DEFAULT_MARGIN_SAMPLE);
    this.minMargin = minMargin === null ? calibrated.threshold : minMargin;
    let above = 0;
    for (const value of calibrated.sample) if (value >= this.minMargin) above += 1;
    this.nullRate = above / calibrated.sample.length;
  }

  private fillNormal(rng: SeededRng, n: number, std: number): Float64Array {
    const w = new Float64Array(n);
    for (let i = 0; i < n; i++) w[i] = rng.normal(0, std);
    return w;
  }

  private unitGaussian(rng: SeededRng): Float64Array {
    const v = new Float64Array(this.targetDim);
    for (let i = 0; i < this.targetDim; i++) v[i] = rng.normal(0, 1);
    const n = l2(v);
    if (n < 1e-12) throw new Error("Zero-norm action prototype.");
    for (let i = 0; i < v.length; i++) v[i] /= n;
    return v;
  }

  /** Cosine gap of a state against the bound prototypes only. Independent of the threshold. */
  marginOf(stateVector: ArrayLike<number>): number {
    if (stateVector.length !== this.targetDim) {
      throw new Error(`marginOf: state dim ${stateVector.length} != ${this.targetDim}`);
    }
    let best = -Infinity;
    let runner = -Infinity;
    for (const name of this.boundActions) {
      const c = dot(stateVector, this.actionSpace[name]);
      if (c > best) {
        runner = best;
        best = c;
      } else if (c > runner) {
        runner = c;
      }
    }
    return best - runner;
  }

  /**
   * Empirical quantile of margins of random unit vectors on a private stream.
   * Assumption: the null is isotropic on the sphere, so the threshold has a known false-action rate.
   */
  calibrateNullMargin(quantile = this.marginQuantile, n = DEFAULT_MARGIN_SAMPLE): {
    threshold: number;
    nullRate: number;
    sample: number[];
  } {
    if (!Number.isInteger(n) || n < 2) throw new Error("calibrateNullMargin: n must be an integer >= 2.");
    const key = `${this.seed}|${this.targetDim}|${quantile}|${n}|${this.boundActions.join(",")}|q${this.qualityChannel ? 1 : 0}`;
    const cached = marginCache.get(key);
    if (cached) return cached;
    const rng = new SeededRng(streamSeed(this.seed, STREAM_CALIB));
    const sample = new Array<number>(n);
    for (let i = 0; i < n; i++) sample[i] = this.marginOf(this.unitGaussian(rng));
    const sorted = sample.slice().sort((a, b) => a - b);
    const threshold = sorted[Math.min(n - 1, Math.floor(quantile * n))];
    let above = 0;
    for (const value of sample) if (value >= threshold) above += 1;
    const result = { threshold, nullRate: above / n, sample };
    marginCache.set(key, result);
    return result;
  }

  embedVisual(visualFeatures: ArrayLike<number>): ModalChannel {
    if (visualFeatures.length !== 16) {
      throw new Error(`Visual features must have shape (16,), got (${visualFeatures.length},)`);
    }
    return asUnitChannel(matVec(this.wVisual, visualFeatures, this.targetDim, 16));
  }

  embedAuditory(audioFeatures: ArrayLike<number>): ModalChannel {
    if (audioFeatures.length !== 8) {
      throw new Error(`Auditory features must have shape (8,), got (${audioFeatures.length},)`);
    }
    return asUnitChannel(matVec(this.wAuditory, audioFeatures, this.targetDim, 8));
  }

  embedHaptic(imuFeatures: ArrayLike<number>): ModalChannel {
    if (imuFeatures.length !== 6) {
      throw new Error(`IMU data must have shape (6,), got (${imuFeatures.length},)`);
    }
    const deviation = compensateGravity(imuFeatures);
    if (l2(deviation) < 1e-12) {
      const vector = new Array<number>(this.targetDim).fill(0);
      vector[0] = 1;
      return { vector, energy: 0 };
    }
    return asUnitChannel(matVec(this.wHaptic, deviation, this.targetDim, 6));
  }

  /**
   * Fourth modality. Three residual-std features, own weights, prior 0.6 in the triage.
   * Drawn only when the channel is on, and only after the three modality matrices,
   * so a disabled channel leaves every embedding on the C19/C20 weights.
   */
  embedQuality(visual: ArrayLike<number>, auditory: ArrayLike<number>, imu: ArrayLike<number>): ModalChannel {
    if (!this.qualityChannel) throw new Error("Quality channel is disabled.");
    const features = [residualStd(visual), residualStd(auditory), residualStd(compensateGravity(imu))];
    return asUnitChannel(matVec(this.wQuality, features, this.targetDim, 3));
  }

  ingest(vis: ArrayLike<number>, aud: ArrayLike<number>, imu: ArrayLike<number>): Record<string, ModalChannel> {
    const channels: Record<string, ModalChannel> = {
      visual: this.embedVisual(vis),
      auditory: this.embedAuditory(aud),
      haptic: this.embedHaptic(imu),
    };
    if (this.qualityChannel) channels.quality = this.embedQuality(vis, aud, imu);
    return channels;
  }

  decodeDetailed(stateVector: ArrayLike<number>): DecodeResult {
    if (stateVector.length !== this.targetDim) {
      throw new Error(`decode: state dim ${stateVector.length} != ${this.targetDim}`);
    }
    const names = this.boundActions;
    let bestName = names[0];
    let best = dot(stateVector, this.actionSpace[bestName]);
    let runnerUp: ActionName | "" = "";
    let runner = -Infinity;
    for (let i = 1; i < names.length; i++) {
      const name = names[i];
      const c = dot(stateVector, this.actionSpace[name]);
      if (c > best) {
        runner = best;
        runnerUp = bestName;
        best = c;
        bestName = name;
      } else if (c > runner) {
        runner = c;
        runnerUp = name;
      }
    }
    const margin = best - runner;
    const named = margin >= this.minMargin;
    return {
      action: named ? bestName : "UNDECIDED",
      cosine: best,
      margin,
      runnerUp,
      bound: named,
    };
  }

  decode(stateVector: ArrayLike<number>): ActionName | "UNDECIDED" {
    return this.decodeDetailed(stateVector).action;
  }

  computeOrthogonalityStats(): { min: number; max: number; mean: number } {
    const names = this.boundActions;
    const off: number[] = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        off.push(dot(this.actionSpace[names[i]], this.actionSpace[names[j]]));
      }
    }
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (const s of off) {
      if (s < min) min = s;
      if (s > max) max = s;
      sum += s;
    }
    return { min, max, mean: sum / off.length };
  }
}
