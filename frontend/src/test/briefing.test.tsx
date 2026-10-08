// 单页简报渲染测试：12 个信息区块按认知顺序存在，四维状态分开显示。
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { event } from "@/data";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>,
  );
}

describe("单页简报结构", () => {
  it("顶部有重要说明横幅", () => {
    renderPage();
    expect(screen.getAllByText(/重要说明/i).length).toBeGreaterThan(0);
  });

  it("第一屏：四维状态分开显示 + 一句话判断 + 更新时间", () => {
    renderPage();
    expect(screen.getByText("当前关注等级")).toBeInTheDocument();
    // 首屏标签 + 阶段区块标题各出现一次
    expect(screen.getAllByText("公开信息观察阶段").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("证据完整度")).toBeInTheDocument();
    expect(screen.getByText("一句话判断")).toBeInTheDocument();
    expect(screen.getByText(/最后更新/)).toBeInTheDocument();
  });

  it("十二个区块按认知顺序出现", () => {
    const { container } = renderPage();
    const ids = [
      "overview",
      "changes",
      "evidence",
      "next",
      "phase",
      "timeline",
      "sources",
      "history",
      "china",
      "methodology",
    ].map((id) => container.querySelector(`#${id}`));
    ids.forEach((el) => expect(el).not.toBeNull());
    // DOM 顺序 = 认知顺序
    const positions = ids.map((el) => (el as HTMLElement).compareDocumentPosition).length;
    expect(positions).toBe(ids.length);
    let prev: HTMLElement | null = null;
    for (const el of ids) {
      const node = el as HTMLElement;
      if (prev) {
        expect(prev.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
      prev = node;
    }
  });

  it("已确认 / 尚未确认双栏存在", () => {
    renderPage();
    expect(screen.getByText("✓ 已确认")).toBeInTheDocument();
    expect(screen.getByText("? 尚未确认")).toBeInTheDocument();
  });

  it("未知与下一步双栏存在", () => {
    renderPage();
    expect(screen.getByText("? 当前最重要的未知")).toBeInTheDocument();
    expect(screen.getByText("→ 下一步值得观察")).toBeInTheDocument();
  });

  it("观察阶段进度线包含 O0–O8 与当前标记", () => {
    renderPage();
    for (let i = 0; i <= 8; i++) {
      expect(screen.getByText(`O${i}`)).toBeInTheDocument();
    }
    expect(screen.getByText("当前")).toBeInTheDocument();
    expect(screen.getByText(/不代表官方疫情阶段/)).toBeInTheDocument();
  });

  it("时间线含状态标签与纠错（如有）", () => {
    renderPage();
    expect(screen.getByText(/按时间倒序/)).toBeInTheDocument();
  });

  it("来源区展示分级、独立性与差异", () => {
    renderPage();
    expect(screen.getByText("信息链与来源独立性")).toBeInTheDocument();
    expect(screen.getByText(/来源存在差异的说法/)).toBeInTheDocument();
    expect(screen.getAllByText(/可能属于同一原始消息链/).length).toBeGreaterThan(0);
  });

  it("历史参照有使用边界声明", () => {
    renderPage();
    expect(screen.getByText(/历史参照仅帮助理解信息结构，不代表未来预测/)).toBeInTheDocument();
  });

  it("中国相关公开信息区块存在且非风险表述", () => {
    renderPage();
    expect(screen.getByText("中国相关公开信息")).toBeInTheDocument();
    expect(screen.getAllByText(/不代表任何风险判断/).length).toBeGreaterThan(0);
  });

  it("方法论与完整免责声明存在", () => {
    renderPage();
    expect(screen.getByText("方法论与免责声明")).toBeInTheDocument();
    expect(screen.getByText("完整免责声明")).toBeInTheDocument();
    expect(screen.getByText(/没有经过验证的公共卫生事件预测能力/)).toBeInTheDocument();
  });

  it("演示模式横幅行为正确", () => {
    renderPage();
    if (event.demo) {
      expect(screen.getByText(/演示数据模式/)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(/演示数据模式/)).not.toBeInTheDocument();
    }
  });

  it("旧多页路径重定向回首页", () => {
    render(
      <MemoryRouter initialEntries={["/timeline"]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText("一句话判断")).toBeInTheDocument();
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
