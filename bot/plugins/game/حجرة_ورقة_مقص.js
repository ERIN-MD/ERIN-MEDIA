import { getDatabase } from '../../src/lib/maro-database.js'
import config from '../../config.js'
const pluginConfig = {
    name: 'حجرة_ورقة_مقص',
    alias: ['suit'],
    category: 'game',
    description: 'العب حجرة ورقة مقص مع لاعب آخر',
    usage: '.حجرة_ورقة_مقص @إشارة',
    example: '.حجرة_ورقة_مقص @628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

if (!global.suitGames) global.suitGames = {}

const TIMEOUT = 90000
const WIN_REWARD = 1000

const EMOJI = {
    batu: '✊',
    gunting: '✌️',
    kertas: '✋'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    const existingRoom = Object.values(global.suitGames).find(
        room => [room.p, room.p2].includes(m.sender)
    )
    
    if (existingRoom) {
        return m.reply(
            `❌ أنت ما زلت في لعبة!\n\n` +
            `> أنهِ لعبتك أولاً.`
        )
    }
    
    let target = null
    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0]
    }
    
    if (!target) {
        return m.reply(
            `✊✌️✋ *حجرة ورقة مقص*\n\n` +
            `> أشر على الشخص الذي تريد تحديه!\n\n` +
            `*مثال:*\n` +
            `> \`.حجرة_ورقة_مقص @628xxx\``
        )
    }
    
    if (target === m.sender) {
        return m.reply('❌ لا يمكنك تحدي نفسك!')
    }
    
    const targetInGame = Object.values(global.suitGames).find(
        room => [room.p, room.p2].includes(target)
    )
    
    if (targetInGame) {
        return m.reply('❌ هذا الشخص يلعب مع شخص آخر!')
    }
    
    const roomId = 'suit_' + Date.now()
    
    global.suitGames[roomId] = {
        id: roomId,
        chat: m.chat,
        p: m.sender,
        p2: target,
        status: 'waiting',
        pilih: null,
        pilih2: null,
        createdAt: Date.now(),
        timeout: setTimeout(() => {
            if (global.suitGames[roomId]) {
                sock.sendMessage(m.chat, {
                    text: `⏱️ *انتهى الوقت!*\n\n@${target.split('@')[0]} لم يستجب!\nتم إلغاء اللعبة.`,
                    mentions: [target]
                })
                delete global.suitGames[roomId]
            }
        }, TIMEOUT)
    }
    
    await m.react('✊')
    await m.reply(`أنت تتحدى @${target.split('@')[0]} في حجرة ورقة مقص\n\n` +
            `╭┈┈⬡「 💬 *الرد* 」\n` +
            `┃ ✅ اكتب *قبلت* / *موافق* / *اوك*\n` +
            `┃ ❌ اكتب *رفض* / *لا*\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `الوقت: 90 ثانية`, {  mentions: [target]})
}

async function answerHandler(m, sock) {
    if (!m.body) return false
    
    const text = m.body.trim().toLowerCase()
    const db = getDatabase()
    
    let room = null
    let roomId = null
    
    for (const [id, r] of Object.entries(global.suitGames)) {
        if (r.chat === m.chat && [r.p, r.p2].includes(m.sender)) {
            room = r
            roomId = id
            break
        }
        if (!m.isGroup && [r.p, r.p2].includes(m.sender)) {
            room = r
            roomId = id
            break
        }
    }
    
    if (!room) return false
    
    if (room.status === 'waiting' && m.sender === room.p2 && m.chat === room.chat) {
        if (/^(قبلت|موافق|اوك|نعم|اي|تمام)$/i.test(text)) {
            clearTimeout(room.timeout)
            room.status = 'playing'
            
            await m.react('🎮')
            
            await m.reply(`✊✌️✋ *بدأت اللعبة!*\n\n` +
                    `@${room.p.split('@')[0]} ضد @${room.p2.split('@')[0]}\n\n` +
                    `> 📩 تحقق من *الخاص* للاختيار!\n` +
                    `> ⏱️ الوقت: 90 ثانية`, {  mentions: [room.p, room.p2]})
            
            const pmMessage = `✊✌️✋ *حجرة ورقة مقص - اختر*\n\n` +
                `اكتب واحداً من:\n\n` +
                `┃ ✊ *حجرة*\n` +
                `┃ ✌️ *مقص*\n` +
                `┃ ✋ *ورقة*\n\n` +
                `*نصيحة: رد على هذه الرسالة باختيارك!*\n` +
                `مثال: *حجرة*`
            
            try {
                await sock.sendMessage(room.p, { text: pmMessage })
            } catch (e) {
                console.log('[Suit] فشل إرسال خاص للاعب 1:', e.message)
            }
            
            try {
                await sock.sendMessage(room.p2, { text: pmMessage })
            } catch (e) {
                console.log('[Suit] فشل إرسال خاص للاعب 2:', e.message)
            }
            
            room.timeout = setTimeout(async () => {
                if (global.suitGames[roomId]) {
                    if (!room.pilih && !room.pilih2) {
                        await sock.sendMessage(room.chat, { 
                            text: '⏱️ كلا اللاعبين لم يختارا، تم إلغاء اللعبة!' 
                        })
                    } else if (!room.pilih || !room.pilih2) {
                        const afk = !room.pilih ? room.p : room.p2
                        const winner = !room.pilih ? room.p2 : room.p
                        
                        db.updateKoin(winner, WIN_REWARD)
                        
                        await sock.sendMessage(room.chat, {
                            text: `⏱️ *انتهى الوقت!*\n\n` +
                                `@${afk.split('@')[0]} لم يختر!\n` +
                                `@${winner.split('@')[0]} فاز! +Rp ${WIN_REWARD.toLocaleString()}`,
                            mentions: [afk, winner]
                        })
                    }
                    delete global.suitGames[roomId]
                }
            }, TIMEOUT)
            
            return true
        }
        
        if (/^(رفض|لا|مش_هقدر|نفض)$/i.test(text)) {
            clearTimeout(room.timeout)
            
            await sock.sendMessage(room.chat, {
                text: `❌ @${room.p2.split('@')[0]} رفض التحدي!\nتم إلغاء اللعبة.`,
                mentions: [room.p2]
            })
            
            delete global.suitGames[roomId]
            return true
        }
    }
    
    if (room.status === 'playing' && !m.isGroup) {
        const choices = /^(حجرة|مقص|ورقة)$/i
        
        if (!choices.test(text)) return false
        
        const choiceMap = { 'حجرة': 'batu', 'مقص': 'gunting', 'ورقة': 'kertas' }
        const choice = choiceMap[text]
        
        if (m.sender === room.p && !room.pilih) {
            room.pilih = choice
            await m.reply(`✅ اخترت *${text}* ${EMOJI[choice]}\n\n> في انتظار الخصم...`)
            
            if (!room.pilih2) {
                await sock.sendMessage(room.chat, {
                    text: `🕕 @${room.p.split('@')[0]} اختار!\n> في انتظار @${room.p2.split('@')[0]}...`,
                    mentions: [room.p, room.p2]
                })
            }
        }
        
        if (m.sender === room.p2 && !room.pilih2) {
            room.pilih2 = choice
            await m.reply(`✅ اخترت *${text}* ${EMOJI[choice]}\n\n> في انتظار الخصم...`)
            
            if (!room.pilih) {
                await sock.sendMessage(room.chat, {
                    text: `🕕 @${room.p2.split('@')[0]} اختار!\n> في انتظار @${room.p.split('@')[0]}...`,
                    mentions: [room.p, room.p2]
                })
            }
        }
        
        if (room.pilih && room.pilih2) {
            clearTimeout(room.timeout)
            
            let winner = null
            let tie = false
            
            const reverseMap = { 'batu': 'حجرة', 'gunting': 'مقص', 'kertas': 'ورقة' }
            
            if (room.pilih === room.pilih2) {
                tie = true
            } else if (
                (room.pilih === 'batu' && room.pilih2 === 'gunting') ||
                (room.pilih === 'gunting' && room.pilih2 === 'kertas') ||
                (room.pilih === 'kertas' && room.pilih2 === 'batu')
            ) {
                winner = room.p
            } else {
                winner = room.p2
            }
            
            let resultTxt = `✊✌️✋ *نتيجة اللعبة*\n\n`
            resultTxt += `@${room.p.split('@')[0]} ${EMOJI[room.pilih]} ${reverseMap[room.pilih]}\n`
            resultTxt += `@${room.p2.split('@')[0]} ${EMOJI[room.pilih2]} ${reverseMap[room.pilih2]}\n\n`
            
            if (tie) {
                resultTxt += `🤝 *تعادل!*`
            } else {
                db.updateKoin(winner, WIN_REWARD)
                
                resultTxt += `🏆 @${winner.split('@')[0]} فاز!\n`
                resultTxt += `> +Rp ${WIN_REWARD.toLocaleString()}`
            }
            
            await sock.sendMessage(room.chat, {
                text: resultTxt,
                mentions: [room.p, room.p2]
            }, { quoted: m })
            
            delete global.suitGames[roomId]
        }
        
        return true
    }
    
    return false
}

export { pluginConfig as config, handler, answerHandler }