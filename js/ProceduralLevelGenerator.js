/**
 * Prozeduraler Level-Generator für Jump'n'Run
 * Verwendet Seeded Random und typische Jump'n'Run-Muster
 */

export class SeededRandom {
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
        const MAX_JUMP_HEIGHT = 6; // Maximale Sprunghöhe in Tiles
        const MAX_JUMP_DISTANCE = 5; // Maximale horizontale Sprungweite in Tiles
        
        for (let i = 0; i < platformCount; i++) {
            const col = rng.range(15, width - 15);
            const row = rng.range(groundLevel - 12, groundLevel - 3);
            const posKey = `${col},${row}`;
            
            if (usedPositions.has(posKey)) continue;
            
            // Prüfe ob Plattform erreichbar ist (von Boden oder anderer Plattform)
            const isReachable = this.isPlatformReachable(level, col, row, groundLevel, height, MAX_JUMP_HEIGHT, MAX_JUMP_DISTANCE);
            if (!isReachable) {
                // Versuche es mit niedrigerer Position
                const lowerRow = rng.range(groundLevel - 6, groundLevel - 2);
                const lowerKey = `${col},${lowerRow}`;
                if (!usedPositions.has(lowerKey) && this.isPlatformReachable(level, col, lowerRow, groundLevel, height, MAX_JUMP_HEIGHT, MAX_JUMP_DISTANCE)) {
                    usedPositions.add(lowerKey);
                    // Verwende niedrigere Position für Plattform
                    const patternType2 = rng.range(0, 2); // Nur einfache Plattformen
                    if (patternType2 === 0) {
                        const width1 = rng.range(6, 10);
                        level[lowerRow] = this.replaceRange(level[lowerRow], col, width1, 'p');
                    } else {
                        const width2 = rng.range(8, 12);
                        level[lowerRow] = this.replaceRange(level[lowerRow], col, width2, 'c');
                    }
                }
                continue;
            }
            
            usedPositions.add(posKey);
            
            const patternType = rng.range(0, 4);
            
            switch(patternType) {
                case 0: // Einzelne Plattform (breiter, aber nur 1 Zeile dick)
                    const width1 = rng.range(6, 10); // Breiter: 6-10
                    level[row] = this.replaceRange(level[row], col, width1, 'p');
                    // Münzen über Plattform
                    if (row > 1 && rng.chance(0.7)) {
                        const coinRow = row - 1;
                        level[coinRow] = this.replaceRange(level[coinRow], col, width1, 'o');
                    }
                    break;
                    
                case 1: // Wolken-Plattform (breiter, aber nur 1 Zeile dick)
                    const width2 = rng.range(8, 12); // Breiter: 8-12
                    level[row] = this.replaceRange(level[row], col, width2, 'c');
                    if (row > 1 && rng.chance(0.6)) {
                        const coinRow = row - 1;
                        const coinWidth = rng.range(3, width2 - 2);
                        level[coinRow] = this.replaceRange(level[coinRow], col + 1, coinWidth, 'o');
                    }
                    break;
                    
                case 2: // Holz-Säule (breiter und höher)
                    const height1 = rng.range(3, 6); // Höher: 3-6 statt 2-4
                    const woodWidth = rng.range(2, 4); // Breiter: 2-4 statt 1
                    for (let r = 0; r < height1; r++) {
                        if (row - r >= 0) {
                            level[row - r] = this.replaceRange(level[row - r], col, woodWidth, 'W');
                        }
                    }
                    // Münzen neben Säule
                    if (col > 3 && row > 0 && rng.chance(0.5)) {
                        level[row] = this.replaceRange(level[row], col - 2, 1, 'o');
                        level[row] = this.replaceRange(level[row], col + woodWidth + 1, 1, 'o');
                    }
                    break;
                    
                case 3: // Stein-Block (massiver)
                    const stoneHeight = rng.range(3, 5); // Höher: 3-5 statt 1-3
                    const stoneWidth = rng.range(4, 7); // Breiter: 4-7 statt 2-4
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
            // Lava-Pools (breiter und mehrere Zeilen)
            const lavaCount = rng.range(1, 2);
            for (let i = 0; i < lavaCount; i++) {
                const lavaCol = rng.range(30, width - 30);
                const lavaWidth = rng.range(6, 10); // Breiter: 6-10 statt 3-6
                const lavaDepth = rng.range(2, 4); // Mehrere Zeilen tief
                for (let d = 0; d < lavaDepth; d++) {
                    if (groundLevel + d < height) {
                        level[groundLevel + d] = this.replaceRange(level[groundLevel + d], lavaCol, lavaWidth, 'L');
                    }
                }
            }
        }
        
        if (difficulty >= 3) {
            // Eis-Plattformen (rutschig und dicker)
            const iceCount = rng.range(2, 4);
            for (let i = 0; i < iceCount; i++) {
                const iceCol = rng.range(20, width - 20);
                const iceRow = rng.range(groundLevel - 10, groundLevel - 4);
                const iceWidth = rng.range(8, 12); // Breiter: 8-12 statt 4-7
                const iceDepth = rng.range(2, 3); // Dicker: 2-3 Zeilen
                for (let d = 0; d < iceDepth; d++) {
                    if (iceRow + d < height) {
                        level[iceRow + d] = this.replaceRange(level[iceRow + d], iceCol, iceWidth, 'I');
                    }
                }
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
        
        // Plausibilitätsprüfung: Ist das Level durchspielbar?
        if (!this.isLevelPlayable(level, width, height, groundLevel)) {
            console.warn('Level nicht durchspielbar, regeneriere...');
            // Rekursiv neu generieren (mit gleichem Seed + 1 für Variation)
            return this.generate(seed + 1, width, height, difficulty);
        }
        
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
    
    /**
     * Prüft ob eine Plattform von Boden oder anderen Plattformen aus erreichbar ist
     */
    isPlatformReachable(level, col, row, groundLevel, height, maxJumpHeight, maxJumpDistance) {
        // Prüfe ob von Boden erreichbar
        const groundRow = this.findSolidGroundInColumn(level, col, groundLevel, height);
        if (groundRow !== null) {
            const heightDiff = groundRow - row;
            if (heightDiff <= maxJumpHeight && heightDiff >= 0) {
                return true; // Von Boden direkt erreichbar
            }
        }
        
        // Prüfe ob von nahegelegenen Plattformen erreichbar
        for (let dc = -maxJumpDistance; dc <= maxJumpDistance; dc++) {
            const checkCol = col + dc;
            if (checkCol < 0 || checkCol >= level[0].length) continue;
            
            // Suche nach Plattformen in der Nähe
            for (let checkRow = row + maxJumpHeight; checkRow >= row - 2; checkRow--) {
                if (checkRow < 0 || checkRow >= height) continue;
                
                const tile = level[checkRow].charAt(checkCol);
                if (tile !== '.' && tile !== 'o') {
                    // Solide Plattform gefunden, prüfe ob Sprung möglich ist
                    const heightDiff = checkRow - row;
                    const distance = Math.abs(dc);
                    
                    // Einfache Erreichbarkeits-Heuristik
                    if (heightDiff >= -2 && heightDiff <= maxJumpHeight && distance <= maxJumpDistance) {
                        return true;
                    }
                }
            }
        }
        
        return false; // Nicht erreichbar
    }
    
    /**
     * Prüft ob das Level durchspielbar ist (vom Start zum Ziel erreichbar)
     * Verwendet einen vereinfachten Pathfinding-Algorithmus
     */
    isLevelPlayable(level, width, height, groundLevel) {
        const JUMP_HEIGHT = 6; // Maximale Sprunghöhe in Tiles
        const JUMP_DISTANCE = 5; // Maximale horizontale Sprungweite in Tiles
        
        // Startposition (Spalte 2, auf dem Boden)
        const startCol = 2;
        const startRow = this.findSolidGroundInColumn(level, startCol, groundLevel, height);
        
        if (startRow === null) {
            console.warn('Kein Boden am Startpunkt!');
            return false;
        }
        
        // Zielposition (Spalte width-5, auf dem Boden)
        const goalCol = width - 5;
        const goalRow = this.findSolidGroundInColumn(level, goalCol, groundLevel, height);
        
        if (goalRow === null) {
            console.warn('Kein Boden am Zielpunkt!');
            return false;
        }
        
        // Breadth-First-Search um zu prüfen ob Ziel erreichbar ist
        const visited = new Set();
        const queue = [{ col: startCol, row: startRow - 1 }]; // Über dem Boden stehend
        visited.add(`${startCol},${startRow - 1}`);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Ziel erreicht?
            if (Math.abs(current.col - goalCol) <= 2 && Math.abs(current.row - (goalRow - 1)) <= 2) {
                return true;
            }
            
            // Prüfe mögliche Bewegungen
            // 1. Nach rechts gehen (auf gleichem Boden)
            for (let dc = 1; dc <= 3; dc++) {
                const newCol = current.col + dc;
                if (newCol >= width) break;
                
                const groundRow = this.findSolidGroundBelow(level, newCol, current.row, height);
                if (groundRow !== null && groundRow - current.row <= 1) {
                    const key = `${newCol},${groundRow - 1}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push({ col: newCol, row: groundRow - 1 });
                    }
                }
            }
            
            // 2. Springen (nach rechts und oben)
            for (let dc = 1; dc <= JUMP_DISTANCE; dc++) {
                for (let dr = -JUMP_HEIGHT; dr <= 2; dr++) {
                    const newCol = current.col + dc;
                    const newRow = current.row + dr;
                    
                    if (newCol >= width || newRow < 0 || newRow >= height) continue;
                    
                    // Prüfe ob an dieser Position Boden ist
                    const groundRow = this.findSolidGroundBelow(level, newCol, newRow, height);
                    if (groundRow !== null && groundRow > newRow) {
                        const key = `${newCol},${groundRow - 1}`;
                        if (!visited.has(key)) {
                            visited.add(key);
                            queue.push({ col: newCol, row: groundRow - 1 });
                        }
                    }
                }
            }
        }
        
        console.warn('Ziel nicht erreichbar von Start!');
        return false;
    }
    
    /**
     * Findet den ersten soliden Boden in einer Spalte (von groundLevel abwärts)
     */
    findSolidGroundInColumn(level, col, groundLevel, height) {
        for (let row = groundLevel; row < height; row++) {
            const tile = level[row].charAt(col);
            if (tile !== '.' && tile !== 'o') {
                return row;
            }
        }
        return null;
    }
    
    /**
     * Findet den nächsten soliden Boden unterhalb einer Position
     */
    findSolidGroundBelow(level, col, startRow, height) {
        for (let row = startRow + 1; row < height; row++) {
            const tile = level[row].charAt(col);
            if (tile !== '.' && tile !== 'o') {
                return row;
            }
        }
        return null;
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
        const groundLevel = height - 5; // Ground-Level berechnen
        
        const tiles = generator.generate(levelSeed, width, height, difficulty);
        
        // Generiere Gegner für dieses Level (übergebe tiles!)
        const enemies = generateEnemies(levelSeed, width, height, difficulty, tiles);
        
        levels.push({
            width: width,
            height: height,
            spawnPoint: { x: 64, y: groundLevel * 32 - 80 }, // Spawne auf dem Ground-Level
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
export function generateEnemies(seed, width, height, difficulty, tiles) {
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

