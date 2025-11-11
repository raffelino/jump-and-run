# Kathis Adventure - Browser Spiel

Ein Jump & Run Spiel im Browser mit modularem Level-Framework.

## Features

✅ **Spielmechanik**
- Präzise Sprung- und Laufmechanik
- Kollisionserkennung mit Tiles
- 3 Leben zu Beginn
- Extra-Leben bei 100 gesammelten Münzen

✅ **Level-System**
- Welten mit jeweils 5 Leveln (konfigurierbar)
- 2 Beispiel-Welten enthalten:
  - Welt 1: Grasland (5 Level)
  - Welt 2: Dunkle Höhlen (5 Level)
- Level-Freischaltung nach Abschluss
- Fortschritts-Tracking

✅ **Grafik-System**
- Einfach austauschbare Grafiken
- Platzhalter-Sprites enthalten
- Anpassbare Farbpalette

## Spielsteuerung

- **Pfeiltasten Links/Rechts** oder **A/D** - Bewegung
- **Pfeiltaste Hoch**, **Leertaste** oder **W** - Springen

## Installation

1. Projekt herunterladen
2. `index.html` im Browser öffnen
3. Spielen!

Keine Build-Tools oder Installation erforderlich - läuft direkt im Browser.

## Projektstruktur

```
JumpAndRun/
├── index.html              # Haupt-HTML-Datei
├── styles.css              # Styling
├── js/
│   ├── main.js            # Haupt-Game-Engine
│   ├── InputHandler.js    # Tastatursteuerung
│   ├── AssetManager.js    # Grafik-Verwaltung
│   ├── Player.js          # Spieler-Logik
│   ├── Coin.js            # Münzen
│   ├── Level.js           # Level & Kamera
│   ├── WorldManager.js    # Welten-Verwaltung
│   └── levelDefinitions.js # Level-Definitionen
└── README.md
```

## Anpassung

### Eigene Grafiken einbinden

In `js/main.js` nach dem Erstellen des AssetManagers:

```javascript
// Beispiel: Eigene Spieler-Grafik laden
await this.assetManager.loadImage('player', 'pfad/zu/spieler.png');
```

### Farben ändern

In `js/main.js`:

```javascript
// Beispiel: Spieler-Farbe ändern
this.assetManager.setColor('player', '#00FF00'); // Grün
this.assetManager.setColor('ground', '#8B4513'); // Braun
```

### Neue Level hinzufügen

Bearbeite `js/levelDefinitions.js`:

```javascript
export const levelDefinitions = {
    world1: {
        name: "Deine Welt",
        levels: [
            {
                width: 100,        // Breite in Tiles
                height: 19,        // Höhe in Tiles
                spawnPoint: { x: 64, y: 400 },
                goal: { x: 3000, y: 350, width: 64, height: 64 },
                tiles: [
                    // 2D-Array: 0=Luft, 1=Boden, 2=Ziegel, 3=Röhre
                    [0,0,0, ...],
                    [0,0,0, ...],
                    // ...
                    [1,1,1, ...]
                ],
                coins: [
                    {x: 200, y: 350},
                    {x: 400, y: 300}
                ]
            }
        ]
    }
};
```

### Anzahl Level pro Welt ändern

In `js/main.js`, Zeile mit WorldManager:

```javascript
this.worldManager = new WorldManager(5); // Ändere 5 auf gewünschte Anzahl
```

### Neue Welt hinzufügen

In `js/main.js`, Methode `loadWorlds()`:

```javascript
this.worldManager.addWorld(
    "Deine neue Welt",
    levelDefinitions.world3.levels  // Definiere world3 in levelDefinitions.js
);
```

## Tile-Typen

- `0` - Luft (kein Block)
- `1` - Boden/Erde (braun)
- `2` - Ziegel/Brick (hellbraun)
- `3` - Röhre/Pipe (grün) [noch nicht verwendet]

## Entwicklung

Das Spiel verwendet:
- Vanilla JavaScript (ES6 Module)
- HTML5 Canvas für Rendering
- Keine externen Dependencies

### Erweiterungsmöglichkeiten

- Gegner hinzufügen
- Power-Ups implementieren
- Sound-Effekte und Musik
- Highscore-System
- Weitere Tile-Typen
- Animationen für Spieler
- Partikel-Effekte

## Lizenz

Frei verwendbar für persönliche und kommerzielle Projekte.

---

Viel Spaß beim Spielen und Erweitern! 🎮
