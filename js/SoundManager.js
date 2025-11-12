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
        
        // Volume
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        
        // Initialisierung verzögern bis User-Interaktion
        this.initialized = false;
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
     * Spielt eine fröhliche 8-bit Melodie in Endlosschleife
     */
    playMusicLoop() {
        if (!this.isMusicPlaying || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        
        // Melodie (C-Dur Tonleiter mit Variation)
        // Frequenzen: C4, E4, G4, C5, E5, G5, C5, A4, F4, E4, D4, C4
        const melody = [
            { freq: 261.63, duration: 0.3 }, // C4
            { freq: 329.63, duration: 0.3 }, // E4
            { freq: 392.00, duration: 0.3 }, // G4
            { freq: 523.25, duration: 0.4 }, // C5
            { freq: 659.25, duration: 0.3 }, // E5
            { freq: 392.00, duration: 0.3 }, // G4
            { freq: 523.25, duration: 0.3 }, // C5
            { freq: 440.00, duration: 0.3 }, // A4
            { freq: 349.23, duration: 0.3 }, // F4
            { freq: 329.63, duration: 0.3 }, // E4
            { freq: 293.66, duration: 0.3 }, // D4
            { freq: 261.63, duration: 0.6 }, // C4 (länger)
        ];

        let time = now;
        
        melody.forEach(note => {
            this.playNote(note.freq, time, note.duration, this.musicVolume);
            time += note.duration;
        });

        // Loop: Plane nächsten Durchgang
        const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
        setTimeout(() => this.playMusicLoop(), totalDuration * 1000);
    }

    /**
     * Stoppt Hintergrundmusik
     */
    stopBackgroundMusic() {
        this.isMusicPlaying = false;
    }

    /**
     * Spielt einen einzelnen Ton
     */
    playNote(frequency, startTime, duration, volume = 0.5) {
        if (!this.audioContext) return;

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
    }

    /**
     * Sprung-Sound (Whoosh nach oben)
     */
    playJumpSound() {
        if (!this.initialized) this.init();
        if (!this.audioContext) return;

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
        if (!this.audioContext) return;

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
        if (!this.audioContext) return;

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
        if (!this.audioContext) return;

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
        if (!this.masterGain) return;
        
        if (this.masterGain.gain.value > 0) {
            this.masterGain.gain.value = 0;
        } else {
            this.masterGain.gain.value = 1;
        }
    }
}
