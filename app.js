const state = {
  content: null,
  sources: [],
  icons: [],
  iconByTitle: new Map(),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const systemSectionIds = ['system-upgrades', 'system-resources', 'system-enemies'];
const defaultSystemSectionId = 'system-upgrades';

function setSystemSection(sectionId = defaultSystemSectionId) {
  const targetId = systemSectionIds.includes(sectionId) ? sectionId : defaultSystemSectionId;

  document.querySelectorAll('.system-section').forEach((section) => {
    const active = section.id === targetId;
    section.classList.toggle('active', active);
    section.hidden = !active;
  });

  document.querySelectorAll('[data-system-target]').forEach((tab) => {
    const active = tab.dataset.systemTarget === targetId;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function currentSystemSectionFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  return systemSectionIds.includes(hash) ? hash : defaultSystemSectionId;
}

function activateTab(tabName, options = {}) {
  const activeSystemSection = tabName === 'system' ? (options.systemSection || currentSystemSectionFromHash()) : null;

  document.querySelectorAll('.tab').forEach((tab) => {
    const active = activeSystemSection
      ? tab.dataset.systemTarget === activeSystemSection
      : tab.dataset.tab === tabName;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
  document.getElementById(tabName)?.classList.add('active');

  if (tabName === 'system') {
    setSystemSection(activeSystemSection);
  }

  if (options.scroll !== false) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function activateSystemSection(sectionId, options = {}) {
  activateTab('system', { scroll: false, systemSection: sectionId });
  setSystemSection(sectionId);

  if (options.scroll !== false) {
    window.scrollTo({ top: 0, behavior: options.smooth === false ? 'auto' : 'smooth' });
  }
}

function activateRouteFromHash(options = {}) {
  const hash = window.location.hash.replace(/^#/, '');
  if (systemSectionIds.includes(hash)) {
    activateSystemSection(hash, options);
    return;
  }

  if (hash === 'home' || hash === 'notes' || hash === 'source') {
    activateTab(hash, options);
    return;
  }

  activateTab('home', { scroll: false });
}


function setupDayCycleTransition() {
  const container = document.querySelector('[data-day-cycle]');
  if (!container) return;

  const images = [...container.querySelectorAll('.cycle-image')];
  const labels = [...container.querySelectorAll('.cycle-phase-list button')];
  const label = container.querySelector('[data-cycle-label]');
  const progressBar = container.querySelector('[data-cycle-progress]');
  const phaseProgressBars = labels.map((button) => button.querySelector('.phase-progress'));
  const loopNodes = [...container.querySelectorAll('[data-cycle-node]')];
  const phaseDurationMs = 7200;
  const crossfadeMs = 2600;
  let activeIndex = 0;
  let phaseStartedAt = performance.now();
  let animationFrame = 0;

  function setPhase(index, options = {}) {
    activeIndex = (index + images.length) % images.length;
    if (options.restart !== false) phaseStartedAt = performance.now();

    images.forEach((image, imageIndex) => {
      const active = imageIndex === activeIndex;
      image.classList.toggle('active', active);
      image.style.opacity = active ? '1' : '0';
    });

    labels.forEach((item, itemIndex) => {
      const active = itemIndex === activeIndex;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    loopNodes.forEach((node, nodeIndex) => {
      node.classList.toggle('active', nodeIndex === activeIndex);
    });

    phaseProgressBars.forEach((bar) => {
      if (bar) {
        bar.style.width = '0%';
        bar.hidden = true;
      }
    });

    if (label) label.textContent = images[activeIndex].dataset.phase || labels[activeIndex]?.textContent || '';
  }

  function render(now) {
    const elapsed = now - phaseStartedAt;
    const progress = Math.min(1, elapsed / phaseDurationMs);
    const nextIndex = (activeIndex + 1) % images.length;
    const fadeProgress = Math.max(0, Math.min(1, (elapsed - (phaseDurationMs - crossfadeMs)) / crossfadeMs));

    images.forEach((image, imageIndex) => {
      if (imageIndex === activeIndex) image.style.opacity = (1 - fadeProgress).toFixed(3);
      else if (imageIndex === nextIndex) image.style.opacity = fadeProgress.toFixed(3);
      else image.style.opacity = '0';
    });

    if (progressBar) {
      const segmentWidth = 100 / images.length;
      progressBar.style.left = `${(activeIndex * segmentWidth).toFixed(3)}%`;
      progressBar.style.width = `${(progress * segmentWidth).toFixed(3)}%`;
    }

    phaseProgressBars.forEach((bar, barIndex) => {
      if (!bar) return;
      const visible = barIndex === activeIndex && progress > 0.01;
      bar.style.width = visible ? `${(progress * 100).toFixed(1)}%` : '0%';
      bar.hidden = !visible;
    });

    if (elapsed >= phaseDurationMs) {
      setPhase(nextIndex);
    }

    animationFrame = requestAnimationFrame(render);
  }

  labels.forEach((button) => {
    button.addEventListener('click', () => {
      setPhase(Number(button.dataset.cycleJump || 0));
    });
  });

  setPhase(0);
  animationFrame = requestAnimationFrame(render);
  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.systemTarget) {
        const target = button.dataset.systemTarget;
        history.replaceState(null, '', `#${target}`);
        activateSystemSection(target, { smooth: false });
        return;
      }

      activateTab(button.dataset.tab);
      history.replaceState(null, '', `#${button.dataset.tab}`);
    });
  });

  window.addEventListener('hashchange', () => activateRouteFromHash());
}


async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function normalizeIconTitle(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getIconByTitle(title) {
  return state.iconByTitle.get(normalizeIconTitle(title));
}

function getIconByIndex(index) {
  return state.icons.find((icon) => icon.index === index);
}

const exactIconTitles = new Map(Object.entries({
  'One Ghost, real decisions': 'Sarah Kerrigan (Ghost)',
  'Days are your chance to breathe': 'Scanner Sweep',
  'Nights are when plans get tested': 'Dark Swarm',
  'Hunt neural critters': 'Bengalaas (Jungle Critter)',
  'Builds stay personal': 'C-10 Canister Rifle',
  'Craft tactical constructs': 'Use Spider Mines',
  'Death hurts without ending the run': 'Restoration',
  'The jungle does not stay still': 'Zergling',
  'Five-night operation': 'Hold Position',
  'One commander per player': 'Sarah Kerrigan (Ghost)',
  'Daylight creates choices': 'Scanner Sweep',
  'Night punishes delay': 'Dark Swarm',
  'Equipment defines role': 'C-10 Canister Rifle',
  'Failure costs momentum': 'Restoration',
  'Trees': 'Mineral Cluster (Type 1)',
  'Bushes': 'Vespene Geyser',
  'Rocks': 'Mineral Cluster (Type 3)',
  'Crystals': 'Khaydarin Crystal',
  'Organic growth': 'Toxic Spores',
  'Sap vines': 'Gather',
  'Basalt veins': 'Mineral Cluster (Type 2)',
  'Spore pods': 'Spines',
  'Neural critters': 'Bengalaas (Jungle Critter)',
  'Crafted weapons': 'Gauss Rifle',
  'Weapon upgrades': 'Infantry Weapons',
  'Survival upgrades': 'Plasma Shields',
  'Craftable constructs and utility': 'Terran Basic Buildings',
  'Companion squad upgrades': 'Probe',
  'Reuse unused abilities as spells': 'Cloak',
  'Command card stays readable': 'Patrol',
  'Few active hotbar abilities': 'Heal',
  'Psi Emitter feasibility': 'Khaydarin Crystal',
}));

function iconTitleForText(value) {
  const text = String(value).toLowerCase();
  const pairs = [
    [/shotgun|burst/, 'Fragmentation Grenade'],
    [/sniper|long range|range/, 'C-10 Canister Rifle'],
    [/flamer|flame/, 'Flame Thrower'],
    [/acid/, 'Acid Spore'],
    [/explosive|splash|radius/, 'Hellfire Missile Pack'],
    [/rifle|default ghost|damage/, 'Gauss Rifle'],
    [/cooldown|fire rate/, 'Use Stimpack'],
    [/target flags|air-ground|air ground/, 'Gemini Missiles'],
    [/weapon behavior|crafted weapon type|weapon type/, 'Cloak'],
    [/health|max health|durability/, 'Medic'],
    [/armor/, 'Infantry Armor'],
    [/shield|shields/, 'Plasma Shields'],
    [/energy/, 'Moebius Reactor'],
    [/movement speed|vision/, 'Ocular Implants'],
    [/resource transfer/, 'Return Resources'],
    [/harvest efficiency|harvest/, 'Fusion Cutter (Harvest)'],
    [/temporary structures|structures|buildables/, 'Terran Basic Buildings'],
    [/deconstruction|refund|repair/, 'Repair'],
    [/maelstrom|mine|trap/, 'Maelstrom'],
    [/sfx|status|alerts/, 'Optical Flare'],
    [/active abilities/, 'EMP Shockwave'],
    [/robotic|fighters/, 'Goliath'],
    [/tame|weakened zerg/, 'Mind Control'],
    [/resurrect|corpses|biomass/, 'Restoration'],
    [/companion count|companion/, 'Probe'],
    [/ghost dies|die|death/, 'Nuclear Strike'],
  ];
  const match = pairs.find(([pattern]) => pattern.test(text));
  return match?.[1];
}

function chooseIcon(item, fallbackTitle = 'Scanner Sweep') {
  const exactTitle = exactIconTitles.get(String(item.title || ''));
  if (exactTitle) return getIconByTitle(exactTitle) || getIconByTitle(fallbackTitle);

  const text = `${item.title || ''} ${item.body || ''}`.toLowerCase();
  const title = String(item.title || '').toLowerCase();
  const pairs = [
    [/maelstrom|mine|trap/, 'Maelstrom'],
    [/psi emitter|beacon|lure/, 'Khaydarin Crystal'],
    [/heal/, 'Heal'],
    [/speed|sprint|tempo/, 'Use Stimpack'],
    [/stun|control|maelstrom/, 'Maelstrom'],
    [/command card|hotbar|button|readable/, 'Patrol'],
    [/spell|ability|passive/, 'Cloak'],
    [/ghost|commander|commando/, 'Ghost'],
    [/night|swarm|zerg/, 'Dark Swarm'],
    [/day|scout|vision/, 'Scanner Sweep'],
    [/harvest|resource|mineral|vespene|trickle/, 'Gather'],
    [/critter|jungle|wildlife/, 'Bengalaas (Jungle Critter)'],
    [/build|construct|structure|light|safe pocket|turret|wall/, 'Terran Basic Buildings'],
    [/death|die|respawn/, 'Restoration'],
    [/weapon|rifle|sniper|shotgun|flamer|explosive/, 'Gauss Rifle'],
    [/upgrade|armor|shield|survival/, 'Plasma Shields'],
    [/companion|robotic|squad|tame|resurrect/, 'Probe'],
  ];

  for (const [pattern, iconTitle] of pairs) {
    if (pattern.test(text) || pattern.test(title)) {
      return getIconByTitle(iconTitle) || getIconByTitle(fallbackTitle);
    }
  }

  return getIconByTitle(fallbackTitle) || getIconByIndex(250);
}

function renderIcon(icon, fallbackText = 'JC') {
  if (!icon) return `<span>${escapeHtml(fallbackText)}</span>`;
  return `<img src="${escapeHtml(icon.file)}" alt="" loading="lazy"><span class="sr-only">${escapeHtml(icon.title)}</span>`;
}


function iconStripForItem(item) {
  const title = String(item.title || item.base || item.role || '');
  const body = `${item.body || ''} ${item.role || ''}`;
  const text = `${title} ${body}`.toLowerCase();
  const exact = {
    'One Ghost, real decisions': ['Sarah Kerrigan (Ghost)', 'Marine', 'Probe'],
    'Days are your chance to breathe': ['Scanner Sweep', 'Gather', 'Patrol'],
    'Nights are when plans get tested': ['Dark Swarm', 'Hold Position', 'Use Spider Mines'],
    'Hunt neural critters': ['Bengalaas (Jungle Critter)', 'Maelstrom', 'Gather'],
    'Builds stay personal': ['Gauss Rifle', 'C-10 Canister Rifle', 'Flame Thrower'],
    'Craft tactical constructs': ['Terran Basic Buildings', 'Use Spider Mines', 'Maelstrom'],
    'Death hurts without ending the run': ['Nuclear Strike', 'Restoration', 'Heal'],
    'The jungle does not stay still': ['Zergling', 'Lurker Aspect', 'Dark Swarm'],
    'Survive five nights in the jungle': ['Hold Position', 'Dark Swarm', 'Scanner Sweep'],
    'Scavenge by day, endure the night': ['Patrol', 'Gather', 'Dark Swarm'],
    'Command one Ghost and a small squad': ['Sarah Kerrigan (Ghost)', 'Marine', 'Probe'],
    'Harvest minerals and vespene over time': ['Fusion Cutter (Harvest)', 'Mineral Cluster (Type 1)', 'Vespene Geyser'],
    'Stun neural critters before they flee': ['Maelstrom', 'Bengalaas (Jungle Critter)', 'Gather'],
    'Craft one active weapon at a time': ['Gauss Rifle', 'Fragmentation Grenade', 'Flame Thrower'],
    'Build safe pockets, then abandon them': ['Terran Basic Buildings', 'Use Spider Mines', 'Repair'],
    'Death hurts, but progression survives': ['Nuclear Strike', 'Restoration', 'Plasma Shields'],
    'The swarm evolves with time': ['Zergling', 'Hydralisk', 'Ultralisk'],
    'Trees': ['Fusion Cutter (Harvest)', 'Mineral Cluster (Type 1)', 'Vespene Geyser'],
    'Bushes': ['Gather', 'Vespene Geyser', 'Mineral Cluster (Type 1)'],
    'Rocks': ['Fusion Cutter', 'Mineral Cluster (Type 3)', 'Repair'],
    'Crystals': ['Khaydarin Crystal', 'Vespene Geyser', 'Gather'],
    'Organic growth': ['Toxic Spores', 'Spines', 'Gather'],
    'Sap vines': ['Gather', 'Vespene Geyser', 'Hold Position'],
    'Basalt veins': ['Mineral Cluster (Type 2)', 'Fusion Cutter', 'Gather'],
    'Spore pods': ['Spines', 'Toxic Spores', 'Gather'],
    'Neural critters': ['Bengalaas (Jungle Critter)', 'Maelstrom', 'Gather'],
    'Zerg Larva': ['Drone', 'Broodling', 'Restoration'],
    'Zerg Drone': ['Drone', 'Claws', 'Repair'],
    'Zerg Broodling': ['Broodling', 'Claws', 'Metabolic Boost'],
    'Zerg Zergling': ['Zergling', 'Claws', 'Metabolic Boost'],
    'Zerg Hydralisk': ['Hydralisk', 'Needle Spines', 'Grooved Spines'],
    'Zerg Lurker': ['Lurker', 'Subterranean Spines', 'Burrow'],
    'Zerg Queen': ['Queen', 'Optical Flare', 'Ensnare'],
    'Zerg Mutalisk': ['Mutalisk', 'Glave Wurm', 'Flyer Attack'],
    'Zerg Guardian': ['Guardian', 'Acid Spore', 'Flyer Attack'],
    'Zerg Defiler': ['Defiler', 'Plague', 'Dark Swarm'],
    'Zerg Ultralisk': ['Ultralisk', 'Kaiser Blades', 'Chitinous Plating'],
    'Reuse unused abilities as spells': ['Cloak', 'EMP Shockwave', 'Maelstrom'],
    'Command card stays readable': ['Patrol', 'Gauss Rifle', 'Hold Position'],
    'Few active hotbar abilities': ['Heal', 'Use Stimpack', 'Maelstrom'],
    'Psi Emitter feasibility': ['Khaydarin Crystal', 'Dark Swarm', 'Scanner Sweep'],
  }[title];

  const titles = exact ? [...exact] : [];
  const rules = [
    [/psi emitter|beacon|lure/, 'Khaydarin Crystal'],
    [/heal/, 'Heal'],
    [/speed|sprint|tempo/, 'Use Stimpack'],
    [/stun|control|maelstrom/, 'Maelstrom'],
    [/command card|hotbar/, 'Patrol'],
    [/spell|ability|passive/, 'Cloak'],
    [/ghost|commander|squad/, 'Sarah Kerrigan (Ghost)'],
    [/resource|harvest|scavenge|mineral/, 'Gather'],
    [/vespene|gas/, 'Vespene Geyser'],
    [/night|swarm|zerg/, 'Dark Swarm'],
    [/light|scout|day/, 'Scanner Sweep'],
    [/build|construct|structure|wall|turret/, 'Terran Basic Buildings'],
    [/mine|trap|stun|maelstrom/, 'Maelstrom'],
    [/weapon|rifle|sniper/, 'C-10 Canister Rifle'],
    [/death|respawn|die/, 'Restoration'],
  ];
  for (const [pattern, iconTitle] of rules) {
    if (pattern.test(text) && !titles.includes(iconTitle)) titles.push(iconTitle);
  }
  return titles.slice(0, 4).map((iconTitle) => getIconByTitle(iconTitle)).filter(Boolean);
}

function renderIconStrip(icons, label = 'Related command icons') {
  if (!icons.length) return '';
  return `<div class="icon-strip" aria-label="${escapeHtml(label)}">${icons.map((icon) => `
    <span class="mini-icon command-chip" title="${escapeHtml(icon.title)}">${renderIcon(icon, icon.title.slice(0, 2))}</span>
  `).join('')}</div>`;
}

function evolutionIconTitle(evolution) {
  const text = `${evolution.name || ''} ${evolution.change || ''}`.toLowerCase();
  const pairs = [
    [/structure|building|wall/, 'Claws'],
    [/surround|melee|bite|claw|ripper|mauler/, 'Kaiser Blades'],
    [/spine|needle|ranged|spitter|impaler/, 'Needle Spines'],
    [/burrow|ambusher|subterranean/, 'Subterranean Spines'],
    [/support|disruption|hex|priority/, 'Optical Flare'],
    [/air|wing|flying|flanker/, 'Flyer Attack'],
    [/siege|artillery|shell/, 'Acid Spore'],
    [/plague|death|burst|bloater/, 'Toxic Spores'],
    [/armor|hp|tank|crusher/, 'Infantry Armor'],
    [/speed|movement|chase/, 'Metabolic Boost'],
    [/splash|area/, 'Glave Wurm'],
    [/spawn|hive|larva|nest|clutch|molt/, 'Broodling'],
  ];
  return pairs.find(([pattern]) => pattern.test(text))?.[1] || 'Claws';
}

function renderCardGrid(selector, items) {
  const grid = document.querySelector(selector);
  grid.innerHTML = items.map((item) => `
    <article class="card feature-card">
      <div class="feature-icon" aria-hidden="true">${renderIcon(chooseIcon(item), item.title.slice(0, 2))}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body)}</p>
      ${renderIconStrip(iconStripForItem(item))}
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

function enemyIcon(base) {
  return getIconByTitle(base) || getIconByTitle(String(base).replace(/^Zerg /, '')) || getIconByTitle('Zergling');
}

function renderEnemies(enemies) {
  const grid = document.querySelector('#enemy-grid');
  grid.innerHTML = enemies.map((enemy) => `
    <article class="card enemy-card">
      <div class="feature-icon enemy-icon" aria-hidden="true">
        <img src="${escapeHtml(enemy.portrait)}" alt="" loading="lazy" />
      </div>
      <div class="card-kicker">${escapeHtml(enemy.base)}</div>
      <h3>${escapeHtml(enemy.role)}</h3>
      ${enemy.lore ? `<p class="enemy-lore">${escapeHtml(enemy.lore)}</p>` : ''}
      ${renderIconStrip(iconStripForItem({ title: enemy.base, role: enemy.role }), `${enemy.base} combat icons`)}
      <div class="evolution-list">
        ${enemy.evolutions.map((evolution) => {
          const evoIcon = getIconByTitle(evolutionIconTitle(evolution)) || enemyIcon(enemy.base);
          return `
          <div class="evolution tier-${escapeHtml(evolution.color.toLowerCase())}">
            <span class="mini-icon evolution-command" title="${escapeHtml(evoIcon.title)}">${renderIcon(evoIcon, evolution.tier)}</span>
            <span class="color-chip" role="img" aria-label="${escapeHtml(evolution.color)} tier"></span>
            <div>
              <strong>${escapeHtml(evolution.tier)} · ${escapeHtml(evolution.name)}</strong>
              <p>${escapeHtml(evolution.change)}</p>
            </div>
          </div>`;
        }).join('')}
      </div>
    </article>
  `).join('');
}

function renderNotes(notes) {
  renderCardGrid('#notes-grid', notes);
}

function renderUpgradeCards(selector, upgrades) {
  const grid = document.querySelector(selector);
  grid.innerHTML = upgrades.map((upgrade) => `
    <article class="card feature-card upgrade-card">
      <div class="feature-icon" aria-hidden="true">${renderIcon(chooseIcon(upgrade), upgrade.title.slice(0, 2))}</div>
      <h3>${escapeHtml(upgrade.title)}</h3>
      <p>${escapeHtml(upgrade.body)}</p>
      ${renderIconStrip(iconStripForItem(upgrade), `${upgrade.title} command icons`)}
    </article>
  `).join('');
}

function renderUpgrades(upgrades) {
  renderUpgradeCards('#field-upgrade-grid', upgrades);
}

function renderWeapons(weapons) {
  const grid = document.querySelector('#weapon-upgrade-grid');
  grid.innerHTML = weapons.map((weapon) => `
    <article class="card feature-card upgrade-card">
      <div class="feature-icon" aria-hidden="true">${renderIcon(getIconByTitle(weapon.icon), weapon.title.slice(0, 2))}</div>
      <h3>${escapeHtml(weapon.title)}</h3>
      <p>${escapeHtml(weapon.body)}</p>
      <p class="weapon-special"><strong>Special ability:</strong> ${escapeHtml(weapon.special)}</p>
    </article>
  `).join('');
}

function renderStructures(structures) {
  const grid = document.querySelector('#structure-upgrade-grid');
  grid.innerHTML = structures.map((structure) => `
    <article class="card feature-card upgrade-card">
      <div class="feature-icon" aria-hidden="true">${renderIcon(getIconByTitle(structure.icon), structure.title.slice(0, 2))}</div>
      <h3>${escapeHtml(structure.title)}</h3>
      <p>${escapeHtml(structure.body)}</p>
    </article>
  `).join('');
}


function highlightEps(source) {
  const keywords = new Set([
    'as', 'break', 'case', 'const', 'continue', 'default', 'do', 'else', 'export', 'for', 'from',
    'function', 'if', 'import', 'in', 'object', 'return', 'static', 'switch', 'var', 'while',
  ]);
  const literals = new Set(['true', 'false', 'null', 'undefined']);
  const builtins = new Set([
    'EUDArray', 'EUDByteReader', 'EUDByteWriter', 'EUDCreateVariables', 'EUDLightVariable',
    'EUDLoopNewUnit', 'EUDLoopPlayerUnit', 'EUDPlayerLoop', 'EUDVariable', 'PVariable',
    'Deaths', 'Command', 'Bring', 'ElapsedTime', 'Switch', 'Memory', 'SetDeaths', 'SetMemory',
    'CreateUnit', 'KillUnit', 'MoveUnit', 'Order', 'SetResources', 'DisplayText', 'PlayWAV',
    'Exactly', 'AtLeast', 'AtMost', 'SetTo', 'Add', 'Subtract', 'Enable', 'Disable', 'CurrentPlayer',
  ]);
  const tokenPattern = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b/g;
  let html = '';
  let cursor = 0;

  source.replace(tokenPattern, (token, _quote, offset) => {
    html += escapeHtml(source.slice(cursor, offset));
    let className = '';
    if (token.startsWith('//') || token.startsWith('/*')) className = 'tok-comment';
    else if (/^["'`]/.test(token)) className = 'tok-string';
    else if (/^\d/.test(token)) className = 'tok-number';
    else if (keywords.has(token)) className = 'tok-keyword';
    else if (literals.has(token)) className = 'tok-literal';
    else if (builtins.has(token)) className = 'tok-builtin';
    else if (/^[A-Z][A-Za-z0-9_$]*$/.test(token)) className = 'tok-type';
    else if (/^\s*\(/.test(source.slice(offset + token.length, offset + token.length + 8))) className = 'tok-function';

    html += className ? `<span class="${className}">${escapeHtml(token)}</span>` : escapeHtml(token);
    cursor = offset + token.length;
    return token;
  });

  html += escapeHtml(source.slice(cursor));
  return html;
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
    code.innerHTML = highlightEps(await response.text());
  } catch (error) {
    code.textContent = `Unable to load ${file.path}: ${error.message}`;
  }
}


function sourceIcon(file) {
  const label = String(file.label || file.path || '').toLowerCase();
  const pairs = [
    [/main/, 'Marine'],
    [/constant|dat_registry/, 'Terran Basic Buildings'],
    [/trigger|prior|docs/, 'Scanner Sweep'],
    [/abilities/, 'Heal'],
    [/audio/, 'Optical Flare'],
    [/camera/, 'Ocular Implants'],
    [/critter/, 'Bengalaas (Jungle Critter)'],
    [/companion/, 'Probe'],
    [/day_night/, 'Dark Swarm'],
    [/light/, 'Scanner Sweep'],
    [/menu/, 'Return Resources'],
    [/mob_evolution/, 'Lurker Aspect'],
    [/mobs/, 'Zergling'],
    [/players/, 'Sarah Kerrigan (Ghost)'],
    [/resources/, 'Gather'],
    [/structures/, 'Terran Basic Buildings'],
    [/transfers/, 'Return Resources'],
    [/upgrades/, 'Infantry Weapons'],
    [/victory/, 'Hold Position'],
    [/weapons/, 'Gauss Rifle'],
  ];
  const title = pairs.find(([pattern]) => pattern.test(label))?.[1] || 'Scanner Sweep';
  return getIconByTitle(title);
}

function renderSourceList(files) {
  const list = document.querySelector('#source-list');
  list.innerHTML = files.map((file, index) => `
    <button class="source-file ${index === 0 ? 'active' : ''}" data-index="${index}">
      <span class="mini-icon source-mini" aria-hidden="true">${renderIcon(sourceIcon(file), file.label.slice(0, 2))}</span>
      <span>${escapeHtml(file.label)}</span>
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
  setupDayCycleTransition();
  activateRouteFromHash({ smooth: false });
  try {
    state.content = await loadJson('data/site-content.json');
    state.icons = await loadJson('data/cmdicons.json');
    state.iconByTitle = new Map(state.icons.map((icon) => [normalizeIconTitle(icon.title), icon]));
    renderGameplayLoop(state.content.gameplayLoop);
    renderFeatures(state.content.features);
    renderResources(state.content.resources);
    renderNotes(state.content.notes || []);
    renderEnemies(state.content.enemies);
    renderUpgrades(state.content.upgrades);
    renderWeapons(state.content.weapons);
    renderStructures(state.content.structures);
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
