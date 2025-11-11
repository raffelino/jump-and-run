/**
 * Prozeduraler Level-Generator für Jump'n'Run
 * Verwendet Seeded Random und typische Jump'n'Run-Muster
 */

class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    chance(probability) {
        return this.next() < probability;
    }
}

export class ProceduralLevelGenerator {
    constructor() {
        // Typische Jump'n'Run-Muster
        this.patterns = {
            // Einfache Plattform-Sequenzen
            stairUp: (startCol, startRow, length) => {
                const tiles = [];
                for (let i = 0; i < length; i++) {
                    tiles.push({ col: startCol + i * 4, row: startRow - i * 2, tile: 'p', width: 3 });
                }
                return tiles;
            },
            
            stairDown: (startCol, startRow, length) => {
                const tiles = [];
                for (let i = 0; i < length; i++) {
                    tiles.push({ col: startCol + i * 4, row: startRow + i * 2, tile: 'p', width: 3 });
                }
                return tiles;
            },
            
            // Plattform-Sprünge
            platformJumps: (startCol, startRow, count, gap) => {
                const tiles = [];
                for (let i = 0; i < count; i++) {
                    tiles.push({ col: startCol + i * (gap + 3), row: startRow, tile: 'p', width: 3 });
                }
                return tiles;
            },
            
            // Floating Islands
            floatingIsland: (startCol, startRow, width) => {
                const tiles = [];
                for (let col = 0; col < width; col++) {
                    tiles.push({ col: startCol + col, row: startRow, tile: 'G' });
                }
                return tiles;
            },
            
            // Wolken-Plattformen
            cloudPlatform: (startCol, startRow, width) => {
                const tiles = [];
                for (let col = 0; col < width; col++) {
                    tiles.push({ col: startCol + col, row: startRow, tile: 'c' });
                }
                return tiles;
            }
        };
    }
    
