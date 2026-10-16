/**
 * dsh-lot2-metrics — lib/tools.mjs
 *
 * Agent 工具定义（纯：不 import cordis/dsh-tools；由 index.mjs 经 defineTool 编译）。
 * 约定（dsh-tools）：
 *   - parameters 是隐式属性表：必填用 `required: true`，可选不带 required；
 *     对象参数必须 `additionalProperties: true`。
 *   - output = { schema, render }；render(args, value) → [{type:'text',text}]。
 *
 * 工具是**只读**的：只读快照文件，不联网、不写盘（数据面归采集脚本）。
 * 每个回答都带 capturedAt 与快照路径 ⇒ 可追溯（§9 规则 4）。
 */

const OBJECT_SCHEMA = { type: 'object', additionalProperties: true, properties: {} }

function text(s) {
  return [{ type: 'text', text: s }]
}

function fmtNum(v, digits = 3) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '-'
  return Number.isInteger(v) ? String(v) : v.toFixed(digits)
}

function header(summary) {
  const bits = [
    `capturedAt=${summary.capturedAt ?? '-'}`,
    `age=${summary.ageSeconds ?? '-'}s`,
    `${summary.stale ? 'STALE' : 'fresh'}（阈值 ${summary.staleSeconds}s）`,
    `contractV=${summary.contractVersion ?? '-'}`,
    `rows=${summary.queryRows}`,
  ]
  return bits.join('  ')
}

/**
 * 定义集合。`deps.readSummary()` 返回 summarize() 的结果（由 index.mjs 注入）；
 * `deps.readHistory()` 返回 lib/history.mjs::readHistory() 的结果（同一目录的按天历史）。
 */
