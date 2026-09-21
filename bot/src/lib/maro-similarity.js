async function levenshteinDistance(str1, str2) {
    const m = str1.length
    const n = str2.length
    
    if (m === 0) return n
    if (n === 0) return m
    
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            )
        }
    }
    
    return dp[m][n]
}

function damerauLevenshteinDistance(str1, str2) {
    const m = str1.length
    const n = str2.length
    
    if (m === 0) return n
    if (n === 0) return m
    
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            )
            
            if (i > 1 && j > 1 && str1[i - 1] === str2[j - 2] && str1[i - 2] === str2[j - 1]) {
                dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost)
            }
        }
    }
    
    return dp[m][n]
}

function jaroWinklerSimilarity(str1, str2) {
    if (str1 === str2) return 1.0
    
    const len1 = str1.length
    const len2 = str2.length
    
    if (len1 === 0 || len2 === 0) return 0.0
    
    const matchWindow = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0)
    
    const matches1 = new Array(len1).fill(false)
    const matches2 = new Array(len2).fill(false)
    
    let matches = 0
    let transpositions = 0
    
    for (let i = 0; i < len1; i++) {
        const start = Math.max(0, i - matchWindow)
        const end = Math.min(i + matchWindow + 1, len2)
        
        for (let j = start; j < end; j++) {
            if (matches2[j] || str1[i] !== str2[j]) continue
            matches1[i] = true
            matches2[j] = true
            matches++
            break
        }
    }
    
    if (matches === 0) return 0.0
    
    let k = 0
    for (let i = 0; i < len1; i++) {
        if (!matches1[i]) continue
        while (!matches2[k]) k++
        if (str1[i] !== str2[k]) transpositions++
        k++
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3
    
    let prefix = 0
    for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
        if (str1[i] === str2[i]) prefix++
        else break
    }
    
    return jaro + prefix * 0.1 * (1 - jaro)
}

function nGramSimilarity(str1, str2, n = 2) {
    if (!str1 || !str2) return 0
    if (str1 === str2) return 1
    
    const getNGrams = (str, n) => {
        const grams = new Set()
        const padded = ' '.repeat(n - 1) + str + ' '.repeat(n - 1)
        for (let i = 0; i < padded.length - n + 1; i++) {
            grams.add(padded.substring(i, i + n))
        }
        return grams
    }
    
    const grams1 = getNGrams(str1, n)
    const grams2 = getNGrams(str2, n)
    
    let intersection = 0
    for (const gram of grams1) {
        if (grams2.has(gram)) intersection++
    }
    
    const union = grams1.size + grams2.size - intersection
    return union === 0 ? 0 : intersection / union
}

function tokenSortRatio(str1, str2) {
    const sorted1 = str1.toLowerCase().split(/\s+/).sort().join(' ')
    const sorted2 = str2.toLowerCase().split(/\s+/).sort().join(' ')
    return getSimilarity(sorted1, sorted2)
}

function getSimilarity(str1, str2) {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
    const maxLen = Math.max(str1.length, str2.length)
    if (maxLen === 0) return 1
    return 1 - distance / maxLen
}

function getAdvancedSimilarity(str1, str2) {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()
    
    const levenshtein = getSimilarity(s1, s2)
    const jaroWinkler = jaroWinklerSimilarity(s1, s2)
    const ngram2 = nGramSimilarity(s1, s2, 2)
    const ngram3 = nGramSimilarity(s1, s2, 3)
    
    const combined = (levenshtein * 0.3) + (jaroWinkler * 0.35) + (ngram2 * 0.2) + (ngram3 * 0.15)
    
    return Math.min(1, combined)
}

function getMatchType(inputLower, cmdLower) {
    if (cmdLower === inputLower) return { type: 'exact', score: 1.0, emoji: '✅', label: 'متطابق تماماً' }
    const isShortCmd = cmdLower.length < 3
    const isLongInput = inputLower.length > 3
    if (cmdLower.startsWith(inputLower)) return { type: 'prefix', score: 0.95, emoji: '🎯', label: 'تطابق في البداية' }
    if (inputLower.startsWith(cmdLower)) {
        if (isShortCmd && isLongInput) return null 
        return { type: 'contains', score: 0.9, emoji: '📌', label: 'الأمر أقصر' }
    }
    if (cmdLower.includes(inputLower)) return { type: 'substring', score: 0.85, emoji: '🔗', label: 'جزء من الأمر' }
    if (inputLower.includes(cmdLower)) {
        if (isShortCmd && isLongInput) return null
        return { type: 'reverse-substring', score: 0.8, emoji: '📎', label: 'الأمر موجود في الإدخال' }
    }
    return null
}

