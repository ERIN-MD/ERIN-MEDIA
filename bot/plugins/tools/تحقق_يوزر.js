import { Boom } from "@hapi/boom";
import {
  S_WHATSAPP_NET,
  getBinaryNodeChild,
} from "maro";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تحقق_يوزر",
  alias: ["checkuser", "username", "usercheck"],
  category: "tools",
  description: "التحقق من وجود اسم مستخدم في واتساب",
  usage: ".تحقق_يوزر <اسم_المستخدم>",
  example: ".تحقق_يوزر xgin",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const wMexQuery = (variables, queryId, query, generateMessageTag) => {
  return query({
    tag: "iq",
    attrs: {
      id: generateMessageTag(),
      type: "get",
      to: S_WHATSAPP_NET,
      xmlns: "w:mex",
    },
    content: [
      {
        tag: "query",
        attrs: { query_id: queryId },
        content: Buffer.from(JSON.stringify({ variables }), "utf-8"),
      },
    ],
  });
};

const executeWMexQuery = async (
  variables,
  queryId,
  dataPath,
  query,
  generateMessageTag
) => {
  const result = await wMexQuery(variables, queryId, query, generateMessageTag);
  const child = getBinaryNodeChild(result, "result");

  if (child?.content) {
    const data = JSON.parse(child.content.toString());

    if (data.errors && data.errors.length > 0) {
      const errorMessages = data.errors
        .map((err) => err.message || "خطأ غير معروف")
        .join(", ");
      const firstError = data.errors[0];
      const errorCode = firstError.extensions?.error_code || 400;
      throw new Boom(`خطأ في الخادم: ${errorMessages}`, {
        statusCode: errorCode,
        data: firstError,
      });
    }

    const response = dataPath ? data?.data?.[dataPath] : data?.data;
    if (typeof response !== "undefined") {
      return response;
    }
  }

  throw new Boom("فشل التحقق من اسم المستخدم", {
    statusCode: 400,
    data: result,
  });
};

async function checkUsername(conn, username) {
  const data = await executeWMexQuery(
    { username },
    "23938900255774163",
    "xwa2_username_check",
    conn.query,
    conn.generateMessageTag
  );
  return data;
}

async function checkUsernames(conn, usernames) {
  const data = await executeWMexQuery(
    { usernames },
    "27134626522840286",
    "xwa2_username_check_multi",
    conn.query,
    conn.generateMessageTag
  );
  return data;
}

async function handler(m, { sock }) {
  const args = m.args || [];
  const text = m.text?.trim();

  if (!text || args.length === 0) {
    return m.reply(
      `🔍 *التحقق من اسم المستخدم*\n\n` +
      `> تحقق من وجود اسم مستخدم في واتساب\n\n` +
      `*الاستخدام:*\n` +
      `> \`${m.prefix}تحقق_يوزر <اسم>\` - تحقق من اسم واحد\n` +
      `> \`${m.prefix}تحقق_يوزر اسم1,اسم2,اسم3\` - تحقق من عدة أسماء\n\n` +
      `*مثال:*\n` +
      `> \`${m.prefix}تحقق_يوزر xgin\`\n` +
      `> \`${m.prefix}تحقق_يوزر xgin,gin,zldx\``
    );
  }

  await m.react("🔍");

  try {
    // التحقق من وجود عدة أسماء (مفصولة بفواصل)
    if (text.includes(",")) {
      const usernames = text.split(",").map(u => u.trim()).filter(u => u);
      
      if (usernames.length === 0) {
        return m.reply("❌ لم تدخل أي أسماء للتحقق!");
      }

      const result = await checkUsernames(sock, usernames);
      
      if (!result?.results || result.results.length === 0) {
        return m.reply("❌ لم يتم العثور على نتائج");
      }

      let textMsg = `🔍 *نتائج التحقق من الأسماء*\n\n`;
      textMsg += `╭┈┈⬡「 📋 *النتائج* 」\n`;
      
      for (const item of result.results) {
        const isAvailable = item.response?.result === 'SUCCESS';
        const status = isAvailable ? '✅ متاح' : '❌ مأخوذ';
        textMsg += `┃ ${status} - *${item.username}*\n`;
      }
      
      textMsg += `╰┈┈⬡`;
      
      await m.reply(textMsg);
      await m.react("✅");
      return;
    }

    // تحقق من اسم واحد
    const username = text.trim();
    const result = await checkUsername(sock, username);
    
    const isAvailable = result?.result === 'SUCCESS';
    const status = isAvailable ? '✅ *متاح*' : '❌ *مأخوذ*';
    
    let textMsg = `🔍 *نتيجة التحقق*\n\n`;
    textMsg += `╭┈┈⬡「 📋 *التفاصيل* 」\n`;
    textMsg += `┃ 👤 الاسم: *${username}*\n`;
    textMsg += `┃ 📌 الحالة: ${status}\n`;
    
    if (result?.suggestions && result.suggestions.length > 0) {
      textMsg += `┃ 💡 اقتراحات:\n`;
      for (const suggestion of result.suggestions) {
        textMsg += `┃    - ${suggestion}\n`;
      }
    }
    
    textMsg += `╰┈┈⬡`;
    
    await m.reply(textMsg);
    await m.react("✅");
    
  } catch (error) {
    console.error("خطأ في التحقق من المستخدم:", error);
    await m.react("❌");
    
    if (error.message?.includes("اسم المستخدم")) {
      return m.reply(`❌ *فشل التحقق*\n\n> اسم المستخدم غير صالح أو غير موجود`);
    }
    
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler, checkUsername, checkUsernames };