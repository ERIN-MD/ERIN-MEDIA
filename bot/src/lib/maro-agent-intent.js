const INTENT_RULES = [
  {
    intent: "project_index",
    words: ["فهرس", "فهرسة", "بنية المشروع", "كل الملفات", "جميع الملفات", "project structure", "index project"],
    tools: ["project.project_manifest"],
  },
  {
    intent: "search_project",
    words: ["ابحث", "البحث", "فتش", "دور على", "استخدام", "search", "find", "grep"],
    tools: ["project.search"],
  },
  {
    intent: "inspect_exports",
    words: ["تصديرات", "التصدير", "imports", "exports", "الدوال", "الكلاسات", "واجهات", "inspect exports"],
    tools: ["project.inspect_exports"],
  },
  {
    intent: "syntax_check",
    words: ["صياغة", "syntax", "خطأ نحوي", "node check", "افحص الكود", "تحقق من الكود"],
    tools: ["project.syntax_check"],
  },
  {
    intent: "test_project",
    words: ["اختبر", "اختبار", "tests", "test", "شغل الاختبارات", "جرّب الكود"],
    tools: ["project.run_tests"],
  },
  {
    intent: "analyze_project",
    words: ["حلل", "تحليل", "حللي", "حلله", "راجع", "مراجعة", "analyse", "analyze", "review", "audit"],
    tools: ["project.project_manifest", "project.read_file", "project.inspect_exports", "project.search"],
  },
  {
    intent: "read_project",
    words: ["اقرأ الملف", "اعرض الملف", "اعرض", "وريني", "محتوى الملف", "read file", "show file"],
    tools: ["project.read_file"],
  },
  {
    intent: "modify_project",
    words: ["عدّل", "عدل", "تعديل", "أضف", "اضف", "احذف", "احذف من", "استبدل", "صلح", "إصلاح", "modify", "edit", "write", "delete", "fix"],
    tools: ["project.diff", "project.write_file"],
    developerOnly: true,
  },
  {
    intent: "execute_project",
    words: ["نفذ", "شغّل", "شغل", "شغلي", "شغله", "execute", "run command", "deploy", "انشر"],
    tools: ["project.execute"],
    developerOnly: true,
  },
  {
    intent: "remember",
    words: ["تذكر", "تذكّر", "احفظ", "سجل", "لا تنس", "remember", "save this", "memorize"],
    tools: ["memory.remember"],
  },
];

const PROJECT_MARKERS = [
  "ملف", "كود", "بوت", "مشروع", "بلوقن", "إضافة", "استيراد", "تصدير", "دالة", "قاعدة البيانات", "handler", "autoai", "src/", "plugins/", ".js", ".mjs", "package.json",
];

function normalizeText(value = "") {
  return String(value)
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ـ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(normalizeText(word)));
}

