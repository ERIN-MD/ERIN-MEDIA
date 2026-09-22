// إسلامي - أمر يحتوي على مجموعة من الميزات الإسلامية (أسماء الله الحسنى، نية الصلاة، السور، الأدعية، المقالات، الحكم)

import axios from 'axios'
import config from '../../config.js'

const pluginConfig = {
    name: 'إسلامي',
    alias: [
        'asmaulhusna', 'niatsholat', 'niatshalat', 'surah', 'doa', 'berdoa', 
        'gislam'
    ],
    category: 'religi',
    description: 'مجموعة من الميزات الإسلامية (أسماء الله الحسنى، نية الصلاة، السور، الأدعية، المقالات، الحكم)',
    usage: '.إسلامي <الميزة>',
    isGroup: false,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function fetchJson(url) {
    try {
        const response = await axios.get(url)
        return response.data
    } catch (e) {
        throw e
    }
}

async function handler(m, { sock }) {
    const command = m.command.toLowerCase()
    const text = m.text || ''

    try {
        switch (command) {
            case 'asmaulhusna': {
                let jir = await fetchJson('https://islamic-api-zhirrr.vercel.app/api/asmaulhusna')
                let ye = jir.data

                let tks = '☪️ *أسماء الله الحسنى*\n\n' + ye.map((item) => {
                    return `الرقم: ${item.index}\nباللاتينية: ${item.latin}\nبالعربية: ${item.arabic}\nالمعنى (AR): ${item.translation_id}\nالمعنى (EN): ${item.translation_en}\n`
                }).join('\n')
                m.reply(tks)
            }
            break

            case 'niatsholat': 
            case 'niatshalat': {
                let jir = await fetchJson('https://islamic-api-zhirrr.vercel.app/api/niatshalat')
                let niatSholat = jir

                if (!text) {
                    let daftarNiat = '📋 *قائمة نيات الصلاة*\n\n' + niatSholat.map((item) => `- ${item.name}`).join('\n')
                    daftarNiat += `\n\n📌 اكتب \`${m.prefix}niatsholat [اسم الصلاة]\` لعرض النية\nمثال: \`${m.prefix}niatsholat الفجر\``
                    m.reply(daftarNiat)
                } else {
                    let hasil = niatSholat.find((item) => item.name.toLowerCase().includes(text.toLowerCase()))

                    if (hasil) {
                        let tks = `🕋 *نية ${hasil.name.toUpperCase()}*\n\n` +
                            `📄 بالعربية: ${hasil.arabic}\n` +
                            `🔤 باللاتينية: ${hasil.latin}\n` +
                            `🌍 الترجمة: ${hasil.terjemahan}`
                        m.reply(tks)
                    } else {
                         m.reply('❌ نية الصلاة التي تبحث عنها غير موجودة. تحقق من اسم الصلاة!')
                    }
                }
            }
            break

            case 'surah': {
                if (!text) {
                    m.reply(`⚠️ أدخل رقم السورة!\nمثال: \`${m.prefix}surah 1\` لعرض آيات الفاتحة`)
                    return
                }

                m.reply('🕕 جاري تحميل السورة...')
                let response = await fetchJson(`https://api.siputzx.my.id/api/s/surah?no=${text}`)
                let data = response.data
                if (data && data.length > 0) {
                    let surahText = data.map((ayat, index) =>
                        `۝ الآية ${ayat.no}:\n` +
                        `${ayat.arab}\n` +
                        `${ayat.latin}\n` +
                        `_${ayat.indo}_`
                    ).join('\n\n')

                    if (surahText.length > 60000) {
                         m.reply('❌ السورة طويلة جداً لإرسالها كنص. ابحث عن آية محددة أو سورة أقصر.')
                    } else {
                        m.reply(surahText)
                    }
                } else {
                    m.reply('❌ غير موجود، تحقق من رقم السورة!')
                }
            }
            break

            case 'doa':
            case 'berdoa': {
                let jir = await fetchJson('https://doa-doa-api-ahmadramadhan.fly.dev/api')
                let daftarDoa = jir

                if (!text) {
                    let listDoa = '🤲 *قائمة الأدعية*\n\n' + daftarDoa.map((item) => `- ${item.doa}`).join('\n')
                     listDoa += `\n\n📌 اكتب \`${m.prefix}doa [اسم الدعاء]\` لعرض الدعاء\nمثال: \`${m.prefix}doa دعاء النوم\``
                    m.reply(listDoa)
                } else {
                    let hasil = daftarDoa.find((item) => item.doa.toLowerCase().includes(text.toLowerCase()))

                    if (hasil) {
                        let tks = `🤲 *${hasil.doa.toUpperCase()}*\n\n` +
                            `📄 الآية: ${hasil.ayat}\n` +
                            `🔤 باللاتينية: ${hasil.latin}\n` +
                            `🌍 المعنى: ${hasil.artinya}`
                        m.reply(tks)
                    } else {
                         m.reply('❌ الدعاء الذي تبحث عنه غير موجود. تحقق من اسم الدعاء!')
                    }
                }
            }
            break

            case 'gislam': {
                if (!text) return m.reply(`❓ عن ماذا تريد البحث من مقالات؟\nمثال: \`${m.prefix}gislam الصيام\``)
                
                try {
                    const response = await fetchJson(`https://artikel-islam.netlify.app/.netlify/functions/api/ms?page=1&s=${text}`)
                    if (response.success) {
                        const articles = response.data.data
                        if (!articles || articles.length === 0) return m.reply('❌ المقال غير موجود.')

                        let message = `📚 *نتائج البحث: ${text.toUpperCase()}*\nالإجمالي: ${articles.length}\n\n`
                        articles.forEach((article, index) => {
                            message += `${index + 1}. *${article.title}*\n🔗 ${article.url}\n\n`
                        })
                        return m.reply(message)
                    } else {
                        return m.reply('❌ فشل في جلب بيانات المقالات.')
                    }
                } catch (error) {
                    return m.reply('❌ حدث خطأ أثناء جلب البيانات.')
                }
            }
        }
    } catch (e) {
        console.error('Religi Plugin Error:', e)
        m.reply('❌ حدث خطأ في النظام.')
    }
}

export { pluginConfig as config, handler }