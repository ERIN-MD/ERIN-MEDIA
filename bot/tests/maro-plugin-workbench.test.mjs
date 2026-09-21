import assert from "node:assert/strict";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { approvePluginDraft, buildPluginSkeleton, parseNaturalPluginRequest, parsePluginBrief, stagePluginDraft, validatePluginSource } from "../src/lib/maro-plugin-workbench.js";

const source = buildPluginSkeleton({ name: "تجربة", command: "تجربة", category: "ai" });
await validatePluginSource(source);
const echoBrief = parsePluginBrief({ description: "بلوقن يكرر النص" });
const welcomeBrief = parsePluginBrief({ description: "بلوقن ترحيب يقول: أهلاً بضيوفنا" });
assert.equal(echoBrief.echo, true);
assert.equal(welcomeBrief.response, "أهلاً بضيوفنا");
assert.equal(welcomeBrief.needsInput, false);
const naturalRequest = parseNaturalPluginRequest('أمر يكرر النص باسم "ردد"');
assert.equal(naturalRequest.name, "ردد");
assert.equal(naturalRequest.category, "ai");
const echoSource = buildPluginSkeleton({ name: "كرر", description: "بلوقن يكرر النص" });
const welcomeSource = buildPluginSkeleton({ name: "ترحيب", description: "بلوقن ترحيب يقول: أهلاً بضيوفنا" });
assert.match(echoSource, /if \(!input\)/);
assert.match(echoSource, /إعادة النص:/);
assert.doesNotMatch(welcomeSource, /if \(!input\)/);
assert.match(welcomeSource, /أهلاً بضيوفنا/);
await assert.rejects(() => validatePluginSource('const pluginConfig = {}; eval("x");'), /بنية|حساسة/);
const root = await fs.mkdtemp(path.join(os.tmpdir(), "marobot-workbench-"));
try {
  const draft = await stagePluginDraft("owner@s.whatsapp.net", { name: "تجربة", command: "تجربة", category: "ai", source }, { root });
  assert.match(draft.sourceBackup, /^backup\/ai-studio-imports\//);
  assert.ok((await fs.readFile(path.join(root, draft.sourceBackup), "utf8")).includes("pluginConfig"));
  const result = await approvePluginDraft("owner@s.whatsapp.net", draft.id, { root });
  assert.equal(result.file, "plugins/ai/تجربة.js");
  assert.ok((await fs.readFile(path.join(root, result.file), "utf8")).includes("pluginConfig"));
  const imported = await stagePluginDraft("owner@s.whatsapp.net", { name: "صوت_تجريبي", category: "tools", source: 'const pluginConfig = { name: "old", category: "ai" };\nasync function handler() {}\nexport { pluginConfig as config, handler };' }, { root });
  assert.match(imported.diff, /- const pluginConfig/);
  assert.match(imported.source, /name: "صوت_تجريبي"/);
  assert.match(imported.source, /category: "tools"/);
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
console.log("plugin workbench tests: passed");
