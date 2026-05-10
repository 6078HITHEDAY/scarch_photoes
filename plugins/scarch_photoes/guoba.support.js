// 锅巴面板支持文件
// 在锅巴管理面板中可视化配置插件参数

export const support = {
  /** 插件目录名 */
  name: 'scarch_photoes',
  /** 显示名称 */
  pluginName: '美图插件',
  /** 作者 */
  author: '@myxcat',
  /** 版本 */
  version: '1.0.0',
  /** 简介 */
  description: '多源美图插件 — 二次元、P站、Bing、三次元、风景壁纸',
}

export const config = [
  {
    key: 'cooldown',
    label: '命令间隔(秒)',
    type: 'number',
    default: 10,
    min: 1,
    max: 120,
    hint: '同一用户两次命令之间的最小间隔',
  },
  {
    key: 'dailyLimit',
    label: '每日限额',
    type: 'number',
    default: 50,
    min: 0,
    max: 500,
    hint: '每用户每天最大调用次数，0 = 不限制',
  },
  {
    key: 'maxResults',
    label: '榜单最大张数',
    type: 'number',
    default: 5,
    min: 1,
    max: 10,
    hint: 'P站日榜等列表功能每次发送的张数上限',
  },
  {
    key: 'r18Mode',
    label: 'R18 模式',
    type: 'select',
    default: 0,
    options: [
      { value: 0, label: '完全禁止' },
      { value: 1, label: '仅私聊允许' },
      { value: 2, label: '全场景允许' },
    ],
    hint: 'R18 内容控制策略',
  },
  {
    key: 'downloadMode',
    label: '下载模式',
    type: 'boolean',
    default: false,
    hint: '开启后图片先下载再发送(Buffer)，关闭则直接传URL',
  },
  {
    key: 'imageSize',
    label: '二次元图片尺寸',
    type: 'select',
    default: 'regular',
    options: [
      { value: 'original', label: '原图 (较大)' },
      { value: 'regular', label: '标准 (~1024px)' },
      { value: 'small', label: '小图 (~640px)' },
      { value: 'thumb', label: '缩略图' },
      { value: 'mini', label: '迷你图' },
    ],
    hint: 'Lolicon API 返回的图片尺寸',
  },
  {
    key: 'pixivProxy',
    label: 'Pixiv 图片代理',
    type: 'select',
    default: 'i.pixiv.re',
    options: [
      { value: 'i.pixiv.re', label: 'i.pixiv.re (推荐)' },
      { value: 'i.pixiv.cat', label: 'i.pixiv.cat' },
    ],
    hint: '用于代理被墙的 i.pximg.net 图片',
  },
  {
    key: 'bing_cacheMinutes',
    label: 'Bing 缓存时间(分)',
    type: 'number',
    default: 60,
    min: 5,
    max: 1440,
    hint: 'Bing 每日壁纸的内存缓存时间',
  },
  {
    key: 'pixiv_cacheMinutes',
    label: 'P站榜单缓存时间(分)',
    type: 'number',
    default: 30,
    min: 5,
    max: 1440,
    hint: 'P站日榜数据的内存缓存时间',
  },
]
