import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
    name: "دنجن",
    alias: ["dungeon"],
    category: "game",
    description: "استكشف الدنجن وقاتل الوحوش بشكل تفاعلي",
    usage: ".دنجن",
    example: ".دنجن",
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true,
};

const DUNGEONS = [
    {
        id: 1,
        name: "🌲 الغابة المظلمة",
        levelReq: 1,
        monsters: [
            "عفريت بري",
            "سلايم عملاق",
            "ذئب الليل",
            "قطاع طرق الغابة",
        ],
        minReward: 100,
        maxReward: 300,
        dropChance: 40,
    },
    {
        id: 2,
        name: "🍄 المستنقع السام",
        levelReq: 5,
        monsters: [
            "ضفدع متحول",
            "شجرة متحركة",
            "عنكبوت سام",
            "أفعى المستنقع",
        ],
        minReward: 250,
        maxReward: 500,
        dropChance: 45,
    },
    {
        id: 3,
        name: "🏰 القلعة القديمة",
        levelReq: 10,
        monsters: [
            "جندي هيكلي",
            "زومبي جائع",
            "شبح فضولي",
            "غارغول حجري",
        ],
        minReward: 400,
        maxReward: 800,
        dropChance: 50,
    },
    {
        id: 4,
        name: "🏜️ صحراء الموت",
        levelReq: 15,
        monsters: [
            "عقرب عملاق",
            "مومياء مستيقظة",
            "دودة الصحراء",
            "جني شرير",
        ],
        minReward: 600,
        maxReward: 1200,
        dropChance: 55,
    },
    {
        id: 5,
        name: "🌋 جبل النار",
        levelReq: 20,
        monsters: ["عنصر ناري", "غول حممي", "تنين صغير", "كلب جهنمي"],
        minReward: 900,
        maxReward: 1700,
        dropChance: 60,
    },
    {
        id: 6,
        name: "🧊 كهف الجليد الأبدي",
        levelReq: 25,
        monsters: ["غول جليدي", "عملاق الصقيع", "يتي شرس", "ذئب الثلج"],
        minReward: 1300,
        maxReward: 2400,
        dropChance: 65,
    },
    {
        id: 7,
        name: "☁️ أطلال السماء",
        levelReq: 30,
        monsters: ["هاربي البرق", "غريفين بري", "فالكيري ساقطة", "غول الرياح"],
        minReward: 1800,
        maxReward: 3300,
        dropChance: 70,
    },
    {
        id: 8,
        name: "🌊 بحر الظلال",
        levelReq: 35,
        monsters: ["كراكن صغير", "سيرين فاتنة", "قرش شبح", "لفياثان أحمر"],
        minReward: 2500,
        maxReward: 4500,
        dropChance: 75,
    },
    {
        id: 9,
        name: "🕳️ هاوية العدم",
        levelReq: 40,
        monsters: ["ملاك الموت", "مسافر الفراغ", "شيطان الظل", "بيهيموث"],
        minReward: 3500,
        maxReward: 6000,
        dropChance: 80,
    },
    {
        id: 10,
        name: "👹 الجحيم العميق",
        levelReq: 50,
        monsters: ["شيطان أحمر", "ساكيوبوس قاتل", "سيربيروس", "ملك الشياطين"],
        minReward: 5000,
        maxReward: 10000,
        dropChance: 90,
    },
];

const LOOT_TABLE = [
    { item: "iron", chance: 40, qty: [1, 5], icon: "⛏️" },
    { item: "gold", chance: 20, qty: [1, 3], icon: "🪙" },
    { item: "diamond", chance: 5, qty: [1, 2], icon: "💎" },
    { item: "potion", chance: 30, qty: [1, 3], icon: "🧪" },
    { item: "herb", chance: 25, qty: [2, 6], icon: "🌿" },
    { item: "leather", chance: 35, qty: [2, 5], icon: "👞" },
    { item: "mysterybox", chance: 3, qty: [1, 1], icon: "📦" },
];

async function handler(m, { sock }) {
    try {
        const db = getDatabase();
        const user = db.getUser(m.sender);

        if (!user.rpg) user.rpg = {};
        if (!user.rpg.attack) user.rpg.attack = 10;
        if (!user.rpg.health) user.rpg.health = 100;
        if (!user.rpg.maxHealth) user.rpg.maxHealth = 100;
        if (!user.rpg.stamina) user.rpg.stamina = 100;
        if (!user.rpg.maxStamina) user.rpg.maxStamina = 100;
        if (!user.inventory) user.inventory = {};

        const session = user.rpg.dungeon_session || null;
        const userLevel = user.level || 1;

        if (session) {
            const SESSION_TIMEOUT = 5 * 60 * 1000;
            if (Date.now() - session.time > SESSION_TIMEOUT) {
                delete user.rpg.dungeon_session;
                db.save();
            } else {
                return m.reply(
                    `⚔️ *جلسة دنجن ما زالت نشطة*\n\n` +
                    `أنت في منتصف الاستكشاف!\n` +
                    `> رد على آخر رسالة للبوت للإلغاء (اكتب \`إلغاء\`) أو تابع (اكتب \`هجوم\` / \`هروب\`).`,
                );
            }
        }

        const available = DUNGEONS.filter((d) => userLevel >= d.levelReq);
        if (available.length === 0) {
            return m.reply(
                `❌ *المستوى منخفض جداً*\n\n> مستواك الحالي هو *${userLevel}*. تحتاج المستوى *1* على الأقل لدخول أول دنجن.`,
            );
        }

        user.rpg.dungeon_session = {
            stage: "لوبي",
            time: Date.now(),
        };
        db.save();

        let txt = `🏰 *لوبي الدنجن*\n\n`;
        txt += `📊 *إحصائياتك:*\n`;
        txt += `> المستوى: *${userLevel}*\n`;
        txt += `> الطاقة: *${user.rpg.stamina ?? 100}/100*\n\n`;
        txt += `اختر الموقع الذي تريد استكشافه:\n\n`;

        for (const d of DUNGEONS) {
            if (userLevel >= d.levelReq) {
                txt += `🔓 *${d.id}.* ${d.name} (م ${d.levelReq}+)\n`;
            } else {
                txt += `> 🔒 *${d.id}.* ${d.name} (تحتاج م ${d.levelReq})\n`;
            }
        }
        txt += `\n> 💡 رد على هذه الرسالة بـ *رقم* الموقع المفتوح 🔓 (مثال: \`1\`) أو اكتب \`إلغاء\` للخروج.`;

        return m.reply(txt);
    } catch (error) {
        console.error(error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

async function dungeonAnswerHandler(m, sock) {
    if (!m.body || m.isCommand) return false;

    const db = getDatabase();
    const user = db.getUser(m.sender);

    if (!user || !user.rpg || !user.rpg.dungeon_session) return false;

    const session = user.rpg.dungeon_session;
    const SESSION_TIMEOUT = 5 * 60 * 1000;
    if (Date.now() - session.time > SESSION_TIMEOUT) {
        delete user.rpg.dungeon_session;
        db.save();
        await m.reply(
            `⏰ *انتهت جلسة الدنجن*\n\n> انتهت جلستك بسبب عدم النشاط لمدة 5 دقائق.`,
        );
        return true;
    }

    const text = m.body.trim().toLowerCase();
    const userLevel = user.level || 1;

    if (text === "الغاء" || text === "cancel" || text === "خروج") {
        delete user.rpg.dungeon_session;
        db.save();
        await m.reply(`🚪 لقد خرجت من لوبي الدنجن بسلام.`);
        return true;
    }

    if (session.stage === "لوبي") {
        const choiceId = parseInt(text);
        if (isNaN(choiceId)) return false;

        const dungeon = DUNGEONS.find((d) => d.id === choiceId);

        if (!dungeon) {
            await m.reply(
                `❌ *اختيار غير صالح*\n\n> الدنجن رقم ${choiceId} غير موجود.`,
            );
            return true;
        }

        if (userLevel < dungeon.levelReq) {
            await m.reply(
                `🔒 *دنجن مقفل*\n\n> مستواك (*م ${userLevel}*) غير كافٍ لدخول *${dungeon.name}*.\n> تحتاج المستوى *${dungeon.levelReq}* على الأقل.`,
            );
            return true;
        }

        const staminaCost = 30;
        user.rpg.stamina = user.rpg.stamina ?? 100;

        if (user.rpg.stamina < staminaCost) {
            await m.reply(
                `⚡ *الطاقة غير كافية*\n\n` +
                `تحتاج *${staminaCost} طاقة* على الأقل للدخول.\n` +
                `طاقتك المتبقية الآن *${user.rpg.stamina}* فقط.\n\n` +
                `> 💡 *نصيحة:* استخدم أمر \`.استراحة\` أو ألغِ أولاً (اكتب \`إلغاء\`).`,
            );
            return true;
        }

        user.rpg.stamina -= staminaCost;
        const monster =
            dungeon.monsters[Math.floor(Math.random() * dungeon.monsters.length)];
        const monsterPower = dungeon.levelReq * 10 + Math.floor(Math.random() * 30);

        user.rpg.dungeon_session = {
            stage: "مواجهة",
            dungeonId: dungeon.id,
            dungeonName: dungeon.name,
            levelReq: dungeon.levelReq,
            monster: monster,
            monsterPower: monsterPower,
            maxReward: dungeon.maxReward,
            minReward: dungeon.minReward,
            dropChance: dungeon.dropChance,
            time: Date.now(),
        };

        db.save();

        await m.react("🚪");
        let txt = `🚪 *دخول الدنجن*\n\n`;
        txt += `تتقدم ببطء نحو *${dungeon.name}*...\n`;
        txt += `> ⚡ انخفضت طاقتك بمقدار *${staminaCost}*\n\n`;
        txt += `فجأة، يظهر *👹 ${monster}* من الظلام ويعترض طريقك!\n\n`;
        txt += `*⚔️ ماذا تريد أن تفعل؟*\n`;
        txt += `> رد على هذه الرسالة بـ \`هجوم\` للقتال\n`;
        txt += `> رد على هذه الرسالة بـ \`هروب\` للفرار (قد تفشل)`;

        await m.reply(txt);
        return true;
    }

    if (session.stage === "مواجهة") {
        if (text === "هجوم" || text === "attack" || text === "قتال") {
            const userPower =
                (user.rpg.attack || 10) +
                userLevel * 4 +
                Math.floor(Math.random() * 20);
            const isWin = userPower >= session.monsterPower || Math.random() > 0.4;

            let reportText = "";

            if (isWin) {
                const expReward =
                    150 * (session.levelReq / 2) + Math.floor(Math.random() * 200);
                const goldReward =
                    Math.floor(Math.random() * (session.maxReward - session.minReward)) +
                    session.minReward;

                const droppedItems = [];
                for (const loot of LOOT_TABLE) {
                    if (Math.random() * 100 < loot.chance * (session.dropChance / 50)) {
                        const qty =
                            Math.floor(Math.random() * (loot.qty[1] - loot.qty[0] + 1)) +
                            loot.qty[0];
                        user.inventory[loot.item] = (user.inventory[loot.item] || 0) + qty;
                        droppedItems.push(`${loot.icon} ${loot.item} (x${qty})`);
                    }
                }

                user.koin = (user.koin || 0) + goldReward;
                await addExpWithLevelCheck(sock, m, db, user, expReward);

                reportText += `🎉 *نصر مؤزر!*\n\n`;
                reportText += `بهجوم قاتل، نجحت في القضاء على *${session.monster}*!\n\n`;
                reportText += `*🎁 المكافآت:*\n`;
                reportText += `> ✨ خبرة: *+${Math.floor(expReward)}*\n`;
                reportText += `> 💰 عملات: *+${goldReward.toLocaleString()}*\n`;

                if (droppedItems.length > 0) {
                    reportText += `\n*📦 الغنائم:*\n`;
                    reportText += `> ${droppedItems.join("\n> ")}\n`;
                }

                await m.react("🏆");
            } else {
                const goldLoss = Math.floor((user.koin || 0) * 0.15);
                user.koin = Math.max(0, (user.koin || 0) - goldLoss);
                user.rpg.health = Math.max(1, (user.rpg.health || 100) - 40);

                reportText += `💀 *هزيمة مأساوية!*\n\n`;
                reportText += `قوتك لم تكن كافية! *${session.monster}* صدمك بقوة.\n`;
                reportText += `نجحت في الزحف خارجاً بجسد مليء بالجروح.\n\n`;
                reportText += `*💔 الخسائر:*\n`;
                reportText += `> 💸 عملات مفقودة: *-${goldLoss.toLocaleString()}*\n`;
                reportText += `> ❤️ دم منخفض: *-40 HP*\n\n`;
                reportText += `> 💡 *نصيحة:* ارفع مستواك، اشرب جرعة، أو قوِّ سلاحك!`;

                await m.react("💀");
            }

            delete user.rpg.dungeon_session;
            db.save();
            await m.reply(reportText);
            return true;
        } else if (text === "هروب" || text === "فرار" || text === "run") {
            const escapeChance = Math.random() > 0.5;
            let reportText = "";

            if (escapeChance) {
                reportText += `🏃‍♂️ *هربت بنجاح!*\n\n`;
                reportText += `استدرت وركضت بأقصى سرعة. *${session.monster}* فقد أثرك!\n`;
                reportText += `نجوت بدون إصابات، لكن المغامرة ذهبت سدى.`;
                await m.react("💨");
            } else {
                const hpLoss = 25;
                user.rpg.health = Math.max(1, (user.rpg.health || 100) - hpLoss);
                reportText += `💥 *فشل الهروب!*\n\n`;
                reportText += `تعثرت قدماك بالصخور! *${session.monster}* طاردك وضربك بمخلبه!\n\n`;
                reportText += `*💔 الخسائر:*\n`;
                reportText += `> ❤️ دم منخفض: *-${hpLoss} HP*`;
                await m.react("🩸");
            }

            delete user.rpg.dungeon_session;
            db.save();
            await m.reply(reportText);
            return true;
        } else {
            await m.reply(
                `❓ *خيار غير معروف*\n\n` +
                `> رد بـ \`هجوم\` لمقاتلة الوحش.\n` +
                `> رد بـ \`هروب\` للفرار.\n` +
                `> رد بـ \`إلغاء\` للاستسلام.`,
            );
            return true;
        }
    }

    return false;
}

export { pluginConfig as config, handler, dungeonAnswerHandler };