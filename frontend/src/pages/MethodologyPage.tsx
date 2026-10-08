// 方法论页：本站如何采集、如何去重、各状态维度如何定义、为什么不提供概率、系统有哪些局限（规格书 §85）。
import { ratingChanges } from "@/data";
import { formatDateTime } from "@/lib/format";
import {
  ATTENTION_LEVELS,
  EVIDENCE_CONFIDENCE,
  OBSERVATION_PHASES,
  SIGNAL_STATUSES,
} from "@/lib/constants";
import { usePageMeta } from "@/lib/usePageMeta";
import { PageIntro, SectionCard } from "@/components/Cards";

const DIMENSION_LABELS: Record<string, string> = {
  observation_phase: "观察阶段",
  attention_level: "关注等级",
  confidence: "证据完整度",
  trend: "趋势",
};

function DefinitionList({
  items,
}: {
  items: { code: string; label: string; description: string }[];
}) {
  return (
    <dl className="space-y-2">
      {items.map((item) => (
        <div key={item.code} className="rounded-lg border border-slate-200 p-3">
          <dt className="text-sm font-medium text-slate-900">
            {item.code}｜{item.label}
          </dt>
          <dd className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function MethodologyPage() {
  usePageMeta("方法论", "本站的数据来源、去重方法、状态维度定义、历史模式使用方式与系统局限。");

  return (
    <div className="space-y-4">
      <PageIntro>
        本页说明本站的全部工作方法。核心原则：<b>更快发现公开信息变化，而不是更早相信未经确认的结论。</b>
        本站的价值是减少读者发现信息变化所需的时间，不是预测。
      </PageIntro>

      <SectionCard title="1. 数据从哪里来" subtitle="只用合规途径：官方 API、RSS/Feed 与公开网页；不绕过登录、验证码或平台访问限制">
        <p className="text-sm leading-relaxed text-slate-700">
          本站采集官方机构（WHO、ECDC、俄罗斯主管部门等）、国际专业媒体（Reuters、AP、BBC 等）、
          俄罗斯本地媒体、专家/记者公开账号与公开社交平台（X、Telegram、Reddit）中，
          与本事件直接相关的公开信息。每条信息记录：原始 URL、发布时间、采集时间、语言、来源及其等级。
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          采集失败只提示「数据源暂时不可用」，绝不因为采集失败而制造新的风险信号。
        </p>
      </SectionCard>

      <SectionCard title="2. 来源等级与来源独立性">
        <p className="text-sm leading-relaxed text-slate-700">
          来源分为 S（官方/专业原始资料）、A（国际专业媒体）、B（俄罗斯及本地媒体）、
          C（专家/记者公开账号）、D（公开社交平台）五级。<b>来源等级不是事实等级</b>：
          D 级来源的信号可以进入「未确认」，但不能自动变成「已确认」。
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          一条信息沿「地方账号 → 地方媒体 → 国际媒体 → 中文媒体」的转载链传播时，
          只算 <b>1 个原始信息 + 多个转载</b>，而不是多个独立来源。本站为每条信息记录
          origin/derived_from（源头与转载关系），独立来源计数只统计各自独立采访或核实的报道。
        </p>
      </SectionCard>

      <SectionCard title="3. 信息状态（六态）" subtitle="任何信息首先判断「是否与本事件直接相关」，然后标注状态">
        <DefinitionList items={SIGNAL_STATUSES.map((s) => ({ code: s.code, label: s.label, description: s.description }))} />
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          状态变化保留历史：reported → confirmed / contradicted / retracted 的每次流转都会记录，
          被撤回的报道不删除，以便呈现「当时人们知道什么」。
        </p>
      </SectionCard>

      <SectionCard title="4. 观察阶段 O0–O8" subtitle="描述「当前公开信息处于什么状态」，不是官方疫情阶段认定">
        <DefinitionList items={OBSERVATION_PHASES.map((p) => ({ code: p.code, label: p.label, description: p.description }))} />
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          阶段推进必须有证据基础。社交平台热搜、大 V 言论、转载量、情绪化标题都不会触发升级。
        </p>
      </SectionCard>

      <SectionCard title="5. 证据完整度 C0–C4" subtitle="描述「当前判断有多少公开证据支持」">
        <DefinitionList items={EVIDENCE_CONFIDENCE.map((c) => ({ code: c.code, label: c.label, description: c.description }))} />
      </SectionCard>

      <SectionCard title="6. 信息关注等级 L0–L3" subtitle="为避免「疫情等级」误解而命名；不代表疾病发生概率，L3 也不代表「疫情已经爆发」">
        <DefinitionList items={ATTENTION_LEVELS.map((l) => ({ code: l.code, label: `${l.emoji} ${l.label}`, description: l.description }))} />
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          系统内部维护 0–100 的 attention score（权重：传播相关证据 35、地理扩展 20、信息变化速度 15、
          严重程度 10、病原相关性 10、官方措施变化 10），但前端不显示具体数字。
          死亡人数增加、媒体报道增加、转发增加都不会自动提升等级。
        </p>
      </SectionCard>

      <SectionCard title="7. 趋势与数据新鲜度">
        <p className="text-sm leading-relaxed text-slate-700">
          趋势只有四种：↑ 信息增多、→ 基本稳定、↓ 信息减少、? 数据不足。<b>趋势代表公开信息的变化，不是疫情未来趋势。</b>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          每个页面显示数据更新时间、最近一次成功采集与数据源健康状态（healthy / degraded / stale / failed）。
          单个来源失败不影响其他来源。
        </p>
      </SectionCard>

      <SectionCard title="8. 如何去重" subtitle="三层：URL → 标题 → 语义">
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
          <li>URL 去重：规范化后完全一致视为同一信息；</li>
          <li>标题去重：标题规范化后高度相似视为疑似转载；</li>
          <li>语义去重：内容讲同一件事但标题不同的报道，识别后合并为同一信息的多个转载，并标注源头。</li>
        </ol>
      </SectionCard>

      <SectionCard title="9. 历史模式如何使用">
        <p className="text-sm leading-relaxed text-slate-700">
          历史参照只回答「当前事件有哪些信息结构，在过去某些公共卫生事件早期阶段曾出现过」，
          并且必须同时说明「哪些关键特征目前并没有出现」。相似度只用低 / 中 / 较高定性描述并给出理由，
          不提供百分比。历史相似不能用于推断病因、传播能力或最终发展结果。
        </p>
      </SectionCard>

      <SectionCard title="10. 为什么本站不提供概率">
        <div className="space-y-2 text-sm leading-relaxed text-slate-700">
          <p>
            本站没有经过验证的公共卫生事件预测能力。彩票号码的理论中奖概率可以依据明确的组合数学规则计算
            （例如超级大乐透一等奖约为 1/2142万），而本站对未来公共卫生事件的任何判断，
            并没有类似的数学确定性基础。
          </p>
          <p>
            本站没有独立实验室检测、现场流行病学调查，也没有经过充分验证的公共卫生预测模型。
            因此本站不能提供疾病发生概率，「信息关注等级」也不能被理解为事件发生概率。
            本站的判断只是根据当时能获得的公开信息，对信息状态进行整理和辅助性标记。
          </p>
        </div>
      </SectionCard>

      <SectionCard title="11. AI 的角色与限制">
        <p className="text-sm leading-relaxed text-slate-700">
          AI 仅负责翻译、摘要、去重辅助、信息提取、来源关系判断、状态分类建议、Unknown 与 Next Trigger 提取。
          AI 不得创造事实、病例、检测结果或传播链；不得认定政府动机或生物武器；不得输出疾病概率或未来预测；
          不得提供医疗建议。AI 的输出必须保留证据层级，且任何信息都不能被自动晋升为「已确认」——
          「已确认」只能由 S/A 级来源加维护者人工确认产生。
        </p>
      </SectionCard>

      <SectionCard title="12. 系统局限">
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
          <li>采集覆盖有限：仅覆盖已登记的来源，可能遗漏未被这些来源报道的信息；</li>
          <li>翻译误差：机器翻译可能损失原文细节，重要表述以原文为准（每条信息保留原文标题与原始链接）；</li>
          <li>AI 结构化存在出错可能：因此所有 AI 输出都只是建议，最终状态由维护者确认；</li>
          <li>本站不是官方机构：不具备独立实验室检测、现场调查或医学诊断能力；</li>
          <li>公开信息本身的局限：延迟、遗漏、重复转载、来源不完整、未经证实内容都可能出现。</li>
        </ul>
      </SectionCard>

      <SectionCard title="13. 信息纠错">
        <p className="text-sm leading-relaxed text-slate-700">
          任何信息的状态都可以流转（如 reported → confirmed 或 reported → contradicted / retracted），
          页面保留全部历史变化。发现错误可通过仓库 Issue 反馈，附上公开来源。
        </p>
      </SectionCard>

      {ratingChanges.length > 0 && (
        <SectionCard
          title="14. 评级变更记录"
          subtitle="每次阶段 / 等级 / 证据 / 趋势变化都记录理由与依据来源（规格书 §100–§101）"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-400">
                  <th className="py-2 pr-3 font-medium">时间</th>
                  <th className="py-2 pr-3 font-medium">维度</th>
                  <th className="py-2 pr-3 font-medium">变化</th>
                  <th className="py-2 pr-3 font-medium">理由</th>
                  <th className="py-2 font-medium">依据</th>
                </tr>
              </thead>
              <tbody>
                {[...ratingChanges].reverse().map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 align-top">
                    <td className="whitespace-nowrap py-2 pr-3 text-xs tabular-nums text-slate-500">
                      {formatDateTime(c.timestamp)}
                    </td>
                    <td className="py-2 pr-3 text-slate-700">{DIMENSION_LABELS[c.dimension] ?? c.dimension}</td>
                    <td className="whitespace-nowrap py-2 pr-3 font-medium text-slate-900">
                      {c.from} → {c.to}
                    </td>
                    <td className="py-2 pr-3 text-xs leading-relaxed text-slate-600">{c.reason}</td>
                    <td className="py-2 text-xs text-slate-500">{c.source_ids.join("、") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
