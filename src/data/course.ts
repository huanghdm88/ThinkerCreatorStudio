import type { Course, EvidenceSpan, Expert, Recommendation, VideoPrompt } from "../types";

export const experts: Expert[] = [
  {
    id: "hoffman",
    name: "Steven S. Hoffman",
    title: "Founders Space CEO · 创新创业专家",
    avatarTone: "AI 创业 / 创新方法论",
    avatarUrl: "https://www.foundersspace.com/wp-content/uploads/2018/06/Hoffman-best-small.jpg",
    bio: "硅谷创业孵化器 Founders Space CEO，长期辅导创业者完成机会识别、产品验证、融资叙事与高速增长。",
    agentIntro: "基于 Hoffman 创新创业方法论，为你解答 AI 创业机会、MVP、用户验证和项目路径问题。",
    books: [
      {
        title: "原动力",
        meta: "史蒂夫·霍夫曼 / 2021",
        coverUrl: "https://www.foundersspace.com/wp-content/uploads/2020/10/Five-Forces-BenBella-Cover-Art-565x848.jpg"
      },
      {
        title: "让大象飞",
        meta: "史蒂夫·霍夫曼 / 2017",
        coverUrl: "https://www.foundersspace.com/wp-content/uploads/2021/02/Make-Elephants-Fly-shadow-565x765.jpg"
      },
      {
        title: "穿越寒冬",
        meta: "史蒂夫·霍夫曼 / 2020",
        coverUrl: "https://www.foundersspace.com/wp-content/uploads/2021/02/Surviving-a-Startup-front-565x762.png"
      }
    ],
    articles: [
      {
        title: "RTE2023｜硅谷创投教父史蒂夫·霍夫曼谈 AI 创业",
        source: "中华网科技",
        coverUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=560&q=80"
      },
      {
        title: "专访｜硅谷创投教父霍夫曼：创业者最应该验证什么？",
        source: "新浪财经",
        coverUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=560&q=80"
      },
      {
        title: "AI 浪潮里，真正的创业机会从哪里出现？",
        source: "澎湃新闻",
        coverUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=560&q=80"
      }
    ],
    field: "创新创业",
    courseId: "elephant-ai-startup"
  },
  {
    id: "strategy",
    name: "Thinker Strategy Lab",
    title: "商业策略与增长实验",
    avatarTone: "即将开放",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=360&q=80",
    bio: "聚焦战略定位、增长实验和商业模式设计的 Thinker 专家小组。",
    agentIntro: "为你拆解商业策略、增长路径和业务优先级。",
    books: [
      {
        title: "战略增长手册",
        meta: "Thinker Strategy Lab / 2026",
        coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=360&q=80"
      }
    ],
    articles: [
      {
        title: "增长不是投放，而是验证",
        source: "Thinker Research",
        coverUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=560&q=80"
      }
    ],
    field: "战略增长",
    courseId: "strategy-lab",
    locked: true
  },
  {
    id: "product",
    name: "Thinker Product Council",
    title: "AI 产品与用户洞察",
    avatarTone: "即将开放",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=360&q=80",
    bio: "围绕 AI 产品定义、用户洞察、体验诊断和 PMF 探索的 Thinker 产品专家小组。",
    agentIntro: "帮助你把 AI 能力翻译成用户价值，并定位产品体验断点。",
    books: [
      {
        title: "AI 产品洞察",
        meta: "Thinker Product Council / 2026",
        coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=360&q=80"
      }
    ],
    articles: [
      {
        title: "用户说喜欢，不等于会购买",
        source: "Thinker Research",
        coverUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=560&q=80"
      }
    ],
    field: "产品洞察",
    courseId: "product-council",
    locked: true
  },
  {
    id: "hassabis",
    name: "Demis Hassabis",
    title: "DeepMind 与 Isomorphic Labs 创始人兼 CEO",
    avatarTone: "AI 科学 / 长期研发",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=360&q=80",
    bio: "聚焦基础模型、强化学习、AI for Science 与高密度研发组织的长期创新路径。",
    agentIntro: "帮助你拆解 AI 科学问题、长期技术路线和研究型组织管理。",
    books: [
      {
        title: "AI 科学前沿",
        meta: "Thinker 编选 / 2026",
        coverUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=360&q=80"
      }
    ],
    articles: [
      {
        title: "从 AlphaGo 到 AI for Science：长期主义如何落地",
        source: "Thinker Research",
        coverUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=560&q=80"
      }
    ],
    field: "AI 科学",
    courseId: "ai-science",
    locked: true
  },
  {
    id: "kelly",
    name: "Kevin Kelly",
    title: "《连线》杂志创始主编 · 科技思想家",
    avatarTone: "科技趋势 / 未来洞察",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=360&q=80",
    bio: "长期研究技术趋势、复杂系统和未来社会，擅长把宏观变化翻译成可行动的判断框架。",
    agentIntro: "帮助你从技术趋势、长期主义和未来情境中寻找新机会。",
    books: [
      {
        title: "5000 天后的世界",
        meta: "Kevin Kelly / 2023",
        coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=360&q=80"
      },
      {
        title: "技术想要什么",
        meta: "Kevin Kelly / 2010",
        coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=360&q=80"
      }
    ],
    articles: [
      {
        title: "AI 之后，什么会成为下一个长期变量？",
        source: "Thinker Research",
        coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=560&q=80"
      }
    ],
    field: "科技趋势",
    courseId: "future-tech",
    locked: true
  },
  {
    id: "maeda",
    name: "John Maeda",
    title: "设计与人工智能专家 · 前微软设计和 AI 副总裁",
    avatarTone: "AI 产品 / 设计系统",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=360&q=80",
    bio: "关注设计、技术与商业的交叉地带，擅长把复杂技术转化为更容易被用户理解的体验。",
    agentIntro: "帮助你改写 AI 产品价值表达、设计交互路径和体验诊断问题。",
    books: [
      {
        title: "简单法则",
        meta: "John Maeda / 2006",
        coverUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=360&q=80"
      }
    ],
    articles: [
      {
        title: "AI 产品为什么需要更少而不是更多功能？",
        source: "Thinker Research",
        coverUrl: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=560&q=80"
      }
    ],
    field: "AI 产品设计",
    courseId: "ai-product-design",
    locked: true
  },
  {
    id: "suleyman",
    name: "Mustafa Suleyman",
    title: "Microsoft AI CEO · DeepMind 联合创始人",
    avatarTone: "AI 战略 / 产业治理",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=360&q=80",
    bio: "关注 AI 产品化、组织战略与技术治理，适合拆解大模型时代的产业机会与风险边界。",
    agentIntro: "帮助你评估 AI 战略、平台机会、治理风险和产品化路径。",
    books: [
      {
        title: "浪潮将至",
        meta: "Mustafa Suleyman / 2023",
        coverUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=360&q=80"
      }
    ],
    articles: [
      {
        title: "AI 平台化之后，创业者还剩哪些入口？",
        source: "Thinker Research",
        coverUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=560&q=80"
      }
    ],
    field: "AI 战略",
    courseId: "ai-strategy",
    locked: true
  }
];

