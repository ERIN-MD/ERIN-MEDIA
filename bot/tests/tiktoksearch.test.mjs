import assert from 'node:assert/strict'
import { createTiktokSearch, normalizeTiktokSearchResponse } from '../src/scraper/tiktoksearch.js'

const response = {
  statusCode: 200,
  status: true,
  result: [{
    id: '7670900359270845717',
    title: 'نتيجة اختبار',
    author: 'صاحب الفيديو',
    duration: 20,
    video_url: 'https://www.tikwm.com/video/media/play/7670900359270845717.mp4',
    video_wm_url: 'https://www.tikwm.com/video/media/wmplay/7670900359270845717.mp4',
    music_url: 'https://www.tikwm.com/video/music/7670900359270845717.mp3',
    cover_url: 'https://www.tikwm.com/video/cover/7670900359270845717.webp',
    stats: { views: 100, likes: 12, comments: 3, shares: 4 },
  }],
}

const [item] = normalizeTiktokSearchResponse(response)
assert.equal(item.link, response.result[0].video_url)
assert.equal(item.watermarkLink, response.result[0].video_wm_url)
assert.equal(item.music, response.result[0].music_url)
assert.equal(item.author.nickname, response.result[0].author)
assert.equal(item.stats.plays, 100)

const calls = []
const fallbackSearch = createTiktokSearch({
  primaryUrl: 'https://primary.test/search',
  fallbackUrl: 'https://fallback.test/search',
  request: async (url) => {
    calls.push(url)
    if (url.includes('primary')) throw new Error('primary offline')
    return { data: { status: true, result: [{ title: 'fallback', video_url: 'https://fallback.test/video.mp4' }] } }
  },
})
const fallbackResult = await fallbackSearch('test')
assert.equal(calls.length, 2)
assert.equal(fallbackResult[0].title, 'fallback')
console.log('tiktoksearch response adapter: passed')
