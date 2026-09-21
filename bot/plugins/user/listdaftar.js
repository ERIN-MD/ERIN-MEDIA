import { getDatabase } from "../../src/lib/maro-database.js";
import config from "../../config.js";

const PAGE_SIZE = 20;

function getRegistrationContextInfo() {
  const saluranId = config.saluran?.id || "120363400911374213@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Maro-AI";

  return {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };
}

function getRegistrationTime(user) {
  const value = user?.lastRegisteredAt || user?.registeredAt || null;
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("ar-EG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseListOptions(input) {
  const tokens = String(input || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let page = 1;
  let search = "";
  let sort = "default";

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i].toLowerCase();

    if (token === "page" || token === "hal" || token === "halaman" || token === "صفحة") {
      const next = parseInt(tokens[i + 1], 10);
      if (!Number.isNaN(next) && next > 0) {
        page = next;
        i += 1;
      }
      continue;
    }

    if (token === "search" || token === "cari" || token === "nama" || token === "بحث" || token === "اسم") {
      const searchTokens = [];
      for (let j = i + 1; j < tokens.length; j += 1) {
        const nextToken = tokens[j].toLowerCase();
        if (
          [
            "page",
            "hal",
            "halaman",
            "search",
            "cari",
            "nama",
            "sort",
            "urut",
            "صفحة",
            "بحث",
            "اسم",
            "ترتيب",
          ].includes(nextToken)
        )
          break;
        searchTokens.push(tokens[j]);
        i = j;
      }
      if (searchTokens.length) {
        search = searchTokens.join(" ").trim();
      }
      continue;
    }

    if (token === "sort" || token === "urut" || token === "ترتيب") {
      const nextToken = tokens[i + 1]?.toLowerCase();
      if (nextToken === "terbaru" || nextToken === "newest" || nextToken === "الأحدث") {
        sort = "terbaru";
        i += 1;
      }
      continue;
    }

    if (token === "terbaru" || token === "newest" || token === "الأحدث") {
      sort = "terbaru";
      continue;
    }

    if (/^\d+$/.test(token) && page === 1) {
      page = parseInt(token, 10);
    }
  }

  return { page, search, sort };
}

const pluginConfig = {
  name: "listdaftar",
  alias: ["listuser"],
  category: "user",
  description: "عرض قائمة المستخدمين المسجلين مع تصفية وترقيم الصفحات",
  usage: ".listdaftar [page <رقم>] [search <اسم>] [sort terbaru]",
  example: ".listdaftar search zann sort terbaru page 2",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const allUsers = db.getAllUsers();
  const options = parseListOptions(m.text);
  let registeredUsers = Object.values(allUsers).filter((u) => u.isRegistered);

  if (registeredUsers.length === 0) {
    return m.reply(`❌ لا يوجد مستخدمين مسجلين!`);
  }

  if (options.search) {
    const keyword = options.search.toLowerCase();
    registeredUsers = registeredUsers.filter((user) =>
      String(user.regName || "")
        .toLowerCase()
        .includes(keyword),
    );
  }

  if (options.sort === "terbaru") {
    registeredUsers.sort(
      (a, b) => getRegistrationTime(b) - getRegistrationTime(a),
    );
  }

  if (registeredUsers.length === 0) {
    return m.reply(
      `❌ لا يوجد مستخدمين مطابقين للبحث: *${options.search}*`,
    );
  }

  const totalPages = Math.max(1, Math.ceil(registeredUsers.length / PAGE_SIZE));
  const page = Math.min(Math.max(options.page, 1), totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const displayUsers = registeredUsers.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  let text = `📋 *قائمة المستخدمين المسجلين*\n\n`;
  text += `> إجمالي النتائج: *${registeredUsers.length}* مستخدم\n`;
  text += `> الصفحة: *${page}/${totalPages}*\n`;
  text += `> الترتيب: *${options.sort === "terbaru" ? "الأحدث" : "الافتراضي"}*\n`;
  if (options.search) {
    text += `> البحث: *${options.search}*\n`;
  }
  text += `\n`;

  displayUsers.forEach((user, i) => {
    const genderEmoji =
      user.regGender === "ذكر"
        ? "👨"
        : user.regGender === "أنثى"
          ? "👩"
          : "👤";
    const listNumber = startIndex + i + 1;
    const registeredAt = formatDateTime(
      user.lastRegisteredAt || user.registeredAt,
    );
    text += `${listNumber}. ${genderEmoji} *${user.regName || "غير معروف"}*\n`;
    text += `   > @${user.jid} | ${user.regAge || "?"} سنة | ${registeredAt}\n`;
  });

  if (totalPages > 1) {
    text += `\n> استخدم \`${m.prefix}listdaftar page ${page + 1 > totalPages ? totalPages : page + 1}\` للصفحة التالية`;
  }

  const mentions = displayUsers.map((u) => u.jid + "@s.whatsapp.net");

  await sock.sendMessage(
    m.chat,
    {
      text,
      mentions,
      contextInfo: {
        mentionedJid: mentions,
        ...getRegistrationContextInfo(),
      },
    },
    { quoted: m },
  );
}

export { pluginConfig as config, handler };