/**
 * Jalebi-Fafda Morning Rush — Audio Engine
 * TMKOC Inspired HTML5 Canvas Web Game
 * 
 * ==============================================================================
 * AUDIO ASSET MAPPINGS (Exact Disk Files in ./mp3/):
 * ==============================================================================
 * 1. BABITA BGM:
 *    File: "./mp3/Babita ji sound effects of Tarak mehta ka ultta chashma background sound effects.mp3"
 *    Mapping: Dreamy romantic comedy flute & harp BGM. Loops smoothly throughout the
 *    6-second "Good Morning Babita Ji!" power-up. Stops immediately when power-up expires,
 *    when game is paused, or on Game Over / 500-Point Finale.
 * 
 * 2. JETHALAL GOAT SOUND:
 *    File: "./mp3/Jethalal Sound Effect TMKOC #tmkoc #jethalal #taarakmehtakaooltahchashmah #taarakmehta #jethababita.mp3"
 *    Mapping: Iconic startled Jethalal scream/goat screech ("Aaaa-eh!"). Plays instantly
 *    on damage collisions: catching Karela Juice (-1 Life) or getting hit by a Chappal (-1 Life).
 * 
 * 3. GOKULDHAM MORNING SOCIETY BGM:
 *    File: "./mp3/Taarak Mehta ka ooltah chashma Bgm- THE LONG TALK Tmkoc bgm background score by Sunil Patni.mp3"
 *    Mapping: Sunil Patni's classic TMKOC comedic society background score ("The Long Talk").
 *    Plays gently at warm 0.30 volume during gameplay to create the authentic Gokuldham
 *    morning ambiance. Ducks/pauses when Babita's BGM takes over, and resumes seamlessly after.
 * ==============================================================================
 * 
 * Mobile Audio Unlock & Web Audio API Fallbacks:
 * - Primes HTML5 Audio elements and unlocks Web Audio AudioContext on first user interaction.
 * - Procedural Web Audio synth sound effects for snack chimes, chai bonus, taxi coin drain,
 *   chappal warning alert, and 500-point win fanfare.
 */

(function (window) {
  'use strict';

  // Helper to safely encode path for static hosting (handling spaces and '#' properly)
  function safePath(filename) {
    return `./mp3/${encodeURIComponent(filename).replace(/%2F/g, '/')}`;
  }

  const AUDIO_FILES = {
    babitaBgm: safePath('Babita ji sound effects of Tarak mehta ka ultta chashma background sound effects.mp3'),
    jethaGoat: safePath('Jethalal Sound Effect TMKOC #tmkoc #jethalal #taarakmehtakaooltahchashmah #taarakmehta #jethababita.mp3'),
    societyBgm: safePath('Taarak Mehta ka ooltah chashma Bgm- THE LONG TALK Tmkoc bgm background score by Sunil Patni.mp3')
  };

  // State
  let isMuted = false;
  let isUnlocked = false;
  let audioCtx = null;
  let masterGain = null;

  // HTML5 Audio Elements
  const audioElements = {
    babitaBgm: null,
    jethaGoat: null,
    societyBgm: null
  };

  /**
   * Initialize Audio Elements and Web Audio Context
   */
  function initAudio() {
    try {
      // Create HTML5 Audio instances
      audioElements.babitaBgm = new Audio(AUDIO_FILES.babitaBgm);
      audioElements.babitaBgm.loop = true;
      audioElements.babitaBgm.volume = 0.70;
      audioElements.babitaBgm.preload = 'auto';

      audioElements.jethaGoat = new Audio(AUDIO_FILES.jethaGoat);
      audioElements.jethaGoat.loop = false;
      audioElements.jethaGoat.volume = 0.90;
      audioElements.jethaGoat.preload = 'auto';

      audioElements.societyBgm = new Audio(AUDIO_FILES.societyBgm);
      audioElements.societyBgm.loop = true;
      audioElements.societyBgm.volume = 0.32;
      audioElements.societyBgm.preload = 'auto';
    } catch (e) {
      console.warn('HTML5 Audio initialization warning:', e);
    }
  }

  /**
   * Unlock Audio on first user interaction (critical for iOS Safari & Android Chrome)
   */
  function unlockAudio() {
    if (isUnlocked) return;

    // 1. Initialize & resume Web Audio API AudioContext
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        if (!audioCtx) {
          audioCtx = new AudioContextClass();
          masterGain = audioCtx.createGain();
          masterGain.gain.setValueAtTime(isMuted ? 0 : 1, audioCtx.currentTime);
          masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }
    } catch (e) {
      console.warn('Web Audio unlock warning:', e);
    }

    // 2. Prime HTML5 Audio elements with silent micro-play/pause
    Object.keys(audioElements).forEach(key => {
      const el = audioElements[key];
      if (el) {
        try {
          const prevVol = el.volume;
          el.volume = 0;
          const promise = el.play();
          if (promise !== undefined) {
            promise.then(() => {
              el.pause();
              el.currentTime = 0;
              el.volume = prevVol;
            }).catch(() => {
              el.volume = prevVol;
            });
          }
        } catch (err) {
          // Ignore priming restrictions
        }
      }
    });

    isUnlocked = true;
  }

  // Pre-load audio elements on script load
  if (typeof window !== 'undefined') {
    initAudio();
  }

  // ==========================================
  // PLAYBACK CONTROLS
  // ==========================================

  /**
   * Play Gokuldham Society Morning BGM (Sunil Patni's "The Long Talk")
   */
  function playSocietyBgm() {
    if (isMuted || !audioElements.societyBgm) return;
    try {
      audioElements.societyBgm.currentTime = 0;
      const promise = audioElements.societyBgm.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
    } catch (e) {}
  }

  /**
   * Pause Gokuldham Society BGM
   */
  function pauseSocietyBgm() {
    if (!audioElements.societyBgm) return;
    try {
      audioElements.societyBgm.pause();
    } catch (e) {}
  }

  /**
   * Play Babita Power-Up BGM (Loops for 6s)
   */
  function startBabitaBgm() {
    // Duck/pause regular background music while Babita music plays
    pauseSocietyBgm();

    if (isMuted || !audioElements.babitaBgm) return;
    try {
      audioElements.babitaBgm.currentTime = 0;
      const promise = audioElements.babitaBgm.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
    } catch (e) {}
  }

  /**
   * Stop Babita Power-Up BGM immediately
   */
  function stopBabitaBgm(resumeSociety = true) {
    if (audioElements.babitaBgm) {
      try {
        audioElements.babitaBgm.pause();
        audioElements.babitaBgm.currentTime = 0;
      } catch (e) {}
    }

    if (resumeSociety && !isMuted) {
      playSocietyBgm();
    }
  }

  /**
   * Play Jethalal Goat Yell sound on damage (Karela / Chappal)
   */
  function playDamageSound() {
    if (isMuted) return;

    if (audioElements.jethaGoat) {
      try {
        audioElements.jethaGoat.currentTime = 0;
        const promise = audioElements.jethaGoat.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // Fallback to Web Audio crunch if file blocked
            playDamageSynthFallback();
          });
        }
      } catch (e) {
        playDamageSynthFallback();
      }
    } else {
      playDamageSynthFallback();
    }
  }

  /**
   * Stop all music and sound (on Game Over, Pause, or Win)
   */
  function stopAllAudio() {
    Object.keys(audioElements).forEach(key => {
      const el = audioElements[key];
      if (el) {
        try {
          el.pause();
          el.currentTime = 0;
        } catch (e) {}
      }
    });
  }

  /**
   * Mute / Unmute Toggle
   */
  function toggleMute() {
    isMuted = !isMuted;

    // Update Web Audio master gain
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(isMuted ? 0 : 1, audioCtx.currentTime);
    }

    // Update HTML5 audio volumes
    Object.keys(audioElements).forEach(key => {
      const el = audioElements[key];
      if (el) {
        el.muted = isMuted;
      }
    });

    return isMuted;
  }

  function setMuted(val) {
    isMuted = !!val;
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(isMuted ? 0 : 1, audioCtx.currentTime);
    }
    Object.keys(audioElements).forEach(key => {
      const el = audioElements[key];
      if (el) {
        el.muted = isMuted;
      }
    });
  }

  function getMuted() {
    return isMuted;
  }

  // ==========================================
  // WEB AUDIO API SYNTH SOUND EFFECTS
  // ==========================================

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(isMuted ? 0 : 1, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /**
   * Crisp ascending snack catch chime (Jalebi +10 / Faluda +15)
   */
  function playCatchChime(isFaluda = false) {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = isFaluda ? [587.33, 739.99, 880.00] : [523.25, 659.25, 783.99]; // D5-F#5-A5 vs C5-E5-G5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.05 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.19);
      });
    } catch (e) {}
  }

  /**
   * Sparkling chai bonus chime (+25 pts Masala Chai)
   */
  function playChaiBonus() {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.30, now + idx * 0.04 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.32);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.33);
      });
    } catch (e) {}
  }

  /**
   * Sundarlal's Taxi Bill Coin Drain / Comical Buzz (-30 pts)
   */
  function playTaxiDrain() {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      // Descending comical slide
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.28);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.29);
    } catch (e) {}
  }

  /**
   * Chappal Incoming Warning Alert Beep (0.6s red ! indicator)
   */
  function playWarningAlert() {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.12].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + delay);

        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    } catch (e) {}
  }

  /**
   * 500-Point Finale Victory Fanfare
   */
  function playWinFanfare() {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Majestic TMKOC celebration chord progression
      const arpeggio = [
        { f: 523.25, t: 0.00 }, // C5
        { f: 659.25, t: 0.10 }, // E5
        { f: 783.99, t: 0.20 }, // G5
        { f: 1046.50, t: 0.32 }, // C6
        { f: 1318.51, t: 0.44 }, // E6
        { f: 1567.98, t: 0.58 }  // G6 chord finish
      ];

      arpeggio.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0, now + note.t);
        gain.gain.linearRampToValueAtTime(0.35, now + note.t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + 0.65);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.t);
        osc.stop(now + note.t + 0.68);
      });
    } catch (e) {}
  }

  /**
   * Fallback damage crunch synth
   */
  function playDamageSynthFallback() {
    if (isMuted) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  // Export audio engine globally
  window.GameAudio = {
    unlockAudio,
    playSocietyBgm,
    pauseSocietyBgm,
    startBabitaBgm,
    stopBabitaBgm,
    playDamageSound,
    stopAllAudio,
    toggleMute,
    setMuted,
    getMuted,
    playCatchChime,
    playChaiBonus,
    playTaxiDrain,
    playWarningAlert,
    playWinFanfare
  };

})(typeof window !== 'undefined' ? window : this);
