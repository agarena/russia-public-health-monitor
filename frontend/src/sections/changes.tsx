// 完整事件时间线：按时间倒序给出全过程。纠错不删除、只追加更正说明——
// 可以看到「当时人们知道什么、后来哪里被更正」。
import Section from "@/sections/Section";
import { TimelineList } from "@/sections/timeline";

export default function ChangesSection() {
  return (
    <Section
      id="changes"
      no="02"
      title="事件时间线"
      subtitle="按时间倒序给出事件全过程；每个节点标注信息状态与来源。后续发现有误的报道不删除，追加更正说明。"
    >
      <TimelineList />
    </Section>
  );
}
