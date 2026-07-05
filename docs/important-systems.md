# Important Systems — Detailed Implementation Plan

This file expands the systems that matter most for making Jungle Survival feel like a real tactical survival map.

## 1. Day/Night Director

The day/night director is the pacing spine of the map.

### Player-facing behavior

- The game alternates between day and night.
- Day lasts 22 minutes.
- Night lasts 22 minutes.
- Players win after surviving 5 nights.
- A final boss may trigger after night 5 before victory.
- Nights are more dangerous than days.
- Enemy evolution and wave intensity increase as the run progresses.

### Internal responsibilities

- Maintain the global clock.
- Track whether the game is currently day or night.
- Track current day number and nights survived.
- Provide difficulty multipliers to mob spawning.
- Signal the victory system when night 5 ends.

### Main state

```text
GlobalFrame
CycleFrame
IsNight
CurrentDay
CurrentNight
NightsSurvived
NightIntensity
VictoryPending
```

### Update logic

```text
Every frame:
  GlobalFrame += 1
  CycleFrame += 1

  If day and CycleFrame >= DAY_FRAMES:
    Start night
    Increase night intensity
    Notify mobs/audio/UI

  If night and CycleFrame >= NIGHT_FRAMES:
    End night
    NightsSurvived += 1
    If NightsSurvived >= 5:
      Notify victory system
    Else:
      Start day
```

### Important tuning knobs

- Day duration
- Night duration
- Night spawn multiplier
- Night evolution pressure
- Final boss enabled/disabled
- Endless mode enabled/disabled

---

## 2. Player Hero / Death / Respawn

This system owns the player’s Ghost identity and consequences for death.

### Player-facing behavior

- Each player controls one Ghost hero.
- The Ghost keeps upgrades after death.
- On death:
  - respawn at a random position
  - lose most carried minerals
  - lose all structures built by that player
  - keep crafted weapons and upgrades

### Internal responsibilities

- Track each player’s hero CUnit.
- Detect hero death.
- Start respawn flow.
- Apply death penalties.
- Recreate/move hero at a random valid respawn point.
- Tell structures system to destroy owned structures.
- Tell audio/UI systems to reset danger feedback.

### Main state

```text
HeroCUnit[player]
HeroAlive[player]
RespawnTimer[player]
DeathsThisRun[player]
LastKnownPosition[player]
```

### Update logic

```text
For each active player:
  If hero exists and is alive:
    Track CUnit pointer and position
  Else if hero was alive last frame:
    Mark dead
    Apply mineral and gas loss
    Destroy owned structures
    Start respawn timer
  Else if respawn timer complete:
    Spawn hero at random valid respawn point
    Reapply DAT-driven player stats
```

### Design notes

Death should hurt enough that players fear it, but not reset the whole build. Losing structures plus most carried minerals and gas creates tactical cost while preserving long-term progression.

---

## 3. Resource Harvesting

This system creates the basic economy loop.

### Player-facing behavior

- Players harvest by right-clicking resources.
- Harvestables include:
  - trees
  - bushes
  - rocks
  - crystals
  - organic growth
- Every node produces both minerals and vespene gas.
- Mining is continuous: while the Ghost keeps harvesting, resources trickle in every few seconds.
- Resource types have different mineral/gas profiles: some are mineral-heavy, some gas-heavy, some balanced.
- A Ghost cannot fire and harvest at the same time.

### Internal responsibilities

- Spawn active resource nodes from candidate markers.
- Detect when a Ghost is harvesting a node.
- Lock out firing while harvesting.
- Add harvest progress and tick timer.
- Award mineral and vespene trickles per tick.
- Deplete/remove nodes as their combined value is mined out.
- Eventually respawn or reroll resources if desired.

### Main state

```text
ResourceNodeCUnit[node]
ResourceType[node]
ResourceRemaining[node]
ResourceMaxValue[node]
ResourceMineralYield[node]
ResourceGasYield[node]
ResourceTickFrames[node]
ResourceActive[node]

IsHarvesting[player]
HarvestTarget[player]
HarvestProgress[player]
HarvestLockout[player]
```

### Update logic

```text
For each player:
  Detect right-click/order target
  If target is a resource node:
    IsHarvesting = true
    Disable/neutralize weapon firing
    Count down harvest tick
    If tick completes:
      Add minerals and vespene from the node yield profile
      Reduce node remaining value
      Reset tick timer
      If depleted: remove node
  Else:
    IsHarvesting = false
    Restore normal weapon behavior
```

### Neural critter hunt mechanic

Neural critters are special neutral wildlife/resource units that turn harvesting into a small hunt.

