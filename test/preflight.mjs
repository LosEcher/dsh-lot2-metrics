/**
 * dsh-lot2-metrics — test/preflight.mjs
 *
 * 用**真的** @deepseek-ai/dsh-tools 编译器校验工具定义（锚定到 profile 的 node_modules），
 * 并做**功能性**检查：坏输入下工具必须"如实说没有数字"，而不是打印数字。
 * exit 0 = 可以放心挂进插件树。
 */
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { normalizeSnapshot, summarize, queryRows } from '../lib/reader.mjs'
import { createToolDefs } from '../lib/tools.mjs'

const require = createRequire(join(homedir(), '.dsh', 'profiles', 'node_modules') + '/')
const { defineTool } = require('@deepseek-ai/dsh-tools')

const NOW = Date.parse('2026-10-07T12:00:00.000Z')
const PATH = '/tmp/lot2-latest.json'

function snapshot(scrapeOk = true) {
  return {
    v: 1,
    capturedAt: '2026-10-07T11:59:30.000Z',
    source: { endpoint: 'http://lot2-backend.invalid:8086/metrics' },
    scrape: { ok: scrapeOk, httpStatus: scrapeOk ? 200 : null, durationMs: 35, error: scrapeOk ? null : 'fetch failed' },
    totals: { observedSeries: 37, histogramLines: 481, httpRequestsTotal: 86 },
    queries: [
      { operation: 'select', table: 'ai_jobs', count: 1366, p95Seconds: 0.0048, deltaCount: 2, amplification: 2.5 },
      { operation: 'insert', table: 'logs', count: 900, p95Seconds: 0.031, deltaCount: 1, amplification: null },
    ],
    derived: { requestsDelta: 4, note: 'amplification = 逐行比值' },
  }
}

function depsFor(raw) {
  const result = normalizeSnapshot(raw)
  const summary = summarize({ result, path: PATH, now: NOW, staleSeconds: 1500, topN: 5 })
  return {
    readSummary: async () => summary,
    query: async (q) => queryRows(result, q),
  }
}

const defs = createToolDefs(depsFor(snapshot(true)))
assert.ok(defs.length >= 2, `expected >=2 tools, got ${defs.length}`)
const names = new Set()
for (const def of defs) {
  assert.ok(typeof def.name === 'string' && def.name.length > 0, 'tool name missing')
  assert.ok(!names.has(def.name), `duplicate tool name: ${def.name}`)
  names.add(def.name)
  assert.ok(typeof def.description === 'string' && def.description.length > 30, `description too short: ${def.name}`)
  assert.ok(def.parameters && typeof def.parameters === 'object', `parameters missing: ${def.name}`)
  assert.ok(def.output?.schema && typeof def.output.render === 'function', `output schema/render missing: ${def.name}`)
  assert.ok(typeof def.execute === 'function', `execute missing: ${def.name}`)
  const compiled = defineTool(def)      // 真编译器：形状不对会抛
  assert.ok(compiled, `compiler returned nothing for ${def.name}`)
}
console.log(`  ok: ${defs.length} tool defs compile through the real dsh-tools (${[...names].join(', ')})`)

// ── 功能：正常快照要能给出可追溯的答案 ────────────────────────────────────
const okDefs = createToolDefs(depsFor(snapshot(true)))
const overview = await okDefs.find((d) => d.name === 'lot2_metrics_overview').execute({})
assert.match(overview.text, /capturedAt=2026-10-07T11:59:30\.000Z/, '概览必须带 capturedAt')
assert.match(overview.text, new RegExp(PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '概览必须带快照路径')
assert.match(overview.text, /select:ai_jobs/, '概览必须列出 Top 行')
console.log('  ok: overview carries capturedAt + snapshot path + top rows')

const q = await okDefs.find((d) => d.name === 'lot2_metrics_query').execute({ operation: 'insert', sort: 'p95Seconds', top: 5 })
assert.match(q.text, /insert/, 'query 应返回匹配行')
assert.match(q.text, /近似值/, 'query 必须标注 p95 为近似值')
console.log('  ok: query filters + labels p95 as an approximation')

// ── 负向：采集失败时**不许**出现数字 ──────────────────────────────────────
const failDefs = createToolDefs(depsFor(snapshot(false)))
const failOverview = await failDefs.find((d) => d.name === 'lot2_metrics_overview').execute({})
assert.match(failOverview.text, /不给数字/, 'ok=false 时必须明说"不给数字"')
assert.doesNotMatch(failOverview.text, /1366/, 'ok=false 时不得泄露上次的数值')
console.log('  ok: ok=false ⇒ refuses to print stale numbers')

// ── 负向：未知契约版本 → 明说拒绝，且不给数字 ──────────────────────────────
const v2Defs = createToolDefs(depsFor({ ...snapshot(true), v: 2 }))
const v2Overview = await v2Defs.find((d) => d.name === 'lot2_metrics_overview').execute({})
assert.match(v2Overview.text, /契约不兼容/, 'v=2 必须报契约不兼容')
assert.doesNotMatch(v2Overview.text, /1366/, 'v=2 时不得渲染数字')
console.log('  ok: unknown contract version ⇒ refuses to interpret')

console.log('preflight: 全部通过')
