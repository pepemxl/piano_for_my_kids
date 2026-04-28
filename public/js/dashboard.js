(async function () {
  const welcomeEl = document.getElementById('welcome');
  const statsEl = document.getElementById('stats');
  const modulesEl = document.getElementById('modules');
  const pianoSelect = document.getElementById('piano-select');
  const pianoDescEl = document.getElementById('piano-desc');
  const logoutBtn = document.getElementById('logout');

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });

  async function getJSON(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (res.status === 401) {
      window.location.href = '/login.html';
      throw new Error('not authenticated');
    }
    if (!res.ok) throw new Error('request failed: ' + url);
    return res.json();
  }

  function renderStats(s) {
    statsEl.innerHTML = '';
    const items = [
      { label: 'Lessons started', value: s.lessonsStarted },
      { label: 'Lessons completed', value: s.lessonsCompleted },
      { label: 'Total in plan', value: s.totalLessons },
      { label: 'Avg score', value: s.averageScore + '%' }
    ];
    for (const it of items) {
      const div = document.createElement('div');
      div.className = 'stat';
      div.innerHTML = `<div class="label">${it.label}</div><div class="value">${it.value}</div>`;
      statsEl.appendChild(div);
    }
  }

  function renderPlan(lessons) {
    modulesEl.innerHTML = '';
    const byModule = new Map();
    for (const l of lessons) {
      if (!byModule.has(l.module)) byModule.set(l.module, []);
      byModule.get(l.module).push(l);
    }
    for (const [moduleName, lessonList] of byModule) {
      const section = document.createElement('section');
      section.className = 'module';
      const h3 = document.createElement('h3');
      h3.textContent = moduleName;
      section.appendChild(h3);
      for (const l of lessonList) {
        const card = document.createElement('a');
        card.className = 'lesson-card';
        card.href = `/lesson.html?slug=${encodeURIComponent(l.slug)}`;
        const pct = l.totalSteps > 0
          ? Math.round((l.completedSteps / l.totalSteps) * 100)
          : 0;
        const completed = l.completedAt ? '<span class="badge">done</span>' : '';
        card.innerHTML = `
          <div class="info">
            <h4>${l.title} ${completed}</h4>
            <p>${l.description || ''}</p>
          </div>
          <div class="progress" title="${pct}% complete"><span style="width:${pct}%"></span></div>
        `;
        section.appendChild(card);
      }
      modulesEl.appendChild(section);
    }
  }

  function renderPianos(pianos, selectedId) {
    pianoSelect.innerHTML = '';
    for (const p of pianos) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.brand} ${p.model} (${p.numKeys} keys)`;
      if (p.id === selectedId) opt.selected = true;
      pianoSelect.appendChild(opt);
    }
    updatePianoDesc(pianos);
    pianoSelect.addEventListener('change', async () => {
      const id = Number(pianoSelect.value);
      await fetch('/api/pianos/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pianoId: id })
      });
      updatePianoDesc(pianos);
    });
  }
  function updatePianoDesc(pianos) {
    const id = Number(pianoSelect.value);
    const p = pianos.find((x) => x.id === id);
    pianoDescEl.textContent = p ? p.description : '';
  }

  try {
    const [me, summary, lessons, pianos] = await Promise.all([
      getJSON('/api/auth/me'),
      getJSON('/api/progress/summary'),
      getJSON('/api/lessons'),
      getJSON('/api/pianos')
    ]);
    welcomeEl.textContent = `Hi, ${me.displayName}!`;
    renderStats(summary);
    renderPlan(lessons);
    renderPianos(pianos, me.selectedPianoId);
  } catch (err) {
    console.error(err);
  }
})();
