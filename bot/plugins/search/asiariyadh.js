import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import { AIRich } from '../../src/lib/maro-builder.js';
import { generateWAMessageFromContent } from 'maro';
import sharp from 'sharp';
import fs from 'fs';

const SCORES_BASE = 'https://webws.365scores.com/web';
const LANG_ID = 27;

const LEAGUES = {
  'كأس العالم': 5930,
  'الدوري السعودي': 593,
  'الدوري الإنجليزي': 116,
  'الدوري الاسباني': 321,
  'الدوري الايطالي': 332,
  'الدوري المصري': 5062,
  'دوري أبطال أوروبا': 5478,
  'دوري أبطال آسيا': 5518,
  'دوري أبطال أفريقيا': 5519,
  'الدوري الفرنسي': 5523,
  'الدوري الألماني': 5667,
  'الدوري البرتغالي': 7685,
  'الدوري الهولندي': 7715,
  'الدوري التركي': 7841,
};

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ar-EG', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Riyadh' });
}

function toDateStamp(d) { return d.toISOString().slice(0, 10).replace(/-/g, ''); }

async function getMatches(leagueId = null) {
  const now = new Date();
  const later = new Date(now.getTime() + 14 * 86400000);
  const { data } = await axios.get(`${SCORES_BASE}/games/allscores/`, {
    params: { langId: LANG_ID, timezoneName: 'Asia/Riyadh', userCountryId: 190, sports: 1, startDate: toDateStamp(now), endDate: toDateStamp(later) },
    timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  let games = data.games || [];
  if (leagueId) games = games.filter(g => g.competitionId === leagueId);
  return games.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 20);
}

async function getBotThumbnail() {
  try {
    const img = fs.readFileSync(config.assets["maro"]);
    return await sharp(img).resize(300, 170).jpeg().toBuffer();
  } catch { return null; }
}

const pluginConfig = {
  name: 'كرة',
  alias: ['مباريات', 'football'],
  category: 'search',
  description: 'مباريات كرة القدم',
  usage: '.كرة',
  example: '.كرة',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 2, isEnabled: true
};

async function handler(m, { sock }) {
  const query = m.args.join(' ')?.trim();
  const thumb = await getBotThumbnail();

  if (query) {
    const leagueId = LEAGUES[query] || Object.entries(LEAGUES).find(([k]) => k.includes(query))?.[1];
    if (!leagueId) return m.reply(`❌ البطولة غير موجودة\n\n📋 *البطولات:* ${Object.keys(LEAGUES).join('، ')}`);

    m.react('⚽');
    const games = await getMatches(leagueId);
    if (!games.length) { m.react('❌'); return m.reply(`❌ لا توجد مباريات في *${query}*`); }

    const rich = new AIRich(sock);
    rich.setTitle(`⚽ مباريات ${query}`);
    rich.setFooter(`📅 ${new Date().toLocaleDateString('ar-EG')}`);

    rich.addText(`# ⚽ *${query}*\n📊 ${games.length} مباراة`);
    rich.addTable([['#', 'المباراة', 'الموعد', 'الحالة'], ...games.map((g, i) => [
      String(i + 1), `${g.homeCompetitor?.name || '?'} 🆚 ${g.awayCompetitor?.name || '?'}`, fmtDate(g.startTime), g.shortStatusText || '?'
    ])]);

    for (const g of games.slice(0, 5)) {
      const hs = g.homeCompetitor?.score != null ? g.homeCompetitor.score : '-';
      const as = g.awayCompetitor?.score != null ? g.awayCompetitor.score : '-';
      rich.addText(`*${g.homeCompetitor?.name} ${hs} - ${as} ${g.awayCompetitor?.name}*\n🏆 ${g.competitionDisplayName}\n📅 ${fmtDate(g.startTime)}\n🏟️ ${g.venue?.name || '?'}\n📊 ${g.shortStatusText}`);
    }

    await rich.send(m.chat, { quoted: m });
    m.react('✅');
    return;
  }

  const rows = Object.keys(LEAGUES).map(name => ({
    title: `🏆 ${name}`,
    description: 'اضغط لعرض المباريات',
    id: `${m.prefix}كرة ${name}`
  }));

  const content = {
    buttonsMessage: {
      buttons: [{
        buttonText: { displayText: '🏆 اختر البطولة' },
        buttonId: 'league',
        type: 1,
        nativeFlowInfo: {
          name: 'single_select',
          paramsJson: JSON.stringify({
            title: '⚽ اختر البطولة',
            sections: [{ title: 'البطولات المتاحة', rows }],
          }),
        },
      }],
      locationMessage: { jpegThumbnail: thumb, name: '⚽ كرة القدم', address: 'اختر بطولة لعرض المباريات' },
      contentText: '⚽ *كرة القدم*\n\nاختر بطولة من الزر أدناه لعرض المباريات\n\n📌 أو اكتب:\n`.كرة الدوري الإنجليزي`',
      footerText: '⚽ 365Scores',
      headerType: 6,
    },
  };

  const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid });
  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  m.react('⚽');
}

export { pluginConfig as config, handler };