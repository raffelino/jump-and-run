import { Logger } from './Logger.js';

/**
 * SaveGameManager - Verwaltet Spielstände mit Verschlüsselung
 */
export class SaveGameManager {
    constructor() {
        this.logger = new Logger('SaveGameManager');
        this.encryptionKey = 'KathisAdventure2025'; // Einfacher Schlüssel für XOR
        this.currentSave = null;
    }

    /**
     * Erstellt einen neuen Spielstand
     */
    createNewGame() {
        this.currentSave = {
            lives: 3,
            coins: 0,
            currentWorld: 0,
            currentLevel: 0,
            completedLevels: ['0-0'], // Nur Level 1-1 freigeschaltet
            timestamp: Date.now()
        };
        this.logger.log('New game created:', this.currentSave);
        return this.currentSave;
    }

    /**
     * Gibt den aktuellen Spielstand zurück
     */
    getCurrentSave() {
        return this.currentSave;
    }

    /**
     * Aktualisiert den Spielstand
     */
    updateSave(lives, coins, completedLevels) {
        if (!this.currentSave) {
            this.logger.warn('No save game loaded, creating new one');
            this.createNewGame();
        }
        
        this.currentSave.lives = lives;
        this.currentSave.coins = coins;
        this.currentSave.completedLevels = Array.from(completedLevels);
        this.currentSave.timestamp = Date.now();
        
        this.logger.log('Save updated:', this.currentSave);
    }

    /**
     * Verschlüsselt einen String mit einfachem XOR
     */
    encrypt(text) {
        const key = this.encryptionKey;
        let encrypted = '';
        
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            encrypted += String.fromCharCode(charCode ^ keyChar);
        }
        
        // Base64 kodieren für sichere Speicherung
        return btoa(encrypted);
    }

    /**
     * Entschlüsselt einen verschlüsselten String
     */
    decrypt(encryptedText) {
        try {
            const key = this.encryptionKey;
            const decoded = atob(encryptedText);
            let decrypted = '';
            
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                decrypted += String.fromCharCode(charCode ^ keyChar);
            }
            
            return decrypted;
        } catch (e) {
            this.logger.error('Decryption failed:', e);
            return null;
        }
    }

    /**
     * Speichert den aktuellen Spielstand als verschlüsselte Datei
     */
    saveToFile() {
        if (!this.currentSave) {
            this.logger.warn('No save game to save');
            return false;
        }

        try {
            // JSON-String erstellen
            const saveData = JSON.stringify(this.currentSave);
            
            // Verschlüsseln
            const encrypted = this.encrypt(saveData);
            
            // Datei erstellen und herunterladen
            const blob = new Blob([encrypted], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kathis_adventure_save_${Date.now()}.sav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.logger.log('Save file downloaded');
            return true;
        } catch (e) {
            this.logger.error('Save failed:', e);
            return false;
        }
    }

    /**
     * Lädt einen Spielstand aus einer Datei
     */
    loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const encrypted = e.target.result;
                    
                    // Entschlüsseln
                    const decrypted = this.decrypt(encrypted);
                    if (!decrypted) {
                        throw new Error('Decryption failed');
                    }
                    
                    // JSON parsen
                    const saveData = JSON.parse(decrypted);
                    
                    // Validieren
                    if (!this.validateSaveData(saveData)) {
                        throw new Error('Invalid save data');
                    }
                    
                    this.currentSave = saveData;
                    this.logger.log('Save loaded:', this.currentSave);
                    resolve(this.currentSave);
                } catch (e) {
                    this.logger.error('Load failed:', e);
                    reject(e);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('File read error'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Validiert Spielstand-Daten
     */
    validateSaveData(data) {
        return (
            data &&
            typeof data.lives === 'number' &&
            typeof data.coins === 'number' &&
            Array.isArray(data.completedLevels) &&
            typeof data.timestamp === 'number'
        );
    }

    /**
     * Prüft ob ein Spielstand existiert
     */
    hasSave() {
        return this.currentSave !== null;
    }

    /**
     * Löscht den aktuellen Spielstand
     */
    clearSave() {
        this.currentSave = null;
        this.logger.log('Save cleared');
    }
}
