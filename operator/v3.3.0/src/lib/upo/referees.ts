import { euclidean, l2, normalize } from "./math";
import type { State, UPOConfig } from "./types";

export class HostileReferees {
  constructor(readonly config: UPOConfig) {}

  /**
   * Confidence uses the direction on the unit sphere (C7).
   * `distances` stays the raw Euclidean length so telemetry and the 3D view do not move.
   * A zero vector has no direction; its sphere distance is the sphere diameter 2.
   */
  critique(paths: readonly State[]): { critiqued: State[]; distances: number[]; sphereDistances: number[] } {
    const gt = this.config.groundTruth;
    const critiqued: State[] = [];
    const distances: number[] = [];
    const sphereDistances: number[] = [];
    for (const p of paths) {
      if (p.vector.length !== gt.length) {
        throw new Error(`Dimension mismatch: path=${p.vector.length} != gt=${gt.length}`);
      }
      const raw = euclidean(p.vector, gt);
      const sphere = l2(p.vector) < 1e-12 ? 2 : euclidean(normalize(p.vector), gt);
      const confidence = Math.max(0, p.confidence - sphere * this.config.tolerance);
      critiqued.push({
        vector: p.vector,
        lineage: p.lineage,
        confidence,
        isInversionProbe: p.isInversionProbe,
      });
      distances.push(raw);
      sphereDistances.push(sphere);
    }
    return { critiqued, distances, sphereDistances };
  }
}