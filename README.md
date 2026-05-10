# scarch_photoes

TRSS-Yunzai 美图插件 — 二次元、P站、Bing、三次元、风景壁纸

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

| 命令 | 说明 |
|------|------|
| `#美图` | 帮助菜单 |
| `#美图 关键词` | 搜索二次元图片 |
| `#二次元` / `#二次元 关键词` | 随机/搜索二次元 |
| `#P站搜索 关键词` | P站关键词搜索 |
| `#P站日榜` | P站每日排行榜 |
| `#P站` / `#P站 标签` | P站随机作品 |
| `#Bing壁纸` | Bing 每日壁纸 |
| `#三次元` | cos 美图 |
| `#风景` | 风景壁纸 |

## 配置

在锅巴面板中可视化修改，或手动编辑 `lib/config.js`：

- `cooldown` — 命令间隔，默认 10 秒
- `dailyLimit` — 每日每用户上限，默认 50 次
- `r18Mode` — 0=禁止 / 1=仅私聊 / 2=全场景
- `imageSize` — 图片尺寸 (original/regular/small/thumb/mini)
- `downloadMode` — 图片先下载为 Buffer 再发送

## 图源

| 功能 | API |
|------|-----|
| 二次元 | Lolicon |
| P站日榜 | pixiv.shojo.cn / pixiv.net |
| Bing 壁纸 | Bing 官方 |
| 三次元 | TomyJan |
| 风景 | TomyJan / 小歪 |
