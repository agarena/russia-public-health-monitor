// 完整可信度说明：弹窗与页底共用同一组件，统一维护（改这里两处同步）。
import { ABOUT_SITE } from "@/lib/constants";

export default function FullDisclaimer() {
  return (
    <div className="space-y-5 text-xs leading-relaxed text-slate-500">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">关于网站名称</h3>
        <p className="mt-2">{ABOUT_SITE.name_note}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-700">关于本站的可信度</h3>
        <p className="mt-2">
          本站仅针对公开互联网信息进行采集、整理、翻译、去重、来源标注和辅助性分析。本站不是医疗诊断系统、疫情预测系统、公共卫生决策系统或官方信息发布机构，不具备独立实验室检测、现场调查或医学诊断能力。页面中的「关注等级」「观察阶段」「趋势」以及「历史模式对照」均不是医学结论，不代表疾病发生概率，也不是未来事件预测。公开信息可能存在错误、延迟、遗漏、重复转载、来源不完整、翻译误差或未经证实的内容。涉及现实中的医疗、健康、旅行或其他重大决定时，请以所在地正式发布的官方信息和专业机构意见为准。
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-700">关于预测能力</h3>
        <p className="mt-2">
          本站没有经过验证的公共卫生事件预测能力，不提供疾病爆发概率、个人感染概率或任何形式的预测。彩票号码的理论中奖概率可以依据明确的组合数学规则计算（例如超级大乐透一等奖约为
          1/2142万）；本站对未来公共卫生事件的任何判断，并没有类似的数学确定性基础，也不应被理解为具有可验证的预测能力。本站的价值是帮助用户更快看到信息变化，而不是预测未来。
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-700">中立性与隐私</h3>
        <p className="mt-2">
          国家和地点名称仅用于地理位置、信息来源与事件发生地点描述；本站不进行国家排名、地区排名或价值评价，不自动判断政治动机。涉及「隐瞒」「生物武器」等表述只作为特定来源的原话引用展示并标注出处。病例信息只记录公开必要字段，不显示姓名、住址或联系方式。本站无登录、无注册、无用户数据库，不收集用户数据。
        </p>
      </div>
    </div>
  );
}
