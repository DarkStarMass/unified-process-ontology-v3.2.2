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
];
