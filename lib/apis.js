import { config } from './config.js'

// === 工具函数 ===

/** 超时 fetch (10s) */
async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10_000)
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } })
    return res
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('请求超时')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

/** 下载图片为 Buffer */
async function downloadImage(url) {
  const res = await fetchWithTimeout(url)
  if (!res.ok) throw new Error(`下载失败: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/** 将 i.pximg.net 替换为代理 */
function proxyPixivUrl(url) {
  return url.replace(/i\.pximg\.net/, config.pixivProxy)
}

// === 简单内存缓存 ===
const cache = new Map()
function cacheGet(key) {
  const entry = cache.get(key)
  if (entry && Date.now() < entry.expire) return entry.data
  cache.delete(key)
  return null
}
function cacheSet(key, data, ttl) {
  cache.set(key, { data, expire: Date.now() + ttl })
}

// === API 调用 ===

/**
 * Lolicon API — 二次元美图 / 关键词搜索 / P站标签
 * @param {{ keyword?: string, tag?: string, r18?: number, num?: number }} opts
 */
export async function fetchLolicon({ keyword, tag, r18 = 0, num = 1 } = {}) {
  try {
    const params = new URLSearchParams({ r18: String(r18), num: String(num), size: config.imageSize })
    if (keyword) params.set('keyword', keyword)
    if (tag) params.set('tag', tag)

    const url = `${config.endpoints.lolicon}?${params}`
    const res = await fetchWithTimeout(url)
    const json = await res.json()

    if (!json.data || json.data.length === 0) {
      return { success: false, error: '未找到相关图片，换一个关键词试试~' }
    }

    const item = json.data[0]
    return {
      success: true,
      data: {
        imageUrl: item.urls[config.imageSize] || item.urls.regular,
        title: item.title,
        author: item.author,
        pid: item.pid,
        tags: item.tags,
        width: item.width,
        height: item.height,
      },
    }
  } catch (e) {
    return { success: false, error: `二次元 API 请求失败: ${e.message}` }
  }
}

/**
 * Pixiv 关键词搜索 (复用 Lolicon)
 */
export async function fetchPixivSearch(keyword, r18 = 0) {
  return fetchLolicon({ keyword, r18 })
}

/**
 * Pixiv 标签随机 (复用 Lolicon)
 */
export async function fetchPixivByTag(tag, r18 = 0) {
  return fetchLolicon({ tag, r18 })
}

/**
 * Bing 每日壁纸
 */
export async function fetchBing() {
  const cached = cacheGet('bing')
  if (cached) return { success: true, data: cached }

  try {
    const url = `${config.endpoints.bing}?format=js&idx=0&n=1&mkt=zh-CN`
    const res = await fetchWithTimeout(url)
    const json = await res.json()

    if (!json.images || json.images.length === 0) {
      return { success: false, error: 'Bing 壁纸获取失败' }
    }

    const img = json.images[0]
    const imageUrl = 'https://cn.bing.com' + img.url
    const data = {
      imageUrl,
      uhdUrl: imageUrl.replace('1920x1080', 'UHD'),
      title: (img.copyright || '').split('(')[0].trim(),
      copyright: img.copyright,
      date: img.enddate || img.startdate,
    }

    cacheSet('bing', data, config.cacheTTL.bing)
    return { success: true, data }
  } catch (e) {
    return { success: false, error: `Bing API 请求失败: ${e.message}` }
  }
}

/**
 * Pixiv 每日榜单
 */
export async function fetchPixivRanking(num = 5) {
  const cached = cacheGet('pixivRanking')
  if (cached) return { success: true, data: cached }

  // 方案A: pixiv.shojo.cn 社区反代
  try {
    const url = `${config.endpoints.pixivRankCN}?type=pc&sex=0&format=json&num=${num}`
    const res = await fetchWithTimeout(url)
    const json = await res.json()

    if (json.code === 200 && json.data?.length) {
      const list = json.data.slice(0, num).map(item => ({
        imageUrl: item.url,
        title: item.title,
        author: item.user_name,
        pid: item.illust_id,
        rank: item.rank,
      }))
      cacheSet('pixivRanking', list, config.cacheTTL.pixivRanking)
      return { success: true, data: list }
    }
  } catch (_) { /* 降级到方案B */ }

  // 方案B: Pixiv 官方 ranking + 手动代理
  try {
    const rankUrl = `${config.endpoints.pixivRank}?mode=daily&p=1&format=json`
    const res = await fetchWithTimeout(rankUrl)
    const json = await res.json()

    if (json.contents?.length) {
      const list = json.contents.slice(0, num).map(item => ({
        imageUrl: proxyPixivUrl(item.url),
        title: item.title,
        author: item.user_name,
        pid: item.illust_id,
        rank: item.rank,
        width: item.width,
        height: item.height,
      }))
      cacheSet('pixivRanking', list, config.cacheTTL.pixivRanking)
      return { success: true, data: list }
    }
  } catch (e) {
    return { success: false, error: `P站榜单获取失败: ${e.message}` }
  }

  return { success: false, error: 'P站榜单暂时不可用，请稍后再试' }
}

/**
 * 美女图片 (pic.ltywl.top → suyanw 降级)
 */
export async function fetchMeinv() {
  // 主图源: pic.ltywl.top (直接返回图片)
  for (const url of [config.endpoints.mnPic, config.endpoints.mnPic2]) {
    try {
      const res = await fetchWithTimeout(url)
      const ct = res.headers.get('content-type') || ''
      res.body?.cancel()
      if (ct.startsWith('image/')) {
        return { success: true, data: { imageUrl: url, source: 'ltywl' } }
      }
      console.warn('[scarch_photoes] 图源非图片响应:', url, ct)
    } catch (e) {
      console.warn('[scarch_photoes] 图源请求失败:', url, e.message)
    }
  }

  // 备用: suyanw (302 重定向到图片)
  try {
    const res = await fetchWithTimeout(config.endpoints.mnSuyanw, { redirect: 'manual' })
    const location = res.headers.get('location') || ''
    if (location) {
      return { success: true, data: { imageUrl: location, source: 'suyanw' } }
    }
    console.warn('[scarch_photoes] suyanw 图源无重定向地址')
  } catch (e) {
    console.warn('[scarch_photoes] suyanw 图源请求失败:', e.message)
  }

  // 备用: suyanw ksxjj (JSON 返回 imgurl)
  try {
    const res = await fetchWithTimeout(`${config.endpoints.mnKsxjj}?return=json`)
    const json = await res.json()
    if (json.imgurl) {
      return { success: true, data: { imageUrl: json.imgurl, source: 'suyanw' } }
    }
    console.warn('[scarch_photoes] ksxjj 返回异常:', JSON.stringify(json))
  } catch (e) {
    console.warn('[scarch_photoes] ksxjj 请求失败:', e.message)
  }

  return { success: false, error: '美女图源暂时不可用' }
}

/**
 * 风景壁纸 (suyanw → Bing 降级)
 */
export async function fetchLandscape() {
  // 主图源: suyanw (JSON 返回 imgurl)
  try {
    const res = await fetchWithTimeout(`${config.endpoints.fjSuyanw}?return=json`)
    const json = await res.json()
    if (json.imgurl) {
      return { success: true, data: { imageUrl: json.imgurl, source: 'suyanw' } }
    }
    console.warn('[scarch_photoes] scenery 返回异常:', JSON.stringify(json))
  } catch (e) {
    console.warn('[scarch_photoes] scenery 请求失败:', e.message)
  }

  // 降级: Bing 每日壁纸
  const bingResult = await fetchBing()
  if (bingResult.success) {
    return { success: true, data: { imageUrl: bingResult.data.uhdUrl || bingResult.data.imageUrl, source: 'bing' } }
  }
  return { success: false, error: '风景图源暂时不可用' }
}

/**
 * JK 美图 (api.suyanw.cn)
 */
export async function fetchJk() {
  try {
    const url = config.endpoints.jk
    const res = await fetchWithTimeout(url)
    const ct = res.headers.get('content-type') || ''
    res.body?.cancel()
    if (ct.startsWith('image/')) {
      return { success: true, data: { imageUrl: url, source: 'suyanw' } }
    }
    return { success: false, error: 'JK 图源返回异常' }
  } catch (e) {
    return { success: false, error: `JK API 请求失败: ${e.message}` }
  }
}

/**
 * 美腿 (api.suyanw.cn)
 */
export async function fetchMeitui() {
  try {
    const res = await fetchWithTimeout(`${config.endpoints.mt}?type=json`)
    const json = await res.json()
    if (json.text) {
      return { success: true, data: { imageUrl: json.text, source: 'suyanw' } }
    }
    return { success: false, error: '美腿图源返回异常' }
  } catch (e) {
    return { success: false, error: `美腿 API 请求失败: ${e.message}` }
  }
}

export { downloadImage }
