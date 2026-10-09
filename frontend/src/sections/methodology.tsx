// 方法论与免责声明：要点折叠 + 评级变更记录 + 完整免责声明（与弹窗共用组件）。
import { ratingChanges } from "@/data";
import {
  ATTENTION_LEVELS,
  EVIDENCE_CONFIDENCE,
  OBSERVATION_PHASES,
  SIGNAL_STATUSES,
  ratingValueLabel,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import Section from "@/sections/Section";
import FullDisclaimer from "@/sections/FullDisclaimer";

const DIMENSION_LABELS: Record<string, string> = {
  observation_phase: "观察阶段",
  attention_level: "关注等级",
  confidence: "证据完整度",
  trend: "趋势",
};

function DefList({ items }: { items: { code: string; label: string; description: string }[] }) {
  return (
    <dl className="space-y-2">
      {items.map((item) => (
        <div key={item.code} className="border-l-2 border-slate-200 pl-3">
          <dt className="text-xs font-medium text-slate-800">
            {item.code}｜{item.label}
          </dt>
          <dd className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function MethodologySection() {
  return (
    <Section
      id="methodology"
      no="11"
      title="方法论与免责声明"
      subtitle="本站帮用户把现在公开的信息整理清楚，而不是预测未来"
    >
      {/* 方法论要点（折叠） */}
      <div className="grid gap-3 md:grid-cols-2">
        <details className="rounded-lg border border-slate-200 p-4">
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-800">
            数据从哪里来 · 来源分级与独立性
          </summary>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
            <p>
              只用合规途径（公开 RSS、官方页面、公开 API）采集与本事件直接相关的公开信息，来源分为
              S（官方/专业原始资料）、A（国际专业媒体）、B（俄罗斯及本地媒体）、C（专家/记者公开账号）、
              D（公开社交平台）五级。来源等级不是事实等级：D 级信号只能进入「未确认」。
            </p>
            <p>
              转载不重复计入独立来源：「地方账号 → 地方媒体 → 国际媒体」的转载链只算 1 个原始信息 + 多个转载；
              独立来源只统计各自独立采访或核实的报道。
            </p>
          </div>
        </details>

        <details className="rounded-lg border border-slate-200 p-4">
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-800">
            信息状态（六态）
          </summary>
          <div className="mt-3">
            <DefList items={SIGNAL_STATUSES.map((s) => ({ code: "", label: s.label, description: s.description }))} />
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              状态变化保留历史：reported → confirmed / contradicted / retracted 的每次流转都记录在案，被撤回的报道不删除。
            </p>
          </div>
        </details>

        <details className="rounded-lg border border-slate-200 p-4">
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-800">
            观察阶段 · 关注等级 · 证据完整度的分级含义
          </summary>
          <div className="mt-3 space-y-4">
            <DefList items={OBSERVATION_PHASES.map((p) => ({ code: p.code, label: p.label, description: p.description }))} />
            <DefList items={ATTENTION_LEVELS.map((l) => ({ code: l.code, label: `${l.emoji} ${l.label}`, description: l.description }))} />
            <DefList items={EVIDENCE_CONFIDENCE.map((c) => ({ code: c.code, label: c.label, description: c.description }))} />
          </div>
        </details>

        <details className="rounded-lg border border-slate-200 p-4">
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-800">
            如何去重 · AI 的角色与限制 · 系统局限
          </summary>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
            <p>去重三层：URL 规范化 → 标题相似 → 语义判定；识别出的转载合并为同一信息的多个版本并标注源头。</p>
            <p>
              AI 只做翻译、摘要、去重辅助与分类建议，输出永远是建议、需人工确认；AI 不得创造事实、病例、检测结果或传播链。
            </p>
            <p>
              系统局限：采集覆盖有限、翻译可能有误差、公开信息本身可能延迟或出错、本站不具备实验室检测与现场调查能力。
            </p>
          </div>
        </details>
      </div>

      {/* 评级变更记录 */}
      {ratingChanges.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-slate-800">评级变更记录</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">每次阶段 / 等级 / 证据 / 趋势变化都记录理由与依据来源</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">时间</th>
                  <th className="py-2 pr-3 font-medium">维度</th>
                  <th className="py-2 pr-3 font-medium">变化</th>
                  <th className="py-2 pr-3 font-medium">理由</th>
                  <th className="py-2 font-medium">依据</th>
                </tr>
              </thead>
              <tbody>
                {[...ratingChanges].reverse().map((c, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-slate-500">{formatDateTime(c.timestamp)}</td>
                    <td className="py-2 pr-3 text-slate-700">{DIMENSION_LABELS[c.dimension] ?? c.dimension}</td>
                    <td className="whitespace-nowrap py-2 pr-3 font-medium text-slate-900">
                      {ratingValueLabel(c.dimension, c.from)} → {ratingValueLabel(c.dimension, c.to)}
                    </td>
                    <td className="py-2 pr-3 leading-relaxed text-slate-600">{c.reason}</td>
                    <td className="py-2 text-slate-500">{c.source_ids.join("、") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 完整免责声明（与进入弹窗共用同一组件，统一维护） */}
      <div className="mt-10 border-t border-slate-200 pt-8">
        <FullDisclaimer />
      </div>
    </Section>
  );
}
