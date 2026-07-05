# Code Systems Map

This document maps the Jungle Survival gameplay strategy into epScript/euddraft systems.

The goal is to keep the code modular, data-driven, and easy to compile-test system by system.

For deeper implementation notes on the highest-priority gameplay systems, see [`important-systems.md`](important-systems.md).

## Top-Level Runtime Flow

```text
onPluginStart
  ├─ config/init constants
  ├─ player_slots.init
  ├─ dat_registry.init baseline DAT
  ├─ day_night.init
  ├─ resources.index candidate harvest nodes
  ├─ critters.init fleeing neural wildlife
  ├─ lights.init
  ├─ structures.init
  ├─ weapons.init
  ├─ upgrades.init
  ├─ mobs.init zones + tier data
  ├─ menus.init
  └─ ui/sfx init

beforeTriggerExec
  ├─ clock/day_night tick
  ├─ players scan/update hero state
  ├─ death/respawn handling
  ├─ harvest interaction handling
  ├─ neural critter flee/stun/harvest handling
  ├─ weapon swap / crafting handling
  ├─ upgrade purchase handling
  ├─ structure build/deconstruct handling
  ├─ light field update
  ├─ mob evolution update
  ├─ mob spawning/area respawn update
  ├─ resource transfer handling
  ├─ audio feedback update
  └─ menu rendering/input update

afterTriggerExec
  └─ cleanup/deferred queues/debug counters
```

## Proposed Source Tree

```text
src/
  main.eps

  core/
    constants.eps          # player count, timing, shared constants
    clock.eps              # frame/game-second/day-night helpers
    debug.eps              # debug display, assertions, compile flags
    dat_registry.eps       # safe unit/weapon/flingy IDs and DAT baseline reset

  data/
    player_slots.eps       # per-player hero + weapon ID allocation
    weapon_defs.eps        # crafted weapon definitions and base stats
    upgrade_defs.eps       # upgrade categories, levels, costs, effects
    mob_defs.eps           # mob families, tiers, colors, names, DAT changes
    structure_defs.eps     # light/wall/regen/turret costs and behavior
    resource_defs.eps      # harvest node types, weights, rewards

  systems/
    players.eps            # player hero lookup, alive/dead state, respawn
    day_night.eps          # 22m day/night cycle, five-night victory trigger
    resources.eps          # right-click continuous mining, node depletion, mineral/gas trickles
    critters.eps           # neural critters that flee unless stunned before harvest
    weapons.eps            # craft weapon, active weapon swap, DAT weapon apply
    upgrades.eps           # purchase upgrades, apply player-specific DAT changes
    structures.eps         # build, ownership tracking, deconstruct, death cleanup
    lights.eps             # brightness radius + spawn prevention zones
    mobs.eps               # area respawns, density targets, spawn blocking near lights
    mob_evolution.eps      # Black/Brown/Orange/Red tier progression
    menus.eps              # deep menus and input routing
    transfers.eps          # send minerals to teammates
    audio.eps              # heartbeat, hurt SFX, ghost breathing
    camera.eps             # optional camera follow toggle
    victory.eps            # five-night win, optional final boss/endless branch

  ui/
    text.eps               # player-facing status strings and formatting
    source_index.eps       # optional generated source metadata later
```

## System Responsibilities

### `main.eps`

Entry point only. It should not hold gameplay logic.

Responsibilities:

- Import all systems.
- Call init functions in deterministic order.
- Call per-frame update functions in deterministic order.

Rule: if `main.eps` grows large, move logic into a system file.

---

### `core/constants.eps`

Shared constants.

Examples:

```js
const MAX_PLAYERS = 5;
const FRAMES_PER_GAME_SECOND = 16;
const DAY_SECONDS = 22 * 60;
const NIGHT_SECONDS = 22 * 60;
const TARGET_NIGHTS_TO_WIN = 5;
```

Responsibilities:

- Global timing constants.
- Player count.
- Common enum-like IDs.
- Debug feature flags.

---

### `core/dat_registry.eps`

Central owner of DAT allocation.

Responsibilities:

- Define which unit IDs are repurposed for player Ghosts.
- Define which weapon IDs are repurposed for player weapons.
- Define mob base units and weapons.
- Reset all used DAT entries to known baselines on game start.

Why this matters:

DAT changes are global. Every system must go through this registry so we do not accidentally reuse a unit/weapon ID for two purposes.

Key tables:

```text
PlayerHeroUnit[player]
PlayerWeapon[player][weaponSlot]
MobUnit[mobFamily]
MobWeapon[mobFamily]
StructureUnit[structureType]
```

---

### `data/player_slots.eps`

Player-specific identity mapping.

Responsibilities:

- Map P1–P5 to unique Ghost-like hero unit IDs.
- Map P1–P5 to unique crafted weapon pools.
- Store per-player active weapon state.

Core state:

```text
HeroUnitId[player]
HeroCUnit[player]
ActiveWeaponSlot[player]
UnlockedWeapon[player][weaponType]
```

---

### `systems/players.eps`

Runtime player hero state.

Responsibilities:

- Find/track each player's hero unit.
- Track alive/dead state.
- Handle respawn after death.
- Apply death penalty:
  - random respawn position
  - lose most minerals
  - destroy that player's structures
  - keep upgrades/unlocks

Important functions:

```text
initPlayers()
updatePlayers()
getHero(player) -> CUnit
isPlayerAlive(player)
killOwnedStructures(player)
respawnPlayer(player)
```

---

### `systems/day_night.eps`

The main pacing clock.

Responsibilities:

- Track day/night cycle.
- Day = 22 minutes.
- Night = 22 minutes.
- Count survived nights.
- Increase wave intensity at night.
- Trigger victory after night 5, or final boss sequence.

Core state:

```text
CycleFrame
IsNight
CurrentDay
NightsSurvived
GlobalDifficulty
```

Events emitted conceptually:

```text
onDayStart(day)
onNightStart(night)
onNightEnd(night)
onVictoryReady()
```

---

### `systems/companions.eps`

Small companion squad system.

Gameplay rule:

- The Ghost is still the commander and failure point.
- Players may craft robotic fighters, tame Zerg, or resurrect Zerg into a small squad.
- All companions owned by a player die when that player's Ghost dies.

Responsibilities:

- Track companion slots and ownership.
- Enforce a max companion count per player.
- Register crafted robotic fighters.
- Register tamed Zerg.
- Register resurrected Zerg.
- Destroy owned companions on player death.

Core state:

```text
CompanionActive[index]
CompanionOwner[index]
CompanionType[index]
CompanionUnit[index]
CompanionControlMode[index]
```

---

### `systems/resources.eps`

Right-click harvesting and resource nodes.

Gameplay rule:

- Right-click to harvest.
- A Ghost cannot fire and harvest at the same time.
- Trees, bushes, rocks, crystals, and organic growth all produce minerals and vespene gas.
- Mining is continuous: every few seconds the active node trickles in its mineral/gas yield.
- Each resource type has a different mineral/gas bias.

Responsibilities:

- Index preplaced candidate resource markers.
- Randomly activate weighted resource nodes.
- Detect player harvesting command/state.
- Lock out firing/weapon behavior while harvesting.
- Award minerals and vespene gas every few seconds while harvesting continues.
- Deplete/remove resource nodes.

Core state:

```text
HarvestTarget[player]
HarvestProgress[player]
IsHarvesting[player]
ResourceNodeType[node]
ResourceMineralYield[node]
ResourceGasYield[node]
ResourceTickFrames[node]
ResourceNodeValue[node]
ResourceNodeRemaining[node]
```

Implementation note:

The exact right-click detection may need experimentation with CUnit order fields. Start with a compile-tested simple version, then validate in-game.

---

### `systems/critters.eps`

Neural critter hunt system.

Gameplay rule:

- Rare neural critters act like moving high-value resources.
- They flee from nearby Ghosts and can escape if chased badly.
- Players must stun or trap them before harvesting.
- Stunned critters create a short reward window for neural biomass/minerals/gas.

Responsibilities:

- Track active critters and state: idle, fleeing, stunned, harvested, escaped.
- Detect nearby players and choose flee behavior.
- Accept stun hooks from weapons/abilities/structures.
- Let the resource system harvest only stunned critters.
- Despawn or relocate critters that flee for too long.

Core state:

```text
CritterActive[critter]
CritterState[critter]
CritterFleeTimer[critter]
CritterStunTimer[critter]
CritterReward[critter]
CritterThreatPlayer[critter]
```

Important functions:

```text
initCritters()
updateCritters()
spawnNeuralCritter(x, y, reward)
tryStunCritter(player, critter)
tryHarvestCritter(player, critter)
```

---

### `systems/weapons.eps`

Crafted weapon ownership and active weapon swapping.

Gameplay rule:

- Players craft weapons.
- Only one active weapon at a time.
- Crafted weapons remain unlocked.
- Crafted weapons can be upgraded.
- Active weapon replaces default Ghost attack via the player's unique DAT weapon.

Responsibilities:

- Craft weapon if player pays cost.
- Switch active weapon.
- Apply weapon DAT stats for active weapon + upgrade level.
- Prevent cross-player stat collisions.

Core state:

```text
UnlockedWeapon[player][weaponType]
ActiveWeapon[player]
WeaponLevel[player][weaponType][upgradeType]
```

Important functions:

```text
craftWeapon(player, weaponType)
switchWeapon(player, weaponType)
applyWeaponDat(player)
```

---

### `systems/upgrades.eps`

Player stat and weapon upgrades.

Responsibilities:

- Define purchasable upgrades.
- Check mineral cost.
- Increase upgrade level.
- Apply upgrades to player-specific `TrgUnit` and `Weapon` DAT entries.

Upgrade families:

- Hero health
- Armor
- Shields
- Energy
- Movement/mobility
- Weapon damage
- Weapon fire rate
- Weapon range
- Weapon splash/behavior
- Utility/building upgrades

Core state:

```text
HeroUpgradeLevel[player][upgradeType]
WeaponUpgradeLevel[player][weaponType][upgradeType]
```

Important functions:

```text
purchaseUpgrade(player, upgradeId)
applyHeroUpgradeDat(player)
applyWeaponUpgradeDat(player, weaponType)
```

---

### `systems/structures.eps`

Player-built structure lifecycle.

Structures:

- Light source
- Wall
- Regeneration station
- Turret

Responsibilities:

- Build structure from menu/action.
- Track owner of each structure.
- Deconstruct structures.
- Refund minerals as designed.
- Destroy all owned structures on player death.

Core state:

```text
StructureOwner[structureIndex]
StructureType[structureIndex]
StructureCUnit[structureIndex]
StructureAlive[structureIndex]
```

Important functions:

```text
buildStructure(player, type, location)
deconstructStructure(player, structure)
destroyPlayerStructures(player)
```

---

### `systems/lights.eps`

Light and spawn prevention system.

Gameplay rule:

- Light sources gradually brighten the nearby screen.
- Light prevents mobs from spawning nearby.

Responsibilities:

- Track active lights.
- Compute whether a position is inside a light/no-spawn radius.
- Trigger local brightness/display effects for nearby players.
- Expose `isSpawnBlockedAt(x, y)` to mob spawning.

Core state:

```text
LightCUnit[index]
LightOwner[index]
LightRadius[index]
LightPower[index]
```

Important functions:

```text
updateLights()
isPositionLit(x, y)
isSpawnBlockedAt(x, y)
getLocalBrightness(player)
```

Implementation note:

Screen brightness may require local-player-safe display/vision effects. Be careful not to let local-only state affect synchronized gameplay.

---

### `systems/mobs.eps`

Area-based mob spawning and respawn.

Responsibilities:

- Divide the 256x256 tile map into 16x16 tile areas: 16 columns × 16 rows = 256 areas.
- Index preplaced Flag placeholder units as spawn markers at map start.
- Store spawn marker x/y positions and map each marker to its area.
- Track mob density, player presence, cooldown, threat budget, and light level per area.
- Spawn mobs when an active area is below target density.
- Despawn or drain idle pressure in fully lit areas.
- Increase spawn intensity at night.
- Avoid spawning inside lit/no-spawn areas.
- Scale for 1–5 players.

Core state:

```text
AreaCurrentDensity[area]
AreaTargetDensity[area]
AreaThreatBudget[area]
AreaSpawnCooldown[area]
AreaPlayerPresence[area]
AreaLightLevel[area]
AreaSpawnStart[area]
AreaSpawnCount[area]
SpawnMarkerX[index]
SpawnMarkerY[index]
SpawnMarkerArea[index]
SpawnMarkerActive[index]
```

Important functions:

```text
indexMobSpawnMarkers()
refreshAreaPlayerPresence()
refreshAreaLightLevels()
updateMobs()
spawnMobInArea(area)
canSpawnAt(x, y)
getAreaSpawnBudget(area)
```

---

### `systems/mob_evolution.eps`

Enemy tier progression.

Gameplay rule:

- Mobs evolve Black → Brown → Orange → Red.
- Mostly time-based.
- Can be accelerated by kills/exploration.
- Name/color communicates tier.

Responsibilities:

- Track global and/or per-family tier.
- Apply DAT changes to mob units/weapons.
- Update names/colors where possible.
- Expose current tier to spawn system and UI.

Core state:

```text
GlobalMobTier
MobFamilyTier[family]
EvolutionPressure
```

Tier sources:

```text
Time survived
Night count
Kill count
Exploration milestones
Optional player upgrade score
```

Important functions:

```text
updateMobEvolution()
addEvolutionPressure(amount)
applyMobTierDat(family, tier)
```

---

### `systems/menus.eps`

Deep player menu system.

Responsibilities:

- Route player input.
- Show menu pages.
- Let players craft, upgrade, transfer resources, build/deconstruct, toggle camera, and view status.

Menu pages:

```text
Main
Weapons
Weapon upgrades
Hero upgrades
Structures
Resource transfer
Camera/options
Status/help
```

Core state:

```text
MenuOpen[player]
MenuPage[player]
MenuCursor[player]
MenuContext[player]
```

Important functions:

```text
openMenu(player)
closeMenu(player)
handleMenuInput(player)
renderMenu(player)
```

