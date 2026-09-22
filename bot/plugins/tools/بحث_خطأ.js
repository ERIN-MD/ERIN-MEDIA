// بحث_خطأ - أمر للبحث عن أخطاء في كود البرمجة

import axios from "axios";
import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "بحث_خطأ",
  alias: ["caribug"],
  category: "tools",
  description: "البحث عن أخطاء في كود البرمجة",
  usage: ".بحث_خطأ [الكود] أو رد على كود",
  example: ".بحث_خطأ function test() {}",
  cooldown: 20,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { args }) {
  let code = m.quoted?.text || args.join(" ");

  if (!code) {
    return m.reply(
      `*🐛 بحث عن الأخطاء*\n\nأرسل كوداً أو رد على رسالة تحتوي على كود للبحث عن الأخطاء.\n\nمثال:\n\`${m.prefix}بحث_خطأ function test() {}\``
    );
  }

  m.react("🕕");

  try {
    const apiUrl = `https://api.cuki.biz.id/api/aicode/caribug`;
    const res = await axios.get(apiUrl, {
      params: {
        apikey: config.APIkey.cuki,
        code: code,
        language: "auto"
      },
      timeout: 60000
    });

    const data = res.data;

    if (!data.success || !data.data) {
      throw new Error("فشل تحليل الكود من الخادم");
    }

    const info = data.data;
    const meta = info.metadata;
    const bugInfo = info.bugsFound;
    
    let text = `🐛 *نتيجة تحليل الأخطاء*\n\n`;
    text += `*اللغة:* ${meta.detectedLanguage}\n`;
    text += `*المستوى:* ${meta.severityInfo.level} ${meta.severityInfo.icon}\n`;
    text += `*الأخطاء المكتشفة:* ${bugInfo.total}\n\n`;
    
    if (bugInfo.summary) {
      text += `*📝 الملخص:*\n${bugInfo.summary}\n\n`;
    }
    
    if (info.codeAnalysis?.fixed?.code) {
      text += `*✨ الكود المُصحح:*\n\`\`\`${meta.detectedLanguage}\n${info.codeAnalysis.fixed.code}\n\`\`\`\n\n`;
    }
    
    if (bugInfo.details && bugInfo.details.length > 0) {
      text += `*📌 التفاصيل:* \n`;
      bugInfo.details.forEach((d, i) => {
        text += `- ${d.type || d.description}\n`;
      });
    }

    m.react("✅");
    await m.reply(text.trim());
  } catch (err) {
    console.error("[CariBug]", err.message);
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler }