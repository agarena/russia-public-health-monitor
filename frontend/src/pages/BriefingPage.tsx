// 单页简报：全部内容在一个长页面纵向展示（设计简报 §2–§3 的 12 区块认知顺序）。
import { useEffect } from "react";
import { event } from "@/data";
import { usePageMeta } from "@/lib/usePageMeta";
import { SiteNav, TopBanners } from "@/sections/nav";
import StatusHero from "@/sections/hero";
import ChangesSection from "@/sections/changes";
import { EvidenceSplit, UnknownsNext } from "@/sections/evidence";
import PhaseTrack from "@/sections/phase";
import TimelineSection from "@/sections/timeline";
import SourcesSection from "@/sections/sources";
import HistorySection from "@/sections/history";
import ChinaSection from "@/sections/china";
import MethodologySection from "@/sections/methodology";
import SiteFooter from "@/sections/footer";
import DisclaimerModal from "@/sections/DisclaimerModal";

export default function BriefingPage() {
  usePageMeta(
    "首页",
    "2026 年俄罗斯相关公共卫生事件：当前状态、已确认与未确认信息、关键未知与下一步观察点。",
  );

  // 演示数据模式下对搜索引擎 noindex；正式数据自动解除
  useEffect(() => {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (event.demo) {
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = "robots";
        document.head.appendChild(tag);
      }
      tag.content = "noindex, nofollow";
    } else if (tag) {
      tag.content = "index, follow";
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <DisclaimerModal />
      <TopBanners />
      <SiteNav />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 md:px-8">
        <StatusHero />
        <ChangesSection />
        <EvidenceSplit />
        <UnknownsNext />
        <PhaseTrack />
        <TimelineSection />
        <SourcesSection />
        <HistorySection />
        <ChinaSection />
        <MethodologySection />
      </main>
      <SiteFooter />
    </div>
  );
}
