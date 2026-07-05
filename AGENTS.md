# AGENTS.md - Jungle Survival Map

## Repository Workflow

- This repo is `nyx371/jungle-survival-map` and publishes to the GitHub Pages site at `https://nyx371.github.io/jungle-survival-map/`.
- Push changes directly to `main` immediately.
- GitHub Pages currently serves from the `gh-pages` branch because the legacy `main /` Pages deploy path wedged on 2026-07-05. After site changes, also mirror the same commit/content to `gh-pages` with `git push origin HEAD:gh-pages` and verify the live page.
- Do not open PRs for this repo unless K explicitly asks for one.
- After code/UI/content changes, run the smallest meaningful validation before pushing, for example:
  - `node --check app.js`
  - parse/check `index.html`
  - validate JSON files in `data/`
  - serve locally and fetch `/`, `styles.css`, and `app.js` when practical
- Include the current Discord/thread context in commit messages or notes when it helps explain the change.

## Product Notes

- The site is both a design/planning page and source browser for the Jungle Survival StarCraft map.
- Keep Home/System visuals mobile-friendly and readable.
- Prefer concrete gameplay diagrams, symbols, and visual callouts over plain text when explaining key systems.
