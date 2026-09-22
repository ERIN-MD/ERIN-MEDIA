import config from '../../config.js'
import path from 'path'
import fs from 'fs'
import te from '../../src/lib/maro-error.js'
const pluginConfig = {
    name: 'تحميل_غيت',
    alias: ['github', 'gh'],
    category: 'downloader',
    description: 'تحميل مستودع غيت هب كـ ZIP',
    usage: '.تحميل_غيت <مستخدم> <مستودع> <فرع>',
    example: '.تحميل_غيت niceplugin NiceBot main',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    let username, repo, branch
    
    if (args[0]?.includes('github.com')) {
        const urlMatch = args[0].match(/github\.com\/([^\/]+)\/([^\/]+)/i)
        if (urlMatch) {
            username = urlMatch[1]
            repo = urlMatch[2].replace(/\.git$/, '')
            branch = args[1] || 'main'
        }
    } else {
        username = args[0]
        repo = args[1]
        branch = args[2] || 'main'
    }
    
    if (!username) {
        return m.reply(
            `⚠️ *طريقة الاستخدام*\n\n` +
            `> \`${m.prefix}تحميل_غيت <مستخدم> <مستودع> <فرع>\`\n\n` +
            `> مثال:\n` +
            `> \`${m.prefix}تحميل_غيت niceplugin NiceBot main\`\n` +
            `> \`${m.prefix}تحميل_غيت https://github.com/user/repo\``
        )
    }
    
    if (!repo) {
        return m.reply(`❌ *المستودع مطلوب*\n\n> أدخل اسم المستودع`)
    }
    
    await m.react('🕕')

    try {
        const repoInfo = await fetch(`https://api.github.com/repos/${username}/${repo}`)
        
        if (!repoInfo.ok) {
            await m.react('❌')
            return m.reply(`❌ *المستودع غير موجود*\n\n> \`${username}/${repo}\` غير موجود`)
        }
        
        const repoData = await repoInfo.json()
        const defaultBranch = repoData.default_branch || 'main'
        branch = branch || defaultBranch
        
        const zipUrl = `https://github.com/${username}/${repo}/archive/refs/heads/${branch}.zip`
        
        const checkRes = await fetch(zipUrl, { method: 'HEAD' })
        if (!checkRes.ok) {
            await m.react('❌')
            return m.reply(`❌ *الفرع غير موجود*\n\n> الفرع \`${branch}\` غير موجود\n> الافتراضي: \`${defaultBranch}\``)
        }
        
        await sock.sendMedia(m.chat, zipUrl, null, m, {
            type: 'document',
            fileName: `${repo} - الفرع: ${branch}.zip`,
            mimetype: 'application/zip',
            contextInfo: {
                forwardingScore: 99,
                isForwarded: true
            }
        })
        
        await m.react('✅')
        
    } catch (e) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }