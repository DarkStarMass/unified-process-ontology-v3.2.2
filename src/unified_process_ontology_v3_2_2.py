# Python 3.11+ | hashlib, json, dataclasses, math, random
from dataclasses import dataclass, field, asdict
from typing import List, Dict
import hashlib
import json
import math
import random
from datetime import datetime, timezone
from enum import Enum

class LayerType(str, Enum):
    SALIENCE = "salience"           
    GENESIS = "genesis"             
    REFLECTION = "reflection"       
    PARASYMPATHETIC = "parasympathetic" 
    ALIGNMENT = "alignment"
    COGNITIVE = "cognitive"

@dataclass(frozen=True)
class AccessLogEntry:
    timestamp: str
    actor: str
    action: str
    target_state_hash: str
    prev_hash: str = ""

    def compute_hash(self) -> str:
        canonical_data = json.dumps(asdict(self), sort_keys=True).encode('utf-8')
        return hashlib.sha256(canonical_data).hexdigest()

@dataclass
class MemoryManifold:
    version: str = "3.2.2" # + Continuous Parasympathetic Swarm Damping
    access_log: List[AccessLogEntry] = field(default_factory=list)

    def append_transition(self, actor: str, action: str, state_vector: List[float]) -> str:
        timestamp = datetime.now(timezone.utc).isoformat()
        prev_hash = self.access_log[-1].compute_hash() if self.access_log else "0x0_genesis_state"
        quantized = [round(x, 6) for x in state_vector]
        state_hash = hashlib.sha256(str(quantized).encode()).hexdigest()[:16]

        new_entry = AccessLogEntry(
            timestamp=timestamp, actor=actor, action=action, 
            target_state_hash=state_hash, prev_hash=prev_hash
        )
        self.access_log.append(new_entry)
        return new_entry.compute_hash()

@dataclass(frozen=True)
class State:
    vector: List[float]
    lineage: str = ""
    confidence: float = 1.0 

# ==========================================
# NEU: Integrierte Schwarm-Generierung mit aktiver Dämpfung
# ==========================================

class ParasympatheticSwarm:
    """Generiert divergente Lösungswege unter kontinuierlicher Überwachung (Blaue Aura)."""
    def __init__(self, num_agents: int = 5, max_entropy_threshold: float = 0.85):
        self.num_agents = num_agents
        self.max_entropy_threshold = max_entropy_threshold

    def generate_and_dampen(self, base_vector: List[float], initial_entropy: float, manifold: MemoryManifold) -> List[State]:
        paths = []
        current_entropy = initial_entropy

        for i in range(self.num_agents):
            # 1. Präventiver Dämpfer-Check (Die sanfte blaue Aura) IN der Schleife
            if current_entropy >= self.max_entropy_threshold:
                action = f"Swarm Panik-Gefahr bei Sub-Agent {i} gedämpft."
                # Dämpfungseffekt: Reduziere die Entropie (Multiplikative Kühlung)
                current_entropy *= 0.8
            else:
                action = f"Swarm Agent {i} normaler Zustand."

            # 2. Generiere einen leicht variierten Vektor (Divergenz)
            if i == 0:
                # Agent 0 nutzt die "Dual Use of Inertia" (Perspektivenwechsel durch Invertierung)
                # Mathematische Sicherung gegen Division by Zero oder das Invertieren absoluter Nullen
                variation = [-v if abs(v) > 0.001 else 0.0 for v in base_vector]
            else:
                # Die Streuung skaliert mit der aktuellen Entropie (mehr Stress = wildere Gedanken)
                variation = [v + random.uniform(-0.1, 0.1) * current_entropy for v in base_vector]
            
            # 3. Speichern und Zuweisen der Konfidenz
            lineage_hash = manifold.append_transition(f"agent_{i}", action, variation)
            
            # Konfidenz sinkt proportional zur Systemlast
            current_confidence = max(0.0, 1.0 - (current_entropy * 0.5))
            paths.append(State(vector=variation, lineage=lineage_hash, confidence=current_confidence))
            
            # Entropie erhöht sich leicht mit jedem neuen, ungedämpften Agenten (Lineares Wachstum)
            current_entropy += 0.05
            
        return paths

class HostileReferees:
    """Der innere Kritiker: Zerlegt rohe Vektoren objektiv anhand der Distanz zur Ground Truth."""
    def __init__(self, tolerance: float = 0.3):
        self.tolerance = tolerance 

    def critique(self, paths: List[State], ground_truth: List[float]) -> List[State]:
        critiqued_paths = []
        for path in paths:
            # L2-Distanz zur sozialen/ethischen Norm
            distance = math.sqrt(sum((p - g)**2 for p, g in zip(path.vector, ground_truth)))
            penalty = distance * self.tolerance
            new_confidence = max(0.0, path.confidence - penalty)
            critiqued_paths.append(State(vector=path.vector, confidence=new_confidence, lineage=path.lineage))
        return critiqued_paths

# ==========================================
# BESTAND: Die Kern-Architektur
# ==========================================
class ContextRevisor:
    def __init__(self):
        self.base_weights: Dict[str, float] = {"visual": 1.0, "auditory": 0.8, "haptic": 1.2}

class SensoryTriageAgent:
    def __init__(self, revisor: ContextRevisor, manifold: MemoryManifold):
        self.revisor = revisor
        self.manifold = manifold

    def _l2_norm(self, vec: List[float]) -> float:
        return math.sqrt(sum(x**2 for x in vec))

    def process_overload(self, sensory_inputs: Dict[str, List[float]]) -> State:
        relevances = {sense: self.revisor.base_weights.get(sense, 1.0) * self._l2_norm(vec) 
                      for sense, vec in sensory_inputs.items()}
        max_rel = max(relevances.values()) if relevances else 0.0
        exp_rels = {s: math.exp(r - max_rel) for s, r in relevances.items()}
        sum_exp = sum(exp_rels.values())
        acute_weights = {s: e / sum_exp for s, e in exp_rels.items()}
        
        vec_len = len(next(iter(sensory_inputs.values())))
        merged_vec = [sum(acute_weights[s] * sensory_inputs[s][i] for s in sensory_inputs) for i in range(vec_len)]
        
        hash_ref = self.manifold.append_transition(LayerType.SALIENCE.upper(), "Sensory Triage applied", merged_vec)
        return State(vector=merged_vec, lineage=hash_ref)

class SemanticResonanceBase:
    def __init__(self):
        self.ground_truth = [1.0, 1.0, 1.0] # Angepasst an deinen Colab-Test

class UnifiedProcessOntology:
    def __init__(self, manifold: MemoryManifold):
        self.manifold = manifold
        self.resonance = SemanticResonanceBase()
        self.triage_agent = SensoryTriageAgent(ContextRevisor(), self.manifold)
        self.swarm = ParasympatheticSwarm(num_agents=20, max_entropy_threshold=0.85) # Wie in deinem Colab
        self.referees = HostileReferees()

    def perceive_and_execute(self, raw_sensory_inputs: Dict[str, List[float]], 
                             system_entropy: float = 0.5) -> State:
        
        self.manifold.append_transition("SYSTEM", "Environment Scan Initiated", [0.0, 0.0, 0.0])
        
        # 1. Triage der Reize
        current = self.triage_agent.process_overload(raw_sensory_inputs)
        
        # 2. Genesis & Dämpfung (Verschmolzen): Die blaue Aura überwacht die Gedanken-Splitter
        paths = self.swarm.generate_and_dampen(current.vector, system_entropy, self.manifold)
        
        # 3. Reflection: Metakognition zerlegt das Ergebnis
        critiqued_paths = self.referees.critique(paths, self.resonance.ground_truth)
        
        # 4. Collapse: Konvergenz auf den sichersten/besten Pfad (höchste Konfidenz)
        winner = max(critiqued_paths, key=lambda p: p.confidence)
        
        action = f"Referees selected optimal path (Confidence {winner.confidence:.2f})"
        hash_ref = self.manifold.append_transition(LayerType.REFLECTION.upper(), action, winner.vector)
        
        final_state = self._collapse(State(vector=winner.vector, lineage=hash_ref))
        return final_state

    def _collapse(self, s: State) -> State:
        norm = math.sqrt(sum(x**2 for x in s.vector)) or 1.0
        new_vec = [x / norm for x in s.vector]
        hash_ref = self.manifold.append_transition(LayerType.COGNITIVE.upper(), "L2 Normalization", new_vec)
        return State(vector=new_vec, lineage=hash_ref)

# --- Execution Test ---
if __name__ == "__main__":
    manifold = MemoryManifold()
    upo = UnifiedProcessOntology(manifold)
    
    sensory_inputs = {
        "visual":   [1.0, 0.5, -0.2],
        "auditory": [2.5, -1.0, 3.0], 
    }
    
    # Start mit der initialen Entropie von 0.5 aus deinem Colab-Szenario
    final_state = upo.perceive_and_execute(raw_sensory_inputs=sensory_inputs, system_entropy=0.5)
    
    print(f"Terminal Vector: {final_state.vector}\n")
    print("--- Letzte Log-Einträge ---")
    for entry in manifold.access_log[-5:]:
        print(f"[{entry.actor}] {entry.action} -> Konfidenz-Audit gespeichert.")
