import { inspectProject, findMissingImports, runTests } from "./maro-agent-tools.js";
import { getProviderHealth } from "./maro-provider-health.js";

async function runAgentHealthCheck({ refresh = false, includeTests = false } = {}) {
  const manifest = inspectProject({ refresh });
  const imports = findMissingImports({});
  const syntax = includeTests
    ? await runTests({ script: "test:syntax" })
    : { ok: true, skipped: true, message: "تم تخطي الاختبار الكامل؛ استخدم includeTests للتشغيل." };
  const providerHealth = getProviderHealth();
  const healthy = Boolean(manifest.ok && imports.ok && imports.count === 0 && syntax.ok);
  return {
    ok: healthy,
    status: healthy ? "healthy" : "needs_attention",
    checkedAt: new Date().toISOString(),
    project: {
      files: manifest.fileCount || 0,
      plugins: manifest.pluginCount || 0,
      capabilities: manifest.capabilities || [],
    },
    missingImports: imports,
    syntax,
    providers: providerHealth,
    recommendations: [
      ...(imports.count ? ["راجع الاستيرادات المفقودة قبل النشر."] : []),
      ...(!syntax.ok ? ["شغّل فحص الصياغة وراجع الخطأ قبل إعادة التشغيل."] : []),
      ...(!manifest.fileCount ? ["أعد بناء فهرس المشروع."] : []),
    ],
  };
}

function formatAgentHealth(report) {
  if (!report) return "لا توجد نتيجة صحة.";
  const status = report.status === "healthy" ? "✅ سليمة" : "⚠️ تحتاج مراجعة";
  return [
    `حالة الوكيل: ${status}`,
    `الفهرس: ${report.project?.files || 0} ملف / ${report.project?.plugins || 0} بلوقن`,
    `الاستيرادات المفقودة: ${report.missingImports?.count || 0}`,
    `الصياغة: ${report.syntax?.ok ? "✅ سليمة" : "❌ فاشلة"}`,
    `المزودات المسجلة: ${report.providers?.length || 0}`,
    report.recommendations?.length ? `التوصيات:\n${report.recommendations.map((item) => `- ${item}`).join("\n")}` : "لا توجد توصيات حرجة.",
  ].join("\n");
}

export { runAgentHealthCheck, formatAgentHealth };