const ch1DirectionEvidence = {
  chapterIndex: 1,
  paragraphIndex: 1,
  paragraphIndexEnd: 1,
  quote: "当新技术的压路机向你碾压过来时，如果你不能成为压路机的一部分，那么你就只能成为路的一部分。",
  matchKeyword: "寻找方向：不管是否寒冬，总有浪潮在往这里来",
  anchorStatus: "chapter_title_context",
  sourceHeading: "寻找方向：不管是否寒冬，总有浪潮在往这里来",
  sourceLabel: "第1章 第1段",
  contextAfter: "创新并不是什么新鲜的事。霍夫曼把技术浪潮放回更长的创新历史中，提醒学习者关注行动环境如何被改变。",
  contextSummary: "本段作为第一章开场，把技术浪潮描述成无法旁观的行动压力。"
} satisfies EvidenceSpan;

const ch1TechnologyEvidence = {
  chapterIndex: 1,
  paragraphIndex: 13,
  paragraphIndexEnd: 14,
  quote: "技术并没有你以为的那么重要任何新的技术通常都会经历一个25年的接受和采用周期。",
  matchKeyword: "技术并没有你以为的那么重要",
  anchorStatus: "keyword",
  sourceLabel: "第1章 第13-14段",
  contextBefore: "前文讨论技术发展会改变工作、生活和自我形象，但变化真正落地需要时间与场景吸收。",
  contextAfter: "后文进一步说明创新不只等于技术创新，技术只是创新过程的一部分。",
  contextSummary: "这组段落支撑“技术不是起点，场景和采用机制才决定价值”的课程判断。"
} satisfies EvidenceSpan;

