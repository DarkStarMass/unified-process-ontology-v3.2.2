import { quantize6 } from "./math";
import { sha256Hex } from "./sha256";
import { GENESIS_ANCHOR, type AccessLogEntry, type Clock, type UPOConfig } from "./types";

function canonicalEntry(entry: AccessLogEntry): string {
  return (
    `{"action":${JSON.stringify(entry.action)},` +
    `"actor":${JSON.stringify(entry.actor)},` +
    `"prev_hash":${JSON.stringify(entry.prevHash)},` +
    `"target_state_hash":${JSON.stringify(entry.targetStateHash)},` +
    `"timestamp":${JSON.stringify(entry.timestamp)}}`
  );
}

export function entryHash(entry: AccessLogEntry): string {
  return sha256Hex(canonicalEntry(entry));
}

export function stateHash(vector: readonly number[]): string {
  const quantized = vector.map((x) => quantize6(x));
  return sha256Hex(JSON.stringify(quantized)).slice(0, 16);
}

export function utcNow(): string {
  return new Date().toISOString();
}

/** Assumption A3. */
export function logicalClock(startIso = "2026-01-01T00:00:00.000Z"): Clock {
  let step = 0;
  const origin = Date.parse(startIso);
  if (Number.isNaN(origin)) throw new Error(`logicalClock: bad origin ${startIso}`);
  return () => {
    const stamp = new Date(origin + step * 1000).toISOString();
    step += 1;
    return stamp;
  };
}

/**
 * O(1) append ring buffer with SHA-256 lineage.
 * Correction C4: oldest.prev must match the anchor, and the newest hash is pinned.
 */
export class MemoryManifold {
  readonly version = "3.3.0-Master";
  private readonly buf: AccessLogEntry[];
  private head = 0;
  private len = 0;
  private anchor = GENESIS_ANCHOR;
  private headHash: string | null = null;
  private readonly clock: Clock;

  constructor(
    readonly config: UPOConfig,
    clock: Clock = utcNow,
  ) {
    this.buf = new Array<AccessLogEntry>(config.maxLogSize);
    this.clock = clock;
  }

  get size(): number {
    return this.len;
  }

  entries(): AccessLogEntry[] {
    const out: AccessLogEntry[] = [];
    for (let i = 0; i < this.len; i++) {
      out.push(this.buf[(this.head + i) % this.buf.length]);
    }
    return out;
  }

  appendTransition(actor: string, action: string, stateVector: readonly number[]): string {
    const prev = this.headHash ?? GENESIS_ANCHOR;
    const entry: AccessLogEntry = {
      timestamp: this.clock(),
      actor,
      action,
      targetStateHash: stateHash(stateVector),
      prevHash: prev,
    };
    const hash = entryHash(entry);
    const cap = this.buf.length;
    if (this.len < cap) {
      this.buf[(this.head + this.len) % cap] = entry;
      this.len += 1;
    } else {
      const dropped = this.buf[this.head];
      this.anchor = entryHash(dropped);
      this.buf[this.head] = entry;
      this.head = (this.head + 1) % cap;
    }
    this.headHash = hash;
    return hash;
  }

  verifyChainIntegrity(): boolean {
    const list = this.entries();
    if (list.length === 0) return this.headHash === null && this.anchor === GENESIS_ANCHOR;
    if (list[0].prevHash !== this.anchor) return false;
    for (let i = 1; i < list.length; i++) {
      if (list[i].prevHash !== entryHash(list[i - 1])) return false;
    }
    return this.headHash === entryHash(list[list.length - 1]);
  }
}
