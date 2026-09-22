import axios from 'axios';
import { load } from 'cheerio';
import { generateWAMessageFromContent } from 'maro';
import te from "../../src/lib/maro-error.js";

const styles = [
    { name: "سلفير 3D", url: "https://en.ephoto360.com/create-glossy-silver-3d-text-effect-online-802.html" },
    { name: "زهور اللبلاب", url: "https://en.ephoto360.com/typography-texture-online-nature-theme-342.html" },
    { name: "اجنحة الفضاء", url: "https://en.ephoto360.com/angel-wing-effect-329.html" },
    { name: "رسم حائط شوارع", url: "https://en.ephoto360.com/graffiti-text-3-179.html" },
    { name: "شعار الاسد والتاج", url: "https://en.ephoto360.com/royal-text-effect-online-free-471.html" },
    { name: "فراشة الكون", url: "https://en.ephoto360.com/write-galaxy-online-18.html" },
    { name: "سحب وطائرات", url: "https://en.ephoto360.com/create-a-cloud-text-effect-in-the-sky-618.html" },
    { name: "رسم حائط مميز", url: "https://en.ephoto360.com/graffiti-text-effect-online-178.html" },
    { name: "برواز ذهبي مودرن", url: "https://en.ephoto360.com/modern-gold-5-215.html" },
    { name: "دب غاضب", url: "https://en.ephoto360.com/free-bear-logo-photo-online-673.html" },
    { name: "داخل الماء", url: "https://en.ephoto360.com/underwater-text-73.html" },
    { name: "على الرمال", url: "https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html" },
    { name: "نيون بنفسجي X اخضر", url: "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html" },
    { name: "اطار اخضر", url: "https://en.ephoto360.com/metal-text-effect-blue-174.html" },
    { name: "اخضر جذاب", url: "https://en.ephoto360.com/create-unique-word-green-light-63.html" },
    { name: "بناتي زهري X اسود", url: "https://en.ephoto360.com/create-a-blackpink-neon-logo-text-effect-online-710.html" },
    { name: "العاب نارية", url: "https://en.ephoto360.com/text-firework-effect-356.html" },
    { name: "اوبس 3D", url: "https://en.ephoto360.com/create-online-3d-comic-style-text-effects-817.html" }
];

const pluginConfig = {
  name: "اسمي",
  alias: ["اسمي", "name"],
  category: "photo",
  description: "تصميم الاسماء على صور Ephoto360",
  usage: ".اسمي <الاسم>",
  example: ".اسمي محمد",
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
};

async function ephotoScraper(text, url) {
  const session = axios.create({ headers: { 'User-Agent': 'Mozilla/5.0' } });

  const initialRes = await session.get(url);
  const cookie = initialRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
  const $ = load(initialRes.data);

  const token = $('input[name="token"]').val();
  const build_server = $('input[name="build_server"]').val();
  const build_server_id = $('input[name="build_server_id"]').val();

  const formData = new URLSearchParams();
  formData.append('text[]', text);
  formData.append('token', token);
  formData.append('build_server', build_server);
  formData.append('build_server_id', build_server_id);

  const postRes = await session.post(url, formData.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie }
  });

  const $2 = load(postRes.data);
  let formValueInputStr = $2('input[name="form_value_input"]').val();

  if (!formValueInputStr) {
    const script = $2('script').filter((i, el) => $2(el).html()?.includes('form_value_input')).first().html();
    if (script) {
      const match = script.match(/name="form_value_input" value="([^"]+)"/);
      if (match) formValueInputStr = match[1];
    }
  }

  const formValueInput = JSON.parse(formValueInputStr);
  if (formValueInput.text) {
    formValueInput['text[]'] = formValueInput.text;
    delete formValueInput.text;
  }

  const finalRes = await session.post('https://en.ephoto360.com/effect/create-image', new URLSearchParams(formValueInput).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie }
  });

  const imageUrl = finalRes.data.image || JSON.parse(finalRes.data).image;
  return imageUrl.startsWith('http') ? imageUrl : build_server + imageUrl;
}

async function handler(m, { sock }) {
  const text = m.args.join(" ");
  const args = text.split('|');

  if (args.length === 2 && !isNaN(args[0])) {
    const index = parseInt(args[0]);
    const name = args[1];
    const selected = styles[index];
    if (!selected) return m.reply('❌ رقم النمط غير موجود');

    m.react('⏳');
    try {
      const img = await ephotoScraper(name, selected.url);
      await sock.sendMessage(m.chat, { image: { url: img }, caption: `✅ ${name} - ${selected.name}` }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply('❌ فشل التصميم');
    }
    return;
  }

  if (!text) return m.reply(`🎨 *تصميم الاسماء*\n\n📌 ${m.prefix}${m.command} الاسم`);

  const rows = styles.map((s, i) => ({
    header: `النمط ${i + 1}`,
    title: s.name,
    id: `${m.prefix}${m.command} ${i}|${text}`
  }));

  const msg = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: { text: `🎨 اختر النمط\n📝 الاسم: ${text}` },
          footer: { text: 'Ephoto360' },
          header: { title: 'تصميم الاسماء', hasMediaAttachment: false },
          nativeFlowMessage: {
            buttons: [{
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: 'اختر النمط',
                sections: [{ title: 'الأنماط', rows }]
              })
            }]
          }
        }
      }
    }
  }, { quoted: m });

  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

export { pluginConfig as config, handler };