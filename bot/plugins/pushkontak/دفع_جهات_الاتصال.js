// دفع_جهات_الاتصال - أمر لإرسال رسائل لجميع أعضاء المجموعة + حفظ جهات الاتصال تلقائياً بصيغة VCF

import fs from "fs";
import path from "path";
import { getDatabase } from "../../src/lib/maro-database.js";
import { getGroupMode } from "../group/وضع_البوت.js";
import te from "../../src/lib/maro-error.js";
import config from "../../config.js";
import {
  resolveAnyLidToJid,
  isLidConverted,
  getCachedJid,
} from "../../src/lib/maro-lid.js";

const pluginConfig = {
  name: "دفع_جهات_الاتصال",
  alias: [
    "pushkontak",
    "puskontak",
    "push",
    "stoppush",
    "setjedapush",
    "pushkontak_start",
    "kelolapush",
    "autovcf_on",
    "autovcf_off",
    "kodeunik_on",
    "kodeunik_off",
    "vcftarget_private",
    "vcftarget_group",
    "skipadmin_on",
    "skipadmin_off",
  ],
  category: "pushkontak",
  description: "إرسال رسائل لجميع أعضاء المجموعة + حفظ جهات الاتصال تلقائياً بصيغة VCF",
  usage: ".دفع_جهات_الاتصال",
  example: ".دفع_جهات_الاتصال",
  isOwner: true,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

if (!global.pushkontakSessions) global.pushkontakSessions = {};

const SESSION_TIMEOUT = 300000;
const SERIAL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

import axios from "axios";
import { getAssetBuffer } from "../../src/lib/maro-asset-manager.js";

let cachedThumb = null;
let cachedDoc = null;
try {
  if (getAssetBuffer("maro")) {
    cachedThumb = getAssetBuffer("maro");
  }
  cachedDoc = fs.readFileSync("./package.json");
} catch { }

function serial(len) {
  let r = "";
  for (let i = 0; i < len; i++)
    r += SERIAL_CHARS[Math.floor(Math.random() * SERIAL_CHARS.length)];
  return r;
}

function buildVcf(contacts) {
  return contacts
    .map((jid) => {
      const num = jid.split("@")[0];
      return `BEGIN:VCARD\nVERSION:3.0\nFN:WA[${serial(2)}] ${num}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD\n`;
    })
    .join("");
}

function resolveParticipants(metadata, botId, senderJid, skipAdmin = false) {
  return metadata.participants
    .filter((p) => {
      if (skipAdmin && (p.admin === "admin" || p.admin === "superadmin"))
        return false;
      return true;
    })
    .map((p) => {
      if (p.phoneNumber) return p.phoneNumber;
      if (p.jid && !p.jid.endsWith("@lid")) return p.jid;
      if (p.id && !p.id.endsWith("@lid")) return p.id;
      const resolved = resolveAnyLidToJid(p.jid || p.id, metadata.participants);
      if (resolved && !resolved.endsWith("@lid") && !isLidConverted(resolved))
        return resolved;
      const cached = getCachedJid(p.jid || p.id || p.lid || "");
      if (cached && !cached.endsWith("@lid") && !isLidConverted(cached))
        return cached;
      return null;
    })
    .filter((id) => id && id !== botId && !id.includes(senderJid));
}

function getSession(jid) {
  return global.pushkontakSessions[jid] || null;
}

function clearSession(jid) {
  const s = global.pushkontakSessions[jid];
  if (s?.timeout) clearTimeout(s.timeout);
  delete global.pushkontakSessions[jid];
}

function createSession(jid, chatJid) {
  clearSession(jid);
  const session = {
    step: "message",
    message: null,
    chatJid,
    promptId: null,
    startedAt: Date.now(),
    timeout: setTimeout(() => {
      delete global.pushkontakSessions[jid];
    }, SESSION_TIMEOUT),
  };
  global.pushkontakSessions[jid] = session;
  return session;
}

function nativeFlowMsg(m, title, buttons) {
  return {
    interactiveMessage: {
      title,
      footer: config.bot?.name || "Maro-AI",
      image: cachedThumb,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 7,
        isForwarded: true,
      },
      nativeFlowMessage: {
        messageParamsJson: JSON.stringify({
          limited_time_offer: {
            text: config.bot?.name || "Maro-AI",
            url: "",
            copy_code: "دفع جهات الاتصال",
            expiration_time: Date.now() * 7,
          },
          bottom_sheet: {
            in_thread_buttons_limit: 2,
            divider_indices: [1, 2, 3, 4, 5, 999],
            list_title: "دفع جهات الاتصال",
            button_title: "📢 اختر الميزة",
          },
          tap_target_configuration: {
            title: " X ",
            description: "bomboclard",
            canonical_url: "https://maro.site",
            domain: "shop.example.com",
            button_index: 0,
          },
        }),
        buttons,
      },
    },
  };
}

