# Jungle Survival Map Backlog

## Vision

A cooperative commando-survival StarCraft map set in a jungle. Each player controls their own Ghost-style hero, harvests resources, upgrades over time, survives evolving mobs, and stays mobile while building/deconstructing temporary structures.

Core fantasy: **small-team commandos scavenging, upgrading, and surviving escalating jungle threats.**

## Gameplay Pillars

1. **Player-specific hero progression**
   - Each player controls their own Ghost unit.
   - Each player has independent stats and weapon upgrades.
   - Progression should feel personal: health, armor, shields, energy, weapon behavior, damage, range, speed, etc.

2. **Mobile survival**
   - Players are mostly on the move.
   - Some structures can be built, but should be temporary and recoverable.
   - Everything player-built should be deconstructable.

3. **Evolving jungle threat**
   - Mobs start weak.
   - Mobs evolve over time through DAT changes, weapon swaps, speed changes, color changes, and unit variants.
   - Visual state should communicate danger level clearly.

4. **Resource cooperation**
   - Simple economy: everything gives minerals, with different reward amounts.
   - Players need a way to send resources to each other.
   - Resource spawns should be randomized but map-authored via candidate locations.

5. **Deep upgrade/menu systems**
   - Rich player choices.
   - Upgrade menus should support many options without becoming painful to use.
   - Needs room for expansion.

## Feature Backlog

### P0 — Core Prototype

#### Player Ghost ownership

- Each active player owns/controls one Ghost-style hero.
- Hero should be persistent and easy to reference by player.
- Define supported player count early, probably 1–6 or 1–8.

Acceptance criteria:

- Each player starts with exactly one controllable hero.
- Hero identity is tracked per player.
- Death/respawn/revive behavior is defined, even if simple.

#### Player-specific DAT unit IDs

- Allocate a unique unit ID per player for their hero variant.
- Example: P1 Ghost uses one unit DAT entry, P2 Ghost uses another, etc.
- This allows per-player health/armor/shield/energy/speed/stat upgrades without clashing.

Acceptance criteria:

- P1 and P2 can have different max HP/armor/etc. at the same time.
- Updating P1 hero DAT does not affect P2 hero.

#### Player-specific weapon IDs

- Allocate a unique weapon ID per player for the hero weapon.
- This allows per-player damage/range/cooldown/splash/targeting upgrades.

Acceptance criteria:

- P1 and P2 can have different weapon damage/cooldown/range at the same time.
- Updating P1 weapon DAT does not affect P2 weapon.

#### Simple resource reward system

- All kill/harvest/resource actions award minerals.
- Different sources give different mineral amounts.

Acceptance criteria:

- Weak mobs give a small amount.
- Strong mobs/resources give larger amounts.
- Rewards are visible enough for testing.

### P1 — Survival Loop

#### Evolving mobs

- Mobs start weak and evolve over time.
- Evolution can include:
  - DAT stat changes
  - unit color changes
  - weapon changes
  - movement speed changes
  - different unit compositions

Acceptance criteria:

- At least three threat tiers exist.
- Tier changes are visible in-game.
- Mob strength scales without requiring preplaced copies of every variant everywhere.

#### Area respawn approach for mobs

- Mobs respawn by area/zone rather than only fixed spawn points.
- Respawn rules should keep pressure on players without feeling unfair.

Acceptance criteria:

- Each jungle area can maintain a target mob density.
- Mobs respawn after clearing but not directly on top of players unless intended.

#### Candidate resource locations

- Preplaced units mark candidate resource locations.
- Runtime logic randomly selects which candidates become active resources.
- Selection uses weighted randomness.

Acceptance criteria:

- Designers can place candidate markers in the map editor.
- Each candidate can have a type/weight.
- A new run produces varied resource placement.

#### Deconstructable structures

- Some structures are buildable.
- All player-built structures can be deconstructed.
- Deconstruction should refund minerals partially or fully, depending on balance.

Acceptance criteria:

- Player can build at least one utility structure.
- Player can deconstruct it reliably.
- Deconstructing prevents permanent base turtling from becoming mandatory.

### P2 — Team Systems

#### Send resources to other players

- Players can transfer minerals to teammates.
- Needs a low-friction UI/menu flow.

Acceptance criteria:

- P1 can send minerals to P2.
- Transfer validates affordability.
- Sender and recipient get feedback.

#### Deep menus

- Menu system supports many upgrade categories and actions.
- Should be navigable under pressure.

Possible categories:

- Weapon upgrades
- Survivability upgrades
- Energy/ability upgrades
- Utility/building unlocks
- Team/resource actions
- Help/status pages

Acceptance criteria:

- Menu has nested categories.
- Player can back/cancel quickly.
- Repeated upgrade purchase is not tedious.

#### Lots of upgrade options

Potential upgrade families:

- Weapon damage
- Weapon cooldown
- Weapon range
- Weapon behavior/type
- Splash/radius
- Hero max HP
- Armor
- Shields
- Shield regen
- Energy max/regeneration
- Movement speed
- Vision range
- Special abilities
- Resource harvesting bonuses
- Structure unlocks

Acceptance criteria:

- Upgrade data is table-driven where possible.
- Adding an upgrade should not require rewriting menu logic.

### P3 — Feedback and Polish

#### Low HP audio feedback

- Heartbeat SFX when low HP.
- Damage SFX when hurt.
- Optional Ghost breathing audio for atmosphere.

Acceptance criteria:

- Low HP heartbeat only plays for affected player.
- Hurt SFX does not spam unbearably.
- Audio intensity communicates danger.

#### Exploding death units

- Some mobs explode on death.
- Example: plague/explosion mob that damages or applies an effect when killed.

Acceptance criteria:

- At least one mob type has death explosion behavior.
- Explosion is readable and avoidable/counterplay exists.

## Open Design Questions

1. Supported player count: 4, 6, or 8?
2. Which unit IDs are safe/acceptable to repurpose for player hero variants?
3. Which weapon IDs are safe/acceptable to repurpose for player-specific weapons?
4. Should upgrades be permanent per run only, or saved somehow between sessions?
5. Should players have one hero life, timed respawn, or teammate revive?
6. Should structures be built through classic build commands, menus, or unit placement abilities?
7. How punishing should deconstruction be: full refund, partial refund, or delayed reclaim?
8. How random should resource placement be versus designer-authored predictable zones?
9. Should mobs evolve globally over time, per-area, or based on player progress?
10. How much information should the web balance dashboard display to players versus designers?
