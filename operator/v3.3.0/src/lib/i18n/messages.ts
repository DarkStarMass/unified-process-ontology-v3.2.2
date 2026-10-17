import type { ActionName } from "@/lib/upo/types";

export const LOCALES = ["de", "en", "fr", "it"] as const;
export type Locale = (typeof LOCALES)[number];

export const HTML_LANG: Record<Locale, string> = {
  de: "de",
  en: "en",
  fr: "fr",
  it: "it",
};

export const ENDONYM: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
  it: "Italiano",
};

export function isLocale(value: unknown): value is Locale {
  return value === "de" || value === "en" || value === "fr" || value === "it";
}

type Actions = Record<ActionName, string>;

export type Messages = {
  language: string;
  lede: string;
  controls: string;
  restoredAside: string;
  defaultsAside: string;
  env: string;
  internal: string;
  noise: string;
  damping: string;
  tolerance: string;
  increment: string;
  seed: string;
  agents: string;
  inversion: string;
  gtCalm: string;
  gtNote: string;
  quality: string;
  qualityNote: string;
  stressGt: string;
  tolWarn: string;
  tolCrit: string;
  tolHead: string;
  diversity: string;
  usedMargin: string;
  run: string;
  running: string;
  checks: string;
  checking: string;
  stress: string;
  stressBusy: string;
  multi: string;
  multiBusy: string;
  grid: string;
  gridBusy: string;
  agentCsv: string;
  stressCsv: string;
  json: string;
  replay: string;
  replayOk: string;
  replayBad: string;
  restoredNote: string;
  telemetry: string;
  chainOk: string;
  chainBad: string;
  booting: string;
  threshold: string;
  interventions: string;
  dist: string;
  proxy: string;
  inv: string;
  confWinner: string;
  winner: string;
  action: string;
  margin: string;
  sphere: string;
  degenerate: string;
  probe: string;
  actionPlaceholder: string;
  unbound: string;
  undecided: string;
  lineage: string;
  ortho: string;
  flat: string;
  hapticNote: string;
  computing: string;
  formulaWhen: string;
  formulaConf: string;
  formulaProxy: string;
  topology: string;
  orbit: string;
  topoBody: string;
  aria: string;
  referee: string;
  refereeAside: string;
  before: string;
  after: string;
  diag: string;
  deviation: string;
  diagRunning: string;
  diagWait: string;
  ok: string;
  fail: string;
  audit: string;
  auditEmpty: string;
  stressTitle: string;
  stressAside: string;
  stability: string;
  confidence: string;
  stressEmpty: string;
  multiTitle: string;
  multiEmpty: string;
  gridTitle: string;
  gridAside: string;
  gridEmpty: string;
  notes: string;
  modality: { visual: string; auditory: string; haptic: string; quality: string };
  actions: Actions;
  cols: {
    seed: string;
    win: string;
    dPre: string;
    dPost: string;
    proxy: string;
    conf: string;
    inv: string;
    action: string;
    damping: string;
    increment: string;
    interventions: string;
  };
  csvAgent: string;
  csvStress: string;
  checks8: Record<number, { name: string; ok: string }>;
  notesText: Record<string, string>;
};

const de: Messages = {
  language: "Sprache",
  lede: "Salienz, parasympathischer Schwarm, Hostile Referees und 9-Aktions-Dekodierung. Jeder Lauf schreibt eine SHA-256-Lineage. Kein abgeschnittener Kernel.",
  controls: "Steuerung",
  restoredAside: "Letzte Einstellung geladen",
  defaultsAside: "Master-Defaults",
  env: "Umgebung",
  internal: "Interner Stress",
  noise: "Sensorrauschen",
  damping: "Dämpfung",
  tolerance: "Toleranz",
  increment: "Inkrement",
  seed: "Seed",
  agents: "Agenten",
  inversion: "Trägheitsinversion Agent 0",
  gtCalm: "Ground Truth = Ruhe-Referenz",
  gtNote: "Gleichverteilt ist ein willkürlicher Einheitsvektor. Ruhe-Referenz bedeutet Abweichung vom Ruhezustand (Umgebung 0.2, Rauschen 0.1, interner Stress 0), berechnet mit demselben Adapter. Das ist eine Annahme, keine gemessene Wahrheit.",
  quality: "Qualitätskanal",
  qualityNote: "Fehlversuch C21, standardmäßig aus. Drei Merkmale aus der zweiten Differenz, Prior 0.6. Der Konsens-Kosinus zwischen Rauschen 0.1 und 3.0 bleibt 0.9807 bis 0.9865. Ziel war unter 0.9.",
  stressGt: "Stresstest-Export: Ruhe-Referenz",
  tolWarn: "Ab Toleranz {crit} löscht der Referee alle Konfidenzen.",
  tolCrit: "Kritische Toleranz",
  tolHead: "Headroom",
  diversity: "Schwarmvielfalt",
  usedMargin: "Margenschwelle",
  run: "Lauf",
  running: "Rechnet",
  checks: "8 Prüfungen",
  checking: "Prüft",
  stress: "Stresstest 50",
  stressBusy: "50 Läufe",
  multi: "Multi-Seed",
  multiBusy: "5 Seeds",
  grid: "Dämpfungsgitter",
  gridBusy: "9 Läufe",
  agentCsv: "Agenten-CSV",
  stressCsv: "Stress-CSV",
  json: "JSON",
  replay: "JSON prüfen",
  replayOk: "Der exportierte Lauf reproduziert dieselben Metriken.",
  replayBad: "Reproduktion weicht ab.",
  restoredNote: "Die Regler kommen aus dem letzten Besuch. Die Telemetrie bleibt das Master-Protokoll, bis du einen Lauf startest.",
  telemetry: "Telemetrie",
  chainOk: "Kette intakt",
  chainBad: "Kette gebrochen",
  booting: "Kern startet",
  threshold: "Schwelle",
  interventions: "Interventionen",
  dist: "d vor / nach Collapse",
  proxy: "Stabilitätsproxy",
  inv: "Inversion Agent 0",
  confWinner: "Konfidenz Gewinner",
  winner: "Gewinner",
  action: "Aktion",
  margin: "Marge",
  sphere: "d Sphäre (Gewinner)",
  degenerate: "Degeneriert: die beste wählbare Konfidenz ist ≤ 0. Der Gleichstand wird markiert, die Sonde entscheidet nicht.",
  probe: "Sonde",
  actionPlaceholder: "Platzhalter, keine gemessene Motorik. Drei Namen sind an Umgebungen gebunden: MOTOR_PROCEED_GENTLY bei 0.2, PROMPT_LLM_CAUTION bei 0.8, MOTOR_STOP_IMMEDIATELY bei 1.4. Sechs Namen sind ungebunden und werden nicht decodiert. Unter der Marge steht UNDECIDED.",
  unbound: "Ungebunden, kein Decode",
  undecided: "keine ausreichende Marge",
  lineage: "Lineage",
  ortho: "Orthogonalität",
  flat: "Alle wählbaren Pfade liegen nach dem Referee auf Konfidenz 0.",
  hapticNote: "Eine Modalität trägt fast die ganze Salienz. Seit C8 ist die Gravitation abgezogen, seit C9 geht log1p(Energie) in die Softmax.",
  computing: "Acht Prüfungen und der Master-Lauf werden gerade gerechnet.",
  formulaWhen: "thr = 0.50 wenn env ≥ 0.30, sonst 0.85",
  formulaConf: "conf′ = max(0, conf − d(v/‖v‖, g) · tol)",
  formulaProxy: "proxy = 1 / (1 + d nach Collapse)",
  topology: "Topologie",
  orbit: "Ziehen dreht, Rad zoomt",
  topoBody: "x ist der Agentenindex, y die Konfidenz nach dem Referee, z die euklidische Distanz vor dem Collapse. Hell ist gedämpft, die größere Kugel ist der Gewinner.",
  aria: "Drehbare 3D-Topologie der Agenten. Horizontal Konfidenz, Tiefe Distanz vor dem Collapse.",
  referee: "Referee",
  refereeAside: "Hell vor, Stahl nach, Grün Gewinner",
  before: "Vor Referee",
  after: "Nach Referee",
  diag: "Diagnostik",
  deviation: "Abweichung",
  diagRunning: "läuft",
  diagWait: "Die acht Masterprüfungen laufen auf einem frischen Kern mit Seed 42.",
  ok: "OK",
  fail: "FAIL",
  audit: "Audit",
  auditEmpty: "Die Lineage erscheint mit dem ersten Lauf.",
  stressTitle: "Stresstest",
  stressAside: "Rauschen 0.10 bis 4.02, Umgebung 0.20 bis 1.50",
  stability: "Stabilität",
  confidence: "Konfidenz",
  stressEmpty: "Noch kein Stresstest. 50 Iterationen auf einem Manifold, Seed aus der Steuerung, Toleranz 0.25 wie im Masterprotokoll.",
  multiTitle: "Multi-Seed",
  multiEmpty: "Fünf Seeds mit den aktuellen Reglern. Jeder Lauf hat eine eigene logische Uhr und eine eigene Kette.",
  gridTitle: "Dämpfungsgitter",
  gridAside: "Seed 42, Toleranz 0.25",
  gridEmpty: "Neun Läufe, Dämpfung 0.70 / 0.80 / 0.90 gegen Inkrement 0.03 / 0.05 / 0.08. Umgebung, Rauschen und interner Stress folgen den Reglern.",
  notes: "Abweichungen vom PDF-Master",
  modality: { visual: "Sehen", auditory: "Hören", haptic: "Haptik", quality: "Qualität" },
  actions: {
    PROMPT_LLM_CAUTION: "LLM vorsichtig befragen",
    MOTOR_STOP_IMMEDIATELY: "sofort anhalten",
    MOTOR_PROCEED_GENTLY: "behutsam weiter",
    MOTOR_TURN_LEFT: "links abbiegen",
    MOTOR_TURN_RIGHT: "rechts abbiegen",
    ACTIVATE_WARNING_LIGHTS: "Warnlichter an",
    SYSTEM_RECALIBRATE: "System neu kalibrieren",
    EXTERNAL_OVERRIDE_EMERGENCY: "externer Notstopp",
    EXTERNAL_NAVIGATE_HOME: "nach Hause navigieren",
  },
  cols: {
    seed: "Seed",
    win: "Win",
    dPre: "d_pre",
    dPost: "d_post",
    proxy: "Proxy",
    conf: "Conf",
    inv: "Inv",
    action: "Aktion",
    damping: "Dämpfung",
    increment: "Inkrement",
    interventions: "Interventionen",
  },
  csvAgent: "Agent,Gedämpft,Stress,d_pre,d_sphäre,Conf_vor,Conf_nach,Sonde,Gewinner",
  csvStress: "Iteration,Rauschen,Umgebung,Intern,Schwelle,Interventionen,Gewinner,d_pre,d_post,Proxy,Conf_vor,Conf_nach,Aktion,Marge,Degeneriert,TolCrit,Headroom,Vielfalt",
  checks8: {
    1: { name: "Einheitssphäre", ok: "Ground Truth und Embeddings auf S^{dim} (||v||₂ = 1)." },
    2: { name: "Allostase", ok: "env 0.25 → {base}, env 0.32 → {emergency}." },
    3: { name: "L2-Collapse", ok: "||v_final||₂ = 1 und Konfidenz invariant ({conf})." },
    4: { name: "Inertia-Inversion", ok: "cos(v₀, v_base) = {inv}." },
    5: { name: "Ringpuffer und SHA-256", ok: "maxlen={maxlen}, Anker und Head-Hash intakt." },
    6: { name: "Aktionsraum", ok: "Gebunden {bound}. Paarweiser Kosinus min={min} max={max} mean={mean}." },
    7: { name: "Determinismus", ok: "Zweiter Lauf identisch (d_post={dPost}, {action})." },
    8: { name: "Fail-Fast Dimension", ok: "IMU-Shape (2,) wirft ein ValueError-Äquivalent." },
  },
  notesText: {
    A1: "Zustandshashes nutzen kanonisches JSON (Komponenten auf 6 Nachkommastellen, half-away-from-zero) und SHA-256, gekürzt auf 16 Hex-Zeichen. Nicht Python-repr(list). Die Ketteneigenschaft ist intern vollständig.",
    A2: "Zufall ist xoshiro128** plus Box-Muller. Vier unabhängige Streams (sensor, swarm, adapter, calib) werden per SplitMix32 aus dem Master-Seed abgeleitet. Der Kalibrierstrom verschiebt die anderen nicht. Verträge: uniform auf [0,1), normal(mean, std). Nicht bit-identisch zu NumPy PCG64 oder CPython MT19937.",
    A3: "Die Uhr ist injizierbar. Diagnostik und der Boot-Lauf nutzen eine logische UTC-Uhr, damit die SHA-256-Lineage prozessgleich ist. Manuelle Läufe stempeln mit echter UTC-Zeit.",
    C1: "Salienz gewichtet mit dem Prior mal ||Wx+b|| vor der Projektion auf S^(d-1). Im PDF wird zuerst normiert und danach L2 gebildet; jede Modalität hat dann Energie 1, die Softmax kollabiert auf die konstanten Priors 1.0 / 0.8 / 1.2.",
    C2: "Sensorrauschen und interner Stress sind getrennte Argumente des Synthesizers. Die Tk-GUI übergibt internen Stress fälschlich als noise_level.",
    C3: "Ground Truth folgt latentDim und muss exakt Einheitsnorm haben. Die PDF-Defaultfactory erzeugt immer 512 Komponenten und fällt erst in __post_init__ um, wenn latentDim abweicht.",
    C4: "Der Ringpuffer prüft zusätzlich den Anker des ältesten Eintrags und den Head-Hash des neuesten. Die PDF-Prüfung kontrolliert nur Innenkanten und erkennt weder eine gefälschte Genesis-Kante noch eine Änderung des letzten Eintrags.",
    C5: "Seed ist eine ganze Zahl und wird auf uint32 reduziert. Der ungeseedete random.Random()-Zweig der PDF wird nicht angeboten, weil ein funktionaler Lauf reproduzierbar sein muss.",
    C6: "Agent 0 mit Trägheitsinversion ist eine Diagnosesonde und entscheidet nicht, solange inversionCompetes aus ist. Bei gleicher Konfidenz gewinnt die kleinere Sphärendistanz. Konfidenz ≤ 0 markiert den Lauf als degeneriert. Gemessen: bei Toleranz 1 gewann vorher Agent 0 per Index, im Stresstest in 18 von 50 Iterationen.",
    C7: "Die Referee-Konfidenz bewertet die Richtung auf der Einheitssphäre. Die Rohdistanz bleibt als d_pre sichtbar. Ein Nullvektor bekommt Sphärendistanz 2. Gemessen: Agent 0 hatte d_raw 1.148 gegen bis zu 1.363, obwohl er entgegen dem Konsens zeigt.",
    C8: "Vor dem Haptik-Embedding wird [9.81, 0, 0, 0, 0, 0] abgezogen. Der rohe IMU-Vektor bleibt erhalten. Gemessen: Kosinus zwischen Umgebung 0.2 und 1.5 war 0.99996, nach der Kompensation im Eingaberaum 0.927 und im Embedding 0.937.",
    C9: "Der Triage-Score ist Prior mal log1p der Energie vor der Projektion. Das lineare Produkt aus C1 wurde zum One-Hot auf Haptik. Mit C8 und log1p bleibt die Mischung unter 0.9 und ändert sich mit der Umgebung.",
    C10: "Das Schwarmrauschen skaliert mit ||Basis|| / sqrt(d). Der erwartete Kosinus zur Basis ist 1/sqrt(1+(Stress·noiseScale)²). Vorher fiel Agent 1 bei Stress 1.0 auf Kosinus 0.45.",
    C11: "Unter einer Kosinus-Marge unter der Schwelle heißt die Aktion UNDECIDED. Die neun Namen sind ein Platzhalter. Seit C16 ist 0.05 nur noch ein expliziter Wert; der Default wird kalibriert.",
    C12: "T1 bis T8 prüfen Sonde, Skaleninvarianz, Haptik, Triage, Rausch-Kosinus, UNDECIDED und den Toleranz-Sweep. Die acht Masterprüfungen bleiben daneben bestehen.",
    C13: "Das JSON-Schema upo-run-1 trägt Config, Notiz-IDs, RNG und pro Lauf Marge, degenerate, Gewinner, tieCount. Interner Stress im Stresstest ist min(1.5, Rauschen·0.25) und steigt bis Iteration 49. Die Umgebung steht ab Iteration 44 bei 1.5, das ist das benannte Master-Plateau.",
    C14: "Die Python-Datei des PDF ist historische Spezifikation, nicht die ausführbare Referenz. math.cos auf einem NumPy-Array wirft TypeError, die GUI mischt internen Stress in noise_level, der HTML-Export ist numerisch nicht identisch. Der TypeScript-Kern ist die Referenz.",
    C15: "Die kritische Toleranz ist das Maximum aus Vor-Konfidenz geteilt durch Sphärendistanz der zugelassenen Agenten. Ab diesem Wert ist der Lauf degeneriert. Messung am Standardlauf, Seed 42: 0.5676. Der Slider markiert sie.",
    C16: "Ohne gesetzte Marge gilt das 99. Perzentil der Nullverteilung auf einem eigenen Zufallsstrom. Messung Seed 42: Schwelle 0.0916, Anteil darüber 0.0103 bei 20000 unabhängigen Ziehungen. Die feste 0.05 wird dort von 0.1177 der Zustände erreicht.",
    C17: "Optional ist die Ground Truth die Triage-Richtung des Ruhe-Szenarios, mit demselben Adapter und ohne Schwarm. Das ist eine benannte Annahme. Messung Seed 42, ohne Sonde: Ruhe 0.4310, Stresstest 0.4490 auf 1.2454, Proxy-Spanne 0.4651.",
    C18: "Die Schwarmvielfalt ist 1 minus den mittleren paarweisen Kosinus ohne Sonde. Sie ändert die Entscheidung nicht. Standardlauf: 0.1600. Bei Stress 0 ist sie 0, weil das Rauschen verschwindet. Isoliert bei Stress 1: 0.4941.",
    C19: "Fremdes JSON wird abgewiesen, ohne zu werfen. Die SHA-256-Kette beweist eine Änderung nur zusammen mit einem außerhalb gespeicherten Head-Hash. Der Replay prüft Determinismus, nicht Echtheit.",
    C20: "Drei Aktionsnamen sind an Umgebungen gebunden: 0.2, 0.8 und 1.4. Sechs bleiben ungebunden. Messung: 90 von 90 Treffer, Marge 0.1296 bis 0.2329, Schwelle 0.0711. Die Belegung ist ein Platzhalter.",
    C21: "Der Qualitätskanal bleibt aus. Eingeschaltet ändert er den Konsens-Kosinus zwischen Rauschen 0.1 und 3.0 nur auf 0.9807 bis 0.9865. Das Neun-Szenarien-Raster trifft 10 von 36, keines über der Schwelle. Ziel war unter 0.9 und mindestens 30 von 36.",
    C22: "Das Exportschema ist upo-run-2 und trägt clockMode. upo-run-1 bleibt im Replay lesbar. Die Stress-CSV heißt winnerIndex, Modus und Aktion_gebunden. Bei Ruhe-Referenz lautet die Datei upo-stress-50-calm.csv. Der Standard bleibt uniform.",
  },
};

const en: Messages = {
  language: "Language",
  lede: "Salience, parasympathetic swarm, hostile referees, and a 9-action decode. Every run writes a SHA-256 lineage. Not a truncated kernel.",
  controls: "Controls",
  restoredAside: "Last settings loaded",
  defaultsAside: "Master defaults",
  env: "Environment",
  internal: "Internal stress",
  noise: "Sensor noise",
  damping: "Damping",
  tolerance: "Tolerance",
  increment: "Increment",
  seed: "Seed",
  agents: "Agents",
  inversion: "Agent 0 inertia inversion",
  gtCalm: "Ground truth = rest reference",
  gtNote: "Uniform is an arbitrary unit vector. Rest reference means deviation from rest (environment 0.2, noise 0.1, internal stress 0), built with the same adapter. That is an assumption, not a measured truth.",
  quality: "Quality channel",
  qualityNote: "Failed attempt C21, off by default. Three second-difference features, prior 0.6. Consensus cosine between noise 0.1 and 3.0 stays 0.9807 to 0.9865. The target was below 0.9.",
  stressGt: "Stress export: rest reference",
  tolWarn: "At tolerance {crit} the referee wipes every confidence.",
  tolCrit: "Critical tolerance",
  tolHead: "Headroom",
  diversity: "Swarm diversity",
  usedMargin: "Margin threshold",
  run: "Run",
  running: "Computing",
  checks: "8 checks",
  checking: "Checking",
  stress: "Stress test 50",
  stressBusy: "50 runs",
  multi: "Multi-seed",
  multiBusy: "5 seeds",
  grid: "Damping grid",
  gridBusy: "9 runs",
  agentCsv: "Agent CSV",
  stressCsv: "Stress CSV",
  json: "JSON",
  replay: "Check JSON",
  replayOk: "The exported run reproduces the same metrics.",
  replayBad: "Reproduction diverged.",
  restoredNote: "The sliders come from your last visit. Telemetry stays on the master protocol until you start a run.",
  telemetry: "Telemetry",
  chainOk: "Chain intact",
  chainBad: "Chain broken",
  booting: "Kernel starting",
  threshold: "Threshold",
  interventions: "Interventions",
  dist: "d before / after collapse",
  proxy: "Stability proxy",
  inv: "Agent 0 inversion",
  confWinner: "Winner confidence",
  winner: "Winner",
  action: "Action",
  margin: "Margin",
  sphere: "Sphere distance (winner)",
  degenerate: "Degenerate: the best eligible confidence is ≤ 0. The tie is marked, and the probe does not decide.",
  probe: "Probe",
  actionPlaceholder: "Placeholder, not a measured motor policy. Three names are bound to environments: MOTOR_PROCEED_GENTLY at 0.2, PROMPT_LLM_CAUTION at 0.8, MOTOR_STOP_IMMEDIATELY at 1.4. Six names are unbound and are not decoded. Below the margin the result is UNDECIDED.",
  unbound: "Unbound, not decoded",
  undecided: "margin below threshold",
  lineage: "Lineage",
  ortho: "Orthogonality",
  flat: "Every eligible path sits at confidence 0 after the referee.",
  hapticNote: "One modality carries almost all of the salience. Since C8 gravity is removed, and since C9 the softmax uses log1p(energy).",
  computing: "The eight checks and the master run are being computed.",
  formulaWhen: "thr = 0.50 when env ≥ 0.30, else 0.85",
  formulaConf: "conf′ = max(0, conf − d(v/‖v‖, g) · tol)",
  formulaProxy: "proxy = 1 / (1 + d after collapse)",
  topology: "Topology",
  orbit: "Drag to orbit, wheel to zoom",
  topoBody: "x is the agent index, y the confidence after the referee, z the Euclidean distance before collapse. Light means damped, the larger sphere is the winner.",
  aria: "Rotatable 3D topology of the agents. Horizontal is confidence, depth is the distance before collapse.",
  referee: "Referee",
  refereeAside: "Light before, steel after, green winner",
  before: "Before referee",
  after: "After referee",
  diag: "Diagnostics",
  deviation: "Deviation",
  diagRunning: "running",
  diagWait: "The eight master checks are running on a fresh kernel with seed 42.",
  ok: "OK",
  fail: "FAIL",
  audit: "Audit",
  auditEmpty: "The lineage appears with the first run.",
  stressTitle: "Stress test",
  stressAside: "Noise 0.10 to 4.02, environment 0.20 to 1.50",
  stability: "Stability",
  confidence: "Confidence",
  stressEmpty: "No stress test yet. 50 iterations on one manifold, seed from the controls, tolerance 0.25 as in the master protocol.",
  multiTitle: "Multi-seed",
  multiEmpty: "Five seeds with the current controls. Each run has its own logical clock and its own chain.",
  gridTitle: "Damping grid",
  gridAside: "Seed 42, tolerance 0.25",
  gridEmpty: "Nine runs, damping 0.70 / 0.80 / 0.90 against increment 0.03 / 0.05 / 0.08. Environment, noise, and internal stress follow the controls.",
  notes: "Departures from the PDF master",
  modality: { visual: "Vision", auditory: "Hearing", haptic: "Haptics", quality: "Quality" },
  actions: {
    PROMPT_LLM_CAUTION: "ask the LLM with caution",
    MOTOR_STOP_IMMEDIATELY: "stop immediately",
    MOTOR_PROCEED_GENTLY: "proceed gently",
    MOTOR_TURN_LEFT: "turn left",
    MOTOR_TURN_RIGHT: "turn right",
    ACTIVATE_WARNING_LIGHTS: "turn on warning lights",
    SYSTEM_RECALIBRATE: "recalibrate the system",
    EXTERNAL_OVERRIDE_EMERGENCY: "external emergency override",
    EXTERNAL_NAVIGATE_HOME: "navigate home",
  },
  cols: {
    seed: "Seed",
    win: "Win",
    dPre: "d_pre",
    dPost: "d_post",
    proxy: "Proxy",
    conf: "Conf",
    inv: "Inv",
    action: "Action",
    damping: "Damping",
    increment: "Increment",
    interventions: "Interventions",
  },
  csvAgent: "Agent,Damped,Stress,d_pre,d_sphere,Conf_before,Conf_after,Probe,Winner",
  csvStress: "Iteration,Noise,Environment,Internal,Threshold,Interventions,Winner,d_pre,d_post,Proxy,Conf_before,Conf_after,Action,Margin,Degenerate,TolCrit,Headroom,Diversity",
  checks8: {
    1: { name: "Unit sphere", ok: "Ground truth and embeddings on S^{dim} (||v||₂ = 1)." },
    2: { name: "Allostasis", ok: "env 0.25 → {base}, env 0.32 → {emergency}." },
    3: { name: "L2 collapse", ok: "||v_final||₂ = 1 and confidence invariant ({conf})." },
    4: { name: "Inertia inversion", ok: "cos(v₀, v_base) = {inv}." },
    5: { name: "Ring buffer and SHA-256", ok: "maxlen={maxlen}, anchor and head hash intact." },
    6: { name: "Action space", ok: "Bound {bound}. Pairwise cosine min={min} max={max} mean={mean}." },
    7: { name: "Determinism", ok: "Second run identical (d_post={dPost}, {action})." },
    8: { name: "Fail-fast dimension", ok: "IMU shape (2,) raises a ValueError equivalent." },
  },
  notesText: {
    A1: "State hashes use canonical JSON (components to 6 decimal places, half-away-from-zero) and SHA-256, truncated to 16 hex characters. Not Python repr(list). The chain property is complete inside this kernel.",
    A2: "Randomness is xoshiro128** plus Box-Muller. Four independent streams (sensor, swarm, adapter, calib) are derived from the master seed with SplitMix32. The calibration stream does not move the others. Contracts: uniform on [0,1), normal(mean, std). Not bit-identical to NumPy PCG64 or CPython MT19937.",
    A3: "The clock is injectable. Diagnostics and the boot run use a logical UTC clock so the SHA-256 lineage matches across processes. Manual runs stamp real UTC.",
    C1: "Salience weights the prior times ||Wx+b|| before the projection onto S^(d-1). The PDF normalizes first and then takes L2, so every modality has energy 1 and the softmax collapses onto the constant priors 1.0 / 0.8 / 1.2.",
    C2: "Sensor noise and internal stress are separate arguments of the synthesizer. The Tk GUI wrongly passes internal stress as noise_level.",
    C3: "Ground truth follows latentDim and must have exact unit norm. The PDF default factory always builds 512 components and only fails in __post_init__ when latentDim differs.",
    C4: "The ring buffer also checks the anchor of the oldest entry and the head hash of the newest. The PDF check only inspects interior links and misses both a forged genesis edge and a change to the last entry.",
    C5: "The seed is an integer reduced to uint32. The PDF's unseeded random.Random() branch is not offered, because a functional run must be reproducible.",
    C6: "Agent 0 with inertia inversion is a diagnostic probe and does not decide while inversionCompetes is off. Equal confidence breaks toward the smaller sphere distance. Confidence ≤ 0 marks the run degenerate. Measured: at tolerance 1, agent 0 used to win by index, and it won 18 of 50 stress iterations.",
    C7: "Referee confidence scores direction on the unit sphere. Raw distance stays visible as d_pre. A zero vector gets sphere distance 2. Measured: agent 0 had d_raw 1.148 against up to 1.363 while pointing against the consensus.",
    C8: "The haptic embedding subtracts [9.81, 0, 0, 0, 0, 0]. The raw IMU vector is kept. Measured: cosine between environment 0.2 and 1.5 was 0.99996; after compensation it is 0.927 in input space and 0.937 in the embedding.",
    C9: "The triage score is prior times log1p of the pre-projection energy. The linear product from C1 became one-hot on haptics. With C8 and log1p the mixture stays under 0.9 and moves with the environment.",
    C10: "Swarm noise scales with ||base|| / sqrt(d). The expected cosine to the base is 1/sqrt(1+(stress·noiseScale)²). Agent 1 used to fall to cosine 0.45 at stress 1.0.",
    C11: "Below the cosine-margin threshold the action is UNDECIDED. The nine names are a placeholder. Since C16, 0.05 is only an explicit value; the default is calibrated.",
    C12: "T1 through T8 check the probe, scale invariance, haptics, triage, noise cosine, UNDECIDED, and the tolerance sweep. The eight master checks stay beside them.",
    C13: "JSON schema upo-run-1 carries the config, note ids, the RNG id, and per run the margin, degenerate flag, winner, and tie count. Stress-test internal stress is min(1.5, noise·0.25) and rises through iteration 49. Environment stays at 1.5 from iteration 44; that cap is the named master plateau.",
    C14: "The PDF Python file is a historical specification, not the executable reference. math.cos on a NumPy array raises TypeError, the GUI feeds internal stress into noise_level, and the HTML export is not numerically identical. The TypeScript kernel is the reference.",
    C15: "Critical tolerance is the maximum of pre-confidence divided by sphere distance over eligible agents. At that value the run is degenerate. Measured on the standard run, seed 42: 0.5676. The slider marks it.",
    C16: "With no explicit margin, the threshold is the 99th percentile of a null distribution on its own random stream. Measured at seed 42: threshold 0.0916, and 0.0103 of 20000 independent draws lie at or above it. The fixed 0.05 is reached by 0.1177 of that draw.",
    C17: "Ground truth can be the triage direction of the rest scenario, using the same adapter and no swarm. That is a named assumption. Measured at seed 42, probe excluded: rest 0.4310, stress test 0.4490 to 1.2454, proxy span 0.4651.",
    C18: "Swarm diversity is 1 minus the mean pairwise cosine without the probe. It does not change the decision. Standard run: 0.1600. At stress 0 it is 0, because the noise vanishes. Isolated at stress 1: 0.4941.",
    C19: "Foreign JSON is rejected without throwing. The SHA-256 chain shows a change only together with a head hash stored outside the browser. Replay checks determinism, not authenticity.",
    C20: "Three action names are bound to environments 0.2, 0.8 and 1.4. Six stay unbound. Measured: 90 of 90 hits, margin 0.1296 to 0.2329, threshold 0.0711. The assignment is a placeholder.",
    C21: "The quality channel stays off. Turned on, consensus cosine between noise 0.1 and 3.0 only moves to 0.9807–0.9865. The nine-scenario grid hits 10 of 36, none above the threshold. The target was below 0.9 and at least 30 of 36.",
    C22: "The export schema is upo-run-2 and carries clockMode. upo-run-1 still replays. The stress CSV uses winnerIndex, Modus and Aktion_gebunden. A rest-reference export is named upo-stress-50-calm.csv. The default stays uniform.",
  },
};

const fr: Messages = {
  language: "Langue",
  lede: "Saillance, essaim parasympathique, arbitres hostiles et décodage en 9 actions. Chaque run écrit une lignée SHA-256. Pas un noyau tronqué.",
  controls: "Commandes",
  restoredAside: "Dernier réglage chargé",
  defaultsAside: "Réglages maîtres",
  env: "Environnement",
  internal: "Stress interne",
  noise: "Bruit capteur",
  damping: "Amortissement",
  tolerance: "Tolérance",
  increment: "Incrément",
  seed: "Graine",
  agents: "Agents",
  inversion: "Inversion d'inertie, agent 0",
  gtCalm: "Vérité terrain = référence de repos",
  gtNote: "Uniforme est un vecteur unitaire arbitraire. La référence de repos signifie l'écart au repos (environnement 0.2, bruit 0.1, stress interne 0), calculé avec le même adaptateur. C'est une hypothèse, pas une vérité mesurée.",
  quality: "Canal qualité",
  qualityNote: "Essai manqué C21, éteint par défaut. Trois traits de différence seconde, prior 0.6. Le cosinus du consensus entre bruit 0.1 et 3.0 reste entre 0.9807 et 0.9865. La cible était sous 0.9.",
  stressGt: "Export de stress : référence de repos",
  tolWarn: "À partir de la tolérance {crit}, le referee efface toutes les confiances.",
  tolCrit: "Tolérance critique",
  tolHead: "Marge de tolérance",
  diversity: "Diversité de l'essaim",
  usedMargin: "Seuil de marge",
  run: "Lancer",
  running: "Calcul",
  checks: "8 contrôles",
  checking: "Contrôle",
  stress: "Test de stress 50",
  stressBusy: "50 runs",
  multi: "Multi-graine",
  multiBusy: "5 graines",
  grid: "Grille d'amortissement",
  gridBusy: "9 runs",
  agentCsv: "CSV agents",
  stressCsv: "CSV stress",
  json: "JSON",
  replay: "Vérifier JSON",
  replayOk: "Le run exporté reproduit les mêmes métriques.",
  replayBad: "La reproduction diverge.",
  restoredNote: "Les curseurs viennent de votre dernière visite. La télémétrie reste sur le protocole maître tant que vous ne lancez pas un run.",
  telemetry: "Télémétrie",
  chainOk: "Chaîne intacte",
  chainBad: "Chaîne rompue",
  booting: "Noyau au démarrage",
  threshold: "Seuil",
  interventions: "Interventions",
  dist: "d avant / après collapse",
  proxy: "Proxy de stabilité",
  inv: "Inversion agent 0",
  confWinner: "Confiance du gagnant",
  winner: "Gagnant",
  action: "Action",
  margin: "Marge",
  sphere: "Distance sphère (gagnant)",
  degenerate: "Dégénéré : la meilleure confiance éligible est ≤ 0. L'égalité est marquée, la sonde ne décide pas.",
  probe: "Sonde",
  actionPlaceholder: "Substitut, pas une politique motrice mesurée. Trois noms sont liés à un environnement : MOTOR_PROCEED_GENTLY à 0.2, PROMPT_LLM_CAUTION à 0.8, MOTOR_STOP_IMMEDIATELY à 1.4. Six noms ne sont pas liés et ne sont pas décodés. Sous la marge, le résultat est UNDECIDED.",
  unbound: "Non liées, hors décodage",
  undecided: "marge insuffisante",
  lineage: "Lignée",
  ortho: "Orthogonalité",
  flat: "Tous les chemins éligibles sont à confiance 0 après l'arbitre.",
  hapticNote: "Une modalité porte presque toute la saillance. Depuis C8 la gravité est retirée, et depuis C9 la softmax utilise log1p(énergie).",
  computing: "Les huit contrôles et le run maître sont en cours de calcul.",
  formulaWhen: "thr = 0.50 si env ≥ 0.30, sinon 0.85",
  formulaConf: "conf′ = max(0, conf − d(v/‖v‖, g) · tol)",
  formulaProxy: "proxy = 1 / (1 + d après collapse)",
  topology: "Topologie",
  orbit: "Glisser pour tourner, molette pour zoomer",
  topoBody: "x est l'indice de l'agent, y la confiance après l'arbitre, z la distance euclidienne avant le collapse. Clair signifie amorti, la plus grande sphère est le gagnant.",
  aria: "Topologie 3D rotative des agents. L'horizontale est la confiance, la profondeur la distance avant le collapse.",
  referee: "Arbitre",
  refereeAside: "Clair avant, acier après, vert gagnant",
  before: "Avant l'arbitre",
  after: "Après l'arbitre",
  diag: "Diagnostic",
  deviation: "Écart",
  diagRunning: "en cours",
  diagWait: "Les huit contrôles maîtres tournent sur un noyau frais avec la graine 42.",
  ok: "OK",
  fail: "ÉCHEC",
  audit: "Audit",
  auditEmpty: "La lignée apparaît avec le premier run.",
  stressTitle: "Test de stress",
  stressAside: "Bruit de 0.10 à 4.02, environnement de 0.20 à 1.50",
  stability: "Stabilité",
  confidence: "Confiance",
  stressEmpty: "Pas encore de test de stress. 50 itérations sur un seul manifold, graine prise des commandes, tolérance 0.25 comme dans le protocole maître.",
  multiTitle: "Multi-graine",
  multiEmpty: "Cinq graines avec les réglages actuels. Chaque run a sa propre horloge logique et sa propre chaîne.",
  gridTitle: "Grille d'amortissement",
  gridAside: "Graine 42, tolérance 0.25",
  gridEmpty: "Neuf runs, amortissement 0.70 / 0.80 / 0.90 contre incrément 0.03 / 0.05 / 0.08. Environnement, bruit et stress interne suivent les curseurs.",
  notes: "Écarts par rapport au PDF maître",
  modality: { visual: "Vision", auditory: "Ouïe", haptic: "Haptique", quality: "Qualité" },
  actions: {
    PROMPT_LLM_CAUTION: "interroger le LLM avec prudence",
    MOTOR_STOP_IMMEDIATELY: "arrêt immédiat",
    MOTOR_PROCEED_GENTLY: "avancer avec prudence",
    MOTOR_TURN_LEFT: "tourner à gauche",
    MOTOR_TURN_RIGHT: "tourner à droite",
    ACTIVATE_WARNING_LIGHTS: "allumer les feux d'avertissement",
    SYSTEM_RECALIBRATE: "recalibrer le système",
    EXTERNAL_OVERRIDE_EMERGENCY: "arrêt d'urgence externe",
    EXTERNAL_NAVIGATE_HOME: "rentrer à la base",
  },
  cols: {
    seed: "Graine",
    win: "Gagn.",
    dPre: "d_pre",
    dPost: "d_post",
    proxy: "Proxy",
    conf: "Conf",
    inv: "Inv",
    action: "Action",
    damping: "Amort.",
    increment: "Incrément",
    interventions: "Interventions",
  },
  csvAgent: "Agent,Amorti,Stress,d_pre,d_sphere,Conf_avant,Conf_apres,Sonde,Gagnant",
  csvStress: "Iteration,Bruit,Environnement,Interne,Seuil,Interventions,Gagnant,d_pre,d_post,Proxy,Conf_avant,Conf_apres,Action,Marge,Degeneres,TolCrit,Headroom,Diversite",
  checks8: {
    1: { name: "Sphère unité", ok: "Vérité terrain et plongements sur S^{dim} (||v||₂ = 1)." },
    2: { name: "Allostasie", ok: "env 0.25 → {base}, env 0.32 → {emergency}." },
    3: { name: "Collapse L2", ok: "||v_final||₂ = 1 et confiance invariante ({conf})." },
    4: { name: "Inversion d'inertie", ok: "cos(v₀, v_base) = {inv}." },
    5: { name: "Tampon circulaire et SHA-256", ok: "maxlen={maxlen}, ancre et hash de tête intacts." },
    6: { name: "Espace d'action", ok: "Liés {bound}. Cosinus par paire min={min} max={max} mean={mean}." },
    7: { name: "Déterminisme", ok: "Second run identique (d_post={dPost}, {action})." },
    8: { name: "Dimension fail-fast", ok: "La forme IMU (2,) lève un équivalent de ValueError." },
  },
  notesText: {
    A1: "Les hachages d'état utilisent un JSON canonique (composantes à 6 décimales, half-away-from-zero) et SHA-256, tronqué à 16 caractères hexadécimaux. Pas le repr(list) de Python. La propriété de chaîne est complète dans ce noyau.",
    A2: "L'aléa est xoshiro128** plus Box-Muller. Quatre flux indépendants (sensor, swarm, adapter, calib) sont dérivés de la graine maîtresse par SplitMix32. Le flux de calibration ne déplace pas les autres. Contrats : uniforme sur [0,1), normal(mean, std). Pas identique bit à bit à NumPy PCG64 ni au MT19937 de CPython.",
    A3: "L'horloge est injectable. Le diagnostic et le run de démarrage utilisent une horloge UTC logique, afin que la lignée SHA-256 soit identique d'un processus à l'autre. Les runs manuels portent l'heure UTC réelle.",
    C1: "La saillance pondère le prior par ||Wx+b|| avant la projection sur S^(d-1). Le PDF normalise d'abord puis calcule L2 : chaque modalité a alors une énergie 1, et le softmax s'effondre sur les priors constants 1.0 / 0.8 / 1.2.",
    C2: "Le bruit capteur et le stress interne sont des arguments distincts du synthétiseur. L'interface Tk passe à tort le stress interne comme noise_level.",
    C3: "La vérité terrain suit latentDim et doit avoir une norme unitaire exacte. La fabrique par défaut du PDF construit toujours 512 composantes et n'échoue que dans __post_init__ si latentDim diffère.",
    C4: "Le tampon circulaire vérifie aussi l'ancre de l'entrée la plus ancienne et le hash de tête de la plus récente. Le contrôle du PDF ne regarde que les liens intérieurs et ne voit ni une arête de genèse falsifiée ni une modification de la dernière entrée.",
    C5: "La graine est un entier réduit à uint32. La branche random.Random() non ensemencée du PDF n'est pas proposée, parce qu'un run fonctionnel doit être reproductible.",
    C6: "L'agent 0 avec inversion d'inertie est une sonde de diagnostic et ne décide pas tant que inversionCompetes est coupé. À confiance égale, la plus petite distance sphérique gagne. Une confiance ≤ 0 marque le run comme dégénéré. Mesure : à tolérance 1, l'agent 0 gagnait par indice, et 18 fois sur 50 au test de stress.",
    C7: "La confiance de l'arbitre évalue la direction sur la sphère unité. La distance brute reste visible comme d_pre. Un vecteur nul reçoit la distance sphérique 2. Mesure : l'agent 0 avait d_raw 1.148 contre jusqu'à 1.363, bien qu'il pointe contre le consensus.",
    C8: "L'embedding haptique soustrait [9.81, 0, 0, 0, 0, 0]. Le vecteur IMU brut est conservé. Mesure : le cosinus entre environnement 0.2 et 1.5 valait 0.99996 ; après compensation, 0.927 dans l'espace d'entrée et 0.937 dans l'embedding.",
    C9: "Le score de triage est le prior fois log1p de l'énergie avant projection. Le produit linéaire de C1 devenait un one-hot haptique. Avec C8 et log1p, le mélange reste sous 0.9 et bouge avec l'environnement.",
    C10: "Le bruit de l'essaim est à l'échelle de ||base|| / sqrt(d). Le cosinus attendu vers la base est 1/sqrt(1+(stress·noiseScale)²). L'agent 1 tombait à un cosinus de 0.45 pour un stress de 1.0.",
    C11: "Sous le seuil de marge en cosinus, l'action est UNDECIDED. Les neuf noms sont un substitut. Depuis C16, 0.05 n'est plus qu'une valeur explicite ; le défaut est calibré.",
    C12: "T1 à T8 vérifient la sonde, l'invariance d'échelle, l'haptique, le triage, le cosinus du bruit, UNDECIDED et le balayage de tolérance. Les huit contrôles maîtres restent à côté.",
    C13: "Le schéma JSON upo-run-1 porte la config, les identifiants de notes, le RNG, et par run la marge, le drapeau degenerate, le gagnant et tieCount. Le stress interne du test est min(1.5, bruit·0.25) et monte jusqu'à l'itération 49. L'environnement reste à 1.5 dès l'itération 44 : c'est le plateau maître nommé.",
    C14: "Le fichier Python du PDF est une spécification historique, pas la référence exécutable. math.cos sur un tableau NumPy lève TypeError, l'interface passe le stress interne comme noise_level, et l'export HTML n'est pas identique numériquement. Le noyau TypeScript est la référence.",
    C15: "La tolérance critique est le maximum de la confiance avant division par la distance sphérique des agents éligibles. À cette valeur le run est dégénéré. Mesure du run standard, graine 42 : 0.5676. Le curseur la marque.",
    C16: "Sans marge explicite, le seuil est le 99e percentile d'une distribution nulle sur son propre flux. Mesure, graine 42 : seuil 0.0916, et 0.0103 de 20000 tirages indépendants sont au-dessus. Le 0.05 fixe est atteint par 0.1177 de ce tirage.",
    C17: "La vérité terrain peut être la direction de triage du scénario de repos, avec le même adaptateur et sans essaim. C'est une hypothèse nommée. Mesure, graine 42, sonde exclue : repos 0.4310, stress 0.4490 à 1.2454, étendue du proxy 0.4651.",
    C18: "La diversité de l'essaim est 1 moins le cosinus moyen par paires, sans la sonde. Elle ne change pas la décision. Run standard : 0.1600. À stress 0 elle vaut 0, car le bruit disparaît. Isolée à stress 1 : 0.4941.",
    C19: "Un JSON étranger est rejeté sans exception. La chaîne SHA-256 ne prouve un changement qu'avec un hash de tête conservé hors du navigateur. Le replay teste le déterminisme, pas l'authenticité.",
    C20: "Trois noms d'action sont liés aux environnements 0.2, 0.8 et 1.4. Six restent libres. Mesure : 90 sur 90, marge 0.1296 à 0.2329, seuil 0.0711. L'affectation est un substitut.",
    C21: "Le canal qualité reste éteint. Allumé, le cosinus du consensus entre bruit 0.1 et 3.0 ne bouge qu'à 0.9807–0.9865. La grille à neuf scénarios touche 10 sur 36, aucun au-dessus du seuil. La cible était sous 0.9 et au moins 30 sur 36.",
    C22: "Le schéma d'export est upo-run-2 et porte clockMode. upo-run-1 reste lisible au replay. Le CSV de stress utilise winnerIndex, Modus et Aktion_gebunden. Avec la référence de repos le fichier s'appelle upo-stress-50-calm.csv. Le défaut reste uniform.",
  },
};

