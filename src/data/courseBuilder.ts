import type { Answers, Course } from "../types";

export type NeedKey = "cognitive_opening" | "method_learning" | "conversation_solving" | "practice_participation";
export type NeedProfile = Record<NeedKey, number>;
export type CoverTab = "book" | "fit" | "course";

export const needOrder: NeedKey[] = ["cognitive_opening", "method_learning", "conversation_solving", "practice_participation"];

export const needLabels: Record<NeedKey, { title: string; short: string; desc: string; color: string }> = {
  cognitive_opening: {
    title: "认知打开型",
    short: "看清方向",
    desc: "优先获得趋势、专家思想、领域地图和轻量启发。",
    color: "bg-amber"
  },
  method_learning: {
    title: "方法学习型",
    short: "系统掌握",
    desc: "优先获得框架、模板、步骤演示和结构化训练。",
    color: "bg-plum"
  },
  conversation_solving: {
    title: "交流求解型",
    short: "聊透问题",
    desc: "优先获得专家追问、案例校准、Agent 问答和导师交流入口。",
    color: "bg-lichen"
  },
  practice_participation: {
    title: "实战参与型",
    short: "行动产出",
    desc: "优先获得项目任务、验证挑战、交付物和实践机会。",
    color: "bg-white"
  }
};

export const fitSurveyQuestions = [
  {
    id: "fit_goal",
    question: "如果 Thinker 这次推荐是有效的，你最希望获得什么？",
    options: [
      { id: "a", text: "看清 AI 创业和创新机会的方向", weights: { cognitive_opening: 5, method_learning: 1 } },
      { id: "b", text: "系统学会一套判断和验证方法", weights: { method_learning: 5, cognitive_opening: 1, practice_participation: 1 } },
      { id: "c", text: "找人聊透一个具体判断难题", weights: { conversation_solving: 5, method_learning: 1 } },
      { id: "d", text: "进入活动、项目或挑战，边做边学", weights: { practice_participation: 5, cognitive_opening: 1, method_learning: 1, conversation_solving: 1 } }
    ]
  },
  {
    id: "fit_problem",
    question: "你最近最想突破的问题更接近哪一种？",
    options: [
      { id: "a", text: "不知道 AI 创业现在有哪些真机会", weights: { cognitive_opening: 5 } },
      { id: "b", text: "想学会如何验证一个想法值不值得做", weights: { method_learning: 5 } },
      { id: "c", text: "有方向但想听专家怎么判断", weights: { conversation_solving: 5 } },
      { id: "d", text: "想参加真实任务，做出一个可展示结果", weights: { practice_participation: 5, method_learning: 2 } }
    ]
  },
  {
    id: "fit_gap",
    question: "面对这个问题，你觉得自己现在更缺什么？",
    options: [
      { id: "a", text: "信息视野和趋势判断", weights: { cognitive_opening: 5 } },
      { id: "b", text: "系统方法和可复用模板", weights: { method_learning: 5 } },
      { id: "c", text: "经验判断和专家反馈", weights: { conversation_solving: 4, method_learning: 2 } },
      { id: "d", text: "真实练习机会和产出场景", weights: { practice_participation: 5 } }
    ]
  },
  {
    id: "fit_format",
    question: "你更希望通过哪种方式获得帮助？",
    options: [
      { id: "a", text: "先看书籍导读、音频博客或专家思想地图", weights: { cognitive_opening: 5, method_learning: 1 } },
      { id: "b", text: "进入系统课程和案例训练", weights: { method_learning: 5 } },
      { id: "c", text: "约导师聊一次，或参加小圆桌", weights: { conversation_solving: 5, cognitive_opening: 1 } },
      { id: "d", text: "进入项目实践、黑客松或验证挑战", weights: { practice_participation: 5, method_learning: 2 } }
    ]
  },
  {
    id: "fit_time",
    question: "接下来 4 周，你愿意投入到什么程度？",
    options: [
      { id: "a", text: "每周 30 分钟以内，先轻量探索", weights: { cognitive_opening: 4 } },
      { id: "b", text: "每周 1-2 小时，能完成章节课程", weights: { cognitive_opening: 2, method_learning: 3 } },
      { id: "c", text: "每周 3-5 小时，愿意做练习和反馈", weights: { method_learning: 4, conversation_solving: 2 } },
      { id: "d", text: "每周 5 小时以上，可以参加项目或比赛", weights: { practice_participation: 5, method_learning: 2 } }
    ]
  },
  {
    id: "fit_connection",
    question: "如果 Thinker 可以帮你连接一个对象，你更希望连接谁？",
    options: [
      { id: "a", text: "专家本人，理解他的思想和判断", weights: { conversation_solving: 3, method_learning: 2, cognitive_opening: 2 } },
      { id: "b", text: "项目导师，帮我校准下一步", weights: { conversation_solving: 5, practice_participation: 2 } },
      { id: "c", text: "同领域学习者，看看大家关注什么", weights: { cognitive_opening: 3, conversation_solving: 3 } },
      { id: "d", text: "潜在合作者，一起完成真实任务", weights: { practice_participation: 5, conversation_solving: 2 } }
    ]
  }
] as const;

