import axios from 'axios'
import { withProviderHealth } from '../lib/maro-provider-health.js'

const TTSEARCH_API = process.env.TIKTOK_SEARCH_API_URL || 'https://api.azbry.com/api/search/ttsearch'
const TTSEARCH_FALLBACK_API = process.env.TIKTOK_SEARCH_FALLBACK_URL || ''
const TTSEARCH_API_KEY = process.env.TIKTOK_SEARCH_API_KEY || ''

function normalizeUrl(url) {
    if (!url || typeof url !== 'string') return null
    const matches = url.match(/https?:\/\//g) || []
    if (matches.length <= 1) return url
    const lastIndex = url.lastIndexOf('http')
    return url.slice(lastIndex)
}

function normalizeNumber(value) {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
}

function normalizeItem(item) {
    const author = typeof item?.author === 'string'
        ? { nickname: item.author, avatar: null }
        : item?.author || {}
    const stats = item?.stats || {}
    return {
        title: item?.title || item?.description || item?.desc || '',
        cover: normalizeUrl(item?.cover || item?.cover_url),
        originCover: normalizeUrl(item?.origin_cover || item?.cover_url),
        link: normalizeUrl(item?.link || item?.video_url || item?.download_url),
        watermarkLink: normalizeUrl(item?.watermark_link || item?.video_wm_url),
        music: normalizeUrl(item?.music || item?.music_url),
        author: {
            nickname: author?.nickname || author?.username || '',
            avatar: normalizeUrl(author?.avatar)
        },
        stats: {
            plays: normalizeNumber(stats?.plays || stats?.views),
            likes: normalizeNumber(stats?.likes),
            comments: normalizeNumber(stats?.comments),
            shares: normalizeNumber(stats?.shares)
        }
    }
}

function normalizeTiktokSearchResponse(data) {
    const result = Array.isArray(data?.result)
        ? data.result
        : Array.isArray(data?.data?.result)
            ? data.data.result
            : []
    const isSuccessful = data?.status === true || data?.statusCode === 200 || data?.success === true
    if (!isSuccessful || result.length === 0) {
        throw new Error(data?.message || data?.error || 'TikTok search failed')
    }
    return result.map(normalizeItem).filter((item) => item.link)
}

function createTiktokSearch({ request = axios.get, primaryUrl = TTSEARCH_API, fallbackUrl = TTSEARCH_FALLBACK_API } = {}) {
    return async function tiktokSearchVideo(query) {
      return withProviderHealth('tiktok-search', async () => {
        const params = { q: query }
        if (TTSEARCH_API_KEY) params.apikey = TTSEARCH_API_KEY
        const endpoints = [primaryUrl, fallbackUrl].filter(Boolean)
        let lastError
        for (const endpoint of endpoints) {
            try {
                const { data } = await request(endpoint, {
                    params,
                    timeout: 30000,
                    headers: {
                        'user-agent': 'Mozilla/5.0'
                    }
                })
                return normalizeTiktokSearchResponse(data)
            } catch (error) {
                lastError = error
            }
        }
        throw lastError || new Error('TikTok search failed')
      })
    }
}

const tiktokSearchVideo = createTiktokSearch()

export { tiktokSearchVideo, normalizeTiktokSearchResponse, createTiktokSearch }