#### Player-facing behavior

- Neural critters are rare, valuable moving resources.
- They run away from nearby Ghosts instead of waiting to be harvested.
- A fleeing critter can escape into the jungle or despawn if players chase poorly.
- Players must stun, trap, or coordinate around the critter before harvesting it.
- While stunned, the critter can be harvested for bonus neural biomass/minerals/gas.

#### Internal responsibilities

- Track active neural critter units and their state.
- Detect nearby players and switch critters into flee behavior.
- Detect stun effects from weapons/abilities/structures.
- Expose `tryStunCritter` and `tryHarvestCritter` hooks to weapons/resources.
- Despawn or relocate critters that flee too long.

#### Main state

```text
CritterCUnit[critter]
CritterActive[critter]
CritterState[critter]       // idle, fleeing, stunned, harvested, escaped
CritterFleeTimer[critter]
CritterStunTimer[critter]
CritterReward[critter]
CritterLastThreatPlayer[critter]
```

#### Update logic

```text
For each active critter:
  If stunned:
    Count down stun timer
    Allow harvesting
    If stun ends before harvest, resume fleeing
  Else if player is nearby:
    Move away from nearest/threatening player
    Increase flee timer
    If flee timer too high, escape/despawn
  Else:
    Wander/idle and slowly reset flee timer
```

### Risk

Right-click/order detection will require in-game validation against CUnit order fields. This should be one of the first prototypes. Critter flee/stun behavior also needs early prototype validation because StarCraft critter order control may require helper units, order resets, or a scripted movement approximation.

---

## 4. Weapon Crafting and Swapping

This system makes Ghost combat personal and build-driven.

### Player-facing behavior

- The default Ghost attack is replaced by crafted weapons.
- Players can craft multiple weapons.
- Only one weapon is active at a time.
- Crafted weapons remain unlocked.
- Crafted weapons can be upgraded.

### Initial weapon roles

```text
Rifle       Reliable baseline single-target weapon
Shotgun     Short-range burst / possible splash
Sniper      Long-range, slow, high damage
Explosive   Anti-pack splash weapon
Flamer/Acid Area-control concept
```

### Internal responsibilities

- Track unlocked weapons per player.
- Track active weapon per player.
- Check craft costs.
- Apply the selected weapon’s DAT values to the player’s unique weapon ID.
- Reapply weapon upgrades after switching.

### Main state

```text
UnlockedWeapon[player][weaponType]
ActiveWeapon[player]
WeaponCraftedAt[player][weaponType]
WeaponUpgradeLevel[player][weaponType][upgradeType]
```

### Update logic

```text
When player crafts weapon:
  Check minerals
  Mark weapon unlocked
  Optionally switch to new weapon
  Apply active weapon DAT

When player switches weapon:
  If unlocked:
    ActiveWeapon = weaponType
    Apply weapon DAT baseline
    Apply weapon upgrade levels
```

### Key implementation rule

Each player has their own weapon DAT ID. Never modify shared weapon data for player upgrades.

---

## 5. Upgrade System

This system creates long-term progression during the run.

### Player-facing behavior

Players spend minerals to improve their Ghost and weapons.

Upgrade categories:

- weapon damage
- weapon cooldown/fire rate
- weapon range
- weapon splash/behavior
- max health
- armor
- shields
- energy
- movement/vision
- utility/structures

### Internal responsibilities

- Define upgrade costs and max levels.
- Validate purchases.
- Store upgrade levels.
- Apply DAT changes to player-specific unit/weapon IDs.
- Update menus and dashboard data.

### Main state

```text
HeroUpgradeLevel[player][heroUpgrade]
WeaponUpgradeLevel[player][weaponType][weaponUpgrade]
```

### Update logic

```text
When upgrade purchased:
  Check current level < max
  Check mineral cost
  Subtract minerals
  Increase level
  If hero upgrade: apply hero DAT
  If weapon upgrade: apply active/crafted weapon DAT
```

### Design rule

Upgrade choices should be readable under pressure. Deep systems are good, but menus must surface clear choices.

---

## 6. Structures and Lights

This system controls tactical footholds without letting players turtle forever.

### Player-facing behavior

Players can build:

- light sources
- walls
- regeneration stations
- turrets

Everything can be deconstructed.

On death, all structures built by that player are lost.

### Light behavior

- Gradually brightens the nearby screen.
- Prevents mobs from spawning nearby.
- Makes night safer, but only locally.

### Internal responsibilities

