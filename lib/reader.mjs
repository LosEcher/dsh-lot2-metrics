/**
 * dsh-lot2-metrics — lib/reader.mjs
 *
 * 纯函数层（不 import cordis / dsh-tools）：把"项目自产快照"规范化成统一形状。
 * 契约见 dsfolder/CROSS-PROJECT-INTEGRATION-MECHANISM-2026-10-07.md §9（信封 v1）。
 *
 * 四条硬规则（§9 的"消费方必须实现"），每条都有测试：
 *   1. 未知 `v` ⇒ incompatible，**不渲染任何数字**（不猜字段）
 *   2. `ok=false` ⇒ 不给数字（**绝不把上次的值当本次**）
 *   3. 缺字段/类型不符 ⇒ 该块留空并给 reason，**不抛异常**
 *   4. 数字必须可追溯：返回 capturedAt + 来源文件路径
 *
 * 兼容两种形状：
 *   - **信封**：{v, capturedAt, ok, source, notes, metrics[], tables[]}
 *   - **lot2 原生 v=1**：{v, capturedAt, source.endpoint, scrape{ok}, totals{}, queries[], top{}, derived{}}
 *     （由 adaptLot2 映射成信封形状；证明 §9 的"lot2 不用改"）
 */

export const ENVELOPE_VERSION = 1

