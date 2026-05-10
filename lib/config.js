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

const PREFIX = 'scarch_photoes.'

/**
 * 从锅巴配置文件加载用户设置，合并到默认配置
 */
function loadUserConfig() {
  const candidates = [
    resolve(__dirname, '../config.json'),
    resolve(__dirname, '../../../data/guoba/scarch_photoes/config.json'),
  ]

  for (const p of candidates) {
    if (!existsSync(p)) continue
    try {
      const raw = readFileSync(p, 'utf-8')
      const user = JSON.parse(raw)

      // 处理锅巴带前缀的 key: scarch_photoes.xxx → xxx
      // 同时也兼容扁平 key (手动编辑 config.json)
      const get = (key) => user[PREFIX + key] !== undefined ? user[PREFIX + key] : user[key]

      // 标量字段
      for (const k of ['cooldown', 'dailyLimit', 'maxResults', 'r18Mode',
                       'downloadMode', 'imageSize', 'pixivProxy']) {
        const v = get(k)
        if (v !== undefined) defaults[k] = v
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
