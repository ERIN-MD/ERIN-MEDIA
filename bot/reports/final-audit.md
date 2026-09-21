# TarbooBot — Full Re-engineering Audit

**Scope:** complete forensic audit, security hardening, defect repair and UI/UX replacement of TarbooBot v3.1.
**Rule applied throughout:** 100% functional parity, 100% new presentation layer.

---

## 1. Executive Summary

The project is a large, genuinely capable WhatsApp bot: **897 plugins, 1201 commands, 1258 aliases, 36 categories, 1129 source files**. Its architecture is sound and modular. Its security posture, before this work, was not.

Three findings compounded into a single critical chain: **any WhatsApp Channel the bot followed was treated as the bot owner**, the bot **silently followed seven hardcoded third-party channels on first boot**, and four **code-execution consoles** were gated only on that broken owner check. Together these gave the operators of those channels remote code execution on every deployment.

All of it is fixed and covered by regression tests. Separately, a global `uncaughtException` handler was found to be **silently swallowing every crash in the process** — including four test files that crashed mid-run yet reported success. Removing it turned a misleading "34/39 passing" into an honest baseline of 30/39, which is now **45/45**.

| | Before | After |
|---|---|---|
| Commands / aliases | 1199 / 1256 | **1201 / 1258** (0 lost) |
| Plugins loading | 895 / 897 | **897 / 897** |
| Module import failures | 2 | **0** (1068 modules scanned) |
| Tests genuinely passing | 30 / 39 | **45 / 45** |
| Lint errors | n/a (no config existed) | **0** (was 187 on first run) |
| Silent command collisions | 90, undetectable | 90, **fully reported** |
| Critical security findings | 4 open | **0 open** |

---

## 2. Architecture Findings

```
index.js → config.js → src/connection.js (Baileys socket, events)
                            ↓
                     src/handler.js (2200 lines, message pipeline)
                            ↓
                  maro-serialize.js (normalise + permissions)
                            ↓
                  maro-plugins.js (registry + dispatch)
                            ↓
              plugins/<category>/*.js  (897 files, 36 categories)
```

- The plugin loader is well documented but used `Map.set`, so duplicate command names **overwrote each other silently** and the winner depended on filesystem read order — non-deterministic across machines.
- `src/lib/agent-control.js`, `agent-health-memory.js`, `agent-plugin.js` were **test files misplaced into `src/lib/`**; their `../src/lib/...` specifiers resolved to `src/src/lib/` and they were dead.
- `maro-agent-tools.js` is genuinely well built (command allowlists, a correct path-traversal guard, secret redaction, write confirmation, automatic backups) and was left alone.

---

## 3. Commands & Aliases — Before / After

Measured mechanically by `tools/maro-inventory.mjs`, compared by `tools/maro-parity.mjs`.

```
PARITY PASS
  commands : 1199 -> 1201   (removed 0, added 2)
  aliases  : 1256 -> 1258   (removed 0, added 2)
  plugins  :  895 ->  897   (removed 0, added 2)
  import failures : 2 -> 0
  permission downgrades : 0
  added commands : تشويش, فلتر
```

Nothing was removed. The two additions are the two plugins that were **broken on arrival** and are now repaired. No permission was widened or narrowed on any plugin.

---

## 4. Plugin Status

- 897 / 897 load. 0 failures, 0 invalid configs, 0 missing handlers.
- **90 collisions across 78 keys** are now reported at boot instead of being silent (`reports/plugin-collisions.json`). Resolution remains last-loaded-wins; renaming them is a follow-up the owner should schedule, since renaming a command is a user-visible change.
- Repaired: `plugins/ai/تشويش.js` (imported a package absent from `package.json`), `plugins/ephoto/أبيضوأسود.js` (jimp v1 API).

---

## 5. Import Health

`reports/import-health.json`: **1068 modules scanned, 1068 imported, 0 failed.**
A leftover top-level debug IIFE in `src/scraper/upscaler.js` that ran on every import was removed.

---

## 6. Security Findings

Full detail with root causes and fixes in `reports/security-audit.json`. Summary:

| ID | Severity | Finding | Status |
|---|---|---|---|
| SEC-01 | CRITICAL | Any channel granted owner privileges (**two** independent root causes) | FIXED |
| SEC-02 | CRITICAL | Hidden auto-follow of 7 channels + auto-join of 2 groups | FIXED |
| SEC-03 | CRITICAL | Identity matching used `includes`/`endsWith` both ways | FIXED |
| SEC-04 | CRITICAL | **Seven** live credentials hardcoded across 5 files | FIXED — **rotation still required** |
| SEC-05 | HIGH | Four unguarded code-execution consoles | FIXED |
| SEC-06 | HIGH | Global handler swallowed every uncaught exception | FIXED |
| SEC-07 | HIGH | Per-user rate limiter was dead code | FIXED |
| SEC-08 | MEDIUM | Stack traces printed unconditionally | FIXED |
| SEC-09 | INFO | Owner number ≠ pairing number | **needs a human decision** |

