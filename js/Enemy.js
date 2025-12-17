/**
 * Basisklasse für alle Gegner-Typen
 */
export class Enemy {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.active = true;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    checkCollision(player) {
        if (!this.active) return false;
        // Keine Kollision wenn Gegner stirbt (Death Animation läuft)
        if (this.isDying) return false;
        
        const playerBounds = player.getBounds();
        return (
            this.x < playerBounds.x + playerBounds.width &&
            this.x + this.width > playerBounds.x &&
            this.y < playerBounds.y + playerBounds.height &&
            this.y + this.height > playerBounds.y
        );
    }

    update(level) {
        // Überschreiben in Unterklassen
    }

    draw(ctx, camera) {
        // Überschreiben in Unterklassen
    }
}

/**
 * Gegner Typ 1: Läuft horizontal, dreht bei Kollision oder Abgrund um
 */
export class WalkingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.speed = 1.5;
        this.direction = 1; // 1 = rechts, -1 = links
        this.tileSize = 32;
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500; // 0.5 Sekunden
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5; // Springt beim Tod nach oben
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
        }
    }

    update(level) {
        if (this.isDying) {
            // Death Animation
            this.deathTimer += 16; // ca. 60fps
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            
            // Rotation (2 volle Drehungen)
            this.deathRotation = progress * Math.PI * 4;
            
            // Fade out
            this.deathOpacity = 1 - progress;
            
            // Nach oben fliegen dann fallen
            this.deathVelocityY += 0.3; // Gravitation
            this.deathY += this.deathVelocityY;
            
            // Komplett entfernen wenn Animation fertig
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        
        if (!this.active) return;

        // Bewege den Gegner
        const nextX = this.x + this.speed * this.direction;

        // Prüfe Kollision mit Tiles
        const willCollide = this.checkTileCollision(level, nextX, this.y);
        
        // Prüfe ob Abgrund vor dem Gegner ist
        const willFall = this.checkGroundAhead(level, nextX);

        if (willCollide || willFall) {
            // Richtung umdrehen
            this.direction *= -1;
        } else {
            this.x = nextX;
        }

        // Prüfe Level-Grenzen
        if (this.x < 0 || this.x + this.width > level.width * this.tileSize) {
            this.direction *= -1;
            this.x = Math.max(0, Math.min(this.x, level.width * this.tileSize - this.width));
        }
    }

    checkTileCollision(level, x, y) {
        const left = Math.floor(x / this.tileSize);
        const right = Math.floor((x + this.width - 1) / this.tileSize);
        const top = Math.floor(y / this.tileSize);
        const bottom = Math.floor((y + this.height - 1) / this.tileSize);

        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                const tile = level.getTile(col, row);
                if (tile && tile.solid) {
                    return true;
                }
            }
        }
        return false;
    }

    checkGroundAhead(level, x) {
        // Prüfe ob Boden unter dem nächsten Schritt vorhanden ist
        const checkX = this.direction > 0 ? x + this.width : x;
        const checkCol = Math.floor(checkX / this.tileSize);
        const checkRow = Math.floor((this.y + this.height + 1) / this.tileSize);
        
        const tile = level.getTile(checkCol, checkRow);
        return !tile || !tile.solid; // true = kein Boden (wird fallen)
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        ctx.save();
        
        // Death Animation
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            
            // Zentrum des Gegners
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierendes Monster
            // Körper (dunkler rot/braun)
            ctx.fillStyle = '#8B2828';
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            
            // Hörner
            ctx.fillStyle = '#5A1818';
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(-8, -16);
            ctx.lineTo(-6, -10);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(6, -10);
            ctx.lineTo(8, -16);
            ctx.lineTo(10, -10);
            ctx.fill();
            
            // X-Augen (tot)
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            // Linkes X
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-4, 0);
            ctx.moveTo(-4, -4);
            ctx.lineTo(-8, 0);
            ctx.stroke();
            // Rechtes X
            ctx.beginPath();
            ctx.moveTo(4, -4);
            ctx.lineTo(8, 0);
            ctx.moveTo(8, -4);
            ctx.lineTo(4, 0);
            ctx.stroke();
            
            ctx.restore();
            return;
        }
        
        if (!this.active) return;

        // Normale Darstellung - Monster
        // Körper (runder Blob)
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 16, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // Dunkler Rand um den Körper
        ctx.strokeStyle = '#C0392B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 16, 14, 0, Math.PI * 2);
        ctx.stroke();
        
        // Hörner
        ctx.fillStyle = '#8B2828';
        ctx.beginPath();
        ctx.moveTo(screenX + 6, screenY + 6);
        ctx.lineTo(screenX + 8, screenY);
        ctx.lineTo(screenX + 10, screenY + 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(screenX + 22, screenY + 6);
        ctx.lineTo(screenX + 24, screenY);
        ctx.lineTo(screenX + 26, screenY + 6);
        ctx.fill();
        
        // Augen (große runde Augen)
        ctx.fillStyle = '#FFFFFF';
        const eyeY = screenY + 12;
        if (this.direction > 0) {
            // Blick nach rechts
            ctx.beginPath();
            ctx.arc(screenX + 20, eyeY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(screenX + 28, eyeY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupillen nach rechts
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(screenX + 22, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(screenX + 30, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Blick nach links
            ctx.beginPath();
            ctx.arc(screenX + 4, eyeY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(screenX + 12, eyeY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupillen nach links
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(screenX + 2, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(screenX + 10, eyeY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Mund (böses Grinsen)
        ctx.strokeStyle = '#8B2828';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 18, 6, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Zähne
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(screenX + 12, screenY + 22, 2, 3);
        ctx.fillRect(screenX + 15, screenY + 22, 2, 3);
        ctx.fillRect(screenX + 18, screenY + 22, 2, 3);
        
        // Kleine Füße
        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.ellipse(screenX + 8, screenY + 30, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(screenX + 24, screenY + 30, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/**
 * Gegner Typ 2: Fliegt vertikal hoch und runter
 */
export class FlyingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.startY = y;
        this.speed = 1.2;
        this.direction = 1; // 1 = runter, -1 = hoch
        this.amplitude = 6 * 32; // 6 Tiles
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
        }
    }

    update(level) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        // Bewege vertikal
        this.y += this.speed * this.direction;

        // Prüfe Grenzen
        if (this.y > this.startY + this.amplitude) {
            this.y = this.startY + this.amplitude;
            this.direction = -1;
        } else if (this.y < this.startY - this.amplitude) {
            this.y = this.startY - this.amplitude;
            this.direction = 1;
        }
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        ctx.save();
        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierenden Geist
            ctx.fillStyle = '#9933FF';
            ctx.beginPath();
            ctx.arc(0, -4, 14, Math.PI, 0, false);
            ctx.lineTo(14, 12);
            ctx.lineTo(8, 16);
            ctx.lineTo(2, 12);
            ctx.lineTo(-4, 16);
            ctx.lineTo(-10, 12);
            ctx.lineTo(-14, 16);
            ctx.lineTo(-14, -4);
            ctx.closePath();
            ctx.fill();
            
            // X-Augen
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -2);
            ctx.lineTo(-4, 2);
            ctx.moveTo(-4, -2);
            ctx.lineTo(-8, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(4, -2);
            ctx.lineTo(8, 2);
            ctx.moveTo(8, -2);
            ctx.lineTo(4, 2);
            ctx.stroke();
            
            ctx.restore();
            return;
        }

        // Zeichne fliegenden Gegner als lila Geist
        ctx.fillStyle = '#9933FF';
        
        // Körper (abgerundete Form)
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 12, 14, Math.PI, 0, false);
        ctx.lineTo(screenX + 30, screenY + 28);
        ctx.lineTo(screenX + 24, screenY + 32);
        ctx.lineTo(screenX + 18, screenY + 28);
        ctx.lineTo(screenX + 12, screenY + 32);
        ctx.lineTo(screenX + 6, screenY + 28);
        ctx.lineTo(screenX + 2, screenY + 32);
        ctx.lineTo(screenX + 2, screenY + 12);
        ctx.closePath();
        ctx.fill();

        // Augen
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 14, 4, 0, Math.PI * 2);
        ctx.arc(screenX + 22, screenY + 14, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupillen
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 14, 2, 0, Math.PI * 2);
        ctx.arc(screenX + 22, screenY + 14, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/**
 * Feuerball-Projektil
 */
export class Fireball {
    constructor(x, y, targetX, targetY, speed = 1.5) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.active = true;
        
        // Berechne Richtung zum Ziel
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / distance) * speed;
        this.vy = (dy / distance) * speed;
        
        this.lifetime = 0;
        this.maxLifetime = 180; // 3 Sekunden bei 60fps
    }

    update() {
        if (!this.active) return;

        this.x += this.vx;
        this.y += this.vy;
        this.lifetime++;

        if (this.lifetime > this.maxLifetime) {
            this.active = false;
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

    checkCollision(player) {
        if (!this.active) return false;
        if (this.isDying) return false;
        
        const playerBounds = player.getBounds();
        return (
            this.x < playerBounds.x + playerBounds.width &&
            this.x + this.width > playerBounds.x &&
            this.y < playerBounds.y + playerBounds.height &&
            this.y + this.height > playerBounds.y
        );
    }

    draw(ctx, camera) {
        if (!this.active) return;

        ctx.save();
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Feuerball mit Gradient
        const gradient = ctx.createRadialGradient(
            screenX + 6, screenY + 6, 0,
            screenX + 6, screenY + 6, 6
        );
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.5, '#FF8800');
        gradient.addColorStop(1, '#FF0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX + 6, screenY + 6, 6, 0, Math.PI * 2);
        ctx.fill();

        // Flammen-Effekt
        ctx.strokeStyle = '#FF6600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + 6, screenY + 6, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

/**
 * Gegner Typ 3: Stationär, wirft Feuerbälle
 */
export class ShootingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.shootCooldown = 0;
        this.shootInterval = 240; // Schießt alle 4 Sekunden (bei 60fps)
        this.fireballs = [];
        this.detectionRange = 400; // Pixel
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
            this.fireballs = []; // Entferne alle Feuerbälle
        }
    }

    update(level, player) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        // Update Feuerbälle
        this.fireballs = this.fireballs.filter(fb => fb.active);
        this.fireballs.forEach(fb => fb.update());

        // Prüfe ob Spieler in Reichweite ist
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.detectionRange) {
            this.shootCooldown--;
            
            if (this.shootCooldown <= 0) {
                // Schieße Feuerball
                const fireballX = this.x + this.width / 2;
                const fireballY = this.y + this.height / 2;
                const targetX = player.x + player.width / 2;
                const targetY = player.y + player.height / 2;
                
                this.fireballs.push(new Fireball(fireballX, fireballY, targetX, targetY));
                this.shootCooldown = this.shootInterval;
            }
        }
    }

    checkFireballCollisions(player) {
        let hit = false;
        this.fireballs.forEach(fb => {
            if (fb.checkCollision(player)) {
                fb.active = false;
                hit = true;
            }
        });
        return hit;
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        ctx.save();
        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierenden Turm
            ctx.fillStyle = '#FF8800';
            ctx.beginPath();
            ctx.moveTo(-12, 16);
            ctx.lineTo(12, 16);
            ctx.lineTo(8, 0);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#FF6600';
            ctx.fillRect(-6, -8, 12, 8);
            
            // X-Augen
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-4, 2);
            ctx.lineTo(4, 8);
            ctx.moveTo(4, 2);
            ctx.lineTo(-4, 8);
            ctx.stroke();
            
            ctx.restore();
            return;
        }

        // Zeichne Turm-Gegner in Orange
        ctx.fillStyle = '#FF8800';
        
        // Basis (Trapez)
        ctx.beginPath();
        ctx.moveTo(screenX + 4, screenY + 32);
        ctx.lineTo(screenX + 28, screenY + 32);
        ctx.lineTo(screenX + 24, screenY + 16);
        ctx.lineTo(screenX + 8, screenY + 16);
        ctx.closePath();
        ctx.fill();

        // Kopf/Kanone
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(screenX + 10, screenY + 8, 12, 8);
        
        // Auge
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 20, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupille
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 20, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Zeichne Feuerbälle
        this.fireballs.forEach(fb => fb.draw(ctx, camera));
    }
}

/**
 * Gegner Typ 4: JumpingEnemy - Springt in regelmäßigen Abständen (Grasland)
 */
export class JumpingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.velocityY = 0;
        this.gravity = 0.35;
        this.jumpPower = 10;
        this.jumpTimer = 0;
        this.jumpInterval = 120; // Frames zwischen Sprüngen (2 Sekunden bei 60fps)
        this.isOnGround = true;
        this.direction = 1; // Für horizontale Bewegung beim Springen
        this.speed = 1;
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -8;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
        }
    }

    update(level) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        // Jump Timer
        this.jumpTimer++;
        
        // Springe wenn auf dem Boden und Timer abgelaufen
        if (this.isOnGround && this.jumpTimer >= this.jumpInterval) {
            this.velocityY = -this.jumpPower;
            this.isOnGround = false;
            this.jumpTimer = 0;
        }

        // Gravitation
        if (!this.isOnGround) {
            this.velocityY += this.gravity;
            if (this.velocityY > 12) this.velocityY = 12;
        }

        // Vertikale Bewegung
        this.y += this.velocityY;

        // Horizontale Bewegung beim Springen
        if (!this.isOnGround) {
            this.x += this.speed * this.direction;
        }

        // Levelrand-Kollision prüfen und Richtung wechseln
        const tileSize = 32;
        if (this.x <= 0) {
            this.x = 0;
            this.direction = 1; // Nach rechts
        } else if (this.x + this.width >= level.width * tileSize) {
            this.x = level.width * tileSize - this.width;
            this.direction = -1; // Nach links
        }

        // Boden-Kollision prüfen
        this.checkGroundCollision(level);
    }

    checkGroundCollision(level) {
        const tileSize = 32;
        const col = Math.floor((this.x + this.width / 2) / tileSize);
        const bottomRow = Math.floor((this.y + this.height) / tileSize);

        const tile = level.getTile(col, bottomRow);
        if (tile && tile.solid && this.velocityY > 0) {
            this.y = bottomRow * tileSize - this.height;
            this.velocityY = 0;
            this.isOnGround = true;
        } else if (!tile || !tile.solid) {
            this.isOnGround = false;
        }
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        ctx.save();
        
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierenden Frosch
            ctx.fillStyle = '#7CFC00';
            ctx.beginPath();
            ctx.ellipse(0, 4, 14, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -4, 11, 0, Math.PI * 2);
            ctx.fill();
            
            // X-Augen
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-7, -8);
            ctx.lineTo(-3, -4);
            ctx.moveTo(-3, -8);
            ctx.lineTo(-7, -4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(3, -8);
            ctx.lineTo(7, -4);
            ctx.moveTo(7, -8);
            ctx.lineTo(3, -4);
            ctx.stroke();
            
            ctx.restore();
            return;
        }
        
        // Frosch-Körper (abgerundete Form)
        ctx.fillStyle = '#7CFC00'; // Helleres Grün (Lawn Green)
        
        // Hauptkörper (oval)
        ctx.beginPath();
        ctx.ellipse(screenX + 16, screenY + 20, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Kopf (größerer Kreis oben)
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 12, 11, 0, Math.PI * 2);
        ctx.fill();
        
        // Bauch (heller)
        ctx.fillStyle = '#ADFF2F'; // GreenYellow für Bauch
        ctx.beginPath();
        ctx.ellipse(screenX + 16, screenY + 21, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Augen (große Glubschaugen)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(screenX + 11, screenY + 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 21, screenY + 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupillen
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX + 11, screenY + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 21, screenY + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Lichtreflexe in Augen
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(screenX + 12, screenY + 9, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 22, screenY + 9, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Beine (kleine Ovale unten)
        ctx.fillStyle = '#6ABE30'; // Dunkleres Grün für Beine
        
        // Linkes Bein
        ctx.beginPath();
        ctx.ellipse(screenX + 8, screenY + 28, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Rechtes Bein
        ctx.beginPath();
        ctx.ellipse(screenX + 24, screenY + 28, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Mund (kleines Lächeln)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 15, 3, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        ctx.restore();
    }
}

/**
 * Gegner Typ 5: ChargerEnemy - Stürmt los wenn Spieler in Reichweite (Grasland)
 */
export class ChargerEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.speed = 1;
        this.chargeSpeed = 4.5;
        this.direction = 1;
        this.isCharging = false;
        this.detectionRange = 160; // 5 Tiles
        this.chargeCooldown = 0;
        this.chargeCooldownMax = 180; // 3 Sekunden Pause nach Charge
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
        }
    }

    update(level, player) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        // Cooldown
        if (this.chargeCooldown > 0) {
            this.chargeCooldown--;
            return;
        }

        // Prüfe ob Spieler in Reichweite
        if (player && !this.isCharging) {
            const distance = Math.abs(player.x - this.x);
            const sameHeight = Math.abs(player.y - this.y) < 50;
            
            if (distance < this.detectionRange && sameHeight) {
                this.isCharging = true;
                this.direction = player.x > this.x ? 1 : -1;
            }
        }

        // Bewegung
        const currentSpeed = this.isCharging ? this.chargeSpeed : this.speed;
        const nextX = this.x + currentSpeed * this.direction;

        // Kollision prüfen
        const willCollide = this.checkTileCollision(level, nextX, this.y);
        
        if (willCollide) {
            this.direction *= -1;
            this.isCharging = false;
            this.chargeCooldown = this.chargeCooldownMax;
        } else {
            this.x = nextX;
        }
    }

    checkTileCollision(level, x, y) {
        const tileSize = 32;
        const leftTile = Math.floor(x / tileSize);
        const rightTile = Math.floor((x + this.width - 1) / tileSize);
        const topTile = Math.floor(y / tileSize);
        const bottomTile = Math.floor((y + this.height - 1) / tileSize);

        for (let row = topTile; row <= bottomTile; row++) {
            for (let col = leftTile; col <= rightTile; col++) {
                const tile = level.getTile(col, row);
                if (tile && tile.solid) {
                    return true;
                }
            }
        }
        return false;
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        ctx.save();
        
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierenden Charger
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-16, -16, 32, 32);
            
            // X-Augen
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-2, 2);
            ctx.moveTo(-2, -4);
            ctx.lineTo(-8, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2, -4);
            ctx.lineTo(8, 2);
            ctx.moveTo(8, -4);
            ctx.lineTo(2, 2);
            ctx.stroke();
            
            ctx.restore();
            return;
        }
        
        // Farbe ändert sich beim Charging
        ctx.fillStyle = this.isCharging ? '#FF4500' : '#8B4513';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Hörner/Spitzen vorne
        ctx.fillStyle = '#654321';
        const hornX = this.direction > 0 ? screenX + this.width : screenX - 8;
        ctx.fillRect(hornX, screenY + 8, 8, 4);
        ctx.fillRect(hornX, screenY + 18, 8, 4);
        
        ctx.restore();
    }
}

