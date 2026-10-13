# UPO Visualization – Companion to UnifiedProcessOntology v3.2.2
# Generates static plots of entropy damping, swarm paths, confidence and final collapse.
# Run: python upo_visualization.py
# Outputs: upo_entropy.png, upo_confidence.png, upo_vectors.png

import math
import random
import hashlib
import json
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import List, Dict
import matplotlib.pyplot as plt
import numpy as np

# ---------- Minimal core (aligned with v3.2.2) ----------

@dataclass
class MemoryManifold:
    access_log: List = field(default_factory=list)

    def append_transition(self, actor: str, action: str, state_vector: List[float]) -> str:
        quantized = [round(x, 6) for x in state_vector]
        state_hash = hashlib.sha256(str(quantized).encode()).hexdigest()[:16]
        self.access_log.append({"actor": actor, "action": action, "hash": state_hash})
        return state_hash

class ParasympatheticSwarm:
    def __init__(self, num_agents: int = 20, max_entropy_threshold: float = 0.85):
        self.num_agents = num_agents
        self.max_entropy_threshold = max_entropy_threshold

    def generate_and_dampen(self, base_vector: List[float], initial_entropy: float, manifold: MemoryManifold):
        paths = []
        entropy_history = []
        current_entropy = initial_entropy
        for i in range(self.num_agents):
            damped = False
            if current_entropy >= self.max_entropy_threshold:
                current_entropy *= 0.8
                damped = True
            entropy_history.append(current_entropy)

            if i == 0:
                variation = [-v if abs(v) > 0.001 else 0.0 for v in base_vector]
            else:
                variation = [v + random.uniform(-0.1, 0.1) * current_entropy for v in base_vector]

            conf = max(0.0, 1.0 - (current_entropy * 0.5))
            paths.append({"vector": variation, "confidence": conf, "damped": damped, "agent": i})
            manifold.append_transition(f"agent_{i}", "generate", variation)
            current_entropy += 0.05
        return paths, entropy_history

class HostileReferees:
    def critique(self, paths, ground_truth):
        out = []
        for p in paths:
            dist = math.sqrt(sum((a - b)**2 for a, b in zip(p["vector"], ground_truth)))
            penalty = dist * 0.3
            new_conf = max(0.0, p["confidence"] - penalty)
            out.append({**p, "confidence": new_conf, "distance": dist})
        return out

# ---------- Visualization ----------

def run_simulation():
    random.seed(42)
    manifold = MemoryManifold()
    swarm = ParasympatheticSwarm(num_agents=20)
    referees = HostileReferees()
    ground_truth = [1.0, 1.0, 1.0]

    # Simulated post-triage vector (3D example)
    base = [0.8, 0.3, -0.4]
    initial_entropy = 0.5

    paths, entropy_hist = swarm.generate_and_dampen(base, initial_entropy, manifold)
    critiqued = referees.critique(paths, ground_truth)
    winner = max(critiqued, key=lambda p: p["confidence"])

    # L2 normalize winner
    norm = math.sqrt(sum(x**2 for x in winner["vector"])) or 1.0
    final_vec = [x / norm for x in winner["vector"]]

    return {
        "base": base,
        "entropy": entropy_hist,
        "paths": critiqued,
        "winner": winner,
        "final": final_vec,
        "ground": ground_truth
    }

def plot_all(data):
    # 1. Entropy curve with damping markers
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(data["entropy"], color="#4da6ff", linewidth=2, label="Entropy")
    ax.axhline(0.85, color="orange", linestyle="--", alpha=0.7, label="Damping threshold")
    for i, e in enumerate(data["entropy"]):
        if data["paths"][i]["damped"]:
            ax.scatter(i, e, color="#66ccff", s=40, zorder=5)
    ax.set_title("Parasympathetic Swarm – Entropy Damping (Blue Aura)")
    ax.set_xlabel("Agent index")
    ax.set_ylabel("Entropy")
    ax.legend()
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig("upo_entropy.png", dpi=120)
    plt.close()

    # 2. Confidence after critique
    fig, ax = plt.subplots(figsize=(10, 4))
    confs = [p["confidence"] for p in data["paths"]]
    colors = ["#66ccff" if p["damped"] else "#8899aa" for p in data["paths"]]
    ax.bar(range(len(confs)), confs, color=colors)
    ax.set_title("Confidence after Hostile Referees (L2 penalty)")
    ax.set_xlabel("Agent")
    ax.set_ylabel("Confidence")
    ax.set_ylim(0, 1.05)
    fig.tight_layout()
    fig.savefig("upo_confidence.png", dpi=120)
    plt.close()

    # 3. Vector comparison (base vs winner vs final)
    fig, ax = plt.subplots(figsize=(8, 5))
    labels = ["Base", "Winner raw", "Final (L2)"]
    vecs = [data["base"], data["winner"]["vector"], data["final"]]
    x = np.arange(3)
    width = 0.25
    for i, (lab, vec) in enumerate(zip(labels, vecs)):
        ax.bar(x + i*width, vec, width, label=lab)
    ax.set_xticks(x + width)
    ax.set_xticklabels(["Dim 0", "Dim 1", "Dim 2"])
    ax.set_title("Vector states – Base → Winner → Collapsed")
    ax.legend()
    ax.grid(True, axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig("upo_vectors.png", dpi=120)
    plt.close()

    print("Plots saved:")
    print("  upo_entropy.png")
    print("  upo_confidence.png")
    print("  upo_vectors.png")
    print(f"Winner confidence: {data['winner']['confidence']:.3f}")
    print(f"Final vector: {[round(v, 4) for v in data['final']]}")

if __name__ == "__main__":
    data = run_simulation()
    plot_all(data)
