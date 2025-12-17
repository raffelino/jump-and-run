import { InputHandler } from './InputHandler.js';
import { AssetManager } from './AssetManager.js';
import { Player } from './Player.js';
import { Level, Camera } from './Level.js';
import { WorldManager } from './WorldManager.js';
import { levelDefinitions } from './levelDefinitions.js';
import { SaveGameManager } from './SaveGameManager.js';
import { Logger } from './Logger.js';
import { SoundManager } from './SoundManager.js';
import { LevelEditor } from './LevelEditor.js';

// =============================================
// VERSION - Hier anpassen zum Testen von Änderungen
// =============================================
const GAME_VERSION = '1.0.3';
// =============================================

/**
 * Haupt-Game-Klasse - Verwaltet den gesamten Spielablauf
 */
class Game {
    constructor() {
        this.logger = new Logger('Game');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialisierung
        this.inputHandler = new InputHandler();
        this.assetManager = new AssetManager();
        this.assetManager.generatePlaceholderSprites();
        this.saveGameManager = new SaveGameManager();
        this.soundManager = new SoundManager();
        
        // Welten-Manager mit 5 Leveln pro Welt
        this.worldManager = new WorldManager(5);
        this.loadWorlds();
        
        // Cheatcode Callback registrieren
        this.inputHandler.setCheatCodeCallback(() => this.activateCheatCode());
        
        // Spieler
        this.player = null;
        
        // Kamera
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        
        // Aktuelles Level
        this.currentLevel = null;
        
        // Spielstatus
        this.lives = 3;
        this.totalCoins = 0;
        this.levelCoins = 0;
        this.gameState = 'mainmenu'; // 'mainmenu', 'levelmenu', 'playing', 'gameover'
        this.levelComplete = false;
        
        // Menü Navigation
        this.selectedLevelIndex = 0;
        this.menuKeyPressedLastFrame = {};
        
        // Level Editor
        this.levelEditor = null;
        
        // UI Elemente
        this.setupUI();
        
        // Game Loop
        this.lastTime = 0;
        this.animationId = null;
        
        // Zeige Hauptmenü
        this.showMainMenu();
    }

    loadWorlds() {
        // Lade Welt 1 - Grasland
        this.worldManager.addWorld(
            levelDefinitions.world1.name,
            levelDefinitions.world1.levels
        );
        
        // Lade Welt 2 - Dunkle Höhlen
        this.worldManager.addWorld(
            levelDefinitions.world2.name,
            levelDefinitions.world2.levels
        );
        
        // Lade Welt 3 - Brennende Wüste
        this.worldManager.addWorld(
            levelDefinitions.world3.name,
            levelDefinitions.world3.levels
        );
        
        // Lade Welt 4 - Eisige Berge
        this.worldManager.addWorld(
            levelDefinitions.world4.name,
            levelDefinitions.world4.levels
        );
        
        // Lade Welt 5 - Himmelsburg
        this.worldManager.addWorld(
            levelDefinitions.world5.name,
            levelDefinitions.world5.levels
        );
    }

    setupUI() {
        // Hauptmenü Event Listener
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('continue-game-btn').addEventListener('click', () => {
            this.continueGame();
        });
        
        document.getElementById('load-game-btn').addEventListener('click', () => {
            document.getElementById('load-file-input').click();
        });
        
        document.getElementById('save-game-btn').addEventListener('click', () => {
            this.saveGame();
        });
        
        document.getElementById('load-file-input').addEventListener('change', (e) => {
            this.loadGame(e.target.files[0]);
        });
        
        // Sound Toggle Button
        document.getElementById('toggle-sound-btn').addEventListener('click', () => {
            this.toggleSound();
        });
        
        // Zurück-Button in Level-Auswahl
        document.getElementById('back-to-main-btn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Event Listener für Weltenwechsel
        document.getElementById('prev-world').addEventListener('click', () => {
            this.changeWorld(-1);
        });
        
        document.getElementById('next-world').addEventListener('click', () => {
            this.changeWorld(1);
        });
        
        // Restart Button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
        
        // Keyboard Navigation für Menü
        this.setupMenuKeyboardNavigation();
    }
    
    setupMenuKeyboardNavigation() {
        // Registriere globalen Keydown-Listener
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'levelmenu') return;
            
            const key = e.key;
            
            // ESC = Zurück zum Hauptmenü
            if (key === 'Escape') {
                this.showMainMenu();
                e.preventDefault();
                return;
            }
            
            // Verhindere mehrfache Auslösung beim Halten
            if (this.menuKeyPressedLastFrame[key]) return;
            this.menuKeyPressedLastFrame[key] = true;
            
            const world = this.worldManager.getWorld(this.worldManager.currentWorldIndex);
            if (!world) return;
            
            const levelsPerRow = 5;
            const totalLevels = world.levels.length;
            
            switch(key) {
                case 'ArrowLeft':
                    if (this.selectedLevelIndex > 0) {
                        this.selectedLevelIndex--;
                        this.updateMenuDisplay();
                    }
                    e.preventDefault();
                    break;
                    
                case 'ArrowRight':
                    if (this.selectedLevelIndex < totalLevels - 1) {
                        this.selectedLevelIndex++;
                        this.updateMenuDisplay();
                    }
                    e.preventDefault();
                    break;
                    
                case 'ArrowUp':
                    if (this.selectedLevelIndex >= levelsPerRow) {
                        this.selectedLevelIndex -= levelsPerRow;
                        this.updateMenuDisplay();
                    }
                    e.preventDefault();
                    break;
                    
                case 'ArrowDown':
                    if (this.selectedLevelIndex + levelsPerRow < totalLevels) {
                        this.selectedLevelIndex += levelsPerRow;
                        this.updateMenuDisplay();
                    }
                    e.preventDefault();
                    break;
                    
                case 'Enter':
                    // Starte ausgewähltes Level wenn freigeschaltet
                    const isUnlocked = this.worldManager.isLevelUnlocked(
                        this.worldManager.currentWorldIndex, 
                        this.selectedLevelIndex
                    );
                    if (isUnlocked) {
                        this.startLevel(this.worldManager.currentWorldIndex, this.selectedLevelIndex);
                    }
                    e.preventDefault();
                    break;
                    
                case 'a':
                case 'A':
                    this.changeWorld(-1);
                    e.preventDefault();
                    break;
                    
                case 'd':
                case 'D':
                    this.changeWorld(1);
                    e.preventDefault();
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.menuKeyPressedLastFrame[e.key] = false;
        });
    }

    changeWorld(direction) {
        const totalWorlds = this.worldManager.getTotalWorlds();
        let newWorldIndex = this.worldManager.currentWorldIndex + direction;
        
        if (newWorldIndex >= 0 && newWorldIndex < totalWorlds) {
            this.worldManager.currentWorldIndex = newWorldIndex;
            this.selectedLevelIndex = 0; // Reset Selection
            this.updateMenuDisplay();
        }
    }

    updateMenuDisplay() {
        const levelGrid = document.getElementById('level-grid');
        levelGrid.innerHTML = '';
        
        const currentWorldIndex = this.worldManager.currentWorldIndex;
        const world = this.worldManager.getWorld(currentWorldIndex);
        
        if (!world) return;
        
        // Update Weltname
        document.getElementById('current-world-name').textContent = world.name;
        
        // Update Navigationsbuttons
        document.getElementById('prev-world').disabled = currentWorldIndex === 0;
        document.getElementById('next-world').disabled = 
            currentWorldIndex >= this.worldManager.getTotalWorlds() - 1;
        
        // Erstelle Level-Buttons
        for (let i = 0; i < world.levels.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i + 1;
            
            const isCompleted = this.worldManager.isLevelCompleted(currentWorldIndex, i);
            const isUnlocked = this.worldManager.isLevelUnlocked(currentWorldIndex, i);
            
            // Markiere ausgewähltes Level
            if (i === this.selectedLevelIndex) {
                btn.classList.add('selected');
            }
            
            if (isCompleted) {
                btn.classList.add('completed');
            }
            
            if (!isUnlocked) {
                btn.disabled = true;
            } else {
                btn.addEventListener('click', () => {
                    this.startLevel(currentWorldIndex, i);
                });
            }
            
            levelGrid.appendChild(btn);
        }
    }

    startLevel(worldIndex, levelIndex) {
        this.worldManager.setLevel(worldIndex, levelIndex);
        const levelData = this.worldManager.getCurrentLevel();
        
        if (!levelData) return;
        
        // Initialisiere Sound (bei erster User-Interaktion)
        this.soundManager.init();
        
        // Setze Musik-Theme für aktuelle Welt (1-5)
        const worldNumber = this.worldManager.currentWorldIndex + 1;
        this.soundManager.setWorld(worldNumber);
        
        // Starte Hintergrundmusik
        this.soundManager.playBackgroundMusic();
        
        // Erstelle Level mit Weltname
        const world = this.worldManager.getWorld(this.worldManager.currentWorldIndex);
        this.currentLevel = new Level(levelData, this.assetManager, world.name);
        
        // Erstelle/Reset Spieler
        const spawn = this.currentLevel.spawnPoint;
        if (!this.player) {
            this.player = new Player(spawn.x, spawn.y, this.assetManager, this.soundManager);
        } else {
            this.player.reset(spawn.x, spawn.y);
        }
        
        this.levelCoins = 0;
        this.levelComplete = false;
        this.gameState = 'playing';
        
        // Update HUD
        this.updateHUD();
        
        // Zeige Canvas und HUD
        this.canvas.classList.remove('hidden');
        document.getElementById('hud').style.display = 'flex';
        
        // Verstecke Menüs
        document.getElementById('level-menu').classList.add('hidden');
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        
        // Starte Game Loop
        this.start();
    }

    start() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    gameLoop(currentTime) {
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Capping: Begrenze deltaTime um extreme Schwankungen zu vermeiden
        // Max 33ms = ~30 FPS minimum, verhindert große Sprünge bei Lag
        if (deltaTime > 33) {
            deltaTime = 33;
        }
        
        // Normalisiere auf 60 FPS Target (16.67ms)
        // Bei höheren Refresh-Rates (144Hz = ~7ms) wird die Bewegung entsprechend verlangsamt
        deltaTime = Math.min(deltaTime, 16.67);
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update Level (mit Player und deltaTime für frameRate-unabhängige Bewegung)
        this.currentLevel.update(this.player, deltaTime);
        
        // Update Spieler mit deltaTime für frameRate-unabhängige Animation
        this.player.update(this.inputHandler, this.currentLevel, deltaTime);
        
        // Münzen-Kollision
        const coinsCollected = this.currentLevel.checkCoinCollisions(this.player);
        if (coinsCollected > 0) {
            this.levelCoins += coinsCollected;
            this.totalCoins += coinsCollected;
            
            // Spiele Münz-Sound
            this.soundManager.playCoinSound();
            
            // Extra Leben bei 100 Münzen
            if (this.totalCoins >= 100) {
                this.lives++;
                this.totalCoins -= 100;
            }
            
            this.updateHUD();
        }
        
        // Gegner-Kollision
        const enemyCollision = this.currentLevel.checkEnemyCollisions(this.player);
        if (enemyCollision.hit) {
            // Normale Kollision = Schaden
            if (this.player.isAlive && !this.player.isDying) {
                this.player.die();
            }
        } else if (enemyCollision.enemyBounce) {
            // Spieler ist auf Gegner gesprungen = kleiner Sprung
            this.player.velocityY = -8; // Leichter Sprung nach oben
        }

        // Apfel-Kollisionen mit Gegnern prüfen
        const hitEnemies = this.player.checkAppleCollisions(this.currentLevel.enemies);
        for (const enemy of hitEnemies) {
            if (enemy.die) {
                enemy.die();
            } else {
                enemy.active = false;
            }
        }
        
        // Ziel erreicht
        if (this.currentLevel.checkGoalReached(this.player) && !this.levelComplete) {
            this.levelComplete = true;
            this.soundManager.playLevelCompleteSound();
            this.completeLevel();
        }
        
        // Spieler gestorben (ohne Animation)
        if (!this.player.isAlive && this.gameState === 'playing') {
            console.log('Player is dead, handling death');
            this.gameState = 'dying'; // Verhindere mehrfaches Aufrufen
            this.soundManager.stopBackgroundMusic();
            this.soundManager.playDeathSound();
            this.playerDied();
        }
        
        // Update Kamera
        this.camera.follow(
            this.player,
            this.currentLevel.width * this.currentLevel.tileSize,
            this.currentLevel.height * this.currentLevel.tileSize
        );
    }

    render() {
        // Hintergrund (Himmel oder Höhle)
        const levelInfo = this.worldManager.getCurrentLevelData();
        if (levelInfo.worldIndex === 1) {
            // Höhle - dunkler Hintergrund
            this.ctx.fillStyle = '#1a1a2e';
        } else {
            // Himmel
            this.ctx.fillStyle = '#5C94FC';
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentLevel) {
            // Zeichne Level
            this.currentLevel.draw(this.ctx, this.camera);
            
            // Zeichne Spieler
            if (this.player) {
                this.player.draw(this.ctx, this.camera);
                // Zeichne Äpfel
                this.player.drawApples(this.ctx, this.camera);
            }
        }
        
        // Versionsanzeige (unten rechts)
        this.ctx.save();
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`v${GAME_VERSION}`, this.canvas.width - 10, this.canvas.height - 10);
        this.ctx.restore();
    }

    completeLevel() {
        // Markiere Level als abgeschlossen
        this.worldManager.completeCurrentLevel();
        
        // Stoppe Musik
        this.soundManager.stopBackgroundMusic();
        
        // Stoppe Game Loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Zeige Erfolg-Nachricht und kehre zum Menü zurück
        setTimeout(() => {
            alert(`Level abgeschlossen! ${this.levelCoins} Münzen gesammelt!`);
            this.showLevelMenu();
        }, 500);
    }

    playerDied() {
        // Stoppe Game Loop sofort
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Stoppe Musik
        this.soundManager.stopBackgroundMusic();
        
        this.lives--;
        this.updateHUD();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Kehre zum Menü zurück
            setTimeout(() => {
                this.showLevelMenu();
            }, 1000);
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        
        // Stoppe Game Loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Stoppe Musik
        this.soundManager.stopBackgroundMusic();
        
        // Zurück zum Menü nach kurzer Verzögerung
        setTimeout(() => {
            alert('Game Over - Keine Leben mehr!');
            this.lives = 3; // Reset Leben für neues Spiel
            this.showMainMenu();
        }, 500);
    }

    restart() {
        this.lives = 3;
        this.totalCoins = 0;
        this.levelCoins = 0;
        this.gameState = 'levelmenu';
        
        // Setze Fortschritt zurück (optional - auskommentieren wenn Fortschritt behalten werden soll)
        // this.worldManager.completedLevels.clear();
        
        this.showMainMenu();
    }
    
    toggleSound() {
        const isMuted = this.soundManager.toggleMute();
        const btn = document.getElementById('toggle-sound-btn');
        
        if (isMuted) {
            btn.textContent = '🔇 Ton Aus';
        } else {
            btn.textContent = '🔊 Ton An';
        }
    }

    showMainMenu() {
        this.gameState = 'levelmenu';
        
        // Stoppe Game Loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Stoppe Musik
        this.soundManager.stopBackgroundMusic();
        
        // Update Button-Stati
        const hasSave = this.saveGameManager.hasSave();
        document.getElementById('continue-game-btn').disabled = !hasSave;
        document.getElementById('save-game-btn').disabled = !hasSave;
        
        // Update Sound-Button Text
        const isMuted = this.soundManager.getMuteStatus();
        const soundBtn = document.getElementById('toggle-sound-btn');
        soundBtn.textContent = isMuted ? '🔇 Ton Aus' : '🔊 Ton An';
        
        // Verstecke Canvas und HUD
        this.canvas.classList.add('hidden');
        document.getElementById('hud').style.display = 'none';
        
        // Zeige Hauptmenü, verstecke Rest
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('level-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
    }

    showLevelMenu() {
        this.gameState = 'levelmenu';
        
        // Stoppe Game Loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Stoppe Musik
        this.soundManager.stopBackgroundMusic();
        
        // Update Menu Display
        this.updateMenuDisplay();
        this.updateHUD();
        this.updateMenuStats();
        
        // Verstecke Canvas und HUD
        this.canvas.classList.add('hidden');
        document.getElementById('hud').style.display = 'none';
        
        // Zeige Level-Menü, verstecke Rest
        document.getElementById('level-menu').classList.remove('hidden');
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
    }

    startNewGame() {
        this.logger.log('Starting new game');
        
        // Erstelle neuen Spielstand
        const save = this.saveGameManager.createNewGame();
        
        // Lade Spielstand
        this.lives = save.lives;
        this.totalCoins = save.coins;
        
        // Setze WorldManager zurück und entsperre nur Level 1-1
        this.worldManager.resetProgress();
        
        // Wechsle zur Level-Auswahl
        this.showLevelMenu();
    }

    continueGame() {
        this.logger.log('Continuing game');
        this.showLevelMenu();
    }

    saveGame() {
        this.logger.log('Saving game');
        
        // Update Spielstand
        this.saveGameManager.updateSave(
            this.lives,
            this.totalCoins,
            this.worldManager.completedLevels
        );
        
        // Speichere als Datei
        const success = this.saveGameManager.saveToFile();
        
        if (success) {
            this.showNotification('💾 Spielstand gespeichert!', 'green');
        } else {
            this.showNotification('❌ Speichern fehlgeschlagen!', 'red');
        }
    }

    async loadGame(file) {
        if (!file) return;
        
        this.logger.log('Loading game from file');
        
        try {
            const save = await this.saveGameManager.loadFromFile(file);
            
            // Lade Spielstand
            this.lives = save.lives;
            this.totalCoins = save.coins;
            
            // Setze WorldManager
            this.worldManager.completedLevels = new Set(save.completedLevels);
            
            // Reset file input
            document.getElementById('load-file-input').value = '';
            
            // Zeige Erfolg
            this.showNotification('✅ Spielstand geladen!', 'green');
            
            // Aktiviere Continue-Button
            document.getElementById('continue-game-btn').disabled = false;
            document.getElementById('save-game-btn').disabled = false;
            
        } catch (e) {
            this.logger.error('Load failed:', e);
            this.showNotification('❌ Laden fehlgeschlagen!', 'red');
        }
    }

    showNotification(text, color) {
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = `rgba(${color === 'green' ? '0, 255, 0' : '255, 0, 0'}, 0.9)`;
        notification.style.color = 'white';
        notification.style.padding = '20px 40px';
        notification.style.borderRadius = '10px';
        notification.style.fontSize = '24px';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '10000';
        notification.style.boxShadow = `0 0 20px rgba(${color === 'green' ? '0, 255, 0' : '255, 0, 0'}, 0.5)`;
        notification.textContent = text;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
    }

    updateHUD() {
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('coins').textContent = this.totalCoins;
        
        const levelInfo = this.worldManager.getCurrentLevelData();
        document.getElementById('world-info').textContent = 
            `${levelInfo.worldIndex + 1}-${levelInfo.levelNumber}`;
    }
    
    updateMenuStats() {
        document.getElementById('menu-lives').textContent = this.lives;
        document.getElementById('menu-coins').textContent = this.totalCoins;
    }
    
    activateCheatCode() {
        // Entsperre alle Level
        this.worldManager.unlockAllLevels();
        
        // Visuelles Feedback
        this.showCheatNotification();
        
        // Update Menu wenn im Menü
        if (this.gameState === 'menu') {
            this.updateMenuDisplay();
        }
    }
    
    showCheatNotification() {
        // Erstelle temporäre Benachrichtigung
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 255, 0, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '20px 40px';
        notification.style.borderRadius = '10px';
        notification.style.fontSize = '24px';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '10000';
        notification.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
        notification.textContent = '🎮 ALLE LEVEL FREIGESCHALTET! 🎮';
        
        document.body.appendChild(notification);
        
        // Entferne Benachrichtigung nach 2 Sekunden
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 2000);
    }
    
    openLevelEditor() {
        // Verstecke Hauptmenü
        document.getElementById('main-menu').classList.add('hidden');
        
        // Zeige Canvas
        this.canvas.classList.remove('hidden');
        
        // Erstelle Level Editor
        this.levelEditor = new LevelEditor(this.canvas, this.assetManager);
        this.levelEditor.onClose = () => {
            this.closeLevelEditor();
        };
        
        // Initiales Rendern
        this.levelEditor.render();
        
        // Stoppe Game Loop falls aktiv
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    closeLevelEditor() {
        this.levelEditor = null;
        
        // Verstecke Canvas
        this.canvas.classList.add('hidden');
        
        // Zeige Hauptmenü
        this.showMainMenu();
    }
}

// Starte das Spiel wenn die Seite geladen ist
window.addEventListener('load', () => {
    // Mache die Game-Instanz global zugänglich für Debugging
    window.game = new Game();

    // Kurzer Debug-Helfer: Gibt relevante Runtime-Informationen in die Konsole aus
    window.dumpGameState = function() {
        if (!window.game) {
            console.warn('No game instance available');
            return;
        }
        const g = window.game;
        console.log('--- GAME STATE DUMP ---');
        console.log('gameState:', g.gameState);
        if (g.player) {
            console.log('player:', {
                x: g.player.x,
                y: g.player.y,
                velocityX: g.player.velocityX,
                velocityY: g.player.velocityY,
                isOnGround: g.player.isOnGround,
                isCrouching: g.player.isCrouching,
                debugMovement: g.player.debugMovement
            });
        } else {
            console.log('player: <not created>');
        }
        console.log('input.keys (raw):', g.inputHandler && g.inputHandler.keys ? g.inputHandler.keys : '<no inputHandler>');
        try {
            console.log('input states:', {
                left: g.inputHandler.isLeftPressed(),
                right: g.inputHandler.isRightPressed(),
                jump: g.inputHandler.isJumpPressed(),
                pressedMap: g.inputHandler.keys
            });
        } catch (e) {
            console.warn('Could not read inputHandler states', e);
        }
        console.log('currentLevel present:', !!g.currentLevel, g.currentLevel ? { width: g.currentLevel.width, height: g.currentLevel.height, worldName: g.currentLevel.worldName } : null);
        console.log('camera:', { x: g.camera.x, y: g.camera.y });
        console.log('------------------------');
    };

    // Helfer: Toggle player.debugMovement für weniger/more logs
    window.togglePlayerDebug = function() {
        if (!window.game || !window.game.player) {
            console.warn('No player available to toggle debug flag');
            return;
        }
        const p = window.game.player;
        p.debugMovement = !p.debugMovement;
        console.log('player.debugMovement =', p.debugMovement);
    };
});
