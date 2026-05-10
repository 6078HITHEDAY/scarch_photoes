import plugin from '../../lib/plugin/plugin.js'
import { segment } from 'icqq'
import { config } from './lib/config.js'
import { cooldown } from './lib/cooldown.js'
import {
  fetchLolicon,
  fetchPixivSearch,
  fetchPixivByTag,
  fetchPixivRanking,
  fetchBing,
  fetchRealPerson,
  fetchLandscape,
  downloadImage,
} from './lib/apis.js'

// 帮助信息
const HELP_MSG = [
  '=====  美图插件  =====',
  '#美图            → 随机二次元美图',
  '#美图 [关键词]    → 搜索二次元图片',
  '#P站搜索 [关键词] → P站图片搜索',
  '#P站日榜          → P站每日排行榜',
  '#P站 [标签]      → P站随机作品',
  '#Bing壁纸         → Bing 每日壁纸',
  '#三次元           → 三次元 cos 美图',
  '#风景             → 随机风景壁纸',
  '#美图 help        → 显示本菜单',
  '=======================',
].join('\n')

export default class ScarchPhotoes extends plugin {
  constructor() {
    super({
      name: 'scarch_photoes',
      dsc: '美图插件 — 二次元、P站、Bing、三次元、风景壁纸',
      event: 'message',
      priority: 5000,
      rule: [
        // === 帮助 ===
        { reg: '^#?美图\\s*(help|帮助|菜单|\\?)?$', fnc: 'showHelp' },
        // === 美图搜索 ===
        { reg: '^#?美图\\s+(.+)$', fnc: 'handleAnime' },

        // === Bing 壁纸 ===
        { reg: '^#?(Bing|必应)\\s*(壁纸|每日壁纸|每日图片)?$', fnc: 'handleBing' },

        // === P站日榜 ===
        { reg: '^#?P站(日榜|每日榜单|每日排行|排行)$', fnc: 'handlePixivRanking' },
        // P站搜索 (必须先于 P站标签)
        { reg: '^#?P站搜索\\s+(.+)$', fnc: 'handlePixivSearch' },
        // P站标签随机
        { reg: '^#?P站\\s*(.*)$', fnc: 'handlePixivByTag' },

        // === 三次元 ===
        { reg: '^#?(三次元|美女|真人|写真)\\s*(.*)$', fnc: 'handleRealPerson' },

        // === 风景 ===
        { reg: '^#?风景\\s*(.*)$', fnc: 'handleLandscape' },

        // === 二次元美图 (兜底，放最后) ===
        { reg: '^#?二次元\\s*(.*)$', fnc: 'handleAnime' },
      ],
    })
  }

  // ==================== 辅助方法 ====================

  /** 解析 R18 参数 (根据配置和上下文) */
  getR18() {
    if (config.r18Mode === 0) return 0
    if (config.r18Mode === 2) return 2
    // r18Mode === 1: 仅私聊
    return this.e.isGroup ? 0 : 2
  }

  /** 统一冷却检查 + 发送图片 */
  async sendImage({ imageUrl, title, author, pid, desc }) {
    const userId = String(this.e.user_id)
    const isMaster = !!this.e.isMaster
    const check = cooldown.check(userId, isMaster)

    if (!check.allowed) {
      if (check.remaining === 0) {
        return this.e.reply('今日使用次数已用完~')
      }
      return this.e.reply(`冷却中，请 ${check.waitSeconds} 秒后再试~`)
    }

    // 构造文字
    const textParts = []
    if (title) textParts.push(`标题: ${title}`)
    if (author) textParts.push(`画师: ${author}`)
    if (pid) textParts.push(`PID: ${pid}`)
    if (desc) textParts.push(desc)
    const caption = textParts.length ? '\n' + textParts.join('\n') : ''

    try {
      if (config.downloadMode) {
        const buf = await downloadImage(imageUrl)
        await this.e.reply([segment.image(buf), caption])
      } else {
        await this.e.reply([segment.image(imageUrl), caption])
      }
      cooldown.consume(userId)
    } catch (e) {
      // URL 方式失败时尝试下载发送
      if (!config.downloadMode) {
        try {
          const buf = await downloadImage(imageUrl)
          await this.e.reply([segment.image(buf), caption])
          cooldown.consume(userId)
          return true
        } catch (_) { /* 双重失败 */ }
      }
      await this.e.reply(`图片发送失败: ${e.message}`)
    }
    return true
  }

  /** 发送多张图片 */
  async sendMultiImages(list) {
    const userId = String(this.e.user_id)
    const isMaster = !!this.e.isMaster
    const check = cooldown.check(userId, isMaster)
    if (!check.allowed) {
      if (check.remaining === 0) return this.e.reply('今日使用次数已用完~')
      return this.e.reply(`冷却中，请 ${check.waitSeconds} 秒后再试~`)
    }

    const msgs = [`共 ${list.length} 张:\n`]
    for (const item of list) {
      msgs.push(segment.image(item.imageUrl))
      const meta = []
      if (item.title) meta.push(`标题: ${item.title}`)
      if (item.author) meta.push(`画师: ${item.author}`)
      if (item.rank) meta.push(`第${item.rank}名`)
      msgs.push(meta.join(' | ') + '\n')
    }

    try {
      await this.e.reply(msgs)
      cooldown.consume(userId)
    } catch (e) {
      await this.e.reply(`图片发送失败: ${e.message}`)
    }
    return true
  }

  // ==================== 命令处理 ====================

  /** 帮助菜单 */
  async showHelp() {
    await this.e.reply(HELP_MSG)
    return true
  }

  /** 二次元美图 (随机 / 关键词搜索) */
  async handleAnime() {
    const keyword = (this.e.msg.match(/(?:二次元|美图)\s+(.+)/)?.[1] || '').trim()
    const r18 = this.getR18()
    const result = await fetchLolicon({ keyword, r18 })
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage(result.data)
  }

  /** P站关键词搜索 */
  async handlePixivSearch() {
    const keyword = (this.e.msg.match(/P站搜索\s+(.+)/)?.[1] || '').trim()
    if (!keyword) return this.e.reply('请输入搜索关键词，如: #P站搜索 初音未来')
    const r18 = this.getR18()
    const result = await fetchPixivSearch(keyword, r18)
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage(result.data)
  }

  /** P站标签随机 */
  async handlePixivByTag() {
    const tag = (this.e.msg.match(/P站\s*(.*)/)?.[1] || '').trim()
    const r18 = this.getR18()
    const result = await fetchPixivByTag(tag || null, r18)
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage(result.data)
  }

  /** P站每日榜单 */
  async handlePixivRanking() {
    const result = await fetchPixivRanking(config.maxResults)
    if (!result.success) return this.e.reply(result.error)
    return this.sendMultiImages(result.data)
  }

  /** Bing 每日壁纸 */
  async handleBing() {
    const result = await fetchBing()
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage({
      imageUrl: result.data.uhdUrl,
      desc: result.data.copyright,
    })
  }

  /** 三次元美女 */
  async handleRealPerson() {
    const result = await fetchRealPerson('cos')
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage({ imageUrl: result.data.imageUrl })
  }

  /** 风景壁纸 */
  async handleLandscape() {
    const result = await fetchLandscape()
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage({ imageUrl: result.data.imageUrl })
  }
}
