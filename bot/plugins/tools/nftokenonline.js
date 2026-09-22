import https from 'https';
import te from "../../src/lib/maro-error.js";

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
];

function generateRandomIP() {
    const ranges = [
        [1, 1], [2, 2], [5, 5], [23, 23], [27, 27], [31, 31], [36, 36], [37, 37], [39, 39], [42, 42],
        [46, 46], [49, 49], [50, 50], [60, 60], [114, 114], [117, 117], [118, 118], [119, 119], [120, 120],
        [121, 121], [122, 122], [123, 123], [124, 124], [125, 125], [126, 126], [180, 180], [182, 182], [183, 183]
    ];
    const range = ranges[Math.floor(Math.random() * ranges.length)];
    return [range[0], Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)].join('.');
}

function generateVisitorId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const randomString = (length) => Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `v-${randomString(8)}-${randomString(8)}`;
}

async function generateToken(cookie) {
    const spoofedIp = generateRandomIP();
    const visitorId = generateVisitorId();
    const body = JSON.stringify({ cookie });
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'nftoken.online',
            path: '/api/generate',
            method: 'POST',
            headers: {
                'User-Agent': ua,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Visitor-ID': visitorId,
                'X-Forwarded-For': spoofedIp,
                'X-Real-IP': spoofedIp,
                'Client-IP': spoofedIp,
                'Content-Length': Buffer.byteLength(body)
            },
            rejectUnauthorized: false
        }, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
                } catch (e) {
                    reject(new Error('فشل تحليل الرد'));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const pluginConfig = {
  name: "توليد_توكن",
  alias: ["token", "nftoken", "نتفلكس"],
  category: "tools",
  description: "توليد توكن Netflix من الكوكيز",
  usage: ".توليد_توكن <الكوكيز>",
  example: ".توليد_توكن eyJ...",
  isOwner: true,
  cooldown: 15,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const cookie = m.args.join(" ").trim();
  if (!cookie) return m.reply(`🔑 *توليد التوكن*\n\n📌 ${m.prefix}${m.command} <كوكيز Netflix>`);

  m.react('⏳');

  try {
    const result = await generateToken(cookie);
    m.reply(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
    m.react('✅');
  } catch (e) {
    console.log(e);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };