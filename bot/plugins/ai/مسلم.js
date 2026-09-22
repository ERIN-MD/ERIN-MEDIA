import { f } from '../../src/lib/maro-http.js'
import te from '../../src/lib/maro-error.js'

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'مسلم',
    alias: ['muslimai'],
    category: 'ai',
    description: 'ذكاء اصطناعي للإجابة عن أسئلة الإسلام',
    usage: '.مسلم <سؤال>',
    example: '.مسلم ما هي الصلاة؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

class MuslimAI {
    constructor() {
        this.url = "https://www.muslimai.io/api/chat";
        this.headers = { "Content-Type": "application/json" };
    }

    _id() {
        return "019e7d1d-e8a4-702d-96b8-defd87522114";
    }

    _body(q) {
        return JSON.stringify({ query: q, distinctId: this._id() });
    }

    _opts(q) {
        return { method: "POST", headers: this.headers, body: this._body(q) };
    }

    _parse(res) {
        let txt = "";
        for (const l of res.split("\n")) {
            try {
                const p = JSON.parse(l);
                if (p.type === "text") txt += p.data;
            } catch {}
        }
        return txt || res;
    }

    async chat(q) {
        const req = await fetch(this.url, this._opts(q));
        const res = await req.text();
        return this._parse(res);
    }
}

// ═══════════════════════════════════════════════
// ☪️ دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`☪️ *مسلم AI*\n\n> اكتب سؤالك عن الإسلام\n\n📌 *مثال:* \`${m.prefix}مسلم ما هي الصلاة؟\``)
    }

    m.react('⏳')

    try {
        const data = await new MuslimAI().chat(`${text}`)
        let response = `${data}`

        m.react('✅')
        await m.reply(response)

    } catch (error) {
        m.react('❌')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }