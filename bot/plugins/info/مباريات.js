import axios from "axios";
import https from "https";
import te from "../../src/lib/maro-error.js";

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

const pluginConfig = {
  name: "مباريات",
  alias: ["matches"],
  category: "info",
  description: "⚽ يعرض مباريات اليوم المباشرة والنتائج",
  usage: ".مباريات [دوري]",
  example: ".مباريات",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const DEMO_MATCHES = [
  { league: "الدوري المصري", home: "الأهلي", away: "الزمالك", time: "20:00" },
  { league: "الدوري الإسباني", home: "برشلونة", away: "ريال مدريد", time: "22:00" },
  { league: "الدوري الإنجليزي", home: "مانشستر سيتي", away: "ليفربول", time: "19:30" },
  { league: "الدوري الألماني", home: "بايرن ميونخ", away: "بوروسيا دورتموند", time: "21:30" },
  { league: "الدوري الفرنسي", home: "باريس سان جيرمان", away: "مارسيليا", time: "23:00" },
  { league: "الدوري الإيطالي", home: "يوفنتوس", away: "إنتر ميلان", time: "20:45" },
  { league: "دوري أبطال أوروبا", home: "ريال مدريد", away: "بايرن ميونخ", time: "22:00" },
  { league: "الدوري السعودي", home: "الهلال", away: "النصر", time: "21:00" }
];

async function fetchLiveMatches() {
  try {
    const response = await axios.get('https://www.scorebat.com/video-api/v3/', {
      timeout: 15000,
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Referer': 'https://www.scorebat.com/'
      }
    });

    const data = response.data;
    if (!data || !data.response || !data.response.length) return null;

    return data.response.map(match => ({
      league: match.competition || 'بطولة',
      home: match.title?.split(' vs ')[0] || 'فريق',
      away: match.title?.split(' vs ')[1] || 'فريق',
      time: match.date ? new Date(match.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'غير محدد',
      video: match.videos?.[0]?.embed || null
    }));
  } catch (e) {
    return null;
  }
}

async function handler(m, { sock }) {
  const filter = m.args.join(" ").toLowerCase().trim();

  m.react("🕕");

  try {
    let matches = await fetchLiveMatches();
    let isDemo = false;

    if (!matches) {
      matches = DEMO_MATCHES;
      isDemo = true;
    }

    if (filter) {
      matches = matches.filter(m =>
        m.league.toLowerCase().includes(filter) ||
        m.home.toLowerCase().includes(filter) ||
        m.away.toLowerCase().includes(filter)
      );
    }

    if (matches.length === 0) {
      m.react("❌");
      return m.reply(`❌ لم يتم العثور على مباريات لـ: \`${filter}\``);
    }

    let text = `⚽ *مباريات اليوم*\n━━━━━━━━━━━━━━━━━━\n`;
    if (filter) text = `⚽ *مباريات - ${filter}*\n━━━━━━━━━━━━━━━━━━\n`;

    for (const match of matches.slice(0, 10)) {
      text += `🏆 *${match.league}*\n`;
      text += `👥 ${match.home} 🆚 ${match.away}\n`;
      text += `⏰ ${match.time}\n`;
      text += `━━━━━━━━━━━━━━━━━━\n`;
    }

    if (isDemo) {
      text += `\n⚠️ *ملاحظة:* بيانات تجريبية\n`;
      text += `🔌 المصدر الرئيسي غير متاح حالياً\n`;
    }

    text += `\n🤖 *${m.pushName || "البوت"}*`;

    m.react("✅");
    await m.reply(text);
  } catch (err) {
    m.react("☢");
    return m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };