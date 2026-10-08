// 四维状态面板：观察阶段 / 关注等级 / 证据完整度 / 数据更新时间。
// 四项绝不合并（规格书 §25）。
import { event, statusData } from "@/data";
import { formatDateTime, formatRelative } from "@/lib/format";
import { confidenceMeta, levelMeta, phaseMeta } from "@/lib/constants";

function Cell({
  label,
  value,
  sub,
  title,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3" title={title}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-base font-semibold leading-snug text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function StatusPanel() {
  const phase = phaseMeta(event.observation_phase);
  const level = levelMeta(event.attention_level);
  const confidence = confidenceMeta(event.confidence);
  const degradedCount = statusData.sources_total - statusData.sources_healthy;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Cell
        label="当前观察阶段"
        value={`${phase.code}｜${phase.label}`}
        sub="公开信息状态，非官方疫情认定"
        title={phase.description}
      />
      <Cell
        label="当前关注等级"
        value={
          <span>
            {level.emoji} {level.code}｜{level.label}
          </span>
        }
        sub="信息值得关注程度，非疾病概率"
        title={level.description}
      />
      <Cell
        label="证据完整度"
        value={`${confidence.code}｜${confidence.label}`}
        sub="公开证据支持程度"
        title={confidence.description}
      />
      <Cell
        label="数据更新"
        value={formatRelative(event.last_updated)}
        sub={
          <>
            {formatDateTime(event.last_updated)}
            <br />
            数据源 {statusData.sources_healthy}/{statusData.sources_total} 正常
            {degradedCount > 0 && <span className="text-amber-700">（{degradedCount} 个降级）</span>}
          </>
        }
      />
    </div>
  );
}
