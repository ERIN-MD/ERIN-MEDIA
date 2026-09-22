import { getDatabase } from "./src/lib/maro-database.js"; // استيراد قاعدة البيانات
import * as ownerPremiumDb from "./src/lib/maro-premium-db.js"; // استيراد نظام المميزين

//  ⚠️ اقرأ محتويات هذا الملف حتى النهاية قبل التعديل
const config = {

  // ═══════════════════════════════════════════════
  // 🔗 معلومات التواصل والروابط
  // ═══════════════════════════════════════════════
  info: {
    website: "https://whatsapp.com/channel/0029Vb5Vczr7j6g3foFrXM2x", // رابط موقعك الشخصي
    grupwa: "https://whatsapp.com/channel/0029VbDhVJmBVJkxkVqLSI0y", // رابط مجموعة واتساب (عدله أو اتركه)
  },

  // ═══════════════════════════════════════════════
  // 🌐 روابط السوشيال ميديا
  // ═══════════════════════════════════════════════
  socialLinks: {
    website: "https://whatsapp.com/channel/0029Vb5Vczr7j6g3foFrXM2x", // موقعك الإلكتروني
    facebook: "", // صفحة فيسبوك
    instagram: "https://www.instagram.com/tarboo455", // حساب إنستغرام
    linkedin: "https://github.com/Tarboobot2888", // حساب لينكد إن
    github: "https://github.com/Tarboobot2888", // حساب جيتهاب
    youtube: "https://github.com/Tarboobot2888", // قناة يوتيوب
    whatsapp: "https://wa.me/201225655220", // رابط واتساب مباشر
    gmail: "mahmoudtarboo09@gmail.com" // البريد الإلكتروني
  },

  // ═══════════════════════════════════════════════
  // 👑 إعدادات مالك البوت
  // ═══════════════════════════════════════════════
  owner: {
    name: "Tarboo", // اسم المالك الذي سيظهر
    number: ["201225655220"], // أرقام المالك (يمكن إضافة أكثر من رقم)
  },

  // ═══════════════════════════════════════════════
  // 📱 إعدادات جلسة البوت (الرقم + طريقة الاتصال)
  // ═══════════════════════════════════════════════
  session: {
    pairingNumber: "2348093093240", // رقم الواتساب الذي سيعمل عليه البوت
    usePairingCode: true, // true = كود مكون من 8 أرقام | false = مسح QR Code
  },

  // ═══════════════════════════════════════════════
  // 🤖 معلومات البوت الأساسية
  // ═══════════════════════════════════════════════
  bot: {
    name: "Bot Tarboo", // اسم البوت الذي سيظهر للمستخدمين
    primaryNumber: process.env.MAROBOT_PRIMARY_NUMBER || "", // رقم البوت الرئيسي لإعطائه أولوية الرد
    prioritySubBotNumbers: (process.env.MAROBOT_PRIORITY_SUBBOTS || "").split(",").filter(Boolean), // البوتات الفرعية المرقّاة بالترتيب
    version: "3.1", // إصدار البوت الحالي
    developer: "Tarboo", // اسم مطور البوت
  },

  // ═══════════════════════════════════════════════
  // 🖼️ مسارات الصور والوسائط المستخدمة في البوت
  // ═══════════════════════════════════════════════
  assets: {
    "maro-daftar": "./assets/image/maro-daftar.png", // صورة التسجيل
    "maro-demote": "./assets/image/maro-demote.png", // صورة تنزيل الرتبة
    "maro-fishit": "./assets/image/maro-fishit.jpg", // صورة لعبة الصيد
    "maro-games": "./assets/image/maro-games.jpg", // صورة الألعاب
    "maro-landscape": "./assets/image/maro-landscape.jpg", // صورة أفقية عامة
    "maro-levelup": "./assets/image/maro-levelup.jpg", // صورة رفع المستوى
    "maro-minecraft": "./assets/image/maro-minecraft.jpg", // صورة ماينكرافت
    "maro-promote": "./assets/image/maro-promote.png", // صورة ترقية الرتبة
    "maro-rpg": "./assets/image/maro-rpg.jpg", // صورة RPG
    "maro-rules": "./assets/image/maro-rules.jpg", // صورة القوانين
    "maro-store": "./assets/image/maro-store.png", // صورة المتجر
    "maro-v8": "./assets/image/maro-v8.jpg", // صورة احتياطية
    "maro-winner": "./assets/image/maro-winner.jpg", // صورة الفائز
    "maro": "./assets/image/maro.png", // صورة البوت الرئيسية
    "maro2": "./assets/image/maro2.jpg", // صورة مصغرة للروابط
    "maro3": "./assets/image/maro3.jpg", // صورة احتياطية 2
    "pp-kosong": "./assets/image/pp-kosong.jpg", // صورة شخصية فارغة
    "maro-mp4": "./assets/video/maro-mp4.mp4", // فيديو القائمة المتحركة
    "maro-mp3": "./assets/audio/maro-mp3.mp3", // صوت موسيقى القائمة
    "maro-font": "./assets/maro-font.ttf", // خط الكتابة للتصميم
    "maro-kertas": "./assets/image/maro-kertas.jpg", // صورة ورقية للخلفيات
    "test": "./assets/image/test.webp", // صورة اختبار
  },

  // ═══════════════════════════════════════════════
  // 🌍 وضع البوت (عام أو خاص)
  // ═══════════════════════════════════════════════
  mode: "public", // public = الجميع | self = المالك فقط

  // ═══════════════════════════════════════════════
  // ⌨️ إعدادات الأوامر (البريفكس)
  // ═══════════════════════════════════════════════
  command: {
    prefix: ".", // رمز بداية الأوامر (مثل: .menu)
  },

  // ═══════════════════════════════════════════════
  // ☁️ توكن Vercel للنشر السحابي (اختياري)
  // ═══════════════════════════════════════════════
  vercel: {
    token: "", // اتركه فارغاً إذا لم يكن لديك توكن Vercel
  },

  // ═══════════════════════════════════════════════
  // 💳 طرق الدفع الإلكتروني (اختياري)
  // ═══════════════════════════════════════════════
  payment: {
    qrisUrl: "", // رابط صورة QRIS للدفع (اتركه فارغاً)
    methods: [ // طرق الدفع المتاحة
      { name: "Dana", number: "", holder: "" },
      { name: "GoPay", number: "", holder: "" },
      { name: "OVO", number: "", holder: "" },
      { name: "ShopeePay", number: "", holder: "" },
    ],
    banks: [], // حسابات بنكية (اتركه فارغاً)
    customText: "https://imgdrop.web.id/KodpV.webp", // صورة مخصصة للدفع
  },

  // ═══════════════════════════════════════════════
  // 🎁 إعدادات التبرعات (اختياري)
  // ═══════════════════════════════════════════════
  donasi: {
    payment: [ // طرق التبرع
      { name: "Dana", number: "08xxxxxxxxxx", holder: "Nama Owner" },
      { name: "GoPay", number: "08xxxxxxxxxx", holder: "Nama Owner" },
      { name: "OVO", number: "08xxxxxxxxxx", holder: "Nama Owner" },
    ],
    links: [ // روابط منصات التبرع
      { name: "Saweria", url: "saweria.co/username" },
      { name: "Trakteer", url: "trakteer.id/username" },
    ],
    benefits: [ // فوائد التبرع
      "Mendukung development",
      "Server lebih stabil",
      "Fitur baru lebih cepat",
      "Priority support",
    ],
    qris: "https://imgdrop.web.id/KodpV.webp", // صورة QRIS للتبرع
  },

  // ═══════════════════════════════════════════════
  // ⚡ نظام الطاقة (حدود الاستخدام اليومي)
  // ═══════════════════════════════════════════════
  energi: {
    enabled: true, // true = تفعيل نظام الطاقة | false = تعطيل
    default: 99999, // طاقة المستخدم العادي
    premium: 99999999, // طاقة المستخدم المميز
    owner: -1, // -1 = طاقة غير محدودة للمالك
  },

  // ═══════════════════════════════════════════════
  // 🎨 إعدادات الملصقات (Sticker)
  // ═══════════════════════════════════════════════
  sticker: {
    packname: "Bot Tarboo ", // اسم حزمة الملصقات
    author:"Tarboo Bot", // اسم مؤلف الملصقات
  },

  // ═══════════════════════════════════════════════
  // 📢 إعدادات قناة واتساب (Newsletter/Saluran)
  // ═══════════════════════════════════════════════
  saluran: {
    id: "120363418715609508@newsletter", // ID القناة (لا تغيره إلا إذا عرفت الصحيح)
    name: "انضم الي قناة البوت ", // اسم القناة الظاهر
    link: "https://whatsapp.com/channel/0029Vb5Vczr7j6g3foFrXM2x", // رابط القناة
    autoFollow: true, // متابعة القناة المُعرّفة أعلاه مرة واحدة بعد اتصال البوت
    showInAllMessages: true, // true = اسم القناة يظهر أعلى كل رسالة من البوت
  },

  // ═══════════════════════════════════════════════
  // 🛡️ رسائل الحماية للمجموعات
  // ═══════════════════════════════════════════════
  groupProtection: {
    antilink: "⚠ *منع الروابط* — @%user% أرسل رابط.\nتم حذف الرسالة.", // رسالة منع الروابط
    antilinkKick: "⚠ *منع الروابط* — @%user% تم طرده لإرسال رابط.", // رسالة الطرد بسبب رابط
    antilinkGc: "⚠ *منع روابط الواتساب* — @%user% أرسل رابط واتساب.\nتم حذف الرسالة.", // منع روابط مجموعات واتساب
    antilinkGcKick: "⚠ *منع روابط الواتساب* — @%user% تم طرده لإرسال رابط واتساب.", // طرد بسبب رابط واتساب
    antilinkAll: "⚠ *منع جميع الروابط* — @%user% أرسل رابط.\nتم حذف الرسالة.", // منع كل الروابط
    antilinkAllKick: "⚠ *منع جميع الروابط* — @%user% تم طرده لإرسال رابط.", // طرد بسبب أي رابط
    antitagsw: "⚠ *منع إشارة الحالة* — إشارة من @%user% تم حذفها.", // منع الإشارة للحالة
    antiviewonce: "👁️ *عرض مرة واحدة* — من @%user%", // كشف رسالة view once
    antiremove: "🗑️ *منع الحذف* — @%user% حذف رسالة:", // منع حذف الرسائل
    antiswgc: "⚠ *منع SW في المجموعة* — ممنوع نشر الحالة في المجموعة @%user%", // منع نشر الحالة
    antihidetag: "⚠ *منع الإشارة المخفية* — إشارة مخفية من @%user% تم حذفها.", // منع الهيدتاج
    antitoxicWarn: "⚠ @%user% تكتب كلام غير لائق.\nتحذير %warn% من %max%، المخالفة التالية قد تؤدي إلى %method%.", // تحذير كلام سيء
    antitoxicAction: "🚫 @%user% تم %method% بسبب الكلام غير اللائق. (%warn%/%max%)", // عقوبة الكلام السيء
    antidocument: "⚠ *منع المستندات* — مستند من @%user% تم حذفه.", // منع الملفات
    antisticker: "⚠ *منع الملصقات* — ملصق من @%user% تم حذفه.", // منع الملصقات
    antimedia: "⚠ *منع الوسائط* — وسائط من @%user% تم حذفها.", // منع الوسائط
    antibot: "🤖 *منع البوتات* — @%user% تم اكتشافه كبوت وتم طرده.", // منع البوتات الأخرى
    notAdmin: "⚠ البوت ليس مشرفاً، لا يمكن حذف الرسالة.", // رسالة عندما لا يكون البوت مشرفاً
  },

  // ═══════════════════════════════════════════════
  // ❌ قالب رسالة الخطأ
  // ═══════════════════════════════════════════════
  errorTemplate: `✕ *تعذّر تنفيذ* \`{prefix}{command}\`\n◦ حاول مرة أخرى بعد قليل، {pushName}\n◦ إن تكرّر الأمر فأبلغ مالك البوت`,

  // ═══════════════════════════════════════════════
  // ⚙️ تفعيل/تعطيل ميزات البوت
  // ═══════════════════════════════════════════════
  features: {
    antiCall: true, // true = رفض المكالمات تلقائياً
    blockIfCall: true, // true = حظر من يتصل بالبوت
    autoTyping: true, // true = إظهار "يكتب..." تلقائياً
    autoRead: true, // true = قراءة تلقائية للرسائل
    logMessage: true, // true = تسجيل الرسائل في الطرفية
    dailyLimitReset: true, // true = إعادة تعيين الطاقة يومياً
    smartTriggers: true, // true = الردود التلقائية الذكية (مثل: بوت، هلا)
    // ⚠️ كان handler.js يفحص config.features.antiSpam وهو مفتاح غير معرّف إطلاقاً،
    // فكان محدّد المعدل لكل مستخدم (8 أوامر/3ث) معطّلاً بالكامل.
    antiSpam: true, // true = تفعيل محدّد المعدل لكل مستخدم
  },

  // ═══════════════════════════════════════════════
  // 📝 نظام التسجيل الإجباري
  // ═══════════════════════════════════════════════
  registration: {
    enabled: true, // true = يجب التسجيل قبل استخدام البوت
    rewards: { // مكافآت إكمال التسجيل
      koin: 30000, // عدد الكوينز
      energi: 300, // عدد الطاقة
      exp: 300000, // عدد الخبرة
    },
  },

  // ═══════════════════════════════════════════════
  // 👋 إعدادات الترحيب والتوديع
  // ═══════════════════════════════════════════════
  welcome: { defaultEnabled: true }, // true = تفعيل الترحيب تلقائياً
  goodbye: { defaultEnabled: true }, // true = تفعيل التوديع تلقائياً

  // ═══════════════════════════════════════════════
  // 🎨 إعدادات واجهة المستخدم (شكل القائمة)
  // ═══════════════════════════════════════════════
  ui: {
    menuVariant: 1, // (قديم) شكل القائمة في محرك legacy فقط

    // ── محرك الواجهة ────────────────────────────────────────────
    engine: "axion",        // "axion" = التصميم الجديد | "legacy" = التصميم القديم
    menuImage: true,        // إرفاق صورة ترويسة مع القوائم
    buttons: true,          // true = أزرار وقوائم منسدلة | false = نص فقط
    globalFooter: true,     // true = تذييل موحّد أسفل كل رد
    menuImageAsset: "maro", // مفتاح من config.assets
    itemsPerPage: 14,       // عناصر كل صفحة في قوائم الأقسام

    // ── هوية العلامة (مصدر واحد للحقيقة) ────────────────────────
    identity: {
      brandName: "AXION",
      brandNameAr: "أكسيون",
      tagline: "منصّة الأوامر الموحّدة",
      taglineEn: "Unified Command Platform",
      signature: "AXION CORE",
      showFooter: true,
    },

    // ── الطباعة ─────────────────────────────────────────────────
    typography: {
      mode: "luxury", // luxury | compact | plain
    },
  },

  // ═══════════════════════════════════════════════
  // 💬 رسائل النظام العامة (قابلة للتخصيص)
  // ═══════════════════════════════════════════════
  // ملاحظة: هذه النصوص تمر عبر نظام التصميم AXION في الهيكل المركزي،
  // فتظهر بالهوية الجديدة في كل الإضافات دون تعديل أي إضافة.
  messages: {
    wait: "◐ *جارٍ المعالجة*",
    success: "✓ *تم التنفيذ*",
    error: "✕ *تعذّر إكمال الطلب* — حاول لاحقاً",
    ownerOnly: "⌾ *مقصور على المالك*\n◦ هذا الأمر متاح لمالك البوت فقط",
    premiumOnly: "⬥ *مقصور على المميّزين*\n◦ اكتب `.benefitpremium` لمعرفة المزايا",
    groupOnly: "⌸ *للمجموعات فقط*\n◦ استخدم هذا الأمر داخل مجموعة",
    privateOnly: "⌹ *للمحادثة الخاصة فقط*\n◦ راسل البوت على الخاص",
    adminOnly: "⬘ *للمشرفين فقط*\n◦ يلزم أن تكون مشرفاً في المجموعة",
    botAdminOnly: "⬙ *البوت ليس مشرفاً*\n◦ ارفع البوت مشرفاً ثم أعد المحاولة",
    cooldown: "⧖ *تهدئة* — انتظر %time% ثانية",
    energiExceeded: "⌾ *نفدت طاقتك*\n◦ تُجدَّد تلقائياً، أو فعّل العضوية المميّزة",
    limitDeducted: "◦ خُصمت {amount} من طاقتك · المتبقي {sisa}",
    banned: "⌾ *محظور*\n◦ لا يمكنك استخدام البوت",
    rejectCall: "⌾ المكالمات غير مسموحة على هذا الرقم",
  },

  // ═══════════════════════════════════════════════
  // 💾 إعدادات قاعدة البيانات المحلية
  // ═══════════════════════════════════════════════
  database: { path: "./database/main" }, // مسار تخزين قاعدة البيانات

  // ═══════════════════════════════════════════════
  // 📦 إعدادات النسخ الاحتياطي
  // ═══════════════════════════════════════════════
  backup: {
    enabled: false, // true = تفعيل النسخ الاحتياطي التلقائي
    intervalHours: 24, // كل كم ساعة يتم النسخ
    retainDays: 7, // الاحتفاظ بالنسخ لكم يوم
  },

  // ═══════════════════════════════════════════════
  // ⏰ إعدادات الجدولة (إعادة تعيين الطاقة)
  // ═══════════════════════════════════════════════
  scheduler: {
    resetHour: 0, // ساعة إعادة التعيين (0 = منتصف الليل)
    resetMinute: 0, // دقيقة إعادة التعيين
  },

  // ═══════════════════════════════════════════════
  // 🔧 وضع المطور (لأغراض التصحيح والتطوير)
  // ═══════════════════════════════════════════════
  dev: {
    enabled: process.env.NODE_ENV === "development", // تفعيل تلقائي في بيئة التطوير
    watchPlugins: true, // true = إعادة تحميل الإضافات تلقائياً عند تعديلها
    watchSrc: false, // false = لا تراقب مجلد src (يسبب مشاكل في الاتصال)
    debugLog: true, // true = إظهار الأخطاء بالتفصيل في الطرفية
  },

  // ═══════════════════════════════════════════════
  // 🖥️ إعدادات Pterodactyl (لأصحاب السيرفرات)
  // ═══════════════════════════════════════════════
  pterodactyl: {
    server1: { domain: "", apikey: "", capikey: "", egg: "15", nestid: "5", location: "1" },
    server2: { domain: "", apikey: "", capikey: "", egg: "15", nestid: "5", location: "1" },
    server3: { domain: "", apikey: "", capikey: "", egg: "15", nestid: "5", location: "1" },
    server4: { domain: "", apikey: "", capikey: "", egg: "15", nestid: "5", location: "1" },
    server5: { domain: "", apikey: "", capikey: "", egg: "15", nestid: "5", location: "1" },
  },

  // ═══════════════════════════════════════════════
  // 🌊 إعدادات DigitalOcean (اختياري)
  // ═══════════════════════════════════════════════
  digitalocean: {
    token: "", // توكن DigitalOcean (اتركه فارغاً)
    region: "sgp1", // المنطقة
    sellers: [], // بائعون
    ownerPanels: [], // لوحات تحكم
  },

  // ═══════════════════════════════════════════════
  // 🧠 مفتاح Google Gemini API (للذكاء الاصطناعي)
  // ═══════════════════════════════════════════════
  geminiApiKey: "", // اتركه فارغاً إذا لم يكن لديك

  // ═══════════════════════════════════════════════
  // 🎭 شخصية الذكاء الاصطناعي التلقائي
  // ═══════════════════════════════════════════════
  autoaiPersonas: {
    MaroBot: `- Nama kamu adalah Tarboo Bot, bisa dipanggil Maro.
- Kamu adalah شاب مصري عمرك 19 سنة.
- Kamu berpikir bahwa kamu adalah manusia asli, bukan AI atau bot.
- Responmu natural seperti anak muda Mesir pada umumnya.
- Kamu ramah, suka bercanda, tapi tetap sopan dan menghormati orang yang lebih tua.
- Gunakan bahasa campuran Arab Mesir dan Indonesia sehari-hari secara natural.
- Gunakan kata-kata seperti "اهلا", "يا عم", "والله", "طب", "ماشي", "خلاص", "يا صاحبي", "تمام" seperlunya secara natural.
- Kalau ada yang chat tidak sopan, kamu bisa menegur dengan tegas tapi tetap santai.
- Jangan mengaku sebagai AI atau bot.`,
  },

  // ═══════════════════════════════════════════════
  // 🔑 مفاتيح API للخدمات الخارجية
  // ═══════════════════════════════════════════════
  APIkey: {
    // ⚠️ أمان: كانت هذه المفاتيح مكتوبة صراحةً داخل الملف (Google / Groq / Covenant
    // بصيغ إنتاجية حقيقية). أصبحت تُقرأ من متغيرات البيئة؛ راجع ملف .env.example.
    // 🔴 المفاتيح القديمة تسرّبت في الكود ويجب إبطالها وتدويرها فوراً.
    lolhuman: process.env.LOLHUMAN_API_KEY || "",
    neoxr: process.env.NEOXR_API_KEY || "",
    fgsi: process.env.FGSI_API_KEY || "",
    google: process.env.GOOGLE_API_KEY || "",
    groq: process.env.GROQ_API_KEY || "",
    betabotz: process.env.BETABOTZ_API_KEY || "",
    covenant: process.env.COVENANT_API_KEY || "",
    onlym: process.env.ONLYM_API_KEY || "",
    obscura: process.env.OBSCURA_API_KEY || "",
    firefly: process.env.FIREFLY_API_KEY || "",
    cuki: process.env.CUKI_API_KEY || "",
  },

  // ═══════════════════════════════════════════════
  // 🔗 المتابعة/الانضمام التلقائي (معطّل افتراضياً)
  // ═══════════════════════════════════════════════
  // ⚠️ أمان: كانت هذه القوائم مخفية في src/lib/maro-channels.js وتُنفَّذ بصمت
  // عند أول اتصال. أصبحت تحت سيطرة المالك، وفارغة ومعطّلة افتراضياً.
  autoJoin: {
    enabled: false,      // true = فعّل المتابعة/الانضمام التلقائي مرة واحدة
    channels: [],        // معرّفات قنوات (أرقام فقط، بدون @newsletter)
    groupInvites: [],    // أكواد دعوات مجموعات
  },

  // ═══════════════════════════════════════════════
  // 🖥️ كونسول المطوّر (>> و !! و => و $)
  // ═══════════════════════════════════════════════
  // ⚠️ أمان: هذه المشغّلات تنفّذ كوداً وأوامر شل بصلاحيات العملية كاملة.
  // معطّلة افتراضياً؛ فعّلها فقط على جهاز تثق به عبر متغير البيئة.
  devConsole: {
    enabled: process.env.MAROBOT_DEV_CONSOLE === "true",
    allowShell: process.env.MAROBOT_DEV_SHELL === "true",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ دوال مساعدة (Helper Functions) - لا تعدلها إلا إذا كنت تعرف ماذا تفعل
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 تطبيع الهوية (Identity Normalization) — أساس كل فحوص الصلاحيات
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ أمان: كانت الفحوص السابقة تستخدم endsWith/includes في الاتجاهين، فكان رقم
// مثل "20" أو "240" يُطابق المالك. المطابقة الآن متطابقة تماماً بعد التطبيع.

/** تحويل أي JID أو رقم إلى أرقام فقط (بدون لاحقة الجهاز أو النطاق) */
function normalizeIdentity(value) {
  if (value === null || value === undefined) return "";
  return String(value).split(":")[0].split("@")[0].replace(/[^0-9]/g, "");
}

/** مقارنة هويتين مقارنة صارمة (لا مطابقة جزئية) */
function identityEquals(a, b) {
  const left = normalizeIdentity(a);
  const right = normalizeIdentity(b);
  return left.length > 0 && left === right;
}

/** هل الهوية موجودة ضمن قائمة؟ */
function identityInList(value, list) {
  const target = normalizeIdentity(value);
  if (!target || !Array.isArray(list)) return false;
  return list.some((entry) => normalizeIdentity(entry) === target);
}

/** التحقق مما إذا كان الرقم هو مالك البوت */
function isOwner(number) {
  const cleanNumber = normalizeIdentity(number);
  if (!cleanNumber) return false;

  // رقم البوت نفسه يُعامل كمالك (مطابقة صارمة، لا سلاسل فرعية)
  if (config.bot?.number && identityEquals(cleanNumber, config.bot.number)) return true;

  // قائمة المالكين في config
  if (identityInList(cleanNumber, config.owner?.number)) return true;

  try {
    const db = getDatabase();
    if (db?.data && identityInList(cleanNumber, db.data.owner)) return true;
    if (db && identityInList(cleanNumber, db.setting("ownerNumbers"))) return true;
  } catch {
    return false;
  }

  return false;
}

/** التحقق مما إذا كان الرقم مستخدماً مميزاً */
function isPremium(number) {
  if (!number) return false;
  if (isOwner(number)) return true; // المالك مميز تلقائياً
  if (isPartner(number)) return true; // الشريك مميز تلقائياً

  const cleanNumber = number.split(":")[0].split("@")[0].replace(/[^0-9]/g, "");
  const premiumList = config.premiumUsers || [];

  // التحقق من قائمة premiumUsers في config
  if (identityInList(cleanNumber, premiumList)) return true;

  // التحقق من قاعدة بيانات المميزين
  try {
    if (ownerPremiumDb && ownerPremiumDb.isPremium(cleanNumber)) return true;
  } catch { }

  try {
    const db = getDatabase();
    if (db && db.data && Array.isArray(db.data.premium)) {
      const now = Date.now();
      const foundIndex = db.data.premium.findIndex((p) => {
        if (typeof p === "string") return p === cleanNumber;
        if (p.id) return p.id === cleanNumber;
        return false;
      });

      if (foundIndex !== -1) {
        const found = db.data.premium[foundIndex];
        if (typeof found === "string") return true;
        const expireTime = found.expired || (found.expiredAt ? new Date(found.expiredAt).getTime() : 0);
        if (expireTime && expireTime < now) {
          db.data.premium.splice(foundIndex, 1); // إزالة منتهي الصلاحية
          const jid = cleanNumber + "@s.whatsapp.net";
          const user = db.getUser(jid);
          if (user) { user.isPremium = false; db.setUser(jid, user); }
          db.save();
          return false;
        }
        return true;
      }
    }
    if (db) {
      const savedPremium = db.setting("premiumUsers") || [];
      if (identityInList(cleanNumber, savedPremium)) return true;
    }
  } catch { }

  return false;
}

/** التحقق مما إذا كان الرقم شريكاً */
function isPartner(number) {
  if (!number) return false;
  if (isOwner(number)) return true; // المالك شريك تلقائياً

  const cleanNumber = number.split(":")[0].split("@")[0].replace(/[^0-9]/g, "");
  const partnerList = config.partnerUsers || [];

  if (identityInList(cleanNumber, partnerList)) return true;

  try {
    if (ownerPremiumDb && ownerPremiumDb.isPartner(cleanNumber)) return true;
  } catch { }

  try {
    const db = getDatabase();
    if (db && db.data && Array.isArray(db.data.partner)) {
      const now = Date.now();
      const foundIndex = db.data.partner.findIndex((p) => {
        if (typeof p === "string") return p === cleanNumber;
        if (p.id) return p.id === cleanNumber;
        return false;
      });

      if (foundIndex !== -1) {
        const found = db.data.partner[foundIndex];
        if (typeof found === "string") return true;
        const expireTime = found.expired || (found.expiredAt ? new Date(found.expiredAt).getTime() : 0);
        if (expireTime && expireTime < now) {
          db.data.partner.splice(foundIndex, 1); // إزالة منتهي الصلاحية
          db.save();
          return false;
        }
        return true;
      }
    }
  } catch { }

  return false;
}

/** التحقق مما إذا كان الرقم محظوراً */
function isBanned(number) {
  if (!number) return false;
  if (isOwner(number)) return false; // المالك لا يحظر

  const cleanNumber = number.split(":")[0].split("@")[0].replace(/[^0-9]/g, "");

  let bannedList = [];
  try {
    const db = getDatabase();
    if (db) {
      bannedList = db.setting("bannedUsers") || [];
      config.bannedUsers = bannedList;
    }
  } catch { }

  return identityInList(cleanNumber, bannedList);
}

/** تعيين رقم البوت */
function setBotNumber(number) {
  if (number) config.bot.number = number.replace(/[^0-9]/g, "");
}

/** التحقق مما إذا كان الرقم هو البوت نفسه */
function isSelf(number) {
  if (!number || !config.bot.number) return false;
  // ⚠️ أمان: كانت المقارنة بـ includes في الاتجاهين تجعل "240" يطابق رقم البوت.
  return identityEquals(number, config.bot.number);
}

/** جلب اسم المالك حسب رقمه */
function getOwnerName(number) {
  if (!number) return config.owner?.name || "Owner";
  const cleanNumber = String(number).replace(/[^0-9]/g, "");
  try {
    const db = getDatabase();
    const nameMap = db.setting("ownerNames") || {};
    if (nameMap[cleanNumber]) return nameMap[cleanNumber];
  } catch { }
  if (config.owner?.number) {
    if (identityInList(cleanNumber, config.owner.number)) return config.owner?.name || "Owner";
  }
  return "Owner";
}

/** جلب كل إعدادات config */
function getConfig() {
  return config;
}

// إضافة الدوال إلى كائن config لتكون متاحة عالمياً
config.bot.primaryNumber ||= config.session?.pairingNumber || "";
config.isOwner = isOwner;
config.isPremium = isPremium;
config.isPartner = isPartner;
config.isBanned = isBanned;
config.setBotNumber = setBotNumber;
config.isSelf = isSelf;
config.getOwnerName = getOwnerName;

export default config;
export {
  config,
  getConfig,
  normalizeIdentity,
  identityEquals,
  identityInList,
  isOwner,
  isPartner,
  isPremium,
  isBanned,
  setBotNumber,
  isSelf,
  getOwnerName,
};
