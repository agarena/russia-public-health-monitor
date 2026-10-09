// 中文防断行工具测试：关键术语必须被零宽连接符粘住，普通文字不受影响。
import { describe, expect, it } from "vitest";
import { cjkProse } from "@/lib/cjk";

const WJ = "\u2060";

describe("cjkProse", () => {
  it("关键术语逐字粘合，防止从词中断行", () => {
    expect(cjkProse("死因是否为肺鼠疫")).toBe(`死因是否为肺${WJ}鼠${WJ}疫`);
    expect(cjkProse("不明原因肺炎")).toBe([..."不明原因肺炎"].join(WJ));
  });

  it("长词优先：粘合长词后不再被短词二次命中", () => {
    const out = cjkProse("不明原因肺炎");
    // 「不明原因肺炎」整体粘住；内部不再出现裸露的「肺炎」可断点
    expect(out).toBe([..."不明原因肺炎"].join(WJ));
  });

  it("数字区间连接符两侧粘合", () => {
    const out = cjkProse("约 150–200 名接触者");
    expect(out).toBe(`约 150${WJ}–${WJ}200 名接${WJ}触${WJ}者`);
  });

  it("无关文字原样返回", () => {
    expect(cjkProse("今天天气不错")).toBe("今天天气不错");
    expect(cjkProse("")).toBe("");
  });
});
