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
    text: "Zufall ist xoshiro128** plus Box-Muller. Vier unabhängige Streams (sensor, swarm, adapter, calib) werden per SplitMix32 aus dem Master-Seed abgeleitet. STREAM_CALIB dient nur der Margen-Kalibrierung und verschiebt die drei anderen nicht. Verträge: uniform auf [0,1), normal(mean, std). Nicht bit-identisch zu NumPy PCG64 oder CPython MT19937.",
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
    text: "Der Aktionsdecoder verlangt eine Kosinus-Marge von mindestens actionMinMargin, sonst UNDECIDED. Die neun Aktionsvektoren bleiben zufällige Einheitsvektoren ohne Referenzszenario; die Namen sind ein Platzhalter. Messung im früheren Standardlauf bei fester Schwelle 0.05: bester Kosinus 0.067, Marge 0.025, Zufallsstreuung bei 512D etwa 0.044. Seit C16 ist 0.05 nur noch ein expliziter Wert; der Default ist null und wird kalibriert.",
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
  {
    id: "C15",
    kind: "correction",
    text: "toleranceCritical ist das Maximum von Vor-Konfidenz geteilt durch Sphärendistanz über die zugelassenen Agenten. Der Lauf ist genau dann degeneriert, wenn die Toleranz mindestens diesen Wert erreicht. Headroom ist die Differenz. Messung am Standardlauf (gleichverteilte Ground Truth, Seed 42, Default-Regler): 0.5676. Ein Sweep von 0 bis 1.5 erfüllt degenerate === (tolerance >= toleranceCritical). Die 60-Szenarien-Raten des Nachtrags sind hier nicht erneut gemessen.",
  },
  {
    id: "C16",
    kind: "correction",
    text: "Wenn actionMinMargin null ist, gilt das 99. Perzentil einer Nullverteilung, Index floor(0.99*n) bei n=4000, auf dem zusätzlichen Strom STREAM_CALIB. Messung Seed 42: Schwelle 0.0916, Anteil der Kalibrierstichprobe darüber 0.0100, unabhängige Ziehung n=20000 danach 0.0103. Die feste Schwelle 0.05 bleibt nur explizit und wird in derselben Ziehung von 0.1177 der Zustände erreicht. Gewinner und Konfidenzen bleiben gleich.",
  },
  {
    id: "C17",
    kind: "correction",
    text: "Die Ground Truth kann die Richtung der Triage im Ruhe-Szenario sein (Umgebung 0.2, Rauschen 0.1, interner Stress 0, Seed 0), berechnet mit demselben Adapter und ohne Schwarm. Das ist eine benannte Annahme, keine gemessene Wahrheit. Der Default bleibt der gleichverteilte Einheitsvektor. Mittlere Sphärendistanz nur über zugelassene Agenten, Seed 42: Ruhe-Szenario 0.4310. Stresstest mit dieser Referenz: 0.4490 in Iteration 0, 1.2454 in Iteration 49, Proxy von 0.4401 bis 0.9052 (Spanne 0.4651), kein degenerierter Schritt.",
  },
  {
    id: "C18",
    kind: "correction",
    text: "swarmDiversity ist 1 minus den mittleren paarweisen Kosinus der Agenten ohne Sonde. Sie ist ein Gesundheitsindikator des Schwarms und ändert weder Gewinner noch Konfidenzen. Messung Standardlauf: 0.1600. Isoliert bei Inkrement 0, Schwelle 10, Einheitsbasis, Seed 42: Stress 0 gibt 0 (C10, Sigma 0), 0.2 gibt 0.0383, 0.5 gibt 0.1981, 1.0 gibt 0.4941. Das Band 0.20 bis 0.36 aus dem Nachtrag trifft diesen Kern nicht.",
  },
  {
    id: "C19",
    kind: "correction",
    text: "reproduceExportedRun lehnt zu großes, unlesbares und schemafremdes JSON mit ok=false ab und wirft nicht. Es übernimmt nur bekannte Parameter. Der Head-Hash wird exportiert und beim Replay nur verglichen, wenn der Lauf eine logische Uhr mit genanntem Ursprung hatte. Die SHA-256-Kette ist ein Manipulationsnachweis nur zusammen mit einem außerhalb gespeicherten Head-Hash. Der Replay ist ein Determinismus-Test, kein Echtheitsbeweis.",
  },
];
