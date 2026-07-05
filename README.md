# Jungle Survival Map

Tactical co-op Ghost survival map concept for StarCraft/euddraft/epScript.

Players survive five escalating nights in the jungle by continuously mining minerals and vespene gas, crafting weapons, building lighted safe pockets, and fighting evolving Zerg-based mobs.

## Live site

<https://nyx371.github.io/jungle-survival-map/>

## Current focus

This repo currently contains:

- a static GitHub Pages design site
- gameplay loop and feature documentation
- a code systems architecture map
- epScript skeleton modules for the main gameplay systems

The epScript source is an implementation map, not yet a compile-ready euddraft project. The next milestone is a compileable `.eds` harness and one vertical slice.

## Important docs

- [`docs/gameplay-loop.md`](docs/gameplay-loop.md)
- [`docs/implementation-plan.md`](docs/implementation-plan.md)
- [`docs/code-systems-map.md`](docs/code-systems-map.md)
- [`docs/important-systems.md`](docs/important-systems.md)
- [`docs/backlog.md`](docs/backlog.md)
- [`docs/dat-allocation-notes.md`](docs/dat-allocation-notes.md)

## Source layout

```text
src/
  main.eps
  core/
    constants.eps
    dat_registry.eps
  systems/
    players.eps
    day_night.eps
    resources.eps
    critters.eps
    weapons.eps
    upgrades.eps
    structures.eps
    lights.eps
    mobs.eps
    mob_evolution.eps
    menus.eps
    transfers.eps
    audio.eps
    camera.eps
    victory.eps
```

## Local preview

Serve the static site locally:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.
