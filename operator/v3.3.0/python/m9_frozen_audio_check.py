"""Correction C14. The PDF Python master is frozen as a historical specification.

This file does not reimplement the ontology. It only shows the two measured
defects that can be checked without that source:

1. math.cos on a NumPy array raises TypeError; np.cos does not.
2. Subtracting gravity drops the IMU cosine between env 0.2 and 1.5 below 0.95.

The executable reference is the TypeScript kernel.
"""

import math

import numpy as np


def math_cos_rejects_array() -> bool:
    freqs = np.arange(1, 9, dtype=float)
    try:
        math.cos(0.32 * freqs)
    except TypeError:
        return True
    return False


def corrected_audio(env_stress: float, noise_level: float, rng: np.random.Generator) -> np.ndarray:
    freqs = np.arange(1, 9, dtype=float)
    return (0.15 / freqs) * np.cos(env_stress * freqs) + rng.normal(0.0, 0.015 * (1.0 + noise_level), 8)


def imu(env_stress: float, noise_level: float = 0.42) -> tuple[np.ndarray, np.ndarray]:
    raw = np.array(
        [
            9.81,
            0.05 * env_stress,
            -0.03 * env_stress,
            0.01 * noise_level,
            -0.01 * noise_level,
            0.02 * env_stress,
        ],
        dtype=float,
    )
    return raw, raw - np.array([9.81, 0.0, 0.0, 0.0, 0.0, 0.0])


def main() -> None:
    assert math_cos_rejects_array(), "math.cos(ndarray) must raise TypeError"
    audio = corrected_audio(0.32, 0.42, np.random.default_rng(42))
    assert audio.shape == (8,) and np.all(np.isfinite(audio))

    raw_low, dev_low = imu(0.2)
    raw_high, dev_high = imu(1.5)
    raw_cos = float(np.dot(raw_low, raw_high) / (np.linalg.norm(raw_low) * np.linalg.norm(raw_high)))
    dev_cos = float(np.dot(dev_low, dev_high) / (np.linalg.norm(dev_low) * np.linalg.norm(dev_high)))
    assert raw_cos > 0.999, raw_cos
    assert dev_cos < 0.95, dev_cos
    print(f"M9 frozen check ok  raw_cos={raw_cos:.6f}  deviation_cos={dev_cos:.6f}")


if __name__ == "__main__":
    main()
