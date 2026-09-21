function compact(value, max = 1200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function diagnoseErrorText(raw) {
  const text = compact(raw);
  const fileMatch = text.match(/(?:at\s+)?([\w./-]+\.(?:js|mjs|cjs|json))(?::(\d+)(?::(\d+))?)?/i);
  const typeMatch = text.match(/\b(TypeError|ReferenceError|SyntaxError|ModuleNotFoundError|Error)\b/i);
  const type = typeMatch?.[1] || "خطأ غير مصنف";
  const file = fileMatch?.[1] || "لم يُحدد ملف";
  const line = fileMatch?.[2] ? `${fileMatch[2]}${fileMatch[3] ? `:${fileMatch[3]}` : ""}` : "غير محدد";
  let cause = "راجع سجل الخطأ كاملاً والملف أو الاستيراد المرتبط به قبل أي تعديل.";
  let next = "أرسل رسالة الخطأ كاملة أو اطلب تحليل الملف المحدد.";
  if (/TypeError/i.test(type)) {
    cause = "غالباً توجد قيمة غير معرّفة أو خاصية يجري الوصول إليها قبل تهيئتها.";
    next = "تحقق من القيم الاختيارية وأضف حارساً مناسباً قبل الوصول إلى الخاصية.";
  } else if (/ReferenceError/i.test(type)) {
    cause = "يوجد متغير أو دالة مستخدمة من دون تعريف أو استيراد صحيح.";
    next = "تحقق من الاسم والاستيراد ونطاق المتغير.";
  } else if (/SyntaxError/i.test(type)) {
    cause = "صياغة JavaScript أو بنية import/export غير صحيحة.";
    next = "نفذ node --check على الملف ثم أصلح السطر المشار إليه.";
  } else if (/module|import|cannot find/i.test(text)) {
    cause = "يوجد استيراد لمسار مفقود أو اسم ملف تغير بعد النقل.";
    next = "تحقق من المسار النسبي وامتداد الملف، ثم استخدم فحص البلوقن قبل إعادة التحميل.";
  }
  return { type, file, line, evidence: text, cause, next };
}

function formatErrorDiagnosis(result) {
  return `🩺 *تشخيص أولي للخطأ*\n\n• النوع: ${result.type}\n• الملف: \`${result.file}\`\n• السطر: ${result.line}\n• السبب المحتمل: ${result.cause}\n• الخطوة التالية: ${result.next}\n\n> هذا تحليل قراءة فقط؛ لا يعدل أي ملف قبل موافقة المالك.`;
}

export { diagnoseErrorText, formatErrorDiagnosis };
