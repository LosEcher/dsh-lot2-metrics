# Changelog

本仓按时间倒序记录**对外可见的行为变化**（字段/端点/工具的语义变化都算）。
版本号跟 `package.json`；契约版本（快照信封 `v`）与包版本是两件事，前者见 README 的四条语义。

## 0.1.0 — 2026-10-12

首个可发布版本。

- **host 半**：`GET /plugins/dsh-lot2-metrics/status`（约定形状）与
  `GET /plugins/dsh-lot2-metrics/snapshot`（面板数据源）；两个只读 agent 工具
  `lot2_metrics_overview` / `lot2_metrics_query`。
- **client 半**：会话 tab「lot2 指标」（`conversation.view`，order 92）。
- **只读快照的四条语义**（都有测试）：未知 `v` ⇒ 报契约不兼容且不渲染数字；`ok=false` ⇒ 不给数字；
  缺字段/坏 JSON/文件不存在 ⇒ 降级为该块留空 + reason，不抛；回答必带 `capturedAt` 与快照路径。
- **运行期与阈值**：呈现快照 `runtime{}`（gauge 带单位、`absent` 显示为"未上报（缺失≠0）"、
  算不出的比值给 `value=null` + reason）；阈值**只读**采集器落盘的结论，显示 越界/正常/无数据 三态。
- **发布面**：`LICENSE`(MIT) + `tools/publish-readiness.*`（各仓自带、自足）。
