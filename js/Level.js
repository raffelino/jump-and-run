import { Coin } from './Coin.js';
import { WalkingEnemy, FlyingEnemy, ShootingEnemy, JumpingEnemy, ChargerEnemy, 
         StalactiteEnemy, BatEnemy, FireElemental, SpinningEnemy, SlidingEnemy, 
         IcicleEnemy, CloudEnemy, LightningEnemy } from './Enemy.js';

/**
 * Level Klasse - Tile-basiertes Level-System
 * Unterstützt verschiedene Tile-Typen und einfaches Level-Design
 */
export class Level {
    constructor(levelData, assetManager, worldName = 'Grasland') {
        this.assetManager = assetManager;
        this.worldName = worldName;
        this.isCave = levelData.isCave || false; // Ob Level eine Höhle ist
        this.groundTileType = levelData.groundTileType || 'G'; // Welcher Tile-Typ für Boden
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
     * Generiere dekorative Hintergrundelemente (weltspezifisch)
     */
    generateBackgroundElements() {
        const elements = {
            trees: [],
            clouds: [],
            rocks: [],
            stalactites: [],
            cacti: [],
            icecrystals: [],
            stars: []
        };
        
        const levelWidth = this.width * this.tileSize;
        const levelHeight = this.height * this.tileSize;
        
        // Weltspezifische Generierung
        switch(this.worldName) {
            case 'Grasland':
                this.generateGrasslandElements(elements, levelWidth, levelHeight);
                break;
            case 'Dunkle Höhlen':
                this.generateCaveElements(elements, levelWidth, levelHeight);
                break;
            case 'Brennende Wüste':
                this.generateDesertElements(elements, levelWidth, levelHeight);
                break;
            case 'Eisige Berge':
                this.generateIceElements(elements, levelWidth, levelHeight);
                break;
            case 'Himmelsburg':
                this.generateSkyElements(elements, levelWidth, levelHeight);
                break;
            default:
                this.generateGrasslandElements(elements, levelWidth, levelHeight);
        }
        
        return elements;
    }

    generateGrasslandElements(elements, levelWidth, levelHeight) {
        // Bäume (am Boden)
        const treeCount = Math.floor(this.width / 10);
        for (let i = 0; i < treeCount; i++) {
            const x = Math.random() * levelWidth;
            const groundY = this.findGroundAt(x);
            
            if (groundY !== null) {
                elements.trees.push({
                    x: x,
                    y: groundY,
                    height: 80 + Math.random() * 40,
                    trunkWidth: 12 + Math.random() * 8,
                    crownRadius: 30 + Math.random() * 20,
                    crownColor: Math.random() > 0.5 ? '#228B22' : '#2E8B57',
                    swayOffset: Math.random() * Math.PI * 2
                });
            }
        }
        
        // Wolken (am Himmel)
        const cloudCount = Math.floor(this.width / 8);
        for (let i = 0; i < cloudCount; i++) {
            elements.clouds.push({
                x: Math.random() * levelWidth,
                y: Math.random() * (levelHeight * 0.3),
                width: 60 + Math.random() * 40,
                height: 30 + Math.random() * 20,
                speed: 0.1 + Math.random() * 0.3,
                opacity: 0.6 + Math.random() * 0.3
            });
        }
    }

    generateCaveElements(elements, levelWidth, levelHeight) {
        // Stalaktiten (von der Decke hängend)
        const stalactiteCount = Math.floor(this.width / 6);
        for (let i = 0; i < stalactiteCount; i++) {
            elements.stalactites.push({
                x: Math.random() * levelWidth,
                y: 0,
                length: 40 + Math.random() * 80,
                width: 15 + Math.random() * 15,
                color: '#696969'
            });
        }
        
        // Felsen am Boden
        const rockCount = Math.floor(this.width / 8);
        for (let i = 0; i < rockCount; i++) {
            const x = Math.random() * levelWidth;
            const groundY = this.findGroundAt(x);
            
            if (groundY !== null) {
                elements.rocks.push({
                    x: x,
                    y: groundY,
                    width: 30 + Math.random() * 40,
                    height: 20 + Math.random() * 30,
                    color: Math.random() > 0.5 ? '#808080' : '#696969'
                });
            }
        }
    }

    generateDesertElements(elements, levelWidth, levelHeight) {
        // Kakteen
        const cactusCount = Math.floor(this.width / 12);
        for (let i = 0; i < cactusCount; i++) {
            const x = Math.random() * levelWidth;
            const groundY = this.findGroundAt(x);
            
            if (groundY !== null) {
                elements.cacti.push({
                    x: x,
                    y: groundY,
                    height: 40 + Math.random() * 60,
                    width: 20 + Math.random() * 15,
                    armLeft: Math.random() > 0.5,
                    armRight: Math.random() > 0.5,
                    armHeight: 20 + Math.random() * 20
                });
            }
        }
        
        // Weniger Wolken, mehr transparent (heiß und dunstig)
        const cloudCount = Math.floor(this.width / 15);
        for (let i = 0; i < cloudCount; i++) {
            elements.clouds.push({
                x: Math.random() * levelWidth,
                y: Math.random() * (levelHeight * 0.2),
                width: 80 + Math.random() * 60,
                height: 25 + Math.random() * 15,
                speed: 0.05 + Math.random() * 0.15,
                opacity: 0.2 + Math.random() * 0.2
            });
        }
    }

    generateIceElements(elements, levelWidth, levelHeight) {
        // Eiskristalle/Eiszapfen
        const crystalCount = Math.floor(this.width / 5);
        for (let i = 0; i < crystalCount; i++) {
            elements.icecrystals.push({
                x: Math.random() * levelWidth,
                y: Math.random() * (levelHeight * 0.4),
                size: 10 + Math.random() * 25,
                rotation: Math.random() * Math.PI * 2,
                sparkle: Math.random() * Math.PI * 2
            });
        }
        
        // Felsen mit Schnee
        const rockCount = Math.floor(this.width / 10);
        for (let i = 0; i < rockCount; i++) {
            const x = Math.random() * levelWidth;
            const groundY = this.findGroundAt(x);
            
            if (groundY !== null) {
                elements.rocks.push({
                    x: x,
                    y: groundY,
                    width: 35 + Math.random() * 45,
                    height: 25 + Math.random() * 35,
                    color: '#B0C4DE',
                    hasSnow: true
                });
            }
        }
    }

    generateSkyElements(elements, levelWidth, levelHeight) {
        // Sterne
        const starCount = Math.floor(this.width / 3);
        for (let i = 0; i < starCount; i++) {
            elements.stars.push({
                x: Math.random() * levelWidth,
                y: Math.random() * (levelHeight * 0.5),
                size: 2 + Math.random() * 4,
                twinkle: Math.random() * Math.PI * 2,
                brightness: 0.5 + Math.random() * 0.5
            });
        }
        
        // Viele helle Wolken
        const cloudCount = Math.floor(this.width / 5);
        for (let i = 0; i < cloudCount; i++) {
            elements.clouds.push({
                x: Math.random() * levelWidth,
                y: Math.random() * (levelHeight * 0.6),
                width: 70 + Math.random() * 50,
                height: 35 + Math.random() * 25,
                speed: 0.15 + Math.random() * 0.4,
                opacity: 0.7 + Math.random() * 0.3,
                isFluffy: true
            });
        }
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
                case 'jumping':
                    enemy = new JumpingEnemy(data.x, data.y);
                    break;
                case 'charger':
                    enemy = new ChargerEnemy(data.x, data.y);
                    break;
                case 'stalactite':
                    enemy = new StalactiteEnemy(data.x, data.y);
                    break;
                case 'bat':
                    enemy = new BatEnemy(data.x, data.y);
                    break;
                case 'fireElemental':
                    enemy = new FireElemental(data.x, data.y);
                    break;
                case 'spinning':
                    enemy = new SpinningEnemy(data.x, data.y);
                    break;
                case 'sliding':
                    enemy = new SlidingEnemy(data.x, data.y);
                    break;
                case 'icicle':
                    enemy = new IcicleEnemy(data.x, data.y);
                    break;
                case 'cloud':
                    enemy = new CloudEnemy(data.x, data.y, data.cloudPlatforms || []);
                    break;
                case 'lightning':
                    enemy = new LightningEnemy(data.x, data.y);
                    break;
            }
            if (enemy) {
                this.enemies.push(enemy);
            }
        });
    }

    update(player, deltaTime = 16) {
        // Frame-rate Normalisierung
        const timeScale = deltaTime / 16.67;
        
        this.coins.forEach(coin => coin.update());
        
        // Lava Animation (mit timeScale)
        this.lavaAnimationTimer += deltaTime;
        if (this.lavaAnimationTimer >= 200) {
            this.lavaAnimationTimer = 0;
            this.lavaAnimationFrame = (this.lavaAnimationFrame + 1) % 3;
        }
        
        // Café Fahnen-Animation (mit timeScale)
        this.flagWave += this.flagSpeed * timeScale;
        
        // Update Wolken (Bewegung mit timeScale)
        const levelWidth = this.width * this.tileSize;
        this.backgroundElements.clouds.forEach(cloud => {
            cloud.x += cloud.speed * timeScale;
            // Wrap around wenn Wolke rechts raus ist
            if (cloud.x > levelWidth + cloud.width) {
                cloud.x = -cloud.width;
            }
        });
        
        // Update Gegner (mit timeScale)
        this.enemies.forEach(enemy => {
            // Diese Gegner brauchen Player-Referenz
            if (enemy instanceof ShootingEnemy || 
                enemy instanceof ChargerEnemy || 
                enemy instanceof StalactiteEnemy ||
                enemy instanceof IcicleEnemy) {
                enemy.update(this, player, timeScale);
            } else {
                enemy.update(this, timeScale);
            }
        });
    }

    draw(ctx, camera) {
        const startCol = Math.floor(camera.x / this.tileSize);
        const endCol = Math.ceil((camera.x + camera.width) / this.tileSize);
        const startRow = Math.floor(camera.y / this.tileSize);
        const endRow = Math.ceil((camera.y + camera.height) / this.tileSize);

        // Zeichne Himmel/Höhlen-Hintergrund
        this.drawBackground(ctx, camera);

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
    drawBackground(ctx, camera) {
        if (this.isCave) {
            // Dunkler Höhlen-Hintergrund
            const gradient = ctx.createLinearGradient(0, 0, 0, camera.height);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(1, '#2d2d2d');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, camera.width, camera.height);
        } else {
            // Himmel-Gradient je nach Welt
            let skyGradient;
            
            switch(this.worldName) {
                case 'Brennende Wüste':
                    skyGradient = ctx.createLinearGradient(0, 0, 0, camera.height);
                    skyGradient.addColorStop(0, '#FFB347'); // Orange
                    skyGradient.addColorStop(1, '#87CEEB');
                    break;
                case 'Eisige Berge':
                    skyGradient = ctx.createLinearGradient(0, 0, 0, camera.height);
                    skyGradient.addColorStop(0, '#B0E0E6'); // Eisblau
                    skyGradient.addColorStop(1, '#E0FFFF');
                    break;
                case 'Himmelsburg':
                    skyGradient = ctx.createLinearGradient(0, 0, 0, camera.height);
                    skyGradient.addColorStop(0, '#191970'); // Dunkelblau
                    skyGradient.addColorStop(0.5, '#4169E1');
                    skyGradient.addColorStop(1, '#87CEEB');
                    break;
                default: // Grasland & Default
                    skyGradient = ctx.createLinearGradient(0, 0, 0, camera.height);
                    skyGradient.addColorStop(0, '#87CEEB'); // Himmelblau
                    skyGradient.addColorStop(1, '#B0E0E6');
            }
            
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, camera.width, camera.height);
        }
    }

    /**
     * Zeichne dekorative Hintergrundelemente
     */
    drawBackgroundElements(ctx, camera) {
        // Sterne (Himmelsburg)
        this.backgroundElements.stars.forEach(star => {
            const x = star.x - camera.x * 0.5; // Parallax
            const y = star.y - camera.y * 0.5;
            
            if (x > -10 && x < camera.width + 10 && y > -10 && y < camera.height + 10) {
                const twinkle = Math.sin(Date.now() * 0.003 + star.twinkle) * 0.3 + 0.7;
                ctx.save();
                ctx.globalAlpha = star.brightness * twinkle;
                ctx.fillStyle = '#FFFFFF';
                
                // Stern (4 Punkte)
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI / 2);
                    const px = x + Math.cos(angle) * star.size;
                    const py = y + Math.sin(angle) * star.size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // Wolken (alle Welten außer Höhlen)
        this.backgroundElements.clouds.forEach(cloud => {
            const x = cloud.x - camera.x * 0.8; // Parallax
            const y = cloud.y - camera.y * 0.8;
            
            if (x + cloud.width > 0 && x < camera.width && y + cloud.height > 0 && y < camera.height) {
                ctx.save();
                ctx.globalAlpha = cloud.opacity;
                ctx.fillStyle = cloud.isFluffy ? '#FFFACD' : '#FFFFFF';
                
                // Wolke aus mehreren Kreisen
                ctx.beginPath();
                ctx.arc(x + cloud.width * 0.25, y + cloud.height * 0.6, cloud.height * 0.4, 0, Math.PI * 2);
                ctx.arc(x + cloud.width * 0.5, y + cloud.height * 0.4, cloud.height * 0.5, 0, Math.PI * 2);
                ctx.arc(x + cloud.width * 0.75, y + cloud.height * 0.6, cloud.height * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // Stalaktiten (Höhlen)
        this.backgroundElements.stalactites.forEach(stalactite => {
            const x = stalactite.x - camera.x;
            const y = stalactite.y - camera.y;
            
            if (x > -stalactite.width && x < camera.width && y < camera.height) {
                ctx.save();
                ctx.fillStyle = stalactite.color;
                
                // Dreieckige Form (Stalaktit)
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - stalactite.width / 2, y);
                ctx.lineTo(x, y + stalactite.length);
                ctx.lineTo(x + stalactite.width / 2, y);
                ctx.closePath();
                ctx.fill();
                
                // Highlight für 3D-Effekt
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x - stalactite.width / 4, y);
                ctx.lineTo(x, y + stalactite.length * 0.7);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // Felsen (Höhlen & Eis)
        this.backgroundElements.rocks.forEach(rock => {
            const x = rock.x - camera.x;
            const y = rock.y - camera.y;
            
            if (x + rock.width > 0 && x < camera.width) {
                ctx.save();
                ctx.fillStyle = rock.color;
                
                // Unregelmäßige Felsenform
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + rock.width * 0.3, y - rock.height * 0.8);
                ctx.lineTo(x + rock.width * 0.7, y - rock.height);
                ctx.lineTo(x + rock.width, y - rock.height * 0.6);
                ctx.lineTo(x + rock.width * 0.9, y);
                ctx.closePath();
                ctx.fill();
                
                // Schnee auf Felsen (Eiswelt)
                if (rock.hasSnow) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.moveTo(x + rock.width * 0.3, y - rock.height * 0.8);
                    ctx.lineTo(x + rock.width * 0.7, y - rock.height);
                    ctx.lineTo(x + rock.width * 0.6, y - rock.height * 0.9);
                    ctx.lineTo(x + rock.width * 0.4, y - rock.height * 0.7);
                    ctx.closePath();
                    ctx.fill();
                }
                
                ctx.restore();
            }
        });
        
        // Kakteen (Wüste)
        this.backgroundElements.cacti.forEach(cactus => {
            const x = cactus.x - camera.x;
            const y = cactus.y - camera.y;
            
            if (x + cactus.width > 0 && x < camera.width) {
                ctx.save();
                ctx.fillStyle = '#228B22';
                
                // Hauptkörper
                ctx.fillRect(x - cactus.width / 2, y - cactus.height, cactus.width, cactus.height);
                
                // Linker Arm
                if (cactus.armLeft) {
                    ctx.fillRect(
                        x - cactus.width / 2 - cactus.width * 0.6,
                        y - cactus.height * 0.6,
                        cactus.width * 0.6,
                        cactus.armHeight
                    );
                    ctx.fillRect(
                        x - cactus.width / 2 - cactus.width * 0.6,
                        y - cactus.height * 0.6 - cactus.armHeight,
                        cactus.width * 0.6,
                        cactus.armHeight
                    );
                }
                
                // Rechter Arm
                if (cactus.armRight) {
                    ctx.fillRect(
                        x + cactus.width / 2,
                        y - cactus.height * 0.7,
                        cactus.width * 0.6,
                        cactus.armHeight
                    );
                    ctx.fillRect(
                        x + cactus.width / 2,
                        y - cactus.height * 0.7 - cactus.armHeight,
                        cactus.width * 0.6,
                        cactus.armHeight
                    );
                }
                
                // Stacheln (kleine Linien)
                ctx.strokeStyle = '#1a5c1a';
                ctx.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    const sy = y - cactus.height + (i * cactus.height / 8);
                    ctx.beginPath();
                    ctx.moveTo(x - cactus.width / 2, sy);
                    ctx.lineTo(x - cactus.width / 2 - 3, sy);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x + cactus.width / 2, sy);
                    ctx.lineTo(x + cactus.width / 2 + 3, sy);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        });
        
        // Eiskristalle (Eiswelt)
        this.backgroundElements.icecrystals.forEach(crystal => {
            const x = crystal.x - camera.x * 0.7; // Parallax
            const y = crystal.y - camera.y * 0.7;
            
            if (x > -crystal.size && x < camera.width + crystal.size && y > -crystal.size && y < camera.height + crystal.size) {
                const sparkle = Math.sin(Date.now() * 0.002 + crystal.sparkle) * 0.3 + 0.7;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(crystal.rotation);
                ctx.globalAlpha = sparkle;
                
                // Kristall (Raute)
                ctx.fillStyle = '#B0E0E6';
                ctx.beginPath();
                ctx.moveTo(0, -crystal.size);
                ctx.lineTo(crystal.size * 0.6, 0);
                ctx.lineTo(0, crystal.size);
                ctx.lineTo(-crystal.size * 0.6, 0);
                ctx.closePath();
                ctx.fill();
                
                // Glanz
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = sparkle * 0.5;
                ctx.beginPath();
                ctx.moveTo(0, -crystal.size * 0.7);
                ctx.lineTo(crystal.size * 0.3, -crystal.size * 0.2);
                ctx.lineTo(0, crystal.size * 0.3);
                ctx.lineTo(-crystal.size * 0.2, 0);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // Bäume (Grasland)
        this.backgroundElements.trees.forEach(tree => {
            const x = tree.x - camera.x;
            const y = tree.y - camera.y;
            
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
        
        // Prüfe FireElemental Feuer-Spuren
        for (let enemy of this.enemies) {
            if (enemy instanceof FireElemental) {
                if (enemy.checkFireTrailCollision(player)) {
                    return { hit: true, enemyBounce: false };
                }
            }
        }
        
        // Prüfe IcicleEnemy Projektile
        for (let enemy of this.enemies) {
            if (enemy instanceof IcicleEnemy) {
                const slowEffect = enemy.checkIcicleCollision(player);
                if (slowEffect === 'slow') {
                    // TODO: Implement slow effect on player
                    return { hit: true, enemyBounce: false };
                }
            }
        }
        
        // Prüfe Lightning
        for (let enemy of this.enemies) {
            if (enemy instanceof LightningEnemy) {
                if (enemy.checkLightningCollision(player, this)) {
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
