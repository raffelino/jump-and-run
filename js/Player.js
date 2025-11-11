import { Logger } from './Logger.js';

/**
 * Player Klasse - Spieler mit Physik, Kollision und Leben
 */
export class Player {
    constructor(x, y, assetManager) {
        this.logger = new Logger('Player');
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 48;
        this.assetManager = assetManager;
        
        // Physik
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 4;
        this.jumpPower = 12;
        this.gravity = 0.35;
        this.maxFallSpeed = 12;
        
        // Status
        this.isOnGround = false;
        this.facingRight = true;
        this.isAlive = true;
        
        // Animation
        this.animationState = 'idle'; // 'idle', 'run', 'jump'
        this.animationFrame = 0;
        this.animationTimer = 0; // Zeit-Akkumulator für Animationen
        this.animationFrameDuration = 100; // Millisekunden pro Frame für Run
        this.idleAnimationFrameDuration = 1000; // Millisekunden pro Frame für Idle
    }

    update(inputHandler, level, deltaTime = 16) {
        // Bewegung
        this.velocityX = 0;
        
        if (inputHandler.isLeftPressed()) {
            this.velocityX = -this.speed;
            this.facingRight = false;
        }
        if (inputHandler.isRightPressed()) {
            this.velocityX = this.speed;
            this.facingRight = true;
        }

        // Springen
        if (inputHandler.isJumpPressed() && this.isOnGround) {
            this.velocityY = -this.jumpPower;
            this.isOnGround = false;
        }

        // Schwerkraft - nur wenn nicht auf dem Boden
        if (!this.isOnGround) {
            this.velocityY += this.gravity;
            if (this.velocityY > this.maxFallSpeed) {
                this.velocityY = this.maxFallSpeed;
            }
        }

        // Horizontale Bewegung und Kollision
        this.x += this.velocityX;
        this.handleHorizontalCollisions(level);

        // Vertikale Bewegung und Kollision
        this.y += this.velocityY;
        this.handleVerticalCollisions(level);

        // Tod durch Fallen
        if (this.y > level.height * level.tileSize + 100) {
            this.die();
        }

        // Update Animation
        this.updateAnimation(deltaTime);
    }

    updateAnimation(deltaTime) {
        const sprites = this.assetManager.getSprite('player');
        
        // Bestimme Animations-State
        const previousState = this.animationState;
        
        if (!this.isOnGround) {
            this.animationState = 'jump';
        } else if (Math.abs(this.velocityX) > 0) {
            this.animationState = 'run';
        } else {
            this.animationState = 'idle';
        }
        
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
        
        // Wenn State gewechselt hat, reset Animation
        if (previousState !== this.animationState) {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
        
        // Update Animation Frame nur bei Run und Idle (Jump ist statisch)
        if (this.animationState !== 'jump') {
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
                
                // Wrap around
                const maxFrames = sprites[this.animationState].length;
                if (this.animationFrame >= maxFrames) {
                    this.animationFrame = 0;
                }
            }
        } else {
            // Jump hat nur einen Frame
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
                
                if (tile && tile.solid) {
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

        // Prüfe auch den Tile direkt UNTER dem Spieler (für isOnGround)
        // Dies ist wichtig, wenn velocityY = 0 ist
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
                    this.logger.log(`  -> Standing on ground!`);
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

    draw(ctx, camera) {
        ctx.save();
        
        // Hole aktuellen Animation Frame
        const sprites = this.assetManager.getSprite('player');
        const currentSprite = sprites[this.animationState][Math.floor(this.animationFrame)];
        
        // Spiegeln wenn nach links schaut
        if (!this.facingRight) {
            ctx.translate(this.x - camera.x + this.width, this.y - camera.y);
            ctx.scale(-1, 1);
            ctx.drawImage(currentSprite, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(
                currentSprite,
                this.x - camera.x,
                this.y - camera.y,
                this.width,
                this.height
            );
        }
        
        ctx.restore();
    }

    die() {
        this.isAlive = false;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isAlive = true;
        this.isOnGround = false;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationState = 'idle';
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
