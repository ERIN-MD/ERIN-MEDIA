import axios from "axios";
import te from "../../src/lib/maro-error.js";

const CORS_PROXY = "https://cors.rifkyshre.biz.id/";
const API_BASE = "https://api-pddikti.kemdiktisaintek.go.id";
const FRONTEND_ORIGIN = "https://pddikti.kemdiktisaintek.go.id";

// ═══════════════════════════════════════════════
// 🛠️ دوال API
// ═══════════════════════════════════════════════
async function pddiktiGet(path) {
  const res = await axios.get(`${CORS_PROXY}${API_BASE}${path}`, {
    timeout: 30000, validateStatus: () => true,
    headers: { Accept: "application/json", "X-Cors-Spoof-Origin": FRONTEND_ORIGIN },
  });
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  return res.data;
}

async function pddikti(input) {
  const mode = (input?.mode ?? "all").toLowerCase();
  const query = typeof input?.query === "string" ? input.query.trim() : "";

  if (mode === "detail") {
    const mhsId = input?.mahasiswaId?.trim() || "";
    if (!mhsId) return { Status: false, Error: "معرف الطالب مطلوب" };
    const data = await pddiktiGet(`/detail/mhs/${encodeURIComponent(mhsId)}`);
    return { Status: true, Result: { ...data } };
  }

  if (!query || query.length < 3) return { Status: false, Error: "كلمة البحث قصيرة (3 أحرف على الأقل)" };

  let path;
  switch (mode) {
    case "all": path = `/pencarian/all/${encodeURIComponent(query)}`; break;
    case "mhs": path = `/pencarian/mhs/${encodeURIComponent(query)}`; break;
    case "dosen": path = `/pencarian/dosen/${encodeURIComponent(query)}`; break;
    case "pt": path = `/pencarian/pt/${encodeURIComponent(query)}`; break;
    case "prodi": path = `/pencarian/prodi/${encodeURIComponent(query)}`; break;
    default: return { Status: false, Error: "وضع غير معروف" };
  }

  const data = await pddiktiGet(path);

  if (mode === "all" && data && typeof data === "object") {
    const mhs = Array.isArray(data.mahasiswa) ? data.mahasiswa : [];
    const dosen = Array.isArray(data.dosen) ? data.dosen : [];
    const pt = Array.isArray(data.pt) ? data.pt : [];
    const prodi = Array.isArray(data.prodi) ? data.prodi : [];
    return { Status: true, Result: { mahasiswa: mhs, dosen, pt, prodi, query } };
  }

  return { Status: true, Result: { results: Array.isArray(data) ? data : [], query, mode } };
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
  name: "طالب",
  alias: ["pddikti"],
  category: "search",
  description: "بحث عن بيانات الطلاب والجامعات",
  usage: ".طالب <وضع> <بحث>",
  example: ".طالب mhs محمد",
  cooldown: 15, energi: 1, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 🎓 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m) {
  const args = m.args || [];
  if (args.length === 0) {
    return m.reply(
      `🎓 *بحث PDDIKTI*\n\n` +
      `📌 الأوضاع: all | mhs | dosen | pt | prodi | detail\n` +
      `💡 مثال: \`${m.prefix}طالب mhs محمد\``
    );
  }

  m.react("⏳");

  try {
    const mode = args[0].toLowerCase();
    const query = args.slice(1).join(" ");

    if (mode === "detail") {
      if (!query) return m.reply("❌ أدخل معرف الطالب");
      const res = await pddikti({ mode: "detail", mahasiswaId: query });
      if (!res.Status) return m.reply(`❌ ${res.Error}`);
      const r = res.Result;
      let txt = `🎓 *تفاصيل الطالب*\n\n`;
      txt += `📝 الاسم: *${r.nama}*\n🆔 NIM: *${r.nim}*\n📚 التخصص: *${r.prodi}*\n🏛️ الجامعة: *${r.nama_pt}*\n`;
      m.react("✅");
      return m.reply(txt);
    }

    if (!query) return m.reply("❌ أدخل كلمة البحث");
    const res = await pddikti({ mode, query });
    if (!res.Status) return m.reply(`❌ ${res.Error}`);

    const r = res.Result;
    let txt = `🔍 *نتائج البحث*\n\n`;

    if (mode === "all") {
      r.mahasiswa.slice(0, 3).forEach(m => txt += `👨🎓 ${m.nama} [${m.nim}] — ${m.nama_prodi}\n`);
      r.dosen.slice(0, 3).forEach(d => txt += `👨🏫 ${d.nama} [NIDN ${d.nidn}]\n`);
      r.pt.slice(0, 3).forEach(p => txt += `🏛️ ${p.nama}\n`);
    } else {
      r.results.slice(0, 10).forEach((item, i) => {
        if (mode === "mhs") txt += `*${i + 1}. ${item.nama}* [${item.nim}] — ${item.nama_prodi}\n`;
        else if (mode === "dosen") txt += `*${i + 1}. ${item.nama}* [NIDN ${item.nidn}]\n`;
        else if (mode === "pt") txt += `*${i + 1}. ${item.nama}*\n`;
        else if (mode === "prodi") txt += `*${i + 1}. ${item.nama}*\n`;
        txt += `\n`;
      });
    }

    m.react("✅");
    return m.reply(txt.trim());

  } catch (err) {
    m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };