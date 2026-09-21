import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import config from "../config.js";
import { initDatabase } from "../src/lib/maro-database.js";
import { checkMode } from "../src/lib/maro-middleware.js";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "marobot-mode-"));
await initDatabase(path.join(root, "database"));
const originalMode = config.mode;
const legacyConfig = config.config;
config.mode = "public";
delete config.config;

const result = checkMode({
  fromMe: false,
  isOwner: false,
  isGroup: false,
  isAdmin: false,
  sender: "201999999999@s.whatsapp.net",
  chat: "201999999999@s.whatsapp.net",
}, () => []);
assert.equal(result.allowed, true);

config.mode = originalMode;
if (legacyConfig !== undefined) config.config = legacyConfig;
await fs.rm(root, { recursive: true, force: true });
console.log("mode config guard test: passed");
process.exit(0);
