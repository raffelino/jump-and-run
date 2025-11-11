/**
 * Coin Klasse - Sammelbare Münzen
 */
export class Coin {
    constructor(x, y, assetManager) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.assetManager = assetManager;
        this.collected = false;
        this.animationFrame = 0;
        this.animationSpeed = 0.15;
    }

    update() {
        if (!this.collected) {
            this.animationFrame += this.animationSpeed;
            if (this.animationFrame >= 4) {
                this.animationFrame = 0;
            }
        }
    }

    draw(ctx, camera) {
        if (!this.collected) {
            const frame = Math.floor(this.animationFrame);
            const coinSprites = this.assetManager.getSprite('coin');
            ctx.drawImage(
                coinSprites[frame],
                this.x - camera.x,
                this.y - camera.y,
                this.width,
                this.height
            );
        }
    }

    checkCollision(player) {
        if (this.collected) return false;

        const playerBounds = player.getBounds();
        
        if (this.x < playerBounds.x + playerBounds.width &&
            this.x + this.width > playerBounds.x &&
            this.y < playerBounds.y + playerBounds.height &&
            this.y + this.height > playerBounds.y) {
            this.collected = true;
            return true;
        }
        return false;
    }

    reset() {
        this.collected = false;
        this.animationFrame = 0;
    }
}
