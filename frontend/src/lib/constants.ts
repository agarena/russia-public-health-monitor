// 状态维度的中文标签与配色。所有状态颜色必须与文字并存（规格书 §92）。
import type {
  AttentionLevel,
  CollectionStatus,
  EvidenceConfidence,
  Importance,
  ObservationPhase,
  SignalStatus,
  SourceTier,
  SourceType,
  Trend,
} from "@/types";

export interface PhaseMeta {
  code: ObservationPhase;
  label: string;
  description: string;
}

export const OBSERVATION_PHASES: PhaseMeta[] = [
  { code: "O0", label: "背景监测", description: "只有一般背景信息，无异常信号。" },
  { code: "O1", label: "异常事件信号", description: "出现异常重症/死亡、不明原因肺炎、特殊职业暴露或异常医疗措施，但无充分聚集或传播证据。" },
  { code: "O2", label: "相关病例/事件增加", description: "出现第二个相关病例、多个相关工作人员或接触者类似病例，但传播关系尚不清楚。" },
  { code: "O3", label: "病原相关证据", description: "出现病原学检测、PCR、培养、测序或官方实验室信息。" },
  { code: "O4", label: "传播关系信号", description: "出现家庭传播、医疗机构传播或明确病例间传播关系。" },
  { code: "O5", label: "持续传播信号", description: "出现多个独立传播链。" },
  { code: "O6", label: "区域扩散信号", description: "出现其他地区相关病例/事件。" },
  { code: "O7", label: "跨境扩展信号", description: "出现俄罗斯境外与本事件存在关系的病例/传播信息。" },
  { code: "O8", label: "中国相关公开信息增加", description: "出现与本事件相关的输入性病例、官方公开防控变化或其他中国境内相关信息。O8 不是「疫情在中国传播」的认定。" },
];

export const phaseMeta = (code: ObservationPhase): PhaseMeta =>
  OBSERVATION_PHASES.find((p) => p.code === code) ?? OBSERVATION_PHASES[0];

export interface LevelMeta {
  code: AttentionLevel;
  emoji: string;
  label: string;
  description: string;
  /** 徽章配色（克制：小面积使用） */
  badge: string;
  dot: string;
}

