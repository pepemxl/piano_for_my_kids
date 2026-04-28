// Web MIDI integration. Exposes window.MIDIInput.
(function () {
  const listeners = new Set();
  let access = null;
  let statusEl = null;

  function setStatus(text, cls) {
    if (!statusEl) statusEl = document.getElementById('midi-status');
    if (!statusEl) return;
    statusEl.textContent = 'MIDI: ' + text;
    statusEl.classList.remove('connected', 'unavailable');
    if (cls) statusEl.classList.add(cls);
  }

  function dispatch(midi, velocity, type) {
    for (const fn of listeners) fn({ midi, velocity, type });
  }

  function bindInputs() {
    if (!access) return;
    let count = 0;
    for (const input of access.inputs.values()) {
      count++;
      input.onmidimessage = (e) => {
        const [status, note, velocity] = e.data;
        const cmd = status & 0xf0;
        if (cmd === 0x90 && velocity > 0) dispatch(note, velocity, 'on');
        else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) dispatch(note, velocity, 'off');
      };
    }
    if (count === 0) setStatus('no device — connect your piano via USB', 'unavailable');
    else setStatus(`${count} device(s) connected`, 'connected');
  }

  async function init() {
    if (!navigator.requestMIDIAccess) {
      setStatus('not supported in this browser', 'unavailable');
      return;
    }
    setStatus('requesting access…');
    try {
      access = await navigator.requestMIDIAccess({ sysex: false });
      access.onstatechange = bindInputs;
      bindInputs();
    } catch (err) {
      setStatus('permission denied', 'unavailable');
    }
  }

  window.MIDIInput = {
    init,
    onNote(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
