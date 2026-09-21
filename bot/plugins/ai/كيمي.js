import axios from 'axios';

const pluginConfig = {
    name: 'كيمي',
    alias: ['kimi', 'kimi3', 'genspark', 'جينسبارك'],
    category: 'ai',
    description: 'دردشة مع Kimi K3 من Genspark',
    usage: '.كيمي <سؤال>',
    example: '.كيمي من هو رئيس مصر؟',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 2,
    isEnabled: true
};

const API_URL = 'https://www.genspark.ai/api/agent/ask_proxy';

// كوكيز + Token (ينتهي بعد فترة - جدد من المتصفح)
const CONFIG = {
    cookies: 'i18n_set=en-US; session_id=824e0d2d-a921-4873-b9ea-b6b316ed7264:8925c3d49e04936c0c482173022dbbfc9486acfc096ad1dfa00c2d8efcbe4109; gslogin=1; agree_terms=1',
    recaptchaToken: '0cAFcWeA7BW2Hs2heY9_TiywDh9w0mGgAnOpt55eKv2Dy2nV0HYuc_lwav-G_0bD6tJw5D1XeKM_NQFMoat24_uc_4WZ12kq_susTXtjX-dsfgA7WTSCzhU4jJ2BNzwYc0aM1ooLxd9VPY0WBtPIuDHlpq2jnkzsur9EGeATDT3nI8RoZ377JxPobOHTgSaXpaioRDkPLnYDg3vC5iG359L2ji3l-DMhDZldBw0RuSeYTnsJLdkgf1thF5r8aEXf5QSOeUA_mAPtL_AED2SQ3uYCldZJWy8Sl3zDaJL92hHwBSxDGfwDG47WXDKEFGW_jjto66254X-0hWqc-PFsGUK5o_tFPdfl5EfojLGF05NnyT6IIA66JBNZg-FB5QF9XbO9850oGXcBb-NOIE95cq1-hWmQvEPcYRF8p20k99d3v1RbV0BxC9GIfYsJ5OAvBUZN7fQgy1O_Goxa41ld_UIfTZpr3ETFrbTFQb8wEqnMFLSS42rCZC4oRynPbq1KE3gFUgK2q9YOtGaI663-sKJ7C_SgmrCE4NcGNPpbl2FefUBDrpGIERC4nSWWjBlxr4Hx1wtUaZ01mOJaFW3WKNTcYlvER1gzYrssmP21PA2pEfxK3pxjJ2pA6q0zDHSamrWz1o-aUXRokKShslPcDZxBpZkATt2beQO8wye39uDu7Ii18STzYtK6yin3_OR3tbR1f9GYuqFXUrMvorslfrKtdtWyLs9FmonhCIxBcJ7ooW1xmh5yzSLy51wsodIBLU8wxZhPSCqWuv3BuGQGAKHVhbaRPLluXhMsREVMv0EV6tK6DyqREgA6eUGck1ncB9RJbCHoIsPU_Lpls8zui6mNIwhXlkduqePVnyhfAiusq-JkDt1wtPtrQuU_fZm7HI6dSmYNG7AlLTW5XiEyarAHWTV-PqKH5vNRJZ4lgUrnav0_KhY6nUdfz8cPa01Z33237SkM3yOv5v5Yg5dI6tFJ6uMiHDQVTDhMnb4kkdWKmQFqf1mD7jPMaA1EoFKazLp_6KYUPK7T8prxh8MXJkTCeTt2EJ5Hy7-goS-eiT7TQ1gO7h3iNBO3vaR-fV9oiUvbwq37TkpbePChsOSQ7_-VS1Kj7nRQ32X2qwUiVhNf04-zmmKVo-V7FHYQXTC8IghCXEbo03fUDvj3rPVYeelbqpIUFSOnFuRCR58nnolthM8kikpO7G_5n4ZVhqs0pxFvYM-CAVbMyK4Yl0V4qv1krzpsFt2gtybKijw1PkYkvM8iOm-6oSkgeJYy05UlDjJRPHvUzcZlF09yrqj_OqWh0U_V6PtIxByLVrePxolBaAqMuBmS6rJEyMvuuTNfjMRB1WvFRfY8rm7vkEwYfS7aQQOEhi7lRGJXohQ5pE58jAPVM2V_qv5_m1D1XybBGyqtcKrUZeixzrvZw8E_5Jv7Fab7IEAZ8sNHglJlp-plzwuPm95Gekc0ugMUmvrWupNiqR77V-Zt9dWc6flbpQjVyZKa4wC1igQAPsLC1C21ox_jV9da_u7kX2--4LOpo2Pq-8x2rdpOpr5eUYq-d-eyfnehKOFLH_q-CJ2MWFZj88ssX38xgGHpExnzP6hPb4ERv1NeibEYSOHWD2o3WyAEsS_ioM4tBlcoKAVZxIVIE6YvpQnlfKAwM_kyUYjKy5YpNppzNWtbfIc6VgZ_tBKH75IijjZIX84HtERI2qbZkOi_ewAM_iTVNAPKFgokwhXwsEO-aS_ta3aJFcBXbZ5FPLbVOLHwpVPe7Ae4MO6rfDOD7ohEbzhDFW7qM0lJB4R5PwdRmFETD20Fgl1Msri0LUCGKzLG7Yy9N661RMaxh9c3Qzup1eoigyWliKs9ady3Ld8g8_81N8U1lDbIM2BLegTL9H7VsooKSXaU1eTKfJQd_EPDkQdADEmLdJm5eUkv0f4TtANz7jqbX4HiAgoM-q1onDWvc_wmOr1lq8JASdqyUKOLFLDKX4EPSKG7mHrnbEtmVsXQMJB6q7SfjAvBio_ByyGw8LPcSc71y6shHvalW1ur3oxXUms8l8UUnNMbUpW33LEhrgX5b_3b8anKwpxvzIrcnxqUpaIgPIRJbqX5XuDJ1EIU34tGlZ1Qz-j0yytkn6e91qba8fycH0WeSMg8QN7Mcy66dXPf8TYGn8GrD70EtEBjT_tJCg5HFpr_YgMcoDOAlmCqf8_6TuQalceLZNZ0n6lT4DGmOYgmImlp6kpixhnz35d5vWa78sZDdw73YX3TKd8DCI7fVWcT6cl0Nz-xDRS7HrzRhylXSAFWJj2zVMqY_5F7buaMyzozVmIyJ91MGEuySc9VH0JDhAwh0wAw8BxYPYKiHiELueVaqe3OccrJqnXsVf-3sGoUh_9hiE_aPUpY45opdtLGh71Q6WCJG4d2F-VMABG6ZBBsIN106cgam2Lo3q1B4YPHikYKgUxq7Ryq_I-b2ObPwj-ZvGAOcBSCm7NRiwfsLE4x4VRZUG5c0ZM6Q_dfVfZ3RHHkTKPm7xjFo9boZuQGJaVpvXIuYW6YkeaN3XDtEr8rfE6lKxbMWTaWNPAWaV4czZYJqdhcGtABEOhlNAqO7vMpxJ2T1W0r-hy1MQuP5C_kfCxORKjr0'
};

