const pluginConfig = {
    name: 'امك',
    alias: ['mother'],
    category: 'owner',
    description: '🔞 أمر خاص للمطور فقط',
    usage: '.امك @شخص',
    example: '.امك @شخص',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
};

async function handler(m) {
    let target = null;

    if (m.quoted) {
        target = m.quoted.sender;
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0];
    } else if (m.args.length > 0) {
        const num = m.args[0].replace(/[@!]/g, '');
        if (num.length > 5) target = `${num}@s.whatsapp.net`;
    }

    if (!target) return m.reply(`❌ *يرجى منشن الشخص أو الرد على رسالته!*`);

    const targetName = target.split('@')[0];

    await m.react("🔞");

    const textToSend = `
@${targetName} هاي اختك
ا   👧🏻       😂
ا ,_\\//      _\\| |
ا       ) )<--\\ \\
ا      _|,|   _| |  

ــكسها @${targetName}

اختك          انا
ا   👧🏻       😂
ا ,_\\//      _\\| |
ا       ) )<--\\ \\
ا      _|,|   _| |  

ــ @${targetName}

خالتك         انا
ا   👧🏻       😂
ا ,_\\//      _\\| |
ا       ) )<--\\ \\
ا      _|,|   _| |  

ـ @${targetName}

بنت عمك .         انا
ا   👧🏻       😂
ا ,_\\//      _\\| |
ا       ) )<--\\ \\
ا      _|,|   _| |  

ــ @${targetName}

اختك الصغيره         انا
ا   👧🏻       😂
ا ,_\\//      _\\| |
ا       ) )<--\\ \\
ا      _|,|   _| |  

ــ @${targetName}

امك.         انا
ا   👧🏻       😂
ا ,_\\//      _\\| |
ا       ) )<--\\ \\
ا      _|,|   _| |  

...
(
꧁كــســمـڴ وكــســـم ابـوكڪ وكـسـم ـم ايي حـد فـي عـيـلـتـڪ🖤꧂يــا ډيــن̯ـ☤ـ ام͜ي ډة ب͡ـ↫ـق͜ـ♥ـا م͜⃢ج͜ا.ل هہﮩ⃢ب͡ـ↫ـيــډة ڪ͡ـسᷱــم͜ الم͜⃢ج͜ال ع͓ڜᷱــان̯ـ☤ـڪ͡ـ يــخ͜⃢ـو໑ل ،👻😂َِ✌️!َ''))قولتلك مش هتعرفف تسد مع ـايا 😎 @${targetName}

꧁كــســمـڴ وكــســـم ابـوكڪ وكـسـم ـم ايي حـد فـي عـيـلـتـڪ🖤꧂قولتلك مش هتعرفف تسد مع ـايا 😎 @${targetName}

꧁كــســمـڴ وكــســـم ابـوكڪ وكـسـم ـم ايي حـد فـي عـيـلـتـڪ🖤꧂يــا ډيــن̯ـ☤ـ ام͜ي ډة ب͡ـ↫ـق͜ـ♥ـا م͜⃢ج͜ا.ل هہﮩ⃢ب͡ـ↫ـيــډة ڪ͡ـسᷱــم͜ الم͜⃢ج͜ال ع͓ڜᷱــان̯ـ☤ـڪ͡ـ يــخ͜⃢ـو໑ل ،👻😂َِ✌️!َ''))قولتلك مش هتعرفف تسد مع ـايا 😎 @${targetName}

꧁كــســمـڴ وكــســـم ابـوكڪ وكـسـم ـم ايي حـد فـي عـيـلـتـڪ🖤꧂يــا ډيــن̯ـ☤ـ ام͜ي ډة ب͡ـ↫ـق͜ـ♥ـا م͜⃢ج͜ا.ل هہﮩ⃢ب͡ـ↫ـيــډة ڪ͡ـسᷱــم͜ الم͜⃢ج͜ال ع͓ڜᷱــان̯ـ☤ـڪ͡ـ يــخ͜⃢ـو໑ل ،👻😂َِ✌️!َ''))قولتلك مش هتعرفف تسد مع ـايا 😎 @${targetName}

꧁كــســمـڴ وكــســـم ابـوكڪ وكـسـم ـم ايي حـد فـي عـيـلـتـڪ🖤꧂ 🔞[Maro]للتربيه والتعليم🔞🔚 @${targetName}
)
...`;

    await m.reply(textToSend, { mentions: [target] });
}

export { pluginConfig as config, handler };