export const ATTENTION_LEVELS: LevelMeta[] = [
  { code: "L0", emoji: "🟢", label: "低关注", description: "没有明显变化。", badge: "bg-green-50 text-green-800 border-green-200", dot: "bg-green-500" },
  { code: "L1", emoji: "🟡", label: "持续关注", description: "存在异常信息，需要继续观察。", badge: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  { code: "L2", emoji: "🟠", label: "高度关注", description: "多个重要升级信号出现。", badge: "bg-orange-50 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  { code: "L3", emoji: "🔴", label: "重大关注", description: "公开信息出现重要传播、扩散或公共卫生措施升级信号。L3 不代表「疫情已经爆发」。", badge: "bg-red-50 text-red-800 border-red-200", dot: "bg-red-500" },
];

export const levelMeta = (code: AttentionLevel): LevelMeta =>
  ATTENTION_LEVELS.find((l) => l.code === code) ?? ATTENTION_LEVELS[0];

export interface ConfidenceMeta {
  code: EvidenceConfidence;
  label: string;
  description: string;
}

export const EVIDENCE_CONFIDENCE: ConfidenceMeta[] = [
  { code: "C0", label: "纯传闻", description: "仅存在无来源的传闻。" },
  { code: "C1", label: "单一来源", description: "仅一个公开来源提及。" },
  { code: "C2", label: "多源未充分独立", description: "多个公开来源，但独立性不足或尚未充分验证。" },
  { code: "C3", label: "可靠机构确认", description: "可靠机构或专业媒体确认。" },
  { code: "C4", label: "较完整证据链", description: "多个独立可靠来源 + 原始资料/官方数据。C4 不等于绝对真实，仅代表当前公开证据比较充分。" },
];

export const confidenceMeta = (code: EvidenceConfidence): ConfidenceMeta =>
  EVIDENCE_CONFIDENCE.find((c) => c.code === code) ?? EVIDENCE_CONFIDENCE[0];

export interface SignalStatusMeta {
  code: SignalStatus;
  label: string;
  description: string;
  badge: string;
  dot: string;
}

export const SIGNAL_STATUSES: SignalStatusMeta[] = [
  { code: "confirmed", label: "已确认", description: "可靠来源明确确认。", badge: "bg-green-50 text-green-800 border-green-200", dot: "bg-green-600" },
  { code: "reported", label: "公开报道", description: "存在公开报道，但尚未充分独立确认。", badge: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-600" },
  { code: "unconfirmed", label: "尚未确认", description: "存在公开说法，但缺乏可靠证据。", badge: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  { code: "contradicted", label: "来源冲突", description: "公开来源之间存在明显不同说法。", badge: "bg-violet-50 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  { code: "retracted", label: "已撤回", description: "原来源已经撤回或更正该报道。", badge: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" },
  { code: "unknown", label: "未知", description: "公开资料不足，无法判断。", badge: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" },
];

export const signalStatusMeta = (code: SignalStatus): SignalStatusMeta =>
  SIGNAL_STATUSES.find((s) => s.code === code) ?? SIGNAL_STATUSES[5];

export interface TierMeta {
  code: SourceTier;
  label: string;
  description: string;
  badge: string;
}

export const SOURCE_TIERS: TierMeta[] = [
  { code: "S", label: "S｜官方/专业原始资料", description: "WHO、ECDC、俄罗斯公共卫生主管部门、医疗机构公开公告、正式实验室公开信息。", badge: "bg-slate-800 text-white border-slate-800" },
  { code: "A", label: "A｜国际专业媒体", description: "Reuters、AP、AFP、BBC 等大型专业新闻机构。", badge: "bg-slate-700 text-white border-slate-700" },
  { code: "B", label: "B｜俄罗斯及本地媒体", description: "用于发现本地最早变化、现场信息、地方采访，观察不同公开口径。", badge: "bg-slate-100 text-slate-700 border-slate-300" },
  { code: "C", label: "C｜专家/记者公开账号", description: "用于发现潜在早期信号。", badge: "bg-slate-100 text-slate-700 border-slate-300" },
  { code: "D", label: "D｜公开社交平台", description: "X、Telegram、Reddit 等公开平台。只用于发现信息，不用于确认事实。", badge: "bg-slate-100 text-slate-500 border-slate-200" },
];

export const tierMeta = (code: SourceTier): TierMeta =>
  SOURCE_TIERS.find((t) => t.code === code) ?? SOURCE_TIERS[4];

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  official: "官方机构",
  international_media: "国际媒体",
  local_media: "本地媒体",
  expert: "专家/记者",
  social: "社交平台",
};

export const COLLECTION_STATUS_LABELS: Record<CollectionStatus, { label: string; dot: string }> = {
  healthy: { label: "正常", dot: "bg-green-500" },
  degraded: { label: "降级", dot: "bg-amber-500" },
  stale: { label: "过期", dot: "bg-orange-500" },
  failed: { label: "失败", dot: "bg-red-500" },
};

export const TREND_META: Record<Trend, { symbol: string; label: string }> = {
  up: { symbol: "↑", label: "信息增多" },
  stable: { symbol: "→", label: "基本稳定" },
  down: { symbol: "↓", label: "信息减少" },
  insufficient: { symbol: "?", label: "数据不足" },
};

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  ru: "俄语",
  en: "英语",
  zh: "中文",
  other: "其他",
};

/** 首页信息密度上限（规格书 §24 / §94）。数据生成端强制，前端再截断一次兜底。 */
export const HOMEPAGE_CAPS = {
  key_changes: 6,
  confirmed: 5,
  unconfirmed: 5,
  unknowns: 5,
  next_triggers: 5,
} as const;

/** 首页简版免责声明（规格书 §6） */
export const SHORT_DISCLAIMER = "本站仅对公开互联网信息进行采集、整理、翻译、去重、来源标注和辅助性分析。本站不是医疗诊断系统、疫情预测系统、公共卫生决策系统或官方信息发布机构。页面中的「信息关注等级」「观察阶段」「趋势」均不是医学结论，不代表疾病发生概率。涉及现实中的医疗、健康、旅行等重大决定时，请以官方信息为准。";

export const SITE_NAME = "俄罗斯公共卫生事件公开信息观察站";
export const SITE_NAME_EN = "Russia Public Health Event Information Monitor";
