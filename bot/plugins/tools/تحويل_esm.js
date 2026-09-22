// تحويل_esm - أمر لتحويل ESM (وحدات ES) إلى CommonJS

import te from '../../src/lib/maro-error.js'
import config from '../../config.js'

const pluginConfig = {
    name: 'تحويل_esm',
    alias: ['esmtocjs'],
    category: 'tools',
    description: 'تحويل ESM (وحدات ES) إلى CommonJS',
    usage: '.تحويل_esm <رد على كود>',
    example: '.تحويل_esm',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

function convertEsmToCjs(code) {
    let result = code
    const exportedItems = []
    let hasDefaultExport = false
    let defaultExportValue = null

    // import def, { named } from 'module'
    result = result.replace(/import\s+(\w+)\s*,\s*\{\s*([^}]+)\s*\}\s*from\s+['"]([^'"]+)['"]\s*;?/g, (m, def, named, path) => {
        const items = named.split(',').map(i => i.trim()).join(', ')
        return `const ${def} = require('${path}')\nconst { ${items} } = require('${path}')`
    })

    // import def from 'module'
    result = result.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, (m, name, path) => {
        return `const ${name} = require('${path}')`
    })

    // import { named } from 'module'
    result = result.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s+['"]([^'"]+)['"]\s*;?/g, (m, imports, path) => {
        const items = imports.split(',').map(i => {
            const parts = i.trim().split(/\s+as\s+/)
            if (parts.length === 2) return `${parts[0]}: ${parts[1]}`
            return parts[0]
        })
        return `const { ${items.join(', ')} } = require('${path}')`
    })

    // import * as name from 'module'
    result = result.replace(/import\s*\*\s*as\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, (m, name, path) => {
        return `const ${name} = require('${path}')`
    })

    // import 'module'
    result = result.replace(/import\s+['"]([^'"]+)['"]\s*;?/g, (m, path) => {
        return `require('${path}')`
    })

    // export default name
    result = result.replace(/export\s+default\s+(\w+)\s*;?/g, (m, name) => {
        hasDefaultExport = true
        defaultExportValue = name
        return ''
    })

    // export default function/class
    result = result.replace(/export\s+default\s+(function|class|async\s+function)\s*(\w*)\s*(\([^)]*\))?\s*\{/g, (m, type, name, params) => {
        hasDefaultExport = true
        if (name) {
            defaultExportValue = name
            return `${type} ${name}${params || ''} {`
        }
        defaultExportValue = '__default__'
        return `const __default__ = ${type}${params || ''} {`
    })

    // export default { ... }
    result = result.replace(/export\s+default\s+(\{[\s\S]*?\})\s*;?/g, (m, obj) => {
        hasDefaultExport = true
        defaultExportValue = obj
        return ''
    })

    // export { ... }
    result = result.replace(/export\s*\{\s*([^}]+)\s*\}\s*;?/g, (m, exports) => {
        exports.split(',').forEach(i => {
            const parts = i.trim().split(/\s+as\s+/)
            if (parts.length === 2) {
                exportedItems.push({ name: parts[0], alias: parts[1] })
            } else {
                exportedItems.push({ name: parts[0], alias: null })
            }
        })
        return ''
    })

    // export const/let/var
    result = result.replace(/export\s+(const|let|var)\s+(\w+)\s*=/g, (m, type, name) => {
        exportedItems.push({ name, alias: null })
        return `${type} ${name} =`
    })

    // export function
    result = result.replace(/export\s+(async\s+)?function\s+(\w+)/g, (m, async, name) => {
        exportedItems.push({ name, alias: null })
        return `${async || ''}function ${name}`
    })

    // export class
    result = result.replace(/export\s+class\s+(\w+)/g, (m, name) => {
        exportedItems.push({ name, alias: null })
        return `class ${name}`
    })

    // export * from 'module'
    result = result.replace(/export\s*\*\s*from\s+['"]([^'"]+)['"]\s*;?/g, (m, path) => {
        return `Object.assign(module.exports, require('${path}'))`
    })

    let exportCode = ''

    if (hasDefaultExport) {
        exportCode += `\nmodule.exports = ${defaultExportValue}`
    }

    if (exportedItems.length > 0) {
        const items = exportedItems.map(e => e.alias ? `${e.alias}: ${e.name}` : e.name).join(', ')
        exportCode += hasDefaultExport
            ? `\nmodule.exports = { ...module.exports, ${items} }`
            : `\nmodule.exports = { ${items} }`
    }

    result = result.trim() + exportCode
    result = result.replace(/\n{3,}/g, '\n\n')

    return result
}

async function handler(m, { sock }) {
    let code = m.quotedBody || m.text?.trim()

    if (!code) {
        return m.reply(
            `🔄 *تحويل ESM إلى CJS*\n\n` +
            `> تحويل وحدات ES إلى CommonJS\n\n` +
            `> *طريقة الاستخدام:*\n` +
            `> رد على كود ESM بـ ${m.prefix}تحويل_esm\n\n` +
            `> *مثال ESM:*\n` +
            `> \`import axios from 'axios'\`\n` +
            `> \`export default function() {}\``
        )
    }

    try {
        await sock.sendCodeBlock(m.chat, convertEsmToCjs(code), m)
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }