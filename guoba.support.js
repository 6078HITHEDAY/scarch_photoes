import { writeFileSync, existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = resolve(__dirname, 'config.json')

// 默认值（和 lib/config.js 保持一致）
const defaults = {
  cooldown: 10,
  dailyLimit: 50,
  r18Mode: 0,
  imageSize: 'regular',
  maxResults: 5,
  downloadMode: false,
  pixivProxy: 'i.pixiv.re',
}

function readConfig() {
  try {
    if (existsSync(configPath)) {
      const saved = JSON.parse(readFileSync(configPath, 'utf-8'))
      return { ...defaults, ...saved }
    }
  } catch (_) {}
  return { ...defaults }
}

const PREFIX = 'scarch_photoes.'

export function supportGuoba () {
  return {
    pluginInfo: {
      name: 'scarch_photoes',
      title: '美图插件',
      description: '多源美图 — 二次元、P站、Bing、三次元、风景壁纸',
      author: '@myxcat',
      link: 'https://github.com/6078HITHEDAY/scarch_photoes',
      isV3: true,
      isV2: false,
      showInMenu: 'auto',
    },

    configInfo: {
      schemas: [
        {
          label: '频率限制',
          component: 'SOFT_GROUP_BEGIN',
        },
        {
          field: `${PREFIX}cooldown`,
          label: '命令间隔(秒)',
          bottomHelpMessage: '同一用户两次命令间的最小间隔',
          component: 'InputNumber',
          componentProps: { min: 1, max: 120, placeholder: '10' },
        },
        {
          field: `${PREFIX}dailyLimit`,
          label: '每日限额',
          bottomHelpMessage: '每用户每天最大调用次数，0 = 不限制',
          component: 'InputNumber',
          componentProps: { min: 0, max: 500, placeholder: '50' },
        },

        {
          label: '内容设置',
          component: 'SOFT_GROUP_BEGIN',
        },
        {
          field: `${PREFIX}r18Mode`,
          label: 'R18 模式',
          bottomHelpMessage: 'R18 内容控制策略',
          component: 'Select',
          componentProps: {
            options: [
              { value: 0, label: '完全禁止' },
              { value: 1, label: '仅私聊允许' },
              { value: 2, label: '全场景允许' },
            ],
          },
        },
        {
          field: `${PREFIX}imageSize`,
          label: '图片尺寸',
          bottomHelpMessage: '二次元图片质量',
          component: 'Select',
          componentProps: {
            options: [
              { value: 'original', label: '原图' },
              { value: 'regular', label: '标准 (~1024px)' },
              { value: 'small', label: '小图 (~640px)' },
            ],
          },
        },
        {
          field: `${PREFIX}maxResults`,
          label: '榜单显示张数',
          bottomHelpMessage: 'P站日榜每次发送张数',
          component: 'InputNumber',
          componentProps: { min: 1, max: 10, placeholder: '5' },
        },

        {
          label: '高级',
          component: 'SOFT_GROUP_BEGIN',
        },
        {
          field: `${PREFIX}downloadMode`,
          label: '下载模式',
          bottomHelpMessage: '开启后图片先下载再发送(Buffer)',
          component: 'Switch',
        },
        {
          field: `${PREFIX}pixivProxy`,
          label: 'Pixiv 代理',
          bottomHelpMessage: '替换 i.pximg.net 的代理域名',
          component: 'Select',
          componentProps: {
            options: [
              { value: 'i.pixiv.re', label: 'i.pixiv.re (推荐)' },
              { value: 'i.pixiv.cat', label: 'i.pixiv.cat' },
            ],
          },
        },
      ],

      getConfigData () {
        const cfg = readConfig()
        return {
          [`${PREFIX}cooldown`]: cfg.cooldown,
          [`${PREFIX}dailyLimit`]: cfg.dailyLimit,
          [`${PREFIX}r18Mode`]: cfg.r18Mode,
          [`${PREFIX}imageSize`]: cfg.imageSize,
          [`${PREFIX}maxResults`]: cfg.maxResults,
          [`${PREFIX}downloadMode`]: cfg.downloadMode,
          [`${PREFIX}pixivProxy`]: cfg.pixivProxy,
        }
      },

      setConfigData (data, { Result }) {
        try {
          // 去掉前缀，写入扁平 key
          const flat = {}
          for (const [k, v] of Object.entries(data)) {
            flat[k.replace(PREFIX, '')] = v
          }
          writeFileSync(configPath, JSON.stringify(flat, null, 2), 'utf-8')
          return Result.ok({}, '保存成功，重启 Bot 后生效')
        } catch (e) {
          return Result.error({}, '保存失败: ' + e.message)
        }
      },
    },
  }
}
