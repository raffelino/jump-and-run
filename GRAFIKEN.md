# Eigene Grafiken verwenden

## 🎨 Animierte Spielerfigur

Die Spielerfigur ist jetzt animiert mit 3 verschiedenen Zuständen:
- **Idle** (Stehen) - 2 Frames
- **Run** (Laufen) - 4 Frames  
- **Jump** (Springen) - 1 Frame

## 📋 Methode 1: Farbe des Platzhalters ändern

In `js/main.js` nach der Initialisierung:

```javascript
// Im Game Constructor nach this.assetManager.generatePlaceholderSprites()
this.assetManager.setColor('player', '#00AA00'); // Grüner Spieler
```

## 🖼️ Methode 2: Eigenes Sprite-Sheet verwenden

### Sprite-Sheet Format

Erstellen Sie ein PNG-Bild mit folgendem Layout:

```
Reihe 0: [Idle Frame 1] [Idle Frame 2]
Reihe 1: [Run Frame 1] [Run Frame 2] [Run Frame 3] [Run Frame 4]
Reihe 2: [Jump Frame 1]
```

Jeder Frame sollte 32x32 Pixel sein (oder eine andere einheitliche Größe).

### Sprite-Sheet laden

In `js/main.js` in der `Game` Klasse:

```javascript
async constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.inputHandler = new InputHandler();
    this.assetManager = new AssetManager();
    
    // Lade eigenes Sprite-Sheet
    await this.assetManager.loadPlayerSpriteSheet('assets/player-spritesheet.png', {
        frameWidth: 32,
        frameHeight: 32,
        animations: {
            idle: { row: 0, frames: 2 },
            run: { row: 1, frames: 4 },
            jump: { row: 2, frames: 1 }
        }
    });
    
    // Rest des Codes...
    this.worldManager = new WorldManager(5);
    // ...
}
```

**Wichtig:** Ändern Sie `constructor()` zu `async constructor()` und fügen Sie `await` vor dem Sprite-Sheet Laden hinzu!

### Vollständiges Beispiel mit async Loading

```javascript
class Game {
    constructor() {
        this.init();
    }

    async init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.inputHandler = new InputHandler();
        this.assetManager = new AssetManager();
        
        // OPTION 1: Eigenes Sprite-Sheet
        try {
            await this.assetManager.loadPlayerSpriteSheet('assets/player.png', {
                frameWidth: 32,
                frameHeight: 32,
                animations: {
                    idle: { row: 0, frames: 2 },
                    run: { row: 1, frames: 4 },
                    jump: { row: 2, frames: 1 }
                }
            });
        } catch (error) {
            console.log('Sprite-Sheet nicht gefunden, verwende Platzhalter');
            this.assetManager.generatePlaceholderSprites();
        }
        
        // Rest der Initialisierung
        this.worldManager = new WorldManager(5);
        this.loadWorlds();
        // ... usw
    }
}
```

## 🎨 Methode 3: Einzelne Bilder für jeden Frame

Falls Sie separate Bilder haben:

```javascript
// Erstelle manuell die Sprite-Struktur
this.assetManager.sprites.player = {
    idle: [],
    run: [],
    jump: []
};

// Lade Idle Frames
await this.assetManager.loadImage('idle0', 'assets/player-idle-0.png');
await this.assetManager.loadImage('idle1', 'assets/player-idle-1.png');
this.assetManager.sprites.player.idle = [
    this.assetManager.loadedImages.idle0,
    this.assetManager.loadedImages.idle1
];

// Lade Run Frames
for (let i = 0; i < 4; i++) {
    await this.assetManager.loadImage(`run${i}`, `assets/player-run-${i}.png`);
    this.assetManager.sprites.player.run.push(this.assetManager.loadedImages[`run${i}`]);
}

// Lade Jump Frame
await this.assetManager.loadImage('jump0', 'assets/player-jump.png');
this.assetManager.sprites.player.jump = [this.assetManager.loadedImages.jump0];
```

## 📐 Größe anpassen

Falls Ihre Sprites eine andere Größe haben (z.B. 64x64):

In `js/Player.js` ändern:

```javascript
constructor(x, y, assetManager) {
    this.x = x;
    this.y = y;
    this.width = 64;  // Ändere hier die Größe
    this.height = 64; // Ändere hier die Größe
    // ...
}
```

## 🎬 Animationsgeschwindigkeit anpassen

In `js/Player.js`:

```javascript
constructor(x, y, assetManager) {
    // ...
    this.animationSpeed = 0.2; // Höher = schneller, Niedriger = langsamer
}
```

## 📁 Projekt-Struktur mit Grafiken

```
JumpAndRun/
├── index.html
├── styles.css
├── assets/                    # Erstellen Sie diesen Ordner
│   ├── player-spritesheet.png # Ihr Sprite-Sheet
│   ├── ground.png             # Optional: andere Grafiken
│   ├── brick.png
│   └── coin.png
└── js/
    └── ...
```

## 🎯 Tipps für Sprite-Sheets

1. **Transparenz**: Verwenden Sie PNG mit Transparenz
2. **Einheitliche Größe**: Alle Frames sollten die gleiche Größe haben
3. **Ausrichtung**: Stellen Sie sicher, dass die Figur in jedem Frame gleich ausgerichtet ist
4. **Power of 2**: Verwenden Sie Größen wie 16, 32, 64 Pixel für beste Performance

## 🔧 Debugging

Falls die Grafiken nicht laden:
1. Öffnen Sie die Browser Console (F12)
2. Prüfen Sie auf Fehler
3. Stellen Sie sicher, dass der Pfad korrekt ist
4. Verwenden Sie einen lokalen Webserver (nicht file://)

## 🌐 Kostenlose Sprite-Ressourcen

- itch.io - Viele kostenlose Pixel-Art Sprites
- OpenGameArt.org - Freie Spiel-Assets
- Kenney.nl - Kostenlose Spiele-Assets