- Build structures from menu/action.
- Track owner/type/CUnit.
- Deconstruct/refund structures.
- Destroy owned structures on player death.
- Maintain active light zones.
- Expose spawn-block checks to mob spawning.

### Main state

```text
StructureCUnit[index]
StructureOwner[index]
StructureType[index]
StructureAlive[index]
StructureRefundValue[index]

LightRadius[index]
LightPower[index]
LightNoSpawnRadius[index]
```

### Update logic

```text
When player builds:
  Check cost
  Create structure
  Store owner/type
  If light: register light radius

Every spawn attempt:
  If position inside active light no-spawn radius:
    Reject spawn

When player deconstructs:
  Remove structure
  Refund minerals

When player dies:
  Destroy all structures owned by player
```

### Risk

Brightness is likely local display logic, while spawn prevention is synchronized gameplay logic. Keep those separated to avoid desync.

---

## 7. Mob Spawning and Evolution

This system makes the jungle feel alive and increasingly hostile.

### Player-facing behavior

- The 256x256 tile map is divided into 16x16 tile areas, creating a 16x16 grid of 256 mob areas.
- Mobs spawn by area using map-authored spawn markers, not purely random coordinates.
- Pressure comes in waves.
- Nights are more dangerous.
- Mobs evolve over time.
- Enemy color/name shows threat tier:
  - Black
  - Brown
  - Orange
  - Red

### Mob families

- Drone
- Broodling
- Zergling
- Hydralisk
- Lurker
- Queen
- Mutalisk
- Guardian
- Defiler
- Ultralisk

### Internal responsibilities

- Index preplaced Flag placeholder units on map start.
- Store each marker position in arrays mapped to its 16x16 area.
- Track area density, player presence, spawn cooldown, and light level.
- Spawn mobs if an area is below target density and has valid unlit markers.
- Despawn or drain idle mobs in fully lit areas.
- Block spawning near lights.
- Scale spawn pressure for 1–5 players.
- Apply evolution tiers using DAT changes.
- Add evolution pressure from time, kills, and exploration.

### Main state

```text
AreaTargetDensity[area]
AreaCurrentDensity[area]
AreaSpawnCooldown[area]
AreaThreatBudget[area]
AreaPlayerPresence[area]
AreaLightLevel[area]
AreaSpawnStart[area]
AreaSpawnCount[area]
SpawnMarkerX[index]
SpawnMarkerY[index]
SpawnMarkerArea[index]
SpawnMarkerActive[index]

GlobalMobTier
MobFamilyTier[family]
EvolutionPressure
NightSpawnMultiplier
```

### Update logic

```text
On map start:
  Scan preplaced Flag placeholder units
  Convert each flag position into a 16x16 area index
  Store marker x/y/area in spawn arrays
  Hide or remove placeholder flags

Every spawn tick:
  Refresh which area each living player is inside
  Refresh synchronized light suppression per area
  For each area:
    If fully lit: despawn/drain idle area mobs
    Else calculate target density
    Apply day/night multiplier
    Apply player count scaling
    If density below target and area should be active:
      Pick mob family
      Pick a Flag marker in that area not blocked by light
      Spawn mob

Every evolution tick:
  Add time pressure
  Add kill/exploration pressure
  If threshold crossed:
    Increase tier
    Apply DAT changes
```

---

## 8. Menus and Resource Transfers

Menus are the player’s interface to deep systems.

### Player-facing behavior

Players use menus to:

- craft weapons
- switch active weapon
- buy upgrades
- build/deconstruct structures
- send minerals to teammates
- toggle camera follow
- view status/help

### Internal responsibilities

- Track menu page/cursor/context per player.
- Route button/input choices.
- Call systems rather than implementing logic directly.

### Main state

```text
MenuOpen[player]
MenuPage[player]
MenuCursor[player]
MenuContext[player]
TransferTarget[player]
TransferAmount[player]
```

### Design rule

Menus should stay fast. The player may be under pressure while using them.

---

## 9. Audio and Camera Feedback

These systems improve tension and readability.

### Audio behavior

- Hurt sound when taking damage.
- Low HP heartbeat.
- Optional Ghost breathing.
- Sounds should be local and rate-limited.

### Camera behavior

- Free camera by default.
- Optional camera follow toggle.
- Follow should not fight the player too aggressively.

## Priority for First Real Prototype

1. Compileable harness.
2. Player Ghost tracking.
3. Day/night timer with debug text.
4. Right-click harvesting prototype.
5. One crafted weapon swap.
6. One hero upgrade and one weapon upgrade.
7. Light source no-spawn radius.
8. One mob family with Black/Brown/Orange/Red DAT changes.