/**
 * Gegner Typ 6: StalactiteEnemy - Fällt von Decke (Höhlen exklusiv)
 */
export class StalactiteEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 40);
        this.originalY = y;
        this.isFalling = false;
        this.velocityY = 0;
        this.detectionRange = 50; // Pixel unter sich
        this.respawnTimer = 0;
        this.respawnDuration = 300; // 5 Sekunden
        this.visible = true;
    }

    update(level, player) {
        if (!this.visible) {
            // Respawn Timer
            this.respawnTimer++;
            if (this.respawnTimer >= this.respawnDuration) {
                this.y = this.originalY;
                this.velocityY = 0;
                this.isFalling = false;
                this.visible = true;
                this.active = true;
                this.respawnTimer = 0;
            }
            return;
        }

        if (!this.active) return;

        // Prüfe ob Spieler darunter ist
        if (!this.isFalling && player) {
            const playerCenterX = player.x + player.width / 2;
            const stalactiteCenterX = this.x + this.width / 2;
            
            if (Math.abs(playerCenterX - stalactiteCenterX) < this.detectionRange &&
                player.y > this.y) {
                this.isFalling = true;
            }
        }

        // Fallen
        if (this.isFalling) {
            this.velocityY += 0.5;
            if (this.velocityY > 15) this.velocityY = 15;
            this.y += this.velocityY;

            // Boden-Kollision → Respawn
            const tileSize = 32;
            const col = Math.floor((this.x + this.width / 2) / tileSize);
            const bottomRow = Math.floor((this.y + this.height) / tileSize);
            const tile = level.getTile(col, bottomRow);
            
            if (tile && tile.solid) {
                this.visible = false;
                this.active = false;
                this.respawnTimer = 0;
            }
        }
    }

    draw(ctx, camera) {
        if (!this.visible || !this.active) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.fillStyle = '#696969';
        
        // Dreieckige Stalaktiten-Form
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX + this.width, screenY);
        ctx.lineTo(screenX + this.width / 2, screenY + this.height);
        ctx.closePath();
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX + this.width / 3, screenY);
        ctx.lineTo(screenX + this.width / 2, screenY + this.height * 0.7);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Gegner Typ 7: BatEnemy - Fliegt in Sinuskurve (Höhlen exklusiv)
 */
export class BatEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 28, 20);
        this.speed = 2;
        this.direction = 1;
        this.amplitude = 40; // Höhe der Sinuskurve
        this.frequency = 0.05;
        this.time = 0;
        this.baseY = y;
        this.wingFlap = 0;
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
        }
    }

    update(level) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        // Horizontale Bewegung
        this.x += this.speed * this.direction;
        
        // Sinuskurven-Bewegung vertikal
        this.time += this.frequency;
        this.y = this.baseY + Math.sin(this.time) * this.amplitude;

        // Wing flap animation
        this.wingFlap += 0.2;

        // Umdrehen bei Level-Grenzen
        if (this.x < 0 || this.x > level.width * level.tileSize - this.width) {
            this.direction *= -1;
        }
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        ctx.save();
        
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierende Fledermaus
            ctx.fillStyle = '#4B0082';
            ctx.fillRect(-4, -6, 8, 8);
            
            // X-Augen
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-3, -3);
            ctx.lineTo(0, 0);
            ctx.moveTo(0, -3);
            ctx.lineTo(-3, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -3);
            ctx.lineTo(3, 0);
            ctx.moveTo(3, -3);
            ctx.lineTo(0, 0);
            ctx.stroke();
            
            ctx.restore();
            return;
        }
        
        // Körper
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(screenX + 10, screenY + 6, 8, 8);
        
        // Flügel (animiert)
        const wingOffset = Math.sin(this.wingFlap) * 4;
        ctx.fillStyle = '#6A0DAD';
        
        // Linker Flügel
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY + 8);
        ctx.lineTo(screenX, screenY + 4 + wingOffset);
        ctx.lineTo(screenX + 8, screenY + 12);
        ctx.closePath();
        ctx.fill();
        
        // Rechter Flügel
        ctx.beginPath();
        ctx.moveTo(screenX + 18, screenY + 8);
        ctx.lineTo(screenX + 28, screenY + 4 + wingOffset);
        ctx.lineTo(screenX + 20, screenY + 12);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Gegner Typ 8: FireElemental - Hinterlässt Feuer-Spur (Wüste exklusiv)
 */
