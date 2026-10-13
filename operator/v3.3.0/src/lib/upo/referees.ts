import { euclidean } from "./math";
import type { State, UPOConfig } from "./types";

export class HostileReferees {
  constructor(readonly config: UPOConfig) {}

  critique(paths: readonly State[]): { critiqued: State[]; distances: number[] } {
    const gt = this.config.groundTruth;
    const critiqued: State[] = [];
    const distances: number[] = [];
    for (const p of paths) {
      if (p.vector.length !== gt.length) {
        throw new Error(`Dimension mismatch: path=${p.vector.length} != gt=${gt.length}`);
      }
      const dist = euclidean(p.vector, gt);
      const confidence = Math.max(0, p.confidence - dist * this.config.tolerance);
      critiqued.push({ vector: p.vector, lineage: p.lineage, confidence });
      distances.push(dist);
    }
    return { critiqued, distances };
  }
}
