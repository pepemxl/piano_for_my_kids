(async function () {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) { location.href = '/dashboard.html'; return; }

  const titleEl = document.getElementById('lesson-title');
  const promptEl = document.getElementById('prompt');
  const counterEl = document.getElementById('step-counter');
  const scoreEl = document.getElementById('score');
  const feedbackEl = document.getElementById('feedback');
  const playTargetBtn = document.getElementById('play-target');
  const skipBtn = document.getElementById('skip-step');
  const restartBtn = document.getElementById('restart');
  const logoutBtn = document.getElementById('logout');

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.href = '/login.html';
  });

  async function getJSON(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (res.status === 401) { location.href = '/login.html'; throw new Error('not authed'); }
    if (!res.ok) throw new Error('failed: ' + url);
    return res.json();
  }

  const [me, pianos, lesson] = await Promise.all([
    getJSON('/api/auth/me'),
    getJSON('/api/pianos'),
    getJSON('/api/lessons/' + encodeURIComponent(slug))
  ]);
  const piano = pianos.find((p) => p.id === me.selectedPianoId) || pianos[0];

  titleEl.textContent = lesson.title;

  const view = new window.Piano.PianoView('#piano', {
    lowestMidi: piano.lowestMidi,
    highestMidi: piano.highestMidi,
    rootMidi: 60,
    onNote: handleNotePlayed
  });

  // Bind MIDI input → piano view
  if (window.MIDIInput) {
    window.MIDIInput.onNote(({ midi, type }) => {
      if (type === 'on') view.pressFromMidi(midi);
      else view.releaseFromMidi(midi);
    });
  }

  // ----- Lesson state -----
  let stepIdx = 0;
  let score = 0;
  let attemptedThisStep = false;
  let expectedSequence = [];
  let sequenceIdx = 0;

  function currentStep() { return lesson.steps[stepIdx]; }

  function renderStep() {
    const step = currentStep();
    if (!step) return finishLesson();

    counterEl.textContent = `Step ${stepIdx + 1} / ${lesson.steps.length}`;
    scoreEl.textContent = `Score: ${score}`;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    attemptedThisStep = false;
    sequenceIdx = 0;

    if (step.type === 'info') {
      promptEl.textContent = step.text;
      view.setTargets([]);
      expectedSequence = [];
      // Auto-advance after a short read time? Keep manual via skip button.
      feedbackEl.textContent = 'Press "Skip step" to continue when ready.';
      return;
    }
    if (step.type === 'play_note') {
      promptEl.textContent = step.prompt;
      view.setTargets([step.midi]);
      expectedSequence = [step.midi];
      return;
    }
    if (step.type === 'play_sequence') {
      promptEl.textContent = step.prompt;
      expectedSequence = [...step.midis];
      view.setTargets([expectedSequence[0]]);
      return;
    }
    if (step.type === 'identify_note') {
      promptEl.textContent = step.prompt;
      view.setTargets([]);
      expectedSequence = [step.midi];
      return;
    }
  }

  function handleNotePlayed(midi) {
    const step = currentStep();
    if (!step || expectedSequence.length === 0) return;

    const expected = expectedSequence[sequenceIdx];
    if (midi === expected) {
      view.flashCorrect(midi);
      sequenceIdx++;
      if (sequenceIdx >= expectedSequence.length) {
        // Step complete
        if (!attemptedThisStep) score += 10;
        feedbackEl.textContent = '✓ Nice!';
        feedbackEl.className = 'feedback good';
        view.setTargets([]);
        setTimeout(() => advance(), 500);
      } else {
        view.setTargets([expectedSequence[sequenceIdx]]);
      }
    } else {
      attemptedThisStep = true;
      view.flashWrong(midi);
      feedbackEl.textContent = `Not quite — expected ${window.Piano.midiToName(expected)}.`;
      feedbackEl.className = 'feedback bad';
      sequenceIdx = 0; // restart sequence
      view.setTargets([expectedSequence[0]]);
    }
  }

  function advance() {
    stepIdx++;
    saveProgress();
    renderStep();
  }

  async function saveProgress() {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          completedSteps: stepIdx,
          totalSteps: lesson.steps.length,
          score: Math.min(100, Math.round((score / (lesson.steps.length * 10)) * 100))
        })
      });
    } catch {}
  }

  function finishLesson() {
    promptEl.textContent = '🎉 Lesson complete!';
    counterEl.textContent = `${lesson.steps.length} / ${lesson.steps.length}`;
    feedbackEl.textContent = `Final score: ${score}`;
    feedbackEl.className = 'feedback good';
    view.setTargets([]);
    saveProgress();
  }

  playTargetBtn.addEventListener('click', () => {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'play_note' || step.type === 'identify_note') {
      window.Piano.playNote(step.midi, 700);
    } else if (step.type === 'play_sequence') {
      window.Piano.playSequence(step.midis, 380);
    }
  });

  skipBtn.addEventListener('click', () => advance());

  restartBtn.addEventListener('click', () => {
    stepIdx = 0;
    score = 0;
    renderStep();
  });

  renderStep();
})();
