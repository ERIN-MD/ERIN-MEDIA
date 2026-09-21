import fs from 'fs';
import path from 'path';
import config from '../../config.js';

const pluginConfig = {
    name: 'اخطاء',
    alias: ['errors', 'debug'],
    category: 'owner',
    description: 'فحص الأخطاء في جميع الأوامر',
    usage: '.اخطاء',
    example: '.اخطاء',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
};

async function checkPlugin(filePath) {
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        const errors = [];
        
        // فحص imports
        const imports = code.match(/import\s+.*?from\s+['"].*?['"]/g) || [];
        for (const imp of imports) {
            const modulePath = imp.match(/from\s+['"](.+?)['"]/)?.[1];
            if (modulePath && modulePath.startsWith('.') || modulePath.startsWith('/')) {
                // تخطي المسارات النسبية
            } else if (modulePath && !modulePath.startsWith('.')) {
                // مكتبة خارجية - نتأكد من وجودها في package.json
                const pkgName = modulePath.split('/')[0].startsWith('@') ? 
                    modulePath.split('/').slice(0, 2).join('/') : 
                    modulePath.split('/')[0];
                try {
                    await import(pkgName);
                } catch (e) {
                    errors.push(`مكتبة مفقودة: ${pkgName}`);
                }
            }
        }
        
        // فحص exports
        if (!code.includes('export { pluginConfig as config, handler }') && 
            !code.includes('export default')) {
            errors.push('ينقصه export');
        }
        
        // فحص handler
        if (!code.includes('async function handler') && 
            !code.includes('function handler')) {
            errors.push('ينقصه handler');
        }
        
        // فحص pluginConfig
        if (!code.includes('pluginConfig')) {
            errors.push('ينقصه pluginConfig');
        }
        
        return errors;
    } catch (e) {
        return [`خطأ في قراءة الملف: ${e.message}`];
    }
}

async function handler(m, { sock }) {
    m.react('🔍');
    
    const pluginsDir = path.join(process.cwd(), 'plugins');
    const errors = {};
    
    function scanDir(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (file.endsWith('.js')) {
                const pluginErrors = checkPlugin(fullPath);
                if (pluginErrors.length > 0) {
                    errors[fullPath.replace(pluginsDir, '')] = pluginErrors;
                }
            }
        }
    }
    
    scanDir(pluginsDir);
    
    // فحص سريع للنتائج
    const errorList = await Promise.all(
        Object.entries(errors).map(async ([file, errs]) => {
            const resolved = await errs;
            return { file, errors: resolved };
        })
    );
    
    const realErrors = errorList.filter(e => e.errors.length > 0);
    
    if (realErrors.length === 0) {
        m.react('✅');
        return m.reply('✅ *لا توجد أخطاء في البلوقنات*');
    }
    
    let text = `🔍 *تقرير الأخطاء*\n\n`;
    for (const { file, errors: errs } of realErrors) {
        text += `📄 *${file}*\n`;
        for (const err of errs) {
            text += `  ❌ ${err}\n`;
        }
        text += `\n`;
    }
    
    await m.reply(text);
    m.react('✅');
}

export { pluginConfig as config, handler };