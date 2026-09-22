import axios from "axios";
import config from "../../config.js";
import { getDatabase } from "../../src/lib/maro-database.js";

const API_BASE = "https://api.jerexd.my.id/api/ai/fixcode";
const API_KEY = process.env.FIXCODE_API_KEY || "";

const MODELS = [
    // OpenAI GPT
    { name: "GPT 5.5", value: "openai/gpt-5.5" },
    { name: "GPT 5.4", value: "openai/gpt-5.4" },
    { name: "GPT 5.3 Chat", value: "openai/gpt-5.3-chat" },
    { name: "GPT 5.1 Instant", value: "openai/gpt-5.1-instant" },
    { name: "GPT 5", value: "openai/gpt-5" },
    { name: "GPT 4o", value: "openai/gpt-4o" },
    { name: "GPT 4o Mini", value: "openai/gpt-4o-mini" },
    
    // Anthropic Claude
    { name: "Claude Haiku 4.5", value: "anthropic/claude-haiku-4.5" },
    { name: "Claude Sonnet 4.6", value: "anthropic/claude-sonnet-4.6" },
    { name: "Claude Opus 4.5", value: "anthropic/claude-opus-4.5" },
    { name: "Claude Opus 4.6", value: "anthropic/claude-opus-4.6" },
    { name: "Claude Opus 4.7", value: "anthropic/claude-opus-4.7" },
    { name: "Claude Opus 4.8", value: "anthropic/claude-opus-4.8" },
    
    // DeepSeek
    { name: "DeepSeek V4 Pro", value: "deepseek/deepseek-v4-pro" },
    { name: "DeepSeek V4 Flash", value: "deepseek/deepseek-v4-flash" },
    { name: "DeepSeek V3.2 Thinking", value: "deepseek/deepseek-v3.2-thinking" },
    
    // Google Gemini
    { name: "Gemini 3.1 Pro Preview", value: "google/gemini-3.1-pro-preview" },
    { name: "Gemini 3 Pro Preview", value: "google/gemini-3-pro-preview" },
    { name: "Gemini 3.1 Flash Lite", value: "google/gemini-3.1-flash-lite" },
    
    // xAI Grok
    { name: "Grok 4.1 Fast", value: "xai/grok-4.1-fast-non-reasoning" },
    
    // Meta Llama
    { name: "Llama 4 Maverick", value: "meta/llama-4-maverick" },
    
    // Alibaba Qwen
    { name: "Qwen 3 Max", value: "alibaba/qwen3-max" },
    
    // MoonshotAI Kimi
    { name: "Kimi K2.6", value: "moonshotai/kimi-k2.6" },
    
    // GLM
    { name: "GLM 5.2", value: "gateway-glm-5-2" },
    
    // GPT Nano/Mini
    { name: "GPT 5 Nano", value: "gpt-5-nano" },
    { name: "GPT 4o Mini", value: "gpt-4o-mini" },
    { name: "GPT 4.1 Nano", value: "gpt-4.1-nano" },
    { name: "GPT 4.1 Mini", value: "gpt-4.1-mini" },
    
    // Gateway GPT
    { name: "GW GPT 5", value: "gateway-gpt-5" },
    { name: "GW GPT 5.1", value: "gateway-gpt-5-1" },
    { name: "GW GPT 5.3", value: "gateway-gpt-5-3" },
    { name: "GW GPT 5.4", value: "gateway-gpt-5-4" },
    { name: "GW GPT 5.5", value: "gateway-gpt-5-5" },
    { name: "GW GPT 5.6 Sol", value: "gateway-gpt-5-6-sol" },
    { name: "GW GPT 5.6 Terra", value: "gateway-gpt-5-6-terra" },
    { name: "GW GPT 5.6 Luna", value: "gateway-gpt-5-6-luna" },
    { name: "GW GPT 5 Mini", value: "gateway-gpt-5-mini" },
    { name: "GW GPT 4o", value: "gateway-gpt-4o" },
    { name: "GW GPT 4o Mini", value: "gateway-gpt-4o-mini" },
    
    // Gateway Grok
    { name: "GW Grok 4", value: "gateway-grok-4" },
    { name: "GW Grok 4.3", value: "gateway-grok-4-3" },
    { name: "GW Grok 4.5", value: "gateway-grok-4-5" },
    
    // Gateway Claude
    { name: "GW Claude Fable 5", value: "gateway-claude-fable-5" },
    { name: "GW Claude Sonnet 5", value: "gateway-claude-sonnet-5" },
    { name: "GW Claude Sonnet 4.6", value: "gateway-claude-sonnet-4-6" },
    { name: "GW Claude Opus 5", value: "gateway-claude-opus-5" },
    { name: "GW Claude Opus 4.8", value: "gateway-claude-opus-4-8" },
    { name: "GW Claude Opus 4.7", value: "gateway-claude-opus-4-7" },
    { name: "GW Claude Opus 4.6", value: "gateway-claude-opus-4-6" },
    { name: "GW Claude Opus 4.5", value: "gateway-claude-opus-4-5" },
    { name: "GW Claude Opus 4.1", value: "gateway-claude-opus-4-1" },
    
    // Gateway DeepSeek
    { name: "GW DeepSeek R1", value: "gateway-deepseek-r1" },
    { name: "GW DeepSeek V4 Pro", value: "gateway-deepseek-v4-pro" },
    { name: "GW DeepSeek V4 Flash", value: "gateway-deepseek-v4-flash" },
    
    // Gateway Gemini
    { name: "GW Gemini 3 Pro", value: "gateway-gemini-3-pro" },
    { name: "GW Gemini 3.1 Pro", value: "gateway-gemini-3-1-pro" },
    { name: "GW Gemini 3 Flash", value: "gateway-gemini-3-flash" },
    { name: "GW Gemini 3.6 Flash", value: "gateway-gemini-3-6-flash" },
    { name: "GW Gemini 2.5 Flash", value: "gateway-gemini-2-5-flash" },
    
    // Gateway Others
    { name: "GW Qwen 3 Max", value: "gateway-qwen-3-max" },
    { name: "GW Llama 3.3 70B", value: "gateway-llama-3-3-70b-versatile" },
    { name: "GW Kimi K2", value: "gateway-deepinfra-kimi-k2" },
];

const pluginConfig = {
    name: "اصلاح",
    alias: ["fixcode", "debug", "fix"],
    category: "ai",
    description: "إصلاح الأخطاء البرمجية بالذكاء الاصطناعي مع اختيار النموذج",
    usage: ".اصلاح <كود>\n.اصلاح نموذج",
    example: ".اصلاح function x() { consol.log('error') }",
    cooldown: 5,
    energi: 1,
    isEnabled: true,
};

async function handler(m, { sock, text, args }) {
    if (!API_KEY) {
        return m.reply("⚠️ خدمة إصلاح الأكواد غير مهيأة. أضف FIXCODE_API_KEY إلى متغيرات البيئة ثم أعد التشغيل.");
    }
    if (!text) {
        return m.reply(`🔧 *إصلاح الأكواد*\n\n` +
            `ارسل الكود اللي عايز تصلحه مع الأمر.\n\n` +
            `*مثال:*\n${m.prefix}اصلاح function x() { consol.log('error') }\n\n` +
            `*اختيار النموذج:*\n${m.prefix}اصلاح نموذج`);
    }

    const db = getDatabase();

    if (args[0] === "نموذج" || args[0] === "model") {
        const user = db.getUser(m.sender);
        const currentModel = user?.fixcode_model || "openai/gpt-5.5";

        let listTxt = `🤖 *اختيار نموذج FixCode*\n\n`;
        listTxt += `النموذج الحالي: *${currentModel}*\n\n`;
        listTxt += `اختر نموذج من القائمة:\n`;

        const modelSession = [];
        for (let i = 0; i < MODELS.length; i++) {
            const model = MODELS[i];
            modelSession.push(model);
            const isActive = model.value === currentModel ? " ✅" : "";
            listTxt += `*${i + 1}.* ${model.name}${isActive}\n`;
        }

        listTxt += `\n> 💡 *ابعت الرقم (مثال: 1)* لاختيار النموذج، أو اكتب \`الغاء\` للإلغاء.`;

        user.fixcode_model_session = {
            models: modelSession,
            time: Date.now()
        };
        db.save();

        await m.reply(listTxt);
        return;
    }

    // جلسة اختيار النموذج
    const user = db.getUser(m.sender);
    if (user?.fixcode_model_session) {
        const session = user.fixcode_model_session;
        const SESSION_TIMEOUT = 5 * 60 * 1000;

        if (Date.now() - session.time > SESSION_TIMEOUT) {
            delete user.fixcode_model_session;
            db.save();
            await m.reply(`⏰ *انتهت الجلسة*\n\nجلسة اختيار النموذج انتهت.`);
            return;
        }

        const choice = parseInt(text);
        if (!isNaN(choice) && choice >= 1 && choice <= session.models.length) {
            const selected = session.models[choice - 1];
            delete user.fixcode_model_session;
            user.fixcode_model = selected.value;
            db.save();
            await m.reply(`✅ تم اختيار النموذج: *${selected.name}*\n\nالآن أرسل الكود مع الأمر:\n${m.prefix}اصلاح <كود>`);
            return;
        }

        if (text === "الغاء" || text === "cancel") {
            delete user.fixcode_model_session;
            db.save();
            await m.reply(`🚪 تم إلغاء اختيار النموذج.`);
            return;
        }
    }

    // إصلاح الكود
    const model = user?.fixcode_model || "openai/gpt-5.5";
    await m.react("🕕");

    try {
        const apiUrl = `${API_BASE}?apikey=${API_KEY}&code=${encodeURIComponent(text)}&model=${model}`;
        const response = await axios.get(apiUrl, { timeout: 60000 });
        const data = response.data;

        if (!data || !data.status) {
            await m.react("❌");
            return m.reply("❌ فشل إصلاح الكود. تأكد من صحة الكود.");
        }

        const result = data.data.result;
        await m.react("✅");
        await m.reply(`🔧 *تم إصلاح الكود*\nالنموذج: *${model}*\n\n${result}`);

    } catch (error) {
        console.error("[FixCode Error]", error);
        await m.react("☢");
        m.reply("❌ حصل خطأ أثناء الاتصال بالخادم.");
    }
}

export { pluginConfig as config, handler };
