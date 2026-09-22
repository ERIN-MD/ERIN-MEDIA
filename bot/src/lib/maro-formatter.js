import config from '../../config.js'
import * as timeHelper from './maro-time.js'
import ui from './ui/components.js'

const CHARS = {
  cornerTopLeft: "╭",
  cornerTopRight: "╮",
  cornerBottomLeft: "╰",
  cornerBottomRight: "╯",
  horizontal: "─",
  vertical: "│",
  arrow: "➣",
  bullet: "◦",
  star: "✦",
  diamond: "◇",
  dot: "•",
  check: "",
  cross: "✗",
  line: "━",
  d: "▣",
  wing: "༺",
  wing2: "༻",
};

const EMOJIS = {
  dashboard: "📊",
  info: "ℹ️",
  user: "👤",
  bot: "🤖",
  owner: "👑",
  premium: "💎",
  free: "🆓",
  public: "🌐",
  self: "🔒",
  commands: "⚙️",
  utilities: "🔧",
  fun: "🎮",
  group: "👥",
  time: "⏰",
  uptime: "⏱️",
  version: "📌",
  speed: "⚡",
  limit: "📊",
  status: "📋",
  mode: "🔄",
  name: "📝",
  number: "📱",
  developer: "👨‍💻",
  total: "📈",
  tip: "💡",
  warning: "⚠️",
  success: "✅",
  error: "❌",
  loading: "⏳",
};

function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days} يوم`);
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} ثانية`);

  return parts.join(" ");
}

function formatDate(date) {
  return timeHelper.fromTimestamp(date, "DD/MM/YYYY HH:mm:ss");
}

function formatNumber(number) {
  if (!number) return "";
  const cleaned = number.replace(/[^0-9]/g, "");
  if (cleaned.length < 10) return cleaned;

  if (cleaned.startsWith("20")) {
    const withoutCode = cleaned.slice(2);
    const formatted = withoutCode.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3");
    return `20 ${formatted}`;
  }

  return cleaned;
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 بايت";

  const k = 1024;
  const sizes = ["بايت", "ك.ب", "م.ب", "ج.ب", "ت.ب"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function createLine(length = 20, char = CHARS.horizontal) {
  return char.repeat(length);
}

function createHeader(title, width = 20) {
  const titlePart = `${CHARS.horizontal}「 ${title} 」`;
  const remainingWidth = Math.max(0, width - titlePart.length - 2);
  return `${CHARS.cornerTopLeft}${titlePart}${createLine(remainingWidth)}${CHARS.cornerTopRight}`;
}

function createFooter(width = 20) {
  return `${CHARS.cornerBottomLeft}${createLine(width)}${CHARS.cornerBottomRight}`;
}

function createBodyLine(text, prefix = CHARS.vertical, bullet = CHARS.bullet) {
  return `${prefix} ${bullet} ${text}`;
}

function createArrowLine(label, value) {
  return `${CHARS.vertical} ${CHARS.arrow} ${label}: ${value}`;
}

function createDashboard(data) {
  const {
    userName = "مستخدم",
    userStatus = "مجاني",
    mode = "عام",
    totalUsers = 0,
    userLimit = 25,
  } = data;

  const lines = [
    `${CHARS.cornerTopLeft}${CHARS.horizontal}「 ${EMOJIS.dashboard} لوحة التحكم 」${CHARS.horizontal}`,
    `${CHARS.vertical}`,
    createArrowLine("الاسم", userName),
    createArrowLine("الحالة", userStatus),
    createArrowLine("الوضع", mode),
    createArrowLine("المستخدمين", totalUsers.toString()),
    createArrowLine("الحد", userLimit.toString()),
    `${CHARS.vertical}`,
    `${CHARS.cornerBottomLeft}${createLine(24)}`,
  ];

  return lines.join("\n");
}

function createBotInfo(data) {
  const {
    botName = config.bot?.name || "Tarboo Bot",
    developer = config.owner?.name || "Owner",
    version = config.bot?.version || "1.0.0",
    uptime = "0s",
    totalFeatures = 0,
    mode = config.mode || "public",
    platform = "Node.js",
  } = data;

  const lines = [
    `${CHARS.horizontal} *معلومات البوت* ${CHARS.horizontal}`,
    ``,
    `${CHARS.dot} اسم البوت : ${botName} 🌿`,
    `${CHARS.dot} المطور : ${developer}`,
    `${CHARS.dot} الوضع : ${mode === "public" ? "عام" : "خاص"}`,
    `${CHARS.dot} الإصدار : ${version}`,
    `${CHARS.dot} وقت التشغيل : ${uptime}`,
    `${CHARS.dot} إجمالي الميزات : ${totalFeatures}`,
    `${CHARS.dot} المنصة : ${platform}`,
    ``,
  ];

  return lines.join("\n");
}

function createUserProfile(data) {
  const {
    name = "مستخدم",
    number = "",
    status = "مجاني",
    limit = 25,
    registeredAt = "",
  } = data;

  const statusEmoji =
    status === "مالك"
      ? EMOJIS.owner
      : status === "مميز"
        ? EMOJIS.premium
        : EMOJIS.free;

  const lines = [
    `【 الملف الشخصي 】`,
    `${EMOJIS.name} الاسم   : ${name}`,
    `${EMOJIS.number} الرقم  : ${formatNumber(number)}`,
    `${statusEmoji} الحالة : ${status}`,
    `${EMOJIS.limit} الحد  : ${limit}`,
    ``,
  ];

  if (registeredAt) {
    lines.splice(5, 0, `${EMOJIS.time} التسجيل : ${registeredAt}`);
  }

  return lines.join("\n");
}

function createBotStatus(data) {
  const {
    botName = config.bot?.name || "Tarboo Bot",
    uptime = "0s",
    mode = "عام",
    totalCommands = 0,
    totalUsers = 0,
    speed = "0.00s",
  } = data;

  const lines = [
    `【 حالة البوت 】`,
    `${EMOJIS.bot} البوت      : ${botName}`,
    `${EMOJIS.uptime} وقت التشغيل   : ${uptime}`,
    `${EMOJIS.mode} الوضع     : ${mode}`,
    `${EMOJIS.commands} الأوامر : ${totalCommands} ميزة`,
    `${EMOJIS.user} المستخدمين : ${totalUsers} مستخدم`,
    `${EMOJIS.speed} السرعة    : ${speed}`,
    ``,
  ];

  return lines.join("\n");
}

function createCategoryMenu(category, prefix = config.command?.prefix || ".") {
  const { name, emoji, description = "", commands = [] } = category;

  if (commands.length === 0) {
    return "";
  }

  const header = `${emoji} *${name}*`;
  const commandList = commands
    .map((cmd) => `${CHARS.vertical} ${prefix}${cmd}`)
    .join("\n");
  const footer = `${CHARS.cornerBottomLeft}${createLine(15)}`;

  return `${header}\n${commandList}\n${footer}`;
}

function createCategorySection(data) {
  const { emoji, title, command, description, prefix = "." } = data;

  const lines = [
    `${emoji} *${title}*`,
    `  اكتب: ${prefix}${command}`,
    `  ${CHARS.vertical} ( ${description} )`,
    ``,
  ];

  return lines.join("\n");
}

function createMainMenu(data) {
  const {
    greeting = "",
    userName = "مستخدم",
    userStatus = "مجاني",
    categories = [],
    botInfo = {},
    prefix = config.command?.prefix || ".",
  } = data;

  const parts = [];

  if (greeting) {
    parts.push(greeting);
    parts.push("");
  }

  parts.push(createDashboard({ userName, userStatus, ...data }));
  parts.push("");

  parts.push(createBotInfo(botInfo));
  parts.push("");

  for (const category of categories) {
    parts.push(
      createCategorySection({
        ...category,
        prefix,
      }),
    );
  }

  parts.push(`${EMOJIS.tip} *نصيحة:* إذا كنت لا تعرف كيفية استخدام البوت`);
  parts.push(`يمكنك سؤال المطور`);
  parts.push(`${CHARS.vertical} الوضع: ${data.mode || "عام"}`);

  return parts.join("\n");
}

function createCommandList(categoryName, commands, prefix = ".") {
  const emoji = config.categoryEmojis?.[categoryName.toLowerCase()] || "📋";

  const lines = [
    `${CHARS.cornerTopLeft}${CHARS.horizontal}❏ ${emoji} *${categoryName.toUpperCase()}*`,
    "",
  ];

  for (const cmd of commands) {
    lines.push(`${CHARS.vertical} ${prefix}${cmd}`);
  }

  lines.push("");
  lines.push(`${CHARS.cornerBottomLeft}${createLine(20)}`);

  return lines.join("\n");
}

// ── حالات موحّدة عبر نظام التصميم AXION ─────────────────────────
// هذه الدوال يستخدمها الهيكل المركزي وعشرات الإضافات، فتغييرها هنا
// ينقل كل تلك الردود إلى الهوية الجديدة دفعة واحدة دون لمس أي إضافة.
function createWaitMessage(message = "جاري المعالجة...") {
  return ui.loading("processing", message);
}

function createSuccessMessage(message = "تم بنجاح!") {
  return ui.success(message);
}

function createErrorMessage(message = "حدث خطأ!") {
  return ui.error(message);
}

function createWarningMessage(message) {
  return ui.warning(message);
}

/** حالة معالجة باسم صريح: preparing/fetching/generating/uploading/... */
function createStateMessage(state, detail) {
  return ui.stateLine(state, detail);
}

function getTimeGreeting() {
  const hour = timeHelper.getHour();

  if (hour >= 4 && hour < 10) return "صباح الخير 🌅";
  if (hour >= 10 && hour < 15) return "ظهر الخير ☀️";
  if (hour >= 15 && hour < 18) return "مساء الخير 🌇";
  return "مساء الخير 🌙";
}

function capitalize(str) {
  if (!str) return "";
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

function truncate(text, maxLength, suffix = "...") {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * تزيين رسالة بإطار Tarboo Bot
 */
function decorateMessage(message) {
  return `╭──${CHARS.d}${CHARS.wing} Tarboo ${CHARS.wing2}${CHARS.d}──╮
│
│ ${message.split('\n').join('\n│ ')}
│
╰──${CHARS.d}${CHARS.wing} Tarboo ${CHARS.wing2}${CHARS.d}──╯`;
}

export { CHARS, EMOJIS, formatUptime, formatDate, formatNumber, formatFileSize, createLine, createHeader, createFooter, createBodyLine, createArrowLine, createDashboard, createBotInfo, createUserProfile, createBotStatus, createCategoryMenu, createCategorySection, createMainMenu, createCommandList, createWaitMessage, createSuccessMessage, createErrorMessage, createWarningMessage, createStateMessage, getTimeGreeting, capitalize, truncate, decorateMessage };