# eudplib Trigger / CUnit / TrgUnit Notes

Practical notes for implementing Jungle Commandos systems in epScript/eudplib.

## Trigger model

StarCraft triggers are fixed-size records:

- 16 conditions max
- 64 actions max
- conditions are 20-byte structs
- actions are 32-byte structs

`RawTrigger` is the low-level preserved trigger object. `Trigger(...)` is the safer wrapper and can split oversized logic into multiple raw triggers when needed.

Avoid `Wait`. eudplib warns against it because waits block trigger execution. Use counters, frame timers, and state machines instead.

## TrgUnit

`TrgUnit` represents a unit type / `units.dat` entry, not a live unit on the map.

Use it for DAT-level changes and static unit definitions:

```js
const ghost = TrgUnit("Terran Ghost");
ghost.maxHp = 120 * 256;
ghost.groundWeapon.damage += 3;
```

Important properties include:

- `maxHp`, `maxShield`, `hasShield`
- `groundWeapon`, `airWeapon`
- `flingy`, `subUnit`
- `baseProperty`, `groupFlags`, `availabilityFlags`
- idle / attack order fields

For Jungle Commandos:

- player-specific Ghost variants should be separate `TrgUnit` IDs when per-player stats/weapons need to diverge
- mob tiers can be implemented by repurposed unit IDs with DAT changes
- structures/lights/resources should use central DAT allocation to avoid two systems mutating the same unit ID

## CUnit

`CUnit` represents one live unit instance in StarCraft's runtime unit table.

The CUnit table begins at `0x59CCA8` and has up to 1700 slots. Each slot is 336 bytes, or 84 EPDs.

Constructors:

```js
const u = CUnit(epd);              // EPD form
const u = CUnit.from_ptr(ptr);     // pointer form
const u = CUnit.cast(epd, ptr=ptr) // reuse/cast existing values
```

Useful live-unit fields:

- identity/ownership: `unitType`, `owner`, `playerID`
- position/movement: `pos`, `posX`, `posY`, `moveTarget`, `orderTargetXY`
- health/resources: `hp`, `shield`, `energy`, `resourceAmount`
- orders: `order`, `orderState`, `orderTarget`, `orderQueueCount`
- combat: `groundWeaponCooldown`, `airWeaponCooldown`, `spellCooldown`, `killCount`
- links: `prev`, `next`, `prevPlayerUnit`, `nextPlayerUnit`, `subUnit`
- uniqueness: `uniquenessIdentifier`, useful to distinguish a reused unit slot from the original unit

Useful methods:

- `cgive(player)` changes owner and maintains player unit lists
- `set_color(player)` changes sprite/player color
- `check_status_flag`, `set_status_flag`, `clear_status_flag`
- `are_buildq_empty`, `check_buildq`, `reset_buildq`
- `die()` / `remove()` are available and used in tests

Loop helpers:

```js
foreach(unit : EUDLoopCUnit()) { ... }          // scan active CUnit table
foreach(unit : EUDLoopPlayerCUnit(P1)) { ... }  // scan one player's linked unit list
foreach(unit : EUDLoopNewCUnit()) { ... }       // recently-created units
```

## Applying this to Jungle Commandos

Use `TrgUnit` for definitions, upgrades, and DAT mutation. Use `CUnit` for live gameplay state.

Examples:

- player tracker: store each Ghost's `CUnit` plus `uniquenessIdentifier`
- companion ownership: each companion stores owner player and/or owner Ghost CUnit identity
- death cleanup: if Ghost CUnit is dead/reused, destroy companions/structures tied to that player
- resource nodes: scan/index live resource CUnits; read `unitType`, `resourceAmount`, position, and uniqueness
- mobs: use CUnit scans to count density by area, ownership, unit type, and live position
- lights: use structure CUnit positions to project light levels into area state

Rule of thumb:

- `TrgUnit("Terran Ghost").maxHp` changes what the unit type is
- `ghostCUnit.hp` changes one specific Ghost currently alive on the map
