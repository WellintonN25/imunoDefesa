class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;

        this.isMuted = false;
        this.volumes = {
            master: 0.5,
            music: 0.4,
            sfx: 0.6,
            voice: 0.8
        };

        this.currentMusic = null; // 'MENU', 'GAME', 'BOSS'
        this.musicInterval = null;
        this.bassInterval = null;
        this.musicState = 'STOPPED';

        // Carregar configurações salvas
        this.loadSettings();

        // Narrador
        this.synth = window.speechSynthesis;
    }

    init() {
        if (this.ctx) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Master Bus
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volumes.master;
        this.masterGain.connect(this.ctx.destination);

        // Music Bus
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.volumes.music;
        this.musicGain.connect(this.masterGain);

        // SFX Bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.volumes.sfx;
        this.sfxGain.connect(this.masterGain);

        // Se havia música pendente, tocar agora
        if (this.currentMusic) {
            const musicType = this.currentMusic;
            this.currentMusic = null; // Reset para forçar restart
            this.playMusic(musicType);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    loadSettings() {
        const saved = localStorage.getItem('audioSettings');
        if (saved) {
            this.volumes = JSON.parse(saved);
        }
    }

    saveSettings() {
        localStorage.setItem('audioSettings', JSON.stringify(this.volumes));
        this.updateVolumes();
    }

    updateVolumes() {
        if (!this.ctx) return;
        this.masterGain.gain.value = this.isMuted ? 0 : this.volumes.master;
        this.musicGain.gain.value = this.volumes.music;
        this.sfxGain.gain.value = this.volumes.sfx;
    }

    // ================= MÚSICA PROCEDURAL =================

    playMusic(type) {
        // Se ctx não existe, apenas salva o estado para tocar depois do init()
        if (!this.ctx) {
            this.currentMusic = type;
            return;
        }

        if (this.currentMusic === type && this.musicState === 'PLAYING') return;
        this.stopMusic();
        this.currentMusic = type;
        this.musicState = 'PLAYING';
        this.resume();

        switch (type) {
            case 'MENU':
                this.startMenuMusic();
                break;
            case 'GAME':
                this.startGameMusic();
                break;
            case 'BOSS':
                this.startBossMusic();
                break;
        }
    }

    stopMusic() {
        if (this.musicInterval) clearInterval(this.musicInterval);
        if (this.bassInterval) clearInterval(this.bassInterval);
        this.currentMusic = null;
        this.musicState = 'STOPPED';
    }

    // --- MÚSICA MENU (Ambient) ---
    startMenuMusic() {
        const playNote = () => {
            if (this.musicState !== 'PLAYING') return;

            // Acordes etéreos
            const freqs = [261.63, 329.63, 392.00, 523.25]; // C Major
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freqs[Math.floor(Math.random() * freqs.length)];

            osc.connect(gain);
            gain.connect(this.musicGain);

            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 2);
            gain.gain.linearRampToValueAtTime(0, now + 6);

            osc.start(now);
            osc.stop(now + 6);
        };

        playNote();
        this.musicInterval = setInterval(playNote, 4000);
    }

    // --- MÚSICA JOGO (Electronic) ---
    startGameMusic() {
        let step = 0;
        const baseFreq = 110; // A2

        const playBeat = () => {
            if (this.musicState !== 'PLAYING') return;

            const now = this.ctx.currentTime;

            // Bassline (Square wave)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = (step % 4 === 0) ? baseFreq : baseFreq * 1.5;

            // Filtro passa-baixa para o baixo
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.start(now);
            osc.stop(now + 0.2);

            // Hi-hat (Noise simulado com oscilador de alta freq)
            if (step % 2 !== 0) {
                const hat = this.ctx.createOscillator();
                const hatGain = this.ctx.createGain();
                hat.type = 'sawtooth';
                hat.frequency.value = 8000;
                hat.connect(hatGain);
                hatGain.connect(this.musicGain);
                hatGain.gain.setValueAtTime(0.05, now);
                hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                hat.start(now);
                hat.stop(now + 0.05);
            }

            step++;
        };

        this.musicInterval = setInterval(playBeat, 250); // 240 BPM (rápido!)
    }

    // --- MÚSICA BOSS (Tension) ---
    startBossMusic() {
        // Sirene de fundo
        const playSiren = () => {
            if (this.musicState !== 'PLAYING') return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';

            osc.frequency.setValueAtTime(100, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 1);

            osc.connect(gain);
            gain.connect(this.musicGain);

            gain.gain.value = 0.1;

            osc.start();
            osc.stop(this.ctx.currentTime + 1);
        };

        this.musicInterval = setInterval(playSiren, 1000);
    }

    // ================= EFEITOS (SFX) =================

    playSFX(type) {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        switch (type) {
            case 'SHOOT':
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'HIT':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'KILL':
                // Ruído simulado (vários osciladores)
                for (let i = 0; i < 3; i++) {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.connect(g);
                    g.connect(this.sfxGain);
                    o.type = 'triangle';
                    o.frequency.value = 100 + Math.random() * 200;
                    g.gain.setValueAtTime(0.05, now);
                    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    o.start(now);
                    o.stop(now + 0.15);
                }
                break;

            case 'LEVEL_UP':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(600, now + 0.1);
                osc.frequency.setValueAtTime(800, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
        }
    }

    // ================= NARRADOR =================

    speak(text) {
        if (!this.synth || this.volumes.voice === 0) return;
        // Não falar um monte de coisa ao mesmo tempo
        if (this.synth.speaking) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = this.volumes.voice;
        utterance.rate = 1.2;
        utterance.pitch = 0.8; // Voz mais grave/robótica
        utterance.lang = 'en-US'; // Inglês soa mais "gamey"

        this.synth.speak(utterance);
    }
}
