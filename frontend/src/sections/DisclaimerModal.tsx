// 每次进入网站的弹窗：展示完整可信度说明（与页底共用 FullDisclaimer，统一维护）。
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/constants";
import FullDisclaimer from "@/sections/FullDisclaimer";

export default function DisclaimerModal() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${SITE_NAME} · 重要说明`}
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          ⚠️ 重要说明
        </h2>
        <p className="mt-1 text-xs text-slate-400">进入本站前请先阅读以下内容</p>
        <div className="mt-5">
          <FullDisclaimer />
        </div>
        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            autoFocus
            onClick={() => setOpen(false)}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            我已阅读并了解
          </button>
        </div>
      </div>
    </div>
  );
}
