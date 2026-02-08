// ==================== Audio Manager ====================
// Handles all game audio including background music and sound effects

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.bgMusicGain = null;
        this.sfxGain = null;
        this.bgMusicNodes = [];
        this.isMusicPlaying = false;
        this.isMuted = false;
    }

    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create gain nodes for volume control
            this.bgMusicGain = this.audioContext.createGain();
            this.bgMusicGain.gain.value = 0.3; // Background music at 30% volume
            this.bgMusicGain.connect(this.audioContext.destination);

            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.5; // Sound effects at 50% volume
            this.sfxGain.connect(this.audioContext.destination);
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }

    // Play a note with frequency and duration
    playNote(frequency, duration, gainNode, type = 'square') {
        if (!this.audioContext || this.isMuted) return;

        const oscillator = this.audioContext.createOscillator();
        const noteGain = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        // ADSR envelope for retro sound
        const now = this.audioContext.currentTime;
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(1, now + 0.01); // Attack
        noteGain.gain.linearRampToValueAtTime(0.7, now + 0.05); // Decay
        noteGain.gain.setValueAtTime(0.7, now + duration - 0.1); // Sustain
        noteGain.gain.linearRampToValueAtTime(0, now + duration); // Release

        oscillator.connect(noteGain);
        noteGain.connect(gainNode);

        oscillator.start(now);
        oscillator.stop(now + duration);

        return oscillator;
    }

    // Start retro background music (chip-tune style melody)
    startBackgroundMusic() {
        if (!this.audioContext || this.isMusicPlaying || this.isMuted) return;

        this.isMusicPlaying = true;
        this.playMelodyLoop();
    }

    // Play melody loop
    playMelodyLoop() {
        if (!this.isMusicPlaying || !this.audioContext) return;

        // Retro game melody pattern (inspired by classic arcade games)
        // Using pentatonic scale for a retro feel
        const melody = [
            { freq: 523.25, duration: 0.2 }, // C5
            { freq: 659.25, duration: 0.2 }, // E5
            { freq: 783.99, duration: 0.2 }, // G5
            { freq: 659.25, duration: 0.2 }, // E5
            { freq: 523.25, duration: 0.2 }, // C5
            { freq: 587.33, duration: 0.2 }, // D5
            { freq: 659.25, duration: 0.4 }, // E5
            { freq: 0, duration: 0.2 },      // Rest
        ];

        const bassLine = [
            { freq: 130.81, duration: 0.4 }, // C3
            { freq: 164.81, duration: 0.4 }, // E3
            { freq: 196.00, duration: 0.4 }, // G3
            { freq: 164.81, duration: 0.4 }, // E3
        ];

        let melodyTime = 0;
        let bassTime = 0;

        // Play melody
        melody.forEach((note, index) => {
            if (note.freq > 0) {
                setTimeout(() => {
                    if (this.isMusicPlaying) {
                        this.playNote(note.freq, note.duration, this.bgMusicGain, 'square');
                    }
                }, melodyTime * 1000);
            }
            melodyTime += note.duration;
        });

        // Play bass line
        bassLine.forEach((note, index) => {
            setTimeout(() => {
                if (this.isMusicPlaying) {
                    this.playNote(note.freq, note.duration, this.bgMusicGain, 'sawtooth');
                }
            }, bassTime * 1000);
            bassTime += note.duration;
        });

        // Loop the melody
        const loopDuration = Math.max(melodyTime, bassTime);
        setTimeout(() => {
            if (this.isMusicPlaying) {
                this.playMelodyLoop();
            }
        }, loopDuration * 1000);
    }

    // Stop background music
    stopBackgroundMusic() {
        this.isMusicPlaying = false;
    }

    // Play food eat sound
    playEatSound() {
        if (!this.audioContext || this.isMuted) return;

        // Quick ascending chirp
        const now = this.audioContext.currentTime;
        this.playNote(523.25, 0.1, this.sfxGain, 'square');
        setTimeout(() => {
            this.playNote(783.99, 0.1, this.sfxGain, 'square');
        }, 50);
    }

    // Play game over sound
    playGameOverSound() {
        if (!this.audioContext || this.isMuted) return;

        // Descending "death" sound
        const notes = [
            { freq: 523.25, duration: 0.15 },
            { freq: 466.16, duration: 0.15 },
            { freq: 392.00, duration: 0.15 },
            { freq: 329.63, duration: 0.3 },
        ];

        let time = 0;
        notes.forEach(note => {
            setTimeout(() => {
                this.playNote(note.freq, note.duration, this.sfxGain, 'sawtooth');
            }, time * 1000);
            time += note.duration;
        });

        // Add a noise burst for impact
        setTimeout(() => {
            if (!this.audioContext || this.isMuted) return;

            const bufferSize = this.audioContext.sampleRate * 0.3;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 5));
            }

            const noise = this.audioContext.createBufferSource();
            noise.buffer = buffer;

            const noiseGain = this.audioContext.createGain();
            noiseGain.gain.value = 0.3;

            noise.connect(noiseGain);
            noiseGain.connect(this.sfxGain);

            noise.start();
        }, 100);
    }

    // Toggle mute
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackgroundMusic();
        }
        return this.isMuted;
    }

    // Set music volume
    setMusicVolume(volume) {
        if (this.bgMusicGain) {
            this.bgMusicGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    // Set SFX volume
    setSFXVolume(volume) {
        if (this.sfxGain) {
            this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}

// Create global instance
const audioManager = new AudioManager();
