/**
 * SoundManager - Verwaltet Hintergrundmusik und Sound-Effekte
 * Verwendet Web Audio API für Sound-Generierung
 */
export class SoundManager {
    constructor() {
        // Audio Context
        this.audioContext = null;
        this.masterGain = null;
        
        // Sounds
        this.bgMusic = null;
        this.isMusicPlaying = false;
        this.musicLoopTimer = null; // Timer für Music-Loop
        this.currentWorld = 1; // Aktuelle Welt für Theme-Auswahl
        this.activeOscillators = []; // Array für aktive Oszillatoren
        
        // Volume
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        
        // Mute Status
        this.isMuted = false;
        
        // Initialisierung verzögern bis User-Interaktion
        this.initialized = false;
        
        // Musik-Themes für jede Welt definieren
        this.defineWorldThemes();
    }

    /**
     * Definiert Musik-Themes für alle 5 Welten
     * Notenlängen: 0.125 = 16tel, 0.25 = 8tel, 0.5 = Viertel, 1.0 = Halbe
     */
    defineWorldThemes() {
        // Frequenzen
        const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
        const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, B5 = 987.77;
        const C6 = 1046.50;
        const REST = 0; // Pause
        
        // Welt 1: Grasland - Fröhlich und hüpfend (wie Super Mario)
        this.worldThemes = {
            1: [
                // Teil A - Hauptmelodie
                {f: E5, d: 0.25}, {f: E5, d: 0.375}, {f: E5, d: 0.25}, {f: REST, d: 0.125},
                {f: C5, d: 0.25}, {f: E5, d: 0.5}, {f: G5, d: 0.5}, {f: REST, d: 0.5},
                {f: G4, d: 0.5}, {f: REST, d: 0.5},
                
                // Teil B
                {f: C5, d: 0.375}, {f: REST, d: 0.125}, {f: G4, d: 0.375}, {f: REST, d: 0.125},
                {f: E4, d: 0.375}, {f: REST, d: 0.125}, {f: A4, d: 0.375}, {f: B4, d: 0.25},
                {f: A4, d: 0.25}, {f: A4, d: 0.25}, {f: G4, d: 0.25},
                
                // Teil C - Variation
                {f: E5, d: 0.375}, {f: G5, d: 0.375}, {f: A5, d: 0.5},
                {f: F5, d: 0.25}, {f: G5, d: 0.375}, {f: REST, d: 0.125},
                {f: E5, d: 0.375}, {f: C5, d: 0.25}, {f: D5, d: 0.25}, {f: B4, d: 0.375},
                
                // Wiederholung verkürzt
                {f: C5, d: 0.375}, {f: G4, d: 0.375}, {f: E4, d: 0.375},
                {f: A4, d: 0.375}, {f: B4, d: 0.25}, {f: A4, d: 0.25},
                {f: G4, d: 0.5}, {f: E5, d: 0.5}, {f: C5, d: 0.75}, {f: REST, d: 0.25}
            ],
            
            // Welt 2: Dunkle Höhlen - Mysteriös und tiefer (wie Zelda Dungeon)
            2: [
                // Teil A - Tief und geheimnisvoll
                {f: D4, d: 0.5}, {f: D4, d: 0.5}, {f: D4, d: 0.375}, {f: REST, d: 0.125},
                {f: D4, d: 0.25}, {f: D5, d: 0.25}, {f: C5, d: 0.5}, {f: B4, d: 0.5},
                {f: G4, d: 0.375}, {f: REST, d: 0.125}, {f: F4, d: 0.5}, {f: G4, d: 1.0},
                
                // Teil B - Etwas höher
                {f: D4, d: 0.5}, {f: D4, d: 0.5}, {f: D4, d: 0.375}, {f: REST, d: 0.125},
                {f: D4, d: 0.25}, {f: D5, d: 0.25}, {f: C5, d: 0.5}, {f: B4, d: 0.5},
                {f: G4, d: 0.375}, {f: F4, d: 0.125}, {f: E4, d: 0.5}, {f: D4, d: 1.0},
                
                // Teil C - Mittelteil
                {f: E4, d: 0.5}, {f: F4, d: 0.5}, {f: G4, d: 0.5}, {f: A4, d: 0.5},
                {f: B4, d: 0.375}, {f: A4, d: 0.125}, {f: G4, d: 0.5}, {f: F4, d: 0.5},
                {f: E4, d: 0.75}, {f: REST, d: 0.25}, {f: D4, d: 1.0}
            ],
            
            // Welt 3: Brennende Wüste - Exotisch und schnell (wie Sonic)
            3: [
                // Teil A - Schnelle Melodie
                {f: E5, d: 0.25}, {f: F5, d: 0.25}, {f: G5, d: 0.25}, {f: A5, d: 0.25},
                {f: G5, d: 0.25}, {f: F5, d: 0.25}, {f: E5, d: 0.5}, {f: REST, d: 0.25},
                {f: D5, d: 0.25}, {f: E5, d: 0.25}, {f: F5, d: 0.25}, {f: G5, d: 0.25},
                {f: F5, d: 0.25}, {f: E5, d: 0.25}, {f: D5, d: 0.5}, {f: REST, d: 0.25},
                
                // Teil B
                {f: C5, d: 0.25}, {f: D5, d: 0.25}, {f: E5, d: 0.25}, {f: F5, d: 0.25},
                {f: G5, d: 0.375}, {f: A5, d: 0.125}, {f: G5, d: 0.5}, {f: REST, d: 0.25},
                {f: F5, d: 0.25}, {f: G5, d: 0.25}, {f: A5, d: 0.5}, {f: G5, d: 0.5},
                
                // Teil C - Höhepunkt
                {f: E5, d: 0.25}, {f: E5, d: 0.25}, {f: F5, d: 0.25}, {f: G5, d: 0.25},
                {f: A5, d: 0.5}, {f: REST, d: 0.25}, {f: A5, d: 0.25},
                {f: G5, d: 0.25}, {f: F5, d: 0.25}, {f: E5, d: 0.5}, {f: D5, d: 0.5},
                {f: C5, d: 0.75}, {f: REST, d: 0.25}
            ],
            
            // Welt 4: Eisige Berge - Kristallin und hell (wie DKC Snow Level)
            4: [
                // Teil A - Hohe, klare Töne
                {f: E5, d: 0.375}, {f: REST, d: 0.125}, {f: E5, d: 0.25}, {f: REST, d: 0.25},
                {f: E5, d: 0.375}, {f: G5, d: 0.375}, {f: C6, d: 0.5},
                {f: B5, d: 0.375}, {f: REST, d: 0.125}, {f: A5, d: 0.5},
                {f: G5, d: 0.375}, {f: E5, d: 0.125}, {f: G5, d: 0.5}, {f: REST, d: 0.5},
                
                // Teil B
                {f: D5, d: 0.375}, {f: REST, d: 0.125}, {f: D5, d: 0.25}, {f: REST, d: 0.25},
                {f: D5, d: 0.375}, {f: F5, d: 0.375}, {f: A5, d: 0.5},
                {f: G5, d: 0.375}, {f: REST, d: 0.125}, {f: F5, d: 0.5},
                {f: E5, d: 0.375}, {f: C5, d: 0.125}, {f: E5, d: 0.5}, {f: REST, d: 0.5},
                
                // Teil C - Hoher Mittelteil
                {f: C5, d: 0.25}, {f: E5, d: 0.25}, {f: G5, d: 0.25}, {f: C6, d: 0.5},
                {f: B5, d: 0.25}, {f: A5, d: 0.25}, {f: G5, d: 0.5},
                {f: E5, d: 0.5}, {f: G5, d: 0.5}, {f: C5, d: 0.75}, {f: REST, d: 0.25}
            ],
            
            // Welt 5: Himmelsburg - Episch und majestätisch (wie Zelda Hyrule Castle)
            5: [
                // Teil A - Große Akkorde
                {f: C5, d: 0.5}, {f: E5, d: 0.5}, {f: G5, d: 0.5}, {f: C6, d: 1.0},
                {f: REST, d: 0.25}, {f: B5, d: 0.375}, {f: A5, d: 0.375}, {f: G5, d: 0.5},
                {f: F5, d: 0.5}, {f: E5, d: 0.5}, {f: D5, d: 1.0},
                
                // Teil B
                {f: D5, d: 0.5}, {f: F5, d: 0.5}, {f: A5, d: 0.5}, {f: D5, d: 0.5},
                {f: G5, d: 0.5}, {f: F5, d: 0.5}, {f: E5, d: 0.5}, {f: D5, d: 0.5},
                {f: C5, d: 0.75}, {f: REST, d: 0.25}, {f: E5, d: 0.5}, {f: G5, d: 0.5},
                
                // Teil C - Höhepunkt
                {f: A5, d: 0.375}, {f: G5, d: 0.125}, {f: F5, d: 0.5}, {f: E5, d: 0.5},
                {f: D5, d: 0.5}, {f: C5, d: 0.5}, {f: E5, d: 0.5}, {f: G5, d: 0.5},
                {f: C6, d: 1.0}, {f: REST, d: 0.5}, {f: C5, d: 1.5}
            ]
        };
    }

