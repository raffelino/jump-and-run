/**
 * Apple Klasse - Projektil das der Spieler werfen kann
 */
export class Apple {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.velocityX = direction * 10; // Geschwindigkeit in Wurfrichtung
        this.velocityY = -4; // Leichter Bogen nach oben
        this.gravity = 0.4;
        this.active = true;
        this.rotation = 0;
        this.rotationSpeed = direction * 0.3; // Rotation in Flugrichtung
    }

    update(level) {
        if (!this.active) return;

        // Bewegung
        this.x += this.velocityX;
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Rotation
        this.rotation += this.rotationSpeed;

        // Kollision mit Tiles
        const tileSize = level.tileSize;
        const col = Math.floor((this.x + this.width / 2) / tileSize);
        const row = Math.floor((this.y + this.height / 2) / tileSize);
        const tile = level.getTile(col, row);
        
        if (tile && tile.solid && !tile.platformOnly) {
            this.active = false;
        }

        // Außerhalb des Levels
        if (this.x < -50 || this.x > level.width * tileSize + 50 ||
            this.y > level.height * tileSize + 50) {
            this.active = false;
        }
    }

    /**
     * Prüfe Kollision mit einem Gegner
     */
    checkEnemyCollision(enemy) {
        if (!this.active || !enemy.active || enemy.isDying) return false;

        const enemyBounds = enemy.getBounds();
        return (
            this.x < enemyBounds.x + enemyBounds.width &&
            this.x + this.width > enemyBounds.x &&
            this.y < enemyBounds.y + enemyBounds.height &&
            this.y + this.height > enemyBounds.y
        );
    }

    draw(ctx, camera) {
        if (!this.active) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        
        // Rotation um Mittelpunkt
        ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
        ctx.rotate(this.rotation);

        // Apfel zeichnen
        const size = this.width / 2;

        // Apfel-Körper (rot)
        ctx.fillStyle = '#FF3333';
        ctx.beginPath();
        ctx.arc(0, 2, size - 2, 0, Math.PI * 2);
        ctx.fill();

        // Glanzpunkt
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-3, -1, 3, 0, Math.PI * 2);
        ctx.fill();

        // Stiel
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-1, -size - 2, 2, 5);

        // Blatt
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(3, -size + 1, 4, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
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
