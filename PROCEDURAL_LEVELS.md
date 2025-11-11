# Prozedurales Level-Design System

## Übersicht

Das Spiel verwendet einen **deterministischen prozeduralen Level-Generator**, der Jump'n'Run-Level mit typischen Mustern generiert.

## Funktionsweise

### Seeded Random
- Jedes Level wird mit einem **festen Seed** generiert
- Gleicher Seed = gleiche Level-Generation
- Level ändern sich NICHT bei jedem Spielstart

### Level-Generierung

**5 Welten mit je 5 Levels = 25 Level total**

| Welt | Name | Seed | Schwierigkeit |
|------|------|------|---------------|
| 1 | Grasland | 1000 | Einfach |
| 2 | Dunkle Höhlen | 2000 | Mittel |
| 3 | Brennende Wüste | 3000 | Mittel-Schwer |
| 4 | Eisige Berge | 4000 | Schwer |
| 5 | Himmelsburg | 5000 | Sehr Schwer |

### Prozedurale Muster

Der Generator verwendet typische Jump'n'Run-Elemente:

1. **Plattformen**
   - Einzelne Plattformen (`p`)
   - Wolken-Plattformen (`c`)
   - Sprung-Sequenzen mit Lücken

2. **Hindernisse**
   - Holz-Säulen (`W`)
   - Stein-Blöcke (`S`)
   - Lava-Pools (`L`) - tödlich!

3. **Münzen**
   - Über Plattformen
   - In der Luft (riskante Sprünge)
   - Neben Hindernissen
   - Vertikale und horizontale Reihen

4. **Schwierigkeit**
   - Level 1: Wenige Hindernisse, große Plattformen
   - Level 2-3: Mehr Plattformen, erste Lava-Pools
   - Level 4-5: Eis-Plattformen (rutschig), komplexe Sprünge

5. **Dynamische Größe**
   - Level 1: 80 Tiles breit
   - Level 2: 90 Tiles breit
   - Level 3: 100 Tiles breit
   - Level 4: 110 Tiles breit
   - Level 5: 120 Tiles breit

## Code-Struktur

```javascript
// ProceduralLevelGenerator.js
import { generateWorldLevels } from '../ProceduralLevelGenerator.js';

// Generiere 5 Level mit Seed 1000
export const world1 = generateWorldLevels(1000, "Grasland", 5);
```

### Vorteile

✅ **25 einzigartige Level** mit wenig Code
✅ **Konsistente Qualität** durch Algorithmus
✅ **Deterministisch** - Level sind immer gleich
✅ **Schwierigkeit steigt** automatisch
✅ **Schnelle Iteration** - Seed ändern = neues Level

## Anpassung

Um Level zu ändern, ändere einfach den Seed:

```javascript
// Andere Level für Welt 1
export const world1 = generateWorldLevels(1337, "Grasland", 5);
```

Oder passe die Generator-Parameter an:
- `difficulty`: 1-5 (Schwierigkeit)
- `width`: Level-Breite in Tiles
- `height`: Level-Höhe in Tiles (immer 25)