const ch1ImitationEvidence = {
  chapterIndex: 1,
  paragraphIndex: 150,
  paragraphIndexEnd: 153,
  quote: "创新之前，别说你不屑于模仿独创性只不过是明智的模仿。哲学家和作家",
  matchKeyword: "创新之前，别说你不屑于模仿",
  anchorStatus: "keyword",
  sourceLabel: "第1章 第150-153段",
  contextBefore: "霍夫曼先提醒创业者不要把时间和金钱继续投入到错误方向，而要转身看向迎面而来的新浪潮。",
  contextAfter: "他随后指出，模仿或复制可以是一种商业策略，关键是借它更快验证现实而不是停在抄袭层面。",
  contextSummary: "这组段落适合转成场景判断题：什么时候模仿是在降低验证成本，什么时候只是缺乏差异。"
} satisfies EvidenceSpan;

const ch1RiskEvidence = {
  chapterIndex: 1,
  paragraphIndex: 17,
  paragraphIndexEnd: 17,
  quote: "谈到创新，最大的误区之一是，认为创新指的就是技术创新。实际并非如此。",
  matchKeyword: "风险",
  anchorStatus: "keyword",
  sourceLabel: "第1章 第17段",
  contextBefore: "前文引出“技术并没有你以为的那么重要”，把注意力从单纯技术兴奋转向采用周期。",
  contextAfter: "霍夫曼用历史例子说明，从发明到形成产业常常存在漫长滞后，创业者需要复核机会边界。",
  contextSummary: "这段可作为风险判断依据：越强的技术叙事，越需要检查市场、采用和边界。"
} satisfies EvidenceSpan;

export const hoffmanVideoPrompts: VideoPrompt[] = [
  {
    assetId: "m1_video_prompt_hoffman_direction",
    moduleId: "m1",
    durationSeconds: 18,
    structure: [
      "0-3秒：霍夫曼面对镜头，拿起一张写着人工智能演示的卡片",
      "3-8秒：创业者兴奋展示炫酷技术，客户却低头处理另一个真实问题",
      "8-14秒：霍夫曼把演示卡翻面，露出“谁真的会改变行为？”",
      "14-18秒：他抛出选择题：你证明的是技术，还是需求？"
    ],
    prompt: "霍夫曼本色出演，竖屏 9:16，真实办公室或创业路演场景。霍夫曼面对镜头说：看这个团队，他们证明的是技术，还是需求？切到创业者展示炫酷人工智能演示，客户表情礼貌但没有行动。反转：霍夫曼拿走演示卡，客户反而指向一个不起眼但高频的流程痛点。结尾霍夫曼回到镜头，提出判断：方向不是热词，而是行为会不会改变。",
    instructionalRole: "第一章题目前置视频，用于引出视频选择判断，不作装饰。",
    reversal: "炫酷演示不是机会，客户愿意改变的流程才是机会。",
    jimengPrompt: "竖屏 9:16，时长 18 秒，霍夫曼本人本色出演，身份是创业导师，场景为现代办公室或小型创业路演现场，纪实感、自然电影质感、光线温暖、面部清晰。开场霍夫曼看向镜头，用中文表达或配中文字幕：他们证明的是技术，还是需求？随后切到一位创业者在笔记本电脑上展示很炫的人工智能演示，客户礼貌微笑，但没有真正采取行动，仍然在处理一套混乱的手工流程。反转镜头：霍夫曼轻轻翻开写着“人工智能演示”的卡片，背面写着“真实行为会改变吗？”，客户这时指向那个不起眼但高频发生的流程痛点。结尾霍夫曼回到镜头，抛出判断问题：你看到的是技术，还是需求？整体真实商务风格，不要奇幻元素，不要夸张特效。"
  }
];

