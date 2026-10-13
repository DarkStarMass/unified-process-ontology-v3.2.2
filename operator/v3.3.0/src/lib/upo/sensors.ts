import { linspace } from "./math";
import { STREAM_SENSOR, SeededRng, streamSeed } from "./rng";

export type RawSensors = {
  visual: Float64Array;
  auditory: Float64Array;
  imu: Float64Array;
};

/**
 * Deterministic raw sensors.
 * Vision 16D, audio 8D octave bands, IMU 6D [ax, ay, az, gx, gy, gz]
 * with gravity ax = 9.81 m/s^2. Noise is an independent argument (correction C2).
 */
export class DeterministicSensorSynthesizer {
  static synthesize(envStress = 0.32, noiseLevel = 0.42, seed = 42): RawSensors {
    if (!Number.isFinite(envStress) || !Number.isFinite(noiseLevel)) {
      throw new Error("Sensor synthesis requires finite envStress and noiseLevel.");
    }
    if (noiseLevel < 0) throw new Error("noiseLevel must be >= 0.");
    if (!Number.isInteger(seed)) throw new Error("Sensor seed must be an integer.");

    const rng = new SeededRng(streamSeed(seed, STREAM_SENSOR));
    const visStd = 0.02 * (1 + noiseLevel);
    const audStd = 0.015 * (1 + noiseLevel);
    const phase = linspace(0.1, 1.0, 16);
    const visual = new Float64Array(16);
    for (let i = 0; i < 16; i++) {
      visual[i] = Math.sin(phase[i] * Math.PI + envStress) + rng.normal(0, visStd);
    }
    const auditory = new Float64Array(8);
    for (let i = 0; i < 8; i++) {
      const freq = i + 1;
      auditory[i] = (0.15 / freq) * Math.cos(envStress * freq) + rng.normal(0, audStd);
    }
    const imu = new Float64Array([
      9.81,
      0.05 * envStress,
      -0.03 * envStress,
      0.01 * noiseLevel,
      -0.01 * noiseLevel,
      0.02 * envStress,
    ]);
    return { visual, auditory, imu };
  }
}
