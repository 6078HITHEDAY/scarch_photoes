import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 默认配置
const defaults = {
  // === 频率限制 ===
  cooldown: 10,
  dailyLimit: 50,

  // === Pixiv 代理 ===
  pixivProxy: 'i.pixiv.re',

  // === 下载模式 ===
  downloadMode: false,

  // === R18 控制 ===
  r18Mode: 0,

  // === 发送设置 ===
  maxResults: 5,
  imageSize: 'regular',

  // === API 端点 ===
  endpoints: {
    lolicon:      'https://api.lolicon.app/setu/v2',
    bing:         'https://cn.bing.com/HPImageArchive.aspx',
    pixivRankCN:  'https://pixiv.shojo.cn/api/random',
    pixivRank:    'https://www.pixiv.net/ranking.php',
    tomyMeinv:    'https://api.tomys.top/api/meinvPic',
    tomyFengjing: 'https://api.tomys.top/api/gqbz',
    xiaowaiFj:    'https://api.ixiaowai.cn/gqapi/gqapi.php',
  },

  // === 缓存 TTL (毫秒) ===
  cacheTTL: {
    bing:          3600_000,
    pixivRanking:  1800_000,
  },

  // === 可选 API Key ===
  apiKeys: {
    unsplash: '',
    pexels:   '',
  },
}

/**
 * 从锅巴配置文件加载用户设置，合并到默认配置
 * 锅巴配置文件路径 (相对插件目录):
 *   - ../../../../data/guoba/scarch_photoes/config.json
 *   - ./config.json
 */
function loadUserConfig() {
  const candidates = [
    resolve(__dirname, '../../../../data/guoba/scarch_photoes/config.json'),
    resolve(__dirname, '../config.json'),
  ]

  for (const p of candidates) {
    if (!existsSync(p)) continue
    try {
      const raw = readFileSync(p, 'utf-8')
      const user = JSON.parse(raw)

      // 锅巴写回的 JSON 结构: { key: value, ... }
      // 缓存时间可能是分钟单位，需转换为毫秒
      if (user.bing_cacheMinutes !== undefined) {
        defaults.cacheTTL.bing = user.bing_cacheMinutes * 60_000
      }
      if (user.pixiv_cacheMinutes !== undefined) {
        defaults.cacheTTL.pixivRanking = user.pixiv_cacheMinutes * 60_000
      }

      // 合并顶层标量字段
      for (const k of ['cooldown', 'dailyLimit', 'maxResults', 'r18Mode',
                       'downloadMode', 'imageSize', 'pixivProxy']) {
        if (user[k] !== undefined) defaults[k] = user[k]
      }

      // 合并 API 端点
      if (user.endpoints) {
        Object.assign(defaults.endpoints, user.endpoints)
      }
      // 合并 API Key
      if (user.apiKeys) {
        Object.assign(defaults.apiKeys, user.apiKeys)
      }

      console.log('[scarch_photoes] 已加载配置文件:', p)
      break
    } catch (e) {
      console.warn('[scarch_photoes] 配置文件读取失败:', p, e.message)
    }
  }
}

loadUserConfig()

export const config = defaults
