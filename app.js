async function loadBalanceData() {
  const grid = document.querySelector('#balance-grid');

  try {
    const response = await fetch('data/balance.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    grid.innerHTML = data.units.map((unit) => `
      <article class="card">
        <h3>${unit.name}</h3>
        <dl>
          <dt>HP</dt><dd>${unit.hp}</dd>
          <dt>Armor</dt><dd>${unit.armor}</dd>
          <dt>Weapon</dt><dd>${unit.weapon}</dd>
          <dt>Damage</dt><dd>${unit.damage}</dd>
          <dt>Cooldown</dt><dd>${unit.cooldown}</dd>
        </dl>
      </article>
    `).join('');
  } catch (error) {
    grid.innerHTML = `<p class="muted">Balance data failed to load: ${error.message}</p>`;
  }
}

loadBalanceData();
