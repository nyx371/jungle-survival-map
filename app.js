const state = {
  content: null,
  sources: [],
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((tab) => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });
}

async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function renderCardGrid(selector, items) {
  const grid = document.querySelector(selector);
  grid.innerHTML = items.map((item) => `
    <article class="card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
    </article>
  `).join('');
}

function renderFeatures(features) {
  renderCardGrid('#feature-grid', features);
}

function renderGameplayLoop(loop) {
  renderCardGrid('#loop-grid', loop);
}

function renderEnemies(enemies) {
  const grid = document.querySelector('#enemy-grid');
  grid.innerHTML = enemies.map((enemy) => `
    <article class="card enemy-card">
      <div class="card-kicker">${escapeHtml(enemy.base)}</div>
      <h3>${escapeHtml(enemy.role)}</h3>
      <div class="evolution-list">
        ${enemy.evolutions.map((evolution) => `
          <div class="evolution tier-${escapeHtml(evolution.color.toLowerCase())}">
            <span class="color-chip">${escapeHtml(evolution.color)}</span>
            <div>
              <strong>${escapeHtml(evolution.tier)} · ${escapeHtml(evolution.name)}</strong>
              <p>${escapeHtml(evolution.change)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </article>
  `).join('');
}

function renderUpgrades(upgrades) {
  const grid = document.querySelector('#upgrade-grid');
  grid.innerHTML = upgrades.map((group) => `
    <article class="card">
      <h3>${escapeHtml(group.title)}</h3>
      <ul class="checklist compact">
        ${group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </article>
  `).join('');
}

async function loadSource(file) {
  const code = document.querySelector('#source-code');
  const title = document.querySelector('#source-title');
  const link = document.querySelector('#source-link');

  title.textContent = file.label;
  link.href = file.path;
  code.textContent = 'Loading…';

  try {
    const response = await fetch(file.path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    code.textContent = await response.text();
  } catch (error) {
    code.textContent = `Unable to load ${file.path}: ${error.message}`;
  }
}

function renderSourceList(files) {
  const list = document.querySelector('#source-list');
  list.innerHTML = files.map((file, index) => `
    <button class="source-file ${index === 0 ? 'active' : ''}" data-index="${index}">
      ${escapeHtml(file.label)}
    </button>
  `).join('');

  list.querySelectorAll('.source-file').forEach((button) => {
    button.addEventListener('click', () => {
      list.querySelectorAll('.source-file').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      loadSource(files[Number(button.dataset.index)]);
    });
  });

  if (files[0]) loadSource(files[0]);
}

async function init() {
  setupTabs();

  try {
    state.content = await loadJson('data/site-content.json');
    renderGameplayLoop(state.content.gameplayLoop);
    renderFeatures(state.content.features);
    renderEnemies(state.content.enemies);
    renderUpgrades(state.content.upgrades);
  } catch (error) {
    document.querySelector('#feature-grid').innerHTML = `<p class="muted">Unable to load site content: ${escapeHtml(error.message)}</p>`;
  }

  try {
    state.sources = await loadJson('data/source-files.json');
    renderSourceList(state.sources);
  } catch (error) {
    document.querySelector('#source-code').textContent = `Unable to load source index: ${error.message}`;
  }
}

init();