    /**
     * Setzt die aktuelle Welt für die Musik-Auswahl
     */
    setWorld(worldNumber) {
        this.currentWorld = worldNumber;
        
        // Wenn Musik läuft, stoppe und starte neu mit neuem Theme
        if (this.isMusicPlaying) {
            this.stopBackgroundMusic();
            this.playBackgroundMusic();
        }
    }

    /**
     * Initialisiert Audio Context (muss durch User-Interaktion getriggert werden)
     */
    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.initialized = true;
            console.log('🔊 SoundManager initialized');
        } catch (e) {
            console.error('Failed to initialize audio:', e);
        }
    }

    /**
     * Startet Hintergrundmusik (Loop)
     */
    playBackgroundMusic() {
        if (!this.initialized) this.init();
        if (!this.audioContext || this.isMusicPlaying) return;

        this.isMusicPlaying = true;
        this.playMusicLoop();
    }

    /**
     * Spielt das Musik-Theme der aktuellen Welt
     */
    playMusicLoop() {
        if (!this.isMusicPlaying || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        
        // Hole Theme für aktuelle Welt (default: Welt 1)
        const melody = this.worldThemes[this.currentWorld] || this.worldThemes[1];

        let time = now;
        
        melody.forEach(note => {
            if (this.isMusicPlaying) {
                // Pausen (REST = 0) überspringen
                if (note.f > 0) {
                    this.playNote(note.f, time, note.d, this.musicVolume);
                }
            }
            time += note.d;
        });

        if (this.isMusicPlaying) {
            // Loop: Plane nächsten Durchgang
            const totalDuration = melody.reduce((sum, note) => sum + note.d, 0);
            this.musicLoopTimer = setTimeout(() => this.playMusicLoop(), totalDuration * 1000);
        }
    }

    /**
     * Stoppt Hintergrundmusik
     */
    stopBackgroundMusic() {
        this.isMusicPlaying = false;
        
        // Cancele geplanten Music-Loop Timer
        if (this.musicLoopTimer) {
            clearTimeout(this.musicLoopTimer);
            this.musicLoopTimer = null;
        }
        
        // Stoppe alle aktiven Oszillatoren sofort
        this.stopAllOscillators();
    }

    /**
     * Stoppt alle laufenden Oszillatoren
     */
    stopAllOscillators() {
        const now = this.audioContext ? this.audioContext.currentTime : 0;
        
        this.activeOscillators.forEach(osc => {
            try {
                osc.stop(now);
            } catch (e) {
                // Oszillator wurde bereits gestoppt, ignorieren
            }
        });
        
        this.activeOscillators = [];
    }

    /**
     * Spielt einen einzelnen Ton
     */
    playNote(frequency, startTime, duration, volume = 0.5) {
        if (!this.audioContext || this.isMuted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'square'; // 8-bit Sound
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // Envelope: Attack, Sustain, Release
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01); // Attack
        gainNode.gain.setValueAtTime(volume * 0.7, startTime + duration * 0.8); // Sustain
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Release

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        // Füge Oszillator zur Liste hinzu
        this.activeOscillators.push(oscillator);
        
        // Entferne Oszillator nach Ende automatisch
        oscillator.onended = () => {
            const index = this.activeOscillators.indexOf(oscillator);
            if (index > -1) {
                this.activeOscillators.splice(index, 1);
            }
        };
    }

    /**
     * Sprung-Sound (Whoosh nach oben)
     */
    playJumpSound() {
        if (!this.initialized) this.init();
        if (!this.audioContext || this.isMuted) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sawtooth';
        
        // Frequenz steigt schnell an (Whoosh-Effekt)
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);

        // Lautstärke-Envelope
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }

    /**
     * Münz-Sammel-Sound (helles Pling)
     */
    playCoinSound() {
        if (!this.initialized) this.init();
        if (!this.audioContext || this.isMuted) return;

        const now = this.audioContext.currentTime;
        
        // Zwei Töne nacheinander für "Pling"-Effekt
        this.playNote(987.77, now, 0.08, this.sfxVolume * 0.4); // B5
        this.playNote(1318.51, now + 0.05, 0.12, this.sfxVolume * 0.5); // E6
    }

    /**
     * Tod-Sound (trauriger Abstieg)
     */
    playDeathSound() {
        if (!this.initialized) this.init();
        if (!this.audioContext || this.isMuted) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sawtooth';
        
        // Frequenz fällt ab (trauriger Effekt)
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.5);

        // Lautstärke-Envelope
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.4, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + 0.5);
    }

    /**
     * Level-Complete Sound (Fanfare)
     */
    playLevelCompleteSound() {
        if (!this.initialized) this.init();
        if (!this.audioContext || this.isMuted) return;

        const now = this.audioContext.currentTime;
        
        // Kurze Fanfare: C-E-G-C hoch
        const fanfare = [
            { freq: 523.25, duration: 0.15 }, // C5
            { freq: 659.25, duration: 0.15 }, // E5
            { freq: 783.99, duration: 0.15 }, // G5
            { freq: 1046.50, duration: 0.4 }, // C6 (lang)
        ];

        let time = now;
        fanfare.forEach(note => {
            this.playNote(note.freq, time, note.duration, this.sfxVolume * 0.6);
            time += note.duration * 0.9; // Leichte Überlappung
        });
    }

    /**
     * Setzt Musik-Lautstärke (0.0 - 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Setzt Sound-Effekt-Lautstärke (0.0 - 1.0)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Stummschalten/Entstummen
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            // Stoppe alle aktiven Sounds
            this.stopBackgroundMusic();
        }
        
        return this.isMuted;
    }
    
    /**
     * Gibt aktuellen Mute-Status zurück
     */
    getMuteStatus() {
        return this.isMuted;
    }
}
