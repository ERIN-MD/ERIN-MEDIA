// لينود - أمر لإدارة خوادم Linode VPS

import config from '../../config.js'
import te from '../../src/lib/maro-error.js'

function randomKarakter(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

function randomNomor(length) {
    const nums = '23456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += nums.charAt(Math.floor(Math.random() * nums.length))
    }
    return result
}

const LINODE_TYPES = {
    'linode2gb': { type: 'g6-standard-1', ram: '2GB', label: '2GB' },
    'linode4gb': { type: 'g6-standard-2', ram: '4GB', label: '4GB' },
    'linode8gb': { type: 'g6-standard-4', ram: '8GB', label: '8GB' },
    'linode16gb': { type: 'g6-standard-8', ram: '16GB', label: '16GB' }
}

// الأسماء العربية للأوامر
const ARABIC_COMMANDS = {
    'لينود2': 'linode2gb',
    'لينود4': 'linode4gb',
    'لينود8': 'linode8gb',
    'لينود16': 'linode16gb',
    'قائمة_لينود': 'listlinode',
    'تشغيل_لينود': 'onlinode',
    'إيقاف_لينود': 'offlinode',
    'إعادة_تشغيل_لينود': 'rebootlinode',
    'إعادة_بناء_لينود': 'rebuildlinode',
    'حذف_لينود': 'delinode',
    'رصيد_لينود': 'saldolinode',
    'عدد_لينود': 'sisalinode',
    'تفاصيل_لينود': 'cekvpslinode'
}

// ترجمة أسماء الأوامر إلى العربية للعرض
const COMMAND_NAMES_AR = {
    'linode2gb': 'لينود 2 جيجابايت',
    'linode4gb': 'لينود 4 جيجابايت',
    'linode8gb': 'لينود 8 جيجابايت',
    'linode16gb': 'لينود 16 جيجابايت',
    'listlinode': 'قائمة الخوادم',
    'onlinode': 'تشغيل الخادم',
    'offlinode': 'إيقاف الخادم',
    'rebootlinode': 'إعادة تشغيل الخادم',
    'rebuildlinode': 'إعادة بناء الخادم',
    'delinode': 'حذف الخادم',
    'saldolinode': 'الرصيد',
    'sisalinode': 'إجمالي الخوادم',
    'cekvpslinode': 'تفاصيل الخادم'
}

const pluginConfig = {
    name: ['لينود2', 'لينود4', 'لينود8', 'لينود16', 'قائمة_لينود', 'تشغيل_لينود', 'إيقاف_لينود', 'إعادة_تشغيل_لينود', 'إعادة_بناء_لينود', 'حذف_لينود', 'رصيد_لينود', 'عدد_لينود', 'تفاصيل_لينود'],
    alias: ['linode2gb', 'linode4gb', 'linode8gb', 'linode16gb', 'listlinode', 'onlinode', 'offlinode', 'rebootlinode', 'rebuildlinode', 'delinode', 'saldolinode', 'sisalinode', 'cekvpslinode'],
    category: 'linode',
    description: 'إدارة خوادم Linode VPS',
    usage: '.لينود2 <الاسم> | .قائمة_لينود | .تشغيل_لينود <المعرف> | الخ',
    example: '.لينود2 خادمي',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, command, args }) {
    const linodeToken = config.APIkey?.linode
    
    if (!linodeToken) {
        return m.reply(`❌ مفتاح Linode API غير مهيأ!\n\nأضفه في config.js:\n\`\`\`\nAPIkey: {\n  linode: 'YOUR_LINODE_TOKEN'\n}\n\`\`\``)
    }
    
    // ترجمة الأمر العربي إلى الإنجليزي
    let cmd = command.toLowerCase()
    if (ARABIC_COMMANDS[cmd]) {
        cmd = ARABIC_COMMANDS[cmd]
    }
    
    try {
        // إنشاء خادم جديد
        if (LINODE_TYPES[cmd]) {
            const label = args[0]
            if (!label) {
                return m.reply(`❌ أدخل اسماً للخادم!\n\nمثال: ${m.prefix}${command} خادمي`)
            }
            
            const spec = LINODE_TYPES[cmd]
            const rootPass = randomKarakter(5) + randomNomor(3)
            
            const linodeData = {
                label: label,
                region: 'ap-south',
                type: spec.type,
                image: 'linode/ubuntu20.04',
                root_pass: rootPass,
                stackscript_id: null,
                authorized_keys: null,
                backups_enabled: false
            }
            
            m.react('🚀')
            
            const createRes = await fetch('https://api.linode.com/v4/linode/instances', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                },
                body: JSON.stringify(linodeData)
            })
            
            const createData = await createRes.json()
            
            if (!createRes.ok) {
                throw new Error(createData.errors?.[0]?.reason || 'فشل إنشاء Linode')
            }
            
            const linodeId = createData.id
            await m.reply(`🕕 جاري إنشاء Linode... انتظر 60 ثانية.`)
            
            await new Promise(resolve => setTimeout(resolve, 60000))
            
            const infoRes = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                }
            })
            
            const linodeInfo = await infoRes.json()
            const ipAddress = linodeInfo.ipv4?.[0] || 'قيد الانتظار'
            
            const msg = `✅ *تم إنشاء خادم Linode ${spec.label} بنجاح*\n\n` +
                `> 🆔 المعرف: \`${linodeId}\`\n` +
                `> 🏷️ الاسم: \`${label}\`\n` +
                `> 🌐 IP: \`${ipAddress}\`\n` +
                `> 🔑 كلمة المرور: \`${rootPass}\`\n` +
                `> 💾 الرام: ${spec.ram}\n` +
                `> 📍 المنطقة: ap-south`
            
            await m.reply(msg)
            m.react('✅')
            return
        }
        
        // قائمة الخوادم
        if (cmd === 'listlinode') {
            m.react('📋')
            
            const res = await fetch('https://api.linode.com/v4/linode/instances', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                }
            })
            
            const data = await res.json()
            
            if (!res.ok) throw new Error('فشل الحصول على قائمة Linode')
            
            if (!data.data || data.data.length === 0) {
                return m.reply(`📋 *قائمة خوادم Linode*\n\n> لا توجد خوادم نشطة.`)
            }
            
            let msg = `📋 *قائمة خوادم Linode*\n\n`
            data.data.forEach((l, i) => {
                const statusAr = {
                    'running': '🟢 قيد التشغيل',
                    'offline': '🔴 متوقف',
                    'booting': '🔄 قيد التشغيل',
                    'rebooting': '🔄 إعادة تشغيل',
                    'shutting_down': '⏹️ إيقاف',
                    'provisioning': '⚙️ تجهيز',
                    'deleting': '🗑️ حذف',
                    'migrating': '📦 ترحيل',
                    'resizing': '📏 تغيير الحجم'
                }[l.status] || l.status
                msg += `*${i + 1}. ${l.label}*\n`
                msg += `> المعرف: \`${l.id}\`\n`
                msg += `> IP: \`${l.ipv4?.[0] || '-'}\`\n`
                msg += `> الحالة: ${statusAr}\n\n`
            })
            
            await m.reply(msg.trim())
            m.react('✅')
            return
        }
        
        // تشغيل الخادم
        if (cmd === 'onlinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ أدخل معرف Linode!\n\nمثال: ${m.prefix}تشغيل_لينود 12345`)
            
            m.react('🔌')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}/boot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                }
            })
            
            if (res.ok) {
                await m.reply(`✅ تم تشغيل Linode المعرف \`${linodeId}\` بنجاح!`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'فشل التشغيل')
            }
            return
        }
        
        // إيقاف الخادم
        if (cmd === 'offlinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ أدخل معرف Linode!\n\nمثال: ${m.prefix}إيقاف_لينود 12345`)
            
            m.react('🔌')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}/shutdown`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                }
            })
            
            if (res.ok) {
                await m.reply(`✅ تم إيقاف Linode المعرف \`${linodeId}\` بنجاح!`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'فشل الإيقاف')
            }
            return
        }
        
        // إعادة تشغيل الخادم
        if (cmd === 'rebootlinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ أدخل معرف Linode!\n\nمثال: ${m.prefix}إعادة_تشغيل_لينود 12345`)
            
            m.react('🔄')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}/reboot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                }
            })
            
            if (res.ok) {
                await m.reply(`✅ تم إعادة تشغيل Linode المعرف \`${linodeId}\` بنجاح!`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'فشل إعادة التشغيل')
            }
            return
        }
        
        // إعادة بناء الخادم
        if (cmd === 'rebuildlinode') {
            const linodeId = args[0]
            const image = args[1] || 'linode/ubuntu20.04'
            if (!linodeId) return m.reply(`❌ أدخل معرف Linode!\n\nمثال: ${m.prefix}إعادة_بناء_لينود 12345 linode/ubuntu20.04`)
            
            const rootPass = randomKarakter(4) + randomNomor(3)
            
            m.react('🔧')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}/rebuild`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                },
                body: JSON.stringify({
                    image: image,
                    root_pass: rootPass
                })
            })
            
            if (res.ok) {
                await m.reply(`✅ تم إعادة بناء Linode المعرف \`${linodeId}\` بنجاح!\n\n> 🔑 كلمة المرور الجديدة: \`${rootPass}\`\n> 🖼️ الصورة: ${image}`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'فشل إعادة البناء')
            }
            return
        }
        
        // حذف الخادم
        if (cmd === 'delinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ أدخل معرف Linode!\n\nمثال: ${m.prefix}حذف_لينود 12345`)
            
            m.react('🗑️')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                }
            })
            
            if (res.ok) {
                await m.reply(`✅ تم حذف Linode المعرف \`${linodeId}\` بنجاح!`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'فشل الحذف')
            }
            return
        }
        
        // الرصيد
        if (cmd === 'saldolinode') {
            m.react('💰')
            
            const res = await fetch('https://api.linode.com/v4/account', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                }
            })
            
            const data = await res.json()
            
            if (!res.ok) throw new Error('فشل الحصول على الرصيد')
            
            const balance = (data.koin || 0) / 100
            const credit = (data.credit_remaining || 0) / 100
            
            const msg = `💰 *رصيد حساب Linode*\n\n` +
                `> 💵 الرصيد: $${balance.toFixed(2)}\n` +
                `> 🎁 الائتمان: $${credit.toFixed(2)}`
            
            await m.reply(msg)
            m.react('✅')
            return
        }
        
        // إجمالي الخوادم
        if (cmd === 'sisalinode') {
            m.react('📊')
            
            const res = await fetch('https://api.linode.com/v4/linode/instances', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                }
            })
            
            const data = await res.json()
            
            if (!res.ok) throw new Error('فشل الحصول على البيانات')
            
            const total = data.data?.length || 0
            await m.reply(`📊 *إجمالي خوادم Linode النشطة*\n\n> ${total} خادم`)
            m.react('✅')
            return
        }
        
        // تفاصيل الخادم
        if (cmd === 'cekvpslinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ أدخل معرف Linode!\n\nمثال: ${m.prefix}تفاصيل_لينود 12345`)
            
            m.react('🔍')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToken}`
                }
            })
            
            const l = await res.json()
            
            if (!res.ok) throw new Error('فشل الحصول على التفاصيل')
            
            const statusAr = {
                'running': '🟢 قيد التشغيل',
                'offline': '🔴 متوقف',
                'booting': '🔄 قيد التشغيل',
                'rebooting': '🔄 إعادة تشغيل',
                'shutting_down': '⏹️ إيقاف',
                'provisioning': '⚙️ تجهيز',
                'deleting': '🗑️ حذف',
                'migrating': '📦 ترحيل',
                'resizing': '📏 تغيير الحجم'
            }[l.status] || l.status
            
            const msg = `🔍 *تفاصيل خادم Linode*\n\n` +
                `> 🆔 المعرف: \`${l.id}\`\n` +
                `> 🏷️ الاسم: \`${l.label}\`\n` +
                `> 📊 الحالة: ${statusAr}\n` +
                `> 📍 المنطقة: ${l.region}\n` +
                `> 💾 النوع: ${l.type}\n` +
                `> 🌐 IP: \`${l.ipv4?.join(', ') || '-'}\``
            
            await m.reply(msg)
            m.react('✅')
            return
        }
        
        // عرض المساعدة
        await m.reply(
            `☁️ *أوامر Linode*\n\n` +
            `> .لينود2 <الاسم> - إنشاء خادم 2GB\n` +
            `> .لينود4 <الاسم> - إنشاء خادم 4GB\n` +
            `> .لينود8 <الاسم> - إنشاء خادم 8GB\n` +
            `> .لينود16 <الاسم> - إنشاء خادم 16GB\n` +
            `> .قائمة_لينود - قائمة الخوادم\n` +
            `> .تشغيل_لينود <المعرف> - تشغيل الخادم\n` +
            `> .إيقاف_لينود <المعرف> - إيقاف الخادم\n` +
            `> .إعادة_تشغيل_لينود <المعرف> - إعادة تشغيل\n` +
            `> .إعادة_بناء_لينود <المعرف> <الصورة> - إعادة بناء\n` +
            `> .حذف_لينود <المعرف> - حذف الخادم\n` +
            `> .رصيد_لينود - عرض الرصيد\n` +
            `> .عدد_لينود - إجمالي الخوادم\n` +
            `> .تفاصيل_لينود <المعرف> - تفاصيل الخادم`
        )
        
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }