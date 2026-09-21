import axios from "axios";
import crypto from "crypto";
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

class TempMail {
  constructor() {
    this.baseURL = "https://api.mail.tm";
    this.token = null;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      }
    });
  }

  async getDomains() {
    const { data } = await this.client.get("/domains");
    return data["hydra:member"] || data;
  }

  randomString(length = 10) {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
  }

  async createEmail() {
    const domains = await this.getDomains();
    if (!domains.length) throw new Error("لا يوجد نطاقات متاحة");
    const domain = domains[0].domain;
    const username = this.randomString(8);
    const password = this.randomString(12);
    const address = `${username}@${domain}`;
    await this.createAccount(address, password);
    const token = await this.login(address, password);
    return { address, password, token };
  }

  async createAccount(address, password) {
    const { data } = await this.client.post("/accounts", { address, password });
    return data;
  }

  async login(address, password) {
    const { data } = await this.client.post("/token", { address, password });
    this.token = data.token;
    this.client.defaults.headers.common["authorization"] = `Bearer ${data.token}`;
    return data.token;
  }

  async getMessages(page = 1) {
    if (!this.token) throw new Error("سجل الدخول أولاً");
    const { data } = await this.client.get(`/messages?page=${page}`);
    return data["hydra:member"] || data;
  }

  async getMessage(id) {
    if (!this.token) throw new Error("سجل الدخول أولاً");
    const { data } = await this.client.get(`/messages/${id}`);
    return data;
  }

  async waitMessage({ interval = 5000, timeout = 60000 } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const messages = await this.getMessages();
      if (messages.length) return messages;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error("انتهت المهلة");
  }
}

const pluginConfig = {
  name: 'بريد_مؤقت2',
  alias: [],
  category: 'tools',
  description: 'إنشاء بريد مؤقت واستقبال الرسائل',
  usage: '.بريد_مؤقت2 (إنشاء) | .بريد_مؤقت2 رسائل | .بريد_مؤقت2 قراءة <id>',
  example: '.بريد_مؤقت2',
  isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 15, energi: 1, isEnabled: true
};

const sessions = {};

async function handler(m, { sock }) {
  const args = m.args || [];
  const action = args[0]?.toLowerCase();

  if (!action || action === 'انشاء' || action === 'new') {
    m.react('📧');
    try {
      const mail = new TempMail();
      const account = await mail.createEmail();
      sessions[m.sender] = { mail, account };
      
      await m.reply(
        `📧 *بريد_مؤقت2*\n\n` +
        `📩 *الإيميل:* \`${account.address}\`\n` +
        `🔑 *كلمة المرور:* \`${account.password}\`\n\n` +
        `📌 *للرسائل:* \`${m.prefix}بريد_مؤقت2 رسائل\`\n` +
        `📌 *للقراءة:* \`${m.prefix}بريد_مؤقت2 قراءة <id>\``
      );
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(`❌ ${e.message}`);
    }
    return;
  }

  if (action === 'رسائل' || action === 'inbox') {
    const session = sessions[m.sender];
    if (!session) return m.reply(`❌ لا يوجد بريد نشط\n> استخدم \`${m.prefix}بريد_مؤقت2\` أولاً`);

    m.react('📥');
    try {
      const messages = await session.mail.getMessages();
      if (!messages || messages.length === 0) return m.reply('📭 لا توجد رسائل');

      let text = `📨 *الرسائل (${messages.length})*\n\n`;
      for (const msg of messages.slice(0, 5)) {
        text += `📩 *${msg.subject || 'بدون عنوان'}*\n👤 ${msg.from?.name || msg.from?.address || '?'}\n🆔 \`${msg.id}\`\n\n`;
      }
      text += `📌 *للقراءة:* \`${m.prefix}بريد_مؤقت2 قراءة <id>\``;
      await m.reply(text);
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(`❌ ${e.message}`);
    }
    return;
  }

  if (action === 'قراءة' || action === 'read') {
    const session = sessions[m.sender];
    if (!session) return m.reply(`❌ لا يوجد بريد نشط`);

    const msgId = args[1];
    if (!msgId) return m.reply(`📌 *قراءة:* \`${m.prefix}بريد_مؤقت2 قراءة <id>\``);

    m.react('📖');
    try {
      const msg = await session.mail.getMessage(msgId);
      const text = 
        `📧 *${msg.subject || 'بدون عنوان'}*\n` +
        `👤 *من:* ${msg.from?.name || msg.from?.address || '?'}\n` +
        `📅 *التاريخ:* ${new Date(msg.createdAt).toLocaleString('ar-EG')}\n` +
        `━━━━━━━━━━━━━━━━━━\n${msg.text || msg.body || 'لا يوجد محتوى'}`;

      await m.reply(text);
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(`❌ ${e.message}`);
    }
    return;
  }
}

export { pluginConfig as config, handler };