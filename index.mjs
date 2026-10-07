/**
 * dsh-lot2-metrics — host half.
 *
 * 把 lot2 后端数据库指标的**项目自产快照**变成 DSH 里"可被 agent 查询 + 可观测"的东西。
 *
 * 归属（对齐 lot2 的 DSH_INTEGRATION_PROPOSAL §4）：
 *   - 取数与契约：lot2 仓（scripts/metrics-report.mjs，本插件绝不抓取）
 *   - 触发与落盘：DSH 侧 launchd 采集（scripts/lot2-metrics-collect.sh）
 *   - **呈现与查询：本插件**（只读快照文件）
 *
 * 契约：dsfolder/CROSS-PROJECT-INTEGRATION-MECHANISM-2026-10-07.md §9（信封 v1）
 *   - 未知 v ⇒ 显示"契约不兼容"，**不渲染数字**
 *   - ok=false ⇒ 不给数字（绝不把上次的值当本次）
 *   - 缺字段/坏文件 ⇒ 不崩、不影响插件树其它部分
 *   - 每个回答都带 capturedAt + 快照路径（可追溯）
 *
 * 失败隔离（硬要求）：本插件**任何路径都不抛**到 cordis —— 读失败只降级为 status 里的
 * lastError 与工具的如实回答。理由：DSH 里有"插件拖垮整树"的先例。
 */
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import {
  readSnapshotFile, summarize, queryRows,
} from './lib/reader.mjs'
import { createToolDefs } from './lib/tools.mjs'

export const name = 'dsh-lot2-metrics'
export const inject = ['tools', 'webServer']

export const Config = Schema.object({
  /** 快照文件路径（launchd 采集的产物）。 */
  snapshotPath: Schema.string(),
  /** 采集状态文件（可选，用于 status 里附带采集健康）。 */
  statePath: Schema.string(),
  /** stale 阈值秒；默认 1500（与采集侧 2.5×600s 一致）。 */
  staleSeconds: Schema.number().min(60).default(1500),
  /** 概览里的 Top-N。 */
  topN: Schema.number().min(1).max(50).default(5),
}).description('dsh-lot2-metrics: lot2 数据库指标快照的只读呈现与查询')

/** defaulting happens here, never inline（harness 约定）。 */
export function resolveConfig(config) {
  const home = homedir()
  return {
    snapshotPath: config.snapshotPath ?? process.env.LOT2_METRICS_SNAPSHOT ?? join(home, '.dsh', 'storages', 'lot2-metrics', 'latest.json'),
    statePath: config.statePath ?? join(home, '.dsh', 'storages', 'lot2-metrics', 'collector-state.json'),
    staleSeconds: config.staleSeconds ?? 1500,
    topN: config.topN ?? 5,
  }
}

function readJsonSafe(path) {
  try {
    return { value: JSON.parse(readFileSync(path, 'utf8')), error: null }
  } catch (error) {
    return { value: null, error: error instanceof Error ? error.message : String(error) }
  }
}

function readVersion() {
  try {
    const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0'
  } catch {
    return '0.0.0'
  }
}

