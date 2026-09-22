// تحويلcjs - أمر لتحويل CommonJS إلى ESM (وحدات ES)

import config from '../../config.js'
import te from '../../src/lib/maro-error.js'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pluginConfig = {
    name: 'تحويلcjs',
    alias: ['cjstoesm'],
    category: 'tools',
    description: 'تحويل CommonJS إلى ESM (وحدات ES)',
    usage: '.تحويلcjs <رد على كود>',
    example: '.تحويلcjs',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

function convertCjsToEsm(code) {
    let result = code

    // 1. const { something } = require('module') → import { something } from 'module'
    result = result.replace(/(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g, (match, imports, path) => {
        const items = imports.split(',').map(i => {
            const parts = i.trim().split(/\s*:\s*/)
            if (parts.length === 2) return `${parts[0].trim()} as ${parts[1].trim()}`
            return parts[0].trim()
        })
        return `import { ${items.join(', ')} } from '${path}';`
    })

    // 2. const name = require('module').prop → import { prop as name } from 'module'
    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\.(\w+)\s*;?/g, (match, name, path, prop) => {
        if (name === prop) return `import { ${prop} } from '${path}';`
        return `import { ${prop} as ${name} } from '${path}';`
    })

    // 3. const name = require('module').default → import name from 'module'
    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\.default\s*;?/g, (match, name, path) => {
        return `import ${name} from '${path}';`
    })

    // 4. const name = require('module') → import name from 'module'
    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g, (match, name, path) => {
        return `import ${name} from '${path}';`
    })

    // 5. require('module') → import 'module'
    result = result.replace(/^require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?$/gm, (match, path) => {
        return `import '${path}';`
    })

    // 6. module.exports = { key: value } → export { value as key }
    result = result.replace(/module\.exports\s*=\s*\{([^}]+)\}\s*;?/g, (match, exports) => {
        const items = exports.split(',').map(i => {
            const parts = i.trim().split(/\s*:\s*/)
            if (parts.length === 2) return `${parts[1].trim()} as ${parts[0].trim()}`
            return parts[0].trim()
        })
        return `export { ${items.join(', ')} };`
    })

    // 7. module.exports = function/class → export default function/class
    result = result.replace(/module\.exports\s*=\s*(async\s+)?(function|class)\s*(\w*)\s*(\([^)]*\))?\s*\{/g, (match, async, type, name, params) => {
        if (name) return `export default ${async || ''}${type} ${name}${params || ''} {`
        return `export default ${async || ''}${type}${params || ''} {`
    })

    // 8. module.exports = (params) => → export default (params) =>
    result = result.replace(/module\.exports\s*=\s*(async\s+)?\(([^)]*)\)\s*=>/g, (match, async, params) => {
        return `export default ${async || ''}(${params}) =>`
    })

    // 9. module.exports = value → export default value
    result = result.replace(/module\.exports\s*=\s*([^;\n]+)\s*;?/g, (match, value) => {
        return `export default ${value};`
    })

    // 10. exports.name = function → export function name
    result = result.replace(/exports\.(\w+)\s*=\s*(async\s+)?function\s*(\w*)\s*(\([^)]*\))?\s*\{/g, (match, exportName, async, name, params) => {
        return `export ${async || ''}function ${exportName}${params || ''} {`
    })

    // 11. exports.name = (params) => {} → export const name = (params) => {}
    result = result.replace(/exports\.(\w+)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>\s*\{/g, (match, exportName, async, params) => {
        return `export const ${exportName} = ${async || ''}(${params}) => {`
    })

    // 12. exports.name = value → export { value as name } or export const
    result = result.replace(/exports\.(\w+)\s*=\s*(\w+)\s*;?/g, (match, key, value) => {
        if (key === value) return `export { ${key} };`
        return `export { ${value} as ${key} };`
    })

    // 13. exports.name = expression → export const name = expression
    result = result.replace(/exports\.(\w+)\s*=\s*([^;\n]+)\s*;?/g, (match, key, value) => {
        if (/^(async|function|\(|class)/.test(value.trim())) return match
        return `export const ${key} = ${value};`
    })

    // 14. module.exports.name = value → export const name = value
    result = result.replace(/module\.exports\.(\w+)\s*=\s*(\w+)\s*;?/g, (match, key, value) => {
        if (key === value) return `export { ${key} };`
        return `export { ${value} as ${key} };`
    })

    // 15. Object.assign(module.exports, require('module')) → export * from 'module'
    result = result.replace(/Object\.assign\s*\(\s*module\.exports\s*,\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\)\s*;?/g, (match, path) => {
        return `export * from '${path}';`
    })

    // 16. __dirname و __filename
    if ((result.includes('__dirname') || result.includes('__filename')) && !result.includes('fileURLToPath')) {
        const helperCode = `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n\n`
        result = helperCode + result
    }

    result = result.replace(/\n{3,}/g, '\n\n')
    return result.trim()
}

async function handler(m, { sock }) {
    let code = m.quotedBody || m.text?.trim()

    if (!code) {
        return m.reply(
            `🔄 *تحويل CJS إلى ESM*\n\n` +
            `> تحويل CommonJS إلى وحدات ES\n\n` +
            `> *طريقة الاستخدام:*\n` +
            `> رد على كود CJS بـ ${m.prefix}تحويلcjs\n\n` +
            `> *مثال CJS:*\n` +
            `> \`const axios = require('axios')\`\n` +
            `> \`module.exports = handler\``
        )
    }

    try {
        const converted = await convertCjsToEsm(code)
        await sock.sendCodeBlock(m.chat, converted, m)
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }