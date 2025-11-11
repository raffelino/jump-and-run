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
        });
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
