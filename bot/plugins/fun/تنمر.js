const pluginConfig = {
  name: "تنمر",
  alias: [],
  category: "fun",
  description: "😂 أمر تنمر على شخص في الجروب",
  usage: ".تنمر @شخص",
  example: ".تنمر @شخص",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true
};

async function handler(m, { sock }) {
    try {
      if (!m.isGroup) {
        await m.react("❌");
        return m.reply("❌ هذا الأمر للجروبات فقط!");
      }

      let target = m.mentionedJid?.[0];
      
      if (!target && m.args[0]) {
        const possibleJid = m.args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        if (m.args[0].match(/[\d@]/)) {
          target = possibleJid;
        }
      }

      if (!target) {
        await m.react("❓");
        return m.reply("❗ استخدم الأمر هكذا:\n\n.تنمر @شخص");
      }

      if (!target.includes("@s.whatsapp.net")) {
        target = target.replace(/@.*$/, '') + '@s.whatsapp.net';
      }

      const targetUsername = target.split("@")[0];

      const bullyMessages = [
        `😂 @${targetUsername} شكلك اليوم فاطر.. روح كول وحاول تاني!`,
        `🤣 @${targetUsername} وينك من أول ما الجروب انفتح؟ جاي تتشرمط؟`,
        `😭 @${targetUsername} والله لو تشوف وجهك بالمراية رح تضحك على حالك!`,
        `💀 @${targetUsername} روح نام يا حبيبي.. التعبان ماله داعي!`,
        `👻 @${targetUsername} شكلك تايه من برا الجروب.. روح اسأل على أهلك!`,
        `🎭 @${targetUsername} ليش قاعد تسولف وكأنك فاهم؟ روح اقرأ كتاب!`,
        `🍌 @${targetUsername} يا موز يا عبدالسلام.. وينك من زمان؟`,
        `🚶 @${targetUsername} مشيتك تتعبني.. روح ارتاح وخلينا!`,
        `🎪 @${targetUsername} يلا سير السيرك يناديك.. عندك مواهب!`,
        `📞 @${targetUsername} روح اتصل على أمك تقولك تعال لعندها!`,
        `🪞 @${targetUsername} شوف حالك بالمراية وبتعرف ليش محد يحادثك!`,
        `🍼 @${targetUsername} يا صغير روح اشرب حليب ونام!`,
        `🎯 @${targetUsername} والله لو تحط إصبعك بفمك ما بتعرف وين بدك!`,
        `🤡 @${targetUsername} كشخة يا مهرج الجروب!`,
        `💤 @${targetUsername} روح نام يا تعبان.. خلينا نستمتع!`,
        `🎸 @${targetUsername} روح العب كمان.. مالك ومال الكلام!`,
        `🦁 @${targetUsername} تتكلم وكأنك أسد.. وانتا قطو!`,
        `🌮 @${targetUsername} يا شاورما بدون صوص.. وين الطعم؟`,
        `🎭 @${targetUsername} تمثيلك يفضحك يا فنان!`,
        `🚴 @${targetUsername} روح اركب دراجة وطوف.. مالك هنا!`,
        `🤖 @${targetUsername} يا روبوت مبرمج.. روح اعدل السوفتوير حقك!`,
        `🎮 @${targetUsername} روح العب فورتنايت.. الكلام مو لك!`,
        `🍎 @${targetUsername} يا تفاحة مسروقة.. وين الشجرة؟`,
        `📱 @${targetUsername} شكلك ناسي تشحن جوالك من كثر السهر!`,
        `👑 @${targetUsername} تحسب نفسك ملك؟ روح ابحث عن مملكتك!`,
        `🎨 @${targetUsername} يا لوحة فاشلة.. محد يقدر يفهمك!`,
        `🚀 @${targetUsername} روح القمر.. الأرض مش مناسبة لك!`,
        `🦸 @${targetUsername} يا بطل خارق.. وين قدراتك؟`,
        `👶 @${targetUsername} روح العب مع أطفال الحارة!`,
        `🎓 @${targetUsername} شكلك ناسي تروح للمدرسة!`,
        `🍔 @${targetUsername} يا برجر ناقص لحمة.. وين المكونات؟`,
        `🎵 @${targetUsername} غنيلنا أغنية.. يمكن صوتك يطلع حلو!`,
        `🏀 @${targetUsername} روح السلة.. الكرة أنسب لك!`,
        `🎬 @${targetUsername} يا ممثل فاشل.. روح اتعلم التمثيل!`,
        `🔧 @${targetUsername} روح اشتغل ميكانيكي.. الكلام مو شغلك!`,
        `🎪 @${targetUsername} يلا قفز في الترامبولين.. يمكن تطلع!`,
        `🛌 @${targetUsername} روح نام.. الحلم أحلى من الواقع!`,
        `🍦 @${targetUsername} يا آيس كريم ذايب.. روح جمد حالك!`,
        `🎯 @${targetUsername} روح العب دارتس.. وخلّي السوالف!`,
        `🛒 @${targetUsername} روح السوق.. واشتري لك شخصية جديدة!`,
        `📚 @${targetUsername} روح المكتبة.. اقرأ كتاب عن الذكاء!`,
        `🎭 @${targetUsername} يا مسرحية طويلة.. روح اخلص!`,
        `🚁 @${targetUsername} روح اطير.. الأرض ضيقة عليك!`,
        `🦜 @${targetUsername} يا ببغاء.. كرر كلام غير!`,
        `🎸 @${targetUsername} روح اتعلم عزف.. يمكن تطلع موهوب!`,
        `🍕 @${targetUsername} يا بيتزا ناقصة جبن.. روح اكمل نفسك!`,
        `🎮 @${targetUsername} روح ابني عالم في ماينكرافت!`,
        `🛸 @${targetUsername} يا فضائي.. روح لكوكبك!`,
        `🎪 @${targetUsername} يا سيرك متحرك.. روح ارفه عن الناس!`,
        `📞 @${targetUsername} روح اتصل بصديق.. يمكن يطقلك!`,
        `🛌 @${targetUsername} نام.. يمكن تحلم أنك شخص ثاني!`,
        `🎨 @${targetUsername} روح ارسم لوحة.. يمكن تطلع فنان!`,
        `🍩 @${targetUsername} يا دونت ناقص حفرة.. روح اكمل!`,
        `🚗 @${targetUsername} روح سوق السيارة.. وخلّي البشر!`,
        `🎪 @${targetUsername} يا مهرج ممل.. روح اتعلم دعابات جديدة!`,
        `📱 @${targetUsername} شكلك ناسي تحديث برنامجك!`,
        `🦸 @${targetUsername} يا سوبرمان مزيف.. وين الرداء؟`,
        `🎮 @${targetUsername} روح ابحث عن كنز في الحياة الواقعية!`,
        `🍎 @${targetUsername} يا تفاحة مسحورة.. روح لسنووايت!`,
        `🚀 @${targetUsername} روح الفضاء.. الأرض مش ناقصك!`,
        `🎭 @${targetUsername} يا دراما رخيصة.. روح اشتغل بمسلسل!`,
        `🤖 @${targetUsername} يا روبوت عاطل.. روح اعدل برمجة!`
      ];

      const randomMessage = bullyMessages[Math.floor(Math.random() * bullyMessages.length)];

      await m.react("😂");

      await sock.sendMessage(m.chat, {
        text: randomMessage,
        mentions: [target]
      });

    } catch (error) {
      console.log("❌ خطأ في أمر تنمر:", error);
      await m.react("❌");
      return m.reply("❌ حدث خطأ في أمر التنمر!");
    }
}

export { pluginConfig as config, handler };