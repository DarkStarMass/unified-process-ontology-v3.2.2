# UPO v3.2.6 – Improvements applied to v3.2.5
# Changes: deterministic action space, distance logging, configurable GT, inversion metric, stability proxy
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Deque, Any
from collections import deque
import hashlib, json, math, random
from datetime import datetime, timezone
from enum import Enum
import numpy as np

class LayerType(str, Enum):
    SALIENCE = "salience"
    GENESIS = "genesis"
    REFLECTION = "reflection"
    PARASYMPATHETIC = "parasympathetic"
    ALIGNMENT = "alignment"
    COGNITIVE = "cognitive"

@dataclass(frozen=True)
class UPOConfig:
    num_agents: int = 20
    base_stress_threshold: float = 0.85
    emergency_stress_threshold: float = 0.50
    stress_activation_limit: float = 0.30
    tolerance: float = 0.3
    ground_truth: List[float] = field(default_factory=lambda: [1.0] * 512)
    seed: Optional[int] = 42
    max_log_size: int = 1000
    enable_inertia_inversion: bool = True
    latent_dim: int = 512

@dataclass(frozen=True)
class AccessLogEntry:
    timestamp: str
    actor: str
    action: str
    target_state_hash: str
    prev_hash: str = ""
    def compute_hash(self) -> str:
        return hashlib.sha256(json.dumps(asdict(self), sort_keys=True).encode()).hexdigest()

@dataclass
class MemoryManifold:
    config: UPOConfig
    version: str = "3.2.6"
    access_log: Deque[AccessLogEntry] = field(init=False)
    def __post_init__(self):
        self.access_log = deque(maxlen=self.config.max_log_size)
    def append_transition(self, actor: str, action: str, state_vector: List[float]) -> str:
        prev = self.access_log[-1].compute_hash() if self.access_log else "0x0_genesis"
        quantized = [round(x, 6) for x in state_vector]
        h = hashlib.sha256(str(quantized).encode()).hexdigest()[:16]
        entry = AccessLogEntry(datetime.now(timezone.utc).isoformat(), actor, action, h, prev)
        self.access_log.append(entry)
        return entry.compute_hash()

@dataclass(frozen=True)
class State:
    vector: List[float]
    lineage: str = ""
    confidence: float = 1.0

class DynamicStressRegulator:
    def __init__(self, config: UPOConfig):
        self.config = config
        self.current_threshold = config.base_stress_threshold
    def evaluate_environment(self, env_stress: float) -> float:
        if env_stress >= self.config.stress_activation_limit:
            self.current_threshold = self.config.emergency_stress_threshold
        else:
            self.current_threshold = self.config.base_stress_threshold
        return self.current_threshold

class ParasympatheticSwarm:
    def __init__(self, config: UPOConfig):
        self.config = config
        self.rng = random.Random(config.seed) if config.seed is not None else random.Random()
    def generate_and_dampen(self, base: List[float], initial_stress: float, threshold: float, manifold: MemoryManifold) -> List[State]:
        paths, current, interventions = [], initial_stress, 0
        for i in range(self.config.num_agents):
            if current >= threshold:
                current *= 0.8
                interventions += 1
                action = f"damped@{threshold}"
            else:
                action = f"normal_{i}"
            if i == 0 and self.config.enable_inertia_inversion:
                variation = [-v if abs(v) > 1e-3 else 0.0 for v in base]
            else:
                variation = [v + self.rng.uniform(-0.1, 0.1) * current for v in base]
            h = manifold.append_transition(f"agent_{i}", action, variation)
            conf = max(0.0, 1.0 - current * 0.5)
            paths.append(State(variation, h, conf))
            current += 0.05
        manifold.append_transition("PARASYMPATHETIC", f"interventions={interventions}", [0.0]*self.config.latent_dim)
        return paths

class HostileReferees:
    def __init__(self, config: UPOConfig):
        self.config = config
    def critique(self, paths: List[State]) -> List[State]:
        gt = self.config.ground_truth
        out = []
        for p in paths:
            if len(p.vector) != len(gt):
                raise ValueError("Dimension mismatch")
            dist = math.sqrt(sum((a-b)**2 for a, b in zip(p.vector, gt)))
            out.append(State(p.vector, p.lineage, max(0.0, p.confidence - dist * self.config.tolerance)))
        return out

class ContextRevisor:
    def __init__(self):
        self.base_weights = {"visual": 1.0, "auditory": 0.8, "haptic": 1.2}

