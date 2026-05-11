import { readFileSync, existsSync, watch } from 'fs'
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
    mnPic:        'https://pic.ltywl.top/mn/pc.php',
    mnPic2:       'https://pic.ltywl.top/mn/pe.php',
    mnSuyanw:     'https://api.suyanw.cn/api/sjmv.php',
    mnKsxjj:      'https://api.suyanw.cn/api/ksxjj.php',
    jk:           'https://api.suyanw.cn/api/jk.php',
    mt:           'https://api.suyanw.cn/api/meitui.php',
    fjSuyanw:     'https://api.suyanw.cn/api/scenery.php',
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

// 原始默认值快照，用于每次 reload 时先还原
const originalDefaults = { ...defaults }

const userFields = ['cooldown', 'dailyLimit', 'maxResults', 'r18Mode',
                    'downloadMode', 'imageSize', 'pixivProxy']

/**
 * 从配置文件加载用户设置，合并到默认配置
 */
function loadUserConfig() {
  // 先还原为原始默认值
  for (const k of userFields) {
    defaults[k] = originalDefaults[k]
  }

  const candidates = [
    resolve(__dirname, '../config.json'),
    resolve(__dirname, '../../../data/guoba/scarch_photoes/config.json'),
  ]

  for (const p of candidates) {
    if (!existsSync(p)) continue
    try {
      const raw = readFileSync(p, 'utf-8')
      const user = JSON.parse(raw)

      const get = (key) => user[PREFIX + key] !== undefined ? user[PREFIX + key] : user[key]

      for (const k of userFields) {
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

// 监听配置文件变化，锅巴保存后自动重载（无需重启）
const primaryCfg = resolve(__dirname, '../config.json')
if (existsSync(primaryCfg)) {
  watch(primaryCfg, () => setTimeout(loadUserConfig, 1000))
} else {
  // 首次使用：监听插件目录，config.json 创建后开始监听
  const pluginDir = resolve(__dirname, '..')
  const dirWatcher = watch(pluginDir, (_, filename) => {
    if (filename === 'config.json' && existsSync(primaryCfg)) {
      setTimeout(loadUserConfig, 1000)
      watch(primaryCfg, () => setTimeout(loadUserConfig, 1000))
      dirWatcher.close()
    }
  })
}

export const config = defaults
