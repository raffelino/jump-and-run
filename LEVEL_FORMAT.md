# Level-Design Format

## String-basiertes Level-Design

Jedes Level wird jetzt als Array von Strings definiert. **Jede Zeile (String) hat die gleiche Länge** (z.B. 100 Zeichen für ein 100 Tiles breites Level).

### Tile-Zeichen Legende

| Zeichen | Tile-Typ | Beschreibung |
|---------|----------|--------------|
| `.` | Luft (air) | Leerer Raum, nicht begehbar |
| `G` | Boden (ground) | Solider Boden |
| `B` | Ziegel (brick) | Ziegel-Block |
| `P` | Rohr (pipe) | Rohr-Block |
| `p` | Plattform (platform) | Nur von oben begehbar (jump-through) |
| `S` | Stein (stone) | Stein-Block |
| `C` | Kristall (crystal) | Kristall-Block |
| `L` | Lava (lava) | Tödlich! Tötet bei Berührung |
| `c` | Wolke (cloud) | Wolken-Plattform (nur von oben begehbar) |
| `M` | Metall (metal) | Metall-Block |
| `I` | Eis (ice) | Rutschiger Eis-Block |
| `W` | Holz (wood) | Holz-Block |
| `o` | Münze (coin) | Sammelbare Münze |

## Beispiel

```javascript
{
    width: 50,
    height: 25,
    spawnPoint: { x: 64, y: 580 },
    goal: { x: 1500, y: 530, width: 64, height: 64 },
    tiles: [
        "..................................................",  // Zeile 0 - 50 Zeichen
        "..................................................",  // Zeile 1
        "..................................................",
        "..................................................",
        "..................................................",
        "..............ooo.............................",    // Münzen
        "..............ppp.............................",    // Plattform darunter
        "..................................................",
        "..................ooooo.......................",
        "..................ppppp.......................",
        "..................................................",
        // ... weitere 14 Zeilen bis Zeile 24
        "GGGGGGGGGGGGGGGGGGGG.....GGGGGGGGGGGGGGGGGGGGGGG", // Zeile 20 - Boden
        "GGGGGGGGGGGGGGGGGGGG.....GGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGG.....GGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGG.....GGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGG.....GGGGGGGGGGGGGGGGGGGGGGG"  // Zeile 24
    ]
}
```

## Vorteile

1. **Gleiche Zeilenlänge**: Alle Zeilen haben immer exakt die gleiche Anzahl Zeichen
2. **Visuelle Darstellung**: Man sieht das Level direkt im Code
3. **Einfach zu editieren**: Kopieren/Einfügen von Level-Abschnitten
4. **Keine Syntax-Fehler**: Keine Probleme mit Kommas, Klammern oder oktalen Zahlen
5. **Kompakt**: Weniger Zeichen als Arrays mit Zahlen

## Abwärtskompatibilität

Das System unterstützt **beide Formate**:
- Neues String-Format: `["..GGG", "..GGG"]`
- Altes Nummern-Format: `[[0,0,1,1,1], [0,0,1,1,1]]`

Die Level.js `parseTiles()` Methode konvertiert automatisch String-Format zu Nummern-Arrays.
