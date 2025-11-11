import { Logger } from './Logger.js';

/**
 * Input Handler - Verwaltet Tastatureingaben
 */
export class InputHandler {
    constructor() {
        this.logger = new Logger('InputHandler');
        this.keys = {};
        this.cheatCodeSequence = [];
        this.cheatCodeTarget = ['u', 'n', 'l', 'o', 'c', 'k']; // "unlock"
        this.cheatCodeCallback = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            // Bei Command/Meta-Taste: Setze alle Bewegungstasten zurück
            if (e.metaKey || e.key === 'Meta') {
                this.resetMovementKeys();
            }
            
            this.keys[e.key] = true;
            
            // Logging
            this.logger.log('Key pressed:', e.key);
            
            // Cheatcode Erkennung
            this.cheatCodeSequence.push(e.key.toLowerCase());
            if (this.cheatCodeSequence.length > this.cheatCodeTarget.length) {
                this.cheatCodeSequence.shift();
            }
            
            this.logger.log('Cheatcode sequence:', this.cheatCodeSequence.join(''));
            
            // Prüfe ob Cheatcode eingegeben wurde
            if (this.cheatCodeSequence.join('') === this.cheatCodeTarget.join('')) {
                this.logger.log('🎮 CHEATCODE ACTIVATED!');
                if (this.cheatCodeCallback) {
                    this.cheatCodeCallback();
                }
                this.cheatCodeSequence = [];
            }
            
            // Verhindere Scrollen mit Pfeiltasten
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            
            // Bei Command/Meta-Taste: Setze alle Bewegungstasten zurück
            if (e.key === 'Meta') {
                this.resetMovementKeys();
            }
        });
        
        // Setze alle Tasten zurück wenn Fenster den Fokus verliert
        window.addEventListener('blur', () => {
            this.resetAllKeys();
        });
        
        // Setze alle Tasten zurück wenn Tab gewechselt wird
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.resetAllKeys();
            }
        });
    }
    
    resetMovementKeys() {
        // Setze alle Bewegungstasten zurück
        this.keys['ArrowLeft'] = false;
        this.keys['ArrowRight'] = false;
        this.keys['ArrowUp'] = false;
        this.keys['ArrowDown'] = false;
        this.keys['a'] = false;
        this.keys['d'] = false;
        this.keys['w'] = false;
        this.keys[' '] = false;
    }
    
    resetAllKeys() {
        // Setze alle Tasten zurück
        this.keys = {};
    }
    
    setCheatCodeCallback(callback) {
        this.cheatCodeCallback = callback;
    }

    isPressed(key) {
        return this.keys[key] || false;
    }

    isJumpPressed() {
        return this.isPressed('ArrowUp') || this.isPressed(' ') || this.isPressed('w');
    }

    isLeftPressed() {
        return this.isPressed('ArrowLeft') || this.isPressed('a');
    }

    isRightPressed() {
        return this.isPressed('ArrowRight') || this.isPressed('d');
    }
}
