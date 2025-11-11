/**
 * World System - Verwaltet Welten und deren Level
 * Konfigurierbare Anzahl von Leveln pro Welt
 */
export class WorldManager {
    constructor(levelsPerWorld = 5) {
        this.levelsPerWorld = levelsPerWorld;
        this.worlds = [];
        this.currentWorldIndex = 0;
        this.currentLevelIndex = 0;
        this.completedLevels = new Set(); // Format: "world-level"
    }

    addWorld(name, levels) {
        if (levels.length !== this.levelsPerWorld) {
            console.warn(`Welt "${name}" hat ${levels.length} Level, erwartet wurden ${this.levelsPerWorld}`);
        }
        this.worlds.push({
            name: name,
            levels: levels
        });
    }

    getCurrentWorld() {
        return this.worlds[this.currentWorldIndex];
    }

    getCurrentLevel() {
        const world = this.getCurrentWorld();
        return world ? world.levels[this.currentLevelIndex] : null;
    }

    getCurrentLevelData() {
        return {
            worldIndex: this.currentWorldIndex,
            levelIndex: this.currentLevelIndex,
            worldName: this.getCurrentWorld()?.name || '',
            levelNumber: this.currentLevelIndex + 1
        };
    }

    setLevel(worldIndex, levelIndex) {
        if (worldIndex >= 0 && worldIndex < this.worlds.length) {
            const world = this.worlds[worldIndex];
            if (levelIndex >= 0 && levelIndex < world.levels.length) {
                this.currentWorldIndex = worldIndex;
                this.currentLevelIndex = levelIndex;
                return true;
            }
        }
        return false;
    }

    completeCurrentLevel() {
        const key = `${this.currentWorldIndex}-${this.currentLevelIndex}`;
        this.completedLevels.add(key);
    }

    isLevelCompleted(worldIndex, levelIndex) {
        const key = `${worldIndex}-${levelIndex}`;
        return this.completedLevels.has(key);
    }

    isLevelUnlocked(worldIndex, levelIndex) {
        // Erstes Level ist immer freigeschaltet
        if (worldIndex === 0 && levelIndex === 0) return true;
        
        // Level ist freigeschaltet, wenn das vorherige Level abgeschlossen wurde
        if (levelIndex > 0) {
            return this.isLevelCompleted(worldIndex, levelIndex - 1);
        } else {
            // Erstes Level einer Welt ist freigeschaltet, wenn letztes Level der vorherigen Welt abgeschlossen wurde
            if (worldIndex > 0) {
                return this.isLevelCompleted(worldIndex - 1, this.levelsPerWorld - 1);
            }
        }
        return false;
    }

    nextLevel() {
        this.currentLevelIndex++;
        if (this.currentLevelIndex >= this.levelsPerWorld) {
            this.currentLevelIndex = 0;
            this.currentWorldIndex++;
            if (this.currentWorldIndex >= this.worlds.length) {
                // Spiel durchgespielt
                this.currentWorldIndex = this.worlds.length - 1;
                this.currentLevelIndex = this.levelsPerWorld - 1;
                return false;
            }
        }
        return true;
    }

    getTotalWorlds() {
        return this.worlds.length;
    }

    getWorld(index) {
        return this.worlds[index];
    }
    
    unlockAllLevels() {
        // Schalte alle Level in allen Welten frei
        for (let worldIndex = 0; worldIndex < this.worlds.length; worldIndex++) {
            const world = this.worlds[worldIndex];
            for (let levelIndex = 0; levelIndex < world.levels.length; levelIndex++) {
                const key = `${worldIndex}-${levelIndex}`;
                this.completedLevels.add(key);
            }
        }
    }
    
    resetProgress() {
        // Setze Fortschritt zurück - kein Level abgeschlossen, nur erstes Level freigeschaltet
        this.completedLevels = new Set();
        this.currentWorldIndex = 0;
        this.currentLevelIndex = 0;
    }
}
