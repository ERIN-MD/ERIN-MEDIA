// ═══════════════════════════════════════════════
// 📁 src/scraper/shinigami.js
// 📚 Shinigami Scraper
// ═══════════════════════════════════════════════

class ShinigamiClass {
  constructor() {
    this.apiBase = 'https://api.shngm.io/v1'
    this.exploreBase = 'https://explore.shngm.io/v1'
    this.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }

  async fetchApi(endpoint) {
    const response = await fetch(endpoint, { headers: this.headers })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  }

  buildQuery(params) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value)
      }
    }
    return query.toString()
  }

  async getHome() { return this.fetchApi(`${this.exploreBase}/web`) }

  async search(options = {}) {
    const params = { page: 1, page_size: 24, ...options }
    return this.fetchApi(`${this.apiBase}/manga/list?${this.buildQuery(params)}`)
  }

  async getMangaDetail(mangaId) { return this.fetchApi(`${this.apiBase}/manga/detail/${mangaId}`) }

  async getChapterList(mangaId, page = 1, pageSize = 24) {
    const params = { page, page_size: pageSize, sort_by: 'chapter_number', sort_order: 'desc' }
    return this.fetchApi(`${this.apiBase}/chapter/${mangaId}/list?${this.buildQuery(params)}`)
  }

  async getChapterDetail(chapterId) { return this.fetchApi(`${this.apiBase}/chapter/detail/${chapterId}`) }

  async getRecommendations(format, page = 1) {
    return this.search({ format: format.toLowerCase(), is_recommended: true, sort: 'latest', sort_order: 'desc', page })
  }

  async getLatestUpdate(page = 1) { return this.search({ sort: 'latest', sort_order: 'desc', page }) }
}

export default ShinigamiClass
export { ShinigamiClass }