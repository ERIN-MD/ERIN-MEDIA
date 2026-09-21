import axios from "axios";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "مراقبة_المزرعة",
  alias: ["gag2"],
  category: "info",
  description: "فحص مخزون المزرعة مع ميزة المراقبة",
  usage: ".مراقبة_المزرعة [مراقبة] [عنصر]",
  example: ".مراقبة_المزرعة مراقبة بذور",
  cooldown: 15,
  energi: 1,
  isEnabled: true,
};

const API = "https://api.rifkyshre.biz.id";
const ROUTE = "/scrape/gag2-stock";

async function gag2Fetch() {
  const res = await axios.get(`${API}${ROUTE}`, {
    timeout: 30000,
    validateStatus: () => true,
    headers: { Accept: "application/json", Origin: "https://code.rifkyshre.biz.id", Referer: "https://code.rifkyshre.biz.id/" },
  });
  if (!res.data?.status) { return { ok: false, error: res.data?.error ?? `HTTP ${res.status}` }; }
  return { ok: true, data: res.data.data };
}

function emojiForItem(name) {
  const n = name.toLowerCase();
  if (n.includes("seed")) return "🌱";
  if (n.includes("watering") || n.includes("hose") || n.includes("sprinkler")) return "💧";
  if (n.includes("crate") || n.includes("box")) return "📦";
  if (n.includes("egg")) return "🥚";
  return "•";
}

function formatStock(d) {
  const lines = [];
  lines.push(`*${d.message}*`);
  lines.push("");
  lines.push(`- ⏰ إعادة التعبئة: *${d.restockInLabel}*`);
  lines.push(`- 🔄 الدورة: *${d.rotationId}*`);
  lines.push(`- 📊 الحالة: *${d.status}*`);
  lines.push("");
  if (d.weather?.active) {
    lines.push(`- ⛅ *الطقس: ${d.weather.type.toUpperCase()}*`);
    if (Array.isArray(d.weather.effects)) { for (const eff of d.weather.effects) lines.push(`   - ✨ ${eff}`); }
    lines.push("");
  }
  if (d.seeds?.length) { lines.push(`- 🌱 *البذور (${d.seeds.length}):*`); for (const s of d.seeds) lines.push(`   - ${s.name} × ${s.quantity}`); lines.push(""); }
  if (d.gear?.length) { lines.push(`- ⚙️ *المعدات (${d.gear.length}):*`); for (const g of d.gear) lines.push(`   - ${g.name} × ${g.quantity}`); lines.push(""); }
  if (d.crates?.length) { lines.push(`- 📦 *الصناديق (${d.crates.length}):*`); for (const c of d.crates) lines.push(`   - ${c.name} × ${c.quantity}`); }
  return lines.join("\n");
}

async function modeStock(m) {
  const r = await gag2Fetch();
  if (!r.ok) return m.reply(`❌ ${r.error}`);
  return m.reply(formatStock(r.data));
}

async function modeWatch(watchItems, m, sock) {
  const wants = watchItems.map((w) => w.toLowerCase());
  await m.reply(`👀 *مراقبة:* ${watchItems.join(", ")}\n> الحد الأقصى 5 مرات (~2.5 دقيقة).`);

  for (let i = 1; i <= 5; i++) {
    const r = await gag2Fetch();
    if (!r.ok) { await new Promise((res) => setTimeout(res, 30000)); continue; }
    const d = r.data;
    const allItems = [...(d.seeds ?? []), ...(d.gear ?? []), ...(d.crates ?? [])];
    const hits = allItems.filter((item) => wants.some((w) => item.name.toLowerCase().includes(w)));

    if (hits.length > 0) {
      let msg = `🎯 *[المرة ${i}] تم العثور على ${hits.length} عنصر!*\n\n`;
      for (const h of hits) { msg += `- ${emojiForItem(h.name)} *${h.name} × ${h.quantity}*\n`; }
      msg += `\n` + formatStock(d);
      await sock.sendMessage(m.chat, { text: msg }, { quoted: m });
      return;
    }
    if (i < 5) await new Promise((res) => setTimeout(res, 30000));
  }
  await sock.sendMessage(m.chat, { text: `⏱️ انتهت 5 محاولات بدون تطابق.` }, { quoted: m });
}

async function handler(m, { sock, args }) {
  m.react("🕕");
  try {
    const isWatch = args[0]?.toLowerCase() === "مراقبة";
    if (isWatch) {
      const items = args.slice(1);
      if (items.length === 0) return m.reply("❌ أدخل اسم العنصر. مثال: `.مراقبة_المزرعة مراقبة بذور تفاح`");
      m.react("✅");
      await modeWatch(items, m, sock);
    } else {
      await modeStock(m);
      m.react("✅");
    }
  } catch (err) {
    console.error("[Gag2]", err.message);
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };