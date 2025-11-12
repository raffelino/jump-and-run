#!/usr/bin/env node

/**
 * Level Generator - Development Tool
 * Generiert Level prozedural und speichert sie in world*.js Dateien
 * 
 * Usage: node generate-levels.js
 */

import { ProceduralLevelGenerator, generateEnemies } from './js/ProceduralLevelGenerator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Welt-Konfigurationen
const worlds = [
    {
        name: 'Grasland',
        file: 'world1.js',
        seed: 5500,
        levelCount: 5,
        description: 'Grüne Wiesen, Plattformen und einfache Hindernisse'
    },
    {
        name: 'Dunkle Höhlen',
        file: 'world2.js',
        seed: 7000,
        levelCount: 5,
        description: 'Steinige Höhlen mit engen Passagen'
    },
    {
        name: 'Brennende Wüste',
        file: 'world3.js',
        seed: 9000,
        levelCount: 5,
        description: 'Heiße Wüste mit Lava-Fallen'
    },
    {
        name: 'Eisige Berge',
        file: 'world4.js',
        seed: 11000,
        levelCount: 5,
        description: 'Rutschige Eisberge und gefrorene Plattformen'
    },
    {
        name: 'Himmelsburg',
        file: 'world5.js',
        seed: 13000,
        levelCount: 5,
        description: 'Wolkenplattformen hoch in den Lüften'
    }
];

// Tile-Legende für Dokumentation
const tileLegend = `/**
 * Legende:
 * . = Luft (air)
 * G = Boden (ground)
 * B = Ziegel (brick)
 * P = Rohr (pipe)
 * p = Plattform (platform - nur von oben begehbar)
 * S = Stein (stone)
 * C = Kristall (crystal)
 * L = Lava (deadly - tödlich)
 * c = Wolke (cloud platform)
 * M = Metall (metal)
 * I = Eis (ice - rutschig)
 * W = Holz (wood)
 * o = Münze (coin)
 * 1 = Gegner Typ 1 (walking enemy)
 * 2 = Gegner Typ 2 (flying enemy)
 * 3 = Gegner Typ 3 (shooting enemy)
 */`;

/**
 * Konvertiert ein generiertes Level in lesbares JavaScript-Format
 */
function levelToJavaScript(levelData, levelNumber, seed, difficulty) {
    // levelData ist ein Array von Strings (die map)
    const width = levelData[0].length;
    const height = levelData.length;
    const tileSize = 32;
    
    // Generiere Gegner für dieses Level
    const enemies = generateEnemies(seed, width, height, difficulty, levelData);
    
    const mapString = levelData
        .map(row => `            "${row}"`)
        .join(',\n');
    
    // Berechne Spawn und Goal Positionen
    const groundLevel = height - 5;
    const spawn = { x: 2 * tileSize, y: groundLevel * tileSize - 85 }; // 85 = Player height
    // Goal weiter links platzieren, damit das Café vollständig im sichtbaren Bereich ist
    // Statt width-2 verwenden wir width-5, damit mehr Platz rechts ist
    const goal = { x: (width - 5) * tileSize, y: groundLevel * tileSize - 65};
    
    // Erstelle enemies Array String
    const enemiesString = enemies.length > 0 
        ? `,\n        enemies: [\n${enemies.map(e => `            { type: "${e.type}", x: ${e.x}, y: ${e.y} }`).join(',\n')}\n        ]`
        : '';
    
    return `    // Level ${levelNumber}
    {
        width: ${width},
        height: ${height},
        spawn: { x: ${spawn.x}, y: ${spawn.y} },
        goal: { x: ${goal.x}, y: ${goal.y} },
        map: [
${mapString}
        ]${enemiesString}
    }`;
}

/**
 * Generiert eine komplette world*.js Datei
 */
function generateWorldFile(worldConfig) {
    const generator = new ProceduralLevelGenerator();
    const levels = [];
    
    console.log(`\n🎮 Generiere ${worldConfig.name}...`);
    
    for (let i = 0; i < worldConfig.levelCount; i++) {
        const difficulty = i + 1;
        const levelSeed = worldConfig.seed + i * 100;
        
        console.log(`  📍 Level ${i + 1} (Seed: ${levelSeed}, Schwierigkeit: ${difficulty})...`);
        
        const levelData = generator.generate(levelSeed, 100, 25, difficulty);
        levels.push({ levelData, seed: levelSeed, difficulty });
    }
    
    // Erstelle JavaScript-Code
    const levelsCode = levels
        .map((level, index) => levelToJavaScript(level.levelData, index + 1, level.seed, level.difficulty))
        .join(',\n\n');
    
    const fileContent = `/**
 * ${worldConfig.name}
 * ${worldConfig.description}
 */

${tileLegend}

export const ${worldConfig.file.replace('.js', '')} = {
    name: "${worldConfig.name}",
    levels: [
${levelsCode}
    ]
};
`;
    
    return fileContent;
}

/**
 * Hauptfunktion - Generiert alle Welten
 */
function main() {
    console.log('🚀 Level Generator gestartet...');
    console.log('📁 Generiere Level für alle Welten...\n');
    
    const levelsDir = path.join(__dirname, 'js', 'levels');
    
    // Stelle sicher, dass levels Verzeichnis existiert
    if (!fs.existsSync(levelsDir)) {
        fs.mkdirSync(levelsDir, { recursive: true });
    }
    
    // Generiere jede Welt
    worlds.forEach(worldConfig => {
        const fileContent = generateWorldFile(worldConfig);
        const filePath = path.join(levelsDir, worldConfig.file);
        
        // Speichere Datei
        fs.writeFileSync(filePath, fileContent, 'utf8');
        console.log(`  ✅ ${worldConfig.file} gespeichert`);
    });
    
    console.log('\n✨ Alle Level erfolgreich generiert!');
    console.log('📝 Du kannst die Dateien jetzt manuell in js/levels/ bearbeiten.\n');
}

// Starte Generator
main();