    /**
     * Generiert ein Level basierend auf Seed und Schwierigkeit
     */
    generate(seed, width, height, difficulty = 1) {
        const rng = new SeededRandom(seed);
        
        // Initialisiere leeres Level
        const level = Array(height).fill(null).map(() => '.'.repeat(width));
        
        // Boden erstellen (letzte 5 Zeilen)
        const groundLevel = height - 5;
        for (let row = groundLevel; row < height; row++) {
            level[row] = 'G'.repeat(width);
        }
        
        // Löcher im Boden erstellen (schwieriger mit höherem difficulty)
        // ABER: Schütze Start-Bereich (0-15) und Ziel-Bereich (width-15 bis width)
        const holeCount = Math.floor(difficulty * 2);
        for (let i = 0; i < holeCount; i++) {
            const holeStart = rng.range(20 + i * 15, width - 25);
            const holeWidth = rng.range(3, 5 + difficulty);
            // Stelle sicher, dass Loch nicht in Start/Ziel-Bereich ist
            if (holeStart < 15 || holeStart + holeWidth > width - 15) continue;
            
            for (let row = groundLevel; row < height; row++) {
                level[row] = this.replaceRange(level[row], holeStart, holeWidth, '.');
            }
        }
        
        // Plattformen und Hindernisse generieren
        const platformCount = 8 + difficulty * 3;
        const usedPositions = new Set();
        
        for (let i = 0; i < platformCount; i++) {
            const col = rng.range(15, width - 15);
            const row = rng.range(groundLevel - 12, groundLevel - 3);
            const posKey = `${col},${row}`;
            
            if (usedPositions.has(posKey)) continue;
            usedPositions.add(posKey);
            
            const patternType = rng.range(0, 4);
            
            switch(patternType) {
                case 0: // Einzelne Plattform
                    const width1 = rng.range(3, 6);
                    level[row] = this.replaceRange(level[row], col, width1, 'p');
                    // Münzen über Plattform
                    if (row > 1 && rng.chance(0.7)) {
                        const coinRow = row - 1;
                        level[coinRow] = this.replaceRange(level[coinRow], col, width1, 'o');
                    }
                    break;
                    
                case 1: // Wolken-Plattform
                    const width2 = rng.range(4, 7);
                    level[row] = this.replaceRange(level[row], col, width2, 'c');
                    if (row > 1 && rng.chance(0.6)) {
                        const coinRow = row - 1;
                        const coinWidth = rng.range(2, width2);
                        level[coinRow] = this.replaceRange(level[coinRow], col + 1, coinWidth, 'o');
                    }
                    break;
                    
                case 2: // Holz-Säule
                    const height1 = rng.range(2, 4);
                    for (let r = 0; r < height1; r++) {
                        if (row - r >= 0) {
                            level[row - r] = this.replaceRange(level[row - r], col, 1, 'W');
                        }
                    }
                    // Münzen neben Säule
                    if (col > 2 && row > 0 && rng.chance(0.5)) {
                        level[row] = this.replaceRange(level[row], col - 2, 1, 'o');
                        level[row] = this.replaceRange(level[row], col + 2, 1, 'o');
                    }
                    break;
                    
                case 3: // Stein-Block
                    const stoneHeight = rng.range(1, 3);
                    const stoneWidth = rng.range(2, 4);
                    for (let r = 0; r < stoneHeight; r++) {
                        if (row - r >= 0) {
                            level[row - r] = this.replaceRange(level[row - r], col, stoneWidth, 'S');
                        }
                    }
                    // Münzen oben drauf
                    if (row - stoneHeight > 0 && rng.chance(0.6)) {
                        level[row - stoneHeight] = this.replaceRange(level[row - stoneHeight], col, stoneWidth, 'o');
                    }
                    break;
            }
        }
        
        // Spezielle Features basierend auf Schwierigkeit
        if (difficulty >= 2) {
            // Lava-Pools
            const lavaCount = rng.range(1, 2);
            for (let i = 0; i < lavaCount; i++) {
                const lavaCol = rng.range(30, width - 30);
                const lavaWidth = rng.range(3, 6);
                level[groundLevel] = this.replaceRange(level[groundLevel], lavaCol, lavaWidth, 'L');
            }
        }
        
        if (difficulty >= 3) {
            // Eis-Plattformen (rutschig)
            const iceCount = rng.range(2, 4);
            for (let i = 0; i < iceCount; i++) {
                const iceCol = rng.range(20, width - 20);
                const iceRow = rng.range(groundLevel - 10, groundLevel - 4);
                const iceWidth = rng.range(4, 7);
                level[iceRow] = this.replaceRange(level[iceRow], iceCol, iceWidth, 'I');
            }
        }
        
        // Bonus-Münzen in der Luft (riskante Sprünge)
        const bonusCoinGroups = 3 + difficulty;
        for (let i = 0; i < bonusCoinGroups; i++) {
            const coinCol = rng.range(10, width - 10);
            const coinRow = rng.range(groundLevel - 15, groundLevel - 8);
            const coinPattern = rng.range(0, 2);
            
            if (coinPattern === 0) {
                // Horizontale Reihe
                const coinWidth = rng.range(3, 6);
                level[coinRow] = this.replaceRange(level[coinRow], coinCol, coinWidth, 'o');
            } else {
                // Vertikale Reihe
                const coinHeight = rng.range(3, 5);
                for (let r = 0; r < coinHeight; r++) {
                    if (coinRow - r >= 0) {
                        level[coinRow - r] = this.replaceRange(level[coinRow - r], coinCol, 1, 'o');
                    }
                }
            }
        }
        
        // Start-Bereich sauber halten (nur Luft oberhalb des Bodens)
        for (let row = 0; row < groundLevel; row++) {
            level[row] = '.'.repeat(15) + level[row].substring(15);
        }
        // Boden im Start-Bereich bleibt intakt!
        
        // Ziel-Bereich vorbereiten (nur Luft oberhalb des Bodens)
        for (let row = 0; row < groundLevel; row++) {
            level[row] = level[row].substring(0, width - 15) + '.'.repeat(15);
        }
        // Boden im Ziel-Bereich bleibt intakt!
        
        return level;
    }
    