export const bookBreakdown = {
  title: "让大象飞",
  author: "Steven S. Hoffman",
  source: "附件《让大象飞.txt》",
  summary:
    "本书围绕创新创业从机会识别、团队准备、产品打造、用户市场、持续创新到高速迭代的完整路径展开。课程化时不做摘要，而是把每章拆成中心论点、观点揭示卡、证据锚点、互动题和交付物。",
  chapters: [
    {
      id: "m1",
      title: "寻找方向：不管是否寒冬，总有浪潮在往这里来",
      centralClaim: "创新机会不是从技术炫耀开始，而是从时机、浪潮和真实用户价值中被识别出来。",
      contentTypes: ["反直觉观点", "风险提醒", "趋势判断"],
      insights: ["技术并没有你以为的那么重要", "硅谷聚集的是敢于试错的人", "时机决定创新能否起飞", "模仿也可能是创新前的学习", "热点必须被行为证据验证"]
    },
    {
      id: "m2",
      title: "准备启航：拉一支队伍，一起干吧",
      centralClaim: "早期创新更依赖小团队、资源约束和行动压力，而不是大预算和完美计划。",
      contentTypes: ["方法框架", "行动建议", "团队原则"],
      insights: ["将初创团队控制在 5 人以内", "过多资金可能成为毒药", "逼自己一把会产生学习速度", "停止空想，先做眼前验证", "融资是工具，不是目标"]
    },
    {
      id: "m3",
      title: "打造产品：爱它，但不要太爱它",
      centralClaim: "产品创新的核心不是爱上作品，而是持续用用户问题和真实反馈重写产品。",
      contentTypes: ["核心概念", "案例故事", "风险提醒"],
      insights: ["商业神话不能照搬", "输无可输可能成为优势", "设计创新是解决真实问题", "重写规则才是深层创新", "不要轻易爱上你的作品"]
    },
    {
      id: "m4",
      title: "锁定市场：你先吃透用户，用户才想吃透你",
      centralClaim: "市场不是被说服出来的，而是通过倾听、合作、数据和价值交付被验证出来的。",
      contentTypes: ["用户洞察", "证据材料", "方法框架"],
      insights: ["用户建议是创新来源", "倾听比疯狂推销更重要", "合作对象不止团队成员", "用数据检验创意", "用户获得的价值最重要"]
    },
    {
      id: "m5",
      title: "持续创新：基业长青，靠的是内部创新",
      centralClaim: "持续创新来自组织内部的想法流动、失败复盘和多方参与机制。",
      contentTypes: ["组织机制", "失败复盘", "讨论命题"],
      insights: ["利用每个员工的独特想法", "失败的价值在于洞见", "失败案例能暴露组织盲点", "聪明人也可能阻挡创新", "让利益相关者参与进来"]
    },
    {
      id: "m6",
      title: "高速运转：快点，一定要走在市场前列",
      centralClaim: "速度的本质不是忙碌，而是在快速变化中不断重启、调整方向并形成学习优势。",
      contentTypes: ["行动建议", "反直觉观点", "总结迁移"],
      insights: ["速度意味着一切", "一次次按下重启按钮", "随时准备调整方向", "创新需要多元化", "赢家需要持续行动法宝"]
    }
  ]
} as const;