async function sendVcf(sock, ownerJid, contacts, groupName) {
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const vcfPath = path.join(tmpDir, `pushkontak_${Date.now()}.vcf`);
  fs.writeFileSync(vcfPath, buildVcf(contacts), "utf8");
  await sock.sendMessage(ownerJid, {
    document: fs.readFileSync(vcfPath),
    fileName: `جهات_الاتصال_${groupName || "المجموعة"}_${contacts.length}.vcf`,
    mimetype: "text/vcard",
    caption:
      `💾 *حفظ جهات الاتصال تلقائياً*\n\n` +
      `📊 *الإجمالي:* ${contacts.length} جهة اتصال\n` +
      `👥 *المجموعة:* ${groupName || "غير معروفة"}\n\n` +
      `📱 _قم باستيراد هذا الملف إلى هاتفك لحفظ جميع جهات الاتصال_`,
  });
  try {
    fs.unlinkSync(vcfPath);
  } catch { }
}

async function handleStop(m) {
  if (!global.statuspush) {
    return m.reply(
      `❌ *فشل*\n\n🚫 *لا توجد عملية دفع جهات اتصال جارية حالياً*`,
    );
  }
  global.stoppush = true;
  m.react("⏹️");
  return m.reply(
    `⏹️ *تم إيقاف الدفع*\n\n✅ *سيتم إيقاف عملية دفع جهات الاتصال قريباً*`,
  );
}

function getPushSettings(db) {
  return {
    autoVcf: db.setting("pushAutoVcf") !== false,
    kodeUnik: db.setting("pushKodeUnik") !== false,
    vcfTarget: db.setting("pushVcfTarget") || "private",
    skipAdmin: db.setting("pushSkipAdmin") === true,
    jeda: db.setting("jedaPush") || 5000,
  };
}