    /**
     * Ersetzt einen Bereich in einem String
     */
    replaceRange(str, start, length, char) {
        if (start < 0 || start >= str.length) return str;
        const end = Math.min(start + length, str.length);
        const replacement = char.repeat(end - start);
        return str.substring(0, start) + replacement + str.substring(end);
    }
}

/**
 * Generiert alle Level für eine Welt mit festem Seed
 */
export function generateWorldLevels(worldSeed, worldName, levelCount = 5) {
    const generator = new ProceduralLevelGenerator();
    const levels = [];
    
    for (let i = 0; i < levelCount; i++) {
        const levelSeed = worldSeed + i * 1000;
        const difficulty = i + 1; // Level werden schwieriger
        const width = 80 + i * 10; // Level werden länger
        const height = 25;
        
        const tiles = generator.generate(levelSeed, width, height, difficulty);
        
        // Generiere Gegner für dieses Level (übergebe tiles!)
        const enemies = generateEnemies(levelSeed, width, height, difficulty, tiles);
        
        levels.push({
            width: width,
            height: height,
            spawnPoint: { x: 64, y: (height - 7) * 32 - 53 }, // -53 für größere Spielfigur (85px)
            goal: { x: (width - 5) * 32, y: (height - 7) * 32, width: 64, height: 64 },
            tiles: tiles,
            enemies: enemies
        });
    }
    
    return {
        name: worldName,
        levels: levels
    };
}

/**
 * Generiert Gegner für ein Level
 */
function generateEnemies(seed, width, height, difficulty, tiles) {
    const random = new SeededRandom(seed);
    const enemies = [];
    const groundLevel = height - 5; // Gleich wie in generate()!
    const tileSize = 32;
    
    // Anzahl der Gegner basierend auf Schwierigkeit
    const walkingCount = 2 + difficulty;
    const flyingCount = 1 + Math.floor(difficulty / 2);
    const shootingCount = Math.floor(difficulty / 3);
    
    // Walking Enemies (auf dem Boden, nur auf freien Positionen)
    let walkingAttempts = 0;
    for (let i = 0; i < walkingCount && walkingAttempts < walkingCount * 10; i++) {
        const col = 20 + random.range(0, width - 40);
        const row = groundLevel - 1; // Eine Zeile über dem Boden
        
        // Prüfe ob Position gültig ist (Luft hier, Boden darunter)
        const tile = tiles[row].charAt(col);
        const groundTile = tiles[row + 1].charAt(col);
        
        if (tile === '.' && groundTile !== '.' && groundTile !== 'o') {
            enemies.push({
                type: 'walking',
                x: col * tileSize,
                y: row * tileSize
            });
        } else {
            i--; // Versuch wiederholen
        }
        walkingAttempts++;
    }
    
    // Flying Enemies (in der Luft)
    for (let i = 0; i < flyingCount; i++) {
        const col = 25 + random.range(0, width - 50);
        const row = groundLevel - 8 - random.range(0, 5);
        enemies.push({
            type: 'flying',
            x: col * tileSize,
            y: row * tileSize
        });
    }
    
    // Shooting Enemies (auf Plattformen)
    let shootingAttempts = 0;
    for (let i = 0; i < shootingCount && shootingAttempts < shootingCount * 10; i++) {
        const col = 30 + random.range(0, width - 60);
        const row = groundLevel - 4 - random.range(0, 3);
        
        // Prüfe ob Position gültig ist
        const tile = tiles[row].charAt(col);
        const groundTile = row + 1 < tiles.length ? tiles[row + 1].charAt(col) : '.';
        
        if (tile === '.' && groundTile !== '.' && groundTile !== 'o') {
            enemies.push({
                type: 'shooting',
                x: col * tileSize,
                y: row * tileSize
            });
        } else {
            i--;
        }
        shootingAttempts++;
    }
    
    return enemies;
}

