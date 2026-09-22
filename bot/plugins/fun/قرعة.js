const pluginConfig = {
    name: 'قرعة',
    alias: ['lottery'],
    category: 'fun',
    description: '🎲 اختيار فائز عشوائي من قائمة أسماء',
    usage: '.قرعة اسم1,اسم2,اسم3',
    example: '.قرعة محمد,علي,سعيد,أحمد',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const args = m.args || [];
    
    await m.react('🎲');
    
    if (!args.length) {
        return m.reply(`🎲 *قرعة الحظ*\n\n📝 *الاستخدام:*\n.قرعة اسم1,اسم2,اسم3\n\n💡 *مثال:*\n.قرعة محمد,علي,سعيد,أحمد`);
    }
    
    const names = args.join(' ').split(',').map(name => name.trim()).filter(name => name.length > 0);
    
    if (names.length < 2) {
        return m.reply(`⚠️ *يجب أن يكون هناك اسمين على الأقل للقيام بالقرعة*\n📝 مثال: .قرعة محمد,علي`);
    }
    
    const winner = names[Math.floor(Math.random() * names.length)];
    const participantsList = names.map((name, i) => `${i + 1}️⃣ ${name}`).join('\n');
    
    const resultMessage = `🎲 *قرعة الحظ* 🎲\n\n👥 *المشاركون:*\n${participantsList}\n\n━━━━━━━━━━━━━━━━━━\n🏆 *الفائز المحظوظ هو:*\n✨ *${winner}* ✨\n━━━━━━━━━━━━━━━━━━\n🎉 *تهانينا!* 🎉`;
    
    await m.reply(resultMessage);
    await m.react('🏆');
}

export { pluginConfig as config, handler };