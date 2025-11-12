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
        // Unterstütze sowohl 'tiles' als auch 'map' als Property-Name
        const tilesData = levelData.tiles || levelData.map;
        const parsedTiles = this.parseTiles(tilesData);
        
        // Speichere Original-Tiles für Reset
        this.originalTiles = parsedTiles.map(row => [...row]);
        this.tiles = parsedTiles.map(row => [...row]);
        
        this.spawnPoint = levelData.spawnPoint || levelData.spawn || { x: 64, y: 300 };
        
        // Goal: Wenn nur x,y angegeben, ergänze width/height
        const goalData = levelData.goal || { x: this.width * this.tileSize - 100, y: 200 };
        this.goal = {
            x: goalData.x,
            y: goalData.y,
            width: goalData.width || 64,
            height: goalData.height || 64
        };
        
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
        
        // Café-Animation (wehende Fahne)
        this.flagWave = 0;
        this.flagSpeed = 0.08;
        
        // Hintergrundelemente (dekorativ, kein Gameplay-Einfluss)
        this.backgroundElements = this.generateBackgroundElements();
    }

    /**
     * Generiere dekorative Hintergrundelemente (Bäume, Wolken)
     */
    generateBackgroundElements() {
        const elements = {
            trees: [],
            clouds: []
        };
        
        const levelWidth = this.width * this.tileSize;
        const levelHeight = this.height * this.tileSize;
        
        // Generiere Bäume (am Boden)
        const treeCount = Math.floor(this.width / 10); // Alle ~10 Tiles ein Baum
        for (let i = 0; i < treeCount; i++) {
            const x = Math.random() * levelWidth;
            const groundY = this.findGroundAt(x);
            
            if (groundY !== null) {
                elements.trees.push({
                    x: x,
                    y: groundY,
                    height: 80 + Math.random() * 40, // 80-120px hoch
                    trunkWidth: 12 + Math.random() * 8, // 12-20px breit
                    crownRadius: 30 + Math.random() * 20, // 30-50px Radius
                    crownColor: Math.random() > 0.5 ? '#228B22' : '#2E8B57', // Verschiedene Grüntöne
                    swayOffset: Math.random() * Math.PI * 2 // Für Animation
                });
            }
        }
        
        // Generiere Wolken (am Himmel)
        const cloudCount = Math.floor(this.width / 8);
        for (let i = 0; i < cloudCount; i++) {
            elements.clouds.push({
                x: Math.random() * levelWidth,
                y: Math.random() * (levelHeight * 0.3), // Obere 30% des Levels
                width: 60 + Math.random() * 40, // 60-100px breit
                height: 30 + Math.random() * 20, // 30-50px hoch
                speed: 0.1 + Math.random() * 0.3, // Langsame Bewegung
                opacity: 0.6 + Math.random() * 0.3
            });
        }
        
        return elements;
    }

    /**
     * Finde den Boden (erstes solides Tile) an einer X-Position
     * Nur im Ground-Level (letzte 5 Zeilen), nicht auf Plattformen
     */
    findGroundAt(x) {
        const col = Math.floor(x / this.tileSize);
        const groundLevel = this.height - 5; // Ground-Level beginnt hier
        
        // Suche nur im Ground-Level Bereich (letzte 5 Zeilen)
        for (let row = groundLevel; row < this.tiles.length; row++) {
            const tile = this.getTile(col, row);
            if (tile && tile.solid) {
                return row * this.tileSize;
            }
        }
        
        return null;
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
        
        // Café Fahnen-Animation
        this.flagWave += this.flagSpeed;
        
        // Update Wolken (Bewegung)
        const levelWidth = this.width * this.tileSize;
        this.backgroundElements.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            // Wrap around wenn Wolke rechts raus ist
            if (cloud.x > levelWidth + cloud.width) {
                cloud.x = -cloud.width;
            }
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

        // Zeichne Hintergrundelemente ZUERST (hinter allem)
        this.drawBackgroundElements(ctx, camera);

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

        // Zeichne Café Fin (Levelziel)
        this.drawCafe(ctx, camera);

        // Zeichne Münzen
        this.coins.forEach(coin => coin.draw(ctx, camera));
        
        // Zeichne Gegner
        this.enemies.forEach(enemy => enemy.draw(ctx, camera));
    }

    /**
     * Zeichne dekorative Hintergrundelemente
     */
    drawBackgroundElements(ctx, camera) {
        // Wolken (im Himmel)
        this.backgroundElements.clouds.forEach(cloud => {
            const x = cloud.x - camera.x;
            const y = cloud.y - camera.y;
            
            // Nur zeichnen wenn im sichtbaren Bereich
            if (x + cloud.width > 0 && x < camera.width && y + cloud.height > 0 && y < camera.height) {
                ctx.save();
                ctx.globalAlpha = cloud.opacity;
                ctx.fillStyle = '#FFFFFF';
                
                // Wolke aus mehreren Kreisen
                ctx.beginPath();
                ctx.arc(x + cloud.width * 0.25, y + cloud.height * 0.6, cloud.height * 0.4, 0, Math.PI * 2);
                ctx.arc(x + cloud.width * 0.5, y + cloud.height * 0.4, cloud.height * 0.5, 0, Math.PI * 2);
                ctx.arc(x + cloud.width * 0.75, y + cloud.height * 0.6, cloud.height * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // Bäume (am Boden)
        this.backgroundElements.trees.forEach(tree => {
            const x = tree.x - camera.x;
            const y = tree.y - camera.y;
            
            // Nur zeichnen wenn im sichtbaren Bereich
            if (x + tree.crownRadius > 0 && x - tree.crownRadius < camera.width) {
                ctx.save();
                
                // Leichtes Schwanken im Wind
                const sway = Math.sin(Date.now() * 0.001 + tree.swayOffset) * 2;
                
                // Baumstamm (braun)
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(
                    x - tree.trunkWidth / 2 + sway,
                    y - tree.height,
                    tree.trunkWidth,
                    tree.height
                );
                
                // Baumkrone (grün) - drei Kreise für buschige Form
                ctx.fillStyle = tree.crownColor;
                
                // Unterer Kreis
                ctx.beginPath();
                ctx.arc(x + sway * 1.5, y - tree.height + tree.crownRadius * 0.7, tree.crownRadius * 0.8, 0, Math.PI * 2);
                ctx.fill();
                
                // Mittlerer Kreis (größer)
                ctx.beginPath();
                ctx.arc(x + sway * 2, y - tree.height, tree.crownRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Oberer Kreis
                ctx.beginPath();
                ctx.arc(x + sway * 1.5, y - tree.height - tree.crownRadius * 0.6, tree.crownRadius * 0.7, 0, Math.PI * 2);
                ctx.fill();
                
                // Dunklere Schattierung für Tiefe
                ctx.fillStyle = 'rgba(0, 100, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(x + sway * 2 - tree.crownRadius * 0.3, y - tree.height + tree.crownRadius * 0.3, tree.crownRadius * 0.6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
    }

    /**
     * Zeichne Café Fin mit wehender Fahne
     */
    drawCafe(ctx, camera) {
        const x = this.goal.x - camera.x;
        const y = this.goal.y - camera.y;
        const width = this.goal.width;
        const height = this.goal.height;
        
        ctx.save();
        
        // Haus-Grundstruktur (größer für ein Café)
        const houseWidth = width * 1.5;
        const houseHeight = height * 1.3;
        const houseX = x - (houseWidth - width) / 2;
        const houseY = y + height - houseHeight;
        
        // Wände (beige)
        ctx.fillStyle = '#F5DEB3';
        ctx.fillRect(houseX, houseY + houseHeight * 0.3, houseWidth, houseHeight * 0.7);
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 2;
        ctx.strokeRect(houseX, houseY + houseHeight * 0.3, houseWidth, houseHeight * 0.7);
        
        // Dach (rot/braun)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(houseX - 8, houseY + houseHeight * 0.3);
        ctx.lineTo(houseX + houseWidth / 2, houseY);
        ctx.lineTo(houseX + houseWidth + 8, houseY + houseHeight * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fenster (links)
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(houseX + 8, houseY + houseHeight * 0.4, houseWidth * 0.25, houseHeight * 0.25);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(houseX + 8, houseY + houseHeight * 0.4, houseWidth * 0.25, houseHeight * 0.25);
        // Fensterkreuz
        ctx.beginPath();
        ctx.moveTo(houseX + 8 + houseWidth * 0.125, houseY + houseHeight * 0.4);
        ctx.lineTo(houseX + 8 + houseWidth * 0.125, houseY + houseHeight * 0.4 + houseHeight * 0.25);
        ctx.moveTo(houseX + 8, houseY + houseHeight * 0.4 + houseHeight * 0.125);
        ctx.lineTo(houseX + 8 + houseWidth * 0.25, houseY + houseHeight * 0.4 + houseHeight * 0.125);
        ctx.stroke();
        
        // Fenster (rechts)
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(houseX + houseWidth - 8 - houseWidth * 0.25, houseY + houseHeight * 0.4, houseWidth * 0.25, houseHeight * 0.25);
        ctx.strokeStyle = '#654321';
        ctx.strokeRect(houseX + houseWidth - 8 - houseWidth * 0.25, houseY + houseHeight * 0.4, houseWidth * 0.25, houseHeight * 0.25);
        // Fensterkreuz
        ctx.beginPath();
        ctx.moveTo(houseX + houseWidth - 8 - houseWidth * 0.125, houseY + houseHeight * 0.4);
        ctx.lineTo(houseX + houseWidth - 8 - houseWidth * 0.125, houseY + houseHeight * 0.4 + houseHeight * 0.25);
        ctx.moveTo(houseX + houseWidth - 8 - houseWidth * 0.25, houseY + houseHeight * 0.4 + houseHeight * 0.125);
        ctx.lineTo(houseX + houseWidth - 8, houseY + houseHeight * 0.4 + houseHeight * 0.125);
        ctx.stroke();
        
        // Tür (mittig)
        const doorWidth = houseWidth * 0.3;
        const doorHeight = houseHeight * 0.5;
        const doorX = houseX + (houseWidth - doorWidth) / 2;
        const doorY = houseY + houseHeight - doorHeight;
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
        ctx.strokeStyle = '#4B3621';
        ctx.lineWidth = 2;
        ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);
        
        // Türknauf
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(doorX + doorWidth * 0.8, doorY + doorHeight * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Markise über der Tür (gestreift rot-weiß)
        const awningHeight = 12;
        const awningY = doorY - awningHeight;
        const stripeWidth = doorWidth / 6;
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#FF6B6B' : '#FFFFFF';
            ctx.fillRect(doorX + i * stripeWidth, awningY, stripeWidth, awningHeight);
        }
        ctx.strokeStyle = '#CC0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(doorX, awningY, doorWidth, awningHeight);
        
        // Schild "CAFÉ FIN"
        const signWidth = houseWidth * 0.8;
        const signHeight = 20;
        const signX = houseX + (houseWidth - signWidth) / 2;
        const signY = houseY + houseHeight * 0.15;
        
        // Schild-Hintergrund (Holz)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(signX, signY, signWidth, signHeight);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(signX, signY, signWidth, signHeight);
        
        // Text "CAFÉ FIN"
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CAFÉ FIN', signX + signWidth / 2, signY + signHeight / 2);
        
        // Fahnenstange (links vom Haus, steht auf dem Boden)
        const poleX = houseX - 15;
        const poleBottom = houseY + houseHeight; // Boden des Hauses
        const poleHeight = houseHeight * 0.9; // Fast die ganze Haushöhe
        const poleY = poleBottom - poleHeight; // Start der Stange (oben)
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(poleX, poleY);
        ctx.lineTo(poleX, poleBottom);
        ctx.stroke();
        
        // Goldene Kugel oben auf der Stange
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(poleX, poleY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Wehende Fahne (animiert)
        const flagWidth = 30;
        const flagHeight = 20;
        ctx.fillStyle = '#FF69B4'; // Rosa Fahne
        
        ctx.beginPath();
        ctx.moveTo(poleX, poleY + 5);
        
        // Wellenförmige Fahne
        for (let i = 0; i <= flagWidth; i += 3) {
            const wave = Math.sin(this.flagWave + i * 0.2) * 3;
            const yPos = poleY + 5 + (i / flagWidth) * 0 + wave;
            ctx.lineTo(poleX + i, yPos);
        }
        
        for (let i = flagWidth; i >= 0; i -= 3) {
            const wave = Math.sin(this.flagWave + i * 0.2) * 3;
            const yPos = poleY + 5 + flagHeight + (i / flagWidth) * 0 + wave;
            ctx.lineTo(poleX + i, yPos);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Kleine Verzierung auf der Fahne (Herz)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        const heartX = poleX + flagWidth / 2 + Math.sin(this.flagWave) * 2;
        const heartY = poleY + 15 + Math.sin(this.flagWave + flagWidth * 0.1) * 3;
        ctx.fillText('♥', heartX, heartY);
        
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
     * Gibt ein Objekt zurück: { hit: boolean, enemyBounce: boolean }
     */
    checkEnemyCollisions(player) {
        // Prüfe normale Gegner
        for (let enemy of this.enemies) {
            if (enemy.checkCollision(player)) {
                // Prüfe ob Spieler von oben auf WalkingEnemy springt
                if (enemy instanceof WalkingEnemy && enemy.active && !enemy.isDying) {
                    const playerBounds = player.getBounds();
                    const playerBottom = playerBounds.y + playerBounds.height;
                    const enemyTop = enemy.y;
                    
                    // Spieler springt von oben drauf (Spieler fällt nach unten und ist über dem Gegner)
                    if (player.velocityY > 0 && playerBottom - player.velocityY <= enemyTop + 10) {
                        enemy.die(); // Start Death Animation
                        return { hit: false, enemyBounce: true }; // Kein Schaden, aber Sprung
                    }
                }
                
                return { hit: true, enemyBounce: false }; // Normale Kollision = Schaden
            }
        }
        
        // Prüfe Feuerbälle von ShootingEnemies
        for (let enemy of this.enemies) {
            if (enemy instanceof ShootingEnemy) {
                if (enemy.checkFireballCollisions(player)) {
                    return { hit: true, enemyBounce: false };
                }
            }
        }
        
        return { hit: false, enemyBounce: false };
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
