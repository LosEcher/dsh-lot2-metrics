/**
 * dsh-lot2-metrics — reader 单测（含负向控制）。
 *
 * 重点不是"顺利时能读"，而是**四种坏输入下都不许出错数字**：
 *   v 不认识 / ok=false / 坏 JSON / 文件不存在。
 * 每条都对应 §9 的"消费方必须实现"。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ENVELOPE_VERSION, normalizeSnapshot, readSnapshotFile, summarize, queryRows, adaptLot2, looksLikeLot2,
} from '../lib/reader.mjs'

const NOW = Date.parse('2026-10-07T12:00:00.000Z')

function lot2Snapshot(overrides = {}) {
  return {
    v: 1,
    capturedAt: '2026-10-07T11:59:30.000Z',
    source: { endpoint: 'http://100.82.176.56:8086/metrics' },
    scrape: { ok: true, httpStatus: 200, durationMs: 35, error: null },
    totals: { observedSeries: 37, histogramLines: 481, httpRequestsTotal: 86 },
    counterReset: false,
    queries: [
      { operation: 'select', table: 'ai_jobs', count: 1366, p95Seconds: 0.0048, deltaCount: 2, amplification: 2.5 },
      { operation: 'insert', table: 'logs', count: 900, p95Seconds: 0.031, deltaCount: 1, amplification: null },
    ],
    top: { byCount: ['select:ai_jobs'], byLatency: ['insert:logs'] },
    derived: { requestsDelta: 4, note: 'amplification = 该表调用增量 / 同期请求增量（逐行）' },
    ...overrides,
  }
}

test('正常 lot2 快照：数字可读、形状被映射成信封', () => {
  const r = normalizeSnapshot(lot2Snapshot())
  assert.equal(r.incompatible, false)
  assert.equal(r.ok, true)
  assert.equal(r.contractVersion, 1)
  assert.equal(r._flavor, 'lot2')
  assert.equal(r.tables[0].name, 'queries')
  assert.deepEqual(r.tables[0].columns, ['operation', 'table', 'count', 'p95Seconds', 'deltaCount', 'amplification'])
  assert.equal(r.tables[0].rows.length, 2)
  assert.equal(r.metrics.find((m) => m.name === 'httpRequestsTotal').value, 86)
  assert.equal(r.metrics.find((m) => m.name === 'requestsDelta').value, 4)
  assert.match(r.notes, /amplification/)
})

test('负向控制：ok=false ⇒ 不给任何数字（绝不把上次的值当本次）', () => {
  const r = normalizeSnapshot(lot2Snapshot({ scrape: { ok: false, httpStatus: null, durationMs: 1, error: 'fetch failed' } }))
  assert.equal(r.ok, false)
  assert.deepEqual(r.metrics, [], 'ok=false 时 metrics 必须为空')
  assert.deepEqual(r.tables, [], 'ok=false 时 tables 必须为空')
})

test('负向控制：未知契约版本 ⇒ incompatible 且不给数字', () => {
  const r = normalizeSnapshot(lot2Snapshot({ v: 2 }))
  assert.equal(r.incompatible, true)
  assert.equal(r.ok, false)
  assert.deepEqual(r.metrics, [])
  assert.deepEqual(r.tables, [])
  assert.match(String(r.notes), /不兼容/)
})

test('负向控制：缺 v / 空对象 / 非对象 ⇒ 不抛且无数字', () => {
  for (const bad of [{}, null, undefined, 42, [], 'x', { capturedAt: 'x' }]) {
    const r = normalizeSnapshot(bad)
    assert.equal(r.ok, false)
    assert.deepEqual(r.metrics, [])
    assert.deepEqual(r.tables, [])
  }
})

test('负向控制：坏 JSON / 文件不存在 ⇒ 不抛，返回 reason 与路径', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lot2m-'))
  try {
    const bad = join(dir, 'bad.json')
    writeFileSync(bad, '{ not json')
    const r1 = await readSnapshotFile(bad)
    assert.equal(r1.result.ok, false)
    assert.match(String(r1.result.notes), /读取\/解析失败/)
    assert.equal(r1.path, bad)

    const r2 = await readSnapshotFile(join(dir, 'nope.json'))
    assert.equal(r2.result.ok, false)
    assert.match(String(r2.result.notes), /文件不存在/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('信封形状（§9）也能读：metrics/tables 直接可用', () => {
  const env = {
    v: ENVELOPE_VERSION,
    capturedAt: '2026-10-07T11:59:30.000Z',
    ok: true,
    source: { endpoint: 'x' },
    notes: 'human only',
    metrics: [{ name: 'foo', value: 3, unit: 'count' }],
    tables: [{ name: 'queries', columns: ['operation', 'table', 'count'], rows: [['select', 't', 5]] }],
  }
  const r = normalizeSnapshot(env)
  assert.equal(r._flavor, 'envelope')
  assert.equal(r.ok, true)
  assert.equal(r.metrics[0].value, 3)
  assert.equal(r.tables[0].rows[0][2], 5)
})

test('放大倍数：null 行保留在表里，但 topByAmplification 过滤掉', () => {
  const r = normalizeSnapshot(lot2Snapshot())
  const s = summarize({ result: r, path: '/tmp/x.json', now: NOW, staleSeconds: 1500, topN: 5 })
  const rows = queryRows(r, {}).rows
  assert.equal(rows.length, 2, 'null 行仍应在原表里')
  assert.equal(s.topByAmplification.length, 1, 'null 不应进放大榜')
  assert.equal(s.topByAmplification[0].key, 'select:ai_jobs')
})

test('stale 判定：按 capturedAt 与阈值', () => {
  const fresh = summarize({ result: normalizeSnapshot(lot2Snapshot()), path: 'p', now: NOW, staleSeconds: 1500 })
  assert.equal(fresh.stale, false)
  assert.ok(fresh.ageSeconds <= 60)
  const stale = summarize({ result: normalizeSnapshot(lot2Snapshot()), path: 'p', now: NOW + 4_000_000, staleSeconds: 1500 })
  assert.equal(stale.stale, true)
  // ok=false ⇒ 一律 stale（无数字可看）
  const failed = summarize({ result: normalizeSnapshot(lot2Snapshot({ scrape: { ok: false } })), path: 'p', now: NOW, staleSeconds: 1500 })
  assert.equal(failed.stale, true)
})

test('可追溯性：summary 必带 snapshotPath 与 capturedAt', () => {
  const s = summarize({ result: normalizeSnapshot(lot2Snapshot()), path: '/tmp/latest.json', now: NOW })
  assert.equal(s.snapshotPath, '/tmp/latest.json')
  assert.equal(s.capturedAt, '2026-10-07T11:59:30.000Z')
})

test('queryRows：排序 / 过滤 / top', () => {
  const r = normalizeSnapshot(lot2Snapshot())
  assert.equal(queryRows(r, { sort: 'count' }).rows[0][2], 1366)
  assert.equal(queryRows(r, { sort: 'p95Seconds' }).rows[0][3], 0.031)
  assert.equal(queryRows(r, { operation: 'insert' }).rows.length, 1)
  assert.equal(queryRows(r, { filter: 'LOGS' }).rows.length, 1, '过滤应不区分大小写')
  assert.equal(queryRows(r, { top: 1 }).rows.length, 1)
  assert.equal(queryRows(r, { table: 'nope' }).rows.length, 0, '缺表返回空而不是抛')
})

test('looksLikeLot2 / adaptLot2 的边界', () => {
  assert.equal(looksLikeLot2({ queries: [] }), true)
  assert.equal(looksLikeLot2({ metrics: [] }), false)
  const adapted = adaptLot2({ v: 1, scrape: { ok: true }, queries: [{ operation: 'a', table: 'b', count: 1 }] })
  assert.equal(adapted.tables[0].rows[0].length, 6, '列数固定为 6（含 amplification 占位）')
  assert.equal(adapted.tables[0].rows[0][5], null)
})