export class FireElemental extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.speed = 1.5;
        this.direction = 1;
        this.fireTrail = []; // {x, y, timer}
        this.trailSpawnTimer = 0;
        this.trailSpawnInterval = 20; // Alle 20 frames neue Flamme
        this.flickerOffset = Math.random() * Math.PI * 2;
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
            this.fireTrail = []; // Lösche Feuerspur
        }
    }

    update(level) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        // Bewegung
        const nextX = this.x + this.speed * this.direction;
        const willCollide = this.checkTileCollision(level, nextX, this.y);
        
        if (willCollide) {
            this.direction *= -1;
        } else {
            this.x = nextX;
        }

        // Feuer-Spur spawnen
        this.trailSpawnTimer++;
        if (this.trailSpawnTimer >= this.trailSpawnInterval) {
            this.fireTrail.push({
                x: this.x + this.width / 2 - 8,
                y: this.y + this.height - 16,
                timer: 0,
                maxLife: 180 // 3 Sekunden
            });
            this.trailSpawnTimer = 0;
        }

        // Update Feuer-Spur
        this.fireTrail = this.fireTrail.filter(fire => {
            fire.timer++;
            return fire.timer < fire.maxLife;
        });
    }

    checkTileCollision(level, x, y) {
        const tileSize = 32;
        const leftTile = Math.floor(x / tileSize);
        const rightTile = Math.floor((x + this.width - 1) / tileSize);
        const topTile = Math.floor(y / tileSize);
        const bottomTile = Math.floor((y + this.height - 1) / tileSize);

        for (let row = topTile; row <= bottomTile; row++) {
            for (let col = leftTile; col <= rightTile; col++) {
                const tile = level.getTile(col, row);
                if (tile && tile.solid) return true;
            }
        }
        return false;
    }

    checkFireTrailCollision(player) {
        if (!player || !player.isAlive) return false;
        
        const playerBounds = player.getBounds();
        
        for (const fire of this.fireTrail) {
            if (playerBounds.x < fire.x + 16 &&
                playerBounds.x + playerBounds.width > fire.x &&
                playerBounds.y < fire.y + 16 &&
                playerBounds.y + playerBounds.height > fire.y) {
                return true;
            }
        }
        return false;
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        // Zeichne Feuer-Spur (nur wenn nicht sterbend)
        if (!this.isDying) {
            this.fireTrail.forEach(fire => {
                const fireX = fire.x - camera.x;
                const fireY = fire.y - camera.y;
                const alpha = 1 - (fire.timer / fire.maxLife);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                
                // Flackernde Flamme
                const flicker = Math.sin(fire.timer * 0.3) * 2;
                ctx.fillStyle = '#FF4500';
                ctx.fillRect(fireX, fireY + flicker, 16, 16);
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(fireX + 4, fireY + 4 + flicker, 8, 8);
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(fireX + 6, fireY + 6 + flicker, 4, 4);
                
                ctx.restore();
            });
        }

        // Zeichne Elemental
        ctx.save();
        
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierendes Fire Elemental
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(-16, -16, 32, 32);
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(-10, -10, 20, 20);
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(-6, -6, 12, 12);
            
            // X-Augen
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-2, 2);
            ctx.moveTo(-2, -4);
            ctx.lineTo(-8, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2, -4);
            ctx.lineTo(8, 2);
            ctx.moveTo(8, -4);
            ctx.lineTo(2, 2);
            ctx.stroke();
            
            ctx.restore();
            return;
        }
        
        const flicker = Math.sin(Date.now() * 0.01 + this.flickerOffset) * 3;
        
        // Feuer-Körper
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(screenX, screenY + flicker, this.width, this.height);
        
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(screenX + 6, screenY + 6 + flicker, 20, 20);
        
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(screenX + 10, screenY + 10 + flicker, 12, 12);
        
        // Augen
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX + 8, screenY + 10 + flicker, 4, 4);
        ctx.fillRect(screenX + 20, screenY + 10 + flicker, 4, 4);
        
        ctx.restore();
    }
}

