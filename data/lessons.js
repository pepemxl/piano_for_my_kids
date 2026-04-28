// Curriculum data. Steps reference notes by MIDI number.
// MIDI reference: C4 (middle C) = 60, C5 = 72, A0 = 21, C8 = 108.
//
// Step shapes:
//   { type: 'play_note',  midi: 60, label: 'C4', prompt: 'Play middle C' }
//   { type: 'play_sequence', midis: [60, 62, 64], prompt: 'Play C, D, E in order' }
//   { type: 'identify_note', midi: 64, prompt: 'Which key is E4?' }
//   { type: 'info', text: 'The treble clef sits on the second line of the staff.' }

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function noteName(midi) {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}
function seq(start, intervals) {
  const out = [start];
  let cur = start;
  for (const i of intervals) { cur += i; out.push(cur); }
  return out;
}

const cMajorScale = seq(60, [2, 2, 1, 2, 2, 2, 1]); // C4 D4 E4 F4 G4 A4 B4 C5
const fiveFingerC = [60, 62, 64, 65, 67];           // C4 D4 E4 F4 G4

const lessons = [
  // ----- Module 1: Note recognition -----
  {
    slug: 'notes-white-keys-c-major',
    module: 'Note recognition',
    title: 'White keys: find C, D, E, F, G',
    description: 'Learn where the white keys live around middle C.',
    difficulty: 1,
    ordering: 1,
    steps: [
      { type: 'info', text: 'Middle C (C4) sits just left of the two black keys near the center of the piano.' },
      { type: 'play_note', midi: 60, label: 'C4', prompt: 'Play middle C (C4).' },
      { type: 'play_note', midi: 62, label: 'D4', prompt: 'Play D, between the two black keys.' },
      { type: 'play_note', midi: 64, label: 'E4', prompt: 'Play E, just right of the two black keys.' },
      { type: 'play_note', midi: 65, label: 'F4', prompt: 'Play F, just left of the three black keys.' },
      { type: 'play_note', midi: 67, label: 'G4', prompt: 'Play G.' }
    ]
  },
  {
    slug: 'notes-white-keys-a-b',
    module: 'Note recognition',
    title: 'White keys: find A and B',
    description: 'Complete the C-major octave with A and B.',
    difficulty: 1,
    ordering: 2,
    steps: [
      { type: 'play_note', midi: 69, label: 'A4', prompt: 'Play A4.' },
      { type: 'play_note', midi: 71, label: 'B4', prompt: 'Play B4.' },
      { type: 'play_note', midi: 72, label: 'C5', prompt: 'Play C5 (one octave above middle C).' },
      { type: 'identify_note', midi: 65, prompt: 'Which key is F4?' },
      { type: 'identify_note', midi: 69, prompt: 'Which key is A4?' }
    ]
  },
  {
    slug: 'notes-black-keys',
    module: 'Note recognition',
    title: 'Black keys: sharps and flats',
    description: 'Meet the black keys: groups of 2 and 3.',
    difficulty: 2,
    ordering: 3,
    steps: [
      { type: 'info', text: 'Black keys come in groups of 2 and 3. Between two white keys, the black key has two names: a sharp (#) and a flat (b).' },
      { type: 'play_note', midi: 61, label: 'C#4 / Db4', prompt: 'Play C# (the black key right of C4).' },
      { type: 'play_note', midi: 63, label: 'D#4 / Eb4', prompt: 'Play D#.' },
      { type: 'play_note', midi: 66, label: 'F#4 / Gb4', prompt: 'Play F#.' },
      { type: 'play_note', midi: 68, label: 'G#4 / Ab4', prompt: 'Play G#.' },
      { type: 'play_note', midi: 70, label: 'A#4 / Bb4', prompt: 'Play A# (also called Bb).' }
    ]
  },

  // ----- Module 2: Simple songs -----
  {
    slug: 'song-twinkle-twinkle',
    module: 'Simple songs',
    title: 'Twinkle, Twinkle, Little Star',
    description: 'Play the melody one note at a time, right hand.',
    difficulty: 2,
    ordering: 10,
    steps: [
      { type: 'info', text: 'Twinkle uses only white keys. Use one finger at a time and follow the highlighted key.' },
      { type: 'play_sequence', midis: [60, 60, 67, 67, 69, 69, 67], prompt: 'Twinkle, twinkle, little star...' },
      { type: 'play_sequence', midis: [65, 65, 64, 64, 62, 62, 60], prompt: '...how I wonder what you are.' },
      { type: 'play_sequence', midis: [67, 67, 65, 65, 64, 64, 62], prompt: 'Up above the world so high...' },
      { type: 'play_sequence', midis: [67, 67, 65, 65, 64, 64, 62], prompt: '...like a diamond in the sky.' },
      { type: 'play_sequence', midis: [60, 60, 67, 67, 69, 69, 67], prompt: 'Twinkle, twinkle, little star...' },
      { type: 'play_sequence', midis: [65, 65, 64, 64, 62, 62, 60], prompt: '...how I wonder what you are.' }
    ]
  },
  {
    slug: 'song-mary-had-a-little-lamb',
    module: 'Simple songs',
    title: 'Mary Had a Little Lamb',
    description: 'Easy first song using only E, D, C, G.',
    difficulty: 1,
    ordering: 11,
    steps: [
      { type: 'play_sequence', midis: [64, 62, 60, 62, 64, 64, 64], prompt: 'Mary had a little lamb...' },
      { type: 'play_sequence', midis: [62, 62, 62, 64, 67, 67],     prompt: '...little lamb, little lamb.' },
      { type: 'play_sequence', midis: [64, 62, 60, 62, 64, 64, 64, 64], prompt: 'Mary had a little lamb,' },
      { type: 'play_sequence', midis: [62, 62, 64, 62, 60],         prompt: 'its fleece was white as snow.' }
    ]
  },
  {
    slug: 'song-ode-to-joy',
    module: 'Simple songs',
    title: 'Ode to Joy (Beethoven)',
    description: 'Famous melody using stepwise motion.',
    difficulty: 2,
    ordering: 12,
    steps: [
      { type: 'play_sequence', midis: [64, 64, 65, 67, 67, 65, 64, 62], prompt: 'First phrase.' },
      { type: 'play_sequence', midis: [60, 60, 62, 64, 64, 62, 62],     prompt: 'Second phrase.' },
      { type: 'play_sequence', midis: [64, 64, 65, 67, 67, 65, 64, 62], prompt: 'Third phrase (repeats).' },
      { type: 'play_sequence', midis: [60, 60, 62, 64, 62, 60, 60],     prompt: 'Final phrase.' }
    ]
  },

  // ----- Module 3: Scales and finger exercises -----
  {
    slug: 'scale-c-major-right-hand',
    module: 'Scales & finger exercises',
    title: 'C major scale, right hand',
    description: 'Play the C major scale up one octave.',
    difficulty: 2,
    ordering: 20,
    steps: [
      { type: 'info', text: 'Right hand fingering: 1-2-3-1-2-3-4-5 (thumb tucks under after E).' },
      { type: 'play_sequence', midis: cMajorScale, prompt: 'Play C major: ' + cMajorScale.map(noteName).join(' ') }
    ]
  },
  {
    slug: 'five-finger-c-position',
    module: 'Scales & finger exercises',
    title: 'Five-finger pattern in C',
    description: 'Play the first five notes of C up and down.',
    difficulty: 1,
    ordering: 21,
    steps: [
      { type: 'play_sequence', midis: fiveFingerC, prompt: 'Up: C D E F G' },
      { type: 'play_sequence', midis: [...fiveFingerC].reverse(), prompt: 'Down: G F E D C' },
      { type: 'play_sequence', midis: [...fiveFingerC, ...[...fiveFingerC].reverse()], prompt: 'Up and down without stopping.' }
    ]
  },
  {
    slug: 'hanon-1-snippet',
    module: 'Scales & finger exercises',
    title: 'Hanon-style finger workout',
    description: 'Strengthen each finger with a repeating pattern.',
    difficulty: 3,
    ordering: 22,
    steps: [
      { type: 'play_sequence', midis: [60, 64, 65, 67, 65, 64, 62, 60], prompt: 'Pattern starting on C.' },
      { type: 'play_sequence', midis: [62, 65, 67, 69, 67, 65, 64, 62], prompt: 'Same pattern starting on D.' },
      { type: 'play_sequence', midis: [64, 67, 69, 71, 69, 67, 65, 64], prompt: 'Same pattern starting on E.' }
    ]
  },

  // ----- Module 4: Reading sheet music -----
  {
    slug: 'reading-treble-clef',
    module: 'Reading sheet music',
    title: 'The treble clef',
    description: 'Lines (E G B D F) and spaces (F A C E) of the treble clef.',
    difficulty: 1,
    ordering: 30,
    steps: [
      { type: 'info', text: 'Lines, bottom to top: E G B D F ("Every Good Boy Does Fine"). Spaces: F A C E ("FACE").' },
      { type: 'identify_note', midi: 64, prompt: 'Bottom line of the treble clef is what note?' },
      { type: 'identify_note', midi: 65, prompt: 'First space of the treble clef is what note?' },
      { type: 'identify_note', midi: 67, prompt: 'Second line is what note?' }
    ]
  },
  {
    slug: 'reading-note-durations',
    module: 'Reading sheet music',
    title: 'Note durations: whole, half, quarter',
    description: 'Counting beats: 4 / 2 / 1.',
    difficulty: 1,
    ordering: 31,
    steps: [
      { type: 'info', text: 'A whole note holds for 4 beats, half = 2, quarter = 1, eighth = 1/2.' },
      { type: 'info', text: 'Listen and count: "1-2-3-4" while holding C4.' },
      { type: 'play_note', midi: 60, label: 'C4', prompt: 'Hold C4 for 4 counts.' },
      { type: 'play_sequence', midis: [60, 60, 60, 60], prompt: 'Four quarter notes on C4.' }
    ]
  },
  {
    slug: 'reading-sight-read-1',
    module: 'Reading sheet music',
    title: 'First sight-reading: stepwise motion',
    description: 'Play short phrases moving by step.',
    difficulty: 2,
    ordering: 32,
    steps: [
      { type: 'play_sequence', midis: [60, 62, 64, 65, 64, 62, 60], prompt: 'Play C D E F E D C.' },
      { type: 'play_sequence', midis: [67, 65, 64, 62, 60],         prompt: 'Play G F E D C.' }
    ]
  }
];

module.exports = { lessons, noteName };
