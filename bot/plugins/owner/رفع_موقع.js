// رفع_موقع - أمر لنشر HTML على Vercel (رد على كود / ملف)

import axios from 'axios'
import config from '../../config.js'

const pluginConfig = {
    name: 'رفع_موقع',
    alias: ['deploy'],
    category: 'owner',
    description: 'نشر HTML على Vercel (رد على كود / ملف)',
    usage: '.رفع_موقع <اسم_الموقع>',
    example: '.رفع_موقع موقعي',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const name = m.args[0]
    if (!name) {
        return m.reply(
`🚀 *رفع موقع*

> أدخل اسم الموقع
> رد على كود HTML أو ملف .html

مثال:
.رفع_موقع موقعي`
        )
    }

    if (!m.quoted) {
        return m.reply(
`❌ *لم يتم العثور على HTML*

> رد على رسالة تحتوي على HTML
> أو رد على ملف .html`
        )
    }

    const token = config.vercel?.token
    if (!token) {
        return m.reply('❌ *رمز Vercel غير مضبوط*')
    }

    m.react('🚀')

    let htmlContent

    try {
        if (m.quoted.text || m.quoted.body) {
            htmlContent = m.quoted.text || m.quoted.body
        } else if (
            m.quoted.mimetype === 'text/html' ||
            (m.quoted.filename && m.quoted.filename.endsWith('.html'))
        ) {
            const buffer = await m.quoted.download()
            htmlContent = buffer.toString()
        } else {
            m.react('❌')
            return m.reply(
`❌ *صيغة غير مدعومة*

> رد على نص HTML
> أو ملف .html`
            )
        }

        if (!/<html|<!doctype html|<head|<body/i.test(htmlContent)) {
            m.react('❌')
            return m.reply(
`❌ *ليس HTML صالحاً*

> تأكد من احتوائه على هيكل HTML`
            )
        }

        const payload = {
            name,
            project: name,
            target: 'production',
            files: [
                {
                    file: 'index.html',
                    data: htmlContent
                }
            ],
            projectSettings: {
                framework: null
            }
        }

        await axios.post(
            'https://api.vercel.com/v13/deployments',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        )

        let domain = `${name}.vercel.app`

        try {
            const domainsRes = await axios.get(
                `https://api.vercel.com/v9/projects/${name}/domains`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    timeout: 30000
                }
            )

            const domains = domainsRes.data.domains || []

            domain =
                domains.find(d => !d.name.endsWith('.vercel.app'))?.name ||
                domains.find(d => d.name.endsWith('.vercel.app'))?.name ||
                domain
        } catch {
            // استخدام النطاق الافتراضي في حالة الفشل
        }

        m.react('✅')

        await m.reply(
`╭──「 *تم رفع الموقع بنجاح* 」
│
│ 🌐 الاسم     : ${name}
│ ☁️ المنصة   : Vercel
│ 📄 النوع     : HTML ثابت
│ ⚙️ الحالة   : قيد البناء
│
│ 🔗 الرابط
│ https://${domain}
│
╰────────────────`
        )

    } catch (error) {
        m.react('❌')

        const err =
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            error.message

        m.reply(
`╭──「 *فشل رفع الموقع* 」
│
│ ❌ ${err}
│
╰────────────────`
        )
    }
}

export { pluginConfig as config, handler }