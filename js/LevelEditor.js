/**
 * Level Editor - Visueller Editor für Level
 * Ermöglicht das Erstellen und Bearbeiten von Levels
 */
export class LevelEditor {
    constructor(canvas, assetManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assetManager = assetManager;
        
        // Level Eigenschaften
        this.width = 100;
        this.height = 25;
        this.tileSize = 32;
        this.tiles = [];
        
        // Editor Eigenschaften
        this.selectedTile = 'G'; // Standard: Ground
        this.groundTileType = 'G'; // Welcher Tile-Typ für Boden verwendet wird
        this.isCave = false; // Ob Level eine Höhle ist
        
        // Kamera
        this.camera = {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        };
        
        // Maus-Tracking
        this.mouseDown = false;
        this.mouseButton = 0; // 0 = links, 2 = rechts
        
        // Tile-Palette
        this.tilePalette = {
            '.': 'Luft',
            'G': 'Gras-Boden',
            'S': 'Stein',
            'B': 'Ziegel',
            'P': 'Rohr',
            'p': 'Plattform',
            'c': 'Wolke',
            'W': 'Holz',
            'M': 'Metall',
            'I': 'Eis',
            'C': 'Kristall',
            'L': 'Lava',
            'o': 'Münze'
        };
        
        // Ground Tile Optionen
        this.groundTileOptions = ['G', 'S', 'B', 'I', 'M'];
        
        this.initLevel();
        this.setupUI();
        this.setupEventListeners();
    }
    
    initLevel() {
        // Erstelle leeres Level
        this.tiles = Array(this.height).fill(null).map(() => 
            Array(this.width).fill('.')
        );
        
        // Erstelle Boden (letzte 5 Zeilen)
        const groundLevel = this.height - 5;
        for (let row = groundLevel; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                this.tiles[row][col] = this.groundTileType;
            }
        }
        
        // Wenn Höhle: Erstelle Decke (erste 3 Zeilen)
        if (this.isCave) {
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < this.width; col++) {
                    this.tiles[row][col] = this.groundTileType;
                }
            }
        }
    }
    
    setupUI() {
        // Erstelle Editor UI Container
        const editorUI = document.createElement('div');
        editorUI.id = 'level-editor-ui';
        editorUI.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            z-index: 1000;
            max-height: 90vh;
            overflow-y: auto;
        `;
        
        editorUI.innerHTML = `
            <h3 style="margin-top: 0;">Level Editor</h3>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Ground Tile:</label>
                <select id="ground-tile-select" style="width: 100%; padding: 5px;">
                    ${this.groundTileOptions.map(tile => 
                        `<option value="${tile}" ${tile === this.groundTileType ? 'selected' : ''}>
                            ${this.tilePalette[tile]}
                        </option>`
                    ).join('')}
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="is-cave-checkbox" ${this.isCave ? 'checked' : ''} 
                           style="margin-right: 8px;">
                    Höhle (mit Decke)
                </label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <button id="apply-settings-btn" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Einstellungen anwenden
                </button>
            </div>
            
            <hr style="border-color: rgba(255,255,255,0.3); margin: 15px 0;">
            
            <div style="margin-bottom: 10px;">
                <strong>Tile-Palette:</strong>
            </div>
            <div id="tile-palette" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; margin-bottom: 15px;">
                ${Object.entries(this.tilePalette).map(([key, name]) => `
                    <button class="tile-btn" data-tile="${key}" 
                            style="padding: 8px; background: ${key === this.selectedTile ? '#2196F3' : '#555'}; 
                                   color: white; border: 2px solid ${key === this.selectedTile ? '#fff' : 'transparent'}; 
                                   border-radius: 4px; cursor: pointer; font-size: 12px;">
                        ${key === '.' ? '⬜' : key} - ${name}
                    </button>
                `).join('')}
            </div>
            
            <hr style="border-color: rgba(255,255,255,0.3); margin: 15px 0;">
            
            <div style="margin-bottom: 10px;">
                <strong>Steuerung:</strong>
                <ul style="font-size: 12px; margin: 5px 0; padding-left: 20px;">
                    <li>Linksklick: Tile setzen</li>
                    <li>Rechtsklick: Tile löschen</li>
                    <li>Pfeiltasten: Kamera bewegen</li>
                </ul>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <button id="export-level-btn" style="padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Exportieren
                </button>
                <button id="clear-level-btn" style="padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Leeren
                </button>
            </div>
            
            <div style="margin-top: 10px;">
                <button id="close-editor-btn" style="width: 100%; padding: 8px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Editor schließen
                </button>
            </div>
        `;
        
        document.body.appendChild(editorUI);
        
        // Event Listeners für UI
        document.getElementById('ground-tile-select').addEventListener('change', (e) => {
            this.groundTileType = e.target.value;
        });
        
        document.getElementById('is-cave-checkbox').addEventListener('change', (e) => {
            this.isCave = e.target.checked;
        });
        
        document.getElementById('apply-settings-btn').addEventListener('click', () => {
            this.initLevel();
            this.render();
        });
        
        document.querySelectorAll('.tile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedTile = btn.dataset.tile;
                this.updateTilePalette();
            });
        });
        
        document.getElementById('export-level-btn').addEventListener('click', () => {
            this.exportLevel();
        });
        
        document.getElementById('clear-level-btn').addEventListener('click', () => {
            if (confirm('Level wirklich leeren?')) {
                this.initLevel();
                this.render();
            }
        });
        
        document.getElementById('close-editor-btn').addEventListener('click', () => {
            this.close();
        });
    }
    
    updateTilePalette() {
        document.querySelectorAll('.tile-btn').forEach(btn => {
            const isSelected = btn.dataset.tile === this.selectedTile;
            btn.style.background = isSelected ? '#2196F3' : '#555';
            btn.style.borderColor = isSelected ? '#fff' : 'transparent';
        });
    }
    
    setupEventListeners() {
        // Maus Events
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.mouseButton = e.button;
            this.handleMousePaint(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.mouseDown) {
                this.handleMousePaint(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.mouseDown = false;
        });
        
        // Verhindere Kontextmenü bei Rechtsklick
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Keyboard Events
        this.keyHandler = (e) => {
            const speed = 20;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.camera.x = Math.max(0, this.camera.x - speed);
                    this.render();
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.camera.x = Math.min(
                        this.width * this.tileSize - this.camera.width,
                        this.camera.x + speed
                    );
                    this.render();
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                    this.camera.y = Math.max(0, this.camera.y - speed);
                    this.render();
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    this.camera.y = Math.min(
                        this.height * this.tileSize - this.camera.height,
                        this.camera.y + speed
                    );
                    this.render();
                    e.preventDefault();
                    break;
            }
        };
        
        window.addEventListener('keydown', this.keyHandler);
    }
    
    handleMousePaint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Berechne Tile-Position
        const worldX = mouseX + this.camera.x;
        const worldY = mouseY + this.camera.y;
        const col = Math.floor(worldX / this.tileSize);
        const row = Math.floor(worldY / this.tileSize);
        
        // Prüfe ob Position gültig ist
        if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
            if (this.mouseButton === 0) {
                // Linksklick: Tile setzen
                this.tiles[row][col] = this.selectedTile;
            } else if (this.mouseButton === 2) {
                // Rechtsklick: Tile löschen
                this.tiles[row][col] = '.';
            }
            this.render();
        }
    }
    
    render() {
        // Lösche Canvas
        this.ctx.fillStyle = this.isCave ? '#1a1a1a' : '#87CEEB'; // Dunkler für Höhlen
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Zeichne Grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row < this.height; row++) {
            const y = row * this.tileSize - this.camera.y;
            if (y >= -this.tileSize && y <= this.canvas.height) {
                for (let col = 0; col < this.width; col++) {
                    const x = col * this.tileSize - this.camera.x;
                    
                    if (x >= -this.tileSize && x <= this.canvas.width) {
                        // Zeichne Grid-Linie
                        this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
                        
                        // Zeichne Tile
                        const tile = this.tiles[row][col];
                        if (tile !== '.') {
                            this.drawTile(tile, x, y);
                        }
                    }
                }
            }
        }
        
        // Zeichne Info
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height - 40, 300, 30);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(
            `Ausgewählt: ${this.selectedTile} - ${this.tilePalette[this.selectedTile]}`,
            20,
            this.canvas.height - 20
        );
    }
    
    drawTile(tile, x, y) {
        const colors = {
            'G': '#228B22',
            'S': '#808080',
            'B': '#8B4513',
            'P': '#2E8B57',
            'p': '#DEB887',
            'c': '#FFFFFF',
            'W': '#8B4513',
            'M': '#696969',
            'I': '#B0E0E6',
            'C': '#9370DB',
            'L': '#FF4500',
            'o': '#FFD700'
        };
        
        this.ctx.fillStyle = colors[tile] || '#000000';
        this.ctx.fillRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
        
        // Zeichne Tile-Buchstaben
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(tile, x + this.tileSize / 2, y + this.tileSize / 2);
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    exportLevel() {
        // Konvertiere Tiles zu String-Format
        const mapString = this.tiles.map(row => row.join('')).join('\n');
        
        // Finde Spawn und Goal
        const groundLevel = this.height - 5;
        const spawn = { x: 64, y: groundLevel * this.tileSize - 85 };
        const goal = { x: (this.width - 5) * this.tileSize, y: groundLevel * this.tileSize - 65 };
        
        // Erstelle Level-Objekt
        const levelData = {
            width: this.width,
            height: this.height,
            spawn: spawn,
            goal: goal,
            isCave: this.isCave,
            groundTileType: this.groundTileType,
            map: this.tiles.map(row => `"${row.join('')}"`).join(',\n            ')
        };
        
        // Erstelle JavaScript-Code
        const code = `{
    width: ${levelData.width},
    height: ${levelData.height},
    spawn: { x: ${levelData.spawn.x}, y: ${levelData.spawn.y} },
    goal: { x: ${levelData.goal.x}, y: ${levelData.goal.y} },
    isCave: ${levelData.isCave},
    groundTileType: "${levelData.groundTileType}",
    map: [
            ${levelData.map}
    ],
    enemies: [
        // Füge hier Gegner hinzu
    ]
}`;
        
        // Zeige Export-Dialog
        const exportDialog = document.createElement('div');
        exportDialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 2000;
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
        
        exportDialog.innerHTML = `
            <h3>Level Export</h3>
            <p>Kopiere diesen Code in deine world*.js Datei:</p>
            <textarea id="export-code" style="width: 100%; height: 400px; font-family: monospace; font-size: 12px;">${code}</textarea>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button id="copy-code-btn" style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Code kopieren
                </button>
                <button id="close-export-btn" style="flex: 1; padding: 10px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Schließen
                </button>
            </div>
        `;
        
        document.body.appendChild(exportDialog);
        
        document.getElementById('copy-code-btn').addEventListener('click', () => {
            const textarea = document.getElementById('export-code');
            textarea.select();
            document.execCommand('copy');
            alert('Code in Zwischenablage kopiert!');
        });
        
        document.getElementById('close-export-btn').addEventListener('click', () => {
            document.body.removeChild(exportDialog);
        });
    }
    
    close() {
        // Entferne UI
        const ui = document.getElementById('level-editor-ui');
        if (ui) {
            document.body.removeChild(ui);
        }
        
        // Entferne Event Listener
        window.removeEventListener('keydown', this.keyHandler);
        
        // Callback wenn vorhanden
        if (this.onClose) {
            this.onClose();
        }
    }
}
