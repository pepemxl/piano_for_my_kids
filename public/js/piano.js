// Piano renderer + tone playback. Exposes window.Piano.
(function () {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const WHITE_INDEXES = [0, 2, 4, 5, 7, 9, 11];
  const BLACK_OFFSETS = {
    1: 0.7,   // C# sits between C(0) and D(1)
    3: 1.7,   // D#
    6: 3.7,   // F#
    8: 4.7,   // G#
    10: 5.7   // A#
  };

  // Computer-keyboard mapping: maps to MIDI offset from rootMidi.
  // White row: A=C, S=D, D=E, F=F, G=G, H=A, J=B, K=C+12
  // Black row: W=C#, E=D#, T=F#, Y=G#, U=A#
  const KEYBOARD_OFFSETS = {
    'a': 0, 's': 2, 'd': 4, 'f': 5, 'g': 7, 'h': 9, 'j': 11, 'k': 12, 'l': 14, ';': 16,
    'w': 1, 'e': 3, 't': 6, 'y': 8, 'u': 10, 'o': 13, 'p': 15
  };

  function midiToName(midi) {
    return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
  }
  function isBlack(midi) {
    const pc = midi % 12;
    return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Lazy AudioContext, started on first user gesture.
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playNote(midi, durationMs = 600) {
    const ctx = ensureAudio();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = midiToFreq(midi);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.05);
  }

  function playSequence(midis, intervalMs = 450) {
    midis.forEach((m, i) => setTimeout(() => playNote(m, intervalMs * 0.9), i * intervalMs));
  }

  class PianoView {
    constructor(container, options = {}) {
      this.container = typeof container === 'string'
        ? document.querySelector(container)
        : container;
      this.lowestMidi = options.lowestMidi ?? 21;   // A0 default
      this.highestMidi = options.highestMidi ?? 108; // C8 default
      this.onNote = options.onNote || (() => {});
      this.rootMidi = options.rootMidi ?? 60;       // C4 for keyboard mapping
      this.pressed = new Set();
      this.targets = new Set();
      this.keyEls = new Map();
      this._render();
      this._attachInput();
    }

    setRange(lowestMidi, highestMidi) {
      this.lowestMidi = lowestMidi;
      this.highestMidi = highestMidi;
      this._render();
    }

    setRootMidi(midi) { this.rootMidi = midi; }

    _render() {
      this.container.innerHTML = '';
      this.keyEls.clear();
      const board = document.createElement('div');
      board.className = 'keyboard';

      // Count white keys in range to size things.
      const whites = [];
      for (let m = this.lowestMidi; m <= this.highestMidi; m++) {
        if (!isBlack(m)) whites.push(m);
      }
      const whiteCount = whites.length;
      const minWidth = whiteCount * 28; // px per white key
      board.style.width = minWidth + 'px';

      const whiteWidth = 100 / whiteCount; // %
      const blackWidth = whiteWidth * 0.6;

      // Build white keys first
      let whiteIdx = 0;
      for (let m = this.lowestMidi; m <= this.highestMidi; m++) {
        if (isBlack(m)) continue;
        const el = document.createElement('div');
        el.className = 'key white';
        if (m === 60) el.classList.add('middle-c');
        el.style.left = (whiteIdx * whiteWidth) + '%';
        el.style.width = whiteWidth + '%';
        el.dataset.midi = m;
        if (m % 12 === 0) {
          const lab = document.createElement('span');
          lab.className = 'label';
          lab.textContent = midiToName(m);
          el.appendChild(lab);
        }
        board.appendChild(el);
        this.keyEls.set(m, el);
        whiteIdx++;
      }

      // Build black keys positioned relative to neighboring whites
      whiteIdx = 0;
      const whitePosByMidi = new Map();
      for (let m = this.lowestMidi; m <= this.highestMidi; m++) {
        if (!isBlack(m)) {
          whitePosByMidi.set(m, whiteIdx * whiteWidth);
          whiteIdx++;
        }
      }
      for (let m = this.lowestMidi; m <= this.highestMidi; m++) {
        if (!isBlack(m)) continue;
        const prevWhite = m - 1; // black sits between (m-1) and (m+1)
        if (!whitePosByMidi.has(prevWhite)) continue;
        const leftPct = whitePosByMidi.get(prevWhite) + whiteWidth - blackWidth / 2;
        const el = document.createElement('div');
        el.className = 'key black';
        el.style.left = leftPct + '%';
        el.style.width = blackWidth + '%';
        el.dataset.midi = m;
        board.appendChild(el);
        this.keyEls.set(m, el);
      }

      // Restore visual states
      for (const m of this.targets) this._toggleClass(m, 'target', true);
      for (const m of this.pressed) this._toggleClass(m, 'pressed', true);

      this.container.appendChild(board);

      // Click handler
      board.addEventListener('mousedown', (e) => {
        const t = e.target.closest('.key');
        if (!t) return;
        const midi = Number(t.dataset.midi);
        this._press(midi);
      });
      board.addEventListener('mouseup', (e) => {
        const t = e.target.closest('.key');
        if (!t) return;
        this._release(Number(t.dataset.midi));
      });
      board.addEventListener('mouseleave', () => {
        for (const m of [...this.pressed]) this._release(m);
      });
    }

    _attachInput() {
      window.addEventListener('keydown', (e) => {
        if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
        const off = KEYBOARD_OFFSETS[e.key.toLowerCase()];
        if (off == null) return;
        e.preventDefault();
        this._press(this.rootMidi + off);
      });
      window.addEventListener('keyup', (e) => {
        const off = KEYBOARD_OFFSETS[e.key.toLowerCase()];
        if (off == null) return;
        this._release(this.rootMidi + off);
      });
    }

    _press(midi) {
      if (midi < this.lowestMidi || midi > this.highestMidi) return;
      if (this.pressed.has(midi)) return;
      this.pressed.add(midi);
      this._toggleClass(midi, 'pressed', true);
      playNote(midi, 450);
      this.onNote(midi);
    }
    _release(midi) {
      if (!this.pressed.has(midi)) return;
      this.pressed.delete(midi);
      this._toggleClass(midi, 'pressed', false);
    }

    _toggleClass(midi, cls, on) {
      const el = this.keyEls.get(midi);
      if (!el) return;
      el.classList.toggle(cls, on);
    }

    setTargets(midis) {
      for (const m of this.targets) this._toggleClass(m, 'target', false);
      this.targets = new Set(midis);
      for (const m of this.targets) this._toggleClass(m, 'target', true);
    }
    flashCorrect(midi) {
      this._toggleClass(midi, 'correct', true);
      setTimeout(() => this._toggleClass(midi, 'correct', false), 350);
    }
    flashWrong(midi) {
      this._toggleClass(midi, 'wrong', true);
      setTimeout(() => this._toggleClass(midi, 'wrong', false), 350);
    }
    pressFromMidi(midi) { this._press(midi); }
    releaseFromMidi(midi) { this._release(midi); }
  }

  window.Piano = { PianoView, midiToName, midiToFreq, playNote, playSequence };
})();