const it: Messages = {
  language: "Lingua",
  lede: "Salienza, sciame parasimpatico, arbitri ostili e decodifica in 9 azioni. Ogni run scrive una lineage SHA-256. Non un kernel tagliato.",
  controls: "Controlli",
  restoredAside: "Ultima impostazione caricata",
  defaultsAside: "Default del master",
  env: "Ambiente",
  internal: "Stress interno",
  noise: "Rumore dei sensori",
  damping: "Smorzamento",
  tolerance: "Tolleranza",
  increment: "Incremento",
  seed: "Seed",
  agents: "Agenti",
  inversion: "Inversione d'inerzia, agente 0",
  gtCalm: "Ground truth = riferimento di quiete",
  gtNote: "Uniforme è un vettore unitario arbitrario. Il riferimento di quiete è lo scostamento dalla quiete (ambiente 0.2, rumore 0.1, stress interno 0), calcolato con lo stesso adapter. È un'assunzione, non una verità misurata.",
  quality: "Canale qualità",
  qualityNote: "Tentativo fallito C21, spento per default. Tre tratti di differenza seconda, prior 0.6. Il coseno del consenso fra rumore 0.1 e 3.0 resta fra 0.9807 e 0.9865. L'obiettivo era sotto 0.9.",
  stressGt: "Export stress: riferimento di quiete",
  tolWarn: "Dalla tolleranza {crit} il referee azzera tutte le confidenze.",
  tolCrit: "Tolleranza critica",
  tolHead: "Headroom",
  diversity: "Diversità dello sciame",
  usedMargin: "Soglia di margine",
  run: "Esegui",
  running: "Calcolo",
  checks: "8 controlli",
  checking: "Controllo",
  stress: "Stress test 50",
  stressBusy: "50 run",
  multi: "Multi-seed",
  multiBusy: "5 seed",
  grid: "Griglia di smorzamento",
  gridBusy: "9 run",
  agentCsv: "CSV agenti",
  stressCsv: "CSV stress",
  json: "JSON",
  replay: "Verifica JSON",
  replayOk: "Il run esportato riproduce le stesse metriche.",
  replayBad: "La riproduzione diverge.",
  restoredNote: "I cursori vengono dall'ultima visita. La telemetria resta sul protocollo master finché non avvii un run.",
  telemetry: "Telemetria",
  chainOk: "Catena intatta",
  chainBad: "Catena rotta",
  booting: "Kernel in avvio",
  threshold: "Soglia",
  interventions: "Interventi",
  dist: "d prima / dopo il collapse",
  proxy: "Proxy di stabilità",
  inv: "Inversione agente 0",
  confWinner: "Confidenza del vincitore",
  winner: "Vincitore",
  action: "Azione",
  margin: "Margine",
  sphere: "Distanza sfera (vincitore)",
  degenerate: "Degenerato: la migliore confidenza eleggibile è ≤ 0. Il pareggio è segnato, la sonda non decide.",
  probe: "Sonda",
  actionPlaceholder: "Segnaposto, non una politica motoria misurata. Tre nomi sono legati ad ambienti: MOTOR_PROCEED_GENTLY a 0.2, PROMPT_LLM_CAUTION a 0.8, MOTOR_STOP_IMMEDIATELY a 1.4. Sei nomi non sono legati e non vengono decodificati. Sotto il margine il risultato è UNDECIDED.",
  unbound: "Non vincolate, escluse dal decode",
  undecided: "margine insufficiente",
  lineage: "Lineage",
  ortho: "Ortogonalità",
  flat: "Tutti i percorsi eleggibili sono a confidenza 0 dopo l'arbitro.",
  hapticNote: "Una modalità porta quasi tutta la salienza. Da C8 la gravità è tolta, e da C9 la softmax usa log1p(energia).",
  computing: "Gli otto controlli e il run master sono in calcolo.",
  formulaWhen: "thr = 0.50 se env ≥ 0.30, altrimenti 0.85",
  formulaConf: "conf′ = max(0, conf − d(v/‖v‖, g) · tol)",
  formulaProxy: "proxy = 1 / (1 + d dopo il collapse)",
  topology: "Topologia",
  orbit: "Trascina per ruotare, rotella per zoomare",
  topoBody: "x è l'indice dell'agente, y la confidenza dopo l'arbitro, z la distanza euclidea prima del collapse. Chiaro significa smorzato, la sfera più grande è il vincitore.",
  aria: "Topologia 3D ruotabile degli agenti. L'orizzontale è la confidenza, la profondità la distanza prima del collapse.",
  referee: "Arbitro",
  refereeAside: "Chiaro prima, acciaio dopo, verde il vincitore",
  before: "Prima dell'arbitro",
  after: "Dopo l'arbitro",
  diag: "Diagnostica",
  deviation: "Scostamento",
  diagRunning: "in corso",
  diagWait: "Gli otto controlli master girano su un kernel fresco con seed 42.",
  ok: "OK",
  fail: "FAIL",
  audit: "Audit",
  auditEmpty: "La lineage compare con il primo run.",
  stressTitle: "Stress test",
  stressAside: "Rumore da 0.10 a 4.02, ambiente da 0.20 a 1.50",
  stability: "Stabilità",
  confidence: "Confidenza",
  stressEmpty: "Ancora nessuno stress test. 50 iterazioni su un solo manifold, seed dai controlli, tolleranza 0.25 come nel protocollo master.",
  multiTitle: "Multi-seed",
  multiEmpty: "Cinque seed con i controlli attuali. Ogni run ha il proprio orologio logico e la propria catena.",
  gridTitle: "Griglia di smorzamento",
  gridAside: "Seed 42, tolleranza 0.25",
  gridEmpty: "Nove run, smorzamento 0.70 / 0.80 / 0.90 contro incremento 0.03 / 0.05 / 0.08. Ambiente, rumore e stress interno seguono i cursori.",
  notes: "Scostamenti dal PDF master",
  modality: { visual: "Vista", auditory: "Udito", haptic: "Tatto", quality: "Qualità" },
  actions: {
    PROMPT_LLM_CAUTION: "interrogare il LLM con cautela",
    MOTOR_STOP_IMMEDIATELY: "arresto immediato",
    MOTOR_PROCEED_GENTLY: "procedere con cautela",
    MOTOR_TURN_LEFT: "svoltare a sinistra",
    MOTOR_TURN_RIGHT: "svoltare a destra",
    ACTIVATE_WARNING_LIGHTS: "accendere le luci di avviso",
    SYSTEM_RECALIBRATE: "ricalibrare il sistema",
    EXTERNAL_OVERRIDE_EMERGENCY: "override di emergenza esterno",
    EXTERNAL_NAVIGATE_HOME: "tornare alla base",
  },
  cols: {
    seed: "Seed",
    win: "Vinc.",
    dPre: "d_pre",
    dPost: "d_post",
    proxy: "Proxy",
    conf: "Conf",
    inv: "Inv",
    action: "Azione",
    damping: "Smorz.",
    increment: "Incremento",
    interventions: "Interventi",
  },
  csvAgent: "Agente,Smorzato,Stress,d_pre,d_sfera,Conf_prima,Conf_dopo,Sonda,Vincitore",
  csvStress: "Iterazione,Rumore,Ambiente,Interno,Soglia,Interventi,Vincitore,d_pre,d_post,Proxy,Conf_prima,Conf_dopo,Azione,Margine,Degenerato,TolCrit,Headroom,Diversita",
  checks8: {
    1: { name: "Sfera unitaria", ok: "Ground truth e embedding su S^{dim} (||v||₂ = 1)." },
    2: { name: "Allostasi", ok: "env 0.25 → {base}, env 0.32 → {emergency}." },
    3: { name: "Collapse L2", ok: "||v_final||₂ = 1 e confidenza invariante ({conf})." },
    4: { name: "Inversione d'inerzia", ok: "cos(v₀, v_base) = {inv}." },
    5: { name: "Ring buffer e SHA-256", ok: "maxlen={maxlen}, ancora e hash di testa intatti." },
    6: { name: "Spazio delle azioni", ok: "Vincolate {bound}. Coseno a coppie min={min} max={max} mean={mean}." },
    7: { name: "Determinismo", ok: "Secondo run identico (d_post={dPost}, {action})." },
    8: { name: "Dimensione fail-fast", ok: "La forma IMU (2,) solleva un equivalente di ValueError." },
  },
  notesText: {
    A1: "Gli hash di stato usano JSON canonico (componenti a 6 decimali, half-away-from-zero) e SHA-256, troncato a 16 caratteri esadecimali. Non il repr(list) di Python. La proprietà di catena è completa in questo kernel.",
    A2: "Il caso è xoshiro128** più Box-Muller. Quattro flussi indipendenti (sensor, swarm, adapter, calib) derivano dal seed maestro tramite SplitMix32. Il flusso di calibrazione non sposta gli altri. Contratti: uniforme su [0,1), normal(mean, std). Non identico bit a bit a NumPy PCG64 né al MT19937 di CPython.",
    A3: "L'orologio è iniettabile. Diagnostica e run di avvio usano un orologio UTC logico, così la lineage SHA-256 coincide tra i processi. I run manuali timbrano l'UTC reale.",
    C1: "La salienza pesa il prior per ||Wx+b|| prima della proiezione su S^(d-1). Il PDF normalizza prima e poi calcola L2: ogni modalità ha energia 1 e la softmax collassa sui prior costanti 1.0 / 0.8 / 1.2.",
    C2: "Rumore dei sensori e stress interno sono argomenti distinti del sintetizzatore. La GUI Tk passa erroneamente lo stress interno come noise_level.",
    C3: "La ground truth segue latentDim e deve avere norma unitaria esatta. La factory di default del PDF costruisce sempre 512 componenti e fallisce solo in __post_init__ se latentDim differisce.",
    C4: "Il ring buffer controlla anche l'ancora della voce più vecchia e l'hash di testa della più recente. Il controllo del PDF guarda solo i legami interni e non vede né un bordo di genesi falsificato né una modifica dell'ultima voce.",
    C5: "Il seed è un intero ridotto a uint32. Il ramo random.Random() senza seed del PDF non è offerto, perché un run funzionale deve essere riproducibile.",
    C6: "L'agente 0 con inversione d'inerzia è una sonda diagnostica e non decide finché inversionCompetes è spento. A parità di confidenza vince la distanza sferica minore. Una confidenza ≤ 0 marca il run come degenerato. Misura: a tolleranza 1 l'agente 0 vinceva per indice, e in 18 di 50 iterazioni di stress.",
    C7: "La confidenza dell'arbitro valuta la direzione sulla sfera unitaria. La distanza grezza resta visibile come d_pre. Un vettore nullo riceve distanza sferica 2. Misura: l'agente 0 aveva d_raw 1.148 contro fino a 1.363, pur puntando contro il consenso.",
    C8: "L'embedding aptico sottrae [9.81, 0, 0, 0, 0, 0]. Il vettore IMU grezzo resta. Misura: il coseno tra ambiente 0.2 e 1.5 era 0.99996; dopo la compensazione è 0.927 nello spazio di ingresso e 0.937 nell'embedding.",
    C9: "Il punteggio di triage è il prior per log1p dell'energia prima della proiezione. Il prodotto lineare di C1 diventava one-hot sull'aptica. Con C8 e log1p la miscela resta sotto 0.9 e si muove con l'ambiente.",
    C10: "Il rumore dello sciame scala con ||base|| / sqrt(d). Il coseno atteso verso la base è 1/sqrt(1+(stress·noiseScale)²). L'agente 1 scendeva a coseno 0.45 con stress 1.0.",
    C11: "Sotto la soglia del margine di coseno l'azione è UNDECIDED. I nove nomi sono un segnaposto. Da C16, 0.05 è solo un valore esplicito; il default è calibrato.",
    C12: "T1–T8 controllano la sonda, l'invarianza di scala, l'aptica, il triage, il coseno del rumore, UNDECIDED e lo sweep di tolleranza. Gli otto controlli master restano accanto.",
    C13: "Lo schema JSON upo-run-1 porta config, id delle note, RNG, e per run margine, flag degenerate, vincitore e tieCount. Lo stress interno del test è min(1.5, rumore·0.25) e sale fino all'iterazione 49. L'ambiente resta a 1.5 dall'iterazione 44: è il plateau master dichiarato.",
    C14: "Il file Python del PDF è una specifica storica, non il riferimento eseguibile. math.cos su un array NumPy lancia TypeError, la GUI passa lo stress interno come noise_level, e l'export HTML non è numericamente identico. Il kernel TypeScript è il riferimento.",
    C15: "La tolleranza critica è il massimo di confidenza prima diviso distanza sferica degli agenti ammessi. A quel valore il run è degenerato. Misura del run standard, seed 42: 0.5676. Lo slider la segna.",
    C16: "Senza margine esplicito, la soglia è il 99° percentile di una distribuzione nulla su un flusso proprio. Misura, seed 42: soglia 0.0916, e 0.0103 di 20000 estrazioni indipendenti sta sopra. Lo 0.05 fisso è raggiunto da 0.1177 di quel campione.",
    C17: "La ground truth può essere la direzione di triage dello scenario di quiete, con lo stesso adapter e senza sciame. È un'assunzione nominata. Misura, seed 42, sonda esclusa: quiete 0.4310, stress 0.4490 fino a 1.2454, ampiezza del proxy 0.4651.",
    C18: "La diversità dello sciame è 1 meno il coseno medio a coppie, senza la sonda. Non cambia la decisione. Run standard: 0.1600. A stress 0 vale 0, perché il rumore sparisce. Isolata a stress 1: 0.4941.",
    C19: "Un JSON estraneo viene rifiutato senza eccezioni. La catena SHA-256 prova una modifica solo insieme a un hash di testa tenuto fuori dal browser. Il replay verifica il determinismo, non l'autenticità.",
    C20: "Tre nomi di azione sono legati agli ambienti 0.2, 0.8 e 1.4. Sei restano liberi. Misura: 90 su 90, margine da 0.1296 a 0.2329, soglia 0.0711. L'assegnazione è un segnaposto.",
    C21: "Il canale qualità resta spento. Acceso, il coseno del consenso fra rumore 0.1 e 3.0 si sposta solo a 0.9807–0.9865. La griglia a nove scenari colpisce 10 su 36, nessuno sopra la soglia. L'obiettivo era sotto 0.9 e almeno 30 su 36.",
    C22: "Lo schema di export è upo-run-2 e porta clockMode. upo-run-1 resta leggibile nel replay. Il CSV di stress usa winnerIndex, Modus e Aktion_gebunden. Con il riferimento di quiete il file si chiama upo-stress-50-calm.csv. Il default resta uniform.",
  },
};

export const messages: Record<Locale, Messages> = { de, en, fr, it };

export function fill(template: string, facts: Record<string, string | number> | undefined): string {
  if (!facts) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    facts[key] === undefined ? "" : String(facts[key]),
  );
}
