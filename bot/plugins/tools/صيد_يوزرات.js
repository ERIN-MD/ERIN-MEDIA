import config from '../../config.js';
import te from '../../src/lib/maro-error.js';
import { getBinaryNodeChild } from 'maro';

const sessions = new Map();

function generateRandomUsername(minLen = 3, maxLen = 5) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
  let result = chars[Math.floor(Math.random() * 26)];
  for (let i = 1; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

async function checkUsernames(sock, usernames) {
  const result = await sock.query({
    tag: "iq",
    attrs: { id: sock.generateMessageTag(), type: "get", to: "@s.whatsapp.net", xmlns: "w:mex" },
    content: [{
      tag: "query",
      attrs: { query_id: "27134626522840286" },
      content: Buffer.from(JSON.stringify({ variables: { usernames } }), "utf-8"),
    }],
  });

  const child = getBinaryNodeChild(result, "result");
  if (child?.content) {
    const data = JSON.parse(Buffer.from(child.content).toString());
    if (data.errors?.length) throw new Error(data.errors[0].message);
    return data?.data?.xwa2_username_check_multi;
  }
  throw new Error('فشل التحقق');
}

const pluginConfig = {
  name: 'صيد_يوزرات',
  alias: ['صيد-يوزرات', 'وقف-صيد'],
  category: 'tools',
  description: 'صيد يوزرات واتساب المتاحة',
  usage: '.صيد_يوزرات <الطول الأدنى> <الطول الأقصى> <المحاولات>',
  example: '.صيد_يوزرات 3 5 30',
  isOwner: true, isPremium: false, isGroup: false, isPrivate: false,
  cooldown: 60, energi: 5, isEnabled: true
};

async function handler(m, { sock }) {
  const command = m.command;
  const args = m.args || [];

  // إيقاف الصيد
  if (command === 'وقف-صيد') {
    const session = sessions.get(m.sender);
    if (!session?.hunting) return m.reply('❌ لا توجد عملية صيد نشطة');
    session.hunting = false;
    return m.reply(`🛑 *تم إيقاف الصيد*\n📊 تم تجربة: ${session.tried} يوزر\n🎯 المتاح: ${session.found.length}`);
  }

  // بدء الصيد
  if (sessions.get(m.sender)?.hunting) {
    return m.reply('⏳ *عملية صيد نشطة بالفعل!*');
  }

  const minLen = parseInt(args[0]) || 3;
  const maxLen = parseInt(args[1]) || 5;
  const rounds = parseInt(args[2]) || 50;

  if (minLen < 1 || maxLen > 20 || minLen > maxLen) {
    return m.reply(`❌ *أطوال غير صحيحة*\n📌 مثال: \`${m.prefix}صيد_يوزرات 3 5 30\``);
  }

  sessions.set(m.sender, { hunting: true, found: [], tried: 0 });
  await m.reply(`🎯 *بدأ الصيد...*\n📏 الطول: ${minLen}-${maxLen}\n🔄 المحاولات: ${rounds}\n🛑 للإيقاف: ${m.prefix}وقف-صيد`);

  for (let i = 0; i < rounds; i++) {
    const session = sessions.get(m.sender);
    if (!session?.hunting) break;

    const batch = Array.from({ length: 20 }, () => generateRandomUsername(minLen, maxLen));

    try {
      const res = await checkUsernames(sock, batch);
      const available = (res?.results || []).filter(r => r.response?.result === 'SUCCESS').map(r => r.username);

      if (available.length) {
        session.found.push(...available);
        await sock.sendMessage(m.chat, {
          text: `🎉 *يوزرات متاحة!*\n${available.map(u => `✅ @${u}`).join('\n')}\n📊 المجموع: ${session.found.length}`,
          mentions: available.map(u => `${u}@s.whatsapp.net`)
        });
      }

      session.tried += batch.length;
      if ((i + 1) % 5 === 0) {
        await m.reply(`🔄 *تحديث*\n📊 تم: ${session.tried} | 🎯 متاح: ${session.found.length}`);
      }
    } catch (e) {
      console.error('Hunt Error:', e);
      if (e.message?.includes('rate')) {
        await m.reply('⚠️ *Rate limit*\n⏳ حاول لاحقاً');
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  const session = sessions.get(m.sender);
  const foundList = session?.found?.length ? session.found.map(u => `• @${u}`).join('\n') : 'لا يوجد';
  await sock.sendMessage(m.chat, {
    text: `✅ *انتهى الصيد*\n🔍 تم: ${session?.tried || 0}\n🎯 متاح: ${session?.found?.length || 0}\n\n${foundList}`,
    mentions: session?.found?.map(u => `${u}@s.whatsapp.net`) || []
  });
  sessions.delete(m.sender);
}

export { pluginConfig as config, handler };