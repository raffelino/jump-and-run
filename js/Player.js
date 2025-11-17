import { Logger } from './Logger.js';

/**
 * Player Klasse - Spieler mit Physik, Kollision und Leben
 */
export class Player {
    constructor(x, y, assetManager, soundManager = null) {
        this.logger = new Logger('Player');
        this.x = x;
        this.y = y;
        this.width = 32;  // Breite der Figur (schmaler)
        this.height = 85; // Höhe der Figur (von Kopf bis Schuhe: 40*scale + 2.5*scale bei scale=2)
        this.normalHeight = 85; // Normale Höhe
        this.crouchHeight = 32; // Geduckte Höhe (1 Tile)
        this.assetManager = assetManager;
        this.soundManager = soundManager;
        
        // Physik
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 4;
        this.crouchSpeed = 2; // Langsamere Geschwindigkeit beim Ducken
        this.jumpPower = 12;
        this.gravity = 0.35;
        this.maxFallSpeed = 12;
        
        // Status
        this.isOnGround = false;
        this.facingRight = true;
        this.isAlive = true;
        this.isDying = false;
        this.isCrouching = false; // Ducken-Status
        
        // Rutsch-Mechanik für Eis
        this.iceSlideVelocity = 0; // Aktuelle Rutsch-Geschwindigkeit auf Eis
        this.iceSlideDeceleration = 0.15; // Wie schnell das Rutschen abbremst
        this.isOnIce = false; // Ob Spieler auf Eis steht
        
        // Death Animation
        this.deathAnimationTimer = 0;
        this.deathAnimationDuration = 1000; // 1 Sekunde
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathScale = 1;
        
        // Animation
        this.animationState = 'idle'; // 'idle', 'run', 'jump', 'death'
        this.animationFrame = 0;
        this.animationTimer = 0; // Zeit-Akkumulator für Animationen
        this.animationFrameDuration = 100; // Millisekunden pro Frame für Run
        this.idleAnimationFrameDuration = 1000; // Millisekunden pro Frame für Idle
        
        // Debug
        this.showCollisionBox = false; // Schalter für Collision-Box Visualisierung
        this.debugFrameCounter = 0; // Für periodisches Debug-Output
    }

    update(inputHandler, level, deltaTime = 16) {
        // Wenn Spieler stirbt, nur Death-Animation
        if (this.isDying) {
            this.updateDeathAnimation(deltaTime);
            return;
        }
        
        // Frame-rate Normalisierung: Bei 60 FPS ist deltaTime ~10.67ms
        // Alle Bewegungen mit diesem Faktor multiplizieren für konstante Geschwindigkeit
        const timeScale = deltaTime / 10.67;
        
        // DEBUG: Frame-Counter für reduzierte Ausgabe
        this.debugFrameCounter = (this.debugFrameCounter || 0) + 1;
        const shouldLog = this.debugFrameCounter % 60 === 0; // Alle 60 Frames (ca. 1 Sekunde)
        
        if (shouldLog) {
            console.log('=== PLAYER UPDATE DEBUG ===');
            console.log(`Position: x=${this.x.toFixed(2)}, y=${this.y.toFixed(2)}`);
            console.log(`Velocity: vX=${this.velocityX.toFixed(2)}, vY=${this.velocityY.toFixed(2)}`);
            console.log(`State: isOnGround=${this.isOnGround}, isCrouching=${this.isCrouching}, height=${this.height}`);
        }
        
        // Ducken-Status prüfen (Pfeil nach unten oder S-Taste)
        const wantsToCrouch = inputHandler.isPressed('ArrowDown') || inputHandler.isPressed('s');
        const wantsToStandUp = inputHandler.isPressed('ArrowUp') || inputHandler.isPressed('w');
        
        if (shouldLog && wantsToCrouch) {
            console.log(`Crouch input detected: wantsToCrouch=${wantsToCrouch}, isOnGround=${this.isOnGround}`);
        }
        
        if (wantsToStandUp && this.isCrouching) {
            // Nach oben gedrückt - versuche aufzustehen
            if (this.canStandUp(level, this.y)) {
                this.isCrouching = false;
                this.height = this.normalHeight;
                // KEINE Y-Position Änderung
            }
        } else if (wantsToCrouch) {
            // Ducken aktivieren - solange Taste gedrückt ist
            if (!this.isCrouching && this.isOnGround) {
                // Nur ducken wenn auf dem Boden
                this.isCrouching = true;
                this.height = this.crouchHeight;
                // KEINE Y-Position Änderung - die Figur wird von oben komprimiert
            }
            // Wenn bereits geduckt, bleibe geduckt (auch in der Luft)
        } else {
            // Taste losgelassen - aufstehen, aber nur wenn genug Platz
            if (this.isCrouching) {
                // Prüfe ob Platz zum Aufstehen ist (aktuelle Position, volle Höhe)
                if (this.canStandUp(level, this.y)) {
                    this.isCrouching = false;
                    this.height = this.normalHeight;
                    // KEINE Y-Position Änderung
                }
                // Wenn nicht genug Platz, bleibe geduckt bis Platz vorhanden ist
            }
        }
        
        // Bewegung
        this.velocityX = 0;
        const currentSpeed = this.isCrouching ? this.crouchSpeed : this.speed;
        
        // Prüfe ob auf Eis
        this.checkIfOnIce(level);
        
        // Input-basierte Bewegung
        let hasMovementInput = false;
        if (inputHandler.isLeftPressed()) {
            this.velocityX = -currentSpeed;
            this.facingRight = false;
            hasMovementInput = true;
            
            // Bei Eis: Setze Rutsch-Geschwindigkeit
            if (this.isOnIce) {
                this.iceSlideVelocity = -currentSpeed;
            }
        }
        if (inputHandler.isRightPressed()) {
            this.velocityX = currentSpeed;
            this.facingRight = true;
            hasMovementInput = true;
            
            // Bei Eis: Setze Rutsch-Geschwindigkeit
            if (this.isOnIce) {
                this.iceSlideVelocity = currentSpeed;
            }
        }
        
        // Wenn auf Eis und keine Input-Bewegung: Rutschen
        if (this.isOnIce && !hasMovementInput && Math.abs(this.iceSlideVelocity) > 0.1) {
            // Weiterrutschen mit abnehmender Geschwindigkeit
            this.velocityX = this.iceSlideVelocity;
            
            // Bremse das Rutschen ab (mit timeScale für konstante Verzögerung)
            const deceleration = this.iceSlideDeceleration * timeScale;
            if (this.iceSlideVelocity > 0) {
                this.iceSlideVelocity -= deceleration;
                if (this.iceSlideVelocity < 0) this.iceSlideVelocity = 0;
            } else if (this.iceSlideVelocity < 0) {
                this.iceSlideVelocity += deceleration;
                if (this.iceSlideVelocity > 0) this.iceSlideVelocity = 0;
            }
        } else if (!this.isOnIce || hasMovementInput) {
            // Nicht auf Eis oder aktive Bewegung: Reset Rutsch-Geschwindigkeit
            this.iceSlideVelocity = 0;
        }

        // Springen - nur wenn nicht geduckt
        if (inputHandler.isJumpPressed() && this.isOnGround && !this.isCrouching) {
            this.velocityY = -this.jumpPower;
            this.isOnGround = false;
            
            // Spiele Sprung-Sound
            if (this.soundManager) {
                this.soundManager.playJumpSound();
            }
        }

        // Schwerkraft anwenden - NUR wenn nicht auf dem Boden (mit timeScale)
        // isOnGround wird in handleVerticalCollisions gesetzt
        if (!this.isOnGround) {
            this.velocityY += this.gravity * timeScale;
            if (this.velocityY > this.maxFallSpeed) {
                this.velocityY = this.maxFallSpeed;
            }
        } else {
            // Wenn auf dem Boden, velocity auf 0 halten
            this.velocityY = 0;
        }

        // Horizontale Bewegung und Kollision (mit timeScale)
        this.x += this.velocityX * timeScale;
        this.handleHorizontalCollisions(level);

        // Vertikale Bewegung und Kollision (mit timeScale)
        const yBefore = this.y;
        this.y += this.velocityY * timeScale;
        this.handleVerticalCollisions(level);
        
        if (shouldLog) {
            console.log(`Vertical movement: yBefore=${yBefore.toFixed(2)}, yAfter=${this.y.toFixed(2)}, delta=${(this.y - yBefore).toFixed(2)}`);
            console.log(`After collision: velocityY=${this.velocityY.toFixed(2)}, isOnGround=${this.isOnGround}`);
        }

        // Tod durch Fallen
        if (this.y > level.height * level.tileSize + 100) {
            this.die();
        }

        // Update Animation
        this.updateAnimation(deltaTime);
    }

    updateAnimation(deltaTime) {
        console.log('updateAnimation called, deltaTime:', deltaTime);
        const sprites = this.assetManager.getSprite('player');
        
        // Bestimme Animations-State
        const previousState = this.animationState;
        
        if (this.isCrouching) {
            this.animationState = 'crouch';
        } else if (!this.isOnGround) {
            this.animationState = 'jump';
        } else if (Math.abs(this.velocityX) > 0) {
            this.animationState = 'run';
        } else {
            this.animationState = 'idle';
        }
        
        console.log('Current animationState:', this.animationState, 'isOnGround:', this.isOnGround);
        
        // Debug Output
        if (previousState !== this.animationState) {
            this.logger.group('ANIMATION STATE CHANGE');
            this.logger.log(`From: ${previousState} -> To: ${this.animationState}`);
            this.logger.log(`isOnGround: ${this.isOnGround}`);
            this.logger.log(`velocityX: ${this.velocityX}`);
            this.logger.log(`velocityY: ${this.velocityY}`);
            this.logger.log(`position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
            this.logger.groupEnd();
        }
        
        // Debug Output im Idle-Modus
        if (this.animationState === 'idle') {
            this.debugFrameCounter++;
            // Nur alle 60 Frames (ca. 1x pro Sekunde) ausgeben
            if (this.debugFrameCounter >= 60) {
                console.log('=== IDLE DEBUG ===', {
                    state: this.animationState,
                    isOnGround: this.isOnGround,
                    isCrouching: this.isCrouching,
                    velocityX: this.velocityX,
                    velocityY: this.velocityY,
                    x: this.x.toFixed(2),
                    y: this.y.toFixed(2),
                    height: this.height,
                    normalHeight: this.normalHeight,
                    crouchHeight: this.crouchHeight
                });
                this.debugFrameCounter = 0;
            }
        } else {
            this.debugFrameCounter = 0;
        }
        
        // Wenn State gewechselt hat, reset Animation
        if (previousState !== this.animationState) {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
        
        // Update Animation Frame nur bei Run und Idle (Jump ist statisch)
        // Crouch hat keine Sprite-Animation, wird komplett im draw() gezeichnet
        if (this.animationState !== 'jump' && this.animationState !== 'crouch') {
            // Akkumuliere Zeit
            this.animationTimer += deltaTime;
            
            // Bestimme Frame-Dauer basierend auf State
            const frameDuration = this.animationState === 'idle' 
                ? this.idleAnimationFrameDuration 
                : this.animationFrameDuration;
            
            // Wechsle zum nächsten Frame wenn genug Zeit vergangen ist
            if (this.animationTimer >= frameDuration) {
                this.animationTimer -= frameDuration; // Behalte Überschuss
                this.animationFrame++;
                
                // Wrap around - prüfe ob sprites für diesen State existieren
                if (sprites[this.animationState]) {
                    const maxFrames = sprites[this.animationState].length;
                    if (this.animationFrame >= maxFrames) {
                        this.animationFrame = 0;
                    }
                }
            }
        } else {
            // Jump und Crouch haben nur einen Frame bzw. custom rendering
            this.animationFrame = 0;
            this.animationTimer = 0;
        }

    }

    handleHorizontalCollisions(level) {
        const tileSize = level.tileSize;
        
        // Begrenze Spieler auf Level-Grenzen
        const levelWidth = level.width * tileSize;
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        }
        if (this.x + this.width > levelWidth) {
            this.x = levelWidth - this.width;
            this.velocityX = 0;
        }
        
        const leftTile = Math.floor(this.x / tileSize);
        const rightTile = Math.floor((this.x + this.width - 1) / tileSize);
        const topTile = Math.floor(this.y / tileSize);
        const bottomTile = Math.floor((this.y + this.height - 1) / tileSize);

        for (let row = topTile; row <= bottomTile; row++) {
            for (let col = leftTile; col <= rightTile; col++) {
                const tile = level.getTile(col, row);
                
                // Prüfe auf tödliche Tiles (Lava)
                if (tile && tile.deadly) {
                    this.logger.error('☠️ Player touched lava! (horizontal)');
                    this.die();
                    return;
                }
                
                // Nur solide Tiles mit horizontaler Kollision (platformOnly ignorieren!)
                if (tile && tile.solid && !tile.platformOnly) {
                    // Horizontale Kollision
                    if (this.velocityX > 0) {
                        // Nach rechts bewegt
                        this.x = col * tileSize - this.width;
                        this.velocityX = 0;
                    } else if (this.velocityX < 0) {
                        // Nach links bewegt
                        this.x = (col + 1) * tileSize;
                        this.velocityX = 0;
                    }
                }
            }
        }
    }

    handleVerticalCollisions(level) {
        const tileSize = level.tileSize;
        const leftTile = Math.floor(this.x / tileSize);
        const rightTile = Math.floor((this.x + this.width - 1) / tileSize);
        const topTile = Math.floor(this.y / tileSize);
        const bottomTile = Math.floor((this.y + this.height - 1) / tileSize);

        this.logger.log(`--- Vertical Collision Check ---`);
        this.logger.log(`Player Y: ${this.y.toFixed(2)}, VelocityY: ${this.velocityY.toFixed(2)}`);
        this.logger.log(`Checking tiles - Top: ${topTile}, Bottom: ${bottomTile}, Left: ${leftTile}, Right: ${rightTile}`);

        let collisionFound = false;
        let wasOnGround = false;

        for (let row = topTile; row <= bottomTile; row++) {
            for (let col = leftTile; col <= rightTile; col++) {
                const tile = level.getTile(col, row);
                
                // Prüfe auf tödliche Tiles (Lava)
                if (tile && tile.deadly) {
                    this.logger.error('☠️ Player touched lava! (vertical)');
                    this.die();
                    return;
                }
                
                if (tile && tile.solid) {
                    this.logger.log(`  Solid tile at (${col}, ${row}), platformOnly: ${tile.platformOnly}, name: ${tile.name}`);
                    
                    // Plattformen (platformOnly) sind nur von oben begehbar
                    if (tile.platformOnly) {
                        this.logger.log(`  -> Platform detected! velocityY: ${this.velocityY}`);
                        // Nur kollidieren wenn Spieler von oben kommt
                        if (this.velocityY > 0) {
                            const playerBottom = this.y + this.height;
                            const tileTop = row * tileSize;
                            this.logger.log(`    playerBottom: ${playerBottom}, tileTop: ${tileTop}, diff: ${playerBottom - tileTop}`);
                            // Nur kollidieren wenn Spieler-Fuß über der Plattform-Oberseite ist
                            if (playerBottom <= tileTop + this.velocityY) {
                                this.logger.log(`  -> Platform collision from TOP`);
                                this.y = row * tileSize - this.height;
                                this.velocityY = 0;
                                wasOnGround = true;
                                collisionFound = true;
                            }
                        } else {
                            this.logger.log(`    No collision - player jumping up or standing`);
                        }
                        // Von unten/seitlich: keine Kollision
                    } else {
                        // Normale Tiles: Kollision von allen Seiten
                        if (this.velocityY > 0) {
                            // Nach unten gefallen
                            this.logger.log(`  -> Collision from TOP (falling down)`);
                            this.y = row * tileSize - this.height;
                            this.velocityY = 0;
                            wasOnGround = true;
                            collisionFound = true;
                        } else if (this.velocityY < 0) {
                            // Nach oben gesprungen
                            this.logger.log(`  -> Collision from BOTTOM (jumping up)`);
                            this.y = (row + 1) * tileSize;
                            this.velocityY = 0;
                        }
                    }
                }
            }
        }

        // Prüfe ob Spieler auf dem Boden steht
        // Wichtig: Nur prüfen wenn KEINE Kollision gefunden wurde (sonst wird Position doppelt gesetzt)
        if (!collisionFound) {
            // Prüfe den Tile direkt UNTER dem Spieler (für isOnGround)
            const checkBottomRow = bottomTile + 1;
            for (let col = leftTile; col <= rightTile; col++) {
                const tile = level.getTile(col, checkBottomRow);
                if (tile && tile.solid) {
                    // Prüfe ob Spieler genau auf diesem Tile steht
                    const playerBottom = this.y + this.height;
                    const tileTop = checkBottomRow * tileSize;
                    const distance = Math.abs(playerBottom - tileTop);
                    
                    this.logger.log(`  Checking ground below at (${col}, ${checkBottomRow}), distance: ${distance.toFixed(2)}`);
                    
                    // Wenn der Spieler innerhalb 1 Pixel vom Tile-Top ist, steht er drauf
                    if (distance <= 1) {
                        wasOnGround = true;
                        // WICHTIG: Korrigiere Position auf exakt den Boden
                        this.y = tileTop - this.height;
                        this.velocityY = 0;
                        this.logger.log(`  -> Standing on ground! Position corrected to y=${this.y}`);
                    }
                }
            }
        }

        this.isOnGround = wasOnGround;
        this.logger.log(`isOnGround after check: ${this.isOnGround}, Collision found: ${collisionFound}`);
    }

    handleCollisions(level) {
        const tileSize = level.tileSize;
        
        // Berechne relevante Tile-Bereiche
        const leftTile = Math.floor(this.x / tileSize);
        const rightTile = Math.floor((this.x + this.width - 1) / tileSize);
        const topTile = Math.floor(this.y / tileSize);
        const bottomTile = Math.floor((this.y + this.height - 1) / tileSize);

        // Erst NACH allen Kollisionen wird isOnGround bestimmt
        let wasOnGround = false;

        // Prüfe alle relevanten Tiles
        for (let row = topTile; row <= bottomTile; row++) {
            for (let col = leftTile; col <= rightTile; col++) {
                const tile = level.getTile(col, row);
                
                if (tile && tile.solid) {
                    const result = this.resolveTileCollision(col * tileSize, row * tileSize, tileSize);
                    if (result === 'ground') {
                        wasOnGround = true;
                    }
                }
            }
        }

        this.isOnGround = wasOnGround;
    }

    resolveTileCollision(tileX, tileY, tileSize) {
        const overlapLeft = (this.x + this.width) - tileX;
        const overlapRight = (tileX + tileSize) - this.x;
        const overlapTop = (this.y + this.height) - tileY;
        const overlapBottom = (tileY + tileSize) - this.y;

        // Finde kleinste Überlappung
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && this.velocityY >= 0) {
            // Kollision von oben (Spieler landet auf Plattform)
            this.y = tileY - this.height;
            this.velocityY = 0;
            return 'ground';
        } else if (minOverlap === overlapBottom && this.velocityY < 0) {
            // Kollision von unten (Spieler stößt Kopf)
            this.y = tileY + tileSize;
            this.velocityY = 0;
        } else if (minOverlap === overlapLeft && this.velocityX > 0) {
            // Kollision von links
            this.x = tileX - this.width;
            this.velocityX = 0;
        } else if (minOverlap === overlapRight && this.velocityX < 0) {
            // Kollision von rechts
            this.x = tileX + tileSize;
            this.velocityX = 0;
        }
        return null;
    }
    
    /**
     * Prüft ob genug Platz zum Aufstehen ist
     * Beim Aufstehen muss nur der ZUSÄTZLICHE Platz nach oben geprüft werden
     */
    canStandUp(level, newY) {
        const tileSize = level.tileSize;
        
        // Berechne nur die Tiles ÜBER der aktuellen geduckten Position
        // crouchHeight = 32px (1 Tile), normalHeight = 85px
        // Wir müssen also 85 - 32 = 53px nach oben prüfen
        const additionalHeight = this.normalHeight - this.crouchHeight;
        
        const leftTile = Math.floor(this.x / tileSize);
        const rightTile = Math.floor((this.x + this.width - 1) / tileSize);
        
        // Prüfe nur die Tiles über der aktuellen Position
        const topTileOfCrouchedPlayer = Math.floor(newY / tileSize);
        const topTileIfStanding = Math.floor((newY - additionalHeight) / tileSize);
        
        // Prüfe alle Tiles zwischen der geduckten Oberseite und der stehenden Oberseite
        for (let row = topTileIfStanding; row < topTileOfCrouchedPlayer; row++) {
            for (let col = leftTile; col <= rightTile; col++) {
                const tile = level.getTile(col, row);
                if (tile && tile.solid) {
                    return false; // Blockiert durch Tile über dem Kopf
                }
            }
        }
        
        return true; // Genug Platz nach oben
    }

    updateDeathAnimation(deltaTime) {
        this.deathAnimationTimer += deltaTime;
        const progress = Math.min(this.deathAnimationTimer / this.deathAnimationDuration, 1);
        
        // 4 volle Drehungen
        this.deathRotation = progress * Math.PI * 8;
        
        // Fade out
        this.deathOpacity = 1 - progress;
        
        // Pulsierendes Scaling
        this.deathScale = 1 + Math.sin(progress * Math.PI * 4) * 0.3;
        
        // Nach oben fliegen, dann fallen
        if (progress < 0.5) {
            this.y -= 3;
        } else {
            this.y += 5;
        }
        
        // Am Ende: isAlive = false
        if (progress >= 1) {
            this.isAlive = false;
        }
    }

    draw(ctx, camera) {
        ctx.save();
        
        // Death Animation
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            
            // Zentrum des Spielers
            const centerX = this.x - camera.x + this.width / 2;
            const centerY = this.y - camera.y + this.height / 2;
            
            // Totenkopf mit Rotation und Scaling
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            ctx.scale(this.deathScale, this.deathScale);
            
            // Totenkopf Emoji
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💀', 0, 0);
            
            // Gelbe Partikel im Kreis
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + this.deathRotation;
                const distance = 40 * this.deathScale;
                const px = Math.cos(angle) * distance;
                const py = Math.sin(angle) * distance;
                
                ctx.fillStyle = 'yellow';
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
            return;
        }
        
        // Normale Animation - Kleine blonde Frau
        ctx.save();
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Skalierungsfaktor für größere Figur - immer 2 unabhängig von width
        const scale = 2; // Fest auf 2 für 64px hohe Zeichnung
        
        // Offset um Figur in die Box zu zentrieren
        // Figur ist 32px breit (16*scale), Box ist auch 32px breit
        // Figur muss zentriert werden: (32 - 32) / 2 = 0
        const offsetX = -16; // Verschiebe Figur nach links um sie zu zentrieren
        const offsetY = 0; // Keine vertikale Verschiebung nötig
        
        // Wenn geduckt, zeichne komprimierte Version
        if (this.isCrouching) {
            this.drawCrouching(ctx, screenX, screenY, scale, offsetX, offsetY);
            // ctx.restore() wird jetzt in drawCrouching() aufgerufen
            return;
        }
        
        // Animations-Werte
        let bodyBounce = 0;
        let armSwingL = 0;
        let armSwingR = 0;
        let legSwingL = 0;
        let legSwingR = 0;
        let hairSwing = 0;
        let armRaiseL = 0; // Für Sprung-Animation
        let armRaiseR = 0; // Für Sprung-Animation
        
        if (this.animationState === 'run') {
            // Lauf-Animation mit smootherer Bewegung
            // Nutze animationTimer (in ms) für kontinuierliche Animation
            const t = (this.animationTimer / 1000) * 2; // 2 Zyklen pro Sekunde
            bodyBounce = Math.abs(Math.sin(t * Math.PI * 2)) * 2 * scale;
            armSwingL = Math.sin(t * Math.PI * 2) * 4 * scale;
            armSwingR = Math.sin(t * Math.PI * 2 + Math.PI) * 4 * scale;
            legSwingL = Math.sin(t * Math.PI * 2) * 3 * scale;
            legSwingR = Math.sin(t * Math.PI * 2 + Math.PI) * 3 * scale;
            hairSwing = Math.sin(t * Math.PI * 4) * 3 * scale;
        } else if (this.animationState === 'idle') {
            // Idle-Animation: KEINE bodyBounce, da dies zu Kollisionsproblemen führt
            // Stattdessen nur subtile visuelle Effekte ohne Y-Verschiebung
            bodyBounce = 0;
        } else if (this.animationState === 'jump') {
            // Sprung-Animation: Arme nach oben
            armRaiseL = -10 * scale; // Nach oben verschieben
            armRaiseR = -10 * scale; // Nach oben verschieben
        }
        
        // Körper Position (mit Bounce)
        const bodyY = 20 * scale - bodyBounce;
        
        // Zeichne Zopf ZUERST (bevor Flip) - immer auf der rechten Seite (hinten)
        ctx.fillStyle = '#FFD700';
        if (!this.facingRight) {
            // Nach links: Zopf rechts (ist hinten)
            ctx.fillRect(screenX + offsetX + (22 * scale) + hairSwing, screenY + offsetY + (10 * scale) - bodyBounce, 3 * scale, 8 * scale);
            ctx.beginPath();
            ctx.arc(screenX + offsetX + (23.5 * scale) + hairSwing, screenY + offsetY + (18 * scale) - bodyBounce, 2.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            // Haarband (rosa)
            ctx.fillStyle = '#FF69B4';
            ctx.fillRect(screenX + offsetX + (21.5 * scale) + hairSwing * 0.5, screenY + offsetY + (10 * scale) - bodyBounce, 4 * scale, 1.5 * scale);
        } else {
            // Nach rechts: Zopf links (ist hinten)  
            ctx.fillRect(screenX + offsetX + (7 * scale) - hairSwing, screenY + offsetY + (10 * scale) - bodyBounce, 3 * scale, 8 * scale);
            ctx.beginPath();
            ctx.arc(screenX + offsetX + (8.5 * scale) - hairSwing, screenY + offsetY + (18 * scale) - bodyBounce, 2.5 * scale, 0, Math.PI * 2);
            ctx.fill();
            // Haarband (rosa)
            ctx.fillStyle = '#FF69B4';
            ctx.fillRect(screenX + offsetX + (6.5 * scale) - hairSwing * 0.5, screenY + offsetY + (10 * scale) - bodyBounce, 4 * scale, 1.5 * scale);
        }
        
        // Jetzt Flip für Rest der Figur
        if (!this.facingRight) {
            ctx.translate(screenX + offsetX + this.width, screenY + offsetY);
            ctx.scale(-1, 1);
            ctx.translate(-this.width, 0); // Korrigiere die Position nach dem Flip
        } else {
            ctx.translate(screenX + offsetX, screenY + offsetY);
        }
        
        // Körper (Kleid - rosa/pink)
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.moveTo(16 * scale, bodyY);
        ctx.lineTo(8 * scale, 32 * scale - bodyBounce);
        ctx.lineTo(24 * scale, 32 * scale - bodyBounce);
        ctx.closePath();
        ctx.fill();
        
        // Kleid-Details (dunkleres Pink)
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(16 * scale, (22 * scale) - bodyBounce, 4 * scale, 0, Math.PI);
        ctx.stroke();
        
        // Gürtel/Schleife
        ctx.fillStyle = '#FF1493';
        ctx.fillRect(13 * scale, (22 * scale) - bodyBounce, 6 * scale, 2 * scale);
        
        // Arme (Haut) - hinter dem Körper für linken Arm
        ctx.fillStyle = '#FFDAB9';
        
        // Linker Arm (hinter Körper)
        const leftArmY = (20 * scale) - bodyBounce + armSwingL + armRaiseL;
        ctx.fillRect(10 * scale, leftArmY, 3 * scale, 8 * scale);
        // Hand
        ctx.beginPath();
        ctx.arc(11.5 * scale, leftArmY + 8 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Rechter Arm (vor Körper)
        const rightArmY = (20 * scale) - bodyBounce + armSwingR + armRaiseR;
        ctx.fillRect(19 * scale, rightArmY, 3 * scale, 8 * scale);
        // Hand
        ctx.beginPath();
        ctx.arc(20.5 * scale, rightArmY + 8 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Beine (Haut)
        if (this.animationState === 'run') {
            // Laufende Beine - deutliche Bewegung
            // Nutze animationTimer für kontinuierliche Animation
            const t = (this.animationTimer / 1000) * 2; // 2 Zyklen pro Sekunde
            
            // Linkes Bein
            const leftLegX = 12 * scale + Math.sin(t * Math.PI * 2) * 2 * scale;
            const leftLegLength = (8 * scale) + legSwingL;
            ctx.fillRect(leftLegX, 32 * scale - bodyBounce, 3 * scale, leftLegLength);
            
            // Rechtes Bein
            const rightLegX = 17 * scale + Math.sin(t * Math.PI * 2 + Math.PI) * 2 * scale;
            const rightLegLength = (8 * scale) + legSwingR;
            ctx.fillRect(rightLegX, 32 * scale - bodyBounce, 3 * scale, rightLegLength);
        } else if (this.animationState === 'jump') {
            // Beide Beine angewinkelt beim Springen
            ctx.fillRect(12 * scale, 32 * scale, 3 * scale, 6 * scale);
            ctx.fillRect(17 * scale, 32 * scale, 3 * scale, 6 * scale);
        } else {
            // Stehende Beine
            ctx.fillRect(12 * scale, 32 * scale - bodyBounce, 3 * scale, 8 * scale);
            ctx.fillRect(17 * scale, 32 * scale - bodyBounce, 3 * scale, 8 * scale);
        }
        
        // Schuhe (rot)
        ctx.fillStyle = '#DC143C';
        if (this.animationState === 'run') {
            // Schuhe bewegen sich mit den Beinen
            const t = (this.animationTimer / 1000) * 2; // 2 Zyklen pro Sekunde
            const leftLegX = 12 * scale + Math.sin(t * Math.PI * 2) * 2 * scale;
            const rightLegX = 17 * scale + Math.sin(t * Math.PI * 2 + Math.PI) * 2 * scale;
            ctx.fillRect(leftLegX - 1 * scale, (40 * scale) - bodyBounce + legSwingL, 5 * scale, 2.5 * scale);
            ctx.fillRect(rightLegX - 1 * scale, (40 * scale) - bodyBounce + legSwingR, 5 * scale, 2.5 * scale);
        } else if (this.animationState === 'jump') {
            ctx.fillRect(11 * scale, 38 * scale, 5 * scale, 2.5 * scale);
            ctx.fillRect(16 * scale, 38 * scale, 5 * scale, 2.5 * scale);
        } else {
            ctx.fillRect(11 * scale, (40 * scale) - bodyBounce, 5 * scale, 2.5 * scale);
            ctx.fillRect(16 * scale, (40 * scale) - bodyBounce, 5 * scale, 2.5 * scale);
        }
        
        // Kopf (Haut) - mit Bounce
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(16 * scale, (10 * scale) - bodyBounce, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Haare (blond)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(16 * scale, (8 * scale) - bodyBounce, 7 * scale, Math.PI, 0, false);
        ctx.fill();
        
        // Pony
        ctx.beginPath();
        ctx.moveTo(10 * scale, (8 * scale) - bodyBounce);
        ctx.lineTo(12 * scale, (11 * scale) - bodyBounce);
        ctx.lineTo(14 * scale, (10 * scale) - bodyBounce);
        ctx.lineTo(16 * scale, (11 * scale) - bodyBounce);
        ctx.lineTo(18 * scale, (10 * scale) - bodyBounce);
        ctx.lineTo(20 * scale, (11 * scale) - bodyBounce);
        ctx.lineTo(22 * scale, (8 * scale) - bodyBounce);
        ctx.fill();
        
        // Augen
        ctx.fillStyle = '#000000';
        const eyeY = (10 * scale) - bodyBounce;
        ctx.beginPath();
        ctx.arc(13 * scale, eyeY, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(19 * scale, eyeY, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Augen-Glanz (weiß)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(13.5 * scale, eyeY - 0.5 * scale, 0.7 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(19.5 * scale, eyeY - 0.5 * scale, 0.7 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Lächeln
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(16 * scale, (12 * scale) - bodyBounce, 3 * scale, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Wangen (rosa)
        ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
        ctx.beginPath();
        ctx.arc(11 * scale, (12 * scale) - bodyBounce, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(21 * scale, (12 * scale) - bodyBounce, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Debug: Collision Box zeichnen
        if (this.showCollisionBox) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, this.width, this.height);
            
            // Kreuz in der Mitte
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + this.width, screenY + this.height);
            ctx.moveTo(screenX + this.width, screenY);
            ctx.lineTo(screenX, screenY + this.height);
            ctx.stroke();
            
            // Boden-Linie (wo die Füße sein sollten)
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX - 5, screenY + this.height);
            ctx.lineTo(screenX + this.width + 5, screenY + this.height);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathAnimationTimer = 0;
        }
    }
    
    /**
     * Zeichnet die geduckte Spielfigur (komprimiert auf 1 Tile Höhe)
     */
    drawCrouching(ctx, screenX, screenY, scale, offsetX, offsetY) {
        // Komprimierte Version: nur 1 Tile hoch (16px * scale)
        const crouchScale = 0.5; // Halb so groß
        
        // Flip wenn nach links
        if (!this.facingRight) {
            ctx.translate(screenX + offsetX + this.width, screenY + offsetY);
            ctx.scale(-1, 1);
            ctx.translate(-this.width, 0);
        } else {
            ctx.translate(screenX + offsetX, screenY + offsetY);
        }
        
        // Geduckte Figur - alles komprimiert
        // Kopf
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(16 * scale, 8 * scale * crouchScale, 6 * scale * crouchScale, 0, Math.PI * 2);
        ctx.fill();
        
        // Haare (blond)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(16 * scale, 6 * scale * crouchScale, 7 * scale * crouchScale, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Zopf (horizontal nach hinten)
        ctx.fillRect(20 * scale, 6 * scale * crouchScale, 6 * scale, 2 * scale * crouchScale);
        ctx.beginPath();
        ctx.arc(26 * scale, 7 * scale * crouchScale, 1.5 * scale * crouchScale, 0, Math.PI * 2);
        ctx.fill();
        
        // Körper/Kleid (komprimiert)
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(10 * scale, 12 * scale * crouchScale, 12 * scale, 14 * scale * crouchScale);
        
        // Arme (auf dem Boden)
        ctx.fillStyle = '#FFDAB9';
        ctx.fillRect(8 * scale, 20 * scale * crouchScale, 3 * scale, 6 * scale * crouchScale);
        ctx.fillRect(21 * scale, 20 * scale * crouchScale, 3 * scale, 6 * scale * crouchScale);
        
        // Beine (angewinkelt)
        ctx.fillRect(10 * scale, 24 * scale * crouchScale, 3 * scale, 4 * scale * crouchScale);
        ctx.fillRect(19 * scale, 24 * scale * crouchScale, 3 * scale, 4 * scale * crouchScale);
        
        // Schuhe
        ctx.fillStyle = '#FF1493';
        ctx.fillRect(9 * scale, 27 * scale * crouchScale, 4 * scale, 2.5 * scale * crouchScale);
        ctx.fillRect(19 * scale, 27 * scale * crouchScale, 4 * scale, 2.5 * scale * crouchScale);
        
        // Restore context für Collision Box
        ctx.restore();
        
        // Debug: Collision Box zeichnen (auch beim Ducken)
        if (this.showCollisionBox) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, this.width, this.height);
            
            // Kreuz in der Mitte
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + this.width, screenY + this.height);
            ctx.moveTo(screenX + this.width, screenY);
            ctx.lineTo(screenX, screenY + this.height);
            ctx.stroke();
            
            // Boden-Linie (wo die Füße sein sollten)
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX - 5, screenY + this.height);
            ctx.lineTo(screenX + this.width + 5, screenY + this.height);
            ctx.stroke();
            
            ctx.restore();
        }
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isAlive = true;
        this.isDying = false;
        this.isCrouching = false;
        this.height = this.normalHeight;
        this.deathAnimationTimer = 0;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathScale = 1;
        this.isOnGround = false;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationState = 'idle';
        this.iceSlideVelocity = 0;
        this.isOnIce = false;
    }

    checkIfOnIce(level) {
        // Prüfe ob Spieler auf dem Boden steht
        if (!this.isOnGround) {
            this.isOnIce = false;
            return;
        }
        
        // Prüfe Tiles direkt unter den Füßen
        const tileSize = level.tileSize;
        const leftTile = Math.floor(this.x / tileSize);
        const rightTile = Math.floor((this.x + this.width - 1) / tileSize);
        const bottomTile = Math.floor((this.y + this.height) / tileSize);
        
        // Prüfe die Tiles direkt unter dem Spieler
        this.isOnIce = false;
        for (let col = leftTile; col <= rightTile; col++) {
            const tile = level.getTile(col, bottomTile);
            if (tile && tile.slippery) {
                this.isOnIce = true;
                break;
            }
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
