/** Assumption A2: xoshiro128** + Box-Muller. Independent streams, not NumPy PCG64. */

function rotl(x: number, k: number): number {
  const u = x >>> 0;
  return ((u << k) | (u >>> (32 - k))) >>> 0;
}

function splitmix32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) >>> 0;
    let z = a;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
}

export const STREAM_SENSOR = 0x51e15001;
export const STREAM_SWARM = 0x53574112;
export const STREAM_ADAPTER = 0xada97e03;
/** Extra stream for the action-margin null distribution. Does not move the three streams above. */
export const STREAM_CALIB = 0xc411b004;

/** Map any integer seed into a uint32 stream seed. Correction C5. */
export function streamSeed(master: number, streamId: number): number {
  if (!Number.isInteger(master)) {
    throw new Error(`Seed must be an integer, got ${master}.`);
  }
  const sm = splitmix32(master >>> 0);
  let z = (sm() + Math.imul(streamId >>> 0, 0x9e3779b9)) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  return (z ^ (z >>> 16)) >>> 0;
}

export class SeededRng {
  private s: Uint32Array;
  private spare: number | null = null;

  constructor(seed: number) {
    const sm = splitmix32(seed >>> 0);
    this.s = new Uint32Array(4);
    do {
      this.s[0] = sm();
      this.s[1] = sm();
      this.s[2] = sm();
      this.s[3] = sm();
    } while ((this.s[0] | this.s[1] | this.s[2] | this.s[3]) === 0);
  }

  /** Test hook: exact state, not splitmix-expanded. */
  static fromState(s0: number, s1: number, s2: number, s3: number): SeededRng {
    const rng = Object.create(SeededRng.prototype) as SeededRng;
    rng.s = new Uint32Array([s0 >>> 0, s1 >>> 0, s2 >>> 0, s3 >>> 0]);
    rng.spare = null;
    if ((rng.s[0] | rng.s[1] | rng.s[2] | rng.s[3]) === 0) {
      throw new Error("xoshiro128** state must be non-zero.");
    }
    return rng;
  }

  nextUint32(): number {
    const s = this.s;
    const result = Math.imul(rotl(Math.imul(s[1], 5), 7), 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] = (s[2] ^ s[0]) >>> 0;
    s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0;
    s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0;
    s[3] = rotl(s[3], 11);
    return result;
  }

  /** [0, 1) */
  nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  uniform(a: number, b: number): number {
    return a + (b - a) * this.nextFloat();
  }

  normal(mean = 0, std = 1): number {
    if (!(std >= 0) || !Number.isFinite(std) || !Number.isFinite(mean)) {
      throw new Error(`normal(${mean}, ${std}) requires finite mean and std >= 0.`);
    }
    if (std === 0) return mean;
    if (this.spare !== null) {
      const z = this.spare;
      this.spare = null;
      return mean + std * z;
    }
    let u1 = 0;
    let u2 = 0;
    let guard = 0;
    while (u1 <= 0) {
      u1 = this.nextFloat();
      if (++guard > 64) throw new Error("RNG failed to produce a positive uniform.");
    }
    while (u2 <= 0) {
      u2 = this.nextFloat();
      if (++guard > 64) throw new Error("RNG failed to produce a positive uniform.");
    }
    const mag = Math.sqrt(-2 * Math.log(u1));
    const z0 = mag * Math.cos(2 * Math.PI * u2);
    this.spare = mag * Math.sin(2 * Math.PI * u2);
    return mean + std * z0;
  }
}
