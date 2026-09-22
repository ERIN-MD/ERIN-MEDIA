// إيقاف البث الخاص - أمر لإيقاف البث الخاص الجاري

const pluginConfig = {
  name: 'إيقاف_البث_الخاص',
  alias: ['stopbcpc'],
  category: 'owner',
  description: 'إيقاف البث الخاص الجاري',
  usage: '.إيقاف_البث_الخاص',
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true
}

async function handler(m) {
  if (!global.statusBcpc) {
    return m.reply('❌ لا يوجد بث خاص جارٍ حالياً.')
  }
  global.stopBcpc = true
  return m.reply('⏹️ جاري إيقاف البث الخاص...')
}

export { pluginConfig as config, handler }