/**
 * Gegner Typ 9: SpinningEnemy - Bewegt sich in Spiralen (Wüste)
 */
export class SpinningEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 24, 24);
        this.centerX = x;
        this.centerY = y;
        this.angle = 0;
        this.radius = 40;
        this.radiusSpeed = 0.5;
        this.angleSpeed = 0.05;
        this.radiusDirection = 1;
        this.minRadius = 20;
        this.maxRadius = 80;
        this.rotationAngle = 0;
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
        }
    }

    update(level) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 6; // Schnelleres Drehen
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        // Spiral-Bewegung
        this.angle += this.angleSpeed;
        this.radius += this.radiusSpeed * this.radiusDirection;
        
        // Radius umkehren bei Min/Max
        if (this.radius >= this.maxRadius || this.radius <= this.minRadius) {
            this.radiusDirection *= -1;
        }

        // Position berechnen
        this.x = this.centerX + Math.cos(this.angle) * this.radius;
        this.y = this.centerY + Math.sin(this.angle) * this.radius;
        
        // Rotation für visuellen Effekt
        this.rotationAngle += 0.1;
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        ctx.save();
        ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
        ctx.rotate(this.isDying ? this.deathRotation : this.rotationAngle);
        
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
        }
        
        // Sandsturm-Wirbel
        ctx.fillStyle = '#DEB887';
        for (let i = 0; i < 4; i++) {
            const offset = (i / 4) * Math.PI * 2;
            const px = Math.cos(offset) * 10;
            const py = Math.sin(offset) * 10;
            ctx.fillRect(px - 3, py - 3, 6, 6);
        }
        
        // Zentrum
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(-6, -6, 12, 12);
        
        ctx.restore();
    }
}

