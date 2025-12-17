import { Logger } from './Logger.js';

/**
 * Input Handler - Verwaltet Tastatur- und Touch-Eingaben
 */
export class InputHandler {
    constructor() {
        this.logger = new Logger('InputHandler');
        this.keys = {};
        this.touchControls = {
            left: false,
            right: false,
            jump: false,
            crouch: false,
            throw: false
        };
        this.cheatCodeSequence = [];
        this.cheatCodeTarget = ['u', 'n', 'l', 'o', 'c', 'k']; // "unlock"
        this.cheatCodeCallback = null;
        this.isTouchDevice = this.detectTouchDevice();
        this.setupEventListeners();
        this.setupTouchControls();
    }
    
    detectTouchDevice() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0);
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
    
    setupTouchControls() {
        const touchButtons = {
            'touch-left': 'left',
            'touch-right': 'right',
            'touch-jump': 'jump',
            'touch-crouch': 'crouch',
            'touch-throw': 'throw'
        };
        
        Object.entries(touchButtons).forEach(([id, control]) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            
            // Touch Start
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls[control] = true;
                btn.classList.add('active');
            }, { passive: false });
            
            // Touch End
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls[control] = false;
                btn.classList.remove('active');
            }, { passive: false });
            
            // Touch Cancel (wenn Finger aus dem Button rutscht)
            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.touchControls[control] = false;
                btn.classList.remove('active');
            }, { passive: false });
            
            // Touch Leave (wenn Finger den Button verlässt)
            btn.addEventListener('touchleave', (e) => {
                e.preventDefault();
                this.touchControls[control] = false;
                btn.classList.remove('active');
            }, { passive: false });
            
            // Mouse Events für Desktop-Testing
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.touchControls[control] = true;
                btn.classList.add('active');
            });
            
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.touchControls[control] = false;
                btn.classList.remove('active');
            });
            
            btn.addEventListener('mouseleave', (e) => {
                this.touchControls[control] = false;
                btn.classList.remove('active');
            });
        });
        
        // Verhindere Zoom und Scroll auf Touch-Geräten im Spielbereich
        document.getElementById('game-container')?.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    showTouchControls() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls && this.isTouchDevice) {
            touchControls.classList.remove('hidden');
        }
    }
    
    hideTouchControls() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.classList.add('hidden');
        }
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
        
        // Touch Controls zurücksetzen
        Object.keys(this.touchControls).forEach(key => {
            this.touchControls[key] = false;
        });
    }
    
    resetAllKeys() {
        // Setze alle Tasten zurück
        this.keys = {};
        
        // Touch Controls zurücksetzen
        Object.keys(this.touchControls).forEach(key => {
            this.touchControls[key] = false;
        });
        
        // Entferne active-Klassen von allen Touch-Buttons
        document.querySelectorAll('.touch-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    setCheatCodeCallback(callback) {
        this.cheatCodeCallback = callback;
    }

    isPressed(key) {
        return this.keys[key] || false;
    }

    isJumpPressed() {
        return this.isPressed('ArrowUp') || this.isPressed(' ') || this.isPressed('w') || this.touchControls.jump;
    }

    isLeftPressed() {
        return this.isPressed('ArrowLeft') || this.isPressed('a') || this.touchControls.left;
    }

    isRightPressed() {
        return this.isPressed('ArrowRight') || this.isPressed('d') || this.touchControls.right;
    }
    
    isCrouchPressed() {
        return this.isPressed('ArrowDown') || this.isPressed('s') || this.touchControls.crouch;
    }
    
    isThrowPressed() {
        return this.isPressed('e') || this.isPressed('f') || this.touchControls.throw;
    }
}
