import { dot, l2 } from "./math";
import { STREAM_ADAPTER, SeededRng, streamSeed } from "./rng";
import { ACTION_NAMES, type ActionName, type ModalChannel } from "./types";

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
 * and decodes a state by cosine against 9 fast-orthogonal action vectors.
 * Biases b_* are the zero vector specified in the master, so Wx+b = Wx.
 */
export class SensorySemanticAdapter {
  static readonly ACTION_NAMES = ACTION_NAMES;
  private readonly wVisual: Float64Array;
  private readonly wAuditory: Float64Array;
  private readonly wHaptic: Float64Array;
  readonly actionSpace: Record<ActionName, Float64Array>;

  constructor(readonly targetDim: number, seed: number) {
    if (!Number.isInteger(targetDim) || targetDim <= 0) {
      throw new Error("Adapter targetDim must be a positive integer.");
    }
    const rng = new SeededRng(streamSeed(seed, STREAM_ADAPTER));
    this.wVisual = this.fillNormal(rng, targetDim * 16, 0.1);
    this.wAuditory = this.fillNormal(rng, targetDim * 8, 0.1);
    this.wHaptic = this.fillNormal(rng, targetDim * 6, 0.1);
    const space = {} as Record<ActionName, Float64Array>;
    for (const name of ACTION_NAMES) space[name] = this.unitGaussian(rng);
    this.actionSpace = space;
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
    return asUnitChannel(matVec(this.wHaptic, imuFeatures, this.targetDim, 6));
  }

  ingest(vis: ArrayLike<number>, aud: ArrayLike<number>, imu: ArrayLike<number>): Record<string, ModalChannel> {
    return {
      visual: this.embedVisual(vis),
      auditory: this.embedAuditory(aud),
      haptic: this.embedHaptic(imu),
    };
  }

  decodeDetailed(stateVector: ArrayLike<number>): { action: ActionName; cosine: number } {
    if (stateVector.length !== this.targetDim) {
      throw new Error(`decode: state dim ${stateVector.length} != ${this.targetDim}`);
    }
    let bestName: ActionName = ACTION_NAMES[0];
    let best = -Infinity;
    for (const name of ACTION_NAMES) {
      const c = dot(stateVector, this.actionSpace[name]);
      if (c > best) {
        best = c;
        bestName = name;
      }
    }
    return { action: bestName, cosine: best };
  }

  decode(stateVector: ArrayLike<number>): ActionName {
    return this.decodeDetailed(stateVector).action;
  }

  computeOrthogonalityStats(): { min: number; max: number; mean: number } {
    const names = ACTION_NAMES;
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
