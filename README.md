# dsh-lot2-metrics

把 **lot2 后端数据库指标**的采集快照变成 DSH 里"**agent 可查 + 可观测**"的东西。
两半都有：host 半注册 2 个只读 agent 工具 + 只读端点（`/status`、`/snapshot`）；client 半是一个 `lot2 指标` 会话 tab（`conversation.view`）。

- **契约**：`dsfolder/CROSS-PROJECT-INTEGRATION-MECHANISM-2026-10-07.md` §9（"项目快照信封 v1"）
- **归属**：取数与契约属 lot2（`lot2extension/scripts/metrics-report.mjs`）；触发与落盘属 DSH 采集
  （`dsfolder/scripts/lot2-metrics-collect.sh` + launchd `com.echerlos.lot2-metrics`）；
  **呈现与查询属本插件**（只读快照文件，绝不抓取、不写盘）

## 装了什么

| 面 | 内容 |
|---|---|
| 工具 | `lot2_metrics_overview`（概览：新鲜度/Top-N 调用量/放大倍数 + **采集器状态 + 阈值结论 + 运行期 gauge**）；`lot2_metrics_query`（按 operation/关键字过滤 + 按 count/p95/deltaCount/amplification 排序 + Top-N） |
| 端点 | `GET /plugins/dsh-lot2-metrics/status`（约定形状）；`GET /plugins/dsh-lot2-metrics/snapshot`（面板数据源，`cache-control: no-store`） |
| 视图 | 会话 tab「lot2 指标」（`conversation.view`，order 92）：阈值 → 运行期 → 调用量 Top → 放大倍数 Top；60s 轮询 + 手动刷新 |
| 配置 | `snapshotPath` / `statePath` / `staleSeconds`（默认 1500）/ `topN`（默认 5） |

### 运行期与阈值（2026-10-11 新增）

快照侧多了一个 `runtime{}` 段（兼容变更，`v` 仍为 1）：声明式 gauge 清单 + `http`(5xx 等) + `cache` + `counterDelta`。
本插件对它的三条显示纪律：

1. **`value=null` + `reason` 要显示成 `—` 并给出原因**，不能省略——省略会让"分母为 0 所以算不出命中率"
   看起来像"根本没有这一项"。面板与工具都这么做。
2. **`unknown`（采集器声明了但 /metrics 没上报的名字）单独列出并标注"缺失≠0"**。
   `snapshot_queue_depth` / `unified_queue_depth` 目前就长期在这种状态（按需注册）。
3. **阈值不在本插件里判定**：采集器（`dsfolder/scripts/lot2-metrics-collect.sh`）判一次并落盘到
   `collector-state.json` 的 `thresholds[]`，本插件只读结论。理由是**不能有第二个评分源**
   （同一份事实两处实现 = 迟早不一致）。面板上三种状态都可区分：越界 / 正常 / 无数据。

## 四条语义（都有测试；不是"顺手加的"）

1. **未知 `v` ⇒ 报契约不兼容，绝不渲染数字**（不猜字段）。
2. **`ok=false` ⇒ 不给任何数字** —— 绝不把上一次的数值当成本次。
3. **缺字段 / 坏 JSON / 文件不存在 ⇒ 不抛异常**，只降级为该块留空 + reason。
   插件任何路径都不把异常抛给 cordis（本仓有"插件拖垮整树"的先例）。
4. **回答必带 `capturedAt` 与快照路径** ⇒ 可追溯。`p95` 一律标注为**直方图插值近似值**。

`derived.note` 只当**人读提示**透出，不参与任何判断（lot2 契约 §10：固定字段名、两条固定句子、不承载数据）。

## 安装

```bash
# A) 本地开发（改了就生效，推荐给正在改这个插件的人）：link 到工作副本
cd ~/.dsh/profiles/web
dsh plugin --profile web add link:<这个仓的本机路径>

# B) 直接用发布版
dsh plugin --profile web add github:LosEcher/dsh-lot2-metrics#main
```
# 首次挂载可热生效（config-only）；**改 host 半代码后必须重启对应宿主**（Node ESM 按 URL 缓存）。
# 只改 client 半（`src/client/*` + `npm run build`）则刷新页面即可——产物由宿主直接 serve。

`desktop` profile 要同样的工具，就把上面命令的 `web` 换成 `desktop`（**会重启桌面宿主**，
正在跑的会话会被打断 ⇒ 挑窗口做）。

## 看不到「lot2 指标」tab 时

这个 tab 属于 **DSH shell 的会话视图**，桌面 App（GUI）与浏览器（web）渲染的是同一个 shell；
两边都可能因为**没有通过 DSH 的浏览器认证**而什么都看不到。

- **本机**：`dsh web` 的浏览器认证要一个**每进程随机**的 launch token URL（不是普通的
  `http://127.0.0.1:3080/`）。daemon 以 `--no-open` 启动，所以这个 URL 只写在
  `~/.dsh/logs/dsh-web.log` 的一行里，看起来就像"web 打不开了"。取它：
  ```sh
  dsh-web-url            # = ~/.dsh/scripts/dsh-web-url.sh，会顺便校验这条还灵不灵
  dsh-web-url --open     # 直接打开
  ```
  cookie 是持久的（签名密钥在 `~/.dsh/.credentials.yaml`，30 天有效）⇒ **每个浏览器只需要这个
  URL 一次**；之后即使重启宿主也还在。
- **远程（手机/别的机器）**：走 `tailscale serve` 的域名，会先过 `dsh-access-gate` 的访问码，
  再完成同一个 token 交换：
  ```sh
  dsh-web-url --remote   # 打印 https://<你的 tailnet 域名>/?token=…
  ```
- **SSH 隧道/端口转发类客户端**（例如 Otty）：如果它把请求送成 `Host: 127.0.0.1:3088` 且不带
  `X-Forwarded-For`，`dsh-access-gate` 会按"直接本机"放行（这是它的设计）⇒ **不会弹访问码**，
  直接撞上 DSH 的 token 认证。此时同样用 `dsh-web-url`（带上 token）即可进去，而不是反复刷新。
- 进去之后 tab 本身还有独立的状态语义（见上）：契约不兼容 / 采集失败 / 过期 / 新鲜，四种都会显示。

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
