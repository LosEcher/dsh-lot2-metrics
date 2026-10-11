window.__ModuleLoader__.load({ id: "dsh-lot2-metrics", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/Lot2MetricsView.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/Lot2MetricsView.module.css
var css = "/*\n * dsh-lot2-metrics \u2014 tab view styles.\n * \u53EA\u7528 --dsw-alias-* \u8BBE\u8BA1\u4EE4\u724C\uFF08\u6D45/\u6DF1\u4E3B\u9898\u81EA\u9002\u5E94\uFF09\uFF1B\u4E0D\u5199\u6B7B\u8272\u503C\u3001\u4E0D\u7528\u5185\u8054 style\u3002\n */\n\n._a4d0fe13_wrap {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  padding: 16px;\n  height: 100%;\n  overflow: auto;\n  color: var(--dsw-alias-label-primary);\n}\n\n._f4e9a292_header {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 8px;\n}\n\n._3ad3a44e_title {\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--dsw-alias-label-primary);\n  margin-right: 4px;\n}\n\n._efa1daec_badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 2px 8px;\n  border-radius: 999px;\n  font-size: 12px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-secondary);\n}\n\n/* \u72B6\u6001\u5FBD\u7AE0\uFF1Atertiary(\u6D45 tint) \u505A\u5E95\u3001primary \u7ECF color-mix \u505A\u5B57\uFF08\u5BF9\u6BD4\u5EA6\u8FBE\u6807\uFF09 */\n._90154a15_badgeDone {\n  background: var(--dsw-alias-state-success-tertiary);\n  border-color: var(--dsw-alias-state-success-secondary);\n  color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 55%, var(--dsw-alias-label-primary));\n}\n\n._2fbe9efa_badgeWarn {\n  background: var(--dsw-alias-state-warn-tertiary);\n  border-color: var(--dsw-alias-state-warn-secondary);\n  color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 55%, var(--dsw-alias-label-primary));\n}\n\n._052b3f30_badgeError {\n  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, var(--dsw-alias-bg-layer-1));\n  border-color: var(--dsw-alias-state-error-primary);\n  color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 55%, var(--dsw-alias-label-primary));\n}\n\n._ffdbeddf_badgeIdle {\n  background: var(--dsw-alias-bg-layer-2);\n  border-color: var(--dsw-alias-border-l2);\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._d75b2408_pill {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  font-size: 12px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n._28277f62_pillDim {\n  color: var(--dsw-alias-label-tertiary);\n}\n\n._6d07c5cf_mono {\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n  font-variant-numeric: tabular-nums;\n}\n\n._acdd1931_notice {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-2);\n  border-radius: 8px;\n  padding: 10px 12px;\n  font-size: 13px;\n  color: var(--dsw-alias-label-secondary);\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n._35e2f40b_noticeError {\n  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, var(--dsw-alias-bg-layer-1));\n  border-color: var(--dsw-alias-state-error-primary);\n}\n\n._f942af85_section {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n._4d5b893f_sectionTitle {\n  font-size: 12px;\n  font-weight: 600;\n  color: var(--dsw-alias-label-secondary);\n  text-transform: uppercase;\n  letter-spacing: 0.04em;\n}\n\n._ed8cb0af_tableWrap {\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 8px;\n  overflow: hidden;\n  background: var(--dsw-alias-bg-layer-1);\n}\n\n._a883a3ac_table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 12px;\n}\n\n._a883a3ac_table th {\n  text-align: left;\n  font-weight: 500;\n  color: var(--dsw-alias-label-tertiary);\n  padding: 6px 10px;\n  border-bottom: 1px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-layer-2);\n  white-space: nowrap;\n}\n\n._a883a3ac_table td {\n  padding: 6px 10px;\n  border-bottom: 1px solid var(--dsw-alias-border-l1);\n  color: var(--dsw-alias-label-primary);\n  white-space: nowrap;\n}\n\n._a883a3ac_table tbody tr:last-child td {\n  border-bottom: none;\n}\n\n._a883a3ac_table tbody tr:hover td {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n._530ae62b_num {\n  text-align: right;\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n  font-variant-numeric: tabular-nums;\n}\n\n._5774c140_ampRow {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 4px 10px;\n  font-size: 12px;\n  border-bottom: 1px solid var(--dsw-alias-border-l1);\n}\n\n._5774c140_ampRow:last-child {\n  border-bottom: none;\n}\n\n._2ba986f7_ampKey {\n  color: var(--dsw-alias-label-secondary);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._27052170_ampValue {\n  color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, var(--dsw-alias-label-primary));\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n  font-variant-numeric: tabular-nums;\n}\n\n._2863d307_footer {\n  margin-top: auto;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  font-size: 11px;\n  color: var(--dsw-alias-label-caption);\n}\n\n._9fc677ad_path {\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n._c158d4e3_refresh {\n  align-self: flex-start;\n  height: 28px;\n  padding: 0 10px;\n  border-radius: 8px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-2);\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  cursor: pointer;\n  font-family: inherit;\n}\n\n._c158d4e3_refresh:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n._c158d4e3_refresh:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary);\n  outline-offset: 1px;\n}\n\n._c158d4e3_refresh:disabled {\n  color: var(--dsw-alias-label-dimmed);\n  cursor: default;\n}\n\n/* \u9608\u503C\u884C\uFF082026-10-11\uFF09\uFF1A\u5FBD\u7AE0 + \u6807\u8BC6\u7B26 + \u8BF4\u660E\u4E09\u6BB5\u5F0F\uFF0C\u8BF4\u660E\u53EF\u622A\u65AD\uFF08title \u653E\u5168\u6587\uFF09\u3002 */\n._35245b65_thrList {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n._59feb40c_thrItem {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n._6d3284c7_thrName {\n  /* \u4E0E ._6d07c5cf_mono \u540C\u4E00\u5B57\u4F53\u6808\uFF1A\u4E3B\u9898\u5C42\u6CA1\u6709\u5BF9\u5E94\u7684 mono \u5B57\u53F7\u4EE4\u724C\uFF08\u5B9E\u6D4B grep \u65E0\uFF09\uFF0C\n     \u5199\u6210 var() \u53EA\u4F1A\u9759\u9ED8 fallback\u2014\u2014\u4E0D\u5982\u76F4\u63A5\u5199\u6808\u3002 */\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n  font-size: 12px;\n  color: var(--dsw-alias-label-primary);\n  flex: 0 0 auto;\n}\n._2e2ea9ae_thrDetail {\n  font-size: 12px;\n  color: var(--dsw-alias-label-tertiary);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  min-width: 0;\n}\n";
var tagId = "dsh-lot2-metrics/Lot2MetricsView.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-lot2-metrics";
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
var Lot2MetricsView_default = { "sectionTitle": "_4d5b893f_sectionTitle", "noticeError": "_35e2f40b_noticeError", "badgeError": "_052b3f30_badgeError", "badgeDone": "_90154a15_badgeDone", "badgeWarn": "_2fbe9efa_badgeWarn", "badgeIdle": "_ffdbeddf_badgeIdle", "tableWrap": "_ed8cb0af_tableWrap", "thrDetail": "_2e2ea9ae_thrDetail", "ampValue": "_27052170_ampValue", "pillDim": "_28277f62_pillDim", "section": "_f942af85_section", "refresh": "_c158d4e3_refresh", "thrList": "_35245b65_thrList", "thrItem": "_59feb40c_thrItem", "thrName": "_6d3284c7_thrName", "header": "_f4e9a292_header", "notice": "_acdd1931_notice", "ampRow": "_5774c140_ampRow", "ampKey": "_2ba986f7_ampKey", "footer": "_2863d307_footer", "title": "_3ad3a44e_title", "badge": "_efa1daec_badge", "table": "_a883a3ac_table", "wrap": "_a4d0fe13_wrap", "pill": "_d75b2408_pill", "mono": "_6d07c5cf_mono", "path": "_9fc677ad_path", "num": "_530ae62b_num" };

// src/client/locales.ts
var NS = "dsh-lot2-metrics";
var en = {
  "view.tab": "lot2 metrics",
  "view.title": "lot2 database metrics",
  "view.fresh": "fresh",
  "view.stale": "STALE",
  "view.failed": "scrape failed",
  "view.incompatible": "contract incompatible",
  "view.noData": "no snapshot",
  "view.loading": "loading\u2026",
  "view.captured": "captured",
  "view.contract": "contract",
  "view.rows": "rows",
  "view.collector": "collector",
  "view.amps": "amplification",
  "view.refresh": "refresh",
  "view.topByCount": "Top by calls",
  "view.topByAmp": "Top by amplification",
  "view.ampHint": "calls delta \xF7 request delta for the same window; \u2014 means no denominator",
  "view.col.operation": "operation",
  "view.col.table": "table",
  "view.col.count": "count",
  "view.col.delta": "\u0394",
  "view.col.p95": "p95\u2248",
  "view.col.amp": "amp",
  "view.approx": "p95\u2248 is linearly interpolated from histogram buckets (approximate)",
  "view.snapshot": "snapshot",
  // ── 运行期与阈值（2026-10-11）────────────────────────────────────────────
  // 阈值名（ws-zero/backpressure/5xx/goroutines）是标识符，两种语言都保留原文。
  "view.thresholds": "thresholds",
  "view.runtime": "runtime",
  "view.unknown": "not reported",
  "view.unknownNote": "declared by the collector but absent from /metrics \u2014 missing is not 0",
  "view.thrBreached": "breached",
  "view.thrOk": "ok",
  "view.thrNoData": "no data",
  "view.thrNotEvaluated": "thresholds not evaluated (collector state unreadable)",
  "view.thrAt": "evaluated at",
  "view.degraded": "backend degraded",
  "view.failReason": "failure class",
  "view.col.metric": "metric",
  "view.col.value": "value",
  "view.col.note": "note",
  "view.incompatibleNotice": "The snapshot declares a contract version this plugin does not understand, so it refuses to interpret it (no numbers are shown on purpose).",
  "view.failedNotice": "This scrape failed. Numbers are withheld on purpose \u2014 showing the previous values as if they were current is exactly the failure mode the contract forbids."
};
var zh = {
  "view.tab": "lot2 \u6307\u6807",
  "view.title": "lot2 \u6570\u636E\u5E93\u6307\u6807",
  "view.fresh": "\u65B0\u9C9C",
  "view.stale": "\u5DF2\u8FC7\u671F",
  "view.failed": "\u91C7\u96C6\u5931\u8D25",
  "view.incompatible": "\u5951\u7EA6\u4E0D\u517C\u5BB9",
  "view.noData": "\u65E0\u5FEB\u7167",
  "view.loading": "\u52A0\u8F7D\u4E2D\u2026",
  "view.captured": "\u91C7\u96C6\u4E8E",
  "view.contract": "\u5951\u7EA6",
  "view.rows": "\u884C\u6570",
  "view.collector": "\u91C7\u96C6\u5668",
  "view.amps": "\u653E\u5927\u500D\u6570",
  "view.refresh": "\u5237\u65B0",
  "view.topByCount": "\u8C03\u7528\u91CF Top",
  "view.topByAmp": "\u653E\u5927\u500D\u6570 Top",
  "view.ampHint": "\u540C\u671F\uFF08\u8BE5\u8868\u8C03\u7528\u589E\u91CF \xF7 \u8BF7\u6C42\u589E\u91CF\uFF09\uFF1B\u2014 \u8868\u793A\u7F3A\u5206\u6BCD",
  "view.col.operation": "\u64CD\u4F5C",
  "view.col.table": "\u8868",
  "view.col.count": "\u6B21\u6570",
  "view.col.delta": "\u0394",
  "view.col.p95": "p95\u2248",
  "view.col.amp": "\u653E\u5927",
  "view.approx": "p95\u2248 \u7531\u76F4\u65B9\u56FE\u6876\u7EBF\u6027\u63D2\u503C\u5F97\u5230\uFF0C\u662F\u8FD1\u4F3C\u503C",
  "view.snapshot": "\u5FEB\u7167",
  "view.thresholds": "\u9608\u503C",
  "view.runtime": "\u8FD0\u884C\u671F",
  "view.unknown": "\u672A\u4E0A\u62A5",
  "view.unknownNote": "\u91C7\u96C6\u5668\u58F0\u660E\u4E86\u4F46 /metrics \u6CA1\u6709\u8FD9\u4E00\u9879\u2014\u2014\u7F3A\u5931\u4E0D\u7B49\u4E8E 0",
  "view.thrBreached": "\u8D8A\u754C",
  "view.thrOk": "\u6B63\u5E38",
  "view.thrNoData": "\u65E0\u6570\u636E",
  "view.thrNotEvaluated": "\u9608\u503C\u672A\u8BC4\u4F30\uFF08\u8BFB\u4E0D\u5230\u91C7\u96C6\u5668\u72B6\u6001\uFF09",
  "view.thrAt": "\u5224\u5B9A\u4E8E",
  "view.degraded": "\u540E\u7AEF\u5728\u9000\u5316",
  "view.failReason": "\u5931\u8D25\u7C7B\u522B",
  "view.col.metric": "\u6307\u6807",
  "view.col.value": "\u503C",
  "view.col.note": "\u8BF4\u660E",
  "view.incompatibleNotice": "\u5FEB\u7167\u58F0\u660E\u7684\u5951\u7EA6\u7248\u672C\u672C\u63D2\u4EF6\u4E0D\u8BA4\u8BC6\uFF0C\u56E0\u6B64\u62D2\u7EDD\u89E3\u8BFB\uFF08\u4E0D\u663E\u793A\u4EFB\u4F55\u6570\u5B57\u662F\u523B\u610F\u8BBE\u8BA1\uFF09\u3002",
  "view.failedNotice": "\u672C\u6B21\u6293\u53D6\u5931\u8D25\u3002\u523B\u610F\u4E0D\u7ED9\u6570\u5B57\u2014\u2014\u628A\u4E0A\u4E00\u6B21\u7684\u503C\u5F53\u6210\u672C\u6B21\u663E\u793A\uFF0C\u6B63\u662F\u5951\u7EA6\u660E\u4EE4\u7981\u6B62\u7684\u5931\u6548\u6A21\u5F0F\u3002"
};

// src/client/Lot2MetricsView.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var REFRESH_MS = 6e4;
function fmtNum(v, digits = 0) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "\u2014";
  return Number.isInteger(v) && digits === 0 ? String(v) : v.toFixed(digits);
}
function fmtBytes(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "\u2014";
  const mib = v / 1048576;
  return mib >= 1 ? `${mib.toFixed(1)} MiB` : `${(v / 1024).toFixed(0)} KiB`;
}
function fmtAge(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "\u2014";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h${String(Math.floor(seconds % 3600 / 60)).padStart(2, "0")}m`;
}
var FALLBACK = {
  "view.title": "lot2 \u6570\u636E\u5E93\u6307\u6807",
  "view.fresh": "\u65B0\u9C9C",
  "view.stale": "\u5DF2\u8FC7\u671F",
  "view.failed": "\u91C7\u96C6\u5931\u8D25",
  "view.incompatible": "\u5951\u7EA6\u4E0D\u517C\u5BB9",
  "view.noData": "\u65E0\u5FEB\u7167",
  "view.loading": "\u52A0\u8F7D\u4E2D\u2026",
  "view.captured": "\u91C7\u96C6\u4E8E",
  "view.contract": "\u5951\u7EA6",
  "view.rows": "\u884C\u6570",
  "view.collector": "\u91C7\u96C6\u5668",
  "view.refresh": "\u5237\u65B0",
  "view.topByCount": "\u8C03\u7528\u91CF Top",
  "view.topByAmp": "\u653E\u5927\u500D\u6570 Top",
  "view.ampHint": "\u540C\u671F\uFF08\u8BE5\u8868\u8C03\u7528\u589E\u91CF \xF7 \u8BF7\u6C42\u589E\u91CF\uFF09\uFF1B\u2014 \u8868\u793A\u7F3A\u5206\u6BCD",
  "view.col.operation": "\u64CD\u4F5C",
  "view.col.table": "\u8868",
  "view.col.count": "\u6B21\u6570",
  "view.col.delta": "\u0394",
  "view.col.p95": "p95\u2248",
  "view.col.amp": "\u653E\u5927",
  "view.approx": "p95\u2248 \u7531\u76F4\u65B9\u56FE\u6876\u7EBF\u6027\u63D2\u503C\u5F97\u5230\uFF0C\u662F\u8FD1\u4F3C\u503C",
  "view.snapshot": "\u5FEB\u7167",
  "view.thresholds": "\u9608\u503C",
  "view.runtime": "\u8FD0\u884C\u671F",
  "view.unknown": "\u672A\u4E0A\u62A5",
  "view.unknownNote": "\u91C7\u96C6\u5668\u58F0\u660E\u4E86\u4F46 /metrics \u6CA1\u6709\u8FD9\u4E00\u9879\u2014\u2014\u7F3A\u5931\u4E0D\u7B49\u4E8E 0",
  "view.thrBreached": "\u8D8A\u754C",
  "view.thrOk": "\u6B63\u5E38",
  "view.thrNoData": "\u65E0\u6570\u636E",
  "view.thrNotEvaluated": "\u9608\u503C\u672A\u8BC4\u4F30\uFF08\u8BFB\u4E0D\u5230\u91C7\u96C6\u5668\u72B6\u6001\uFF09",
  "view.thrAt": "\u5224\u5B9A\u4E8E",
  "view.degraded": "\u540E\u7AEF\u5728\u9000\u5316",
  "view.failReason": "\u5931\u8D25\u7C7B\u522B",
  "view.col.metric": "\u6307\u6807",
  "view.col.value": "\u503C",
  "view.col.note": "\u8BF4\u660E",
  "view.incompatibleNotice": "\u5FEB\u7167\u58F0\u660E\u7684\u5951\u7EA6\u7248\u672C\u672C\u63D2\u4EF6\u4E0D\u8BA4\u8BC6\uFF0C\u56E0\u6B64\u62D2\u7EDD\u89E3\u8BFB\uFF08\u4E0D\u663E\u793A\u4EFB\u4F55\u6570\u5B57\u662F\u523B\u610F\u8BBE\u8BA1\uFF09\u3002",
  "view.failedNotice": "\u672C\u6B21\u6293\u53D6\u5931\u8D25\u3002\u523B\u610F\u4E0D\u7ED9\u6570\u5B57\u2014\u2014\u628A\u4E0A\u4E00\u6B21\u7684\u503C\u5F53\u6210\u672C\u6B21\u663E\u793A\uFF0C\u6B63\u662F\u5951\u7EA6\u660E\u4EE4\u7981\u6B62\u7684\u5931\u6548\u6A21\u5F0F\u3002"
};
function Lot2MetricsView(props) {
  const t = (0, import_react.useCallback)((key) => props.t?.(key) ?? FALLBACK[key] ?? key, [props]);
  const [data, setData] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const timer = (0, import_react.useRef)(null);
  const load = (0, import_react.useCallback)(async () => {
    setBusy(true);
    try {
      const res = await fetch(`/plugins/${NS}/snapshot`, { signal: AbortSignal.timeout(8e3), cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);
  (0, import_react.useEffect)(() => {
    void load();
    timer.current = setInterval(() => {
      void load();
    }, REFRESH_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);
  const state = (() => {
    if (!data) return { dot: "idle", cls: Lot2MetricsView_default.badgeIdle, label: error ? t("view.noData") : t("view.loading") };
    if (data.incompatible) return { dot: "error", cls: Lot2MetricsView_default.badgeError, label: t("view.incompatible") };
    if (!data.ok) return { dot: "error", cls: Lot2MetricsView_default.badgeError, label: t("view.failed") };
    if (data.stale) return { dot: "warning", cls: Lot2MetricsView_default.badgeWarn, label: t("view.stale") };
    return { dot: "done", cls: Lot2MetricsView_default.badgeDone, label: t("view.fresh") };
  })();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Lot2MetricsView_default.wrap, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Lot2MetricsView_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.title, children: t("view.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: `${Lot2MetricsView_default.badge} ${state.cls}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.StateDot, { state: state.dot, size: 8 }),
        state.label
      ] }),
      data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: Lot2MetricsView_default.pill, children: [
          t("view.captured"),
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.mono, title: data.capturedAt ?? "", children: data.ageSeconds === null ? "\u2014" : `${fmtAge(data.ageSeconds)} ago` })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: `${Lot2MetricsView_default.pill} ${Lot2MetricsView_default.pillDim}`, children: [
          t("view.contract"),
          " v",
          fmtNum(data.contractVersion)
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: `${Lot2MetricsView_default.pill} ${Lot2MetricsView_default.pillDim}`, children: [
          t("view.rows"),
          " ",
          fmtNum(data.queryRows)
        ] }),
        data.collector && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: `${Lot2MetricsView_default.pill} ${Lot2MetricsView_default.pillDim}`, children: [
          t("view.collector"),
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.mono, children: data.collector.verdict ?? "\u2014" }),
          typeof data.collector.consecutiveFailures === "number" && data.collector.consecutiveFailures > 0 ? ` \xD7${data.collector.consecutiveFailures}` : ""
        ] }),
        data.collector?.lastFailReason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: `${Lot2MetricsView_default.pill} ${Lot2MetricsView_default.pillDim}`, children: [
          t("view.failReason"),
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.mono, children: data.collector.lastFailReason })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: Lot2MetricsView_default.refresh, onClick: () => {
        void load();
      }, disabled: busy, children: t("view.refresh") })
    ] }),
    !data && error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `${Lot2MetricsView_default.notice} ${Lot2MetricsView_default.noticeError}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
        "\u8BFB\u4E0D\u5230 host \u7AEF\u70B9\uFF1A",
        error
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.mono, children: `/plugins/${NS}/snapshot` })
    ] }),
    data?.incompatible && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `${Lot2MetricsView_default.notice} ${Lot2MetricsView_default.noticeError}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("view.incompatibleNotice") }),
      data.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: data.notes })
    ] }),
    data && !data.incompatible && !data.ok && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `${Lot2MetricsView_default.notice} ${Lot2MetricsView_default.noticeError}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("view.failedNotice") }),
      data.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: data.notes })
    ] }),
    data && data.ok && !data.incompatible && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Lot2MetricsView_default.section, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.sectionTitle, children: t("view.thresholds") }),
        data.thresholds.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.pillDim, children: t("view.thrNotEvaluated") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: Lot2MetricsView_default.thrList, children: data.thresholds.map((thr, i) => {
          const noData = thr.value === null;
          const dot = thr.breached ? "error" : noData ? "idle" : "done";
          const label = thr.breached ? t("view.thrBreached") : noData ? t("view.thrNoData") : t("view.thrOk");
          const cls = thr.breached ? Lot2MetricsView_default.badgeError : noData ? Lot2MetricsView_default.badgeIdle : Lot2MetricsView_default.badgeDone;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Lot2MetricsView_default.thrItem, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: `${Lot2MetricsView_default.badge} ${cls}`, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.StateDot, { state: dot, size: 8 }),
              label
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.thrName, children: thr.name ?? "\u2014" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.thrDetail, title: thr.detail ?? "", children: thr.detail ?? "" })
          ] }, `${thr.name ?? "thr"}:${i}`);
        }) }),
        data.thresholdsEvaluatedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: Lot2MetricsView_default.pillDim, children: [
          t("view.thrAt"),
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.mono, children: data.thresholdsEvaluatedAt })
        ] })
      ] }),
      data.runtimePresent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Lot2MetricsView_default.section, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.sectionTitle, children: t("view.runtime") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: Lot2MetricsView_default.tableWrap, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: Lot2MetricsView_default.table, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("view.col.metric") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: Lot2MetricsView_default.num, children: t("view.col.value") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("view.col.note") })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.runtimeMetrics.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: Lot2MetricsView_default.mono, children: m.name }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: Lot2MetricsView_default.num, title: m.reason ?? "", children: m.value === null ? "\u2014" : `${fmtNum(m.value, m.unit === "ratio" ? 4 : 0)}${m.unit === "bytes" ? ` (${fmtBytes(m.value)})` : ""}` }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: Lot2MetricsView_default.pillDim, children: m.reason ?? (m.unit ?? "") })
          ] }, m.name)) })
        ] }) }),
        data.unknownMetrics.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: Lot2MetricsView_default.pillDim, children: [
          t("view.unknown"),
          ": ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.mono, children: data.unknownMetrics.join(", ") }),
          " \u2014 ",
          t("view.unknownNote")
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Lot2MetricsView_default.section, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.sectionTitle, children: t("view.topByCount") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: Lot2MetricsView_default.tableWrap, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: Lot2MetricsView_default.table, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("view.col.operation") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: t("view.col.table") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: Lot2MetricsView_default.num, children: t("view.col.count") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: Lot2MetricsView_default.num, children: t("view.col.delta") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: Lot2MetricsView_default.num, children: t("view.col.p95") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: Lot2MetricsView_default.num, children: t("view.col.amp") })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.topByCount.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: Lot2MetricsView_default.mono, children: r.operation ?? "\u2014" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: Lot2MetricsView_default.mono, children: r.table ?? "\u2014" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: Lot2MetricsView_default.num, children: fmtNum(r.count) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: Lot2MetricsView_default.num, children: fmtNum(r.deltaCount) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { className: Lot2MetricsView_default.num, children: [
              fmtNum(r.p95Seconds, 3),
              "s"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: Lot2MetricsView_default.num, children: fmtNum(r.amplification, 2) })
          ] }, `${r.operation}:${r.table}:${i}`)) })
        ] }) })
      ] }),
      data.topByAmplification.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Lot2MetricsView_default.section, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.sectionTitle, children: t("view.topByAmp") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: Lot2MetricsView_default.tableWrap, children: data.topByAmplification.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Lot2MetricsView_default.ampRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.ampKey, title: r.key, children: r.key }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: Lot2MetricsView_default.ampValue, children: [
            fmtNum(r.amplification, 2),
            "\xD7"
          ] })
        ] }, r.key)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Lot2MetricsView_default.pillDim, children: t("view.ampHint") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: Lot2MetricsView_default.footer, children: [
      data?.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: data.notes }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("view.approx") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: Lot2MetricsView_default.path, title: data?.snapshotPath ?? "", children: [
        t("view.snapshot"),
        ": ",
        data?.snapshotPath ?? "\u2014"
      ] })
    ] })
  ] });
}

// src/client/index.ts
var inject = ["slots", "conversation", "locale"];
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-lot2-metrics: dictionaries");
  const t = ctx.locale.bind(NS);
  let disposeTab;
  disposeTab = ctx.slots.inject("conversation.view", () => ctx.slots.register({
    name: "conversation.view",
    id: "lot2-metrics",
    // dashboard=90, health-panel=95 ⇒ 插在两者之间，紧邻看板
    order: 92,
    locale: NS,
    label: () => t("view.tab")
  }, (props) => Lot2MetricsView({ ...props, t })));
  ctx.on("dispose", () => disposeTab?.());
}
return module.exports; } });
