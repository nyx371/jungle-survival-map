# Prior Advanced epScript Map Lessons

Notes from K's previous advanced survival map EPS example. The attached source was only the epScript side; much of the unit, weapon, image DAT, and unit/order requirements work was done in EUD Editor GUI and is not present in the file.

## Big architectural patterns

- Prefer per-player `PVariable()` state and `EUDArray` tables over death counters.
- Use `EUDPlayerLoop()` for player-local updates, UI, input, vitals, and selected-unit behavior.
- Use `EUDLoopCUnit()` for startup/indexing passes and `EUDLoopPlayerCUnit(player)` for per-owner runtime systems.
- Store live hero references as `CUnit` values in per-player state, e.g. `PlayerHeroUnit[playerID]`.
- Keep most balance/design data in arrays: resource properties, ability properties, structure costs, tech descriptions, mob loot, biome weights.
- Use constants heavily for unit IDs, order IDs, string IDs, locations, button IDs, players, timings, and ranges.

## Useful CUnit techniques from the example

- Capture newly created units with `CUnit.from_read(EPD(0x628438))` immediately before `CreateUnit(...)`.
- Replace a live unit by moving a location to it, removing it, then creating a new unit at the same location.
- Use CUnit fields as compact runtime metadata when safe:
  - `unknown0x106` for resource/technology type IDs
  - `unknown0x26` for mob/critter state flags or type IDs
  - `connectedUnit` to link overlays, blockers, spawned mobs, and spawners
  - `hp` as timers/spawn charge for spawners and tech placeholders
  - `resourceAmount` for resource node remaining quantity
  - `killCount` / `rankIncrease` for spawner evolution
- Clear or guard linked references when units die/remove, especially `connectedUnit` links.
- Use `unit.setloc(location)` + `dilateloc(...)` + `Bring(...)` for local proximity checks.
- Use `unit.check_buildq(OPT_X)` / `reset_buildq()` for button-driven commands.

## UI/input patterns

- Register input globals with `EUDRegisterObjectToNamespace(...)` for external/injected input helpers.
- Track selected units with known selection-address reads, then update tooltips and button state when selection changes.
- Update command card visuals by writing button/icon data directly when needed.
- Use `Db`, `StringBuffer`, `sprintf`, `settblf`, `eprintf`, and `Screen.printfAt` for dynamic UI/status/debug text.
- Use build-queue buttons as a general-purpose menu/ability interface.
- Keep player feedback immediate: sounds, one-line messages, image overlays, and portrait swaps.

## Resource and biome patterns

- Model resources as a typed table:
  - name / unit label / display label
  - spawnable flag
  - image variants
  - total amount
  - harvest timer and harvest quantity
  - secondary resource and frequency
  - harvest sound set
  - energy restore value
  - initial blocker and blocker offset
- Use placeholder units in map regions, encode biome/location ID in HP, then replace placeholders with actual resource CUnits at startup/runtime.
- Use weighted biome selection with minimum spawn targets and temporary weight boosts to guarantee rare biome presence.
- Use resource node `resourceAmount` for depletion and remove nodes at zero.
- Use `connectedUnit` blockers to prevent mining until an overlay/blockade is destroyed.

## Structures and shared ownership

- Structures can be temporarily owned by the nearest player for control, then returned to a shared owner when out of range.
- Shared structures/storage can use a neutral/shared player plus ownership swapping for interaction.
- Structure actions can be implemented through build-queue buttons:
  - raise/lower walls
  - repair walls over time
  - fuel/extinguish light sources
  - process upgrades/research/conversions
  - transfer resources to/from storage
- Gradual repair/fuel behavior is cleaner than instant effects; use timers/HP/defensive-matrix-like fields as work buffers.

## Light, survival, and day/night patterns

- Track day/night as frame-derived state and emit transition feedback when state changes.
- Use visible/invisible overlay units such as Dark Swarm/Disruption Web equivalents to represent light/area effects.
- Compute player brightness from nearby light overlays and write local brightness only for the user CP.
- Energy/hunger/rested/starving state can be a per-player runtime variable, mirrored to hero `energy` for UI.
- Nearby furnace/lightpost checks can affect energy drain/regeneration and light level.

## Mob/spawner patterns

- Spawners can use `hp` as a countdown, `unknown0x106` as active-spawn count, `killCount` as progression, and `rankIncrease` as tier index.
- Spawn only when player proximity checks pass/fail as intended.
- Link spawned mobs back to their spawner via `connectedUnit` so deaths can decrement active counts and progress tier evolution.
- Re-run AI scripts periodically or after detecting stuck orders/movement states.
- Day/night despawn rules can be implemented by scanning enemy-player CUnits and removing non-spawner mobs during day.

## Ability patterns

- Split abilities into self-cast and targeted types.
- Keep ability availability, selected ability, cooldown, timer, icon, cost, energy cost, sounds, and tooltips in arrays.
- Use Alt+click or key-state variables to cycle selected abilities.
- Implement target abilities by detecting a special order ID and reading `orderTargetUnit` / `orderTargetX/Y`.

## Jungle Commandos implications

- Keep the new project modular, but preserve these proven patterns:
  - PVariable/EUDArray state first
  - CUnit links and metadata for live systems
  - build-queue buttons for player commands
  - placeholder-unit replacement for map-authored content
  - direct CUnit loops for mobs/resources/structures
  - compact dynamic UI with sounds and overlays
- Do not assume all DAT work belongs in epScript. Some unit/weapon/image/order requirement setup may still be easier or cleaner in EUD Editor GUI, with epScript handling runtime state and behavior.
