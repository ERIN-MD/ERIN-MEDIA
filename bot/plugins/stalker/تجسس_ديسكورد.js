// تجسس_ديسكورد - أمر للتجسس على حسابات ديسكورد عبر معرف المستخدم

import axios from 'axios'
import config from '../../config.js'
import * as timeHelper from '../../src/lib/maro-time.js'
import te from '../../src/lib/maro-error.js'

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-MaroMD";

const pluginConfig = {
  name: "تجسس_ديسكورد",
  alias: ["discordstalk"],
  category: "stalker",
  description: "التجسس على حساب ديسكورد عبر معرف المستخدم",
  usage: ".تجسس_ديسكورد <معرف_المستخدم>",
  example: ".تجسس_ديسكورد 297574907510784000",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const userId = m.args[0]?.trim();

  if (!userId) {
    return m.reply(
      `🎮 *تجسس ديسكورد*\n\n` +
        `> أدخل معرف مستخدم ديسكورد\n\n` +
        `\`مثال: ${m.prefix}تجسس_ديسكورد 297574907510784000\``,
    );
  }

  if (!/^\d+$/.test(userId)) {
    return m.reply(`❌ معرف المستخدم يجب أن يكون أرقاماً. مثال: 297574907510784000`);
  }

  m.react("🔍");

  try {
    const res = await axios.get(
      `https://api.neoxr.eu/api/dcstalk?id=${userId}&apikey=${NEOXR_APIKEY}`,
      {
        timeout: 30000,
      },
    );

    if (!res.data?.status || !res.data?.data) {
      m.react("❌");
      return m.reply(`❌ معرف المستخدم *${userId}* غير موجود`);
    }

    const d = res.data.data;

    const createdDate = d.created_at
      ? timeHelper.fromTimestamp(d.created_at, "D MMMM YYYY")
      : "-";

    const caption =
      `🎮 *تجسس ديسكورد*\n\n` +
      `👤 *اسم المستخدم:* ${d.username || "-"}\n` +
      `📛 *الاسم المعروض:* ${d.global_name || "-"}\n` +
      `🔢 *المميز:* #${d.discriminator || "0"}\n` +
      `🆔 *معرف المستخدم:* ${d.id}\n\n` +
      `📅 *تاريخ الإنشاء:* ${createdDate}\n\n` +
      `> _بحث في حسابات ديسكورد_`;

    m.react("✅");

    if (d.avatar_url) {
      await sock.sendMessage(
        m.chat,
        {
          image: { url: d.avatar_url },
          caption,
        },
        { quoted: m },
      );
    } else {
      await m.reply(caption);
    }
  } catch (error) {
    m.react('☢');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler }