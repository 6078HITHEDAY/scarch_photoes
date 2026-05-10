import { config } from './config.js'

export class CooldownManager {
  constructor(cooldownSec, dailyLimit) {
    this.cooldownMs = (cooldownSec ?? config.cooldown) * 1000
    this.dailyLimit = dailyLimit ?? config.dailyLimit
    this.users = new Map()
  }

  /**
   * 检查用户是否可执行命令
   * @param {string} userId
   * @param {boolean} isMaster
   * @returns {{ allowed: boolean, waitSeconds?: number, remaining?: number }}
   */
  check(userId, isMaster = false) {
    if (isMaster) return { allowed: true }

    const now = Date.now()
    const today = new Date().toDateString()
    let entry = this.users.get(userId)

    if (!entry || entry.date !== today) {
      return { allowed: true, remaining: this.dailyLimit }
    }

    // 日限额检查
    if (entry.count >= this.dailyLimit) {
      return { allowed: false, waitSeconds: 0, remaining: 0 }
    }

    // 间隔检查
    const elapsed = now - entry.lastTime
    if (elapsed < this.cooldownMs) {
      return {
        allowed: false,
        waitSeconds: Math.ceil((this.cooldownMs - elapsed) / 1000),
        remaining: this.dailyLimit - entry.count,
      }
    }

    return { allowed: true, remaining: this.dailyLimit - entry.count }
  }

  /**
   * 记录一次使用
   */
  consume(userId) {
    const now = Date.now()
    const today = new Date().toDateString()
    let entry = this.users.get(userId)

    if (!entry || entry.date !== today) {
      this.users.set(userId, { count: 1, lastTime: now, date: today })
    } else {
      entry.count++
      entry.lastTime = now
    }
  }

  /**
   * 清理 48 小时未活动的条目
   */
  cleanup() {
    const cutoff = Date.now() - 48 * 3600_000
    for (const [id, entry] of this.users) {
      if (entry.lastTime < cutoff) this.users.delete(id)
    }
  }
}

// 单例
export const cooldown = new CooldownManager()

// 定时清理，使用 unref 避免阻止进程退出
const timer = setInterval(() => cooldown.cleanup(), 3600_000)
timer.unref()