export const qualityChecks = [
  { label: "章节覆盖", value: 92, status: "pass", note: "已覆盖目录中 6 个主体章节，并映射为 M1-M6 课程模块。" },
  { label: "观点卡密度", value: 86, status: "pass", note: "每章预设 5 个核心观点，满足 5-7 张观点揭示卡要求。" },
  { label: "内容类型覆盖", value: 88, status: "pass", note: "覆盖核心概念、反直觉观点、方法框架、案例故事、风险提醒、行动建议。" },
  { label: "互动可生成性", value: 84, status: "pass", note: "每章观点均可转换成选择题、开放题、视频题或任务卡。" },
  { label: "证据锚点策略", value: 80, status: "warn", note: "当前原型采用章节与标题级锚点；生产版需补充 paragraphIndex 和原文 quote。" }
] as const;

export const courseVariants: Record<NeedKey, { title: string; shortTitle: string; description: string; tone: string; emphasis: string; interactionMix: string[]; moduleModes: string[]; pointQuestions: string[]; finalPrompt: string; quizPrefix: string }> = {
  cognitive_opening: {
    title: "认知打开型课程",
    shortTitle: "趋势导览版",
    description: "围绕《让大象飞》的 6 章框架，优先帮助你看清创新浪潮、机会方向和专家思想地图。",
    tone: "先帮你看清方向",
    emphasis: "本版本更关注趋势判断、反直觉现象和低门槛进入。",
    interactionMix: ["趋势判断题", "视频情景选择", "音频博客预习", "专家思想地图"],
    moduleModes: ["识别浪潮和技术陷阱", "理解小团队为什么更敏捷", "看懂产品创新背后的用户体验", "建立用户与市场的第一层地图", "认识组织创新的关键变量", "判断速度和时机的关系"],
    pointQuestions: ["这个案例背后真正的机会信号是什么？", "你看到的是用户问题，还是技术兴奋？", "如果技术被复制，趋势还成立吗？", "这是真浪潮，还是短期噪音？", "MVP 能帮你看清什么方向？", "用户行为说明了什么趋势？", "速度为什么会成为创新优势？"],
    finalPrompt: "请用一句话写下：你现在最想看清的 AI 创业机会方向是什么？",
    quizPrefix: "从趋势判断角度看，"
  },
  method_learning: {
    title: "方法学习型课程",
    shortTitle: "方法训练版",
    description: "围绕《让大象飞》的创新方法论，优先训练你把观点转成模板、步骤和可复用判断框架。",
    tone: "先把方法拆成步骤",
    emphasis: "本版本更关注框架复用、模板填写和结构化训练。",
    interactionMix: ["方法卡", "模板填写", "步骤排序", "结构化输出"],
    moduleModes: ["用宝箱-钥匙-证据判断机会", "用 5 人小队和约束设计启动方式", "用用户价值改写产品定义", "用访谈和数据验证市场", "用失败复盘卡提炼洞见", "用 90 天路线图缩短学习周期"],
    pointQuestions: ["你会用哪三个证据判断技术是否有市场？", "请把你的宝箱、钥匙和证据分别写出来。", "如果技术被开源，你的方法框架还剩哪几项资产？", "判断真浪潮时，你会按什么顺序看信号？", "7 天内你要验证哪一个关键假设？", "用户说喜欢之后，你下一步验证动作是什么？", "如何把忙碌改写成学习速度？"],
    finalPrompt: "请写出你最想带走的一套方法模板，以及你准备如何使用它。",
    quizPrefix: "按照方法框架，"
  },
  conversation_solving: {
    title: "交流求解型课程",
    shortTitle: "专家追问版",
    description: "围绕《让大象飞》的关键判断难题，优先通过开放问题、Agent 追问和专家视角帮你校准现实困惑。",
    tone: "先把问题聊透",
    emphasis: "本版本更关注专家追问、现实卡点和 Coffee Chat 前的问题准备。",
    interactionMix: ["开放追问", "Agent 问答", "案例校准", "Office Hour 准备"],
    moduleModes: ["把模糊兴趣追问成真实机会", "把团队和资源困惑追问成下一步", "把产品纠结追问成用户问题", "把用户反馈追问成行为证据", "把失败困惑追问成组织洞见", "把速度焦虑追问成决策节奏"],
    pointQuestions: ["如果你把这个案例拿去问导师，最该问什么？", "你的现实问题里，宝箱和钥匙哪里最模糊？", "你最担心被复制的是技术，还是客户关系？", "你现在听到的市场声音，哪些需要专家帮你判断？", "你的 MVP 卡点更像范围太大，还是假设不清？", "用户反馈里哪句话最值得追问？", "你现在的团队是在快，还是在焦虑地忙？"],
    finalPrompt: "请写下你最希望 Hoffman Agent 或项目导师帮你判断的一个问题。",
    quizPrefix: "如果要拿去和导师讨论，"
  },
  practice_participation: {
    title: "实战参与型课程",
    shortTitle: "项目挑战版",
    description: "围绕《让大象飞》的实践路径，优先把每章观点转成任务卡、验证动作和项目交付物。",
    tone: "先把学习变成行动",
    emphasis: "本版本更关注真实任务、短周期验证和可提交成果。",
    interactionMix: ["任务卡", "7 天验证", "项目输入", "作品提交"],
    moduleModes: ["提交一张机会证据卡", "设计一张启动配置表", "完成一次用户价值改写", "列出 5 条行为证据", "提交一次失败复盘", "制定 90 天行动路线图"],
    pointQuestions: ["本周你能拿到哪一条真实行为证据？", "你的项目宝箱、钥匙和证据今天能写出来吗？", "如果技术被开源，你明天要补哪项资产？", "你要用什么指标区分浪潮和噪音？", "7 天 MVP 你准备交付什么？", "你要观察用户的哪一个真实动作？", "未来 72 小时你能完成哪一个反馈闭环？"],
    finalPrompt: "请写出你接下来 7 天要完成的一个验证动作和交付物。",
    quizPrefix: "如果要马上行动，"
  }
};

export function emptyNeedProfile(): NeedProfile {
  return { cognitive_opening: 25, method_learning: 25, conversation_solving: 25, practice_participation: 25 };
}

export function fitSurveyComplete(answers: Answers) {
  return fitSurveyQuestions.every((question) => typeof answers[question.id] === "string" && Boolean(answers[question.id]));
}

export function buildNeedProfile(answers: Answers): NeedProfile {
  const raw: NeedProfile = { cognitive_opening: 1, method_learning: 1, conversation_solving: 1, practice_participation: 1 };
  fitSurveyQuestions.forEach((question) => {
    const selected = answers[question.id];
    const option = question.options.find((item) => item.id === selected);
    if (!option) return;
    Object.entries(option.weights).forEach(([need, value]) => {
      raw[need as NeedKey] += Number(value || 0);
    });
  });
  const total = needOrder.reduce((sum, key) => sum + raw[key], 0);
  if (!total) return emptyNeedProfile();
  const normalized = needOrder.reduce((acc, key) => ({ ...acc, [key]: Math.round((raw[key] / total) * 100) }), {} as NeedProfile);
  const drift = 100 - needOrder.reduce((sum, key) => sum + normalized[key], 0);
  normalized[primaryNeedFromProfile(normalized)] += drift;
  return normalized;
}

export function primaryNeedFromProfile(profile: NeedProfile): NeedKey {
  return needOrder.reduce((best, key) => (profile[key] > profile[best] ? key : best), "cognitive_opening" as NeedKey);
}

export function buildAdaptiveCourse(course: Course, need: NeedKey): Course {
  const variant = courseVariants[need];
  return {
    ...course,
    title: `${course.title} · ${variant.shortTitle}`,
    description: variant.description,
    summary300: `${course.summary300}\n\n你的当前适配版本是「${variant.title}」。${variant.emphasis}`,
    keyPoints: course.keyPoints.map((point, index) => ({
      ...point,
      explanation: `${variant.tone}：${point.explanation}`,
      example: `${variant.moduleModes[index % variant.moduleModes.length]}｜${point.example}`,
      revealQuestion: {
        ...point.revealQuestion,
        question: variant.pointQuestions[index] || point.revealQuestion.question,
        revealContent: `${point.revealQuestion.revealContent || ""} ${variant.emphasis}`
      }
    })),
    quizQuestions: course.quizQuestions.map((question) => ({
      ...question,
      question: `${variant.quizPrefix}${question.question}`
    })),
    finalOpenQuestions: course.finalOpenQuestions
      .filter((question) => question.id !== "open_name")
      .map((question) => question.id === "open_project" ? { ...question, question: variant.finalPrompt } : question)
  };
}
