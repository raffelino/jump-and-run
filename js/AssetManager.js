/**
 * Asset Manager - Verwaltet alle Grafiken und ermöglicht einfachen Austausch
 * Grafiken können durch Ändern der Farben oder Laden eigener Bilder ersetzt werden
 */
export class AssetManager {
    constructor() {
        this.sprites = {};
        this.colors = {
            player: '#FF0000',
            ground: '#8B4513',
            brick: '#CD853F',
            coin: '#FFD700',
            enemy: '#9400D3',
            sky: '#5C94FC',
            pipe: '#00AA00',
            platform: '#A0522D',
            stone: '#808080',
            crystal: '#00FFFF',
            lava: '#FF4500',
            cloud: '#FFFFFF',
            metal: '#C0C0C0',
            ice: '#B0E0E6',
            wood: '#DEB887',
            coinTile: '#FFD700'
        };
        this.loadedImages = {};
    }

    /**
     * Generiert Platzhalter-Sprites als Canvas-Elemente
     * Diese können später durch echte Bilder ersetzt werden
     */
    generatePlaceholderSprites() {
        // Player Sprite - Animiert (Idle, Run, Jump)
        this.sprites.player = this.createPlayerSprites();
        
        // Ground Tile
        this.sprites.ground = this.createRectSprite(32, 32, this.colors.ground, '#654321');
        
        // Brick Tile
        this.sprites.brick = this.createBrickSprite(32, 32);
        
        // Platform Tile (durchlässig von unten)
        this.sprites.platform = this.createPlatformSprite(32, 32);
        
        // Stone Tile
        this.sprites.stone = this.createStoneSprite(32, 32);
        
        // Crystal Tile
        this.sprites.crystal = this.createCrystalSprite(32, 32);
        
        // Lava Tile (animiert - 3 Frames)
        this.sprites.lava = [];
        for(let i = 0; i < 3; i++) {
            this.sprites.lava.push(this.createLavaSprite(32, 32, i));
        }
        
        // Cloud Tile
        this.sprites.cloud = this.createCloudSprite(32, 32);
        
        // Metal Tile
        this.sprites.metal = this.createMetalSprite(32, 32);
        
        // Ice Tile
        this.sprites.ice = this.createIceSprite(32, 32);
        
        // Wood Tile
        this.sprites.wood = this.createWoodSprite(32, 32);
        
        // Coin Sprite (animiert - 4 Frames)
        this.sprites.coin = [];
        for(let i = 0; i < 4; i++) {
            this.sprites.coin.push(this.createCoinSprite(24, 24, i));
        }
        
        // Enemy Sprite
        this.sprites.enemy = this.createRectSprite(32, 32, this.colors.enemy);
        
        // Pipe Sprite
        this.sprites.pipe = this.createRectSprite(64, 64, this.colors.pipe, '#008800');
    }

    /**
     * Erstellt animierte Spieler-Sprites
     * Rückgabe: { idle: [frames], run: [frames], jump: [frames] }
     */
    createPlayerSprites() {
        const sprites = {
            idle: [],
            run: [],
            jump: []
        };

        // Idle Animation (2 Frames - leichtes Atmen)
        for (let i = 0; i < 2; i++) {
            sprites.idle.push(this.createPlayerFrame('idle', i));
        }

        // Run Animation (4 Frames - Laufzyklus)
        for (let i = 0; i < 4; i++) {
            sprites.run.push(this.createPlayerFrame('run', i));
        }

        // Jump Animation (1 Frame)
        sprites.jump.push(this.createPlayerFrame('jump', 0));

        return sprites;
    }

    /**
     * Erstellt einen einzelnen animierten Frame für den Spieler
     */
    createPlayerFrame(type, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const color = this.colors.player;

        // Körper (unterschiedliche Positionen je nach Animation)
        let bodyY = 8;
        let bodyHeight = 16;
        let legOffset = 0;
        let armOffset = 0;

        if (type === 'idle') {
            // Leichtes Auf und Ab beim Atmen
            bodyY = 8 + Math.sin(frame * Math.PI) * 1;
        } else if (type === 'run') {
            // Laufbewegung
            legOffset = Math.sin(frame * Math.PI / 2) * 3;
            armOffset = Math.cos(frame * Math.PI / 2) * 2;
            bodyY = 7 + Math.abs(Math.sin(frame * Math.PI / 2)) * 1;
        } else if (type === 'jump') {
            // Sprungpose
            bodyY = 6;
            armOffset = -4;
        }

        // Kopf
        ctx.fillStyle = color;
        ctx.fillRect(10, bodyY - 8, 12, 12);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, bodyY - 8, 12, 12);

        // Augen
        ctx.fillStyle = '#FFF';
        ctx.fillRect(12, bodyY - 5, 3, 3);
        ctx.fillRect(17, bodyY - 5, 3, 3);
        ctx.fillStyle = '#000';
        ctx.fillRect(13, bodyY - 4, 2, 2);
        ctx.fillRect(18, bodyY - 4, 2, 2);

        // Körper
        ctx.fillStyle = color;
        ctx.fillRect(8, bodyY + 4, 16, bodyHeight);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, bodyY + 4, 16, bodyHeight);

        // Arme
        ctx.fillStyle = color;
        // Linker Arm
        ctx.fillRect(6, bodyY + 6 + armOffset, 4, 10);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(6, bodyY + 6 + armOffset, 4, 10);
        // Rechter Arm
        ctx.fillRect(22, bodyY + 6 - armOffset, 4, 10);
        ctx.strokeRect(22, bodyY + 6 - armOffset, 4, 10);

        // Beine
        ctx.fillStyle = color;
        // Linkes Bein
        ctx.fillRect(10, bodyY + 20, 4, 8 + legOffset);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(10, bodyY + 20, 4, 8 + legOffset);
        // Rechtes Bein
        ctx.fillRect(18, bodyY + 20, 4, 8 - legOffset);
        ctx.strokeRect(18, bodyY + 20, 4, 8 - legOffset);

        return canvas;
    }

    createRectSprite(width, height, color, borderColor = '#000') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        return canvas;
    }

    createBrickSprite(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.colors.brick;
        ctx.fillRect(0, 0, width, height);
        
        // Brick pattern
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
        ctx.beginPath();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.stroke();
        
        return canvas;
    }

    createCoinSprite(width, height, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 2;
        
        // Animation durch Skalierung
        const scale = 1 - Math.abs(frame - 1.5) * 0.3;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, 1);
        
        // Münze
        ctx.fillStyle = this.colors.coin;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Details
        ctx.fillStyle = '#FFA500';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        ctx.restore();
        
        return canvas;
    }

    createPlatformSprite(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.colors.platform;
        ctx.fillRect(0, 0, width, 8);
        
        // Holzmaserung
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for(let i = 0; i < width; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 8);
            ctx.stroke();
        }
        
        return canvas;
    }

    createStoneSprite(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.colors.stone;
        ctx.fillRect(0, 0, width, height);
        
        // Stein-Textur
        ctx.fillStyle = '#A9A9A9';
        for(let i = 0; i < 8; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 4 + 2;
            ctx.fillRect(x, y, size, size);
        }
        
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
        
        return canvas;
    }

    createCrystalSprite(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Kristall-Form
        ctx.fillStyle = this.colors.crystal;
        ctx.beginPath();
        ctx.moveTo(centerX, 4);
        ctx.lineTo(width - 4, centerY);
        ctx.lineTo(centerX, height - 4);
        ctx.lineTo(4, centerY);
        ctx.closePath();
        ctx.fill();
        
        // Glanz-Effekt
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(centerX, 4);
        ctx.lineTo(centerX - 4, centerY - 4);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#00CED1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, 4);
        ctx.lineTo(width - 4, centerY);
        ctx.lineTo(centerX, height - 4);
        ctx.lineTo(4, centerY);
        ctx.closePath();
        ctx.stroke();
        
        return canvas;
    }

    createLavaSprite(width, height, frame) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Basis-Lava
        ctx.fillStyle = this.colors.lava;
        ctx.fillRect(0, 0, width, height);
        
        // Animierte Blasen
        const offset = frame * 10;
        ctx.fillStyle = '#FF6347';
        for(let i = 0; i < 3; i++) {
            const x = (i * 12 + offset) % width;
            const y = height - 8 - (frame === i ? 4 : 0);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Glühen
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(0, 0, width, 6);
        
        return canvas;
    }

    createCloudSprite(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.colors.cloud;
        ctx.globalAlpha = 0.8;
        
        // Wolken-Form (drei Kreise)
        ctx.beginPath();
        ctx.arc(10, height/2, 8, 0, Math.PI * 2);
        ctx.arc(width/2, height/2 - 2, 10, 0, Math.PI * 2);
        ctx.arc(width - 10, height/2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        
        return canvas;
    }

    createMetalSprite(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Metallischer Farbverlauf
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#E8E8E8');
        gradient.addColorStop(0.5, this.colors.metal);
        gradient.addColorStop(1, '#A0A0A0');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Nieten
        ctx.fillStyle = '#808080';
        [4, width-4].forEach(x => {
            [4, height-4].forEach(y => {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        
        ctx.strokeStyle = '#909090';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
        
        return canvas;
    }

    createIceSprite(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.colors.ice;
        ctx.fillRect(0, 0, width, height);
        
        // Eis-Kristalle
        ctx.strokeStyle = '#ADD8E6';
        ctx.lineWidth = 1;
        for(let i = 0; i < 5; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.beginPath();
            ctx.moveTo(x - 3, y);
            ctx.lineTo(x + 3, y);
            ctx.moveTo(x, y - 3);
            ctx.lineTo(x, y + 3);
            ctx.stroke();
        }
        
        // Glanz
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(2, 2, width - 4, 8);
        
        ctx.strokeStyle = '#87CEEB';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
        
        return canvas;
    }

    createWoodSprite(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = this.colors.wood;
        ctx.fillRect(0, 0, width, height);
        
        // Holzmaserung
        ctx.strokeStyle = '#D2691E';
        ctx.lineWidth = 1;
        for(let i = 0; i < 10; i++) {
            const y = Math.random() * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Holzringe
        ctx.strokeStyle = '#CD853F';
        ctx.lineWidth = 2;
        for(let i = 0; i < 2; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
        
        return canvas;
    }

    /**
     * Lädt ein externes Bild für ein Sprite
     * Beispiel: assetManager.loadImage('player', 'assets/player.png')
     */
    async loadImage(spriteKey, imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[spriteKey] = img;
                this.loadedImages[spriteKey] = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = imagePath;
        });
    }

    /**
     * Lädt ein Sprite-Sheet für animierten Spieler
     * @param {string} imagePath - Pfad zum Sprite-Sheet
     * @param {object} config - Konfiguration mit frameWidth, frameHeight, animations
     * 
     * Beispiel:
     * await assetManager.loadPlayerSpriteSheet('assets/player.png', {
     *   frameWidth: 32,
     *   frameHeight: 32,
     *   animations: {
     *     idle: { row: 0, frames: 2 },
     *     run: { row: 1, frames: 4 },
     *     jump: { row: 2, frames: 1 }
     *   }
     * });
     */
    async loadPlayerSpriteSheet(imagePath, config) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const sprites = {
                    idle: [],
                    run: [],
                    jump: []
                };

                // Extrahiere Frames aus dem Sprite-Sheet
                for (const [animName, animConfig] of Object.entries(config.animations)) {
                    for (let i = 0; i < animConfig.frames; i++) {
                        const canvas = document.createElement('canvas');
                        canvas.width = config.frameWidth;
                        canvas.height = config.frameHeight;
                        const ctx = canvas.getContext('2d');

                        ctx.drawImage(
                            img,
                            i * config.frameWidth,
                            animConfig.row * config.frameHeight,
                            config.frameWidth,
                            config.frameHeight,
                            0,
                            0,
                            config.frameWidth,
                            config.frameHeight
                        );

                        sprites[animName].push(canvas);
                    }
                }

                this.sprites.player = sprites;
                resolve(sprites);
            };
            img.onerror = reject;
            img.src = imagePath;
        });
    }

    /**
     * Ermöglicht das Ändern der Farbpalette
     */
    setColor(element, color) {
        this.colors[element] = color;
        this.generatePlaceholderSprites();
    }

    getSprite(key) {
        return this.sprites[key];
    }
}
