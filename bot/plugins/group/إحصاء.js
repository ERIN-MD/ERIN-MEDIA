import { getDatabase } from "../../src/lib/maro-database.js";
import { generateWAMessageFromContent } from "maro";
import config from "../../config.js";
import { saluranCtx } from "../../src/lib/maro-context.js";

const pluginConfig = {
  name: "إحصاء",
  alias: ["tam"],
  category: "group",
  description: "عرض إحصاء الأعضاء الأكثر نشاطاً في المجموعة",
  usage: ".إحصاء <عدد>",
  example: ".إحصاء 10",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const limit = Math.min(Math.max(parseInt(m.text) || 10, 1), 20);
  const group = db.getGroup(m.chat) || {};
  const chatName = group.name || "المجموعة";
  const chatStats = group.chatStats || {};

  const sorted = Object.entries(chatStats)
    .map(([jid, d]) => ({ jid, count: d.count || 0, name: d.name || null }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  if (!sorted.length) {
    return m.reply(`📊 *إحصاء النشاط*\n\n> لا توجد بيانات نشاط في هذه المجموعة بعد`);
  }

  const pollVotes = sorted.map((u, i) => {
    const rank = i + 1;
    const user = db.getUser(u.jid);
    const name = u.name || user?.name || u.jid.split("@")[0];
    return {
      optionName: `${rank}. ${name}${i === 0 ? " 🏆" : ""}`,
      optionVoteCount: u.count,
    };
  });

  const content = {
    pollResultSnapshotMessage: {
      name: `أفضل ${limit} عضو نشط!\nفي ${chatName}`,
      pollVotes,
      pollType: 0,
      contextInfo: { ...saluranCtx() },
    },
  };

  const msg = generateWAMessageFromContent(m.chat, content, {});
  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

export { pluginConfig as config, handler };