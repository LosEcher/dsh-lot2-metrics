/**
 * dsh-lot2-metrics — locale dictionaries.
 *
 * 跟随 DSH shell 的语言：`ctx.locale.register` 同时上两份字典，host 按当前设置取。
 * 协议/产品名词（lot2、p95、amplification、contractV）两种语言都保留原文——
 * 它们是字段名，翻译只会造成漂移。
 */

export const NS = 'dsh-lot2-metrics'

/** English dictionary; the key set every other dictionary mirrors. */
const en = {
  'view.tab': 'lot2 metrics',
  'view.title': 'lot2 database metrics',
  'view.fresh': 'fresh',
  'view.stale': 'STALE',
  'view.failed': 'scrape failed',
  'view.incompatible': 'contract incompatible',
  'view.noData': 'no snapshot',
  'view.loading': 'loading…',
  'view.captured': 'captured',
  'view.contract': 'contract',
  'view.rows': 'rows',
  'view.collector': 'collector',
  'view.amps': 'amplification',
  'view.refresh': 'refresh',
  'view.topByCount': 'Top by calls',
  'view.topByAmp': 'Top by amplification',
  'view.ampHint': 'calls delta ÷ request delta for the same window; — means no denominator',
  'view.col.operation': 'operation',
  'view.col.table': 'table',
  'view.col.count': 'count',
  'view.col.delta': 'Δ',
  'view.col.p95': 'p95≈',
  'view.col.amp': 'amp',
  'view.approx': 'p95≈ is linearly interpolated from histogram buckets (approximate)',
  'view.snapshot': 'snapshot',
  'view.incompatibleNotice': 'The snapshot declares a contract version this plugin does not understand, so it refuses to interpret it (no numbers are shown on purpose).',
  'view.failedNotice': 'This scrape failed. Numbers are withheld on purpose — showing the previous values as if they were current is exactly the failure mode the contract forbids.',
}

/** 中文（本部署 shell 的默认语言）。 */
const zh: Record<keyof typeof en, string> = {
  'view.tab': 'lot2 指标',
  'view.title': 'lot2 数据库指标',
  'view.fresh': '新鲜',
  'view.stale': '已过期',
  'view.failed': '采集失败',
  'view.incompatible': '契约不兼容',
  'view.noData': '无快照',
  'view.loading': '加载中…',
  'view.captured': '采集于',
  'view.contract': '契约',
  'view.rows': '行数',
  'view.collector': '采集器',
  'view.amps': '放大倍数',
  'view.refresh': '刷新',
  'view.topByCount': '调用量 Top',
  'view.topByAmp': '放大倍数 Top',
  'view.ampHint': '同期（该表调用增量 ÷ 请求增量）；— 表示缺分母',
  'view.col.operation': '操作',
  'view.col.table': '表',
  'view.col.count': '次数',
  'view.col.delta': 'Δ',
  'view.col.p95': 'p95≈',
  'view.col.amp': '放大',
  'view.approx': 'p95≈ 由直方图桶线性插值得到，是近似值',
  'view.snapshot': '快照',
  'view.incompatibleNotice': '快照声明的契约版本本插件不认识，因此拒绝解读（不显示任何数字是刻意设计）。',
  'view.failedNotice': '本次抓取失败。刻意不给数字——把上一次的值当成本次显示，正是契约明令禁止的失效模式。',
}

export type Lot2MetricsKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-lot2-metrics': Lot2MetricsKey
  }
}

export { en, zh }
