import { getDatabase } from "../../src/lib/maro-database.js";

const pluginConfig = {
    name: "notiflimit",
    alias: ["notifenergi"],
    category: "owner",
    description: "تفعيل أو إلغاء إشعارات قطع الطاقة عالمياً",
    usage: ".notiflimit",
    example: ".notiflimit",
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { sock }) {
    const db = getDatabase();

    const currentStatus = db.setting("notiflimit") ?? false;
    db.setting("notiflimit", !currentStatus);

    const newStatus = db.setting("notiflimit") ? "مفعل ✅" : "معطل ❌";

    await m.reply(`*إشعارات الطاقة (عام)*\n\nالحالة الحالية: *${newStatus}*\n\n> عند التفعيل، سيقوم البوت بإعلام جميع المستخدمين بكمية الطاقة المتبقية لديهم في كل مرة يتم فيها استخدام إحدى ميزات البوت.`);
}

export { pluginConfig as config, handler };