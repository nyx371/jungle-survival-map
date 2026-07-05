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

const systemSectionIds = ['system-loop', 'system-resources', 'system-enemies', 'system-upgrades'];

function activateTab(tabName, options = {}) {
  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.tab === tabName;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
  document.getElementById(tabName)?.classList.add('active');
  document.querySelectorAll('.sub-tab').forEach((tab) => tab.classList.remove('active'));

  const systemTabs = document.querySelector('.system-tabs');
  if (systemTabs) {
    const showSystemTabs = tabName === 'system';
    systemTabs.hidden = !showSystemTabs;
    systemTabs.setAttribute('aria-hidden', showSystemTabs ? 'false' : 'true');
  }

  if (options.scroll !== false) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function activateSystemSection(sectionId, options = {}) {
  activateTab('system', { scroll: false });
  document.querySelectorAll('.sub-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.systemTarget === sectionId);
  });

  if (options.scroll !== false) {
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: options.smooth === false ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }
}

function activateRouteFromHash(options = {}) {
  const hash = window.location.hash.replace(/^#/, '');
  if (systemSectionIds.includes(hash)) {
    activateSystemSection(hash, options);
    return;
  }

  if (hash === 'system' || hash === 'home' || hash === 'source') {
    activateTab(hash, options);
    return;
  }

  activateTab('home', { scroll: false });
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      activateTab(button.dataset.tab);
      history.replaceState(null, '', `#${button.dataset.tab}`);
    });
  });

  document.querySelectorAll('[data-system-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.systemTarget;
      history.replaceState(null, '', `#${target}`);
      activateSystemSection(target);
    });
  });

  window.addEventListener('hashchange', () => activateRouteFromHash());
}


async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

const classicIconBase = 'https://classic.battle.net/images/battle/scc';

function featureIcon(title) {
  const value = String(title).toLowerCase();
  if (value.includes('ghost')) return `${classicIconBase}/pix/i-terran2.gif`;
  if (value.includes('night') || value.includes('swarm') || value.includes('zerg')) return `${classicIconBase}/zerg/pix/units/Zergling1.gif`;
  if (value.includes('build') || value.includes('light')) return `${classicIconBase}/protoss/pix/menu/i-prot.gif`;
  if (value.includes('death')) return `${classicIconBase}/zerg/pix/units/Hydralisk1.gif`;
  if (value.includes('resource') || value.includes('harvest') || value.includes('mineral')) return `${classicIconBase}/terran/PICS/min.gif`;
  if (value.includes('jungle') || value.includes('critter')) return `${classicIconBase}/pix/i-zerg2.gif`;
  return `${classicIconBase}/pix/i-gen2.gif`;
}

function renderCardGrid(selector, items) {
  const grid = document.querySelector(selector);
  grid.innerHTML = items.map((item) => `
    <article class="card feature-card">
      <div class="feature-icon" aria-hidden="true"><img src="${featureIcon(item.title)}" alt="" loading="lazy" /></div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
    </article>
  `).join('');
}

function renderFeatures(features) {
  renderCardGrid('#home-grid', features);
}

function renderResources(resources) {
  renderCardGrid('#resource-grid', resources);
}

function renderGameplayLoop(loop) {
  renderCardGrid('#loop-grid', loop);
}

function enemyIconName(base) {
  const value = String(base).toLowerCase();
  if (value.includes('hydralisk')) return 'Hydralisk';
  if (value.includes('ultralisk')) return 'Ultralisk';
  if (value.includes('mutalisk')) return 'Mutalisk';
  if (value.includes('guardian')) return 'Guardian';
  if (value.includes('queen')) return 'Queen';
  if (value.includes('defiler')) return 'Defiler';
  if (value.includes('lurker')) return 'Lurker';
  if (value.includes('drone')) return 'Drone';
  if (value.includes('broodling')) return 'Broodling';
  return 'Zergling';
}

function renderEnemies(enemies) {
  const grid = document.querySelector('#enemy-grid');
  grid.innerHTML = enemies.map((enemy) => `
    <article class="card enemy-card">
      <div class="feature-icon enemy-icon" aria-hidden="true"><img src="${classicIconBase}/zerg/pix/units/${enemyIconName(enemy.base)}1.gif" alt="" loading="lazy" /></div>
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
  activateRouteFromHash({ smooth: false });
  try {
    state.content = await loadJson('data/site-content.json');
    renderGameplayLoop(state.content.gameplayLoop);
    renderFeatures(state.content.features);
    renderResources(state.content.resources);
    renderEnemies(state.content.enemies);
    renderUpgrades(state.content.upgrades);
  } catch (error) {
    document.querySelector('#home-grid').innerHTML = `<p class="muted">Unable to load site content: ${escapeHtml(error.message)}</p>`;
  }

  try {
    state.sources = await loadJson('data/source-files.json');
    renderSourceList(state.sources);
  } catch (error) {
    document.querySelector('#source-code').textContent = `Unable to load source index: ${error.message}`;
  }
}

init();
