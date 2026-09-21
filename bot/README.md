# TarbooBot — AXION

WhatsApp Multi-Device bot. 897 plugins · 1201 commands · 36 categories.

## Quick start

```bash
cp .env.example .env     # fill in your own keys
npm ci
npm test                 # syntax sweep + full local test suite
npm start
```

Run under a supervisor in production — the memory monitor exits at 1 GB RSS by design:

```bash
pm2 start index.js --name tarboobot
```

## Before you deploy

1. Set `config.owner.number` to **your own** number.
2. Set `config.session.pairingNumber` to the number the bot runs on.
3. Keep `MAROBOT_DEV_CONSOLE` and `MAROBOT_DEV_SHELL` set to `false` — they enable
   arbitrary code and shell execution.
4. Keep `config.autoJoin.enabled` `false` unless you deliberately want the bot to
   follow channels / join groups on first boot.

## Scripts

| Script | What it does |
|---|---|
| `npm test` | syntax sweep over every source file, then the full local suite |
| `npm run test:live` | tests that need network / provider credentials |
| `npm run lint` | ESLint (0 errors expected) |
| `npm run inventory` | writes `reports/command-inventory.json` from the live registry |
| `npm run parity` | proves no command or alias was lost against the baseline |
| `npm run audit:static` | static import/asset audit |

## UI

The presentation layer lives in `src/lib/ui/` and is driven by `config.ui`.

```js
ui: {
  engine: "axion",                 // "legacy" restores the original menus
  typography: { mode: "luxury" },  // "compact" | "plain"
  identity: { brandName: "AXION", /* … */ },
}
```

Everything renders through `ui.*` primitives — never hand-rolled frames. Styling is
display-only: command ids, aliases, URLs, JIDs, phone numbers, paths and code are
never transformed. Use `style.strip()` before comparing or searching styled text.

## Reports

`reports/` holds the audit output: command inventory and parity, plugin inventory and
collisions, import health, security audit, dependency audit, UI migration, test
summary, and `final-audit.md`.
