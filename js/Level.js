import { Coin } from './Coin.js';
import { WalkingEnemy, FlyingEnemy, ShootingEnemy } from './Enemy.js';

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
        
        // Tile-Mapping: Zeichen -> Tile-ID (MUSS VOR parseTiles definiert werden!)
        this.charToTile = {
            '.': 0,  // air
            'G': 1,  // ground
            'B': 2,  // brick
            'P': 3,  // pipe
            'p': 4,  // platform (nur von oben begehbar)
            'S': 5,  // stone
            'C': 6,  // crystal
            'L': 7,  // lava (tödlich)
            'c': 8,  // cloud (platform)
            'M': 9,  // metal
            'I': 10, // ice (rutschig)
            'W': 11, // wood
            'o': 12  // coin
        };
        
        // Konvertiere String-Tiles zu Nummern (falls nötig)
        const parsedTiles = this.parseTiles(levelData.tiles);
        
        // Speichere Original-Tiles für Reset
        this.originalTiles = parsedTiles.map(row => [...row]);
        this.tiles = parsedTiles.map(row => [...row]);
        
        this.spawnPoint = levelData.spawnPoint || { x: 64, y: 300 };
        this.goal = levelData.goal || { x: this.width * this.tileSize - 100, y: 200, width: 64, height: 64 };
        
        // Münzen aus Tiles generieren
        this.coins = [];
        this.generateCoinsFromTiles();
        
        // Gegner erstellen
        this.enemies = [];
        if (levelData.enemies) {
            this.createEnemies(levelData.enemies);
        }

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
        
        // Portal-Animation
        this.portalRotation = 0;
        this.portalPulse = 0;
        this.portalParticles = [];
        this.initPortalParticles();
    }
    
    /**
     * Initialisiere Portal-Partikel für Animation
     */
    initPortalParticles() {
        for (let i = 0; i < 20; i++) {
            this.portalParticles.push({
                angle: Math.random() * Math.PI * 2,
                radius: Math.random() * 30,
                speed: 0.02 + Math.random() * 0.03,
                size: 2 + Math.random() * 3,
                alpha: 0.3 + Math.random() * 0.7
            });
        }
    }

    /**
     * Parse Tiles - konvertiert String-Format zu Nummern-Arrays
     * Unterstützt beide Formate: String-basiert ["..GGG", "..GGG"] und Nummern-basiert [[0,0,1,1,1], [0,0,1,1,1]]
     */
    parseTiles(tiles) {
        if (!tiles || tiles.length === 0) return [];
        
        // Prüfe ob erstes Element ein String ist
        if (typeof tiles[0] === 'string') {
            // String-Format: Konvertiere zu Nummern
            return tiles.map(row => {
                return row.split('').map(char => {
                    // Prüfe ob Zeichen in charToTile gemappt ist
                    if (char in this.charToTile) {
                        return this.charToTile[char];
                    }
                    // Fallback: Luft
                    return 0;
                });
            });
        } else {
            // Nummern-Format: Direkt verwenden
            return tiles;
        }
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

    /**
     * Erstelle Gegner basierend auf levelData
     */
    createEnemies(enemyData) {
        enemyData.forEach(data => {
            let enemy;
            switch (data.type) {
                case 'walking':
                    enemy = new WalkingEnemy(data.x, data.y);
                    break;
                case 'flying':
                    enemy = new FlyingEnemy(data.x, data.y);
                    break;
                case 'shooting':
                    enemy = new ShootingEnemy(data.x, data.y);
                    break;
            }
            if (enemy) {
                this.enemies.push(enemy);
            }
        });
    }

    update(player) {
        this.coins.forEach(coin => coin.update());
        
        // Lava Animation
        this.lavaAnimationTimer += 16; // ca. 60fps
        if (this.lavaAnimationTimer >= 200) {
            this.lavaAnimationTimer = 0;
            this.lavaAnimationFrame = (this.lavaAnimationFrame + 1) % 3;
        }
        
        // Portal Animation
        this.portalRotation += 0.03;
        this.portalPulse += 0.05;
        
        // Portal-Partikel bewegen
        this.portalParticles.forEach(particle => {
            particle.angle += particle.speed;
        });
        
        // Update Gegner
        this.enemies.forEach(enemy => {
            if (enemy instanceof ShootingEnemy) {
                enemy.update(this, player);
            } else {
                enemy.update(this);
            }
        });
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

        // Zeichne Portal (Levelziel)
        this.drawPortal(ctx, camera);

        // Zeichne Münzen
        this.coins.forEach(coin => coin.draw(ctx, camera));
        
        // Zeichne Gegner
        this.enemies.forEach(enemy => enemy.draw(ctx, camera));
    }

    /**
     * Zeichne animiertes Portal
     */
    drawPortal(ctx, camera) {
        const centerX = this.goal.x + this.goal.width / 2 - camera.x;
        const centerY = this.goal.y + this.goal.height / 2 - camera.y;
        
        // Portal-Partikel zeichnen
        this.portalParticles.forEach(particle => {
            const x = centerX + Math.cos(particle.angle + this.portalRotation) * particle.radius;
            const y = centerY + Math.sin(particle.angle + this.portalRotation) * particle.radius;
            
            ctx.save();
            ctx.globalAlpha = particle.alpha * (0.5 + Math.sin(this.portalPulse) * 0.5);
            ctx.fillStyle = '#00FFFF';
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Äußerer Ring
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(this.portalPulse) * 0.3;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Mittlerer Ring (rotierend)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.portalRotation);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#0088FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Innerer Kern (pulsierend)
        const pulseSize = 12 + Math.sin(this.portalPulse * 2) * 3;
        ctx.save();
        ctx.globalAlpha = 0.8;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.5, '#00FFFF');
        gradient.addColorStop(1, '#0044FF');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

    /**
     * Prüfe Kollisionen mit Gegnern
     */
    checkEnemyCollisions(player) {
        // Prüfe normale Gegner
        for (let enemy of this.enemies) {
            if (enemy.checkCollision(player)) {
                return true;
            }
        }
        
        // Prüfe Feuerbälle von ShootingEnemies
        for (let enemy of this.enemies) {
            if (enemy instanceof ShootingEnemy) {
                if (enemy.checkFireballCollisions(player)) {
                    return true;
                }
            }
        }
        
        return false;
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
        // Tiles zurücksetzen und Münzen neu generieren
        this.tiles = this.originalTiles.map(row => [...row]);
        this.coins = [];
        this.generateCoinsFromTiles();
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