async function handler(m, { sock, text }) {
    if (!text) return m.reply(`🤖 *Kimi K3*\n\n> \`${m.prefix}كيمي <سؤال>\`\n\n> مثال:\n> \`${m.prefix}كيمي من هو رئيس مصر؟\``);

    await m.react('🤖');

    try {
        const res = await axios.post(API_URL, {
            ai_chat_model: 'kimi-k3',
            type: 'ai_chat',
            messages: [{ role: 'user', content: text }],
            user_s_input: text,
            g_recaptcha_token: CONFIG.recaptchaToken,
            is_private: true,
            session_state: { steps: [], messages: [{ role: 'user', content: text }] },
            last_seen_event_index: -1,
            chat_session_id: null
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                'Origin': 'https://www.genspark.ai',
                'Referer': 'https://www.genspark.ai/',
                'Cookie': CONFIG.cookies
            },
            responseType: 'text',
            timeout: 60000
        });

        // استخراج النص من SSE
        let result = '';
        const lines = res.data.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ') && line.includes('message_result')) {
                try {
                    const json = JSON.parse(line.slice(6));
                    if (json.message?.content) {
                        result = json.message.content;
                        break;
                    }
                } catch {}
            }
        }

        if (result) {
            await m.reply(result);
            await m.react('✅');
        } else {
            await m.react('❌');
            await m.reply('❌ لم يتم الحصول على رد');
        }

    } catch (e) {
        await m.react('❌');
        await m.reply(`❌ خطأ: ${e.message}`);
    }
}

export { pluginConfig as config, handler };