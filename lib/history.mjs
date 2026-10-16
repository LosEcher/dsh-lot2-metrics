/**
 * dsh-lot2-metrics — lib/history.mjs
 *
 * **只读历史读取器**：读 `snapshot-YYYYMMDD.jsonl` 那批按天追加的快照，回答趋势类问题。
 *
 * 为什么需要它（台账条目 `lot2-metrics-history-tool`，2026-10-16 实测）：
 *   采集脚本一直在写 `~/.dsh/storages/lot2-metrics/snapshot-*.jsonl`（当时 10 个文件、
 *   1,263 行、展开 `queries[]` 约 44k 条），但**没有任何代码路径能读到它们** ——
 *   `index.mjs` 的 `snapshotPath` 只指向 `latest.json`（单瞬间），
 *   `reader.mjs` 对单路径 `readFileSync`。也就是说"10 天的历史躺在盘上没人读"：
 *   装了（在写）≠ 用得上（没有读它的路径）。
 *
 * 三条硬约束：
 *   ① **只读**：只用注入进来的 `readdir` / `readFile`，不写盘、不联网、不读 `/metrics`。
 *   ② **脏数据不许抛**：坏 JSON / 未知契约版本 / `scrape.ok=false` 都要**计数并报出来**，
 *      不能让整个历史读取因为一行坏数据而失败（那会让"历史读不到"伪装成"没有历史"）。
 *   ③ **不猜契约**：`v` 不认识就进 `unknownVersion`，**不得**按 v=1 解释未知版本。
 *
 * 注入 IO 是为了可测（与 `reader.mjs::readSnapshotFile` 同一手法）。
 */

/** 已知的快照契约版本。不在这里的一律记入 unknownVersion，**不按已知版本解释**。 */
export const KNOWN_CONTRACT_VERSIONS = new Set([1])

const FILE_RE = /^snapshot-(\d{8})\.jsonl$/

function defaultReaddir(dir) {
  return import('node:fs/promises').then((m) => m.readdir(dir))
}
function defaultReadFile(path) {
  return import('node:fs/promises').then((m) => m.readFile(path, 'utf8'))
}

/** `YYYYMMDD` → `YYYY-MM-DD`（不合法返回 null）。 */
export function dayOf(stamp) {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(String(stamp ?? ''))
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

/**
 * 读整个历史目录。
 *
 * @param {string} dir 目录（`latest.json` 所在目录）
 * @param {{readdir?: Function, readFile?: Function}} [io] 注入的 IO（测试用）
 * @returns {Promise<object>} 汇总；**永不抛**（目录不可读也返回 ok:false 的结果）
 */
export async function readHistory(dir, io = {}) {
  const readdir = io.readdir ?? defaultReaddir
  const readFile = io.readFile ?? defaultReadFile

  const out = {
    ok: false,
    dir,
    reason: null,
    files: [],
    points: 0,
    badLines: 0,
    unknownVersion: 0,
    failedScrapes: 0,
    unknownVersions: [],
    versions: {},
    firstAt: null,
    lastAt: null,
    firstDay: null,
    lastDay: null,
    byDay: [],
    byTable: [],
    badSamples: [],
  }

  let names
  try {
    names = await readdir(dir)
  } catch (error) {
    out.reason = `目录不可读：${dir}（${error instanceof Error ? error.message : String(error)}）`
    return out
  }

  const files = (Array.isArray(names) ? names : [])
    .map((n) => ({ name: n, m: FILE_RE.exec(n) }))
    .filter((x) => x.m)
    .map((x) => ({ name: x.name, stamp: x.m[1], day: dayOf(x.m[1]) }))
    .sort((a, b) => (a.stamp < b.stamp ? -1 : a.stamp > b.stamp ? 1 : 0))
  out.files = files.map((f) => f.name)
  if (files.length === 0) {
    out.reason = `目录里没有 snapshot-YYYYMMDD.jsonl：${dir}`
    return out
  }

  const byDay = new Map()
  const byTable = new Map()

  for (const f of files) {
    let text
    try {
      text = await readFile(`${dir}/${f.name}`)
    } catch (error) {
      // 单个文件读不到**不算**整个历史失败；记进 reason 的补充，继续读其余的
      out.badLines += 1
      out.badSamples.push({ file: f.name, line: 0, reason: `读不到：${error instanceof Error ? error.message : String(error)}` })
      continue
    }
    const lines = String(text).split('\n')
    lines.forEach((line, idx) => {
      const s = line.trim()
      if (!s) return
      let rec
      try {
        rec = JSON.parse(s)
      } catch (error) {
        out.badLines += 1
        if (out.badSamples.length < 5) {
          out.badSamples.push({ file: f.name, line: idx + 1, reason: `坏 JSON：${error instanceof Error ? error.message : String(error)}` })
        }
        return
      }
      out.points += 1
      const v = rec?.v
      out.versions[v] = (out.versions[v] ?? 0) + 1
      const known = KNOWN_CONTRACT_VERSIONS.has(v)
      const scrapeOk = rec?.scrape?.ok === true
      if (!scrapeOk) out.failedScrapes += 1

      // 时间跨度与首末日：对**每一个可解析的点**都记（含失败/未知版本的点——它们也是观测）
      const at = typeof rec?.capturedAt === 'string' ? rec.capturedAt : null
      if (at) {
        if (!out.firstAt || at < out.firstAt) out.firstAt = at
        if (!out.lastAt || at > out.lastAt) out.lastAt = at
      }
      if (!out.firstDay) out.firstDay = f.day
      out.lastDay = f.day

      // ── 分母先记：**每一个可解析的点**都算这一天的观测，无论成功与否 ──
      // `points` = 观测点数（含失败/未知版本），`counted` = 其中真正贡献了数字的。
      // 两个数都给，是为了让"某天数字低"可以区分成"采得少"与"断采"两件事。
      const day = byDay.get(f.day) ?? { day: f.day, points: 0, counted: 0, queries: 0, sumCount: 0, maxAmplification: null, failedScrapes: 0 }
      day.points += 1
      if (!scrapeOk) day.failedScrapes += 1
      byDay.set(f.day, day)

      if (!known) {
        out.unknownVersion += 1
        if (!out.unknownVersions.includes(v)) out.unknownVersions.push(v)
        return  // ⚠️ 未知契约版本**只计数，不解释**
      }
      if (!scrapeOk) return  // ⚠️ 采集失败的那一瞬**不给数字**（与 reader.mjs 同一纪律）

      day.counted += 1
      const qs = Array.isArray(rec?.queries) ? rec.queries : []
      day.queries += qs.length
      for (const q of qs) {
        const n = Number(q?.count)
        if (Number.isFinite(n)) day.sumCount += n
        const amp = Number(q?.amplification)
        if (Number.isFinite(amp) && (day.maxAmplification === null || amp > day.maxAmplification)) {
          day.maxAmplification = amp
        }
        const t = byTable.get(q?.table) ?? { table: q?.table ?? '(unknown)', points: 0, sumCount: 0, maxAmplification: null }
        t.points += 1
        if (Number.isFinite(n)) t.sumCount += n
        if (Number.isFinite(amp) && (t.maxAmplification === null || amp > t.maxAmplification)) t.maxAmplification = amp
        byTable.set(q?.table, t)
      }
      byDay.set(f.day, day)
    })
  }

  out.byDay = [...byDay.values()].sort((a, b) => (a.day < b.day ? -1 : 1))
  out.byTable = [...byTable.values()].sort((a, b) => b.sumCount - a.sumCount)
  out.ok = out.points > 0
  if (!out.ok) out.reason = '目录里没有任何可解析的快照行'
  return out
}
