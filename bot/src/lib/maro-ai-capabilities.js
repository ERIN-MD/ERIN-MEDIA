const AI_STUDIO_CAPABILITIES = Object.freeze([
  { id: "file_analysis", title: "تحليل الملفات", scope: "قراءة فقط للملفات النصية المدعومة" },
  { id: "plugin_review", title: "مراجعة البلوقنات", scope: "تحليل واقتراحات؛ لا تعديل قبل موافقة المالك" },
  { id: "plugin_adaptation", title: "تكييف البلوقنات", scope: "معاينة فرق ونسخة احتياطية ثم موافقة المالك" },
  { id: "plugin_generation", title: "توليد البلوقنات", scope: "إنشاء مسودة وفحص صياغة قبل الإضافة" },
  { id: "media_conversion", title: "تحويل الوسائط", scope: "المرفقات المقتبسة فقط" },
  { id: "image_generation", title: "توليد الصور", scope: "للمالك فقط عبر المزود المتاح" },
  { id: "structured_messages", title: "الرسائل المنظمة", scope: "نصوص ووسائط وبطاقات ضمن الصلاحيات" },
  { id: "work_mode", title: "وضع العمل", scope: "خطة مهام قابلة للتحديث للمشرف أو المالك" },
  { id: "group_memory", title: "ذاكرة المجموعة", scope: "تفضيلات وقواعد صريحة قابلة للعرض والحذف" },
  { id: "safe_plugin_ops", title: "اختبار ونقل البلوقنات", scope: "فحص وتأكيد ونسخة احتياطية وتراجع للمالك" },
  { id: "attachment_context", title: "فهم المرفقات والاقتباسات", scope: "تحليل قراءة فقط للمستندات والرسائل المقتبسة" },
]);

function getAiStudioCapabilities() {
  return AI_STUDIO_CAPABILITIES.map((capability) => ({ ...capability }));
}

function formatAiStudioCapabilities() {
  return getAiStudioCapabilities().map((capability, index) => `${index + 1}. *${capability.title}* — ${capability.scope}`).join("\n");
}

export { AI_STUDIO_CAPABILITIES, getAiStudioCapabilities, formatAiStudioCapabilities };
