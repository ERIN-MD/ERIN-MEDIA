// حفظ جهات الاتصال - أمر لحفظ جهات الاتصال من المجموعة كملف VCF

const pluginConfig = {
    name: "حفظ_جهات_الاتصال",
    alias: ["savekontak"],
    category: "owner",
    description: "حفظ جهات الاتصال من المجموعة كملف VCF",
    usage: ".حفظ_جهات_الاتصال <الاسم>",
    example: ".حفظ_جهات_الاتصال فلان",
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { sock, args }) {
    if (args[0] === "get" || args[0] === "جلب") {
        const target = args[1];
        const baseName = args.slice(2).join(" ") || "مستخدم";

        const chats = await sock.groupFetchAllParticipating();
        let groups = [];
        if (target === "all" || target === "الكل") {
            groups = Object.values(chats);
        } else {
            if (chats[target]) {
                groups.push(chats[target]);
            } else {
                return m.reply("❌ المجموعة غير موجودة.");
            }
        }

        if (groups.length === 0) {
            return m.reply("❌ البوت ليس في أي مجموعة.");
        }

        m.reply(`⏳ جاري استخراج جهات الاتصال من ${groups.length} مجموعة...`);

        let vcards = "";
        let count = 0;
        let index = 1;
        const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const contactArray = [];

        for (const group of groups) {
            for (const participant of group.participants) {
                if (participant.id === botId) continue;

                const number = participant.id.split("@")[0];
                const name = `${baseName} ${index}`;
                const singleVcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${number}:+${number}\nEND:VCARD`;

                vcards += singleVcard + "\n";
                contactArray.push({ vcard: singleVcard });
                count++;
                index++;
            }
        }

        if (count === 0) {
            return m.reply("❌ لا توجد جهات اتصال لاستخراجها.");
        }

        await sock.sendMessage(m.chat, {
            document: Buffer.from(vcards, "utf8"),
            fileName: `${baseName}_${count}_جهات_الاتصال.vcf`,
            mimetype: "text/vcard",
            caption: `✅ *تم استخراج ${count} جهة اتصال كملف VCF.*`
        }, { quoted: m });

        await sock.sendMessage(m.chat, {
            contacts: {
                displayName: `${count} جهة اتصال`,
                contacts: contactArray
            }
        }, { quoted: m });

        return;
    }

    const baseName = args.join(" ") || "مستخدم";
    const chats = await sock.groupFetchAllParticipating();
    const groupList = Object.values(chats);

    if (groupList.length === 0) {
        return m.reply("❌ البوت ليس في أي مجموعة.");
    }

    const sections = [
        {
            title: "قائمة المجموعات",
            rows: groupList.map(g => ({
                header: "",
                title: g.subject,
                description: `الأعضاء: ${g.participants?.length || 0}`,
                id: `${m.prefix}حفظ_جهات_الاتصال جلب ${g.id} ${baseName}`
            }))
        }
    ];

    await sock.sendMessage(m.chat, {
        text: `📇 *نظام حفظ جهات الاتصال (VCF)*\n\n` +
            `نظام استخراج تلقائي لجهات الاتصال من المجموعات التي يتبعها البوت.\n` +
            `الاسم الأساسي: *${baseName}*\n\n` +
            `*طريقة الاستخدام:*\n` +
            `• *${m.prefix || "."}حفظ_جهات_الاتصال <الاسم>* — حفظ باسم مخصص\n` +
            `• *${m.prefix || "."}حفظ_جهات_الاتصال* — حفظ بالاسم الافتراضي "مستخدم"\n\n` +
            `*شرح طريقة الاستخدام:*\n` +
            `1. اختر مجموعة محددة من زر *اختيار مجموعة* أدناه، أو اضغط *جميع المجموعات* لاستخراج جهات الاتصال بشكل عام.\n` +
            `2. سيقوم البوت بجمع أرقام المشاركين وتجاهل رقم البوت نفسه.\n` +
            `3. سيتم إرسال النتيجة كملف (*.vcf*) بالإضافة إلى قائمة جهات اتصال واتساب لحفظها مباشرة.`,
        footer: "Powered by ReviewBot",
        interactiveButtons: [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "اختيار مجموعة",
                    sections
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "جميع المجموعات",
                    id: `${m.prefix}حفظ_جهات_الاتصال جلب الكل ${baseName}`
                })
            }
        ]
    }, { quoted: m });
}

export { pluginConfig as config, handler };