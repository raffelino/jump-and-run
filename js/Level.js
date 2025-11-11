import { Coin } from './Coin.js';

/**
 * Level Klasse - Tile-basiertes Level-System
 * Unterstützt verschiedene Tile-Typen und einfaches Level-Design
 */
export class Level {
    constructor(levelData, assetManager) {
        this.assetManager = assetManager;
        this.tileSize = 32;
        this.width = levelData.width;
        this.height = levelData.height;
        this.tiles = levelData.tiles;
        this.spawnPoint = levelData.spawnPoint || { x: 64, y: 300 };
        this.goal = levelData.goal || { x: this.width * this.tileSize - 100, y: 200, width: 64, height: 64 };
        
        // Münzen aus Tiles generieren
        this.coins = [];
        this.generateCoinsFromTiles();

        // Tile-Typen
        this.tileTypes = {
            0: { name: 'air', solid: false, sprite: null },
            1: { name: 'ground', solid: true, sprite: 'ground' },
            2: { name: 'brick', solid: true, sprite: 'brick' },
            3: { name: 'pipe', solid: true, sprite: 'pipe' },
            4: { name: 'platform', solid: true, sprite: 'platform', platformOnly: true }, // Nur von oben begehbar
            5: { name: 'stone', solid: true, sprite: 'stone' },
            6: { name: 'crystal', solid: true, sprite: 'crystal' },
            7: { name: 'lava', solid: false, sprite: 'lava', deadly: true }, // Tötet bei Berührung
            8: { name: 'cloud', solid: true, sprite: 'cloud', platformOnly: true },
            9: { name: 'metal', solid: true, sprite: 'metal' },
            10: { name: 'ice', solid: true, sprite: 'ice', slippery: true }, // Rutschig
            11: { name: 'wood', solid: true, sprite: 'wood' },
            12: { name: 'coin', solid: false, sprite: null, isCoin: true } // Münze als Tile
        };
        
        this.lavaAnimationFrame = 0;
        this.lavaAnimationTimer = 0;
    }

    getTile(col, row) {
        if (row < 0 || row >= this.tiles.length || col < 0 || col >= this.tiles[row].length) {
            return null;
        }
        const tileId = this.tiles[row][col];
        return this.tileTypes[tileId];
    }

    generateCoinsFromTiles() {
        // Durchsuche alle Tiles nach Coin-Tiles (Typ 12)
        for (let row = 0; row < this.tiles.length; row++) {
            for (let col = 0; col < this.tiles[row].length; col++) {
                if (this.tiles[row][col] === 12) {
                    // Erstelle Coin an dieser Position (zentriert im Tile)
                    const x = col * this.tileSize + 4; // 4px offset für Zentrierung
                    const y = row * this.tileSize + 4;
                    this.coins.push(new Coin(x, y, this.assetManager));
                    // Ersetze Coin-Tile durch Luft
                    this.tiles[row][col] = 0;
                }
            }
        }
    }

    update() {
        this.coins.forEach(coin => coin.update());
        
        // Lava Animation
        this.lavaAnimationTimer += 16; // ca. 60fps
        if (this.lavaAnimationTimer >= 200) {
            this.lavaAnimationTimer = 0;
            this.lavaAnimationFrame = (this.lavaAnimationFrame + 1) % 3;
        }
    }

    draw(ctx, camera) {
        const startCol = Math.floor(camera.x / this.tileSize);
        const endCol = Math.ceil((camera.x + camera.width) / this.tileSize);
        const startRow = Math.floor(camera.y / this.tileSize);
        const endRow = Math.ceil((camera.y + camera.height) / this.tileSize);

        // Zeichne Tiles
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const tile = this.getTile(col, row);
                if (tile && tile.sprite) {
                    const x = col * this.tileSize - camera.x;
                    const y = row * this.tileSize - camera.y;
                    
                    // Animierte Tiles (Lava)
                    if (tile.sprite === 'lava') {
                        ctx.drawImage(
                            this.assetManager.getSprite('lava')[this.lavaAnimationFrame],
                            x, y,
                            this.tileSize, this.tileSize
                        );
                    } else {
                        ctx.drawImage(
                            this.assetManager.getSprite(tile.sprite),
                            x, y,
                            this.tileSize, this.tileSize
                        );
                    }
                }
            }
        }

        // Zeichne Ziel (Flagge)
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(
            this.goal.x - camera.x,
            this.goal.y - camera.y,
            this.goal.width,
            this.goal.height
        );
        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('ZIEL', this.goal.x - camera.x + 10, this.goal.y - camera.y + 35);

        // Zeichne Münzen
        this.coins.forEach(coin => coin.draw(ctx, camera));
    }

    checkCoinCollisions(player) {
        let coinsCollected = 0;
        this.coins.forEach(coin => {
            if (coin.checkCollision(player)) {
                coinsCollected++;
            }
        });
        return coinsCollected;
    }

    checkGoalReached(player) {
        const playerBounds = player.getBounds();
        return (
            playerBounds.x < this.goal.x + this.goal.width &&
            playerBounds.x + playerBounds.width > this.goal.x &&
            playerBounds.y < this.goal.y + this.goal.height &&
            playerBounds.y + playerBounds.height > this.goal.y
        );
    }

    reset() {
        this.coins.forEach(coin => coin.reset());
    }
}

/**
 * Camera Klasse - Folgt dem Spieler
 */
export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
    }

    follow(player, levelWidth, levelHeight) {
        // Zentriere Kamera auf Spieler
        this.x = player.x - this.width / 2 + player.width / 2;
        this.y = player.y - this.height / 2 + player.height / 2;

        // Begrenze Kamera auf Level-Grenzen
        this.x = Math.max(0, Math.min(this.x, levelWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, levelHeight - this.height));
    }
}