async function handleKelola(m, sock) {
  const db = getDatabase();
  const s = getPushSettings(db);
  const p = m.prefix;

  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }),
    },
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "⚙️ إدارة دفع جهات الاتصال",
        sections: [
          {
            title: "💾 حفظ VCF تلقائي",
            highlight_label: s.autoVcf ? "ON" : "OFF",
            rows: [
              {
                title: `${s.autoVcf ? "🔴" : "🟢"} حفظ VCF تلقائي: ${s.autoVcf ? "إيقاف" : "تشغيل"}`,
                id: `${p}${s.autoVcf ? "autovcf_off" : "autovcf_on"}`,
                description: "حفظ جهات الاتصال في ملف VCF تلقائياً بعد الدفع",
              },
            ],
          },
          {
            title: "🔑 رمز فريد",
            highlight_label: s.kodeUnik ? "ON" : "OFF",
            rows: [
              {
                title: `${s.kodeUnik ? "🔴" : "🟢"} رمز فريد: ${s.kodeUnik ? "إيقاف" : "تشغيل"}`,
                id: `${p}${s.kodeUnik ? "kodeunik_off" : "kodeunik_on"}`,
                description: "إضافة رمز عشوائي في نهاية كل رسالة",
              },
            ],
          },
          {
            title: "📱 وجهة ملف VCF",
            highlight_label: s.vcfTarget === "private" ? "خاص" : "المجموعة",
            rows: [
              {
                title: `${s.vcfTarget === "private" ? "✅" : "⬜"} إرسال إلى الخاص`,
                id: `${p}vcftarget_private`,
                description: "إرسال ملف VCF إلى المحادثة الخاصة للمالك",
              },
              {
                title: `${s.vcfTarget === "group" ? "✅" : "⬜"} إرسال إلى المجموعة`,
                id: `${p}vcftarget_group`,
                description: "إرسال ملف VCF إلى المجموعة",
              },
            ],
          },
          {
            title: "👑 تخطي المشرفين",
            highlight_label: s.skipAdmin ? "ON" : "OFF",
            rows: [
              {
                title: `${s.skipAdmin ? "🔴" : "🟢"} تخطي المشرفين: ${s.skipAdmin ? "إيقاف" : "تشغيل"}`,
                id: `${p}${s.skipAdmin ? "skipadmin_off" : "skipadmin_on"}`,
                description: "تخطي إرسال الرسائل لمشرفي المجموعة",
              },
            ],
          },
          {
            title: "⏱️ مدة الانتظار",
            highlight_label: `${(s.jeda / 1000).toFixed(0)}ث`,
            rows: [
              {
                title: "⚡ 3 ثواني",
                id: `${p}setjedapush 3000`,
                description: "سريع، خطر الحظر مرتفع",
              },
              {
                title: "🔄 5 ثواني",
                id: `${p}setjedapush 5000`,
                description: "طبيعي، موصى به",
              },
              {
                title: "🛡️ 10 ثواني",
                id: `${p}setjedapush 10000`,
                description: "آمن من الحظر",
              },
              {
                title: "🐢 15 ثانية",
                id: `${p}setjedapush 15000`,
                description: "آمن جداً",
              },
            ],
          },
        ],
        has_multiple_buttons: true,
      }),
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "📢 بدء الدفع",
        id: `${p}pushkontak_start`,
      }),
    },
  ];

  return sock.sendMessage(
    m.chat,
    nativeFlowMsg(
      m,
      `⚙️ *إدارة دفع جهات الاتصال*

` +
      `📋 *الإعدادات الحالية*\n\n` +
      `💾 حفظ VCF تلقائي: *${s.autoVcf ? "✅ ON" : "❌ OFF"}*\n` +
      `🔑 رمز فريد: *${s.kodeUnik ? "✅ ON" : "❌ OFF"}*\n` +
      `📱 وجهة VCF: *${s.vcfTarget === "private" ? "خاص" : "المجموعة"}*\n` +
      `👑 تخطي المشرفين: *${s.skipAdmin ? "✅ ON" : "❌ OFF"}*\n` +
      `⏱️ مدة الانتظار: *${s.jeda}مللي (${(s.jeda / 1000).toFixed(1)}ث)*\n\n` +
      `📌 *اختر من الأزرار أدناه لتغيير الإعدادات*`,
      buttons,
    ),
    { quoted: m },
  );
}

async function handleSettingToggle(m, settingKey, label, onVal, offVal) {
  const db = getDatabase();
  const cmd = m.command?.toLowerCase();
  const isOn = cmd.endsWith("_on");
  db.setting(settingKey, isOn ? onVal : offVal);
  m.react(isOn ? "✅" : "🔴");
  await m.reply(
    `${isOn ? "✅" : "🔴"} *تم ${isOn ? "تشغيل" : "إيقاف"} ${label}*

` + `⚙️ *${label}:* ${isOn ? "ON" : "OFF"}`,
  );
}

async function handleSetJeda(m, sock) {
  const db = getDatabase();
  const val = parseInt(m.args[1] || m.args[0]);

  if (!val || isNaN(val)) {
    const current = db.setting("jedaPush") || 5000;
    const buttons = [
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }),
      },
      {
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "⏱️ اختر مدة الانتظار",
          sections: [
            {
              title: "⏱️ مدة الانتظار الموصى بها لدفع جهات الاتصال",
              highlight_label: "موصى به",
              rows: [
                {
                  title: "⚡ 3 ثواني (سريع)",
                  id: `${m.prefix}setjedapush 3000`,
                  description: "خطر الحظر أعلى",
                },
                {
                  title: "🔄 5 ثواني (طبيعي)",
                  id: `${m.prefix}setjedapush 5000`,
                  description: "موصى به للاستخدام العادي",
                },
                {
                  title: "🛡️ 10 ثواني (آمن)",
                  id: `${m.prefix}setjedapush 10000`,
                  description: "الأكثر أماناً من خطر الحظر",
                },
                {
                  title: "🐢 15 ثانية (آمن جداً)",
                  id: `${m.prefix}setjedapush 15000`,
                  description: "للمجموعات الكبيرة 500+ عضو",
                },
                {
                  title: "🏔️ 30 ثانية (حد أقصى)",
                  id: `${m.prefix}setjedapush 30000`,
                  description: "أطول مدة انتظار",
                },
              ],
            },
          ],
          has_multiple_buttons: true,
        }),
      },
    ];
    return sock.sendMessage(
      m.chat,
      nativeFlowMsg(
        m,
        `⏱️ *تعيين مدة الانتظار لدفع جهات الاتصال*\n\n` +
        `📋 *تحديد الفاصل الزمني بين إرسال كل رسالة*\n\n` +
        `⏱️ *المدة الحالية:* ${current}مللي (${(current / 1000).toFixed(1)} ثانية)\n\n` +
        `*طريقة الاستخدام:*\n` +
        `📝 *${m.prefix}setjedapush <مللي>* — تغيير مدة الانتظار\n\n` +
        `*شرح:*\n` +
        `1. مدة الانتظار هي الوقت بين إرسال كل رسالة لعضو\n` +
        `2. كلما قلت المدة، انتهى الدفع بشكل أسرع، لكن خطر الحظر أعلى\n` +
        `3. الحد الأدنى الموصى به *3000مللي* (3 ثواني) للأمان\n` +
        `4. الحد الأقصى *30000مللي* (30 ثانية)\n\n` +
        `📌 *اختر مدة الانتظار من الأزرار أدناه أو اكتب يدوياً*`,
        buttons,
      ),
      { quoted: m },
    );
  }

  if (val < 1000 || val > 30000) {
    return m.reply(`❌ *فشل*\n\n🚫 *يجب أن تكون المدة بين 1000مللي - 30000مللي*`);
  }

  db.setting("jedaPush", val);
  m.react("✅");
  return m.reply(
    `✅ *تم تغيير مدة الانتظار*\n\n` +
    `⏱️ *المدة الجديدة:* ${val}مللي (${(val / 1000).toFixed(1)} ثانية)`,
  );
}

