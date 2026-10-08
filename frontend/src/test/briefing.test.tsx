// 单页简报渲染测试：12 个信息区块按认知顺序存在，四维状态分开显示。
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("每次进入弹出可信度说明，阅读后可关闭", () => {
    renderPage();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // 站名说明（热搜关键词简称）出现在弹窗里（页底共用组件也会出现，取全部）
    expect(screen.getAllByText(/热搜关键词/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/官方对该事件作出定性或命名后/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "我已阅读并了解" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("站名已改为「俄罗斯鼠疫公开信息监测」", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "我已阅读并了解" }));
    expect(screen.getAllByText("俄罗斯鼠疫公开信息监测").length).toBeGreaterThan(0);
  });

  it("第一屏状态用等级公示牌（中文等级名，非代码）", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "我已阅读并了解" }));
    // 关注等级四级全列出、当前高亮
    for (const name of ["低关注", "持续关注", "高度关注", "重大关注"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
    // 证据完整度五级全列出
    for (const name of ["纯传闻", "单一来源", "可靠机构确认", "较完整证据链"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
    // 首屏不出现 L2/O1/C3 这类代码标识
    const hero = document.getElementById("overview");
    expect(hero).not.toBeNull();
    expect(hero!.textContent).not.toMatch(/\b(L[0-3]|O[0-8]|C[0-4])\b/);
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

  it("观察阶段公示牌列出全部等级短名并标注当前", () => {
    renderPage();
    for (const name of ["背景监测", "异常事件", "病例增加", "病原证据", "传播关系", "持续传播", "区域扩散", "跨境扩展", "中国信息"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText(/当前：/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/不代表官方疫情阶段/).length).toBeGreaterThan(0);
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
    // 完整说明以共享组件呈现（弹窗 + 页底两处）
    expect(screen.getAllByText("关于本站的可信度").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/没有经过验证的公共卫生事件预测能力/).length).toBeGreaterThan(0);
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
