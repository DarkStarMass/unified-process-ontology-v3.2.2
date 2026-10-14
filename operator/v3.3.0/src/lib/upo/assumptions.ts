/** Labeled assumptions and corrections against the UPO v3.3.0 PDF master.
 *  Semantic contracts of the pipeline are preserved. Dead or forgeable
 *  steps are repaired and named here — they are not silent deviations.
 */

export const KERNEL_VERSION = "3.3.0-Master";

export type KernelNote = {
  id: string;
  kind: "assumption" | "correction";
  text: string;
};

export const KERNEL_NOTES: readonly KernelNote[] = [
  {
    id: "A1",
    kind: "assumption",
    text: "Zustandshashes nutzen kanonisches JSON (Komponenten auf 6 Nachkommastellen, half-away-from-zero) und SHA-256, gekürzt auf 16 Hex-Zeichen. Nicht Python-repr(list). Die Ketteneigenschaft ist intern vollständig.",
  },
  {
    id: "A2",
    kind: "assumption",
    text: "Zufall ist xoshiro128** plus Box-Muller. Drei unabhängige Streams (sensor, swarm, adapter) werden per SplitMix32 aus dem Master-Seed abgeleitet. Verträge: uniform auf [0,1), normal(mean, std). Nicht bit-identisch zu NumPy PCG64 oder CPython MT19937.",
  },
  {
    id: "A3",
    kind: "assumption",
    text: "Die Uhr ist injizierbar. Diagnostik und der Boot-Lauf nutzen eine logische UTC-Uhr, damit die SHA-256-Lineage prozessgleich ist. Manuelle Läufe stempeln mit echter UTC-Zeit.",
  },
  {
    id: "C1",
    kind: "correction",
    text: "Salienz gewichtet mit dem Prior mal ||Wx+b|| vor der Projektion auf S^(d-1). Im PDF wird zuerst normiert und danach L2 gebildet; jede Modalität hat dann Energie 1, die Softmax kollabiert auf die konstanten Priors 1.0 / 0.8 / 1.2.",
  },
  {
    id: "C2",
    kind: "correction",
    text: "Sensorrauschen und interner Stress sind getrennte Argumente des Synthesizers. Die Tk-GUI übergibt internen Stress fälschlich als noise_level.",
  },
  {
    id: "C3",
    kind: "correction",
    text: "Ground Truth folgt latentDim und muss exakt Einheitsnorm haben. Die PDF-Defaultfactory erzeugt immer 512 Komponenten und fällt erst in __post_init__ um, wenn latentDim abweicht.",
  },
  {
    id: "C4",
    kind: "correction",
    text: "Der Ringpuffer prüft zusätzlich den Anker des ältesten Eintrags und den Head-Hash des neuesten. Die PDF-Prüfung kontrolliert nur Innenkanten und erkennt weder eine gefälschte Genesis-Kante noch eine Änderung des letzten Eintrags.",
  },
  {
    id: "C5",
    kind: "correction",
    text: "Seed ist eine ganze Zahl und wird auf uint32 reduziert. Der ungeseedete random.Random()-Zweig der PDF wird nicht angeboten, weil ein funktionaler Lauf reproduzierbar sein muss.",
  },
  {
    id: "C6",
    kind: "correction",
    text: "Agent 0 mit Trägheitsinversion ist eine Diagnosesonde (isInversionProbe) und entscheidet nicht, solange inversionCompetes false ist (Default). Bei gleicher Konfidenz gewinnt die kleinere Sphärendistanz. Ist die beste wählbare Konfidenz ≤ 0, ist der Lauf degenerate. Messung: bei Toleranz 1.0 waren alle Konfidenzen 0 und Agent 0 gewann per Index; im Stresstest bei Toleranz 0.25 gewann Agent 0 in 18 von 50 Iterationen.",
  },
  {
    id: "C7",
    kind: "correction",
    text: "Die Referee-Konfidenz benutzt die euklidische Distanz der Richtung auf der Einheitssphäre, nicht die Länge des verrauschten Vektors. Die Rohdistanz bleibt als d_pre. Ein Nullvektor hat keine Richtung; seine Sphärendistanz ist 2. Messung: Agent 0 ohne Rauschen hatte d_raw 1.148 gegen bis zu 1.363, obwohl er die Gegenrichtung zum Konsens ist.",
  },
  {
    id: "C8",
    kind: "correction",
    text: "Das Haptik-Embedding subtrahiert die Ruhegravitation [9.81, 0, 0, 0, 0, 0]. Der rohe IMU-Vektor des Synthesizers bleibt unverändert. Eine exakt verschwindende Abweichung wird auf die Achse e0 mit Energie 0 gelegt, damit die Projektion definiert bleibt. Messung: Kosinus der Haptik zwischen Umgebung 0.2 und 1.5 war 0.99996; im Eingaberaum nach Kompensation etwa 0.93.",
  },
  {
    id: "C9",
    kind: "correction",
    text: "Überarbeitet C1. Der Triage-Score ist Prior mal log1p(Energie), Energie weiter ||Wx+b|| vor der Projektion. Das lineare Produkt erzeugte bei Seed 42, 101 und 2026 sowie Umgebung 0.2, 0.8 und 1.5 das One-Hot [0, 0, 1] auf Haptik. Mit C8 und log1p liegt die Mischung im Bereich von etwa [0.76, 0.13, 0.11] und reagiert auf die Umgebung.",
  },
  {
    id: "C10",
    kind: "correction",
    text: "Schwarmrauschen skaliert mit der Basis. Standardabweichung pro Komponente = stress * noiseScale * ||base|| / sqrt(d), noiseScale Default 1. Gezogen wird uniform(-a, a) mit a = sqrt(3) * sigma, dieselbe Zahl Ziehungen wie zuvor. Analytisch ist der Kosinus zur Basis 1/sqrt(1+(stress*noiseScale)^2): etwa 0.97 bei 0.25, 0.71 bei 1.0. Vorher lag Agent 1 bei Stress 1.0 nur bei Kosinus 0.45.",
  },
  {
    id: "C11",
    kind: "correction",
    text: "Der Aktionsdecoder verlangt eine Kosinus-Marge von mindestens actionMinMargin (Default 0.05), sonst UNDECIDED. Die neun Aktionsvektoren bleiben zufällige Einheitsvektoren ohne Referenzszenario; die Namen sind ein Platzhalter. Messung im früheren Standardlauf: bester Kosinus 0.067, Marge 0.025, Zufallsstreuung bei 512D etwa 0.044.",
  },
  {
    id: "C12",
    kind: "correction",
    text: "Die Selbsttests T1 bis T8 prüfen Eigenschaften: die Sonde gewinnt einen Gleichstand nicht, der Referee ist skaleninvariant, der Haptik-Kosinus liegt unter 0.95, die Triage ist keine Einheitsmasse, das Rauschen trifft den analytischen Kosinus, eine zu kleine Marge ergibt UNDECIDED, ein Toleranz-Sweep wirft nicht. Sie ersetzen die acht Masterprüfungen nicht.",
  },
  {
    id: "C13",
    kind: "correction",
    text: "Export-Schema upo-run-1 enthält schemaVersion, kernelVersion, Notiz-IDs, die volle Config, die RNG-Kennung xoshiro128**/SplitMix32, pro Agent stress, pre, post, d_pre, sphereDist, isInversionProbe und pro Lauf margin, degenerate, winner, tieCount. Interner Stress im Stresstest ist min(1.5, noise*0.25) und steigt bis Iteration 49. Die Umgebung bleibt ab Iteration 44 bei 1.5 gedeckelt; das Plateau ist das Masterprotokoll und hier benannt.",
  },
  {
    id: "C14",
    kind: "correction",
    text: "Die Python-Datei des PDF-Masters ist als historische Spezifikation eingefroren. Ausführbare Referenz ist dieser TypeScript-Kern. Bekannte Defekte dort: math.cos auf einem NumPy-Array wirft TypeError; die GUI übergibt internen Stress als noise_level; der HTML-Export lädt Three.js von cdnjs und ist numerisch nicht identisch. Ein NumPy-Check bestätigt nur die korrigierte Audio-Zeile und den Gravitation-Kosinus, nicht eine zweite Ontologie.",
  },
];