/** 空结果：所有失败路径都返回它，调用方不必判 null。 */
function emptyResult(reason) {
  return {
    contractVersion: null,
    incompatible: false,
    ok: false,
    stale: null,
    capturedAt: null,
    source: null,
    notes: reason ?? null,
    metrics: [],
    tables: [],
  }
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asNumber(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * lot2 原生 v=1 → 信封形状。
 * 映射表见 §9：queries[] → tables[0]；totals/derived → metrics[]；derived.note → notes。
 */
export function adaptLot2(raw) {
  const totals = isPlainObject(raw.totals) ? raw.totals : {}
  const derived = isPlainObject(raw.derived) ? raw.derived : {}
  const queries = Array.isArray(raw.queries) ? raw.queries : []

  const rows = queries
    .filter(isPlainObject)
    .map((q) => [
      q.operation ?? null,
      q.table ?? null,
      asNumber(q.count),
      asNumber(q.p95Seconds),
      asNumber(q.deltaCount),
      asNumber(q.amplification), // 可能为 null（缺请求计数或 requestsDelta=0）⇒ 原样保留
    ])

  const metrics = []
  const push = (name, value, unit) => {
    const n = asNumber(value)
    if (n !== null) metrics.push({ name, value: n, unit: unit ?? null })
  }
  push('observedSeries', totals.observedSeries, 'series')
  push('histogramLines', totals.histogramLines, 'lines')
  push('httpRequestsTotal', totals.httpRequestsTotal, 'requests')
  push('requestsDelta', derived.requestsDelta, 'requests')

  return {
    v: raw.v,
    capturedAt: raw.capturedAt ?? null,
    ok: isPlainObject(raw.scrape) ? raw.scrape.ok === true : raw.ok === true,
    source: isPlainObject(raw.source) ? raw.source : null,
    // `derived.note` 名字是单数（lot2 契约 §10 明确：固定字段名、两条固定句子、不承载数据）
    // ⇒ 只当"人读提示"透出，**不参与任何判断**。
    notes: typeof derived.note === 'string' ? derived.note : null,
    metrics,
    tables: [{
      name: 'queries',
      columns: ['operation', 'table', 'count', 'p95Seconds', 'deltaCount', 'amplification'],
      rows,
    }],
    _flavor: 'lot2',
  }
}

/** 判断是不是 lot2 原生形状（有 queries/totals/derived/scrape 任一）。 */
export function looksLikeLot2(raw) {
  return isPlainObject(raw) && (
    Array.isArray(raw.queries) || isPlainObject(raw.totals) ||
    isPlainObject(raw.derived) || isPlainObject(raw.scrape)
  )
}

/**
 * 规范化一份已解析的快照。**任何输入都不抛**（规则 3）。
 * @param {unknown} raw
 * @returns normalized result
 */
export function normalizeSnapshot(raw) {
  try {
    if (!isPlainObject(raw)) return emptyResult('snapshot 不是对象')
    const v = raw.v
    if (v !== ENVELOPE_VERSION) {
      // 规则 1：未知契约版本 ⇒ 明说，且不给数字
      return { ...emptyResult(`契约版本不兼容：文件 v=${JSON.stringify(v)}，本插件只认 v=${ENVELOPE_VERSION}`), contractVersion: v == null ? null : v, incompatible: true }
    }

    const base = looksLikeLot2(raw) ? adaptLot2(raw) : {
      v: raw.v,
      capturedAt: raw.capturedAt ?? null,
      ok: raw.ok === true,
      source: isPlainObject(raw.source) ? raw.source : null,
      notes: typeof raw.notes === 'string' ? raw.notes : null,
      metrics: Array.isArray(raw.metrics) ? raw.metrics.filter(isPlainObject) : [],
      tables: Array.isArray(raw.tables) ? raw.tables.filter(isPlainObject) : [],
      _flavor: 'envelope',
    }

    return {
      contractVersion: base.v,
      incompatible: false,
      ok: base.ok === true,
      stale: typeof raw.stale === 'boolean' ? raw.stale : null,
      capturedAt: base.capturedAt,
      source: base.source,
      notes: base.notes,
      // 规则 2：ok=false ⇒ 不给数字（避免"把上次的值当本次"）
      metrics: base.ok === true ? base.metrics : [],
      tables: base.ok === true ? base.tables : [],
      _flavor: base._flavor,
    }
  } catch (error) {
    return emptyResult(`解析快照出错：${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 读文件 + 规范化（注入 readFile 便于测试；不抛）。
 * @returns {Promise<{result: object, path: string}>}
 */
export async function readSnapshotFile(snapshotPath, { readFile } = {}) {
  const reader = readFile ?? (async (p) => {
    const { readFile: rf } = await import('node:fs/promises')
    return rf(p, 'utf8')
  })
  try {
    const text = await reader(snapshotPath)
    return { result: normalizeSnapshot(JSON.parse(text)), path: snapshotPath }
  } catch (error) {
    const code = error && error.code === 'ENOENT' ? '文件不存在' : '读取/解析失败'
    return { result: emptyResult(`${code}：${snapshotPath}（${error instanceof Error ? error.message : String(error)}）`), path: snapshotPath }
  }
}

/** 取某个表的行（缺表 ⇒ []）。 */
export function tableRows(result, name) {
  const t = (result.tables ?? []).find((x) => x?.name === name)
  return Array.isArray(t?.rows) ? t.rows : []
}

export function metricValue(result, name) {
  const m = (result.metrics ?? []).find((x) => x?.name === name)
  return m && typeof m.value === 'number' ? m.value : null
}

/** 按列名取索引（列名→下标），缺列返回 -1。 */
export function columnIndex(result, tableName, column) {
  const t = (result.tables ?? []).find((x) => x?.name === tableName)
  const cols = Array.isArray(t?.columns) ? t.columns : []
  return cols.indexOf(column)
}

/**
 * 查询/排序某个表的行。
 * @param {object} result normalizeSnapshot 的结果
 * @param {{table?: string, operation?: string, filter?: string, sort?: 'count'|'p95Seconds'|'amplification'|'deltaCount', top?: number}} q
 */
export function queryRows(result, q = {}) {
  const tableName = q.table ?? 'queries'
  const rows = tableRows(result, tableName)
  const cols = (result.tables ?? []).find((x) => x?.name === tableName)?.columns ?? []
  const idx = (name) => cols.indexOf(name)
  const iOp = idx('operation')
  const iTable = idx('table')

  let out = rows
  if (typeof q.operation === 'string' && q.operation !== '' && iOp >= 0) {
    out = out.filter((r) => String(r[iOp]) === q.operation)
  }
  if (typeof q.filter === 'string' && q.filter !== '') {
    const needle = q.filter.toLowerCase()
    out = out.filter((r) => r.some((c) => typeof c === 'string' && c.toLowerCase().includes(needle)))
  }
  const sortCol = q.sort ?? 'count'
  const iSort = idx(sortCol)
  if (iSort >= 0) {
    out = [...out].sort((a, b) => {
      const av = typeof a[iSort] === 'number' ? a[iSort] : Number.NEGATIVE_INFINITY
      const bv = typeof b[iSort] === 'number' ? b[iSort] : Number.NEGATIVE_INFINITY
      return bv - av
    })
  }
  const top = Number.isFinite(q.top) && q.top > 0 ? Math.trunc(q.top) : out.length
  return { columns: cols, rows: out.slice(0, top), totalRows: rows.length, table: tableName }
}

/**
 * 汇总（给人/给 status 用）。now/staleSeconds 注入以便测试。
 */
export function summarize({ result, path, now = Date.now(), staleSeconds = 1500, topN = 5 }) {
  const capturedMs = result.capturedAt ? Date.parse(result.capturedAt) : NaN
  const ageSeconds = Number.isFinite(capturedMs) ? Math.max(0, Math.round((now - capturedMs) / 1000)) : null
  const stale = result.ok === true && ageSeconds !== null ? ageSeconds > staleSeconds : true

  const q = queryRows(result, { sort: 'count', top: topN })
  const byAmp = queryRows(result, { sort: 'amplification', top: topN })
  const iAmp = q.columns.indexOf('amplification')
  const amplification = iAmp >= 0
    ? byAmp.rows.filter((r) => typeof r[iAmp] === 'number').slice(0, topN).map((r) => ({
        key: `${r[0]}:${r[1]}`,
        amplification: r[iAmp],
      }))
    : []

  return {
    ok: result.ok === true,
    incompatible: result.incompatible === true,
    stale: Boolean(stale),
    ageSeconds,
    staleSeconds,
    capturedAt: result.capturedAt,
    contractVersion: result.contractVersion,
    flavor: result._flavor ?? null,
    source: result.source,
    notes: result.notes,
    snapshotPath: path,
    queryRows: q.totalRows,
    topByCount: q.rows.map((r) => ({ operation: r[0], table: r[1], count: r[2], p95Seconds: r[3], deltaCount: r[4], amplification: r[5] })),
    topByAmplification: amplification,
    observedSeries: metricValue(result, 'observedSeries'),
    httpRequestsTotal: metricValue(result, 'httpRequestsTotal'),
    requestsDelta: metricValue(result, 'requestsDelta'),
  }
}
