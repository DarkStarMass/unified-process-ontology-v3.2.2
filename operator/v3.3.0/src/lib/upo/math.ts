export function l2(v: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i] * v[i];
  return Math.sqrt(s);
}

export function dot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) {
    throw new Error(`dot: length ${a.length} != ${b.length}`);
  }
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const na = l2(a);
  const nb = l2(b);
  if (na < 1e-12 || nb < 1e-12) return 0;
  return dot(a, b) / (na * nb);
}

export function euclidean(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) {
    throw new Error(`euclidean: length ${a.length} != ${b.length}`);
  }
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

export function normalize(v: ArrayLike<number>): number[] {
  const n = l2(v);
  if (n < 1e-12) throw new Error("Zero-norm vector.");
  const o = new Array<number>(v.length);
  for (let i = 0; i < v.length; i++) o[i] = v[i] / n;
  return o;
}

/** Reference vector on S^(dim-1): every component 1/sqrt(dim). */
export function buildUnitGroundTruth(dim: number): number[] {
  if (!Number.isInteger(dim) || dim <= 0) {
    throw new Error("Dimension must be a strictly positive integer.");
  }
  const val = 1 / Math.sqrt(dim);
  return new Array<number>(dim).fill(val);
}

/** Half away from zero, 6 decimal places. Assumption A1. */
export function quantize6(x: number): number {
  if (!Number.isFinite(x)) throw new Error(`Cannot quantize non-finite value ${x}.`);
  return Math.round(x * 1e6) / 1e6;
}

export function softmax(scores: readonly number[]): number[] {
  if (scores.length === 0) throw new Error("softmax of empty scores");
  let max = -Infinity;
  for (const s of scores) {
    if (!Number.isFinite(s)) throw new Error("softmax requires finite scores");
    if (s > max) max = s;
  }
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function linspace(start: number, end: number, n: number): number[] {
  if (!Number.isInteger(n) || n <= 0) throw new Error("linspace n must be a positive integer");
  if (n === 1) return [start];
  const step = (end - start) / (n - 1);
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = start + step * i;
  return out;
}

/** PDF 3D layout for n = 20 is x = (i - 9.5) * 0.85. Generalized to arbitrary n. */
export function topologyPoint(i: number, n: number, post: number, dPre: number): { x: number; y: number; z: number } {
  return {
    x: (i - (n - 1) / 2) * 0.85,
    y: (post - 0.25) * 8,
    z: (dPre - 1.35) * 12,
  };
}
