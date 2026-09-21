import axios from 'axios';
import te from '../../src/lib/maro-error.js';

// ═══════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════
async function searchApps(query) {
  const res = await axios.get(`http://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(query)}&limit=10`);
  return res.data.datalist.list.map(app => ({
    name: app.name,
    package: app.package
  }));
}

async function getAppInfo(packageName) {
  const res = await axios.get(`http://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(packageName)}&limit=1`);
  const app = res.data.datalist.list[0];
  if (!app) throw new Error('لم يتم العثور على التطبيق');

  let obb_link, obb = false;
  try { obb_link = app.obb.main.path; obb = true; } catch { obb_link = null; }

  return { obb, obb_link, name: app.name, icon: app.icon, packageN: app.package };
}

async function downloadApp(packageName) {
  const res = await axios.get(`http://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(packageName)}&limit=1`);
  const app = res.data.datalist.list[0];
  const download = app.file.path;
  const fileName = app.package + '.apk';
  const head = await axios.head(download);
  const size = head.headers['content-length'];
  const mimetype = head.headers['content-type'];
  return { fileName, mimetype, download, size };
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: 'apk',
    alias: ['aptoide'],
    category: 'search',
    description: 'تحميل تطبيقات APK مع OBB',
    usage: '.apk <اسم التطبيق>',
    example: '.apk free fire',
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 20, energi: 2, isEnabled: true,
};

// ═══════════════════════════════════════════════
// 📱 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
  const text = m.text?.trim();

  if (!text) {
    return m.reply(
      `📱 *تحميل APK*\n\n` +
      `⚔️ تحميل تطبيقات APK مع ملفات OBB\n\n` +
      `⚡ الاستخدام: \`${m.prefix}apk <اسم التطبيق>\`\n` +
      `📌 مثال: \`${m.prefix}apk free fire\``
    );
  }

  // إذا كان اسم حزمة
  if (/^com\./i.test(text.trim())) {
    m.react('⏬');
    try {
      const info = await getAppInfo(text.trim());
      const res = await downloadApp(text.trim());

      if (parseInt(res.size) > 2000000000) {
        return m.reply('❌ حجم ملف APK كبير جداً (الحد 2GB)');
      }

      await sock.sendMessage(m.chat, {
        image: { url: info.icon },
        caption: `📱 *${info.name}*\n📦 ${info.packageN}\n⏳ جاري تحميل الملف...`
      }, { quoted: m });

      await sock.sendMessage(m.chat, {
        document: { url: res.download },
        mimetype: res.mimetype,
        fileName: res.fileName
      }, { quoted: m });

      if (info.obb) {
        const obbFileName = decodeURIComponent(info.obb_link.split('/').pop().split('?')[0]);
        await sock.sendMessage(m.chat, {
          document: { url: info.obb_link },
          mimetype: 'application/octet-stream',
          fileName: obbFileName
        }, { quoted: m });
      }

      m.react('✅');
    } catch (e) {
      console.error(e);
      m.react('❌');
      m.reply(te(m.prefix, m.command, m.pushName));
    }
    return;
  }

  // بحث
  m.react('🔍');
  try {
    const apps = await searchApps(text);
    if (!apps.length) {
      m.react('❌');
      return m.reply('❌ لم يتم العثور على أي تطبيقات');
    }

    // إرسال قائمة النتائج
    const buttons = apps.map(app => ({
      title: app.name.substring(0, 24),
      description: app.package,
      id: `${m.prefix}apk ${app.package}`
    }));

    await sock.sendMessage(m.chat, {
      text: `📱 *نتائج البحث عن: ${text}*\n\nاختر تطبيقاً للتحميل:`,
      footer: "📲 متجر APK",
      interactiveButtons: [{
        name: "single_select",
        buttonParamsJson: JSON.stringify({
          title: "📲 اختر تطبيق",
          sections: [{ title: "التطبيقات", rows: buttons }]
        })
      }]
    }, { quoted: m });

    m.react('✅');
  } catch (e) {
    console.error(e);
    m.react('❌');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };