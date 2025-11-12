# Level Generierung - Development Tool

## Übersicht

Dieses Projekt enthält ein Development-Tool zur prozeduralen Generierung von Levels. Die generierten Level werden als JavaScript-Code in die `world*.js` Dateien geschrieben und können dann manuell editiert werden.

## Verwendung

### Level generieren

```bash
node generate-levels.js
```

Dieses Kommando generiert:
- `js/levels/world1.js` - Grasland (5 Level)
- `js/levels/world2.js` - Dunkle Höhlen (5 Level)
- `js/levels/world3.js` - Brennende Wüste (5 Level)
- `js/levels/world4.js` - Eisige Berge (5 Level)
- `js/levels/world5.js` - Himmelsburg (5 Level)

### Nach der Generierung

Die generierten Dateien können manuell bearbeitet werden:

1. Öffne z.B. `js/levels/world1.js`
2. Editiere die Level-Maps direkt im Code
3. Füge/Entferne Plattformen, Gegner, Münzen etc.
4. Speichere die Datei
5. Lade das Spiel neu - deine Änderungen sind sofort sichtbar

## Welt-Konfiguration

Die Welten sind in `generate-levels.js` konfiguriert:

```javascript
const worlds = [
    {
        name: 'Grasland',
        file: 'world1.js',
        seed: 5500,
        levelCount: 5,
        description: 'Grüne Wiesen, Plattformen und einfache Hindernisse'
    },
    // ...
];
```

### Parameter ändern:

- **seed**: Ändert die zufällige Generierung (verschiedene Seeds = verschiedene Layouts)
- **levelCount**: Anzahl der Level pro Welt
- **name**: Name der Welt (wird im Spiel angezeigt)

## Tile-Legende

```
. = Luft (air)
G = Boden (ground)
B = Ziegel (brick)
P = Rohr (pipe)
p = Plattform (platform - nur von oben begehbar)
S = Stein (stone)
C = Kristall (crystal)
L = Lava (deadly - tödlich)
c = Wolke (cloud platform)
M = Metall (metal)
I = Eis (ice - rutschig)
W = Holz (wood)
o = Münze (coin)
1 = Gegner Typ 1 (walking enemy)
2 = Gegner Typ 2 (flying enemy)
3 = Gegner Typ 3 (shooting enemy)
```

## Beispiel: Manuelles Editieren

```javascript
export const world1 = {
    name: "Grasland",
    levels: [
        {
            width: 100,
            height: 25,
            spawn: { x: 64, y: 576 },
            goal: { x: 3136, y: 576 },
            map: [
                "....................................................................................................",
                "....................................................................................................",
                "..........oooo......................................................................................",
                "........pppppp....................................................................................."
                // ... weitere Zeilen
            ]
        }
    ]
};
```

Du kannst:
- Münzen (`o`) hinzufügen oder entfernen
- Plattformen (`p`) verschieben
- Gegner (`1`, `2`, `3`) platzieren
- Lava-Fallen (`L`) erstellen
- Das Layout komplett umgestalten

## Workflow

1. **Generiere** neue Level mit `node generate-levels.js`
2. **Teste** die Level im Spiel
3. **Editiere** die generierten Dateien manuell
4. **Teste** erneut
5. **Wiederhole** 3-4 bis das Level perfekt ist

## Hinweise

- Die generierten Level sind ein **Ausgangspunkt** - manuelle Bearbeitung macht sie besser!
- Jedes Level ist 100 Tiles breit und 25 Tiles hoch
- Der Spieler spawnt immer am Anfang (x: 64, y: 576)
- Das Ziel ist immer am Ende des Levels
- **Wichtig**: Sichere deine editierten Level, bevor du neu generierst!
