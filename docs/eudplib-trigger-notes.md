# eudplib Trigger / CUnit / TrgUnit Notes

Practical notes for implementing Jungle Commandos systems in epScript/eudplib.

## Module imports

epScript resolves `import` as an absolute dotted path from wherever `main.eps` lives, not a relative path like C's `#include` and not a bare filename. This holds regardless of which file does the importing — everything is relative to the project root, not the importer's own folder.

```js
// src/main.eps
import core.constants;       // src/core/constants.eps
import systems.day_night;    // src/systems/day_night.eps
```

Even if `systems/weapons.eps` needed something from `core/constants.eps`, it would still be `import core.constants;`, never `import constants;` or `import ../core/constants;`.

Source: euddraft wiki, ["08. Moving pawn, Splitting script"](https://github.com/phu54321/euddraft/wiki/08.-Moving-pawn,-Splitting-script).

## Trigger model

StarCraft triggers are fixed-size records:

- 16 conditions max
- 64 actions max
- conditions are 20-byte structs
- actions are 32-byte structs

`RawTrigger` is the low-level preserved trigger object. `Trigger(...)` is the safer wrapper and can split oversized logic into multiple raw triggers when needed.

Avoid `Wait`. eudplib warns against it because waits block trigger execution. Use `EUDVariable`/array-backed state, frame timers, and state machines instead. Prefer EUDVariables over death counters for new gameplay state; use death counters mainly for native trigger interoperability or when a specific API requires them.

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

## Useful eudplib function groups

`eudplib/docs/funclist.txt` is a broad function index. The most relevant groups for this project are below.

### Map and encoding helpers

- `LoadMap`, `SaveMap`, `GetChkTokenized` for map load/save and raw CHK access.
- `MPQAddFile`, `MPQAddWave` for bundling assets.
- `EUDOnStart(func)` for map-start initialization.
- `EncodeUnit`, `EncodeLocation`, `EncodePlayer`, `EncodeString`, `EncodeSwitch`, etc. convert names/constants into trigger IDs.
- `GetUnitIndex`, `GetLocationIndex`, `GetStringIndex`, `GetSwitchIndex` are index helpers.
- `UnitProperty(...)` builds property records for `CreateUnitWithProperties`.

For Jungle Commandos, keep raw CHK/TRIG mutations rare; normal eudplib APIs are safer.

### Trigger conditions/actions

Important stock conditions:

- `Always`, `Never`
- `Bring`, `Command`, `Deaths`, `Accumulate`, `ElapsedTime`, `Switch`
- `Memory`, `MemoryEPD` for EUD memory checks

Important stock actions:

- `CreateUnit`, `CreateUnitWithProperties`
- `GiveUnits`, `MoveUnit`, `MoveLocation`, `Order`
- `KillUnit`, `KillUnitAt`, `RemoveUnit`, `RemoveUnitAt`
- `SetDeaths`, `SetResources`, `SetScore`, `SetSwitch`
- `ModifyUnitHitPoints`, `ModifyUnitShields`, `ModifyUnitEnergy`, `ModifyUnitResourceAmount`
- `DisplayText`, `DisplayExtText`, `PlayWAV`, `MinimapPing`
- `SetMemory`, `SetMemoryEPD`, `SetCurrentPlayer`

Avoid `Wait`. Prefer EUDVariable timers/counters.

### Trigger construction and flow

- `Trigger(...)` and `DoActions(...)` are high-level preserved trigger helpers.
- `PTrigger(players, conditions, actions)` gates execution by current player and pairs well with player loops.
- `RawTrigger(...)`, `NextTrigger`, `SetNextPtr`, trigger scopes, and jumps are lower-level control tools.
- `Disabled(...)` disables a condition or action.

Use high-level `Trigger`/`DoActions` unless link-level control is needed.

### Control structures

- `EUDIf`, `EUDIfNot`, `EUDElse`, `EUDElseIf`, `EUDEndIf`
- `EUDWhile`, `EUDWhileNot`, `EUDEndWhile`
- `EUDLoopN`, `EUDLoopRange`, `EUDInfLoop`
- `EUDPlayerLoop` for active player iteration
- `EUDSwitch`, cases/default, `EUDBreak`, `EUDContinue`
- `EUDAnd`, `EUDOr`, `EUDNot`, `EUDTernary`

Use these to write readable state-machine logic instead of manually stitching raw triggers.

### Unit/list loops

- `EUDLoopCUnit()` scans active CUnits.
- `EUDLoopPlayerCUnit(player)` scans one player's unit list.
- `EUDLoopNewCUnit()` scans newly-created CUnits.
- `EUDLoopBullet()` and `EUDLoopSprite()` exist if projectile/sprite-level effects are needed later.
- `EUDLoopList(header_offset, break_offset)` is the generic linked-list loop.

For this map, these are central for hero tracking, companion ownership, resource-node indexing, mob density scans, and light structures.

### Variables, arrays, structs

- `EUDVariable`, `EUDCreateVariables`, `SetVariables`, `SeqCompute`, `VProc`
- `EUDArray` for simple arrays.
- `EUDVArray` for full-variable arrays with faster constant-index access.
- `EUDStruct`, `EUDStack`, `ObjPool` for structured runtime state.
- `EUDFunc`, `EUDTypedFunc`, `EUDFuncPtr`, `EUDReturn` for reusable functions.

Likely project shape: EUDVariable/EUDArray/EUDVArray state for fixed player/area tables; structs or parallel arrays for tracked units/resources; typed funcs where CUnit/TrgUnit conversions matter. Prefer EUDVariables over death counters unless a classic trigger condition/action specifically needs death-count storage.

### Memory IO / debug strings

- `f_dwepdread_epd`, `f_dwread_epd`, `f_epdread_epd` read memory via EPD.
- `f_dwepdread_cp`, `f_dwread_cp`, `f_epdread_cp` are faster CurrentPlayer-relative reads.
- `f_getcurpl`, `f_setcurpl` should be used instead of raw `0x6509B0` reads/writes.
- `f_bread/f_bwrite`, `f_wread/f_wwrite`, `f_dwread/f_dwwrite` are pointer-based read/write helpers.
- `f_dwbreak`, `f_bitsplit`, bitwise helpers, and mask helpers are useful for packed fields.
- `DBString`, `f_dbstr_print`, `f_simpleprint` are useful debug/status output tools.

### Random/math/game commands

- `f_rand`, `f_dwrand`, `f_srand`, `f_randomize` for procedural choices.
- `f_atan2`, `f_lengthdir`, `f_sqrt` for movement/geometry.
- `QueueGameCommand_RightClick`, `QueueGameCommand_Select`, and related helpers can synthesize commands if needed, but should be used carefully.

## Reference docs

For language/tooling questions not covered above, check these before guessing:

- <https://havonz.github.io/SCRMapDocs/> — StarCraft Remastered map dev docs: `What-are-Triggers`, `What-is-EUD`, `What-is-euddraft` (epScript/eudplib/euddraft relationship), `euddraft-Reference` (`.eds`/`.edd` config format, plugin lifecycle order), `epScript-Reference/` (language syntax, types, strings, built-ins), `How-epScript-Works` (runtime trigger compilation model), `Example/`.
- <https://github.com/phu54321/euddraft/wiki> — numbered euddraft walkthrough; page 08 covers multi-file project imports (see above).
- `eudplib/docs/funclist.txt` (referenced above) is the broad eudplib function index.

Note: `.eps` files are plain UTF-8 text, but some editor tooling misidentifies the extension as binary PostScript — if a tool refuses to read/edit them for that reason, fall back to a plain-text-aware method and verify encoding (especially non-ASCII characters like em dashes) after any programmatic rewrite.