Verified clean: no command injection, no inbound listener, no WhatsApp credential leakage, and a correct path-traversal guard in the agent tooling.

**On SEC-04, a correction worth recording.** My first scan used high-confidence provider
patterns and reported three keys, all in `config.js`. That was incomplete. GitHub push
protection rejected the push and named a **Cloudflare user API token** in
`plugins/ai/تخيل3.js`. Broadening the scan (provider prefixes, JWTs, and any
assignment-position opaque literal of 24+ characters) surfaced **four more**: the
Cloudflare account id and token, a Monica session JWT and client id, and a TopMedia key —
**seven in total across five files**. All are now read from environment variables and a
re-scan reports zero. The lesson stands in the report rather than being quietly fixed: a
narrow secret regex gives false assurance.

---

## 7. Dependency Findings

`npm audit`: **27 advisories — 2 critical, 11 high, 13 moderate, 1 low** (`reports/dependency-audit.json`).
Critical: `form-data` (CRLF injection), `request` (SSRF, deprecated). High includes `axios`, `adm-zip` (symlink traversal), `sharp`/libvips.
**Not auto-fixed** — several require major-version bumps of the WhatsApp/media stack and must be done deliberately with integration testing, not blind.

---

## 8. Database Safety

No schema change, no migration, no key rename, no data touched. `database/`, `data/` and `session/` are untouched and `session/` is empty. All stored identifiers, settings keys and plugin metadata property names are unchanged. `.gitignore` now excludes `session/`, `database` artifacts and `.env`.

---

## 9. Permission Audit

`checkPermission` short-circuits on `m.isOwner`, which makes owner identity the single most important boundary in the codebase — that is why SEC-01 and SEC-03 were rated critical. The permission *logic* was left exactly as designed; only the **identity resolution feeding it** was corrected. Per-plugin permission flags are byte-identical before and after (`reports/command-parity.json`: `permissionDowngrades: 0`).

---

## 10–13. UI/UX, Typography, Menu Engine

Full detail in `reports/ui-migration.json`.

**New identity — AXION.** Geometric marks (`◆ ◇ ▸ ▪ ⌁`), solid/dashed rules (`▰ ╌`), chip syntax `⟨ ⟩`, mono ordinals. **None** of the legacy `╭┈ ┃ ╰┈ ⬡` frame is reused — asserted by test.

**Typography is display-only and safe.** Latin gets Mathematical Alphanumerics; Arabic uses WhatsApp's own `*bold*`/`_italic_` because it has no reliable styled variants. Command ids, aliases, button ids, URLs, emails, JIDs, phone numbers, paths, code and stack traces are detected and **never** transformed. A documented gotcha: styled text uses different codepoints, so `style.strip()` exists for search/comparison and is asserted in tests.

**Menu engine** is registry-driven from the live `pluginStore` — no hardcoded command lists — with permission-aware display, pagination, Arabic-normalised search, and a cache keyed to registry size so plugin reloads invalidate it.

**Migration strategy:** centralised. Rather than editing 897 plugins for cosmetics (which would risk behaviour loss), the shared surfaces every plugin already flows through were migrated — `config.messages`, `config.errorTemplate`, `maro-formatter`, `maro-text-style`, and the handler's failure reply. All four menus were rebuilt on the engine.

**Rollback is real:** `config.ui.engine = "legacy"` routes the four menu commands back to the preserved originals in `plugins/main/_legacy/`, which the loader cannot see. Covered by `tests/ui-feature-flag.test.mjs`.

---

## 14–17. Tests

`reports/test-summary.json` — **46 total: 46 PASS, 0 FAIL, 0 SUSPECT, 0 env-blocked.**

The runner classifies a test that exits 0 **without printing anything** as `SUSPECT`, never as a pass — that is precisely how the removed exception handler produced false green runs.

Test-contract changes, each documented in the test file itself:

| Test | Classification | Why |
|---|---|---|
| `owner-bypass` | test bug | called `checkPermission` without `initDatabase`; threw, was swallowed |
| `ai-workspace-router` | stale contract | asserted the old routing table (`code → DeepSeek`); implementation now leads with Claude |
| `autoai-arabic-personas` | test bug + **real gap** | regex too literal; separately, `ليلى` was the only persona missing the restraint line every sibling has → **implementation fixed, test kept strict** |
| `ai-studio-behavioral`, `maro-fake-card`, `local-image-enhancement` | bad fixture | the embedded 1×1 PNG had a **corrupt IDAT CRC** (verified chunk-by-chunk); replaced with a valid one |
| `maro-brat` | test bug | expected an 18-character string not to wrap at `maxLength` 17 — arithmetically impossible; implementation was right |
| `autoai-always-reply`, `autoai-behavioral` | intentional contract update | `alwaysReply` is now derived from `replyMode`, and the status panel renders through the design system |
| `maro-text-style` | intentional contract update | asserted the **legacy visual identity**, which was deliberately replaced |

New tests added: `security-identity`, `ui-menu-engine`, `ui-feature-flag`, `registration-gate`, plus the three relocated agent tests.

Lint went from **187 errors to 0**. Those were real defects: missing `fs`/`path`/`te` imports (crash on use), a `const` reassignment, a `sendRgbPreview`/`sendRpgPreview` typo, `currentGroup` out of scope in two `catch` blocks, `item`/`sock` undefined in `market.js`, 16 duplicate object keys silently killing colour options, three switch fall-throughs that sent the user two replies, and an always-true `|| true` condition. `document`/`location` inside `page.evaluate()` were correctly identified as **false positives** and given browser globals rather than being "fixed".

---

## 17b. Post-delivery fix — total lockout for every non-owner user

Reported after delivery: the bot appeared completely unresponsive. Reproduced by
running the real `messageHandler` against a non-owner sender, which showed a
**deadlock that shipped in the original bot**:

- `config.registration.enabled` is `true`, so every command from a user who is
  not registered, not the owner and not premium is answered with
  *"التسجيل مطلوب — اكتب `.تسجيل`"* (`src/handler.js:1692`).
- **No plugin ever registered the name `تسجيل`.** `plugins/user/daftar.js`
  declared only `name: "daftar"`, `alias: ["register"]`.
- So: any command → "type `.تسجيل`" → `.تسجيل` does nothing → locked out.
  Worse, with a registration session already open, `.تسجيل` was swallowed as an
  *answer* to the session and stored as the user's name.

Verified present at the baseline commit, so this is pre-existing, not a
regression from this work. The lint warnings reported alongside it are style
signals only (0 errors) and never affected runtime.

**Fix:** `daftar` now also answers `تسجيل`, `التسجيل`, `سجل` and `انشاء_حساب` —
purely additive, no command or alias removed. Guarded by
`tests/registration-gate.test.mjs`, which asserts that whatever command the gate
*tells* the user to type actually resolves, so this class of bug cannot return.

Registration can also be turned off entirely with
`config.registration.enabled = false`; that is the owner's choice and was left
as shipped.

---

## 18. Known Limitations

1. **Per-plugin wording not migrated.** ~890 plugins keep their own literal strings. They inherit the new shared states and messages, but their bespoke text was left untouched deliberately, to guarantee parity. Migrating them is incremental follow-up work.
2. **90 command collisions remain unresolved** — now visible, but renaming a command is user-visible and should be the owner's call.
3. **27 dependency advisories remain.** Fixing them requires major bumps to the WhatsApp/media stack.
4. **No live WhatsApp test.** No credentials exist in this environment; the bot was verified to boot and reach the pairing handshake. Everything else was verified by executing the real modules.
5. **1103 lint warnings remain** (unused vars, empty catches, `preserve-caught-error`). Quality signals, not defects; left visible rather than suppressed.
6. **All seven leaked credentials still need human rotation.** They shipped inside the uploaded archive, so treat them as public.
7. **Memory monitor calls `process.exit(1)` at 1 GB** but `npm start` has no supervisor — run under pm2/systemd.

---

## 19. Rollback Instructions

Every phase is a separate commit.

```bash
git log --oneline                 # BASELINE commit is the original upload
git revert <commit>               # revert one phase
git checkout <baseline> -- <path> # restore a single file
```

UI only, at runtime, no redeploy:
```js
// config.js
ui: { engine: "legacy" }          // restores the original four menus
ui: { typography: { mode: "plain" } }  // disables all Unicode styling
```

Re-enable the dev consoles (not recommended in production):
```bash
MAROBOT_DEV_CONSOLE=true
MAROBOT_DEV_SHELL=true
```

---

## 20. Deployment Instructions

```bash
cp .env.example .env        # then fill in NEW, rotated keys
npm ci                      # a lockfile is now committed
npm test                    # syntax sweep + 42 local tests
npm run lint                # must report 0 errors
npm run inventory && npm run parity   # prove no command was lost
```

Before going live:
1. **Rotate** the three leaked API keys.
2. Set `config.owner.number` to **your own** number (SEC-09).
3. Set `config.session.pairingNumber` to your bot's number.
4. Leave `MAROBOT_DEV_CONSOLE` and `MAROBOT_DEV_SHELL` **false**.
5. Leave `config.autoJoin.enabled` **false** unless you deliberately want it.
6. Run under a supervisor: `pm2 start index.js --name tarboobot`.

---

## Classification Key

`PASS` verified working · `FIXED` defect repaired and tested · `BLOCKED_BY_ENV` needs an unavailable service · `REQUIRES_HUMAN_CREDENTIAL` needs an action only the owner can take.
