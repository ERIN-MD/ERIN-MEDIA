import { withProviderHealth } from "./maro-provider-health.js";

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
}

function classifyAiTask({ text = "", hasImage = false, hasDocument = false } = {}) {
  if (hasImage) return "vision";
  if (hasDocument) return "document";
  const value = normalizeText(text);
  if (/(?:كود|برمج|javascript|node|python|خطا|debug|api|plugin|بلوقن|استيراد|syntax)/.test(value)) return "code";
  if (/(?:اكتب قصه|قصيدة|شعر|اعلان|منشور|سيناريو|creative|story)/.test(value)) return "creative";
  if (/(?:لخص|تلخيص|حلل ملف|مستند|وثيقه|document)/.test(value)) return "document";
  return "chat";
}

function chooseProviderRoute(input = {}) {
  const task = classifyAiTask(input);
  const routes = {
    vision: { primary: "GeminiAPI", fallbacks: [], reason: "تحليل الصور يحتاج مزوداً يدعم الرؤية." },
    document: { primary: "Claude", fallbacks: ["GeminiAPI", "DeepSeek", "GPT"], reason: "Claude يتولى التحليل المركب والتخطيط، مع بدائل للسياق الطويل." },
    code: { primary: "Claude", fallbacks: ["DeepSeek", "GeminiAPI", "GPT"], reason: "Claude يتولى تحليل الكود والتخطيط قبل مزودي التنفيذ البدلاء." },
    creative: { primary: "GPT", fallbacks: ["GeminiAPI", "DeepSeek"], reason: "الكتابة الإبداعية تستخدم مزوداً لغوياً ثم بدائل." },
    chat: { primary: "GeminiAPI", fallbacks: ["GPT", "DeepSeek"], reason: "المحادثة اليومية تبدأ بالمزود الافتراضي للبوت." },
  };
  return { task, ...(routes[task] || routes.chat) };
}

function providerText(result) {
  if (typeof result === "string") return result;
  return result?.text || result?.answer || result?.message || "";
}

async function runRoutedChat({ route, providers = {}, payload } = {}) {
  const selected = route || chooseProviderRoute(payload);
  const candidates = [selected.primary, ...(selected.fallbacks || [])].filter((name, index, all) => name && all.indexOf(name) === index);
  const errors = [];
  for (const name of candidates) {
    const provider = providers[name];
    if (typeof provider !== "function") continue;
    try {
      const result = await withProviderHealth(name, () => provider(payload));
      const text = providerText(result);
      if (!text) throw new Error("المزود لم يعد نصاً صالحاً");
      return { text, provider: name, route: selected, raw: result };
    } catch (error) {
      errors.push(`${name}: ${String(error?.message || error).slice(0, 120)}`);
    }
  }
  throw new Error(errors.length ? `تعذر تشغيل مزودات ${selected.task}: ${errors.join(" | ")}` : "لا يوجد مزود متاح للمهمة المطلوبة");
}

function formatProviderRoute(route) {
  const names = [route.primary, ...(route.fallbacks || [])].join(" ← ");
  const title = { vision: "رؤية", document: "وثائق", code: "برمجة", creative: "إبداع", chat: "محادثة" }[route.task] || "محادثة";
  return `نوع المهمة: ${title} | المسار: ${names}`;
}

export { chooseProviderRoute, classifyAiTask, formatProviderRoute, runRoutedChat };
