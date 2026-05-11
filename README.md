# scarch_photoes

TRSS-Yunzai 美图插件 — 二次元、P站、Bing、三次元、JK、美腿、风景壁纸

## 安装

### 锅巴面板安装（推荐）

锅巴面板 → Plugin 插件 → 添加插件 → Git 安装，输入：

```
https://github.com/6078HITHEDAY/scarch_photoes
```

### 手动安装

```bash
cd TRSS-Yunzai/plugins/
git clone https://github.com/6078HITHEDAY/scarch_photoes.git
# 重启 Bot
```

## 命令

所有指令均支持 `#搜索` 前缀（如 `#搜索美图`）。

| 命令 | 说明 |
|------|------|
| `#美图help` | 帮助菜单 |
| `#美图` | 随机二次元美图 |
| `#美图 关键词` | 搜索二次元图片 |
| `#二次元` / `#二次元 关键词` | 同上 |
| `#P站搜索 关键词` | P站关键词搜索 |
| `#P站日榜` | P站每日排行榜 |
| `#P站` / `#P站 标签` | P站随机作品 |
| `#Bing` / `#Bing壁纸` | Bing 每日壁纸 |
| `#三次元` / `#美女` | 三次元美图（多源降级） |
| `#jk` / `#JK` | JK 美图 |
| `#看看腿` | 美腿图 |
| `#风景` | 风景壁纸 |

## 配置

在锅巴面板中可视化修改，或手动编辑 `config.json`（位于插件根目录）：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `cooldown` | 10 | 命令间隔（秒） |
| `dailyLimit` | 50 | 每日每用户上限 |
| `r18Mode` | 0 | 0=禁止 / 1=仅私聊 / 2=全场景 |
| `imageSize` | `regular` | 二次元图片尺寸 (original/regular/small) |
| `maxResults` | 5 | P站日榜每次发送张数 |
| `downloadMode` | false | 图片先下载为 Buffer 再发送 |
| `pixivProxy` | `i.pixiv.re` | Pixiv 图片代理域名 |

## 图源

| 功能 | 图源 | 状态 |
|------|------|------|
| 二次元 / P站 | Lolicon API | ✅ |
| P站日榜 | pixiv.shojo.cn → pixiv.net | ✅ |
| Bing 壁纸 | Bing 官方 | ✅ |
| 美女 / 三次元 | pic.ltywl.top (PC+PE) → suyanw (302) → suyanw (JSON) | ✅ |
| JK 美图 | api.suyanw.cn | ✅ |
| 美腿 | api.suyanw.cn | ✅ |
| 风景 | Bing 每日壁纸 | ✅ |

## 图源降级

每个指令内置多源降级，主源失败自动切换备用：

- **#美女/#三次元**：`pic.ltywl.top/mn/pc.php` → `pe.php` → `api.suyanw.cn/api/sjmv.php` → `api.suyanw.cn/api/ksxjj.php`
- **#风景**：Bing 每日壁纸（唯一可用源）
- **#jk**：`api.suyanw.cn/api/jk.php`
- **#看看腿**：`api.suyanw.cn/api/meitui.php`
