# euddraft Balance Lab

Static GitHub Pages placeholder for displaying StarCraft/euddraft map balance data.

## Local preview

Because the page fetches `data/balance.json`, serve it with a tiny static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Data

Replace `data/balance.json` with generated exports from epScript/euddraft tooling.

Planned sections:

- Unit DAT patches
- Weapon DAT patches
- Tech and upgrade costs
- Version-to-version balance diffs