/**
 * Gegner Typ 10: SlidingEnemy - Gleitet schnell auf Eis (Eis exklusiv)
 */
export class SlidingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.speed = 1.5;
        this.iceSpeed = 6; // Sehr schnell auf Eis
        this.direction = 1;
        this.isOnIce = false;
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
        }
    }

    update(level) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        // Prüfe ob auf Eis
        this.checkIfOnIce(level);

        // Geschwindigkeit basierend auf Untergrund
        const currentSpeed = this.isOnIce ? this.iceSpeed : this.speed;
        const nextX = this.x + currentSpeed * this.direction;

        // Kollision prüfen
        const willCollide = this.checkTileCollision(level, nextX, this.y);
        
        if (willCollide) {
            this.direction *= -1;
        } else {
            this.x = nextX;
        }
    }

    checkIfOnIce(level) {
        const tileSize = 32;
        const col = Math.floor((this.x + this.width / 2) / tileSize);
        const bottomRow = Math.floor((this.y + this.height) / tileSize);
        
        const tile = level.getTile(col, bottomRow);
        this.isOnIce = tile && tile.slippery;
    }

    checkTileCollision(level, x, y) {
        const tileSize = 32;
        const leftTile = Math.floor(x / tileSize);
        const rightTile = Math.floor((x + this.width - 1) / tileSize);
        const topTile = Math.floor(y / tileSize);
        const bottomTile = Math.floor((y + this.height - 1) / tileSize);

        for (let row = topTile; row <= bottomTile; row++) {
            for (let col = leftTile; col <= rightTile; col++) {
                const tile = level.getTile(col, row);
                if (tile && tile.solid) return true;
            }
        }
        return false;
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        ctx.save();
        
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierenden Eis-Slider
            ctx.fillStyle = '#B0E0E6';
            ctx.fillRect(-16, -16, 32, 32);
            
            // X-Augen
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-2, 2);
            ctx.moveTo(-2, -4);
            ctx.lineTo(-8, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2, -4);
            ctx.lineTo(8, 2);
            ctx.moveTo(8, -4);
            ctx.lineTo(2, 2);
            ctx.stroke();
            
            ctx.restore();
            return;
        }
        
        // Eis-Kristall Farbe
        ctx.fillStyle = this.isOnIce ? '#00FFFF' : '#B0E0E6';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Glitzer-Effekt
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(screenX + 8, screenY + 4, 4, 4);
        ctx.fillRect(screenX + 20, screenY + 12, 4, 4);
        ctx.fillRect(screenX + 12, screenY + 20, 4, 4);
        
        // Bewegungslinien wenn schnell
        if (this.isOnIce) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            const lineX = this.direction > 0 ? screenX - 10 : screenX + this.width + 10;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(lineX - i * 5 * this.direction, screenY + 8 + i * 8);
                ctx.lineTo(lineX - i * 5 * this.direction - 8 * this.direction, screenY + 8 + i * 8);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
}

