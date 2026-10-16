/**
 * history.test.mjs — `lib/history.mjs`（按天历史读取器）的四条继承语义 + 只读断言。
 *
 * 台账条目：`duckdb-landing:dsplugins:lot2-metrics-history-tool`
 *
 * 为什么这四条夹具是**继承语义**而不是随便挑的：采集器把"这一刻采到了什么"写成一行，
 * 而下游读它的人必须对**四种坏形状**都有确定行为，否则历史读取会以三种方式骗人：
 *   · 坏 JSON      → 抛异常 ⇒ 整个历史读不到（把"有 10 天数据"报成"没有数据"）
 *   · 缺文件       → 同上
 *   · ok=false     → 把采集失败的那一瞬当成正常数字（**最坏**：静默的假数据）
 *   · 未知契约版本 → 按已知版本解释它（数字照出，含义已变）
 *
 * 只读断言单独一条：本模块**只**能调注入的 readdir/readFile，不写盘、不联网、不抓 /metrics。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readHistory, dayOf, KNOWN_CONTRACT_VERSIONS } from '../lib/history.mjs'

const DIR = '/fake/lot2-metrics'

/** 造一个内存 IO：files = { 'snapshot-YYYYMMDD.jsonl': '<内容>' }。 */
function memIo(files, { unreadable = [] } = {}) {
  const calls = { readdir: 0, readFile: [], write: 0, fetch: 0 }
  return {
    calls,
    readdir: async (dir) => {
      calls.readdir += 1
      assert.equal(dir, DIR)
      return Object.keys(files)
    },
    readFile: async (path) => {
      calls.readFile.push(path)
      const name = path.split('/').pop()
      if (unreadable.includes(name)) {
        const e = new Error(`ENOENT: no such file or directory, open '${path}'`)
        e.code = 'ENOENT'
        throw e
      }
      assert.ok(name in files, `测试里没有这个文件：${name}`)
      return files[name]
    },
  }
}

const good = (capturedAt, table, count, extra = {}) =>
  JSON.stringify({
    v: 1,
    capturedAt,
    source: { endpoint: 'http://lot2.invalid:8086/metrics' },
    scrape: { ok: true, httpStatus: 200, durationMs: 10, error: null },
    totals: { observedSeries: 1, histogramLines: 1, httpRequestsTotal: 1 },
    counterReset: false,
    queries: [{ operation: 'select', table, count, p95Seconds: 0.01, deltaCount: 1, amplification: 1.5 }],
    ...extra,
  })

test('四条继承语义：坏 JSON / 缺文件 / ok=false / 未知 v 都不许让历史读不到', async () => {
  const io = memIo(
    {
      // ① 正常文件
      'snapshot-20261001.jsonl': [good('2026-10-01T00:00:00Z', 'ai_jobs', 100), good('2026-10-01T01:00:00Z', 'ai_jobs', 200)].join('\n'),
      // ② 坏 JSON + ok=false + 未知 v + 一条正常
      'snapshot-20261002.jsonl': [
        good('2026-10-02T00:00:00Z', 'ai_jobs', 300),
        '{ this is not json',
        JSON.stringify({ v: 1, capturedAt: '2026-10-02T02:00:00Z', scrape: { ok: false, httpStatus: 500, error: 'boom' }, queries: [{ table: 'logs', count: 999 }] }),
        JSON.stringify({ v: 99, capturedAt: '2026-10-02T03:00:00Z', scrape: { ok: true }, queries: [{ table: 'GHOST', count: 123456 }] }),
      ].join('\n'),
      // ③ 在 readdir 里存在、但读不到
      'snapshot-20261003.jsonl': good('2026-10-03T00:00:00Z', 'ai_jobs', 400),
    },
    { unreadable: ['snapshot-20261003.jsonl'] },
  )

  const h = await readHistory(DIR, io)

  // 不许抛，且真的读到了东西（否则"历史没了"和"读到坏数据"不可区分）
  assert.equal(h.ok, true, '有可解析行时必须 ok=true')
  // 文件①2 行正常；文件②4 行里 1 行坏 JSON（不算点）+ 3 行可解析；文件③读不到 ⇒ 0
  assert.equal(h.points, 5, `可解析的快照点应为 5（2 + 3），实际 ${h.points}`)

  // ① 坏 JSON ⇒ 计数，不中断
  assert.ok(h.badLines >= 2, `坏行/读不到应 ≥2（坏 JSON 1 + 缺文件 1），实际 ${h.badLines}`)
  assert.ok(h.badSamples.some((b) => /坏 JSON/.test(b.reason)), '坏 JSON 必须留下样本')
  assert.ok(h.badSamples.some((b) => /读不到/.test(b.reason)), '缺文件必须留下样本')

  // ② ok=false ⇒ 计数（不静默当正常）
  assert.equal(h.failedScrapes, 1, `失败采集应为 1，实际 ${h.failedScrapes}`)

  // ③ 未知 v ⇒ 计数且**不解释**
  assert.equal(h.unknownVersion, 1)
  assert.deepEqual(h.unknownVersions, [99])
  const tables = h.byTable.map((x) => x.table)
  assert.ok(!tables.includes('GHOST'), `未知契约版本的 queries 不得被聚合（出现了 GHOST：${JSON.stringify(tables)}）`)

  // ④ 且失败采集那条**也不该**把数字混进来
  assert.ok(!tables.includes('logs'), `ok=false 的快照不得贡献数字（出现了 logs：${JSON.stringify(tables)}）`)
  assert.equal(h.byTable.find((x) => x.table === 'ai_jobs').sumCount, 100 + 200 + 300, '只有 ok=true 且已知版本的 count 才计入')
})

test('缺文件/目录不可读 ⇒ ok=false 且给出原因（不得抛）', async () => {
  const bad = {
    readdir: async () => {
      const e = new Error('ENOENT')
      e.code = 'ENOENT'
      throw e
    },
    readFile: async () => {
      throw new Error('不该被调用')
    },
  }
  const h = await readHistory(DIR, bad)
  assert.equal(h.ok, false)
  assert.match(h.reason ?? '', /目录不可读/)

  const empty = await readHistory(DIR, { readdir: async () => ['latest.json', 'collector.json'], readFile: async () => '' })
  assert.equal(empty.ok, false)
  assert.match(empty.reason ?? '', /没有 snapshot-YYYYMMDD\.jsonl/)
})

test('只读：除 readdir/readFile 外不碰任何 IO（不写盘、不联网、不抓 /metrics）', async () => {
  const io = memIo({ 'snapshot-20261001.jsonl': good('2026-10-01T00:00:00Z', 'ai_jobs', 1) })
  const realFetch = globalThis.fetch
  let fetched = 0
  globalThis.fetch = async () => {
    fetched += 1
    throw new Error('本模块不得联网')
  }
  try {
    const h = await readHistory(DIR, io)
    assert.equal(h.ok, true)
    assert.equal(fetched, 0, 'readHistory 不得调用 fetch')
    assert.equal(io.calls.readFile.length, 1, '只应对实际存在的历史文件调 readFile')
  } finally {
    globalThis.fetch = realFetch
  }
})

test('末一天的文件当天仍在追加 ⇒ 其按天合计必然偏小（行为与文档一致）', async () => {
  // 模拟：今天这个文件只有 1 个点，昨天有 5 个点 —— 工具不得把它当成"下降"
  const io = memIo({
    'snapshot-20261001.jsonl': Array.from({ length: 5 }, (_, i) => good(`2026-10-01T0${i}:00:00Z`, 'ai_jobs', 100)).join('\n'),
    'snapshot-20261002.jsonl': good('2026-10-02T00:00:00Z', 'ai_jobs', 100),
  })
  const h = await readHistory(DIR, io)
  const days = h.byDay.map((d) => ({ day: d.day, points: d.points, sumCount: d.sumCount }))
  assert.deepEqual(days, [
    { day: '2026-10-01', points: 5, sumCount: 500 },
    { day: '2026-10-02', points: 1, sumCount: 100 },
  ])
  // 说明：本模块**不做**"今天未完整"的推断，它只如实给数字；说明放在工具输出里
  //（tools.mjs 的 lot2_metrics_history 末尾固定打印那一行）。
  assert.equal(h.lastDay, '2026-10-02')
})

test('dayOf / KNOWN_CONTRACT_VERSIONS 的边界', () => {
  assert.equal(dayOf('20261007'), '2026-10-07')
  assert.equal(dayOf('2026-10-07'), null)
  assert.equal(dayOf(''), null)
  assert.equal(dayOf(null), null)
  assert.ok(KNOWN_CONTRACT_VERSIONS.has(1), 'v=1 是已知契约')
  assert.ok(!KNOWN_CONTRACT_VERSIONS.has(2), 'v=2 当前未知（不得预先放行）')
})