export function apply(ctx, config) {
  const cfg = resolveConfig(config ?? {})
  const log = (level, msg) => {
    try { ctx.logger?.[level]?.(`[dsh-lot2-metrics] ${msg}`) } catch { /* logger 不可用也不抛 */ }
  }

  // 最近一次已知状态：status 端点与工具共用（读一次、缓存错误），任何异常都降级。
  let lastError = null
  let cache = { at: 0, summary: null }

  async function readSummary(force = false) {
    const now = Date.now()
    if (!force && cache.summary && now - cache.at < 2_000) return cache.summary
    try {
      const { result, path } = await readSnapshotFile(cfg.snapshotPath)
      const summary = summarize({ result, path, staleSeconds: cfg.staleSeconds, topN: cfg.topN })
      // 采集侧状态（可选）：只透出 verdict/连续失败，不参与判断快照本身
      const st = readJsonSafe(cfg.statePath)
      if (st.value) {
        summary.collector = {
          verdict: st.value.verdict ?? null,
          exitCode: st.value.exitCode ?? null,
          consecutiveFailures: st.value.consecutiveFailures ?? null,
          keySource: st.value.keySource ?? null,
          lastRunAt: st.value.lastRunAt ?? null,
        }
      }
      lastError = result.ok ? null : (result.notes ?? 'snapshot not ok')
      cache = { at: now, summary }
      return summary
    } catch (error) {
      // 双保险：连 summarize 都炸的话也不让它出去
      lastError = error instanceof Error ? error.message : String(error)
      log('warn', `readSummary failed: ${lastError}`)
      return null
    }
  }

  // ── 1) agent 工具（只读）────────────────────────────────────────────────
  for (const def of createToolDefs({
    readSummary: () => readSummary(),
    query: async (q) => {
      const { result } = await readSnapshotFile(cfg.snapshotPath)
      return queryRows(result, q)
    },
  })) {
    try {
      ctx.tools.register(defineTool(def))
      log('info', `tool registered: ${def.name}`)
    } catch (error) {
      log('error', `tool registration failed for ${def.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // ── 2) 只读状态端点（约定形状 + no-store）───────────────────────────────
  try {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/plugins/dsh-lot2-metrics/status',
      handler: async (_req, res) => {
        const s = await readSummary()
        const body = {
          ok: true, // 端点自身可用即为 true；快照健康看 detail
          plugin: name,
          version: readVersion(),
          counts: {
            queryRows: s?.queryRows ?? 0,
            topRows: Array.isArray(s?.topByCount) ? s.topByCount.length : 0,
            amplificationRows: Array.isArray(s?.topByAmplification) ? s.topByAmplification.length : 0,
          },
          lastError,
          detail: s ? {
            snapshotPath: s.snapshotPath,
            capturedAt: s.capturedAt,
            ageSeconds: s.ageSeconds,
            stale: s.stale,
            staleSeconds: s.staleSeconds,
            contractVersion: s.contractVersion,
            incompatible: s.incompatible,
            snapshotOk: s.ok,
            flavor: s.flavor,
            observedSeries: s.observedSeries,
            requestsDelta: s.requestsDelta,
            topByCount: s.topByCount,
            topByAmplification: s.topByAmplification,
            collector: s.collector ?? null,
            notes: s.notes,
          } : { snapshotPath: cfg.snapshotPath, reason: lastError ?? 'unreadable' },
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
        res.end(JSON.stringify(body, null, 2))
      },
    }), 'dsh-lot2-metrics: route /plugins/dsh-lot2-metrics/status')
    log('info', 'status route mounted at /plugins/dsh-lot2-metrics/status')
  } catch (error) {
    log('warn', `status route unavailable: ${error instanceof Error ? error.message : String(error)}`)
  }

  // ── 3) 只读数据端点（给 client 半的 tab 用；与 status 同源）────────────────
  try {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/plugins/dsh-lot2-metrics/snapshot',
      handler: async (_req, res) => {
        const s = await readSummary()
        // 快照读不到时返回 200 + 明确的空形状（而不是 5xx）：client 据此显示"读不到"
        // 而不是把网络错误误显示成"没有数据"。
        const payload = s ?? {
          ok: false, incompatible: false, stale: true, ageSeconds: null,
          staleSeconds: cfg.staleSeconds, capturedAt: null, contractVersion: null,
          flavor: null, snapshotPath: cfg.snapshotPath, queryRows: 0,
          topByCount: [], topByAmplification: [], observedSeries: null,
          httpRequestsTotal: null, requestsDelta: null,
          notes: lastError ?? 'snapshot unreadable', collector: null,
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
        res.end(JSON.stringify(payload))
      },
    }), 'dsh-lot2-metrics: route /plugins/dsh-lot2-metrics/snapshot')
    log('info', 'data route mounted at /plugins/dsh-lot2-metrics/snapshot')
  } catch (error) {
    log('warn', `data route unavailable: ${error instanceof Error ? error.message : String(error)}`)
  }

  log('info', `ready (snapshot=${cfg.snapshotPath}, stale=${cfg.staleSeconds}s)`)
}

apply.inject = inject