class SensoryTriageAgent:
    def __init__(self, revisor: ContextRevisor, manifold: MemoryManifold):
        self.revisor = revisor
        self.manifold = manifold
    def _l2(self, v): return math.sqrt(sum(x*x for x in v))
    def process_overload(self, inputs: Dict[str, List[float]]) -> State:
        if not inputs: raise ValueError("empty")
        lens = {len(v) for v in inputs.values()}
        if len(lens) > 1: raise ValueError("inconsistent dim")
        rel = {k: self.revisor.base_weights.get(k, 1.0) * self._l2(v) for k, v in inputs.items()}
        m = max(rel.values())
        exp = {k: math.exp(r - m) for k, r in rel.items()}
        s = sum(exp.values())
        w = {k: e/s for k, e in exp.items()}
        dim = lens.pop()
        merged = [sum(w[k]*inputs[k][i] for k in inputs) for i in range(dim)]
        h = self.manifold.append_transition(LayerType.SALIENCE.upper(), "triage", merged)
        return State(merged, h)

class UnifiedProcessOntology:
    def __init__(self, config: UPOConfig):
        self.config = config
        self.manifold = MemoryManifold(config)
        self.regulator = DynamicStressRegulator(config)
        self.triage = SensoryTriageAgent(ContextRevisor(), self.manifold)
        self.swarm = ParasympatheticSwarm(config)
        self.referees = HostileReferees(config)
    def perceive_and_execute(self, inputs: Dict[str, List[float]], internal: float, env: float) -> State:
        thr = self.regulator.evaluate_environment(env)
        self.manifold.append_transition("SYSTEM", f"env={env:.2f}->thr={thr}", [0.]*self.config.latent_dim)
        current = self.triage.process_overload(inputs)
        paths = self.swarm.generate_and_dampen(current.vector, internal, thr, self.manifold)
        crit = self.referees.critique(paths)
        winner = max(crit, key=lambda p: p.confidence)
        gt = self.config.ground_truth
        dist_pre = math.sqrt(sum((a-b)**2 for a, b in zip(winner.vector, gt)))
        print(f"[LOG] Winner distance before collapse: {dist_pre:.6f}")
        h = self.manifold.append_transition(LayerType.REFLECTION.upper(), f"winner conf={winner.confidence:.3f}", winner.vector)
        final = self._collapse(State(winner.vector, h, winner.confidence))
        dist_post = math.sqrt(sum((a-b)**2 for a, b in zip(final.vector, gt)))
        print(f"[LOG] Distance after collapse: {dist_post:.6f}")
        print(f"[LOG] Stability proxy: {1.0/(1.0+dist_post):.6f}")
        return final
    def _collapse(self, s: State) -> State:
        n = math.sqrt(sum(x*x for x in s.vector)) or 1.0
        nv = [x/n for x in s.vector]
        h = self.manifold.append_transition(LayerType.COGNITIVE.upper(), "L2", nv)
        return State(nv, h, s.confidence)

class SensorySemanticAdapter:
    def __init__(self, target_dim: int, rng: random.Random):
        self.target_dim = target_dim
        self.rng = rng
        self._init_haptic(6)
        self.action_space = {name: self._unit() for name in [
            "PROMPT_LLM_CAUTION","MOTOR_STOP_IMMEDIATELY","MOTOR_PROCEED_GENTLY",
            "MOTOR_TURN_LEFT","MOTOR_TURN_RIGHT","ACTIVATE_WARNING_LIGHTS",
            "SYSTEM_RECALIBRATE","EXTERNAL_OVERRIDE_EMERGENCY","EXTERNAL_NAVIGATE_HOME"]}
    def _init_haptic(self, d):
        np.random.seed(self.rng.randint(0, 10**5))
        self.W = np.random.randn(self.target_dim, d)*0.1
        self.b = np.zeros(self.target_dim)
    def _unit(self):
        v = np.random.randn(self.target_dim)
        return v / np.linalg.norm(v)
    def _norm(self, v):
        n = np.linalg.norm(v)
        return [0.]*self.target_dim if n < 1e-8 else (v/n).tolist()
    def embed_visual(self, _): return self._norm(np.random.randn(self.target_dim))
    def embed_auditory(self, _): return self._norm(np.random.randn(self.target_dim))
    def embed_haptic(self, imu): return self._norm(self.W @ imu + self.b)
    def ingest(self, v, a, i):
        return {"visual": self.embed_visual(v), "auditory": self.embed_auditory(a), "haptic": self.embed_haptic(i)}
    def decode(self, state):
        vec = np.array(state)
        return max(self.action_space.items(), key=lambda kv: np.dot(vec, kv[1]))[0]

if __name__ == "__main__":
    print("--- UPO 3.2.6 ---")
    seed = 42
    np.random.seed(seed)
    cfg = UPOConfig(seed=seed)
    upo = UnifiedProcessOntology(cfg)
    ad = SensorySemanticAdapter(cfg.latent_dim, random.Random(seed))
    inputs = ad.ingest(None, None, np.array([9.81,0,0,0,0,0]))
    final = upo.perceive_and_execute(inputs, 0.42, 0.32)
    print("Action:", ad.decode(final.vector))
    print("Final confidence:", final.confidence)