export function createToolDefs(deps) {
  return [
    {
      name: 'lot2_metrics_overview',
      description: [
        'lot2 后端数据库指标的当前快照概览（只读，来自本机采集的 latest.json 快照）。',
        '回答"lot2 现在什么情况 / 有没有异常放大 / 采集是否新鲜"这类问题。',
        '返回：采集时刻、新鲜度、契约版本、Top-N 表调用量与延迟、放大倍数 Top、以及快照文件路径。',
        '还会给出运行期 gauge（连接数/goroutine/内存/WS 连接数/队列深度）与采集器**已判定**的阈值结论',
        '（阈值由采集器判定并落盘，本工具只读结论，不重判）。',
      ].join(' '),
      parameters: {},
      output: {
        schema: OBJECT_SCHEMA,
        render: (_args, value) => text(value.text),
      },
      async execute() {
        const s = await deps.readSummary()
        if (!s) return { text: '读不到快照（采集可能未运行）' }
        if (s.incompatible) {
          return { text: `契约不兼容，拒绝解读：${s.notes ?? ''}（快照 ${s.snapshotPath}）` }
        }
        if (!s.ok) {
          return { text: `本次采集失败，不给数字（避免把上次的值当本次）：${s.notes ?? ''}\n快照：${s.snapshotPath}` }
        }
        const lines = [`lot2 指标概览  ${header(s)}`, `快照：${s.snapshotPath}`]
        if (s.observedSeries !== null) lines.push(`序列数=${s.observedSeries}  请求总数=${s.httpRequestsTotal ?? '-'}  请求增量=${s.requestsDelta ?? '-'}`)

        // 采集器状态：失败分类让"凭据失效 vs 后端不可达"可区分（动作完全不同）
        if (s.collector) {
          const c = s.collector
          lines.push(`采集器：verdict=${c.verdict ?? '-'}  连续失败=${c.consecutiveFailures ?? '-'}` +
            (c.lastFailReason ? `  失败类别=${c.lastFailReason}` : '') +
            (c.degraded ? '  ⚠️ 阈值有越界' : ''))
        }

        // 阈值：采集器判定并落盘的结论（这里不重判）。三种状态都要说清楚：
        // 越界 / 查过没事 / 查了但没数据（value=null 不是 0）。
        if ((s.thresholds ?? []).length > 0) {
          lines.push('', '阈值（由采集器判定）：')
          for (const t of s.thresholds) {
            const state = t.breached ? '越界' : (t.value === null ? '无数据' : '正常')
            lines.push(`  [${state}] ${t.name ?? '?'}  value=${t.value === null ? '-' : fmtNum(t.value, 4)}  ${t.detail ?? ''}`)
          }
        } else {
          lines.push('', '阈值：未评估（读不到采集器状态）')
        }

        // 运行期 gauge：value=null 表示"未上报/算不出"，**不是 0**
        if (s.runtimePresent && (s.runtimeMetrics ?? []).length > 0) {
          lines.push('', '运行期：')
          for (const m of s.runtimeMetrics) {
            const v = m.value === null ? `—（${m.reason ?? '未上报'}）` : `${fmtNum(m.value, m.unit === 'ratio' ? 4 : 0)}${m.unit ? ' ' + m.unit : ''}`
            lines.push(`  ${m.name}=${v}`)
          }
          if ((s.unknownMetrics ?? []).length > 0) {
            lines.push(`  未上报（声明了但 /metrics 没有，缺失≠0）：${s.unknownMetrics.join(', ')}`)
          }
        }

        lines.push('', '调用量 Top：')
        for (const r of s.topByCount) {
          lines.push(`  ${String(r.operation ?? '?')}:${String(r.table ?? '?')}  count=${fmtNum(r.count, 0)}  Δ=${fmtNum(r.deltaCount, 0)}  p95≈${fmtNum(r.p95Seconds)}s  amp=${fmtNum(r.amplification, 2)}`)
        }
        if (s.topByAmplification.length > 0) {
          lines.push('', '放大倍数 Top（该表调用增量 / 同期请求增量；null=缺分母）：')
          for (const r of s.topByAmplification) lines.push(`  ${r.key}  amp=${fmtNum(r.amplification, 2)}`)
        }
        if (s.notes) lines.push('', `产出方提示（仅供人读）：${s.notes}`)
        return { text: lines.join('\n') }
      },
    },
    {
      name: 'lot2_metrics_query',
      description: [
        '查询 lot2 数据库指标快照里的行（只读）：按 operation 过滤、按关键字过滤、按 count/p95Seconds/deltaCount/amplification 排序取 Top-N。',
        '用于回答"哪个表最慢 / 哪个 select 调用最多 / logs 表的 p95 是多少 / 哪些表在放大"。',
        'p95 是从直方图桶线性插值得到的**近似值**（契约明确要求标注）。',
      ].join(' '),
      parameters: {
        operation: { type: 'string', description: '按操作类型精确过滤，如 select / insert / update（可选）' },
        filter: { type: 'string', description: '对任意字符串列做不区分大小写的包含匹配，如表名 logs（可选）' },
        sort: { type: 'string', enum: ['count', 'p95Seconds', 'deltaCount', 'amplification'], description: '排序键，默认 count' },
        top: { type: 'number', description: '返回行数上限，默认 10' },
      },
      output: {
        schema: OBJECT_SCHEMA,
        render: (_args, value) => text(value.text),
      },
      async execute(args) {
        const s = await deps.readSummary()
        if (!s) return { text: '读不到快照（采集可能未运行）' }
        if (s.incompatible) return { text: `契约不兼容，拒绝解读：${s.notes ?? ''}` }
        if (!s.ok) return { text: `本次采集失败，不给数字：${s.notes ?? ''}\n快照：${s.snapshotPath}` }
        const table = await deps.query({
          operation: typeof args?.operation === 'string' ? args.operation : undefined,
          filter: typeof args?.filter === 'string' ? args.filter : undefined,
          sort: typeof args?.sort === 'string' ? args.sort : 'count',
          top: typeof args?.top === 'number' ? args.top : 10,
        })
        const lines = [`lot2 指标查询  ${header(s)}`, `快照：${s.snapshotPath}`, '']
        lines.push(`${table.columns.join('\t')}`)
        for (const r of table.rows) {
          lines.push(r.map((c, i) => (i === 0 || i === 1 ? String(c ?? '-') : fmtNum(c, 4))).join('\t'))
        }
        lines.push('', `匹配 ${table.rows.length}/${table.totalRows} 行；p95≈ 为直方图插值近似值。`)
        return { text: lines.join('\n') }
      },
    },
    {
      // ── lot2_metrics_history ──────────────────────────────────────────────
      // 读 `snapshot-YYYYMMDD.jsonl` 那批**按天追加**的历史快照。
      // 这个工具之所以存在：采集脚本一直在写它们，但此前**没有任何代码路径能读到**
      // （`snapshotPath` 只指 latest.json）—— 10 天历史躺在盘上没人读。
      name: 'lot2_metrics_history',
      description: [
        'lot2 后端数据库指标的**历史趋势**（只读，来自本机采集按天追加的 snapshot-*.jsonl）。',
        '回答"这十天哪个表在放大 / 采集有没有断过 / 契约版本变没变 / 某表 count 的趋势"这类问题，',
        '而不是"现在什么情况"（那个用 lot2_metrics_overview）。',
        '⚠️ 最末一天的快照文件**当天仍在追加**，所以它的"当天合计"必然偏小，不要当成下降。',
        '⚠️ 脏数据（坏 JSON / 未知契约版本 / 采集失败）会被**计数并报出**，不会让整个历史读不到。',
      ].join(''),
      parameters: {
        days: { type: 'integer', description: '只看最近 N 天（默认 10；按文件名日期，不是按 capturedAt）' },
        table: { type: 'string', description: '只看某张表（可选；按 queries[].table 匹配）' },
        top: { type: 'integer', description: '按总 count 排序返回前 N 张表（默认 10）' },
      },
      output: {
        schema: {
          type: 'object',
          additionalProperties: true,
          properties: {
            dir: { type: 'string' },
            points: { type: 'integer' },
            ok: { type: 'boolean' },
            text: { type: 'string' },
          },
        },
        schemaSafe: true,
        render: (_args, value) => text(value.text),
      },
      async execute(args) {
        const h = await deps.readHistory()
        if (!h || !h.ok) return { text: `读不到历史快照：${h?.reason ?? '未知原因'}\n（历史由采集脚本按天追加到 latest.json 同目录；目录里没有 snapshot-*.jsonl 时本工具无法回答）` }
        const days = Number.isFinite(Number(args?.days)) ? Math.max(1, Number(args.days)) : 10
        const topN = Number.isFinite(Number(args?.top)) ? Math.max(1, Number(args.top)) : 10
        const tableFilter = typeof args?.table === 'string' && args.table ? args.table : null
        const byDay = h.byDay.slice(-days)
        const rows = (tableFilter ? h.byTable.filter((x) => x.table === tableFilter) : h.byTable).slice(0, topN)

        const lines = [
          `lot2 指标历史  ${h.dir}`,
          `快照文件 ${h.files.length} 个 ｜ 快照点 ${h.points} 个 ｜ 跨度 ${h.firstAt ?? '-'} → ${h.lastAt ?? '-'}`,
        ]
        if (h.unknownVersion > 0) {
          lines.push(`⚠️ 未知契约版本 ${h.unknownVersion} 个点（v=${h.unknownVersions.join(',')}）—— **不按已知版本解释**`)
        } else {
          lines.push(`契约版本：v=${Object.keys(h.versions).join(',')}（全部已知）`)
        }
        lines.push(`采集健康：失败 ${h.failedScrapes}/${h.points}${h.failedScrapes ? '（失败点不给数字）' : ''}`)
        if (h.badLines > 0) lines.push(`⚠️ 坏行/读不到的文件 ${h.badLines} 处（已跳过，未中断读取）`)
        lines.push('')
        lines.push(`按天（最近 ${byDay.length} 天）`)
        lines.push(['date', 'points', 'queries', 'sumCount', 'maxAmp', 'failed'].join('\t'))
        for (const d of byDay) {
          lines.push([d.day, d.points, d.queries, d.sumCount, fmtNum(d.maxAmplification, 3), d.failedScrapes].join('\t'))
        }
        lines.push('')
        lines.push(`按表（Top ${rows.length}${tableFilter ? `，过滤 ${tableFilter}` : ''}）`)
        lines.push(['table', 'points', 'sumCount', 'maxAmp'].join('\t'))
        for (const r of rows) {
          lines.push([r.table, r.points, r.sumCount, fmtNum(r.maxAmplification, 3)].join('\t'))
        }
        lines.push('', '⚠️ 最末一天的快照文件当天仍在追加 ⇒ 其"当天合计"必然偏小。')
        return { dir: h.dir, points: h.points, ok: h.ok, text: lines.join('\n') }
      },
    },
  ]
}