export const demoCourse: Course = {
  id: "elephant-ai-startup",
  title: "让大象飞：AI 创业基础模块",
  expertName: "Steven S. Hoffman",
  expertTitle: "Founders Space CEO · 创新创业专家",
  description: "用一套移动端任务流，理解霍夫曼关于机会识别、MVP、用户洞察与高速迭代的核心方法。",
  durationMinutes: 20,
  moduleCount: 6,
  rewardTitle: "专家知识基础模块完成奖状",
  summary300:
    "这门课要解决一个核心问题：AI 创业者到底是在解决真实用户问题，还是在展示技术能力？很多团队失败，并不是因为模型不够强，而是太早爱上自己的方案，却没有证明用户真的痛、真的用、真的愿意付费。霍夫曼的方法提醒我们：先找到宝箱，再选择钥匙；先验证痛点，再打磨产品；先看行为证据，再相信市场热度。完成本模块后，你会形成自己的机会判断、验证动作和下一阶段学习路径。",
  modules: [
    {
      id: "m1",
      sourceChapter: 1,
      title: "寻找方向：不管是否寒冬，总有浪潮在往这里来",
      question: "寻找方向只是一个概念，还是会改变现实行动环境？",
      centralClaim: "本章围绕“寻找方向：不管是否寒冬，总有浪潮在往这里来”展开，重点说明寻找方向、总有浪潮在往这里来、技术并没有你以为的那么重要如何改变现实场景，并要求学习者同时理解机会、机制与风险。",
      learningGoal: "学员能够解释第一章的关键机制，识别应用场景和风险边界，并设计一个可验证的行动任务。",
      lessons: [
        "判断方向与行动之间的真实关系",
        "从技术故事切回到客户行为与市场机制"
      ],
      deliverables: ["寻找方向机会-风险-行动画布", "第一章学习闭环记录"],
      contentAtoms: ["m1_atom_01", "m1_atom_02", "m1_atom_03", "m1_atom_04", "m1_atom_05"],
      interactionBlocks: ["m1_i01", "m1_i02", "m1_i03", "m1_i04", "m1_i05"],
      assessment: {
        type: "module_task",
        rubric: ["是否引用证据锚点", "是否能识别关键假设", "是否提出可验证行动"]
      }
    },
    {
      id: "m2",
      title: "准备启航：组队与最小验证",
      question: "早期团队如何用更小单位跑出更快学习速度？",
      lessons: ["早期团队为什么越小越快？", "MVP 不是缩水产品，而是验证动作"],
      deliverables: ["启动配置表", "7 天 MVP 验证实验表"]
    },
    {
      id: "m3",
      title: "打造产品：从技术到用户体验",
      question: "技术价值如何翻译成用户愿意买单的产品价值？",
      lessons: ["技术价值如何变成用户价值？", "爱产品，但不要爱到听不见用户"],
      deliverables: ["用户价值改写卡", "产品体验诊断表"]
    },
    {
      id: "m4",
      title: "锁定市场：吃透用户与市场",
      question: "用户说想要，是否等于真的会用、真的会买？",
      lessons: ["用户说想要，不等于真的会用", "客户访谈要追问过去行为"],
      deliverables: ["行为证据清单", "5 问客户访谈脚本"]
    },
    {
      id: "m5",
      title: "持续创新：失败、迭代与内部创新",
      question: "失败如何变成下一轮创新的输入？",
      lessons: ["失败是不是学习？", "边缘实验如何变成创新来源？"],
      deliverables: ["失败复盘卡", "内部创新候选表"]
    },
    {
      id: "m6",
      title: "高速运转：速度、增长与竞争",
      question: "真正的速度是忙碌，还是更短的学习周期？",
      lessons: ["速度的本质是学习速度", "如何设计 90 天行动路线图？"],
      deliverables: ["学习速度诊断表", "90 天行动路线图"]
    }
  ],
  diagnosisQuestions: [
    {
      id: "d1",
      type: "single",
      question: "你判断一个 AI 创业机会时，第一反应最看重什么？",
      options: [
        { id: "a", text: "技术是否领先", score: 8, tags: ["技术优先型"] },
        { id: "b", text: "用户痛点是否真实", score: 20, tags: ["市场敏感型"] },
        { id: "c", text: "团队是否足够强", score: 14, tags: ["团队驱动型"] },
        { id: "d", text: "融资故事是否好讲", score: 6, tags: ["叙事优先型"] }
      ]
    },
    {
      id: "d2",
      type: "single",
      question: "如果演示样机很惊艳但客户不愿意试用，你会怎么判断？",
      options: [
        { id: "a", text: "继续打磨演示样机，让它更震撼", score: 6, tags: ["产品自嗨风险"] },
        { id: "b", text: "回到客户真实流程，找未被解决的痛点", score: 20, tags: ["验证意识"] },
        { id: "c", text: "先做品牌包装", score: 8, tags: ["叙事优先型"] }
      ]
    },
    {
      id: "d3",
      type: "single",
      question: "你认为 MVP 最重要的作用是什么？",
      options: [
        { id: "a", text: "用最小成本验证关键假设", score: 20, tags: ["实验导向型"] },
        { id: "b", text: "做一个功能少一点的完整产品", score: 9, tags: ["完整产品倾向"] },
        { id: "c", text: "给投资人看起来更像产品", score: 7, tags: ["展示导向"] }
      ]
    },
    {
      id: "d4",
      type: "single",
      question: "客户说“这个产品很有意思”，你会把它看作什么？",
      options: [
        { id: "a", text: "强需求信号", score: 8, tags: ["反馈乐观型"] },
        { id: "b", text: "初步兴趣，还要看真实行为", score: 20, tags: ["行为证据型"] },
        { id: "c", text: "可以马上扩大团队", score: 5, tags: ["扩张过早风险"] }
      ]
    },
    {
      id: "d5",
      type: "single",
      question: "你现在是否有正在探索的项目或想法？",
      options: [
        { id: "a", text: "有，并且已经接触过真实用户", score: 20, tags: ["高项目信号"] },
        { id: "b", text: "有想法，但还没有验证", score: 14, tags: ["项目探索型"] },
        { id: "c", text: "暂时没有，主要想学习", score: 8, tags: ["学习探索型"] }
      ]
    }
  ],
  keyPoints: [
    {
      id: "ch1_kp_01",
      sourceChapter: 1,
      sourceAtomId: "m1_atom_01",
      sourceCardId: "ch1_card_01",
      contentType: "core_claim",
      difficulty: "L2",
      title: "寻找方向的核心命题",
      oneSentence: "寻找方向不是热词，是会改变行动环境的一种判断能力。",
      explanation: "当技术浪潮来临时，真正的判断不是“有多新”，而是它是否改变组织流程、决策边界和用户行为。技术并不是终点，方向是否能被验证才是关键。",
      example: "在一个团队里，先判断“谁的需求先发生变化”，再决定是否投人工智能。",
      evidenceSpans: [ch1DirectionEvidence],
      tags: ["让大象飞", "寻找方向", "core_claim"],
      teachingUse: "用于引发判断、讨论、练习或项目迁移",
      video: "videos/jimeng-2026-06-29-8979-霍夫曼本人本色出演，身份是创业导师，场景为现代办公室或小型创业路演现场，纪实感、....mp4",
      videoPromptId: "m1_video_prompt_hoffman_direction",
      revealQuestion: {
        id: "m1_q01",
        type: "video_choice",
        interactionId: "m1_i01",
        sourceAtomId: "m1_atom_01",
        contentType: "core_claim",
        interactionType: "video_choice",
        targetNeedFit: {
          cognitive_opening: 82,
          method_learning: 55,
          conversation_solving: 64,
          practice_participation: 45
        },
        question: "寻找方向只是一个概念，还是会改变现实？",
        correctIndex: 1,
        options: [
          { id: "a", text: "只是概念名词", score: 4, tags: ["判断"] },
          { id: "b", text: "会改变现实行动环境", score: 20, tags: ["判断"] },
          { id: "c", text: "只适合专家讨论", score: 5, tags: ["判断"] }
        ],
        feedback: {
          correct: "判断到位",
          incorrect: "回到证据"
        },
        media: {
          type: "video",
          duration: 18,
          prompt: "霍夫曼本色出演，通过人工智能演示与真实客户行为的反差，引导学习者判断方向是否改变现实。"
        },
        revealTitle: "专家揭示",
        revealContent: "霍夫曼会先问：你的判断能否被行为验证，而不是被口号解释。方向不是“会不会热”，而是“真实场景会不会被改变”。",
        evidenceSpans: [ch1DirectionEvidence]
      }
    },
    {
      id: "ch1_kp_02",
      sourceChapter: 1,
      sourceAtomId: "m1_atom_02",
      sourceCardId: "ch1_card_02",
      contentType: "mechanism",
      difficulty: "L2",
      title: "技术并没有你以为的那么重要的作用机制",
      oneSentence: "技术不是问题本身，而是与场景与行为系统耦合后的放大器。",
      explanation: "霍夫曼在这章反复说明：技术本身很少是决定性优势，机制是否解释清楚才决定是否可落地。真正的机会从“可复制技术”升级为“可复制价值”。",
      example: "先写明“影响谁、在哪个流程、带来什么改变”，再谈模型方案。",
      evidenceSpans: [ch1TechnologyEvidence],
      tags: ["让大象飞", "寻找方向", "mechanism"],
      teachingUse: "用于引发判断、讨论、练习或项目迁移",
      video: "videos/jimeng-2026-06-29-1811-霍夫曼本人本色出演，场景为创业辅导会议室，桌上有电脑、便签和白板，真实纪实风格。....mp4",
      revealQuestion: {
        id: "m1_q02",
        type: "choice",
        interactionId: "m1_i02",
        sourceAtomId: "m1_atom_02",
        contentType: "mechanism",
        interactionType: "choice",
        targetNeedFit: {
          cognitive_opening: 55,
          method_learning: 82,
          conversation_solving: 50,
          practice_participation: 76
        },
        question: "技术并没有你以为的那么重要为什么不是术语，却会形成力量？",
        correctIndex: 0,
        options: [
          { id: "a", text: "说清机制和场景连接", score: 20, tags: ["机制"] },
          { id: "b", text: "记住更多术语", score: 5, tags: ["记忆型"] },
          { id: "c", text: "只看是否流行", score: 4, tags: ["追热点"] }
        ],
        feedback: {
          correct: "判断到位",
          incorrect: "回到证据"
        },
        media: {
          type: "text",
          prompt: "阅读观点卡后完成机制判断：技术价值必须连接具体场景和行为变化。"
        },
        revealTitle: "专家揭示",
        revealContent: "技术并非废物，但它不是起点。起点是问题、机制、资源和可验证的行动路径。",
        evidenceSpans: [ch1TechnologyEvidence]
      }
    },
    {
      id: "ch1_kp_03",
      sourceChapter: 1,
      sourceAtomId: "m1_atom_03",
      sourceCardId: "ch1_card_03",
      contentType: "scenario_judgement",
      difficulty: "L2",
      title: "创新之前，别说你不屑于模仿带来的场景判断",
      oneSentence: "模仿不是偷懒，而是对新旧技术切换的一种现实策略。",
      explanation: "这章提醒你把模仿当作“快速校验”而非“否定原创性”：先用可复制经验触达现实场景，再反向提炼自己的差异。",
      example: "从一个真实业务中找第一条变化路径，比先写完整概念框架更有效。",
      evidenceSpans: [ch1ImitationEvidence],
      tags: ["让大象飞", "寻找方向", "scenario_judgement"],
      teachingUse: "用于引发判断、讨论、练习或项目迁移",
      video: "videos/jimeng-2026-06-29-3891-霍夫曼本人本色出演，场景为创业团队复盘桌，桌上摆着两个产品草图，一个写着“原创”....mp4",
      revealQuestion: {
        id: "m1_q03",
        type: "open",
        interactionId: "m1_i03",
        sourceAtomId: "m1_atom_03",
        contentType: "scenario_judgement",
        interactionType: "open",
        targetNeedFit: {
          cognitive_opening: 82,
          method_learning: 55,
          conversation_solving: 64,
          practice_participation: 45
        },
        question: "如果创新之前，别说你不屑于模仿成熟，哪个场景会先变化？",
        feedback: {
          correct: "判断到位",
          incorrect: "回到证据"
        },
        media: {
          type: "text",
          prompt: "阅读观点卡后，把模仿从道德判断改写成一个场景验证问题。"
        },
        revealTitle: "专家揭示",
        revealContent: "先回答“先变的是谁、变化发生在什么动作环节、为何会先发生”，再给出一个能回读的证据段。",
        evidenceSpans: [ch1ImitationEvidence]
      }
    },
    {
      id: "ch1_kp_04",
      sourceChapter: 1,
      sourceAtomId: "m1_atom_04",
      sourceCardId: "ch1_card_04",
      contentType: "risk_tradeoff",
      difficulty: "L2",
      title: "寻找方向的风险边界",
      oneSentence: "越有机会的方向，越要先定义可复核的边界。",
      explanation: "方向变化会带来能力失配、合规、资源与行为风险。课程学习不是只要勇敢，而是把风险前置写进验证框架。",
      example: "在承诺推进前，先写明“谁承担了什么代价、哪项假设可证伪”。",
      evidenceSpans: [ch1RiskEvidence],
      tags: ["让大象飞", "寻找方向", "risk_tradeoff"],
      teachingUse: "用于引发判断、讨论、练习或项目迁移",
      video: "videos/jimeng-2026-06-29-5469-霍夫曼本人本色出演，场景为热闹的人工智能创业展示现场，背景有人鼓掌、屏幕显示增长....mp4",
      revealQuestion: {
        id: "m1_q04",
        type: "truefalse",
        interactionId: "m1_i04",
        sourceAtomId: "m1_atom_04",
        contentType: "risk_tradeoff",
        interactionType: "truefalse",
        targetNeedFit: {
          cognitive_opening: 74,
          method_learning: 55,
          conversation_solving: 80,
          practice_participation: 45
        },
        question: "寻找方向越强，风险会自动变小吗？",
        correctAnswer: "false",
        options: [
          { id: "true", text: "是，方向越强风险越小", score: 4, tags: ["判断风险"] },
          { id: "false", text: "否，风险会被放大并要求更快复核", score: 20, tags: ["风险校验"] }
        ],
        feedback: {
          correct: "判断到位",
          incorrect: "回到证据"
        },
        media: {
          type: "text",
          prompt: "阅读观点卡后判断：强方向是否会自动降低风险。"
        },
        revealTitle: "专家揭示",
        revealContent: "方向越强，边界判断越重要；否则“热情冲动”会代替复核，风险会以更快速度放大。",
        evidenceSpans: [ch1RiskEvidence]
      }
    },
    {
      id: "ch1_kp_05",
      sourceChapter: 1,
      sourceAtomId: "m1_atom_05",
      sourceCardId: "ch1_card_05",
      contentType: "application_task",
      difficulty: "L2",
      title: "把“寻找方向...”转成行动任务",
      oneSentence: "理解之后要落到一个可复核、可提交的任务上。",
      explanation: "第一章的目标不是背概念，而是建立“机会-风险-验证”闭环。只有把判断写成行动，才会形成可共享的学习轨迹。",
      example: "写下你的一个真实行业样本、受影响对象、关键风险和下一步验证动作。",
      evidenceSpans: [ch1DirectionEvidence],
      tags: ["让大象飞", "寻找方向", "application_task"],
      teachingUse: "用于引发判断、讨论、练习或项目迁移",
      video: "videos/jimeng-2026-06-29-3495-霍夫曼本人本色出演，场景为创业导师办公桌，桌上有一张空白画布，标题是“机会-风险....mp4",
      revealQuestion: {
        id: "m1_q05",
        type: "choice",
        interactionId: "m1_i05",
        sourceAtomId: "m1_atom_05",
        contentType: "application_task",
        interactionType: "choice",
        targetNeedFit: {
          cognitive_opening: 55,
          method_learning: 82,
          conversation_solving: 50,
          practice_participation: 76
        },
        question: "学完本章只是理解概念，还是要提交练习？",
        correctIndex: 0,
        options: [
          { id: "a", text: "写一个机会-风险-验证表", score: 20, tags: ["任务导向"] },
          { id: "b", text: "背诵全部案例", score: 2, tags: ["内容背诵"] },
          { id: "c", text: "只讨论未来想象", score: 5, tags: ["空转讨论"] }
        ],
        feedback: {
          correct: "判断到位",
          incorrect: "回到证据"
        },
        media: {
          type: "text",
          prompt: "阅读观点卡后，把理解转成可提交的机会-风险-行动画布。"
        },
        revealTitle: "专家揭示",
        revealContent: "“看懂”必须转为“能交付”。先写下你的验证动作与截止时间，再做下一轮迭代。",
        evidenceSpans: [ch1DirectionEvidence]
      }
    }
  ],
  quizQuestions: [
    {
      id: "q1",
      type: "single",
      question: "“宝箱-钥匙”模型中，宝箱指的是什么？",
      options: [
        { id: "a", text: "用户愿意为之行动或付费的高价值问题", score: 20, tags: ["概念掌握"] },
        { id: "b", text: "团队掌握的 AI 模型能力", score: 4, tags: ["概念混淆"] },
        { id: "c", text: "融资故事里最吸引人的部分", score: 3, tags: ["叙事优先型"] }
      ]
    },
    {
      id: "q2",
      type: "single",
      question: "判断真浪潮时，最应该优先看什么？",
      options: [
        { id: "a", text: "行为证据：付费、留存、频次、自传播", score: 20, tags: ["证据意识"] },
        { id: "b", text: "行业大会热度", score: 6, tags: ["热度信号"] },
        { id: "c", text: "朋友圈讨论量", score: 5, tags: ["传播信号"] }
      ]
    },
    {
      id: "q3",
      type: "single",
      question: "最好的 MVP 更像什么？",
      options: [
        { id: "a", text: "小号完整产品", score: 7, tags: ["完整产品倾向"] },
        { id: "b", text: "最小验证动作", score: 20, tags: ["实验导向型"] },
        { id: "c", text: "投资人演示样机", score: 5, tags: ["展示导向"] }
      ]
    }
  ],
  finalOpenQuestions: [
    {
      id: "open_name",
      type: "text",
      question: "证书上希望显示的名字是？"
    },
    {
      id: "open_view",
      type: "text",
      question: "请用一句话解释：为什么“不要爱上自己的想法”？"
    },
    {
      id: "open_project",
      type: "text",
      question: "如果你现在有一个项目或想法，最需要验证的未知是什么？"
    }
  ],
  videoPrompts: hoffmanVideoPrompts
};

