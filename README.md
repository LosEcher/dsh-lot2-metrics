# dsh-lot2-metrics

把 **lot2 后端数据库指标**的采集快照变成 DSH 里"**agent 可查 + 可观测**"的东西。
host-only 插件（无 client 半）：注册 2 个只读 agent 工具 + 1 个只读状态端点。

- **契约**：`dsfolder/CROSS-PROJECT-INTEGRATION-MECHANISM-2026-10-07.md` §9（"项目快照信封 v1"）
- **归属**：取数与契约属 lot2（`lot2extension/scripts/metrics-report.mjs`）；触发与落盘属 DSH 采集
  （`dsfolder/scripts/lot2-metrics-collect.sh` + launchd `com.echerlos.lot2-metrics`）；
  **呈现与查询属本插件**（只读快照文件，绝不抓取、不写盘）

## 装了什么

| 面 | 内容 |
|---|---|
| 工具 | `lot2_metrics_overview`（概览：新鲜度/Top-N 调用量/放大倍数）；`lot2_metrics_query`（按 operation/关键字过滤 + 按 count/p95/deltaCount/amplification 排序 + Top-N） |
| 端点 | `GET /plugins/dsh-lot2-metrics/status`（约定形状 `{ok,plugin,version,counts,lastError,detail}` + `cache-control: no-store`） |
| 配置 | `snapshotPath` / `statePath` / `staleSeconds`（默认 1500）/ `topN`（默认 5） |

## 四条语义（都有测试；不是"顺手加的"）

1. **未知 `v` ⇒ 报契约不兼容，绝不渲染数字**（不猜字段）。
2. **`ok=false` ⇒ 不给任何数字** —— 绝不把上一次的数值当成本次。
3. **缺字段 / 坏 JSON / 文件不存在 ⇒ 不抛异常**，只降级为该块留空 + reason。
   插件任何路径都不把异常抛给 cordis（本仓有"插件拖垮整树"的先例）。
4. **回答必带 `capturedAt` 与快照路径** ⇒ 可追溯。`p95` 一律标注为**直方图插值近似值**。

`derived.note` 只当**人读提示**透出，不参与任何判断（lot2 契约 §10：固定字段名、两条固定句子、不承载数据）。

## 安装

```bash
# 1) 作为 profile layer 加入（需 package.json 声明 dsh.bundle.patch —— 本仓已声明）
cd ~/.dsh/profiles/web
dsh plugin --profile web add link:/Users/echerlos/syncfolder/project/dsplugins/dsh-lot2-metrics
# 2) 首次挂载可热生效；**改本仓代码后必须重启对应宿主**（ESM 按 URL 缓存）
```

`desktop` profile 要同样的工具，就把上面命令的 `web` 换成 `desktop`（**会重启桌面宿主**，
正在跑的会话会被打断 ⇒ 挑窗口做）。

## 验收

```bash
node --test test/*.test.mjs        # 11 项：含 v 不兼容 / ok=false / 坏 JSON / 缺文件 四条负向
node test/preflight.mjs            # 用真 @deepseek-ai/dsh-tools 编译工具定义 + 负向功能检查
curl -s localhost:3080/plugins/dsh-lot2-metrics/status | python3 -m json.tool
```

## 边界（不做什么）

- 不抓取 `/metrics`（那是采集脚本的事）、不写任何文件、不改 lot2 的库。
- 不往 `dsh-dashboards` 里塞 widget：它的 widget endpoint 白名单是硬编码的封闭集合；
  本插件走"自己的状态端点 + agent 工具"，将来若要上原生看板网格，正确做法是把那个白名单**变成可扩展**，
  而不是给每个项目加一个后端。
