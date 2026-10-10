// 进入网站的弹窗：展示完整可信度说明（与页底共用 FullDisclaimer，统一维护）。
// 每个浏览器会话（sessionStorage）首次进入弹一次；刷新/断线重连不再重复打扰。
import { useCallback, useEffect, useRef, useState } from "react";
import { SITE_NAME } from "@/lib/constants";
import FullDisclaimer from "@/sections/FullDisclaimer";

const ACK_KEY = "rpm-disclaimer-ack";

export default function DisclaimerModal() {
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem(ACK_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    try {
      sessionStorage.setItem(ACK_KEY, "1");
    } catch {
      /* 存储不可用时仅本次关闭 */
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      // 焦点陷阱：Tab / Shift+Tab 在弹窗内循环，不落到背后的页面上
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialog.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={close}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${SITE_NAME} · 重要说明`}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          ⚠️ 重要说明
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">进入本站前请先阅读以下内容</p>
        <div className="mt-4">
          <FullDisclaimer />
        </div>
        <div className="mt-5 flex justify-end border-t border-slate-200 pt-3">
          <button
            type="button"
            autoFocus
            onClick={close}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-slate-700 sm:w-auto"
          >
            我已阅读并了解
          </button>
        </div>
      </div>
    </div>
  );
}
