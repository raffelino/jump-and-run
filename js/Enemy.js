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
    }

    update(level) {
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
        if (!this.active) return;

        ctx.save();
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Zeichne Gegner als roten Würfel mit Augen
        ctx.fillStyle = '#FF3333';
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Augen
        ctx.fillStyle = '#FFFFFF';
        const eyeY = screenY + 10;
        if (this.direction > 0) {
            // Blick nach rechts
            ctx.fillRect(screenX + 16, eyeY, 6, 6);
            ctx.fillRect(screenX + 24, eyeY, 6, 6);
        } else {
            // Blick nach links
            ctx.fillRect(screenX + 2, eyeY, 6, 6);
            ctx.fillRect(screenX + 10, eyeY, 6, 6);
        }

        // Pupillen
        ctx.fillStyle = '#000000';
        if (this.direction > 0) {
            ctx.fillRect(screenX + 19, eyeY + 2, 3, 3);
            ctx.fillRect(screenX + 27, eyeY + 2, 3, 3);
        } else {
            ctx.fillRect(screenX + 3, eyeY + 2, 3, 3);
            ctx.fillRect(screenX + 11, eyeY + 2, 3, 3);
        }

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
    }

    update(level) {
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
        if (!this.active) return;

        ctx.save();
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

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
    constructor(x, y, targetX, targetY, speed = 3) {
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
        this.shootInterval = 120; // Schießt alle 2 Sekunden
        this.fireballs = [];
        this.detectionRange = 400; // Pixel
    }

    update(level, player) {
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
        if (!this.active) return;

        ctx.save();
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

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
