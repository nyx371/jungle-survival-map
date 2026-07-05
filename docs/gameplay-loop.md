# Jungle Survival Gameplay Loop

## Core Pitch

Jungle Survival is a tactical co-op Ghost survival map for 1–5 players. Each player controls one Ghost commando, scavenges a hostile jungle, crafts weapons, can assemble a small companion squad, builds temporary safe pockets, and survives an evolving Zerg ecosystem across multiple day/night cycles.

The map should feel tense and tactical: players are stronger together, but every expansion decision risks pulling the squad deeper into danger.

## Objective

Survive long enough to make it through **five nights**.

- One day: 22 minutes
- One night: 22 minutes
- Initial target: survive 5 nights
- Possible finale: final boss before victory/extraction
- Future layer: endless mode after the main survival objective

The game gets progressively harder over time.

## Loop Summary

1. **Day begins**
   - Players scout, harvest, craft, upgrade, and build temporary safety.
   - Pressure exists, but is not constant.

2. **Players harvest resources**
   - Trees, bushes, rocks, crystals, and organic growth all produce minerals and vespene gas.
   - Harvesting is continuous: right-click a node and resources trickle in every few seconds while the Ghost keeps working.
   - Each resource type has a different mineral/gas bias: trees and rocks lean minerals, crystals lean vespene, bushes and organic growth sit between them.
   - A Ghost cannot fire and harvest at the same time.

3. **Players hunt neural critters**
   - Rare neutral critters carry valuable neural biomass.
   - They run away from nearby Ghosts and may escape/despawn if pressured badly.
   - Players need to stun, trap, or coordinate around them before harvesting.
   - Stunned critters create a short high-value reward window.

4. **Players spend resources**
   - Craft weapons with mineral/gas costs.
   - Upgrade Ghost stats.
   - Upgrade crafted weapons.
   - Build lights, walls, regeneration stations, and turrets.
   - Send minerals or vespene gas to teammates.

5. **Night arrives**
   - Mob pressure intensifies.
   - Light matters more.
   - Players must use positioning, teamwork, and prepared structures to survive.

6. **The jungle escalates**
   - Zerg mobs evolve primarily by time.
   - Player actions such as heavy killing or deep exploration can accelerate threat scaling.
   - Enemy names and colors communicate threat level: Black → Brown → Orange → Red.

7. **The squad relocates**
   - Players can deconstruct structures and move on.
   - Staying in one place forever should become unsafe.

8. **Repeat until extraction/survival win**
   - Survive five nights, potentially with a final boss before victory, with possible endless continuation later.

## Player Death

Death should punish mistakes without removing players from the run.

When a Ghost dies:

- The player respawns at a random position.
- The player loses most carried minerals and vespene gas.
- All structures built by that player are destroyed/lost.
- All robotic, tamed, or resurrected companion units owned by that player die.
- The player keeps upgrades and progression.

This creates risk and tension while preserving long-term build identity.

## Combat Feel

The map should not be constant pressure at all times. Instead:

- Pressure comes in waves.
- Nights are more intense than days.
- Players should feel hunted when low HP or separated.
- Skilled Ghost control matters.
- Collaboration should feel naturally valuable, not forced.

The target fantasy: being low HP, hearing danger cues, chased by mobs through the jungle, and needing your squad to help you recover.

## Movement and Camera

- Movement is fully open; players can roam freely.
- No fixed lane or forced path.
- Camera is not locked to the player by default.
- Optional camera follow can be enabled.

## Structures

Structures are tactical tools, not permanent bases.

Planned structures:

- **Light sources**
  - Gradually brighten the nearby screen area.
  - Prevent mobs from spawning nearby.
- **Walls**
  - Delay and redirect mobs.
- **Regeneration stations**
  - Recovery points for wounded players.
- **Turrets**
  - Defensive firepower for temporary holds.

Everything player-built can be deconstructed.

## Weapons

Players craft weapons that replace the default Ghost attack.

Rules:

- One active weapon at a time.
- Crafted weapons remain available.
- Players can switch back to crafted weapons.
- Crafted weapons can be upgraded after unlocking.

This supports personal combat roles while keeping the hero unit simple to control.

## Scaling

The map should scale from 1–5 players.

Scaling dimensions:

- Mob counts
- Respawn density
- Night wave intensity
- Resource availability
- Threat evolution speed

The goal is for solo play to be possible, but teamwork to feel much stronger.
