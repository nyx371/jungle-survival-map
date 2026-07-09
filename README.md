# Jungle Commandos Map

Tactical co-op Ghost survival map concept for StarCraft/euddraft/epScript.

Players survive five escalating nights in the jungle by continuously mining minerals and vespene gas, crafting weapons, building lighted safe pockets, and fighting evolving Zerg-based mobs.

## Live site

<https://nyx371.github.io/jungle-survival-map/>

## Current focus

This repo currently contains:

- a static GitHub Pages design site
- gameplay loop and feature documentation
- a code systems architecture map
- a compiling epScript/euddraft project for the main gameplay systems

The epScript source now compiles and builds cleanly end-to-end (`onPluginStart`/`beforeTriggerExec` across all systems) via `check-syntax.bat` / `jc.eds`, with a first working vertical slice: per-player hero creation and tracking, resource node placeholder replacement, a mining-order workaround with visual feedback, and debug screen output. Most individual systems still have real gameplay logic left as TODOs (see `docs/backlog.md`).

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
    utils.eps
  systems/
    players.eps
    day_night.eps
    resources.eps
    critters.eps
    companions.eps
    weapons.eps
    upgrades.eps
    abilities.eps
    structures.eps
    lights.eps
    mobs.eps
    mob_evolution.eps
    menus.eps
    transfers.eps
    camera.eps
    victory.eps
```

## Local preview

Serve the static site locally:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## epScript build check

`check-syntax.bat` compiles `src/main.eps` through euddraft against an isolated copy of the source map (never the live one) and reports a clean build or the first compile/runtime error:

```bash
./check-syntax.bat
```
