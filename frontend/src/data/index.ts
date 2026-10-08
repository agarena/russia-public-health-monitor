// 数据访问层：构建期内联 data/public-data（或回退 data/mock）与 data/history。
import eventJson from "@data/event.json";
import signalsJson from "@data/signals.json";
import sourcesJson from "@data/sources.json";
import timelineJson from "@data/timeline.json";
import casesJson from "@data/cases.json";
import transmissionJson from "@data/transmission.json";
import statusJson from "@data/status.json";
import ratingChangesJson from "@data/rating-changes.json";
import historyJson from "../../../data/history/history-cases.json";
import type {
  CasesFile,
  EventData,
  HistoryCase,
  RatingChange,
  Signal,
  SignalStatus,
  SignalsFile,
  SourceRecord,
  SourcesFile,
  StatusFile,
  TimelineEntry,
  TimelineFile,
  TransmissionFile,
} from "@/types";

export const event = eventJson as unknown as EventData;
export const signalsFile = signalsJson as unknown as SignalsFile;
export const signals = signalsFile.signals;
export const sourcesFile = sourcesJson as unknown as SourcesFile;
export const sources = sourcesFile.sources;
export const sourceRelations = sourcesFile.relations;
export const timelineFile = timelineJson as unknown as TimelineFile;
export const timeline: TimelineEntry[] = [...timelineFile.entries].sort((a, b) =>
  b.date.localeCompare(a.date),
);
export const casesFile = casesJson as unknown as CasesFile;
export const cases = casesFile.cases;
export const transmissionFile = transmissionJson as unknown as TransmissionFile;
export const transmissionLinks = transmissionFile.links;
export const statusData = statusJson as unknown as StatusFile;
export const ratingChanges = (ratingChangesJson as unknown as { changes: RatingChange[] }).changes;

const historyTyped = historyJson as unknown as { note_zh: string; cases: HistoryCase[] };
export const historyNote = historyTyped.note_zh;
export const historyCases = historyTyped.cases;

export const sourceById = new Map<string, SourceRecord>(sources.map((s) => [s.id, s]));
export const signalById = new Map<string, Signal>(signals.map((s) => [s.id, s]));

export function sourceName(id: string): string {
  const s = sourceById.get(id);
  return s?.name_zh ?? s?.name ?? id;
}

export function signalsByStatus(status: SignalStatus): Signal[] {
  return signals
    .filter((s) => s.status === status)
    .sort((a, b) => b.published_at.localeCompare(a.published_at));
}
