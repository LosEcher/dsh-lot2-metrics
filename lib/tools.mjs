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
 * 定义集合。`deps.readSummary()` 返回 summarize() 的结果（由 index.mjs 注入）。
 */
export function createToolDefs(deps) {
  return [
    {
      name: 'lot2_metrics_overview',
      description: [
        'lot2 后端数据库指标的当前快照概览（只读，来自本机采集的 latest.json 快照）。',
        '回答"lot2 现在什么情况 / 有没有异常放大 / 采集是否新鲜"这类问题。',
        '返回：采集时刻、新鲜度、契约版本、Top-N 表调用量与延迟、放大倍数 Top、以及快照文件路径。',
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
  ]
}