async function handlePush(m, sock) {
  const db = getDatabase();
  const groupMode = getGroupMode(m.chat, db);

  if (groupMode !== "pushkontak" && groupMode !== "all") {
    const buttons = [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "🔓 تفعيل وضع دفع جهات الاتصال",
          id: `${m.prefix}botmode pushkontak`,
        }),
      },
    ];
    return sock.sendMessage(
      m.chat,
      nativeFlowMsg(
        m,
        `❌ *الوضع غير مناسب*\n\n` +
        `🔒 *هذه المجموعة ليست في وضع دفع جهات الاتصال*\n\n` +
        `*طريقة التفعيل:*\n` +
        `1. اضغط على الزر أدناه لتفعيل وضع دفع جهات الاتصال\n` +
        `2. بعد تغيير الوضع، أعد تنفيذ أمر الدفع`,
        buttons,
      ),
      { quoted: m },
    );
  }

  const text = m.text?.trim();

  if (text) {
    return startPush(m, sock, text);
  }

  const s = getPushSettings(db);
  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({ has_multiple_buttons: true }),
    },
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "📋 اختر الميزة",
        sections: [
          {
            title: "📢 الإجراءات",
            highlight_label: "دفع جهات الاتصال",
            rows: [
              {
                title: "📢 بدء الدفع (جلسة إدخال)",
                id: `${m.prefix}pushkontak_start`,
                description: "إدخال الرسالة ثم دفعها لجميع الأعضاء",
              },
              {
                title: "⏹️ إيقاف الدفع",
                id: `${m.prefix}stoppush`,
                description: "إيقاف عملية الدفع الجارية",
              },
            ],
          },
          {
            title: "⚙️ إدارة سريعة",
            highlight_label: "الإعدادات",
            rows: [
              {
                title: "⚙️ إدارة دفع جهات الاتصال",
                id: `${m.prefix}kelolapush`,
                description: `VCF:${s.autoVcf ? "ON" : "OFF"} | رمز:${s.kodeUnik ? "ON" : "OFF"} | مدة:${(s.jeda / 1000).toFixed(0)}ث`,
              },
              {
                title: "⏱️ تعيين مدة الانتظار",
                id: `${m.prefix}setjedapush`,
                description: `المدة الحالية: ${s.jeda}مللي`,
              },
            ],
          },
        ],
        has_multiple_buttons: true,
      }),
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "⚙️ إدارة",
        id: `${m.prefix}kelolapush`,
      }),
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: "📢 بدء الدفع",
        id: `${m.prefix}pushkontak_start`,
      }),
    },
  ];
  return sock.sendMessage(
    m.chat,
    nativeFlowMsg(
      m,
      `📢 *دفع جهات الاتصال*\n\n` +
      `📋 *إرسال رسائل لجميع أعضاء المجموعة تلقائياً + حفظ جهات الاتصال في ملف VCF*\n\n` +
      `*طريقة الاستخدام:*\n` +
      `📝 *${m.prefix}دفع_جهات_الاتصال <الرسالة>* — دفع مباشر برسالة\n` +
      `📢 *${m.prefix}دفع_جهات_الاتصال* — فتح القائمة التفاعلية\n` +
      `⏹️ *${m.prefix}stoppush* — إيقاف الدفع الجاري\n` +
      `⏱️ *${m.prefix}setjedapush <مللي>* — تعيين مدة الانتظار بين الإرسال\n\n` +
      `*شرح خطوات الاستخدام:*\n` +
      `1. تأكد من أن المجموعة في وضع دفع جهات الاتصال: *${m.prefix}botmode pushkontak*\n` +
      `2. اكتب *${m.prefix}دفع_جهات_الاتصال* ثم اختر "بدء الدفع" من القائمة\n` +
      `3. سيطالبك البوت بإدخال الرسالة التي تريد إرسالها عبر الرد\n` +
      `4. بعد التأكيد، يرسل البوت الرسالة لكل عضو على حدة\n` +
      `5. تتم إضافة رمز فريد لكل رسالة لتمييزها من قبل واتساب\n` +
      `6. بعد الانتهاء، يرسل البوت تلقائياً ملف VCF يحتوي على جميع جهات الاتصال\n\n` +
      `*معلومات:*\n` +
      `📋 *الإعدادات*\n\n` +
      `💾 حفظ VCF تلقائي: *${s.autoVcf ? "✅ ON" : "❌ OFF"}*\n` +
      `🔑 رمز فريد: *${s.kodeUnik ? "✅ ON" : "❌ OFF"}*\n` +
      `📱 وجهة VCF: *${s.vcfTarget === "private" ? "خاص" : "المجموعة"}*\n` +
      `👑 تخطي المشرفين: *${s.skipAdmin ? "✅ ON" : "❌ OFF"}*\n` +
      `⏱️ مدة الانتظار: *${s.jeda}مللي (${(s.jeda / 1000).toFixed(1)}ث)*\n\n` +
      `🔑 *الصلاحية:* المالك فقط`,
      buttons,
    ),
    { quoted: m },
  );
}

async function handleStartSession(m, sock) {
  const db = getDatabase();
  const groupMode = getGroupMode(m.chat, db);

  if (groupMode !== "pushkontak" && groupMode !== "all") {
    return m.reply(
      `❌ *فشل*\n\n🔒 *فعّل وضع دفع جهات الاتصال أولاً*\n\n📝 *${m.prefix}botmode pushkontak*`,
    );
  }

  if (global.statuspush) {
    return m.reply(
      `❌ *فشل*\n\n🔄 *دفع جهات الاتصال جارٍ حالياً*\n\n⏹️ *اكتب* ${m.prefix}stoppush *لإيقافه*`,
    );
  }

  if (getSession(m.sender)) {
    return m.reply(
      `📝 *جلسة الدفع نشطة بالفعل*\n\n📩 *رد على الرسالة السابقة بالرسالة التي تريد دفعها*\n\n❌ *أو رد* \`إلغاء\` *لإلغاء الجلسة*`,
    );
  }

  const session = createSession(m.sender, m.chat);

  const sent = await m.reply(
    `📢 *جلسة دفع جهات الاتصال*\n\n` +
    `📝 *الخطوة 1/2 — إدخال الرسالة*\n\n` +
    `🔤 *أرسل الرسالة التي تريد دفعها لجميع الأعضاء*\n\n` +
    `📩 *رد على هذه الرسالة بالرسالة التي تريد إرسالها*\n\n` +
    `❌ *رد* \`إلغاء\` *لإلغاء الجلسة*`,
  );

  session.promptId = sent?.key?.id || null;
  m.react("📝");
}