export const recommendationCatalog: Recommendation[] = [
  {
    id: "r1",
    type: "project_diagnosis",
    title: "创业项目诊断模块",
    reason: "你的回答中出现了明确项目或验证意识，适合进入一次结构化项目诊断。",
    suitableFor: "已有项目想法、但需要明确用户和验证路径的学员",
    estimatedTime: "45 分钟",
    requiresApplication: true,
    ctaText: "进入项目诊断"
  },
  {
    id: "r2",
    type: "coffee_chat",
    title: "专家 Coffee Chat",
    reason: "你对专家方向匹配度较高，可以申请小范围交流机会。",
    suitableFor: "高潜学员、项目负责人、深度学习者",
    estimatedTime: "30 分钟",
    requiresApplication: true,
    ctaText: "申请 Coffee Chat"
  },
  {
    id: "r3",
    type: "advanced_learning",
    title: "AI 创业进阶学习模块",
    reason: "你已经理解核心概念，但还可以继续补强案例和方法工具。",
    suitableFor: "完成基础学习、希望系统进阶的学员",
    estimatedTime: "60 分钟",
    requiresApplication: false,
    ctaText: "继续学习"
  },
  {
    id: "r4",
    type: "project_challenge",
    title: "7 天 MVP 验证挑战",
    reason: "你的答案显示出实验倾向，适合把想法压缩成一个 7 天验证动作。",
    suitableFor: "愿意快速行动、拿到真实反馈的学员",
    estimatedTime: "7 天",
    requiresApplication: false,
    ctaText: "开始挑战"
  },
  {
    id: "r5",
    type: "offline_lecture",
    title: "AI 创业线下闭门讲座",
    reason: "你适合通过案例讨论继续建立机会判断框架。",
    suitableFor: "探索期学员、商学院成员、行业从业者",
    estimatedTime: "2 小时",
    requiresApplication: true,
    ctaText: "预约席位"
  }
];
