import axios from 'axios';
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "دارك_ويب",
  alias: ["darkweb", "dw", "دارك_بحث"],
  category: "search",
  description: "البحث في الدارك ويب",
  usage: ".دارك_ويب <كلمة_البحث>",
  example: ".دارك_ويب bitcoin",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const query = m.args.join(" ");
  
  if (!query) {
    return m.reply(`🌐 *البحث في الدارك ويب*\n\n📌 *مثال:* \n${m.prefix}${m.command} bitcoin`);
  }

  m.react("🌐");

  try {
    const { data } = await axios.get(
      `https://ahmia.fi/search/?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }
    );

    const links = [...data.matchAll(/<a[^>]*href="(https?:\/\/[^"]*\.onion[^"]*)"[^>]*>([^<]*)<\/a>/g)];
    
    if (!links.length) {
      m.react("❌");
      return m.reply("❌ لم يتم العثور على نتائج");
    }

    const results = links.slice(0, 3).map((l, i) => ({
      number: i + 1,
      title: l[2].trim().substring(0, 40),
      accessible: l[1].replace('.onion/', '.onion.ly/').replace('http://', 'https://')
    }));

    let text = `🌐 *نتائج: ${query}*\n\n`;
    results.forEach(r => {
      text += `*${r.number}.* ${r.title}\n🔗 ${r.accessible}\n\n`;
    });

    await sock.relayMessage(m.chat, {
      interactiveMessage: {
        body: { text: text },
        footer: { text: '🌐 الدارك ويب' },
        nativeFlowMessage: {
          buttons: [
            { name: "", buttonParamsJson: "" },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "1️⃣", id: results[0]?.accessible || "1" }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "2️⃣", id: results[1]?.accessible || "2" }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "3️⃣", id: results[2]?.accessible || "3" }) }
          ],
          messageVersion: 2
        }
      }
    }, {});

    m.react("✅");

  } catch (error) {
    console.log(error);
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };