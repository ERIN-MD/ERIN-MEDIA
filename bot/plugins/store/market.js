import { getDatabase } from '../../src/lib/maro-database.js';

const pluginConfig = {
    name: 'سوق',
    alias: ['market', 'p2p'],
    category: 'store',
    description: 'سوق اللاعبين لبيع وشراء الأدوات',
    usage: '.سوق <عرض/شراء/قائمة>',
    isEnabled: true
};

async function handler(m, { text, args, sock }) {
    const db = getDatabase();
    const user = db.getUser(m.sender);
    const market = db.setting('market') || [];

    if (!args[0] || args[0] === 'قائمة') {
        if (market.length === 0) return m.reply('🛒 السوق فارغ حالياً.');
        let txt = '🛒 *سوق اللاعبين Tarboo Bot*\n\n';
        market.forEach((item, i) => {
            txt += `*${i + 1}.* ${item.item} (x${item.qty})\n`;
            txt += `> 💰 السعر: ${item.price} كوين\n`;
            txt += `> 👤 البائع: @${item.seller.split('@')[0]}\n`;
            txt += `> 🆔 الكود: \`${item.id}\`\n\n`;
        });
        txt += `> اكتب \`${m.prefix}سوق شراء <الكود>\` للشراء.`;
        return m.reply(txt, { mentions: market.map((i) => i.seller) });
    }

    if (args[0] === 'عرض') {
        const itemName = args[1];
        const qty = parseInt(args[2]);
        const price = parseInt(args[3]);

        if (!itemName || isNaN(qty) || isNaN(price)) {
            return m.reply(`⚠️ الاستخدام: ${m.prefix}سوق عرض <الأداة> <الكمية> <السعر>`);
        }

        if ((user.inventory[itemName] || 0) < qty) {
            return m.reply(`❌ ليس لديك كمية كافية من ${itemName}.`);
        }

        const listing = {
            id: Math.random().toString(36).substring(2, 8).toUpperCase(),
            seller: m.sender,
            item: itemName,
            qty: qty,
            price: price,
            time: Date.now()
        };

        user.inventory[itemName] -= qty;
        market.push(listing);
        db.setting('market', market);
        db.save();

        return m.reply(`✅ تم عرض ${qty} من ${itemName} في السوق بسعر ${price} كوين.\n🆔 كود السلعة: \`${listing.id}\``);
    }

    if (args[0] === 'شراء') {
        const id = args[1]?.toUpperCase();
        if (!id) return m.reply('⚠️ يرجى إدخال كود السلعة.');

        const index = market.findIndex(i => i.id === id);
        if (index === -1) return m.reply('❌ السلعة غير موجودة أو تم شراؤها.');

        const listing = market[index];
        if (listing.seller === m.sender) return m.reply('❌ لا يمكنك شراء سلعتك الخاصة.');

        if ((user.koin || 0) < listing.price) {
            return m.reply(`❌ ليس لديك كوينز كافية. تحتاج ${listing.price} كوين.`);
        }

        // إتمام العملية
        user.koin -= listing.price;
        user.inventory[listing.item] = (user.inventory[listing.item] || 0) + listing.qty;

        const seller = db.getUser(listing.seller);
        seller.koin = (seller.koin || 0) + listing.price;

        market.splice(index, 1);
        db.setting('market', market);
        db.save();

        m.reply(`✅ تم شراء ${listing.qty} من ${listing.item} بنجاح!`);
        return sock.sendMessage(listing.seller, { text: `💰 تم بيع ${listing.qty} من ${listing.item} في السوق! حصلت على ${listing.price} كوين.` });
    }
}

export { pluginConfig as config, handler };