/**
 * Gegner Typ 11: IcicleEnemy - Schießt verlangsamende Eis-Projektile (Eis)
 */
export class IcicleEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.icicles = [];
        this.shootTimer = 0;
        this.shootInterval = 180; // 3 Sekunden
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
            this.icicles = []; // Entferne alle Projektile
        }
    }

    update(level, player) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        // Shoot Timer
        this.shootTimer++;
        if (this.shootTimer >= this.shootInterval && player) {
            this.shootIcicle(player);
            this.shootTimer = 0;
        }

        // Update Icicles
        this.icicles = this.icicles.filter(icicle => {
            icicle.x += icicle.velocityX;
            icicle.y += icicle.velocityY;
            icicle.lifetime--;
            return icicle.lifetime > 0 && icicle.active;
        });
    }

    shootIcicle(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const speed = 2;
        this.icicles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            velocityX: (dx / distance) * speed,
            velocityY: (dy / distance) * speed,
            lifetime: 180,
            active: true
        });
    }

    checkIcicleCollision(player) {
        if (!player || !player.isAlive) return null;
        
        const playerBounds = player.getBounds();
        
        for (const icicle of this.icicles) {
            if (icicle.active &&
                playerBounds.x < icicle.x + 8 &&
                playerBounds.x + playerBounds.width > icicle.x &&
                playerBounds.y < icicle.y + 12 &&
                playerBounds.y + playerBounds.height > icicle.y) {
                icicle.active = false;
                return 'slow'; // Signal für Verlangsamung
            }
        }
        return null;
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        // Zeichne Enemy
        ctx.save();
        
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierenden Icicle Enemy
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(-16, -16, 32, 32);
            
            // X-Augen
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-2, 2);
            ctx.moveTo(-2, -4);
            ctx.lineTo(-8, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2, -4);
            ctx.lineTo(8, 2);
            ctx.moveTo(8, -4);
            ctx.lineTo(2, 2);
            ctx.stroke();
            
            ctx.restore();
            return;
        }
        
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Eiszapfen-Muster
        ctx.fillStyle = '#B0E0E6';
        for (let i = 0; i < 3; i++) {
            const px = screenX + 6 + i * 10;
            ctx.beginPath();
            ctx.moveTo(px, screenY + 8);
            ctx.lineTo(px + 4, screenY + 8);
            ctx.lineTo(px + 2, screenY + 16);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();

        // Zeichne Icicles (nur wenn nicht sterbend)
        if (!this.isDying) {
            this.icicles.forEach(icicle => {
                if (!icicle.active) return;
                
                const iceX = icicle.x - camera.x;
                const iceY = icicle.y - camera.y;
                
                ctx.save();
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.moveTo(iceX, iceY);
                ctx.lineTo(iceX + 4, iceY + 6);
                ctx.lineTo(iceX, iceY + 12);
                ctx.lineTo(iceX - 4, iceY + 6);
                ctx.closePath();
                ctx.fill();
                
                // Glitzer
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(iceX - 1, iceY + 4, 2, 2);
                ctx.restore();
            });
        }
    }
}

/**
 * Gegner Typ 12: CloudEnemy - Teleportiert zwischen Wolken (Himmel exklusiv)
 */
export class CloudEnemy extends Enemy {
    constructor(x, y, cloudPlatforms = []) {
        super(x, y, 32, 32);
        this.cloudPlatforms = cloudPlatforms; // Array von {x, y} Positionen
        this.currentCloudIndex = 0;
        this.teleportTimer = 0;
        this.teleportInterval = 180; // 3 Sekunden
        this.isTeleporting = false;
        this.teleportProgress = 0;
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
        }
    }

    update(level) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active || this.cloudPlatforms.length === 0) return;

        this.teleportTimer++;
        
        if (this.teleportTimer >= this.teleportInterval) {
            this.isTeleporting = true;
            this.teleportProgress = 0;
        }

        if (this.isTeleporting) {
            this.teleportProgress += 0.05;
            
            if (this.teleportProgress >= 1) {
                // Teleport abgeschlossen
                this.currentCloudIndex = (this.currentCloudIndex + 1) % this.cloudPlatforms.length;
                const targetCloud = this.cloudPlatforms[this.currentCloudIndex];
                this.x = targetCloud.x;
                this.y = targetCloud.y - this.height - 2;
                
                this.isTeleporting = false;
                this.teleportTimer = 0;
                this.teleportProgress = 0;
            }
        }
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        ctx.save();
        
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierende Wolke
            ctx.fillStyle = '#F0F8FF';
            ctx.beginPath();
            ctx.arc(-6, 0, 10, 0, Math.PI * 2);
            ctx.arc(6, 0, 10, 0, Math.PI * 2);
            ctx.arc(0, -8, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // X-Augen
            ctx.strokeStyle = '#4169E1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-2, 2);
            ctx.moveTo(-2, -4);
            ctx.lineTo(-8, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2, -4);
            ctx.lineTo(8, 2);
            ctx.moveTo(8, -4);
            ctx.lineTo(2, 2);
            ctx.stroke();
            
            ctx.restore();
            return;
        }
        
        if (this.isTeleporting) {
            // Fade-Effekt beim Teleportieren
            const fadeAlpha = this.teleportProgress < 0.5 
                ? 1 - (this.teleportProgress * 2)
                : (this.teleportProgress - 0.5) * 2;
            ctx.globalAlpha = fadeAlpha;
        }
        
        // Wolken-Geist
        ctx.fillStyle = '#F0F8FF';
        
        // Wolkenform (drei Kreise)
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 16, 10, 0, Math.PI * 2);
        ctx.arc(screenX + 22, screenY + 16, 10, 0, Math.PI * 2);
        ctx.arc(screenX + 16, screenY + 8, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Augen
        if (!this.isTeleporting || this.teleportProgress < 0.3 || this.teleportProgress > 0.7) {
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(screenX + 10, screenY + 10, 4, 4);
            ctx.fillRect(screenX + 18, screenY + 10, 4, 4);
        }
        
        ctx.restore();
    }
}

