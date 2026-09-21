import axios from 'axios';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import { AIRich } from '../../src/lib/maro-builder.js';
import { generateWAMessageFromContent } from 'maro';
import sharp from 'sharp';
import fs from 'fs';

const SCORES_BASE = 'https://webws.365scores.com/web';
const LANG_ID = 27;

// كل البطولات المعروفة
const ALL_LEAGUES = {
  'كأس العالم': 5930, 'كأس العالم للأندية': 5096, 'يورو': 5, 'كوبا أمريكا': 9,
  'الدوري الإنجليزي': 7, 'الدوري الاسباني': 11, 'الدوري الايطالي': 17,
  'الدوري الألماني': 25, 'الدوري الفرنسي': 35, 'الدوري السعودي': 649,
  'الدوري المصري': 552, 'الدوري المغربي': 650, 'الدوري الجزائري': 651,
  'الدوري التونسي': 652, 'الدوري الإماراتي': 653, 'الدوري القطري': 654,
  'دوري أبطال أوروبا': 572, 'دوري أبطال آسيا': 623, 'دوري أبطال أفريقيا': 624,
  'الدوري الهولندي': 37, 'الدوري البرتغالي': 45, 'الدوري البلجيكي': 47,
  'الدوري التركي': 49, 'الدوري البرازيلي': 99, 'الدوري الأرجنتيني': 113,
};

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ar-EG', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Riyadh' });
}

function toDateStamp(d) { return d.toISOString().slice(0, 10).replace(/-/g, ''); }

