import axios from "axios";

const pluginConfig = {
    name: 'بدي',
    alias: ['اكل'],
    category: 'search',
    description: 'يجلب وصفات أكل عربية',
    usage: '.بدي <اسم الأكلة>',
    example: '.بدي مندي',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function translate(text) {
    try {
        const tRes = await axios.get("https://translate.googleapis.com/translate_a/single", {
            params: { client: "gtx", sl: "en", tl: "ar", dt: "t", q: text }
        });
        return Array.isArray(tRes.data[0])
            ? tRes.data[0].map(t => t[0]).join("")
            : text;
    } catch {
        return text;
    }
}

async function handler(m, { sock }) {
    try {
        const text = m.text?.trim() || '';
        const query = text.replace(/^(\.بدي|\!بدي)/i, "").trim();

        if (!query) {
            return m.reply("🍽️ اكتب اسم الأكلة بعد الأمر\nمثال: .بدي مندي");
        }

        const res = await axios.get(
            `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
        );
        const meal = res.data.meals ? res.data.meals[0] : null;

        if (!meal) {
            return m.reply(`😔 ما لقيت وصفة لـ "${query}" حاول باسم ثاني.`);
        }

        const name = meal.strMeal || "غير معروف";
        const category = meal.strCategory || "غير محدد";
        const area = meal.strArea || "غير محدد";
        const instructions = meal.strInstructions || "لا توجد طريقة تحضير";
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ing) ingredients.push(`${ing}${measure ? " (" + measure + ")" : ""}`);
        }

        const [nameAr, categoryAr, areaAr, instructionsAr] = await Promise.all([
            translate(name),
            translate(category),
            translate(area),
            translate(instructions)
        ]);

        const ingredientsArArr = [];
        for (const ing of ingredients) {
            ingredientsArArr.push(await translate(ing));
        }

        const image = meal.strMealThumb || null;

        const msg = `
🍲 *${nameAr}*
🏷️ التصنيف: ${categoryAr}
🌍 الأصل: ${areaAr}

🧂 *المكونات:*
${ingredientsArArr.join("\n")}

👨‍🍳 *طريقة التحضير:*
${instructionsAr}
`;

        if (image) {
            await sock.sendMessage(m.chat, { image: { url: image }, caption: msg }, { quoted: m });
        } else {
            await m.reply(msg);
        }

    } catch (err) {
        console.error("❌ خطأ في أمر الطبخ:", err);
        await m.reply("⚠️ صار خطأ أثناء جلب أو ترجمة الوصفة.");
    }
}

export { pluginConfig as config, handler };