---

### `systems/transfers.eps`

Team mineral sharing.

Responsibilities:

- Send minerals to another player.
- Validate sender has enough.
- Provide feedback to both players.

Core state:

```text
TransferTarget[player]
TransferAmount[player]
```

Important functions:

```text
sendMinerals(fromPlayer, toPlayer, amount)
```

---

### `systems/audio.eps`

Player feedback sounds.

Responsibilities:

- Low HP heartbeat.
- Hurt sound when taking damage.
- Optional Ghost breathing.
- Rate-limit sounds to avoid spam.
- Keep local-only audio local.

Core state:

```text
LastHp[player]
LastHurtSoundFrame[player]
HeartbeatCooldown[player]
```

Important functions:

```text
updateAudioFeedback(player)
playLowHpHeartbeat(player)
playHurtSound(player)
```

---

### `systems/camera.eps`

Optional camera follow.

Responsibilities:

- Camera is free by default.
- Player can toggle camera follow.
- If enabled, center view on their Ghost at a reasonable interval.

Core state:

```text
CameraFollowEnabled[player]
CameraUpdateCooldown[player]
```

---

### `systems/victory.eps`

Win/endless/final boss handling.

Responsibilities:

- Detect night 5 survived.
- Start final boss if enabled.
- Trigger victory when boss dies or survival condition completes.
- Optionally allow endless continuation.

Core state:

```text
VictoryState
FinalBossSpawned
EndlessModeEnabled
```

States:

```text
RUNNING
FINAL_BOSS
VICTORY
ENDLESS
DEFEAT
```

## Data-Driven Definitions

### Weapon Definition Shape

```text
WeaponType
DisplayName
CraftCost
BaseDamage
BaseCooldown
BaseRange
SplashInner
SplashMiddle
SplashOuter
CanHitAir
CanHitGround
RoleDescription
```

### Upgrade Definition Shape

```text
UpgradeId
DisplayName
Category
MaxLevel
CostBase
CostScale
RequiresWeaponType optional
ApplyFunction
```

### Mob Definition Shape

```text
MobFamily
BaseUnit
BaseWeapon
Role
TierName[4]
TierColor[4]
TierHp[4]
TierArmor[4]
TierDamage[4]
TierCooldown[4]
TierRange[4]
TierSpeed[4]
SpecialBehavior[4]
```

### Structure Definition Shape

```text
StructureType
DisplayName
Cost
RefundPercent
MaxOwnedPerPlayer
BuildTime
Hp
Behavior
```

### Resource Definition Shape

```text
ResourceType
DisplayName
CandidateMarkerUnit
SelectionWeight
HarvestTime
MineralReward
RespawnRule
```

## Implementation Order

### Milestone 1 — Compileable Harness

- Add final source tree.
- `main.eps` imports systems.
- All init/update functions exist as stubs.
- Compile succeeds.

### Milestone 2 — Player Slot + DAT Prototype

- Allocate P1–P5 hero unit IDs.
- Allocate weapon IDs.
- Apply per-player hero and weapon DAT at game start.
- Confirm P1/P2 can have different weapon damage/HP.

### Milestone 3 — Day/Night + Victory Clock

- Implement 22-minute day/night timer.
- Count nights survived.
- Add debug display.
- Trigger victory placeholder after night 5.

### Milestone 4 — Harvest Prototype

- Right-click resource detection.
- Continuous mining tick: minerals and vespene gas trickle in every few seconds.
- Resource type yield profiles: mineral-heavy, gas-heavy, and balanced nodes.
- Harvest lockout: cannot fire while harvesting.
- Deplete resource.

### Milestone 5 — Weapon Craft + Swap

- Craft two weapons.
- One active weapon at a time.
- Weapon swap applies DAT correctly.

### Milestone 6 — Upgrades

- Weapon damage upgrade.
- Weapon range upgrade.
- Hero HP/armor upgrade.
- Costs and menus.

### Milestone 7 — Structures + Lights

- Build/deconstruct light source.
- Light no-spawn radius.
- Add wall, regen station, turret.
- Destroy owned structures on death.

### Milestone 8 — Mobs + Evolution

- Area spawn zones.
- Day/night spawn intensity.
- Black/Brown/Orange/Red tier DAT changes.
- Expanded Zerg roster.

### Milestone 9 — Team/Polish

- Mineral transfer.
- Audio feedback.
- Camera follow toggle.
- Final boss or endless mode branch.

## Key Risks / Unknowns

1. Right-click harvesting detection needs in-game validation.
2. Local brightness effects must not desync gameplay state.
3. Safe unit/weapon DAT ID allocation needs deliberate testing.
4. Mob color/name changes may need different implementation depending on engine limitations.
5. Menu input method needs to be chosen early.
6. Area respawn must avoid unfair spawns inside player-lit pockets.