async function getAvailableLeagues() {
  const now = new Date();
  const later = new Date(now.getTime() + 14 * 86400000);
  const { data } = await axios.get(`${SCORES_BASE}/games/allscores/`, {
    params: { langId: LANG_ID, timezoneName: 'Asia/Riyadh', userCountryId: 190, sports: 1, startDate: toDateStamp(now), endDate: toDateStamp(later) },
    timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  
  const availableIds = new Set((data.games || []).map(g => g.competitionId));
  
  // نرجع البطولات المتاحة + المعروفة
  const result = {};
  for (const [name, id] of Object.entries(ALL_LEAGUES)) {
    if (availableIds.has(id)) result[name] = id;
  }
  
  // نضيف أي بطولة موجودة ومش في القائمة
  const leagueNames = new Map();
  (data.games || []).forEach(g => {
    if (!leagueNames.has(g.competitionId) && !Object.values(result).includes(g.competitionId)) {
      leagueNames.set(g.competitionId, g.competitionDisplayName);
    }
  });
  
  leagueNames.forEach((name, id) => { result[name] = id; });
  
  return result;
}

async function getMatchDetails(gameId) {
  const { data } = await axios.get(`${SCORES_BASE}/game/`, {
    params: { langId: LANG_ID, gameId, showLineups: true },
    timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  return data.game || null;
}

async function getMatches(leagueId) {
  const now = new Date();
  const later = new Date(now.getTime() + 14 * 86400000);
  const { data } = await axios.get(`${SCORES_BASE}/games/allscores/`, {
    params: { langId: LANG_ID, timezoneName: 'Asia/Riyadh', userCountryId: 190, sports: 1, startDate: toDateStamp(now), endDate: toDateStamp(later) },
    timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  return (data.games || []).filter(g => g.competitionId === leagueId).sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).slice(0, 20);
}

async function getBotThumbnail() {
  try { const img = fs.readFileSync(config.assets["maro"]); return await sharp(img).resize(300, 170).jpeg().toBuffer(); } catch { return null; }
}

const pluginConfig = {
  name: 'كرة',
  alias: ['مباريات', 'football'],
  category: 'search',
  description: 'مباريات كرة القدم',
  usage: '.كرة',
  example: '.كرة',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 20, energi: 3, isEnabled: true
};

async function handler(m, { sock }) {
  const query = m.args.join(' ')?.trim();
  const thumb = await getBotThumbnail();
  const availableLeagues = await getAvailableLeagues();

  // إذا المستخدم اختار بطولة معينة
  if (query) {
    const leagueId = availableLeagues[query] || Object.entries(availableLeagues).find(([k]) => k.includes(query))?.[1];
    if (!leagueId) return m.reply(`❌ البطولة غير متاحة حالياً\n\n📋 *المتاح:* ${Object.keys(availableLeagues).join('، ')}`);

    m.react('⚽');
    const games = await getMatches(leagueId);
    if (!games.length) { m.react('❌'); return m.reply(`❌ لا توجد مباريات في *${query}*`); }

    const rich = new AIRich(sock);
    rich.setTitle(`⚽ ${query}`);
    rich.setFooter(`📅 ${new Date().toLocaleDateString('ar-EG')}`);
    rich.addText(`# ⚽ *${query}*\n📊 ${games.length} مباراة`);
    
    // جدول المباريات
    rich.addTable([
      ['#', 'المباراة', 'الموعد', 'النتيجة'],
      ...games.slice(0, 10).map((g, i) => {
        const hs = g.homeCompetitor?.score != null ? g.homeCompetitor.score : '-';
        const as = g.awayCompetitor?.score != null ? g.awayCompetitor.score : '-';
        return [String(i + 1), `${g.homeCompetitor?.name || '?'} 🆚 ${g.awayCompetitor?.name || '?'}`, fmtDate(g.startTime), `${hs} - ${as}`];
      })
    ]);

    // تفاصيل أول 3 مباريات
    for (const g of games.slice(0, 3)) {
      const hs = g.homeCompetitor?.score != null ? g.homeCompetitor.score : '-';
      const as = g.awayCompetitor?.score != null ? g.awayCompetitor.score : '-';
      
      rich.addText(`## *${g.homeCompetitor?.name} ${hs} - ${as} ${g.awayCompetitor?.name}*`);
      rich.addTable([
        ['🏆 البطولة', '📅 الموعد', '🏟️ الملعب', '📊 الحالة'],
        [g.competitionDisplayName, fmtDate(g.startTime), g.venue?.name || 'غير معروف', g.shortStatusText || '?']
      ]);

      // محاولة جلب التشكيلة
      try {
        const detail = await getMatchDetails(g.id);
        if (detail?.homeCompetitor?.lineups) {
          const homePlayers = (detail.homeCompetitor.lineups.members || [])
            .filter(p => p.status === 1)
            .slice(0, 5)
            .map(p => p.name || '?');
          const awayPlayers = (detail.awayCompetitor?.lineups?.members || [])
            .filter(p => p.status === 1)
            .slice(0, 5)
            .map(p => p.name || '?');
          
          if (homePlayers.length) {
            rich.addTable([
              [`👕 ${detail.homeCompetitor.name} (${detail.homeCompetitor.lineups.formation || '?'})`, `👕 ${detail.awayCompetitor?.name || '?'} (${detail.awayCompetitor?.lineups?.formation || '?'})`],
              ...homePlayers.map((h, i) => [h, awayPlayers[i] || '-'])
            ]);
          }
        }

        // الهدافين
        if (detail?.homeCompetitor?.score > 0 || detail?.awayCompetitor?.score > 0) {
          const scorers = [];
          const processScorers = (competitor) => {
            (competitor?.scorers || []).forEach(s => {
              scorers.push(`${s.name}: ${s.goals || 0} ⚽`);
            });
          };
          processScorers(detail.homeCompetitor);
          processScorers(detail.awayCompetitor);
          
          if (scorers.length) {
            rich.addText(`⚽ *الهدافون:* ${scorers.join(' | ')}`);
          }
        }
      } catch {}
    }

    await rich.send(m.chat, { quoted: m });
    m.react('✅');
    return;
  }

  // القائمة التفاعلية
  if (!Object.keys(availableLeagues).length) {
    m.react('❌');
    return m.reply('❌ لا توجد بطولات متاحة حالياً');
  }

  const rows = Object.entries(availableLeagues).map(([name, id]) => ({
    title: `🏆 ${name}`,
    description: `ID: ${id}`,
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
      locationMessage: { jpegThumbnail: thumb, name: '⚽ كرة القدم', address: `${Object.keys(availableLeagues).length} بطولة` },
      contentText: '⚽ *كرة القدم*\n\nاختر بطولة من الزر أدناه لعرض المباريات',
      footerText: '⚽ 365Scores',
      headerType: 6,
    },
  };

  const msg = generateWAMessageFromContent(m.chat, content, { userJid: sock.user.jid });
  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  m.react('⚽');
}

export { pluginConfig as config, handler };