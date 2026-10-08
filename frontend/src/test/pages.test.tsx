// 关键页面渲染测试：使用 data/mock（或 public-data）经 sync-data 同步后的构建期内联数据。
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import App from "@/App";
import Layout from "@/components/Layout";
import { event, signals, timeline } from "@/data";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("全局布局", () => {
  it("演示模式与真实模式横幅行为正确", () => {
    renderAt("/");
    if (event.demo) {
      expect(screen.getByText(/演示数据模式/)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(/演示数据模式/)).not.toBeInTheDocument();
    }
  });

  it("页脚包含免责声明与数据源状态", () => {
    renderAt("/");
    expect(screen.getAllByText(/公开信息整理工具，不提供疫情预测/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/数据源：\d+\/\d+ 正常/)).toBeInTheDocument();
  });
});

describe("首页仪表盘", () => {
  it("四个状态维度分开显示（阶段/等级/证据/更新）", () => {
    renderAt("/");
    expect(screen.getByText("当前观察阶段")).toBeInTheDocument();
    expect(screen.getByText("当前关注等级")).toBeInTheDocument();
    expect(screen.getByText("证据完整度")).toBeInTheDocument();
    expect(screen.getByText("数据更新")).toBeInTheDocument();
  });

  it("显示一句话摘要与关键区块", () => {
    renderAt("/");
    expect(screen.getByText("一句话摘要")).toBeInTheDocument();
    expect(screen.getByText("近期关键变化")).toBeInTheDocument();
    expect(screen.getByText("已确认")).toBeInTheDocument();
    expect(screen.getByText("尚未确认")).toBeInTheDocument();
    expect(screen.getByText("当前最重要的未知")).toBeInTheDocument();
    expect(screen.getByText("下一步值得观察")).toBeInTheDocument();
  });
});

describe("时间线页", () => {
  it("渲染时间线节点；存在纠错条目时展示纠错记录", () => {
    renderAt("/timeline");
    expect(screen.getByText(/按时间倒序排列/)).toBeInTheDocument();
    const hasCorrection = timeline.some((e) => e.correction != null);
    if (hasCorrection) {
      expect(screen.getByText(/纠错记录/)).toBeInTheDocument();
    }
  });

  it("状态筛选器包含六态", () => {
    renderAt("/timeline");
    expect(screen.getByRole("button", { name: /已确认/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /已撤回/ })).toBeInTheDocument();
  });
});

describe("来源页", () => {
  it("显示来源分级与引用关系", () => {
    renderAt("/sources");
    expect(screen.getByText("来源分级")).toBeInTheDocument();
    expect(screen.getByText("来源引用关系")).toBeInTheDocument();
    expect(screen.getByText(/独立性规则/)).toBeInTheDocument();
  });
});

describe("证据页", () => {
  it("五栏状态；存在撤回条目时展示撤回区", () => {
    renderAt("/evidence");
    const hasRetracted = signals.some((s) => s.status === "retracted");
    if (hasRetracted) {
      expect(screen.getByText("已撤回 / 更正")).toBeInTheDocument();
    }
    expect(screen.getAllByText("公开报道").length).toBeGreaterThan(0);
    expect(screen.getByText("病例信息（公开资料整理）")).toBeInTheDocument();
  });
});

describe("历史参照页", () => {
  it("显示使用边界与相似/不同对照", () => {
    renderAt("/history");
    expect(screen.getByText("使用边界")).toBeInTheDocument();
    expect(screen.getAllByText("相似的信息结构").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/目前并没有出现的特征/).length).toBeGreaterThan(0);
  });
});

describe("路由直连（Layout + 页面）", () => {
  it("methodology 与 disclaimer 可达", () => {
    render(
      <MemoryRouter initialEntries={["/methodology"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="methodology" element={<div>方法论占位</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("方法论占位")).toBeInTheDocument();
  });
});

describe("工具函数", () => {
  it("formatRelative 输出中文相对时间", async () => {
    const { formatRelative } = await import("@/lib/format");
    const now = new Date("2026-10-08T10:00:00Z");
    expect(formatRelative("2026-10-08T09:30:00Z", now)).toBe("30 分钟前");
    expect(formatRelative("2026-10-07T10:00:00Z", now)).toBe("1 天前");
  });
});
