/**
 * dsh-lot2-metrics — client entry: registers a 'lot2 指标' conversation tab
 * ('conversation.view' slot) backed by the host half's read-only
 * GET /plugins/dsh-lot2-metrics/snapshot endpoint.
 */
import type { Context } from 'cordis'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { Lot2MetricsView } from './Lot2MetricsView.tsx'
import { en, NS, zh } from './locales.ts'

export const inject = ['slots', 'conversation', 'locale']

export function apply(ctx: Context) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-lot2-metrics: dictionaries')
  const t = ctx.locale.bind(NS)
  let disposeTab: (() => void) | undefined
  disposeTab = ctx.slots.inject('conversation.view', () =>
    ctx.slots.register({
      name: 'conversation.view',
      id: 'lot2-metrics',
      // dashboard=90, health-panel=95 ⇒ 插在两者之间，紧邻看板
      order: 92,
      locale: NS,
      label: () => t('view.tab'),
    }, (props) => Lot2MetricsView({ ...props, t })))

  ctx.on('dispose', () => disposeTab?.())
}
