# Jungle Commandos Implementation Plan

## Technical Direction

Use epScript/euddraft for gameplay logic and DAT mutation. Use the GitHub Pages site as a human-readable balance dashboard fed by JSON exports.

Key implementation idea:

- Give each player a unique hero unit DAT entry.
- Give each player a unique weapon DAT entry.
- Apply upgrades by mutating that player's dedicated `TrgUnit` and `Weapon` DAT wrappers.
- Keep upgrade/menu definitions table-driven so they can also export to `data/balance.json` for the website.

## Proposed Project Layout

```text
jungle-survival-map/
  src/
    main.eps
    systems/
      players.eps
      upgrades.eps
      menus.eps
      mobs.eps
      resources.eps
      structures.eps
      sfx.eps
    data/
      player_slots.eps
      upgrades.eps
      mob_tiers.eps
  maps/
    basemap.scx
    jungle-survival.eds
  tools/
    export-balance.py
  data/
    balance.json       # website-facing generated/curated data
  docs/
    backlog.md
    implementation-plan.md
```

Current repo is only the website shell. The map source tree should be added once we start implementing the actual euddraft project.

## Phase 1 — Toolchain + Minimal Map Harness

Goals:

- Add `maps/jungle-survival.eds`.
- Add `src/main.eps` with lifecycle hooks.
- Add `[freeze] freeze: 0` for macOS builds unless using Windows/Wine.
- Compile a map successfully from this repo.

Implementation notes:

```ini
[main]
input: maps/basemap.scx
output: dist/jungle-survival.scx

[freeze]
freeze: 0

[src/main.eps]
```

Acceptance criteria:

- `euddraft maps/jungle-survival.eds` produces `dist/jungle-survival.scx`.
- `main.eps` displays a boot/debug message in-game.

## Phase 2 — Player Slot Model

Create a player slot table that maps each player to their unique unit and weapon IDs.

Example direction:

```js
const PLAYER_COUNT = 6;

const PlayerHeroUnit = py_list(
    TrgUnit("Terran Ghost"),
    TrgUnit("Sarah Kerrigan"),
    TrgUnit("Samir Duran"),
    // etc, final safe IDs TBD
);

const PlayerWeapon = py_list(
    Weapon("C-10 Canister Rifle"),
    Weapon("Gauss Rifle"),
    // etc, final safe IDs TBD
);
```

Important: final unit/weapon IDs need a deliberate allocation pass. Avoid IDs that are needed by mobs, buildings, visuals, or map mechanics.

Core tasks:

- Define supported players.
- Define per-player hero unit ID.
- Define per-player weapon ID.
- On game start, initialize every player's DAT values from base balance data.
- Ensure each hero unit uses that player's weapon IDs.

Acceptance criteria:

- Player heroes can diverge in max HP and weapon damage.
- Divergence is achieved through DAT wrappers, not per-unit trigger hacks.

## Phase 3 — Upgrade System

Create upgrade state per player and upgrade application functions.

Suggested model:

- Runtime variables hold upgrade levels per player.
- Upgrade definition data maps levels to DAT changes.
- Purchase handler checks minerals, increments level, applies DAT mutation.

Example fields:

```text
UpgradeId
Name
Category
MaxLevel
MineralCostBase
MineralCostScale
ApplyFunction(player)
DashboardExportFields
```

Example apply functions:

```js
function applyWeaponDamage(player) {
    const weapon = getPlayerWeapon(player);
    const level = WeaponDamageLevel[player];
    weapon.damage = 10 + level * 2;
}

function applyHeroArmor(player) {
    const unit = getPlayerHeroUnit(player);
    const level = ArmorLevel[player];
    unit.armor = level;
}
```

Acceptance criteria:

- At least three upgrades work:
  - weapon damage
  - weapon cooldown
  - max HP or armor
- Upgrades apply only to the purchasing player.

## Phase 4 — Menu System

Build deep menus as a reusable state machine.

Recommended approach:

- Each player has `menuPage`, `menuCursor`, and optional `menuContext` state.
- Menus render through text display.
- Commands can be based on deaths/switches/unit commands depending on the chosen control scheme.

Menu sections:

1. Main menu
2. Weapon upgrades
3. Survival upgrades
4. Energy/abilities
5. Structures
6. Team/resource transfer
7. Status/help

Acceptance criteria:

- Open/close menu.
- Navigate at least two nested categories.
- Buy an upgrade.
- Send resources flow exists as a menu stub or working prototype.

## Phase 5 — Resource System

Keep the resource system simple: everything gives minerals, with different amounts.

Tasks:

- Define reward table by mob/resource type.
- Award minerals on kill/harvest/deconstruct.
- Add player-to-player transfer.
- Add candidate resource locations.

Candidate location approach:

- Place marker units in the map editor.
- On start, scan markers or predefined locations.
- Roll weighted random selection.
- Replace selected markers with actual resources.
- Remove unused markers.

Acceptance criteria:

- Resources spawn differently across runs.
- Rewards are consistent and visible.
- Players can transfer minerals and vespene gas.

## Phase 6 — Mob System

Area respawn approach:

- Divide jungle into zones.
- Track desired mob density per zone.
- Periodically respawn mobs when zone is below target.
- Avoid spawning too close to active players unless intended.

Evolution model:

- Global threat tier increases over time.
- Each tier applies DAT changes to mob unit IDs and weapon IDs.
- Color is used as a quick danger indicator.

Example tier dimensions:

```text
Tier 1: weak, slow, low damage, default color
Tier 2: faster, stronger weapon, color shift
Tier 3: elite, special weapon or explosion behavior
Tier 4: plague/explosive variants, high pressure
```

Acceptance criteria:

- Mobs respawn by area.
- Threat tier changes mob stats and/or weapons.
- Color indicates evolved mobs.

## Phase 7 — Structures + Deconstruction

Tasks:

- Define initial structure list.
- Decide build method: menu spawn, builder unit, or classic construction.
- Track player-built structures.
- Implement deconstruction action and refund.

Acceptance criteria:

- At least one structure can be built.
- It can be deconstructed.
- Deconstruction clears the structure and returns minerals/gas according to the structure cost profile.

## Phase 8 — SFX and Feedback

Tasks:

- Track hero HP changes per player.
- Play damage SFX when hurt, rate-limited.
- Play heartbeat when low HP, local to that player.
- Optional ghost breathing ambience under specific conditions.

Acceptance criteria:

- Low HP cue is local and not global spam.
- Hurt cue is rate-limited.
- SFX improves readability without becoming annoying.

## Balance Dashboard Plan

The website should eventually display:

- Player hero base stats
- Upgrade curves
- Weapon stats per level
- Mob tier stats
- Resource reward table
- Structure costs/refunds
- Version changelog / balance diff

Implementation options:

1. **Manual JSON first**
   - Keep editing `data/balance.json` by hand.
   - Fastest for early planning.

2. **Generated JSON from shared tables**
   - Store balance tables in Python/JSON/YAML.
   - Generate both EPS constants and website JSON.
   - Best long-term approach.

Recommendation: start manual, then migrate to generated once upgrade/mob tables stabilize.

## Immediate Next Steps

1. Decide supported player count.
2. Pick candidate unit IDs for player hero variants.
3. Pick candidate weapon IDs for player weapon variants.
4. Add actual euddraft project structure under `src/` and `maps/`.
5. Implement player slot DAT initialization.
6. Implement first three upgrades and compile-test.
7. Add the first dashboard JSON schema for those upgrades.
