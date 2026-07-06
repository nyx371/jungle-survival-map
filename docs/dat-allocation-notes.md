# DAT Allocation Notes

## Why unique DAT IDs per player?

StarCraft DAT edits are global. If every player uses `Terran Ghost` and `C-10 Concussion Rifle`, then changing that unit or weapon changes it for everyone.

Jungle Commandos wants player-specific progression, so each player should get:

- a unique hero unit DAT ID
- a unique weapon DAT ID

That lets Player 1 upgrade damage, cooldown, HP, armor, shields, energy, etc. without changing Player 2.

## Example Pattern

```js
const p1Hero = TrgUnit("Terran Ghost");
const p1Weapon = Weapon("C-10 Concussion Rifle");

const p2Hero = TrgUnit("Sarah Kerrigan");
const p2Weapon = Weapon("Gauss Rifle");

p1Hero.groundWeapon = p1Weapon;
p1Hero.airWeapon = p1Weapon;
p2Hero.groundWeapon = p2Weapon;
p2Hero.airWeapon = p2Weapon;

p1Hero.maxHp = 80 * 256;
p2Hero.maxHp = 120 * 256;

p1Weapon.damage = 10;
p2Weapon.damage = 16;
```

## Known eudplib DAT wrappers

### `TrgUnit`

Useful fields include:

- `maxHp`
- `hasShield`
- `maxShield`
- `armor`
- `groundWeapon`
- `airWeapon`
- `seekRange`
- `sightRange`
- `mineralCost`
- `gasCost`
- `timeCost`
- `supplyUsed`
- `supplyProvided`
- `baseProperty`
- `groupFlags`
- `sizeType`
- `flingy`
- `nameString`

### `Weapon`

Useful fields include:

- `damage`
- `damageBonus`
- `cooldown`
- `minRange`
- `maxRange`
- `targetFlags`
- `damageType`
- `behavior`
- `explosionType`
- `splashInnerRadius`
- `splashMiddleRadius`
- `splashOuterRadius`
- `damageFactor`
- `flingy`
- `icon`

### Other wrappers

- `Flingy` for movement-like data such as `topSpeed`, `acceleration`, `turnSpeed`.
- `Sprite` for image/visibility links.
- `Image` for graphics/iscript behavior.
- `Tech` for tech costs/energy/requirements.
- `Upgrade` for upgrade costs/levels/requirements.

## Allocation TODO

Before serious implementation, create an allocation table:

| Slot | Player | Hero Unit ID | Weapon ID | Notes |
| --- | --- | --- | --- | --- |
| 1 | P1 | TBD | TBD | |
| 2 | P2 | TBD | TBD | |
| 3 | P3 | TBD | TBD | |
| 4 | P4 | TBD | TBD | |
| 5 | P5 | TBD | TBD | |
| 6 | P6 | TBD | TBD | |

The same should be done for mob evolution unit IDs and special weapons.