async function startPush(m, sock, text) {
  if (global.statuspush) {
    return m.reply(
      `❌ *فشل*\n\n🔄 *دفع جهات الاتصال جارٍ حالياً*\n\n⏹️ *اكتب* ${m.prefix}stoppush *لإيقافه*`,
    );
  }

  m.react("📢");

  try {
    const db = getDatabase();
    const metadata = m.groupMetadata;
    const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const s = getPushSettings(db);
    const participants = resolveParticipants(
      metadata,
      botId,
      m.sender,
      s.skipAdmin,
    );

    if (participants.length === 0) {
      m.react("❌");
      return m.reply(
        `❌ *فشل*\n\n🚫 *لا يوجد أعضاء لإرسال الرسائل إليهم*`,
      );
    }

    const jedaPush = s.jeda;
    const estimasi = Math.ceil((participants.length * jedaPush) / 60000);

    const buttons = [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "⏹️ إيقاف الدفع",
          id: `${m.prefix}stoppush`,
        }),
      },
    ];

    await sock.sendMessage(
      m.chat,
      nativeFlowMsg(
        m,
        `📢 *بدأ دفع جهات الاتصال*\n\n` +
        `📝 *الرسالة:* ${text.substring(0, 80)}${text.length > 80 ? "..." : ""}\n` +
        `👥 *الهدف:* ${participants.length} عضو\n` +
        `⏱️ *مدة الانتظار:* ${jedaPush}مللي\n` +
        `📊 *الوقت المتوقع:* ${estimasi} دقيقة\n` +
        `💾 *حفظ VCF تلقائي:* ${s.autoVcf ? "ON" : "OFF"} | 🔑 *رمز فريد:* ${s.kodeUnik ? "ON" : "OFF"}\n\n` +
        `🔄 *جاري بدء الدفع...*`,
        buttons,
      ),
      { quoted: m },
    );

    global.statuspush = true;
    let success = 0;
    let failed = 0;
    const saved = [];

    for (const member of participants) {
      if (global.stoppush) {
        delete global.stoppush;
        delete global.statuspush;
        await m.reply(
          `⏹️ *تم إيقاف الدفع*\n\n` +
          `✅ *نجاح:* ${success}\n` +
          `❌ *فشل:* ${failed}\n` +
          `⏸️ *المتبقي:* ${participants.length - success - failed}`,
        );
        if (saved.length > 0 && s.autoVcf) {
          const vcfTarget = s.vcfTarget === "group" ? m.chat : m.sender;
          await sendVcf(sock, vcfTarget, saved, metadata.subject);
        }
        return;
      }

      try {
        const msgText = s.kodeUnik ? `${text}\n\n#${serial(6)}` : text;
        await sock.sendMessage(member, { text: msgText });
        saved.push(member);
        success++;
      } catch {
        failed++;
      }

      await new Promise((r) => setTimeout(r, jedaPush));
    }

    delete global.statuspush;
    if (saved.length > 0 && s.autoVcf) {
      const vcfTarget = s.vcfTarget === "group" ? m.chat : m.sender;
      await sendVcf(sock, vcfTarget, saved, metadata.subject);
    }

    m.react("✅");

    const doneButtons = [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "📢 دفع مرة أخرى",
          id: `${m.prefix}pushkontak_start`,
        }),
      },
    ];

    await sock.sendMessage(
      m.chat,
      nativeFlowMsg(
        m,
        `✅ *اكتمل الدفع*\n\n` +
        `✅ *نجاح:* ${success}\n` +
        `❌ *فشل:* ${failed}\n` +
        `📊 *الإجمالي:* ${participants.length}\n` +
        `💾 *جهات الاتصال:* تم حفظ ${saved.length}\n\n` +
        `📱 *تم إرسال ملف VCF إلى الخاص*`,
        doneButtons,
      ),
      { quoted: m },
    );
  } catch (error) {
    delete global.statuspush;
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

async function pushkontakAnswerHandler(m, sock) {
  if (!m.body) return false;
  if (m.isCommand) return false;

  const session = getSession(m.sender);
  if (!session) return false;
  if (m.chat !== session.chatJid) return false;

  const text = m.body.trim();
  const lowText = text.toLowerCase();

  if (["بطل", "الغاء", "cancel", "batalkan"].includes(lowText) || lowText === "إلغاء") {
    clearSession(m.sender);
    await m.reply(
      `❌ *تم إلغاء جلسة دفع جهات الاتصال*\n\n📢 *اكتب* ${m.prefix}دفع_جهات_الاتصال *للبدء مرة أخرى*`,
    );
    return true;
  }

  if (session.step === "message") {
    if (text.length < 1) {
      await m.reply(
        `❌ *الرسالة لا يمكن أن تكون فارغة*\n\n📩 *رد مرة أخرى برسالة صالحة*`,
      );
      return true;
    }

    session.message = text;
    session.step = "confirm";

    const db = getDatabase();
    const metadata = m.groupMetadata;
    const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const s = getPushSettings(db);
    const participants = resolveParticipants(
      metadata,
      botId,
      m.sender,
      s.skipAdmin,
    );
    const jedaPush = s.jeda;
    const estimasi = Math.ceil((participants.length * jedaPush) / 60000);

    const sent = await m.reply(
      `✅ *الخطوة 2/2 — التأكيد*\n\n` +
      `📝 *الرسالة:* ${text.substring(0, 100)}${text.length > 100 ? "..." : ""}\n` +
      `👥 *الهدف:* ${participants.length} عضو\n` +
      `⏱️ *مدة الانتظار:* ${jedaPush}مللي\n` +
      `📊 *الوقت المتوقع:* ${estimasi} دقيقة\n\n` +
      `*رد على هذه الرسالة بـ:*\n` +
      `✅ *نعم* — بدء الدفع الآن\n` +
      `📝 *تغيير* — تغيير الرسالة المراد إرسالها\n` +
      `❌ *إلغاء* — إلغاء الجلسة`,
    );

    session.promptId = sent?.key?.id || session.promptId;
    return true;
  }

  if (session.step === "confirm") {
    if (
      ["نعم", "y", "ya", "iya", "yes", "lanjut", "confirm", "ok"].includes(lowText)
    ) {
      const pushMessage = session.message;
      clearSession(m.sender);
      await startPush(m, sock, pushMessage);
      return true;
    }

    if (["تغيير", "edit", "ganti", "revisi", "ubah"].includes(lowText)) {
      session.step = "message";
      const sent = await m.reply(
        `📝 *تغيير الرسالة*\n\n` +
        `🔤 *أرسل الرسالة الجديدة التي تريد دفعها*\n\n` +
        `📩 *رد على هذه الرسالة بالرسالة الجديدة*\n\n` +
        `❌ *رد* \`إلغاء\` *لإلغاء الجلسة*`,
      );
      session.promptId = sent?.key?.id || session.promptId;
      return true;
    }

    await m.reply(
      `❌ *رد غير صالح*\n\n📩 *رد بـ:* \`نعم\`, \`تغيير\`, أو \`إلغاء\``,
    );
    return true;
  }

  return false;
}

async function handler(m, { sock }) {
  const cmd = m.command?.toLowerCase();
  if (cmd === "stoppush") return handleStop(m);
  if (cmd === "setjedapush") return handleSetJeda(m, sock);
  if (cmd === "pushkontak_start") return handleStartSession(m, sock);
  if (cmd === "kelolapush") return handleKelola(m, sock);
  if (cmd === "autovcf_on" || cmd === "autovcf_off")
    return handleSettingToggle(m, "pushAutoVcf", "حفظ VCF تلقائي", true, false);
  if (cmd === "kodeunik_on" || cmd === "kodeunik_off")
    return handleSettingToggle(m, "pushKodeUnik", "رمز فريد", true, false);
  if (cmd === "vcftarget_private")
    return handleSettingToggle(
      m,
      "pushVcfTarget",
      "وجهة VCF",
      "private",
      "private",
    );
  if (cmd === "vcftarget_group")
    return handleSettingToggle(
      m,
      "pushVcfTarget",
      "وجهة VCF",
      "group",
      "group",
    );
  if (cmd === "skipadmin_on" || cmd === "skipadmin_off")
    return handleSettingToggle(m, "pushSkipAdmin", "تخطي المشرفين", true, false);
  return handlePush(m, sock);
}

export { pluginConfig as config, handler, pushkontakAnswerHandler };