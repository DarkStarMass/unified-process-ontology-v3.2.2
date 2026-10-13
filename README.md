# Unified Process Ontology

## v3.3.0 Operator

Browser-Operator für den vollen 512-D-Kern auf S^511. Kein abgeschnittener HTML-Kernel.

- TypeScript-Kernel unter `operator/v3.3.0/src/lib/upo/`
- Konsole, 3D-Topologie, Diagnostik, Stresstest, Multi-Seed, Dämpfungsgitter
- Sprachen: Deutsch, English, Français, Italiano

Korrekturen gegenüber dem PDF-Master, im Code benannt:

- C1 Salienz nutzt ||Wx+b|| vor der Projektion auf die Sphäre
- C2 Sensorrauschen und interner Stress sind getrennt
- C3 Ground Truth folgt der Dimension und hat Einheitsnorm
- C4 Ringpuffer prüft Anker und Head-Hash
- C5 Seed ist Pflicht

Zufall ist xoshiro128** mit drei Streams. Nicht bitgleich zu NumPy PCG64.

## v3.2.6

Deterministischer Action-Space, Distanz-Logging, Dynamic Stress Regulator, Tkinter-GUI und HTML. Dateien unter `src/v3_2_6/`.

## v3.2.2

Ursprüngliche Version unter `src/`.
