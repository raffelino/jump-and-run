/**
 * Logger Klasse - Zentrales Logging-System für das gesamte Projekt
 * Jede Klasse kann ihr eigenes Logging ein-/ausschalten
 */
export class Logger {
    constructor(className) {
        this.className = className;
        this.enabled = Logger.config[className] || false;
    }

    log(...args) {
        if (this.enabled) {
            console.log(`[${this.className}]`, ...args);
        }
    }

    warn(...args) {
        if (this.enabled) {
            console.warn(`[${this.className}]`, ...args);
        }
    }

    error(...args) {
        if (this.enabled) {
            console.error(`[${this.className}]`, ...args);
        }
    }

    group(label) {
        if (this.enabled) {
            console.group(`[${this.className}] ${label}`);
        }
    }

    groupEnd() {
        if (this.enabled) {
            console.groupEnd();
        }
    }

    table(data) {
        if (this.enabled) {
            console.log(`[${this.className}]`);
            console.table(data);
        }
    }

    /**
     * Aktiviert Logging für eine bestimmte Klasse
     * @param {string} className - Name der Klasse
     */
    static enable(className) {
        Logger.config[className] = true;
        console.log(`✅ Logging enabled for: ${className}`);
    }

    /**
     * Deaktiviert Logging für eine bestimmte Klasse
     * @param {string} className - Name der Klasse
     */
    static disable(className) {
        Logger.config[className] = false;
        console.log(`❌ Logging disabled for: ${className}`);
    }

    /**
     * Aktiviert Logging für alle Klassen
     */
    static enableAll() {
        Object.keys(Logger.config).forEach(key => {
            Logger.config[key] = true;
        });
        console.log('✅ Logging enabled for ALL classes');
    }

    /**
     * Deaktiviert Logging für alle Klassen
     */
    static disableAll() {
        Object.keys(Logger.config).forEach(key => {
            Logger.config[key] = false;
        });
        console.log('❌ Logging disabled for ALL classes');
    }

    /**
     * Zeigt aktuellen Logging-Status aller Klassen
     */
    static showStatus() {
        console.log('📊 Logging Status:');
        console.table(Logger.config);
    }
}

// Globale Logging-Konfiguration
// true = Logging aktiv, false = Logging inaktiv
Logger.config = {
    'Player': false,
    'Level': false,
    'InputHandler': false,
    'Game': false,
    'WorldManager': false,
    'AssetManager': false,
    'Coin': false,
    'Camera': false,
    'SaveGameManager': false
};

// Mache Logger global verfügbar für einfache Steuerung in der Console
if (typeof window !== 'undefined') {
    window.Logger = Logger;
}
