// اكسل - أمر لعرض معلومات الباقات والبيانات لرقم XL/Axis بالتفصيل

import axios from "axios"
import te from "../../src/lib/maro-error.js"

const pluginConfig = {
    name: "اكسل",
    alias: ["cekxl"],
    category: "tools",
    description: "عرض معلومات الباقات والبيانات لرقم XL/Axis بالتفصيل",
    usage: ".اكسل <الرقم>",
    example: ".اكسل 083150850721",
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

function cleanNumber(phoneNumber) {
    let num = phoneNumber.replace(/\D/g, "")
    if (num.startsWith("0")) num = "62" + num.substring(1)
    if (!num.startsWith("62")) num = "62" + num
    return num
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 بايت"
    const units = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت", "تيرابايت"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i]
}

async function handler(m, { sock }) {
    const input = m.args[0] || m.text?.trim()

    if (!input) {
        return m.reply(
            `📱 *اكسل - فحص XL/Axis*\n\n` +
            `تُستخدم هذه الميزة لعرض معلومات الباقات والبيانات المتاحة لرقم XL أو Axis بشكل كامل ومفصل\n\n` +
            `*طريقة الاستخدام:*\n` +
            `> \`${m.prefix}اكسل <رقم الهاتف>\`\n\n` +
            `*مثال:*\n` +
            `> \`${m.prefix}اكسل 083150850721\`\n` +
            `> \`${m.prefix}اكسل 6281234567890\`\n\n` +
            `_يمكن كتابة الرقم بصيغة 08xx، 628xx، أو بدون مفتاح_`
        )
    }

    const cleanNum = cleanNumber(input)

    if (cleanNum.length < 10 || cleanNum.length > 15) {
        return m.reply(`❌ الرقم الذي أدخلته غير صالح، تأكد من أنه رقم XL أو Axis صحيح`)
    }

    m.react("🕕")

    try {
        const { data } = await axios.get(
            `https://xl-ku.my.id/end.php?check=package&number=${cleanNum}&version=2`,
            { timeout: 30000 }
        )

        if (!data || data.error || data.status === false) {
            m.react("❌")
            return m.reply(`❌ لا يمكن فحص الرقم *${cleanNum}*، تأكد من أنه رقم XL أو Axis نشط`)
        }

        let txt = `📱 *معلومات XL/Axis*\n\n`
        txt += `📞 الرقم: *${cleanNum}*\n`

        if (data.msisdn) txt += `🆔 المعرف: *${data.msisdn}*\n`
        if (data.status) txt += `📊 الحالة: *${data.status}*\n`
        if (data.activeDate) txt += `📅 نشط منذ: *${data.activeDate}*\n`
        if (data.expireDate) txt += `⏰ فترة الصلاحية: *${data.expireDate}*\n`
        if (data.graceDate) txt += `⚠️ فترة السماح: *${data.graceDate}*\n`

        if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
            txt += `\n📦 *الباقات النشطة*\n\n`
            for (const pkg of data.packages) {
                txt += `- *${pkg.name || pkg.packageName || "باقة"}*\n`
                if (pkg.quota || pkg.remainingQuota) txt += `  > البيانات المتبقية: *${pkg.remainingQuota || pkg.quota}*\n`
                if (pkg.totalQuota) txt += `  > إجمالي البيانات: *${pkg.totalQuota}*\n`
                if (pkg.expireDate || pkg.validUntil) txt += `  > تنتهي في: *${pkg.expireDate || pkg.validUntil}*\n`
                if (pkg.type) txt += `  > النوع: *${pkg.type}*\n`
                txt += `\n`
            }
        }

        if (data.balance || data.pulsa) {
            txt += `💰 *الرصيد*\n`
            txt += `> الرصيد: *${data.balance || data.pulsa}*\n\n`
        }

        if (data.result && typeof data.result === "object") {
            const r = data.result
            if (r.name) txt += `👤 اسم الباقة: *${r.name}*\n`
            if (r.quota) txt += `📊 البيانات: *${r.quota}*\n`
            if (r.masa_aktif) txt += `📅 فترة الصلاحية: *${r.masa_aktif}*\n`
            if (r.status) txt += `📊 الحالة: *${r.status}*\n`
        }

        if (typeof data === "object" && !data.packages && !data.result) {
            const skipKeys = ["error", "status", "msisdn", "activeDate", "expireDate", "graceDate", "balance", "pulsa"]
            const extraKeys = Object.keys(data).filter(k => !skipKeys.includes(k))
            if (extraKeys.length > 0) {
                txt += `\n📋 *تفاصيل أخرى*\n\n`
                for (const key of extraKeys) {
                    const val = data[key]
                    if (typeof val === "string" || typeof val === "number") {
                        txt += `- ${key}: *${val}*\n`
                    }
                }
            }
        }

        m.react("✅")
        await m.reply(txt.trim())

    } catch (error) {
        m.react("☢")
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }