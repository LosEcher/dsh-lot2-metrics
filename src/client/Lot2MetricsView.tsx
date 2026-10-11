/**
 * dsh-lot2-metrics — 'lot2 指标' conversation tab.
 *
 * 数据来自 host 半的只读端点 `GET /plugins/dsh-lot2-metrics/snapshot`
 * （与 status 同源，都是 summarize() 的结果），按 60s 轮询 + 手动刷新。
 *
 * 四条契约语义在 UI 上必须**看得见**（不是只写在文档里）：
 *   - 未知 v ⇒ 显示"契约不兼容"，**不渲染任何数字**
 *   - ok=false ⇒ 显示"采集失败"，**不渲染任何数字**（绝不拿旧值顶替）
 *   - 缺字段/无快照 ⇒ 显示"无快照"，不崩
 *   - 每个数字都能追溯到 capturedAt + 快照路径（页脚常显）
 *
 * 主题：只用 --dsw-alias-* 令牌；状态徽章按对比度铁律（tertiary 底 +
 * color-mix 字 + StateDot 非颜色编码）。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import type { StateDotState } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './Lot2MetricsView.module.css'
import { NS } from './locales.ts'

/** host 端点返回的形状（summarize() + collector）。 */
export interface SnapshotSummary {
  ok: boolean
  incompatible: boolean
  stale: boolean
  ageSeconds: number | null
  staleSeconds: number
  capturedAt: string | null
  contractVersion: number | null
  flavor: string | null
  snapshotPath: string
  queryRows: number
  topByCount: Array<{
    operation: string | null
    table: string | null
    count: number | null
    p95Seconds: number | null
    deltaCount: number | null
    amplification: number | null
  }>
  topByAmplification: Array<{ key: string; amplification: number }>
  observedSeries: number | null
  httpRequestsTotal: number | null
  requestsDelta: number | null
  notes: string | null
  // ── 运行期（2026-10-11 快照兼容扩展）─────────────────────────────────────
  runtimePresent: boolean
  /** value=null + reason = "算不出来/没上报"，必须显示成 — 并给出原因，不能省略。 */
  runtimeMetrics: Array<{ name: string; value: number | null; unit: string | null; reason: string | null }>
  /** 采集器声明了但 /metrics 没上报的名字（缺失≠0）。 */
  unknownMetrics: string[]
  /** 阈值结论来自采集器落盘的状态——面板**不重判**（单一真源）。 */
  thresholds: Array<{ name: string | null; breached: boolean; value: number | null; detail: string | null }>
  thresholdsEvaluatedAt: string | null
  collector: {
    verdict: string | null
    consecutiveFailures: number | null
    lastRunAt: string | null
    lastFailReason: string | null
    faultSince: string | null
    degraded: boolean
  } | null
}

const REFRESH_MS = 60_000

function fmtNum(v: number | null | undefined, digits = 0): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  return Number.isInteger(v) && digits === 0 ? String(v) : v.toFixed(digits)
}

/** 字节数只做人类可读换算（快照里本身就是字节；不换算会看不出量级）。 */
function fmtBytes(v: number | null): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—'
  const mib = v / 1048576
  return mib >= 1 ? `${mib.toFixed(1)} MiB` : `${(v / 1024).toFixed(0)} KiB`
}

function fmtAge(seconds: number | null): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}m`
}

/** props 上理论上有 t（locale: NS 注册时注入）；缺失时退化为 zh，保证不崩。 */
type Props = ConvViewProps & { t?: (key: string) => string }

const FALLBACK: Record<string, string> = {
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
  'view.thresholds': '阈值',
  'view.runtime': '运行期',
  'view.unknown': '未上报',
  'view.unknownNote': '采集器声明了但 /metrics 没有这一项——缺失不等于 0',
  'view.thrBreached': '越界',
  'view.thrOk': '正常',
  'view.thrNoData': '无数据',
  'view.thrNotEvaluated': '阈值未评估（读不到采集器状态）',
  'view.thrAt': '判定于',
  'view.degraded': '后端在退化',
  'view.failReason': '失败类别',
  'view.col.metric': '指标',
  'view.col.value': '值',
  'view.col.note': '说明',
  'view.incompatibleNotice': '快照声明的契约版本本插件不认识，因此拒绝解读（不显示任何数字是刻意设计）。',
  'view.failedNotice': '本次抓取失败。刻意不给数字——把上一次的值当成本次显示，正是契约明令禁止的失效模式。',
}

export function Lot2MetricsView(props: Props) {
  const t = useCallback((key: string) => props.t?.(key) ?? FALLBACK[key] ?? key, [props])
  const [data, setData] = useState<SnapshotSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch(`/plugins/${NS}/snapshot`, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json() as SnapshotSummary)
      setError(null)
    } catch (err) {
      // 端点不可用 ≠ 数据不可用：明确区分，避免把"读不到"显示成"没有"
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void load()
    timer.current = setInterval(() => { void load() }, REFRESH_MS)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [load])

  const state: { dot: StateDotState; cls: string; label: string } = (() => {
    if (!data) return { dot: 'idle', cls: css.badgeIdle, label: error ? t('view.noData') : t('view.loading') }
    if (data.incompatible) return { dot: 'error', cls: css.badgeError, label: t('view.incompatible') }
    if (!data.ok) return { dot: 'error', cls: css.badgeError, label: t('view.failed') }
    if (data.stale) return { dot: 'warning', cls: css.badgeWarn, label: t('view.stale') }
    return { dot: 'done', cls: css.badgeDone, label: t('view.fresh') }
  })()

  return (
    <div className={css.wrap}>
      <div className={css.header}>
        <span className={css.title}>{t('view.title')}</span>
        <span className={`${css.badge} ${state.cls}`}>
          <StateDot state={state.dot} size={8} />
          {state.label}
        </span>
        {data && (
          <>
            <span className={css.pill}>
              {t('view.captured')}{' '}
              <span className={css.mono} title={data.capturedAt ?? ''}>
                {data.ageSeconds === null ? '—' : `${fmtAge(data.ageSeconds)} ago`}
              </span>
            </span>
            <span className={`${css.pill} ${css.pillDim}`}>{t('view.contract')} v{fmtNum(data.contractVersion)}</span>
            <span className={`${css.pill} ${css.pillDim}`}>{t('view.rows')} {fmtNum(data.queryRows)}</span>
            {data.collector && (
              <span className={`${css.pill} ${css.pillDim}`}>
                {t('view.collector')} <span className={css.mono}>{data.collector.verdict ?? '—'}</span>
                {typeof data.collector.consecutiveFailures === 'number' && data.collector.consecutiveFailures > 0
                  ? ` ×${data.collector.consecutiveFailures}`
                  : ''}
              </span>
            )}
            {/* 失败分类（A1）：'credential-invalid' 与 'unreachable' 的动作完全不同，
                面板必须原样透出类别，而不是笼统地显示"采集失败"。 */}
            {data.collector?.lastFailReason && (
              <span className={`${css.pill} ${css.pillDim}`}>
                {t('view.failReason')} <span className={css.mono}>{data.collector.lastFailReason}</span>
              </span>
            )}
          </>
        )}
        <button type="button" className={css.refresh} onClick={() => { void load() }} disabled={busy}>
          {t('view.refresh')}
        </button>
      </div>

      {!data && error && (
        <div className={`${css.notice} ${css.noticeError}`}>
          <span>读不到 host 端点：{error}</span>
          <span className={css.mono}>{`/plugins/${NS}/snapshot`}</span>
        </div>
      )}

      {data?.incompatible && (
        <div className={`${css.notice} ${css.noticeError}`}>
          <span>{t('view.incompatibleNotice')}</span>
          {data.notes && <span>{data.notes}</span>}
        </div>
      )}

      {data && !data.incompatible && !data.ok && (
        <div className={`${css.notice} ${css.noticeError}`}>
          <span>{t('view.failedNotice')}</span>
          {data.notes && <span>{data.notes}</span>}
        </div>
      )}

      {data && data.ok && !data.incompatible && (
        <>
          {/* 阈值：判定只由采集器做一次并落盘（单一真源），本面板只显示结论。
              三种状态必须能区分：越界 / 查过没事 / 查了但没数据（value=null）。 */}
          <div className={css.section}>
            <span className={css.sectionTitle}>{t('view.thresholds')}</span>
            {data.thresholds.length === 0
              ? <span className={css.pillDim}>{t('view.thrNotEvaluated')}</span>
              : (
                <div className={css.thrList}>
                  {data.thresholds.map((thr, i) => {
                    const noData = thr.value === null
                    const dot: StateDotState = thr.breached ? 'error' : (noData ? 'idle' : 'done')
                    const label = thr.breached ? t('view.thrBreached') : (noData ? t('view.thrNoData') : t('view.thrOk'))
                    const cls = thr.breached ? css.badgeError : (noData ? css.badgeIdle : css.badgeDone)
                    return (
                      <div className={css.thrItem} key={`${thr.name ?? 'thr'}:${i}`}>
                        <span className={`${css.badge} ${cls}`}>
                          <StateDot state={dot} size={8} />
                          {label}
                        </span>
                        <span className={css.thrName}>{thr.name ?? '—'}</span>
                        <span className={css.thrDetail} title={thr.detail ?? ''}>{thr.detail ?? ''}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            {data.thresholdsEvaluatedAt && (
              <span className={css.pillDim}>{t('view.thrAt')} <span className={css.mono}>{data.thresholdsEvaluatedAt}</span></span>
            )}
          </div>

          {/* 运行期 gauge / 比值：value=null 显示 — 并把 reason 放在 title 与说明列（不省略） */}
          {data.runtimePresent && (
            <div className={css.section}>
              <span className={css.sectionTitle}>{t('view.runtime')}</span>
              <div className={css.tableWrap}>
                <table className={css.table}>
                  <thead>
                    <tr>
                      <th>{t('view.col.metric')}</th>
                      <th className={css.num}>{t('view.col.value')}</th>
                      <th>{t('view.col.note')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.runtimeMetrics.map((m) => (
                      <tr key={m.name}>
                        <td className={css.mono}>{m.name}</td>
                        <td className={css.num} title={m.reason ?? ''}>
                          {m.value === null
                            ? '—'
                            : `${fmtNum(m.value, m.unit === 'ratio' ? 4 : 0)}${m.unit === 'bytes' ? ` (${fmtBytes(m.value)})` : ''}`}
                        </td>
                        <td className={css.pillDim}>{m.reason ?? (m.unit ?? '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.unknownMetrics.length > 0 && (
                <span className={css.pillDim}>
                  {t('view.unknown')}: <span className={css.mono}>{data.unknownMetrics.join(', ')}</span>
                  {' — '}{t('view.unknownNote')}
                </span>
              )}
            </div>
          )}

          <div className={css.section}>
            <span className={css.sectionTitle}>{t('view.topByCount')}</span>
            <div className={css.tableWrap}>
              <table className={css.table}>
                <thead>
                  <tr>
                    <th>{t('view.col.operation')}</th>
                    <th>{t('view.col.table')}</th>
                    <th className={css.num}>{t('view.col.count')}</th>
                    <th className={css.num}>{t('view.col.delta')}</th>
                    <th className={css.num}>{t('view.col.p95')}</th>
                    <th className={css.num}>{t('view.col.amp')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topByCount.map((r, i) => (
                    <tr key={`${r.operation}:${r.table}:${i}`}>
                      <td className={css.mono}>{r.operation ?? '—'}</td>
                      <td className={css.mono}>{r.table ?? '—'}</td>
                      <td className={css.num}>{fmtNum(r.count)}</td>
                      <td className={css.num}>{fmtNum(r.deltaCount)}</td>
                      <td className={css.num}>{fmtNum(r.p95Seconds, 3)}s</td>
                      <td className={css.num}>{fmtNum(r.amplification, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.topByAmplification.length > 0 && (
            <div className={css.section}>
              <span className={css.sectionTitle}>{t('view.topByAmp')}</span>
              <div className={css.tableWrap}>
                {data.topByAmplification.map((r) => (
                  <div className={css.ampRow} key={r.key}>
                    <span className={css.ampKey} title={r.key}>{r.key}</span>
                    <span className={css.ampValue}>{fmtNum(r.amplification, 2)}×</span>
                  </div>
                ))}
              </div>
              <span className={css.pillDim}>{t('view.ampHint')}</span>
            </div>
          )}
        </>
      )}

      <div className={css.footer}>
        {data?.notes && <span>{data.notes}</span>}
        <span>{t('view.approx')}</span>
        <span className={css.path} title={data?.snapshotPath ?? ''}>
          {t('view.snapshot')}: {data?.snapshotPath ?? '—'}
        </span>
      </div>
    </div>
  )
}