function findSimilarCommands(input, commands, options = {}) {
    const {
        maxResults = 5,
        minSimilarity = 0.2,
        maxDistance = 6,
        useAdvanced = true
    } = options
    
    const inputLower = (input && typeof input === 'string') ? input.toLowerCase().trim() : ''
    const results = []
    const seen = new Set()
    
    if (!inputLower || !Array.isArray(commands) || commands.length === 0) return []

    for (const cmd of commands) {
        if (!cmd || typeof cmd !== 'string' || seen.has(cmd)) continue
        seen.add(cmd)
        const cmdLower = cmd.toLowerCase()
        
        const directMatch = getMatchType(inputLower, cmdLower)
        if (directMatch) {
            results.push({
                command: cmd,
                similarity: directMatch.score,
                distance: Math.abs(cmd.length - input.length),
                type: directMatch.type,
                emoji: directMatch.emoji,
                reason: directMatch.label,
                reasonEn: directMatch.type
            })
            continue
        }
        
        const distance = damerauLevenshteinDistance(inputLower, cmdLower)
        const similarity = useAdvanced ? getAdvancedSimilarity(inputLower, cmdLower) : getSimilarity(inputLower, cmdLower)
        
        let bonus = 0
        if (cmdLower[0] === inputLower[0]) bonus += 0.12
        if (cmdLower.slice(0, 2) === inputLower.slice(0, 2)) bonus += 0.08
        if (cmdLower.slice(0, 3) === inputLower.slice(0, 3)) bonus += 0.05
        
        if (cmdLower.includes(inputLower.slice(0, Math.ceil(inputLower.length / 2)))) {
            bonus += 0.1
        }
        
        const consonants1 = cmdLower.replace(/[aeiou\u0621-\u063A\u0641-\u064A]/g, '')
        const consonants2 = inputLower.replace(/[aeiou\u0621-\u063A\u0641-\u064A]/g, '')
        if (consonants1 === consonants2 && consonants1.length > 2) bonus += 0.15
        
        const finalSimilarity = Math.min(1, Math.max(0, similarity + bonus))
        
        if (distance <= maxDistance || finalSimilarity >= minSimilarity) {
            let reason = 'متشابه'
            let reasonEn = 'Similar'
            let emoji = '🔍'
            
            if (distance === 1) {
                const transposed = inputLower.length === cmdLower.length && 
                    levenshteinDistance(inputLower, cmdLower) === 2 &&
                    damerauLevenshteinDistance(inputLower, cmdLower) === 1
                if (transposed) {
                    reason = 'حروف متبادلة'
                    reasonEn = 'Transposed letters'
                    emoji = '🔄'
                } else {
                    reason = 'خطأ في حرف واحد'
                    reasonEn = 'One character typo'
                    emoji = '✏️'
                }
            } else if (distance === 2) {
                reason = 'خطأ في حرفين'
                reasonEn = 'Two character typos'
                emoji = '📝'
            } else if (finalSimilarity >= 0.85) {
                reason = 'متشابه جداً'
                reasonEn = 'Very similar'
                emoji = '⭐'
            } else if (finalSimilarity >= 0.7) {
                reason = 'متشابه إلى حد ما'
                reasonEn = 'Quite similar'
                emoji = '💫'
            } else if (finalSimilarity >= 0.5) {
                reason = 'متشابه نوعاً ما'
                reasonEn = 'Somewhat similar'
                emoji = '🌟'
            } else if (finalSimilarity >= 0.3) {
                reason = 'متشابه قليلاً'
                reasonEn = 'Slightly similar'
                emoji = '✨'
            }
            
            results.push({
                command: cmd,
                similarity: finalSimilarity,
                distance,
                type: 'similar',
                emoji,
                reason,
                reasonEn
            })
        }
    }
    
    results.sort((a, b) => {
        if (Math.abs(b.similarity - a.similarity) > 0.05) return b.similarity - a.similarity
        if (b.type !== a.type) {
            const typePriority = { exact: 0, prefix: 1, contains: 2, substring: 3, 'reverse-substring': 4, similar: 5 }
            return typePriority[a.type] - typePriority[b.type]
        }
        return a.distance - b.distance
    })
    
    return results.slice(0, maxResults)
}

function createProgressBar(percent, length = 10) {
    const filled = Math.round(percent / (100 / length))
    const empty = length - filled
    
    const gradientFill = ['█', '▓', '▒']
    const fillChar = percent >= 75 ? gradientFill[0] : percent >= 50 ? gradientFill[1] : gradientFill[2]
    
    return fillChar.repeat(filled) + '░'.repeat(empty)
}

function toSmallCaps(text) {
    const smallCaps = {
        a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ",
        i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
        q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
        y: "ʏ", z: "ᴢ",
    };
    return String(text).toLowerCase().split("").map((c) => smallCaps[c] || c).join("");
}

function toMathBold(text) {
    const map = {
        A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇",
        I: "𝐈", J: "𝐉", K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏",
        Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓", U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗",
        Y: "𝐘", Z: "𝐙",
    };
    return String(text).split("").map((c) => map[c] || c).join("");
}

function formatSuggestionMessage(inputCommand, suggestions, prefix = '.', m) {
    if (!Array.isArray(suggestions) || suggestions.length === 0) return null;

    const topMatch = suggestions[0];
    const topPercent = Math.round((topMatch.similarity || 0) * 100);
    const suggestedCommand = `${prefix}${topMatch.command}`;
    const menuCommand = `${prefix}menu`;
    const userName = m?.pushName || "مستخدم";
    const confidence = topPercent >= 85
        ? { text: "عالي جداً", emoji: "🟢" }
        : topPercent >= 70
            ? { text: "عالي", emoji: "🟡" }
            : topPercent >= 50
                ? { text: "متوسط", emoji: "🟠" }
                : { text: "منخفض", emoji: "🔴" };

    const footer = [
        `*╭━━${toMathBold("M A R O   B O T")}━━━°⃟𑁁⚡*`,
        toSmallCaps(`> °⃟𑁁⚡ مرحباً: ${userName}`),
        toSmallCaps(`> °⃟𑁁⚡ بحثت عن: ${inputCommand}`),
        toSmallCaps(`> °⃟𑁁⚡ أفضل تطابق: ${suggestedCommand}`),
        toSmallCaps(`> °⃟𑁁⚡ التطابق: ${topPercent}% ${confidence.emoji}`),
        `*╰━━${toMathBold("S U G G E S T")}━━°⃟𑁁⚡*`,
        "",
        toSmallCaps("_الأمر غير موجود، جرب أحد الاقتراحات أدناه ↓_"),
    ].join("\n");

    return {
        message: "",
        footer,
        confidence: topPercent,
        confidenceLevel: confidence.text,
        topCommand: suggestedCommand,
        topSuggestion: topMatch,
        buttons: [
            {
                buttonId: suggestedCommand,
                buttonText: { displayText: `✦ تنفيذ ${suggestedCommand}` },
                type: 1,
            },
            {
                buttonId: menuCommand,
                buttonText: { displayText: "⌂ فتح القائمة" },
                type: 1,
            },
        ],
    };
}

function formatSuggestionButtons(inputCommand, suggestions, prefix = '.') {
    if (suggestions.length === 0) return []
    
    return suggestions.slice(0, 10).map((s, i) => {
        const matchPercent = Math.round(s.similarity * 100)
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
        
        return {
            header: `${medal} ${prefix}${s.command}`,
            title: `${s.emoji} ${s.reason} • ${matchPercent}% تطابق`,
            description: 'انقر لتنفيذ الأمر',
            id: `${prefix}${s.command}`
        }
    })
}

function createSuggestionResponse(inputCommand, suggestions, prefix = '.', userInfo = {}) {
    const data = formatSuggestionMessage(inputCommand, suggestions, prefix, userInfo)
    const buttons = formatSuggestionButtons(inputCommand, suggestions, prefix)
    
    return {
        ...(data || { message: '', footer: '', buttons: [] }),
        buttons,
        hasSuggestions: suggestions.length > 0,
        topSuggestion: suggestions[0] || null,
        confidence: suggestions[0] ? Math.round(suggestions[0].similarity * 100) : 0
    }
}

function fuzzyMatch(input, commands, threshold = 0.3) {
    return findSimilarCommands(input, commands, { minSimilarity: threshold, useAdvanced: true, maxResults: 10 })
        .filter(r => r.similarity >= threshold)
}

export { levenshteinDistance, damerauLevenshteinDistance, jaroWinklerSimilarity, nGramSimilarity, tokenSortRatio, getSimilarity, getAdvancedSimilarity, findSimilarCommands, formatSuggestionMessage, formatSuggestionButtons, createSuggestionResponse, createProgressBar, fuzzyMatch }