// 完整免责声明页（规格书 §6–§8）。
import { usePageMeta } from "@/lib/usePageMeta";
import { PageIntro, SectionCard } from "@/components/Cards";

export default function DisclaimerPage() {
  usePageMeta("免责声明", "本站的完整免责声明：公开信息整理工具的边界、预测能力声明与隐私说明。");

  return (
    <div className="space-y-4">
      <PageIntro>请在使用本站任何信息之前阅读本页。</PageIntro>

      <SectionCard title="一、本站是什么、不是什么">
        <div className="space-y-2 text-sm leading-relaxed text-slate-700">
          <p>
            本站仅针对公开互联网信息进行采集、整理、翻译、去重、来源标注和辅助性分析。
          </p>
          <p>
            本站不是医疗诊断系统、疫情预测系统、公共卫生决策系统或官方信息发布机构。
            本站不具备独立实验室检测、现场调查或医学诊断能力。
          </p>
          <p>
            页面中的「信息关注等级」「观察阶段」「趋势」以及「历史模式对照」均不是医学结论，
            不代表疾病发生概率，也不是未来事件预测。
          </p>
          <p>
            公开信息可能存在错误、延迟、遗漏、重复转载、来源不完整、翻译误差或未经证实的内容。
            涉及现实中的医疗、健康、旅行或其他重大决定时，请以所在地正式发布的官方信息和专业机构意见为准。
          </p>
        </div>
      </SectionCard>

      <SectionCard title="二、关于预测能力的特别声明">
        <div className="space-y-2 text-sm leading-relaxed text-slate-700">
          <p>
            <b>本站没有经过验证的公共卫生事件预测能力。</b>
          </p>
          <p>本站不提供、也从不声称提供：疾病爆发概率、个人感染概率、预计爆发时间、疫情走向预测、「AI 预测」或任何形式的预测准确率统计。</p>
        </div>
      </SectionCard>

      <SectionCard title="三、一个类比：彩票概率与本站判断的区别">
        <div className="space-y-2 text-sm leading-relaxed text-slate-700">
          <p>
            彩票号码的理论中奖概率可以依据明确的组合数学规则进行计算。例如，超级大乐透一等奖的理论中奖概率约为
            1/2142万。
          </p>
          <p>
            而本站对未来公共卫生事件的任何判断，并没有类似的数学确定性基础。本站没有独立实验室检测、
            现场流行病学调查，也没有经过充分验证的公共卫生预测模型。
          </p>
          <p>
            因此，本网站不能提供疾病发生概率，也不能将任何「风险等级」理解为事件发生概率。
            本站所谓的判断，只是根据当时能够获得的公开信息，对信息状态进行整理和辅助性标记。
          </p>
          <p>
            简单来说：彩票理论概率可以精确计算；本站对未来事件的判断不能精确计算，
            也不应被理解为具有可验证的预测能力。本站的价值是帮助用户更快看到信息变化，而不是预测未来。
          </p>
        </div>
      </SectionCard>

      <SectionCard title="四、中立性声明">
        <div className="space-y-2 text-sm leading-relaxed text-slate-700">
          <p>国家和地点名称仅用于地理位置、信息来源与事件发生地点描述。本站不进行国家排名、地区排名、危险程度评价或价值评价。</p>
          <p>本站不自动判断政治动机。凡涉及「隐瞒」「掩盖」「生物武器」等表述，只作为<b>特定公开来源的原话/观点</b>展示并标注出处，不代表本站立场。</p>
          <p>本站不进行基于国籍、民族、地区、宗教、性别或职业群体的歧视性判断，只讨论具体暴露、病例、传播链和公开证据。</p>
        </div>
      </SectionCard>

      <SectionCard title="五、隐私说明">
        <div className="space-y-2 text-sm leading-relaxed text-slate-700">
          <p>病例信息只记录公开、必要的字段（编号、大致年龄段、职业类别、城市、发病时间、公开暴露信息、疾病状态、来源）。</p>
          <p>本站不显示姓名、电话、家庭地址、身份证件、私人聊天内容或非必要医疗隐私。</p>
          <p>本站无登录、无注册、无用户数据库，不收集用户数据。</p>
        </div>
      </SectionCard>

      <SectionCard title="六、内容归属">
        <p className="text-sm leading-relaxed text-slate-700">
          本站代码以 MIT 许可开源。采集与引用的内容归原始来源所有，本站仅做链接、标注与有限摘译，
          不主张任何所有权。如来源方对引用方式有异议，可通过仓库 Issue 联系调整。
        </p>
      </SectionCard>
    </div>
  );
}
