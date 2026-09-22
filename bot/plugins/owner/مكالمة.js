import fs from 'fs';
import path from 'path';
import axios from 'axios';
import yts from 'yt-search';
import config from '../../config.js';
import te from '../../src/lib/maro-error.js';

const AUTH_DIR = './storage/caller';
const CREDS_FILE = path.join(AUTH_DIR, 'creds.json');
const AUDIO_CACHE = './temp/caller';

let VoipClient = null;
let voipClient = null;
let isConnecting = false;
let activeCall = null;
let clientStartedAt = null;
let lastError = null;
let lastCallTarget = null;
let lastCallAt = null;
let isEndingCall = false;

if (!global.__rtcRefs) global.__rtcRefs = new Set();
if (!fs.existsSync(AUDIO_CACHE)) fs.mkdirSync(AUDIO_CACHE, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function safeDelete(file) { try { if (file && fs.existsSync(file)) fs.unlinkSync(file); } catch {} }

async function getVoipClient() {
  if (!VoipClient) {
    const mod = await import('baileys-caller');
    VoipClient = mod.VoipClient || mod.default?.VoipClient || mod.default;
  }
  return VoipClient;
}

function hasSession() { return fs.existsSync(CREDS_FILE); }

function getRTCStatus() {
  return {
    session: hasSession(),
    connecting: isConnecting,
    connected: !!voipClient,
    activeCall: !!activeCall,
    uptime: clientStartedAt ? Math.floor((Date.now() - clientStartedAt) / 1000) + 's' : '-',
    lastCallTarget: lastCallTarget || '-',
    lastError: lastError || '-'
  };
}

async function connectRTC(m, sock) {
  if (voipClient) {
    try { await voipClient.ping(); return true; } catch { voipClient = null; }
  }
  if (isConnecting) { await sleep(3000); return !!voipClient; }
  isConnecting = true;
  lastError = null;
  try {
    const VoipClientClass = await getVoipClient();
    const client = new VoipClientClass({ 
      authDir: AUTH_DIR,
      printQRInTerminal: true
    });

    await m.reply('📱 *تم إرسال QR Code للترمينال*\n⏱️ امسح الكود من الكونسول');

    await Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connect timeout (60s)')), 60000))
    ]);
    
    voipClient = client;
    clientStartedAt = Date.now();
    return true;
  } catch (err) {
    voipClient = null;
    lastError = err.message || String(err);
    return false;
  } finally { isConnecting = false; }
}

async function clearCall() {
  if (isEndingCall) { await sleep(10000); return; }
  if (!activeCall) return;
  isEndingCall = true;
  const call = activeCall;
  activeCall = null;
  global.__rtcRefs.delete(call);
  try { call.end(); await sleep(2000); } catch {}
  isEndingCall = false;
}

const pluginConfig = {
  name: 'مكالمة',
  alias: ['call', 'rtc'],
  category: 'owner',
  description: 'مكالمات VoIP للبوت',
  usage: '.مكالمة تسجيل | .مكالمة <رقم>',
  example: '.مكالمة 201234567890',
  isOwner: true, isPremium: false, isGroup: false, isPrivate: true,
  cooldown: 30, energi: 5, isEnabled: true
};

async function handler(m, { sock }) {
  const args = m.args || [];
  const subCommand = args[0]?.toLowerCase();

  // تسجيل الدخول
  if (subCommand === 'تسجيل' || subCommand === 'login') {
    if (voipClient) return m.reply('✅ متصل بالفعل');
    m.react('🔐');
    await m.reply('🔐 جاري الاتصال بـ VoIP...');
    const ok = await connectRTC(m, sock);
    m.react(ok ? '✅' : '❌');
    return m.reply(ok ? '✅ تم الاتصال بـ VoIP' : '❌ فشل الاتصال - شاهد الترمينال');
  }

  // حالة
  if (subCommand === 'حالة' || subCommand === 'status') {
    const s = getRTCStatus();
    return m.reply(
      '📡 *حالة المكالمات*\n\n' +
      `• الجلسة: ${s.session ? '✅' : '❌'}\n` +
      `• متصل: ${s.connected ? '🟢' : s.connecting ? '🟡' : '🔴'}\n` +
      `• مكالمة نشطة: ${s.activeCall ? '📞' : '📴'}\n` +
      `• مدة التشغيل: ${s.uptime}\n` +
      `• آخر خطأ: ${s.lastError}`
    );
  }

  // انهاء
  if (subCommand === 'انهاء' || subCommand === 'end') {
    if (!activeCall) return m.reply('📵 لا توجد مكالمة');
    await clearCall();
    return m.reply('📵 تم انهاء المكالمة');
  }

  // خروج
  if (subCommand === 'خروج' || subCommand === 'logout') {
    await clearCall();
    try { voipClient?.disconnect(); } catch {}
    voipClient = null;
    try { if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
    clientStartedAt = null;
    return m.reply('✅ تم حذف الجلسة');
  }

  // مكالمة
  if (!voipClient) {
    await m.reply('🔐 جاري الاتصال بـ VoIP...');
    const ok = await connectRTC(m, sock);
    if (!ok) { m.react('❌'); return m.reply('❌ فشل الاتصال\nاستخدم `.مكالمة تسجيل`'); }
  }

  const target = (args[0] || m.sender.replace(/\D/g, '')).replace(/\D/g, '');
  if (!target || target.length < 10) return m.reply('❌ رقم غير صالح');

  if (activeCall) await clearCall();

  m.react('📞');
  await m.reply(`📞 جاري الاتصال...`);

  try {
    const call = await voipClient.call(target, { audioSource: 'silence' });
    activeCall = call;
    lastCallTarget = target;
    lastCallAt = Date.now();

    call.on('ringing', () => m.reply('🔔 جاري الرنين...'));
    call.on('connected', () => m.reply('✅ تم الاتصال!'));
    call.on('ended', () => { activeCall = null; m.reply('📵 انتهت المكالمة'); });
    call.on('error', (err) => { activeCall = null; lastError = err.message; m.reply('❌ ' + err.message); });

    m.react('✅');
  } catch (err) {
    activeCall = null;
    m.react('❌');
    m.reply('❌ فشل: ' + (err.message || String(err)));
  }
}

export { pluginConfig as config, handler };