function extractPath(message = "") {
  const match = String(message).match(/(?:src|plugins|tests|tools|config\.js|package\.json)[/\\][^\s"'`،؛)]+|(?:src|plugins|tests|tools)\/[\w\u0600-\u06FF._/-]+/i);
  return match?.[0]?.replace(/[،؛)]+$/, "") || null;
}

function extractSearchQuery(message = "", filePath = null) {
  let query = String(message);
  if (filePath) query = query.replace(filePath, "");
  query = query
    .replace(/\b(ابحث|البحث|فتش|search|find|grep|عن|في|داخل|ملف|مشروع)\b/gi, " ")
    .replace(/[؟?!،؛:]/g, " ")
    .trim();
  return query.length >= 2 ? query.slice(0, 180) : null;
}

function detectAgentIntent(message = "", { isDeveloper = false } = {}) {
  const original = String(message || "").trim();
  if (!original) return null;
  const text = normalizeText(original);
  const rule = INTENT_RULES.find((candidate) => includesAny(text, candidate.words));
  const hasProjectMarker = includesAny(text, PROJECT_MARKERS);
  if (!rule && !hasProjectMarker) return null;

  const selected = rule || {
    intent: "project_inspect",
    tools: ["project.project_manifest", "project.search"],
  };
  const filePath = extractPath(original);
  const query = extractSearchQuery(original, filePath);
  const developerOnly = Boolean(selected.developerOnly || selected.tools?.some((tool) => tool.startsWith("project.")));
  const requiresConfirmation = Boolean(developerOnly && selected.intent !== "project_inspect");
  return {
    intent: selected.intent,
    original,
    normalized: text,
    filePath,
    query,
    tools: selected.tools,
    developerOnly,
    allowed: !developerOnly || isDeveloper,
    requiresConfirmation,
    confidence: rule ? 0.9 : 0.65,
  };
}

function buildAgentPlan(intent, { isDeveloper = false, memoryScope = "global", memoryOwner = "" } = {}) {
  if (!intent) return null;
  const plan = [];
  const path = intent.filePath;
  const query = intent.query;

  if (intent.intent === "project_index") plan.push({ tool: "project.project_manifest", input: { refresh: true } });
  if (intent.intent === "search_project") plan.push({ tool: "project.search", input: { query: query || intent.original, limit: 50 } });
  if (intent.intent === "inspect_exports") {
    if (path) plan.push({ tool: "project.inspect_exports", input: { path } });
    else plan.push({ tool: "project.project_manifest", input: { refresh: false } });
  }
  if (intent.intent === "syntax_check") {
    if (path) plan.push({ tool: "project.syntax_check", input: { path } });
    else plan.push({ tool: "project.project_manifest", input: { refresh: false } });
  }
  if (intent.intent === "read_project") {
    if (path) plan.push({ tool: "project.read_file", input: { path, start: 1, end: 300 } });
    else plan.push({ tool: "project.project_manifest", input: { refresh: false } });
  }
  if (intent.intent === "analyze_project") {
    plan.push({ tool: "project.project_manifest", input: { refresh: false } });
    if (path) {
      plan.push({ tool: "project.read_file", input: { path, start: 1, end: 350 } });
      plan.push({ tool: "project.inspect_exports", input: { path } });
    } else if (query) {
      plan.push({ tool: "project.search", input: { query, limit: 40 } });
    }
  }
  if (intent.intent === "test_project") {
    plan.push({ tool: "project.run_tests", input: { script: "test:syntax" } });
  }
  if (intent.intent === "modify_project") {
    plan.push({ tool: "project.diff", input: { path: path || "", replacement: "[يجب إنشاء Diff من الطلب بعد تحديد الملف]" } });
    plan.push({ tool: "project.write_file", input: { path: path || "", confirmation: "" } });
  }
  if (intent.intent === "execute_project") {
    plan.push({ tool: "project.execute", input: { command: "[يحتاج اختيار أمر مسموح]", confirmation: "" } });
  }
  if (intent.intent === "remember") {
    const key = intent.original
      .replace(/^(تذكر|تذكّر|احفظ|سجل|لا تنس|remember|save this|memorize)\\s*/i, "")
      .replace(/^(أن|ان|that)\\s*/i, "")
      .trim()
      .slice(0, 80) || "latest-note";
    plan.push({ tool: "memory.remember", input: { key, value: intent.original, scope: memoryScope, owner: memoryOwner } });
  }
  if (intent.intent === "project_inspect") {
    plan.push({ tool: "project.project_manifest", input: { refresh: false } });
    if (query) plan.push({ tool: "project.search", input: { query, limit: 30 } });
  }

  const deduped = [];
  const seen = new Set();
  for (const step of plan) {
    const key = `${step.tool}:${JSON.stringify(step.input)}`;
    if (!seen.has(key)) { seen.add(key); deduped.push(step); }
  }
  return {
    goal: intent.original,
    intent: intent.intent,
    steps: deduped.slice(0, 8),
    requiresConfirmation: intent.requiresConfirmation,
    developerOnly: intent.developerOnly,
    allowed: intent.allowed,
    isDeveloper,
  };
}

export { normalizeText, detectAgentIntent, buildAgentPlan, extractPath, extractSearchQuery };
