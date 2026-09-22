import axios from "axios"
import * as cheerio from "cheerio"
import te from "../../src/lib/maro-error.js"

// ═══════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════
async function searchMovies(query) {
    const res = await axios.post(
        "https://movieku.rest/wp-admin/admin-ajax.php",
        `action=ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`,
        {
            headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest" },
            timeout: 30000
        }
    )
    return res.data?.post?.[0]?.all || []
}

async function getMovieDetail(movieUrl) {
    const res = await axios.get(movieUrl, { timeout: 30000 })
    const $ = cheerio.load(res.data)

    const title = $("h1").first().text().trim()
    const synopsis = $(".entry-content p").first().text().trim()
    const poster = $('img[src*="wp-content/uploads"]').first().attr("src")

    const detail = {}
    $("ul li").each((_, el) => {
        const text = $(el).text().trim()
        if (text.startsWith("Genre:")) detail.genre = $(el).find("a").map((_, a) => $(a).text()).get().join(", ")
        if (text.startsWith("Release:")) detail.release = text.replace("Release:", "").trim()
        if (text.startsWith("Duration:")) detail.duration = text.replace("Duration:", "").trim()
        if (text.startsWith("Director:")) detail.director = $(el).find("a").first().text().trim()
        if (text.startsWith("Quality:")) detail.quality = text.replace("Quality:", "").trim()
        if (text.startsWith("Score:")) detail.score = text.replace("Score:", "").trim()
        if (text.startsWith("Stars:")) detail.stars = $(el).find("a").map((_, a) => $(a).text()).get().join(", ")
    })

    const downloads = {}
    $("strong").each((_, el) => {
        const label = $(el).text().trim()
        if (["1080p", "720p", "480p", "360p"].includes(label)) {
            downloads[label] = {}
            $(el).parent().find("a").each((_, a) => {
                downloads[label][$(a).text().trim()] = $(a).attr("href")
            })
        }
    })

    return { title, poster, synopsis, ...detail, downloads }
}

function formatDownloads(downloads) {
    if (!downloads || Object.keys(downloads).length === 0) return ""
    let txt = `\n🔽 *روابط التحميل*\n\n`
    const qualities = ["1080p", "720p", "480p", "360p"]
    for (const q of qualities) {
        if (!downloads[q]) continue
        const links = Object.entries(downloads[q])
        if (links.length === 0) continue
        txt += `📀 *${q}*\n`
        for (const [server, url] of links) txt += `- ${server}: ${url}\n`
        txt += `\n`
    }
    return txt
}

// ═══════════════════════════════════════════════
// ⚙️ إعدادات الأمر
// ═══════════════════════════════════════════════
const pluginConfig = {
    name: "فلم",
    alias: ["movieku"],
    category: "search",
    description: "بحث عن أفلام مع روابط التحميل",
    usage: ".فلم <اسم الفيلم>",
    example: ".فلم avengers",
    isOwner: false, isPremium: false, isGroup: false, isPrivate: false,
    cooldown: 10, energi: 1, isEnabled: true
}

// ═══════════════════════════════════════════════
// 🎬 دالة المعالجة
// ═══════════════════════════════════════════════
async function handler(m, { sock }) {
    const query = m.text?.trim()

    if (!query) {
        return m.reply(`🎬 *فلم*\n\n📌 مثال: \`${m.prefix}فلم avengers\``)
    }

    m.react("🔍")

    try {
        const movies = await searchMovies(query)

        if (!movies || movies.length === 0) {
            m.react("❌")
            return m.reply(`❌ لم يتم العثور على: *${query}*`)
        }

        const movie = movies[0]
        const detail = await getMovieDetail(movie.post_link)

        let txt = `🎬 *${detail.title || movie.post_title || query.toUpperCase()}*\n\n`

        if (detail.synopsis) {
            const synopsisText = detail.synopsis.length > 500 ? detail.synopsis.substring(0, 497) + "..." : detail.synopsis
            txt += `📝 *القصة:*\n${synopsisText}\n\n`
        }

        txt += `📋 *تفاصيل*\n\n`
        if (detail.genre) txt += `🎭 النوع: *${detail.genre}*\n`
        if (detail.release) txt += `📅 الإصدار: *${detail.release}*\n`
        if (detail.duration) txt += `⏱️ المدة: *${detail.duration}*\n`
        if (detail.quality) txt += `📺 الجودة: *${detail.quality}*\n`
        if (detail.director) txt += `🎬 المخرج: *${detail.director}*\n`
        if (detail.stars) txt += `🌟 النجوم: *${detail.stars}*\n`

        txt += formatDownloads(detail.downloads)
        txt += `🔗 ${movie.post_link}`

        m.react("✅")

        const poster = detail.poster || movie.post_image
        if (poster) {
            await sock.sendMessage(m.chat, { image: { url: poster }, caption: txt }, { quoted: m })
        } else {
            await m.reply(txt)
        }

    } catch (error) {
        m.react("❌")
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }