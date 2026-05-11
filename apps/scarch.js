import { config } from '../lib/config.js'
import { cooldown } from '../lib/cooldown.js'
import {
  fetchLolicon,
  fetchPixivSearch,
  fetchPixivByTag,
  fetchPixivRanking,
  fetchBing,
  fetchLandscape,
  fetchMeinv,
  fetchJk,
  fetchMeitui,
  downloadImage,
} from '../lib/apis.js'

const HELP_MSG = [
  '=====  美图插件  =====',
  '#美图 / #搜索美图        → 随机二次元美图',
  '#美图 [关键词]           → 搜索二次元图片',
  '#P站搜索 [关键词]        → P站图片搜索',
  '#P站日榜                  → P站每日排行榜',
  '#P站 [标签]              → P站随机作品',
  '#Bing / #Bing壁纸         → Bing 每日壁纸',
  '#三次元 / #美女           → 三次元 cos 美图',
  '#JK / #jk                  → JK 美图',
  '#看看腿                     → 美腿图',
  '#风景                     → 随机风景壁纸',
  '#美图help                 → 显示本菜单',
  '（所有指令均支持 #搜索 前缀）',
  '=========================',
].join('\n')

export class ScarchPhotoes extends plugin {
  constructor() {
    super({
      name: 'scarch_photoes',
      dsc: '美图插件 — 二次元、P站、Bing、三次元、JK、美腿、风景',
      event: 'message',
      priority: 5000,
      rule: [
        { reg: '^#(?:搜索)?美图\\s*(help|帮助|菜单)$', fnc: 'showHelp' },
        { reg: '^#(?:搜索)?(?:Bing|必应)\\s*(?:壁纸|每日壁纸|每日图片)?$', fnc: 'handleBing' },
        { reg: '^#(?:搜索)?P站(日榜|每日榜单|排行)$', fnc: 'handlePixivRanking' },
        { reg: '^#(?:搜索)?P站搜索\\s+(.+)$', fnc: 'handlePixivSearch' },
        { reg: '^#(?:搜索)?P站\\s*(.*)$', fnc: 'handlePixivByTag' },
        { reg: '^#(?:搜索)?美图\\s*(.*)$', fnc: 'handleAnime' },
        { reg: '^#(?:搜索)?二次元\\s*(.*)$', fnc: 'handleAnime' },
        { reg: '^#(?:搜索)?(?:三次元|美女|写真)$', fnc: 'handleRealPerson' },
        { reg: '^#(?:搜索)?[Jj][Kk]$', fnc: 'handleJk' },
        { reg: '^#(?:搜索)?看看腿$', fnc: 'handleMeitui' },
        { reg: '^#(?:搜索)?风景$', fnc: 'handleLandscape' },
      ],
    })
  }

  // ============ 工具方法 ============

  getR18() {
    if (config.r18Mode === 0) return 0
    if (config.r18Mode === 2) return 2
    return this.e.isGroup ? 0 : 2
  }

  async sendImage({ imageUrl, title, author, pid, desc }) {
    const userId = String(this.e.user_id)
    if (!this.e.isMaster) {
      const check = cooldown.check(userId)
      if (!check.allowed) {
        if (check.remaining === 0) return this.e.reply('今日使用次数已用完~')
        return this.e.reply(`冷却中，请 ${check.waitSeconds} 秒后再试~`)
      }
    }

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
    } catch (err) {
      if (!config.downloadMode) {
        try {
          const buf = await downloadImage(imageUrl)
          await this.e.reply([segment.image(buf), caption])
          cooldown.consume(userId)
          return
        } catch (_) {}
      }
      await this.e.reply(`图片发送失败: ${err.message}`)
    }
  }

  async sendMultiImages(list) {
    const userId = String(this.e.user_id)
    if (!this.e.isMaster) {
      const check = cooldown.check(userId)
      if (!check.allowed) {
        if (check.remaining === 0) return this.e.reply('今日使用次数已用完~')
        return this.e.reply(`冷却中，请 ${check.waitSeconds} 秒后再试~`)
      }
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
    } catch (err) {
      await this.e.reply(`图片发送失败: ${err.message}`)
    }
  }

  // ============ 命令处理 ============

  async showHelp() {
    await this.e.reply(HELP_MSG)
    return true
  }

  async handleAnime() {
    const keyword = (this.e.msg.match(/(?:二次元|美图)\s+(.+)/)?.[1] || '').trim()
    const r18 = this.getR18()
    const result = await fetchLolicon({ keyword, r18 })
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage(result.data)
  }

  async handlePixivSearch() {
    const keyword = (this.e.msg.match(/P站搜索\s+(.+)/)?.[1] || '').trim()
    if (!keyword) return this.e.reply('请输入搜索关键词，如: #P站搜索 初音未来')
    const r18 = this.getR18()
    const result = await fetchPixivSearch(keyword, r18)
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage(result.data)
  }

  async handlePixivByTag() {
    const tag = (this.e.msg.match(/P站\s*(.*)/)?.[1] || '').trim()
    const r18 = this.getR18()
    const result = await fetchPixivByTag(tag || null, r18)
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage(result.data)
  }

  async handlePixivRanking() {
    const result = await fetchPixivRanking(config.maxResults)
    if (!result.success) return this.e.reply(result.error)
    return this.sendMultiImages(result.data)
  }

  async handleBing() {
    const result = await fetchBing()
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage({ imageUrl: result.data.uhdUrl, desc: result.data.copyright })
  }

  async handleRealPerson() {
    const result = await fetchMeinv()
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage({ imageUrl: result.data.imageUrl })
  }

  async handleLandscape() {
    const result = await fetchLandscape()
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage({ imageUrl: result.data.imageUrl })
  }

  async handleJk() {
    const result = await fetchJk()
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage({ imageUrl: result.data.imageUrl })
  }

  async handleMeitui() {
    const result = await fetchMeitui()
    if (!result.success) return this.e.reply(result.error)
    return this.sendImage({ imageUrl: result.data.imageUrl })
  }
}
