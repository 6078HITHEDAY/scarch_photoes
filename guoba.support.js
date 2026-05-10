import { config } from './lib/config.js'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = resolve(__dirname, 'config.json')

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
          field: 'scarch_photoes.cooldown',
          label: '命令间隔(秒)',
          bottomHelpMessage: '同一用户两次命令间的最小间隔',
          component: 'InputNumber',
          componentProps: { min: 1, max: 120, placeholder: '10' },
        },
        {
          field: 'scarch_photoes.dailyLimit',
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
          field: 'scarch_photoes.r18Mode',
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
          field: 'scarch_photoes.imageSize',
          label: '图片尺寸',
          bottomHelpMessage: '二次元图片的尺寸选择',
          component: 'Select',
          componentProps: {
            options: [
              { value: 'original', label: '原图 (较大)' },
              { value: 'regular', label: '标准 (~1024px)' },
              { value: 'small', label: '小图 (~640px)' },
            ],
          },
        },
        {
          field: 'scarch_photoes.maxResults',
          label: '榜单最大张数',
          bottomHelpMessage: 'P站日榜每次发送的张数上限',
          component: 'InputNumber',
          componentProps: { min: 1, max: 10, placeholder: '5' },
        },

        {
          label: '高级设置',
          component: 'SOFT_GROUP_BEGIN',
        },
        {
          field: 'scarch_photoes.downloadMode',
          label: '下载模式',
          bottomHelpMessage: '开启后图片先下载为 Buffer 再发送',
          component: 'Switch',
        },
        {
          field: 'scarch_photoes.pixivProxy',
          label: 'Pixiv 代理',
          bottomHelpMessage: '用于代理被墙的 i.pximg.net 图片',
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
        return {
          'scarch_photoes.cooldown': config.cooldown,
          'scarch_photoes.dailyLimit': config.dailyLimit,
          'scarch_photoes.r18Mode': config.r18Mode,
          'scarch_photoes.imageSize': config.imageSize,
          'scarch_photoes.maxResults': config.maxResults,
          'scarch_photoes.downloadMode': config.downloadMode,
          'scarch_photoes.pixivProxy': config.pixivProxy,
        }
      },

      setConfigData (data, { Result }) {
        try {
          writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8')
          return Result.ok({}, '保存成功，重启 Bot 后生效')
        } catch (e) {
          return Result.error({}, '保存失败: ' + e.message)
        }
      },
    },
  }
}
