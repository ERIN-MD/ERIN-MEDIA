import { getDatabase } from "../../src/lib/maro-database.js";
import { addExpWithLevelCheck } from "../../src/lib/maro-level.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
    name: "نينجا",
    alias: ["kyubigame"],
    category: "game",
    description: "استكشف عالم النينجا وواجه أقوى الأعداء",
    usage: ".نينجا",
    example: ".نينجا",
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true,
};

const LOCATIONS = [
    {
        id: 1,
        name: "🍃 قرية كونوها",
        levelReq: 1,
        monsters: [
            "جينين مبتدئ",
            "قطاع طرق",
            "كلب الغابة",
            "نينجا متسلل",
        ],
        minReward: 100,
        maxReward: 300,
        dropChance: 40,
    },
    {
        id: 2,
        name: "🌳 غابة الموت",
        levelReq: 5,
        monsters: [
            "نينجا أوتوغاكوري",
            "نمر عملاق",
            "حية سامة",
            "أفعى أوروتشيمارو",
        ],
        minReward: 250,
        maxReward: 500,
        dropChance: 45,
    },
    {
        id: 3,
        name: "☁️ سهل البرق",
        levelReq: 10,
        monsters: [
            "نينجا كومو",
            "ساموراي حديدي",
            "بومة البرق",
            "ذئب كهربائي",
        ],
        minReward: 400,
        maxReward: 800,
        dropChance: 50,
    },
    {
        id: 4,
        name: "🦇 كهف أكاتسكي",
        levelReq: 15,
        monsters: [
            "زيتسو الأبيض",
            "خفاش سام",
            "دمية ساسوري",
            "نينجا هارب",
        ],
        minReward: 600,
        maxReward: 1200,
        dropChance: 55,
    },
    {
        id: 5,
        name: "🌊 وادي النهاية",
        levelReq: 25,
        monsters: [
            "نينجا قاتل",
            "ميزوكاجي مزيف",
            "أوتشيها شبح",
            "تمثال غولم",
        ],
        minReward: 900,
        maxReward: 1700,
        dropChance: 60,
    },
    {
        id: 6,
        name: "💥 ساحة حرب النينجا",
        levelReq: 35,
        monsters: [
            "زيتسو عملاق",
            "إيدو تينسي كاجي",
            "نينجا ميت",
            "جيش مستنسخ",
        ],
        minReward: 1300,
        maxReward: 2400,
        dropChance: 65,
    },
    {
        id: 7,
        name: "🦊 قفص كوراما",
        levelReq: 50,
        monsters: [
            "تشاكرا الذيول التسعة",
            "كيوبي متوحش",
            "كوراما الظلام",
            "روح البيجو",
        ],
        minReward: 2500,
        maxReward: 4500,
        dropChance: 75,
    }
];

const LOOT_TABLE = [
    { item: "kunai", chance: 40, qty: [2, 5], icon: "🗡️" },
    { item: "shuriken", chance: 35, qty: [3, 6], icon: "⚔️" },
    { item: "chakra", chance: 30, qty: [1, 3], icon: "🌀" },
    { item: "scroll", chance: 15, qty: [1, 2], icon: "📜" },
    { item: "bowlramen", chance: 20, qty: [1, 2], icon: "🍜" },
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

        const session = user.rpg.kyubigame_session || null;
        const userLevel = user.level || 1;

        if (session) {
            const SESSION_TIMEOUT = 5 * 60 * 1000;
            if (Date.now() - session.time > SESSION_TIMEOUT) {
                delete user.rpg.kyubigame_session;
                db.save();
            } else {
                return m.reply(
                    `⚔️ *مهمة النينجا ما زالت نشطة*\n\n` +
                    `أنت ما زلت في ساحة المعركة!\n` +
                    `> رد على آخر رسالة للبوت بـ (\`هجوم\` / \`هروب\`) أو ألغِ المهمة (اكتب \`إلغاء\`).`,
                );
            }
        }

        const available = LOCATIONS.filter((d) => userLevel >= d.levelReq);
        if (available.length === 0) {
            return m.reply(
                `❌ *المستوى منخفض جداً*\n\n> مستواك الحالي هو *${userLevel}*. تحتاج المستوى *1* على الأقل لبدء مغامرة النينجا.`,
            );
        }

        user.rpg.kyubigame_session = {
            stage: "لوبي",
            time: Date.now(),
        };
        db.save();

        let txt = `⛩️ *لوبي النينجا*\n\n`;
        txt += `📊 *إحصائيات النينجا:*\n`;
        txt += `> المستوى: *${userLevel}*\n`;
        txt += `> الطاقة: *${user.rpg.stamina ?? 100}/100*\n\n`;
        txt += `اختر موقع المهمة الذي تريد استكشافه:\n\n`;

        for (const d of LOCATIONS) {
            if (userLevel >= d.levelReq) {
                txt += `🔓 *${d.id}.* ${d.name} (م ${d.levelReq}+)\n`;
            } else {
                txt += `> 🔒 *${d.id}.* ${d.name} (تحتاج م ${d.levelReq})\n`;
            }
        }
        txt += `\n> 💡 رد على هذه الرسالة بـ *رقم* موقع المهمة (مثال: \`1\`) أو اكتب \`إلغاء\` للخروج.`;

        return m.reply(txt);
    } catch (error) {
        console.error(error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

async function kyubigameAnswerHandler(m, sock) {
    if (!m.body || m.isCommand) return false;

    const db = getDatabase();
    const user = db.getUser(m.sender);

    if (!user || !user.rpg || !user.rpg.kyubigame_session) return false;

    const session = user.rpg.kyubigame_session;
    const SESSION_TIMEOUT = 5 * 60 * 1000;
    if (Date.now() - session.time > SESSION_TIMEOUT) {
        delete user.rpg.kyubigame_session;
        db.save();
        await m.reply(
            `⏰ *انتهت المهمة*\n\n> انتهت مهمة النينجا بسبب عدم النشاط لمدة 5 دقائق.`,
        );
        return true;
    }

    const text = m.body.trim().toLowerCase();
    const userLevel = user.level || 1;

    if (text === "الغاء" || text === "cancel" || text === "خروج") {
        delete user.rpg.kyubigame_session;
        db.save();
        await m.reply(`🚪 لقد ألغيت المهمة وعدت إلى القرية بسلام.`);
        return true;
    }

    if (session.stage === "لوبي") {
        const choiceId = parseInt(text);
        if (isNaN(choiceId)) return false;

        const location = LOCATIONS.find((d) => d.id === choiceId);

        if (!location) {
            await m.reply(
                `❌ *مهمة غير صالحة*\n\n> الموقع رقم ${choiceId} غير موجود على خريطة النينجا.`,
            );
            return true;
        }

        if (userLevel < location.levelReq) {
            await m.reply(
                `🔒 *مهمة مقفلة*\n\n> مستواك (*م ${userLevel}*) غير كافٍ لدخول *${location.name}*.\n> تحتاج المستوى *${location.levelReq}* على الأقل.`,
            );
            return true;
        }

        const staminaCost = 30;
        user.rpg.stamina = user.rpg.stamina ?? 100;

        if (user.rpg.stamina < staminaCost) {
            await m.reply(
                `⚡ *التشاكرا/الطاقة غير كافية*\n\n` +
                `تحتاج *${staminaCost} طاقة* على الأقل للدخول.\n` +
                `طاقتك المتبقية الآن *${user.rpg.stamina}* فقط.\n\n` +
                `> 💡 *نصيحة:* استخدم أمر \`.استراحة\` أو ألغِ أولاً (اكتب \`إلغاء\`).`,
            );
            return true;
        }

        user.rpg.stamina -= staminaCost;
        const monster =
            location.monsters[Math.floor(Math.random() * location.monsters.length)];
        const monsterPower = location.levelReq * 10 + Math.floor(Math.random() * 30);

        user.rpg.kyubigame_session = {
            stage: "مواجهة",
            locationId: location.id,
            locationName: location.name,
            levelReq: location.levelReq,
            monster: monster,
            monsterPower: monsterPower,
            maxReward: location.maxReward,
            minReward: location.minReward,
            dropChance: location.dropChance,
            time: Date.now(),
        };

        db.save();

        await m.react("⛩️");
        let txt = `⛩️ *دخول منطقة المهمة*\n\n`;
        txt += `تقفز بخفة عبر *${location.name}*...\n`;
        txt += `> ⚡ انخفضت طاقتك بمقدار *${staminaCost}*\n\n`;
        txt += `فجأة، يظهر *👹 ${monster}* من الظلام ويعترض طريقك!\n\n`;
        txt += `*⚔️ ماذا تريد أن تفعل؟*\n`;
        txt += `> رد على هذه الرسالة بـ \`هجوم\` للقتال\n`;
        txt += `> رد على هذه الرسالة بـ \`هروب\` للتراجع (قد تفشل)`;

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
                const ryoReward =
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

                user.koin = (user.koin || 0) + ryoReward;
                await addExpWithLevelCheck(sock, m, db, user, expReward);

                reportText += `🎉 *نجحت المهمة!*\n\n`;
                reportText += `بجوتسو قاتلة، نجحت في هزيمة *${session.monster}*!\n\n`;
                reportText += `*🎁 مكافآت المهمة:*\n`;
                reportText += `> ✨ خبرة: *+${Math.floor(expReward)}*\n`;
                reportText += `> 💰 رايو (عملات): *+${ryoReward.toLocaleString()}*\n`;

                if (droppedItems.length > 0) {
                    reportText += `\n*📦 غنائم النينجا:*\n`;
                    reportText += `> ${droppedItems.join("\n> ")}\n`;
                }

                await m.react("🏆");
            } else {
                const ryoLoss = Math.floor((user.koin || 0) * 0.15);
                user.koin = Math.max(0, (user.koin || 0) - ryoLoss);
                user.rpg.health = Math.max(1, (user.rpg.health || 100) - 40);

                reportText += `💀 *فشلت المهمة!*\n\n`;
                reportText += `قوتك لم تكن كافية! *${session.monster}* صدمك بقوة.\n`;
                reportText += `نجحت في استخدام جوتسو الاستبدال وزحفت خارجاً بجسد مليء بالجروح.\n\n`;
                reportText += `*💔 الخسائر:*\n`;
                reportText += `> 💸 رايو مفقود: *-${ryoLoss.toLocaleString()}*\n`;
                reportText += `> ❤️ دم منخفض: *-40 HP*\n\n`;
                reportText += `> 💡 *نصيحة:* ارفع مستواك، كل رامين، أو قوِّ جوتسوك!`;

                await m.react("💀");
            }

            delete user.rpg.kyubigame_session;
            db.save();
            await m.reply(reportText);
            return true;
        } else if (text === "هروب" || text === "فرار" || text === "run") {
            const escapeChance = Math.random() > 0.5;
            let reportText = "";

            if (escapeChance) {
                reportText += `🏃‍♂️ *هربت بنجاح!*\n\n`;
                reportText += `ألقيت قنبلة دخان وركضت بأقصى سرعة. *${session.monster}* فقد أثرك!\n`;
                reportText += `نجوت بدون إصابات، لكن المغامرة ذهبت سدى.`;
                await m.react("💨");
            } else {
                const hpLoss = 25;
                user.rpg.health = Math.max(1, (user.rpg.health || 100) - hpLoss);
                reportText += `💥 *فشل الهروب!*\n\n`;
                reportText += `تعثرت قدماك بفخ نينجا! *${session.monster}* طاردك وضربك بقوة!\n\n`;
                reportText += `*💔 الخسائر:*\n`;
                reportText += `> ❤️ دم منخفض: *-${hpLoss} HP*`;
                await m.react("🩸");
            }

            delete user.rpg.kyubigame_session;
            db.save();
            await m.reply(reportText);
            return true;
        } else {
            await m.reply(
                `❓ *أمر غير معروف*\n\n` +
                `> رد بـ \`هجوم\` لمقاتلة العدو.\n` +
                `> رد بـ \`هروب\` للفرار.\n` +
                `> رد بـ \`إلغاء\` لإلغاء المهمة.`,
            );
            return true;
        }
    }

    return false;
}

export { pluginConfig as config, handler, kyubigameAnswerHandler };