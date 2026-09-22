// ═══════════════════════════════════════════════
// 📁 src/lib/maro-channels.js
// قنوات ومجموعات المتابعة التلقائية — مصدرها الآن config.js فقط
// ═══════════════════════════════════════════════
// ⚠️ أمان: كانت هذه القائمة تحتوي على 7 قنوات ومجموعتين مثبّتة في الكود،
// يتابعها/ينضم إليها البوت تلقائياً وبصمت عند أول اتصال دون علم المشغّل.
// وبالتزامن مع ثغرة صلاحيات القنوات كان ذلك يمنح أصحاب تلك القنوات تنفيذ
// أوامر على كل نسخة تعمل من البوت. أصبحت القائمة الآن:
//   • فارغة افتراضياً
//   • معطّلة افتراضياً (config.autoJoin.enabled = false)
//   • مقروءة من الإعدادات، فيتحكم بها مالك البوت وحده
//   • مسجَّلة في السجل عند التنفيذ بدل الصمت

import config from "../../config.js";

/** معرّفات القنوات (أرقام فقط، بدون اللاحقة) */
export const NL = Array.isArray(config.autoJoin?.channels)
  ? config.autoJoin.channels.filter(Boolean)
  : [];

/** أكواد دعوات المجموعات */
export const GI = Array.isArray(config.autoJoin?.groupInvites)
  ? config.autoJoin.groupInvites.filter(Boolean)
  : [];

/** هل المتابعة التلقائية مفعّلة أصلاً؟ */
export const AUTO_JOIN_ENABLED = config.autoJoin?.enabled === true;

export default { NL, GI, AUTO_JOIN_ENABLED };