/**
 * Gegner Typ 13: LightningEnemy - Schießt Blitze nach unten (Himmel)
 */
export class LightningEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.lightningTimer = 0;
        this.lightningInterval = 240; // 4 Sekunden
        this.isCharging = false;
        this.chargeTimer = 0;
        this.chargeDuration = 60; // 1 Sekunde Warnung
        this.lightningActive = false;
        this.lightningDuration = 15; // 0.25 Sekunden Blitz
        this.lightningTimer2 = 0;
        this.lightningX = 0;
        
        // Death Animation
        this.isDying = false;
        this.deathTimer = 0;
        this.deathDuration = 500;
        this.deathRotation = 0;
        this.deathOpacity = 1;
        this.deathVelocityY = -5;
        this.deathY = y;
    }

    die() {
        if (!this.isDying) {
            this.isDying = true;
            this.deathTimer = 0;
            this.deathY = this.y;
            // Blitz-Effekte stoppen
            this.isCharging = false;
            this.lightningActive = false;
        }
    }

    update(level) {
        if (this.isDying) {
            this.deathTimer += 16;
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            this.deathRotation = progress * Math.PI * 4;
            this.deathOpacity = 1 - progress;
            this.deathVelocityY += 0.3;
            this.deathY += this.deathVelocityY;
            if (progress >= 1) {
                this.active = false;
            }
            return;
        }
        if (!this.active) return;

        this.lightningTimer++;

        if (!this.isCharging && !this.lightningActive && this.lightningTimer >= this.lightningInterval) {
            this.isCharging = true;
            this.chargeTimer = 0;
            this.lightningX = this.x + this.width / 2;
        }

        if (this.isCharging) {
            this.chargeTimer++;
            if (this.chargeTimer >= this.chargeDuration) {
                this.isCharging = false;
                this.lightningActive = true;
                this.lightningTimer2 = 0;
            }
        }

        if (this.lightningActive) {
            this.lightningTimer2++;
            if (this.lightningTimer2 >= this.lightningDuration) {
                this.lightningActive = false;
                this.lightningTimer = 0;
            }
        }
    }

    checkLightningCollision(player, level) {
        if (!this.lightningActive || !player || !player.isAlive) return false;

        const playerCenterX = player.x + player.width / 2;
        const lightningWidth = 4;
        
        // Prüfe ob Spieler in Blitz-Linie ist
        if (Math.abs(playerCenterX - this.lightningX) < lightningWidth + player.width / 2 &&
            player.y > this.y) {
            return true;
        }
        return false;
    }

    draw(ctx, camera) {
        if (!this.active && !this.isDying) return;

        const screenX = this.x - camera.x;
        const screenY = (this.isDying ? this.deathY : this.y) - camera.y;

        // Zeichne Enemy
        ctx.save();
        
        if (this.isDying) {
            ctx.globalAlpha = this.deathOpacity;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.deathRotation);
            
            // Zeichne rotierenden Lightning Enemy
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(-16, -16, 32, 32);
            
            // X-Augen
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-2, 2);
            ctx.moveTo(-2, -4);
            ctx.lineTo(-8, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2, -4);
            ctx.lineTo(8, 2);
            ctx.moveTo(8, -4);
            ctx.lineTo(2, 2);
            ctx.stroke();
            
            ctx.restore();
            return;
        }
        
        ctx.fillStyle = this.isCharging ? '#FFD700' : '#4169E1';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Blitz-Symbol
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo(screenX + 16, screenY + 8);
        ctx.lineTo(screenX + 20, screenY + 16);
        ctx.lineTo(screenX + 16, screenY + 16);
        ctx.lineTo(screenX + 18, screenY + 24);
        ctx.lineTo(screenX + 14, screenY + 16);
        ctx.lineTo(screenX + 18, screenY + 16);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();

        // Zeichne Lade-Warnung
        if (this.isCharging) {
            const warningX = this.lightningX - camera.x;
            const progress = this.chargeTimer / this.chargeDuration;
            
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 0, ${progress})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(warningX, screenY + this.height);
            ctx.lineTo(warningX, 600); // Bis zum Boden
            ctx.stroke();
            ctx.restore();
        }

        // Zeichne Blitz
        if (this.lightningActive) {
            const lightningX = this.lightningX - camera.x;
            
            ctx.save();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10;
            
            // Zickzack-Blitz
            ctx.beginPath();
            ctx.moveTo(lightningX, screenY + this.height);
            let currentY = screenY + this.height;
            let currentX = lightningX;
            
            while (currentY < 600) {
                currentX += (Math.random() - 0.5) * 20;
                currentY += 30;
                ctx.lineTo(currentX, currentY);
            }
            ctx.stroke();
            
            ctx.restore();
        }
    }
}
