import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { demoCourse, experts } from "./data/course";
import { bookBreakdown, buildAdaptiveCourse, buildNeedProfile, courseVariants, fitSurveyComplete, fitSurveyQuestions, needLabels, needOrder, primaryNeedFromProfile, qualityChecks, type CoverTab, type NeedKey, type NeedProfile } from "./data/courseBuilder";
import { buildProfile, pickRecommendations } from "./utils/scoring";
import type { Answers, AppStep, Course, Expert, EvidenceSpan, KeyPoint, Question, Recommendation } from "./types";

const stepOrder: AppStep[] = [
  "square",
  "experts",
  "my",
  "expertHome",
  "coursePay",
  "fitSurvey",
  "agentPay",
  "agentChat",
  "cover",
  "summary",
  "diagnosis",
  "cards",
  "interaction",
  "quiz",
  "openQuestion",
  "complete",
  "certificate",
  "profile",
  "recommendations"
];

const stepMeta: Record<AppStep, { title: string; eyebrow: string }> = {
  square: { title: "推荐", eyebrow: "Recommendation" },
  experts: { title: "专家列表", eyebrow: "Thinker Expert" },
  my: { title: "我的", eyebrow: "My Thinker" },
  expertHome: { title: "专家主页", eyebrow: "Expert Hub" },
  coursePay: { title: "开通专家课程", eyebrow: "Course Access" },
  fitSurvey: { title: "Thinker用户需求洞察", eyebrow: "Need Insight" },
  agentPay: { title: "开通专家 Agent", eyebrow: "Expert Agent" },
  agentChat: { title: "专家 Agent", eyebrow: "Ask Expert" },
  cover: { title: "课程封面", eyebrow: "Course Entry" },
  overview: { title: "学习导览", eyebrow: "7-Step Path" },
  summary: { title: "300 字速看", eyebrow: "Fast Brief" },
  diagnosis: { title: "认知诊断", eyebrow: "Before Learning" },
  cards: { title: "原子观点", eyebrow: "Knowledge Atom" },
  interaction: { title: "1 问 1 揭示", eyebrow: "Think First" },
  quiz: { title: "课后小题目", eyebrow: "Check Point" },
  openQuestion: { title: "开放表达", eyebrow: "Your Voice" },
  complete: { title: "学习完成", eyebrow: "Completed" },
  certificate: { title: "定制化证书", eyebrow: "Certificate" },
  profile: { title: "学习画像", eyebrow: "Profile" },
  recommendations: { title: "下一阶段推荐", eyebrow: "Next Stage" }
};

function mediaUrl(src?: string) {
  return src ? encodeURI(`/${src}`) : "";
}

function posterUrl(src?: string) {
  if (!src) return "";
  if (src.startsWith("videos/")) return "";
  const file = src.split("/").pop();
  return encodeURI(`/posters/${file}.png`);
}

function cx(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ");
}

function answerText(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value.join("、") : value;
}

function asAnswerArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isQuestionAnswered(question: Question, answer: string | string[] | undefined) {
  if (question.type === "multiple") return asAnswerArray(answer).length > 0;
  return answerText(answer).trim().length > 0;
}

function truthyQuestionOptions(question: Question) {
  const defaults = [
    { id: "true", text: "是", score: 6 },
    { id: "false", text: "否", score: 2 }
  ];
  return question.options?.length ? question.options : question.type === "truefalse" ? defaults : [];
}

function isOptionCorrect(question: Question, optionId: string) {
  if (question.correctAnswer === "true" || question.correctAnswer === "false") {
    return optionId === question.correctAnswer;
  }
  if (typeof question.correctIndex === "number" && question.options?.length) {
    const correct = question.options[question.correctIndex];
    return optionId === correct?.id || optionId === correct?.text;
  }
  if (!question.options?.length) return false;
  return false;
}

function evidenceTitle(span: EvidenceSpan) {
  const chapter = `第 ${span.chapterIndex} 章`;
  const paragraph = span.paragraphIndex === span.paragraphIndexEnd ? `第 ${span.paragraphIndex} 段` : `第 ${span.paragraphIndex}-${span.paragraphIndexEnd} 段`;
  if (span.sourceHeading) return `${span.sourceHeading} · ${chapter} ${paragraph}`;
  return `${chapter} ${paragraph}`;
}

export default function App() {
  const [step, setStep] = useState<AppStep>("fitSurvey");
  const [selectedExpertId, setSelectedExpertId] = useState("hoffman");
  const [diagnosisIndex, setDiagnosisIndex] = useState(0);
  const [pointIndex, setPointIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [fitAnswers, setFitAnswers] = useState<Answers>({});
  const [fitCompleted, setFitCompleted] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [cardVisited, setCardVisited] = useState<Record<string, boolean>>({});
  const [courseUnlocked, setCourseUnlocked] = useState(false);
  const [courseReturnStep, setCourseReturnStep] = useState<AppStep>("expertHome");
  const [agentUnlocked, setAgentUnlocked] = useState(false);
  const [agentContext, setAgentContext] = useState("专家主页");
  const [agentReturnStep, setAgentReturnStep] = useState<AppStep>("expertHome");
  const [agentDraft, setAgentDraft] = useState("");
  const [agentMessages, setAgentMessages] = useState<string[]>([
    "你好，我是 Hoffman 专家 Agent。你可以问我：如何判断机会、如何设计 MVP、如何验证用户需求。"
  ]);
  const [showMoreCompleteRecommendations, setShowMoreCompleteRecommendations] = useState(false);
  const [showFitResultModal, setShowFitResultModal] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const selectedExpert = experts.find((item) => item.id === selectedExpertId) || experts[0];
  const needProfile = useMemo(() => buildNeedProfile(fitAnswers), [fitAnswers]);
  const primaryNeed = useMemo(() => primaryNeedFromProfile(needProfile), [needProfile]);
  const activeVariant = courseVariants[primaryNeed];
  const activeCourse = useMemo(() => buildAdaptiveCourse(demoCourse, primaryNeed), [primaryNeed]);
  const currentPoint = activeCourse.keyPoints[pointIndex];
  const currentDiagnosis = activeCourse.diagnosisQuestions[diagnosisIndex];
  const currentQuiz = activeCourse.quizQuestions[quizIndex];
  const answerableQuestionCount = useMemo(
    () => [
      ...activeCourse.diagnosisQuestions.map((item) => item.id),
      ...activeCourse.quizQuestions.map((item) => item.id),
      ...activeCourse.finalOpenQuestions.map((item) => item.id)
    ],
    [activeCourse]
  );
  const completedQuestionUnits = answerableQuestionCount.reduce((acc, id) => acc + (answerText(answers[id]).length > 0 ? 1 : 0), 0);
  const completedCardUnits = Object.keys(cardVisited).length;
  const totalUnits = activeCourse.keyPoints.length + answerableQuestionCount.length;
  const completedUnits = completedCardUnits + completedQuestionUnits;
  const completionRate = Math.min(100, Math.round((completedUnits / totalUnits) * 100));
  const profile = useMemo(() => buildProfile(activeCourse, answers, completionRate), [activeCourse, answers, completionRate]);
  const recommendations = useMemo(() => pickRecommendations(profile), [profile]);
  const learnerName = "Thinker 学员";
  const learningSteps: AppStep[] = ["summary", "diagnosis", "cards", "interaction", "quiz", "openQuestion", "complete", "certificate", "profile", "recommendations"];
  const currentStepIndex = stepOrder.indexOf(step);
  const learningStepIndex = learningSteps.indexOf(step);
  const stepPercent = learningStepIndex >= 0 ? Math.round(((learningStepIndex + 1) / learningSteps.length) * 100) : 0;

  useEffect(() => {
    if (step === "cards" && currentPoint) {
      setCardVisited((prev) => (prev[currentPoint.id] ? prev : { ...prev, [currentPoint.id]: true }));
    }
  }, [step, currentPoint?.id]);

  function go(next: AppStep) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveAnswer(questionId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function saveFitAnswer(questionId: string, value: string) {
    setFitAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function openAgent(context = "专家主页", returnStep: AppStep = step) {
    setAgentContext(context);
    setAgentReturnStep(returnStep);
    go(agentUnlocked ? "agentChat" : "agentPay");
  }

  function unlockAgent() {
    setAgentUnlocked(true);
    go("agentChat");
  }

  function openCourse(returnStep: AppStep = step) {
    setCourseReturnStep(returnStep);
    go(courseUnlocked ? "cover" : "coursePay");
  }

  function unlockCourse() {
    setCourseUnlocked(true);
    go("cover");
  }

  function sendAgentMessage(context: string) {
    const text = agentDraft.trim();
    if (!text) return;
    setAgentMessages((prev) => [
      ...prev,
      `你：${text}`,
      `Hoffman Agent：结合「${context}」来看，我会先追问真实用户行为证据，再判断这是不是值得继续验证的机会。`
    ]);
    setAgentDraft("");
  }

  function nextFromInteraction() {
    if (pointIndex < activeCourse.keyPoints.length - 1) {
      setPointIndex((value) => value + 1);
      go("cards");
    } else {
      go("quiz");
    }
  }

  return (
    <div className="min-h-screen text-ink font-display">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-void/92 shadow-glow">
        <TopChrome
          step={step}
          percent={stepPercent}
          expertName={selectedExpert.name}
          onBack={() => go(step === "agentPay" || step === "agentChat" ? agentReturnStep : step === "fitSurvey" ? "fitSurvey" : step === "my" ? "experts" : step === "coursePay" ? courseReturnStep : step === "cover" ? courseReturnStep : "experts")}
          onSkipToEnd={() => go("openQuestion")}
        />
        <main className="px-5 pb-28 pt-5">
          {step !== "experts" && step !== "my" && step !== "expertHome" && step !== "coursePay" && step !== "fitSurvey" && step !== "cover" && step !== "agentPay" && step !== "agentChat" && (
            <StepHeader
              step={step}
              agentSlot={
                <AgentNudge
                  step={step}
                  context={currentPoint?.title || currentDiagnosis?.question || currentQuiz?.question || stepMeta[step].title}
                  onOpen={(context) => openAgent(context, step)}
                />
              }
            />
          )}
          {step === "square" && <SquarePage profile={needProfile} primaryNeed={primaryNeed} expert={selectedExpert} onOpenCourse={() => openCourse("square")} onOpenAgent={() => openAgent("广场 · Hoffman 专家 Agent", "square")} />}
          {step === "my" && <MyPage profile={needProfile} primaryNeed={primaryNeed} onRestart={() => { setFitAnswers({}); setShowFitResultModal(false); setFitCompleted(false); go("fitSurvey"); }} />}
          {step === "experts" && (
            <ExpertList
              onMy={() => go("my")}
              onOpen={(id) => {
                setSelectedExpertId(id);
                setCourseUnlocked(false);
                setAnswers({});
                setRevealed({});
                setCardVisited({});
                setDiagnosisIndex(0);
                setPointIndex(0);
                setQuizIndex(0);
                go("expertHome");
              }}
            />
          )}
          {step === "expertHome" && <ExpertHomePage expert={selectedExpert} agentUnlocked={agentUnlocked} onOpenAgent={() => openAgent("专家主页", "expertHome")} onStartCourse={() => openCourse("expertHome")} />}
          {step === "coursePay" && <CoursePayPage expert={selectedExpert} course={demoCourse} onPay={unlockCourse} />}
          {step === "fitSurvey" && <FitSurveyPage answers={fitAnswers} profile={needProfile} primaryNeed={primaryNeed} onAnswer={saveFitAnswer} onNext={() => setShowFitResultModal(true)} />}
          {step === "agentPay" && <AgentPayPage expert={selectedExpert} context={agentContext} onPay={unlockAgent} />}
          {step === "agentChat" && <AgentChatPage expert={selectedExpert} context={agentContext} draft={agentDraft} messages={agentMessages} onDraft={setAgentDraft} onSend={sendAgentMessage} />}
          {step === "cover" && <CoverPage expertName={selectedExpert.name} course={activeCourse} variant={activeVariant} primaryNeed={primaryNeed} needProfile={needProfile} onStart={() => go("summary")} onOpenAudio={() => setShowAudioPlayer(true)} />}
          {step === "summary" && <SummaryPage course={activeCourse} variant={activeVariant} onNext={() => go("diagnosis")} />}
          {step === "diagnosis" && (
            <QuestionStep
              question={currentDiagnosis}
              answer={answers[currentDiagnosis.id]}
              index={diagnosisIndex}
              total={activeCourse.diagnosisQuestions.length}
              onAnswer={saveAnswer}
              onPrev={() => setDiagnosisIndex((value) => Math.max(0, value - 1))}
              onNext={() => {
                if (diagnosisIndex < activeCourse.diagnosisQuestions.length - 1) setDiagnosisIndex((value) => value + 1);
                else go("cards");
              }}
              nextLabel={diagnosisIndex === activeCourse.diagnosisQuestions.length - 1 ? "进入观点卡" : "下一题"}
            />
          )}
          {step === "cards" && <KeyPointCard point={currentPoint} index={pointIndex} total={activeCourse.keyPoints.length} variant={activeVariant} onNext={() => go("interaction")} />}
          {step === "interaction" && (
            <InteractionPage
              point={currentPoint}
              index={pointIndex}
              total={activeCourse.keyPoints.length}
              isLast={pointIndex === activeCourse.keyPoints.length - 1}
              answer={answers[currentPoint.revealQuestion.id]}
              revealed={Boolean(revealed[currentPoint.id])}
              onAnswer={saveAnswer}
              onReveal={() => setRevealed((prev) => ({ ...prev, [currentPoint.id]: true }))}
              onNext={nextFromInteraction}
            />
          )}
          {step === "quiz" && (
            <QuestionStep
              question={currentQuiz}
              answer={answers[currentQuiz.id]}
              index={quizIndex}
              total={activeCourse.quizQuestions.length}
              onAnswer={saveAnswer}
              onPrev={() => setQuizIndex((value) => Math.max(0, value - 1))}
              onNext={() => {
                if (quizIndex < activeCourse.quizQuestions.length - 1) setQuizIndex((value) => value + 1);
                else go("openQuestion");
              }}
              nextLabel={quizIndex === activeCourse.quizQuestions.length - 1 ? "开放表达" : "下一题"}
            />
          )}
          {step === "openQuestion" && <OpenQuestionPage course={activeCourse} answers={answers} onAnswer={saveAnswer} onNext={() => go("complete")} />}
          {step === "complete" && (
            <CompletePage
              completionRate={completionRate}
              cardCount={activeCourse.keyPoints.length}
              questionCount={answerableQuestionCount.length}
              profile={profile}
              recommendations={recommendations}
              showMore={showMoreCompleteRecommendations}
              onToggleMore={() => setShowMoreCompleteRecommendations((value) => !value)}
              onNext={() => go("certificate")}
            />
          )}
          {step === "certificate" && <CertificatePage learnerName={learnerName} onNext={() => go("profile")} />}
          {step === "profile" && <ProfilePage profile={profile} onNext={() => go("recommendations")} />}
          {step === "recommendations" && <RecommendationPage recommendations={recommendations} profileLevel={profile.level} />}
        </main>
        <AudioPlayerModal open={showAudioPlayer} onClose={() => setShowAudioPlayer(false)} />
        <FitResultModal open={showFitResultModal} profile={needProfile} primaryNeed={primaryNeed} onClose={() => { setShowFitResultModal(false); setFitCompleted(true); go("square"); }} />
        <MainToolbar step={step} onGo={go} />
        <BottomNav
          step={step}
          onBack={() => {
            const prev = stepOrder[Math.max(0, currentStepIndex - 1)];
            go(prev);
          }}
        />
      </div>
    </div>
  );
}

function TopChrome({ step, percent, expertName, onBack, onSkipToEnd }: { step: AppStep; percent: number; expertName: string; onBack: () => void; onSkipToEnd: () => void }) {
  const canSkipToEnd = ["summary", "diagnosis", "cards", "interaction", "quiz"].includes(step);
  if(step === "experts") return <div className="h-6" />;
  if(step === "square" || step === "my" || step === "expertHome" || step === "coursePay" || step === "fitSurvey" || step === "agentPay" || step === "agentChat" || step === "cover"){
    const title = step === "expertHome" ? expertName : stepMeta[step].title;
    return (
      <header className="sticky top-0 z-30 grid h-16 grid-cols-[48px_1fr_48px] items-center border-b border-white/10 bg-void/92 px-3 backdrop-blur-xl">
        {step === "fitSurvey" ? <div /> : <button onClick={onBack} className="grid h-11 w-11 place-items-center rounded-full text-4xl font-light leading-none text-white">‹</button>}
        <div className="truncate text-center text-xl font-semibold">{title}</div>
        <div />
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-void/88 px-5 pb-3 pt-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[.24em] text-amber">Thinker H5</div>
          <div className="mt-1 text-sm text-ash">专家知识进入与第二阶段推荐</div>
        </div>
        <div className="flex items-center gap-2">
          {canSkipToEnd && (
            <button onClick={onSkipToEnd} className="rounded-full border border-white/10 bg-white/[.055] px-2.5 py-1 text-[10px] font-bold text-smoke transition hover:border-amber/50 hover:text-amber active:scale-95">
              跳到结课
            </button>
          )}
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink">{percent}%</div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-plum transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 text-[11px] text-smoke">{stepMeta[step].eyebrow}</div>
    </header>
  );
}

function CoursePayPage({ expert, course, onPay }: { expert: Expert; course: Course; onPay: () => void }) {
  const [activePanel, setActivePanel] = useState<"benefits" | "guide">("benefits");
  const benefits = [
    { title: "专家知识与经验", desc: "提炼 Hoffman 创业方法论，转成 AI 创业者可执行的机会判断框架。", icon: "knowledge" as const },
    { title: "中信认证证书", desc: "完成课程与关键题目后，生成带学习画像的定制化认证证书。", icon: "certificate" as const },
    { title: "线下讲座与专家交流", desc: `优秀作业与项目案例可进入闭门讲座、圆桌问答或与 ${expert.name.split(" ")[0]} 交流机会池。`, icon: "event" as const },
    { title: "项目指导与第二阶段推荐", desc: "高潜学员可进入项目诊断、MVP 验证、导师反馈和项目加速服务。", icon: "mentor" as const }
  ];
  const metrics = [
    ["20 分钟", "课程时间"],
    ["6 个章节", "知识框架"],
    ["4 项权益", "后续权益"]
  ];

  return (
    <section className="space-y-5">
      <Card className="overflow-hidden border-amber/35 bg-[radial-gradient(circle_at_top_left,rgba(246,199,87,.2),transparent_42%),rgba(255,255,255,.045)] p-0">
        <div className="p-5">
          <div className="text-[11px] uppercase tracking-[.26em] text-amber">Expert Course</div>
          <h1 className="mt-3 text-3xl font-black leading-tight">{course.title}</h1>
          <p className="mt-3 text-sm leading-7 text-ash">{course.description}</p>
          <div className="mt-5 flex items-center gap-3 rounded-[24px] border border-white/10 bg-black/25 p-3">
            <img src={expert.avatarUrl} alt={expert.name} className="h-14 w-14 rounded-full object-cover" />
            <div>
              <div className="text-base font-bold">{expert.name}</div>
              <div className="mt-1 text-xs leading-5 text-smoke">{expert.title}</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {metrics.map(([value, label]) => (
          <div key={label} className="rounded-[24px] border border-white/10 bg-white/[.055] px-2 py-4 text-center shadow-[0_14px_34px_rgba(0,0,0,.18)]">
            <div className="text-lg font-black text-ink">{value}</div>
            <div className="mt-1 text-[10px] text-smoke">{label}</div>
          </div>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="grid grid-cols-2 rounded-full border border-white/10 bg-black/30 p-1">
          {[
            ["benefits", "开通后获得"],
            ["guide", "学习导览"]
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActivePanel(id as "benefits" | "guide")}
              className={cx(
                "h-10 rounded-full text-sm font-black transition active:scale-[.98]",
                activePanel === id ? "bg-amber text-black shadow-[0_10px_30px_rgba(246,199,87,.25)]" : "text-ash hover:bg-white/[.06] hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {activePanel === "benefits" ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-bold text-amber">开通后你可以获得</div>
              <h2 className="mt-2 text-2xl font-black">不只是课程，而是一条专家成长链路</h2>
            </div>
            <div className="grid gap-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="grid grid-cols-[54px_1fr] gap-3 rounded-[26px] border border-amber/25 bg-[linear-gradient(135deg,rgba(246,199,87,.16),rgba(124,77,255,.12))] p-4">
                  <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-amber text-black shadow-[0_12px_30px_rgba(246,199,87,.28)]">
                    <BenefitIcon type={benefit.icon} />
                  </div>
                  <div>
                    <div className="text-base font-black">{benefit.title}</div>
                    <p className="mt-1 text-xs leading-5 text-ash">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-bold text-amber">学习导览</div>
              <h2 className="mt-2 text-2xl font-black">6 个章节，先建立判断力，再进入项目验证</h2>
              <p className="mt-2 text-sm leading-6 text-ash">每个模块都围绕一个关键创业问题展开，课程中会穿插视频情景、选择题、开放表达和最终证书生成。</p>
            </div>
            <div className="space-y-2">
              {course.modules.map((module, index) => (
                <details key={module.id} className="group overflow-hidden rounded-[22px] border border-white/10 bg-black/20 open:border-amber/40 open:bg-amber/10">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber">Module {index + 1}</div>
                      <div className="mt-1 truncate text-sm font-black">{module.title}</div>
                    </div>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-lg transition group-open:rotate-45">+</span>
                  </summary>
                  <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-3">
                    <p className="text-sm leading-6 text-ash">{module.question}</p>
                    <div className="space-y-2">
                      {module.lessons.map((lesson) => (
                        <div key={lesson} className="rounded-[16px] bg-white/[.045] px-3 py-2 text-xs leading-5 text-ink">
                          {lesson}
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] leading-5 text-smoke">交付物：{module.deliverables.join(" / ")}</div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4 border-amber/45 bg-[radial-gradient(circle_at_top_right,rgba(246,199,87,.22),transparent_40%),rgba(246,199,87,.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-amber">课程开通</div>
            <h2 className="mt-2 text-2xl font-black">立即解锁完整课程</h2>
          </div>
          <div className="text-right">
            <div className="text-xs text-smoke">原型模拟价</div>
            <div className="mt-1 text-4xl font-black text-amber">¥49</div>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
          <div className="text-xs text-smoke">本次为产品原型模拟支付</div>
          <div className="mt-2 text-sm leading-6 text-ash">开通后立即进入课程学习，并在课程中使用专家 Agent 结合当前题目答疑。</div>
        </div>
        <button onClick={onPay} className="w-full rounded-full bg-amber px-5 py-4 text-base font-black text-black transition hover:brightness-110 active:scale-[.98]">
          模拟支付并进入适配评估
        </button>
      </Card>
    </section>
  );
}

function BenefitIcon({ type }: { type: "knowledge" | "certificate" | "event" | "mentor" }) {
  if (type === "knowledge") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 5.5C5 4.7 5.7 4 6.5 4H18v15H6.5C5.7 19 5 18.3 5 17.5v-12Z" stroke="currentColor" strokeWidth="2" />
        <path d="M8 8h7M8 11h6M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "certificate") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 4h12v9.5c0 3.3-2.7 5.5-6 6.5-3.3-1-6-3.2-6-6.5V4Z" stroke="currentColor" strokeWidth="2" />
        <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "event") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 4v3M17 4v3M5 8h14M6 6h12c.6 0 1 .4 1 1v11c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 12h3M8 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M3 20c.7-3 2.5-5 5-5s4.3 2 5 5M13 18.5c.8-1.5 2-2.5 3.5-2.5 2 0 3.4 1.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}


function FitSurveyPage({ answers, profile, primaryNeed, onAnswer, onNext }: { answers: Answers; profile: NeedProfile; primaryNeed: NeedKey; onAnswer: (id: string, value: string) => void; onNext: () => void }) {
  const done = fitSurveyComplete(answers);
  return (
    <section className="space-y-4">
      <HeroCard title="先洞察你需要哪种服务介入" body="这里不问项目细节，只通过低敏问题洞察你当前更需要认知打开、方法学习、交流求解还是实战参与。" />
      {done ? (
        <Card className="border-amber/35 bg-amber/10">
          <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">当前主需求</div>
          <h2 className="mt-2 text-2xl font-black">{needLabels[primaryNeed].title}</h2>
          <p className="mt-2 text-sm leading-6 text-ash">{needLabels[primaryNeed].desc}</p>
          <div className="mt-4"><NeedProfilePie profile={profile} /></div>
        </Card>
      ) : (
        <Card className="border-white/10 bg-white/[.055]">
          <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Low-sensitive Survey</div>
          <h2 className="mt-2 text-2xl font-black">完成 6 个问题后生成需求洞察结果</h2>
          <p className="mt-2 text-sm leading-6 text-ash">洞察完成前不展示画像，避免用户被中途结果引导。完成后会在首页「我的」中保留结果。</p>
        </Card>
      )}
      {fitSurveyQuestions.map((question, index) => (
        <Card key={question.id}>
          <div className="text-xs font-bold uppercase tracking-[.22em] text-plum">Question {index + 1}/{fitSurveyQuestions.length}</div>
          <h3 className="mt-3 text-xl font-semibold leading-8">{question.question}</h3>
          <div className="mt-5 space-y-3">
            {question.options.map((option) => (
              <button key={option.id} onClick={() => onAnswer(question.id, option.id)} className={cx("w-full rounded-[22px] border p-4 text-left text-sm leading-6 transition", answers[question.id] === option.id ? "border-amber bg-amber/15 text-white" : "border-white/10 bg-black/25 text-ash hover:border-white/25")}>{option.text}</button>
            ))}
          </div>
        </Card>
      ))}
      <PrimaryButton disabled={!done} onClick={onNext}>生成我的适配课程</PrimaryButton>
    </section>
  );
}

function NeedProfileChart({ profile }: { profile: NeedProfile }) {
  return (
    <div className="space-y-3">
      {needOrder.map((need) => (
        <div key={need}>
          <div className="flex justify-between text-xs">
            <span className="text-ash">{needLabels[need].title}</span>
            <span className="font-bold text-white">{profile[need]}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <div className={cx("h-full rounded-full", needLabels[need].color)} style={{ width: `${profile[need]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}


function NeedProfilePie({ profile }: { profile: NeedProfile }) {
  const a = profile.cognitive_opening;
  const b = a + profile.method_learning;
  const c = b + profile.conversation_solving;
  const pie = `conic-gradient(#f6c757 0% ${a}%, #7c4dff ${a}% ${b}%, #b6e388 ${b}% ${c}%, #ffffff ${c}% 100%)`;
  return (
    <div className="grid grid-cols-[132px_1fr] items-center gap-4">
      <div className="relative h-32 w-32 rounded-full border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,.35)]" style={{ background: pie }}>
        <div className="absolute inset-5 grid place-items-center rounded-full bg-void text-center">
          <div className="text-[10px] text-smoke">主需求</div>
          <div className="mt-1 text-xs font-black text-amber">{needLabels[primaryNeedFromProfile(profile)].short}</div>
        </div>
      </div>
      <div className="space-y-2">
        {needOrder.map((need) => (
          <div key={need} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-ash"><i className={cx("h-2.5 w-2.5 rounded-full", needLabels[need].color)} />{needLabels[need].title}</span>
            <span className="font-black text-white">{profile[need]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}


const hoffmanAgentAvatar = "https://res.cloudinary.com/startup-grind/image/upload/c_fill,dpr_2,f_auto,g_face,h_400,q_auto:good,w_400/v1/gcs/platform-data-startupgrind/events/Steven%2520Hoffman_Profile%25202.jpg";

const squareServices = [
  {
    id: "hoffman_course",
    type: "course",
    title: "《让大象飞》多模态课程",
    subtitle: "基于你的需求画像生成课程版本",
    image: "https://www.foundersspace.com/wp-content/uploads/2021/02/Make-Elephants-Fly-shadow-565x765.jpg",
    tag: "专家课程",
    meta: "20 分钟 · 6 章 · 完成证书",
    status: "可立即开通",
    cta: "进入课程",
    needFit: { cognitive_opening: 45, method_learning: 95, conversation_solving: 35, practice_participation: 45 }
  },
  {
    id: "hoffman_salon",
    type: "event",
    title: "霍夫曼线下座谈会",
    subtitle: "AI 创业者如何识别真正的机会？",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80",
    tag: "线下座谈",
    meta: "2026.07.12 · 上海 · 19:30",
    status: "报名中 · 余 38 席",
    cta: "查看详情",
    needFit: { cognitive_opening: 88, method_learning: 42, conversation_solving: 72, practice_participation: 35 }
  },
  {
    id: "hoffman_agent",
    type: "agent",
    title: "Hoffman 专家 Agent",
    subtitle: "随时追问项目机会、MVP、用户验证和融资叙事",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80",
    tag: "专家 Agent",
    meta: "机会判断 / 项目卡点 / 用户访谈 / MVP 验证",
    status: "限时优惠 ¥29",
    cta: "开通 Agent",
    needFit: { cognitive_opening: 38, method_learning: 68, conversation_solving: 96, practice_participation: 52 }
  },
  {
    id: "ai_founder_night",
    type: "event",
    title: "AI Founder Night",
    subtitle: "从 Demo 到真实付费：早期 AI 产品的第一批客户",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
    tag: "闭门活动",
    meta: "2026.07.20 · 北京 · 18:30",
    status: "候补登记",
    cta: "预约席位",
    needFit: { cognitive_opening: 70, method_learning: 45, conversation_solving: 76, practice_participation: 48 }
  },
  {
    id: "mvp_workshop",
    type: "event",
    title: "7 天 MVP 验证工作坊",
    subtitle: "把一个 AI 想法压缩成可验证任务",
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=900&q=80",
    tag: "工作坊",
    meta: "2026.08.03 · 深圳 · 10:00",
    status: "报名中 · 小班 24 人",
    cta: "加入工作坊",
    needFit: { cognitive_opening: 30, method_learning: 78, conversation_solving: 45, practice_participation: 94 }
  },
  {
    id: "venture_roundtable",
    type: "event",
    title: "创新机会圆桌",
    subtitle: "大模型应用创业的窗口期与避坑清单",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=900&q=80",
    tag: "小型圆桌",
    meta: "2026.08.16 · 杭州 · 14:00",
    status: "审核制报名",
    cta: "提交申请",
    needFit: { cognitive_opening: 82, method_learning: 52, conversation_solving: 82, practice_participation: 42 }
  },
  {
    id: "book_launch",
    type: "book",
    title: "霍夫曼新书《让大象飞》发布",
    subtitle: "购买同步开通知识框架总结、语音版生成、书籍 Agent",
    image: "https://www.foundersspace.com/wp-content/uploads/2021/02/Make-Elephants-Fly-shadow-565x765.jpg",
    tag: "新书发布",
    meta: "亮点：机会识别 · 团队启动 · 用户验证 · 高速迭代",
    status: "购书权益包已开放",
    cta: "查看新书权益",
    needFit: { cognitive_opening: 92, method_learning: 62, conversation_solving: 38, practice_participation: 28 }
  }
] as const;

function SquarePage({ profile, primaryNeed, expert, onOpenCourse, onOpenAgent }: { profile: NeedProfile; primaryNeed: NeedKey; expert: Expert; onOpenCourse: () => void; onOpenAgent: () => void }) {
  const rankedServices = [...squareServices].sort((a, b) => serviceScore(b.needFit, profile) - serviceScore(a.needFit, profile));
  return (
    <section className="space-y-4 pt-6">
      <div className="space-y-4">
        {rankedServices.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            rank={index + 1}
            expert={expert}
            onClick={() => {
              if (service.type === "course") onOpenCourse();
              if (service.type === "agent") onOpenAgent();
            }}
          />
        ))}
      </div>
    </section>
  );
}

function serviceScore(fit: Record<NeedKey, number>, profile: NeedProfile) {
  return needOrder.reduce((sum, need) => sum + fit[need] * profile[need], 0);
}

function ServiceCard({ service, rank, expert, onClick }: { service: (typeof squareServices)[number]; rank: number; expert: Expert; onClick: () => void }) {
  const actionable = service.type === "course" || service.type === "agent";
  if (service.type === "course") {
    return (
      <button type="button" onClick={onClick} className="block w-full rounded-[32px] border border-amber/45 bg-amber/10 p-5 text-left transition hover:bg-amber/15 active:scale-[.985]">
        <div className="text-xs font-bold uppercase tracking-[.28em] text-amber">Book-based Course</div>
        <h3 className="mt-4 text-3xl font-black leading-tight text-white">让大象飞：AI 创业基础模块</h3>
        <p className="mt-4 text-base leading-8 text-ash">用一套移动端任务流，理解霍夫曼关于机会识别、MVP、用户洞察与高速迭代的核心方法。</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat value="6" label="书籍章节" />
          <Stat value="4" label="适配版本" />
          <Stat value="1" label="完成证书" />
        </div>
        <div className="mt-6 h-14 w-full rounded-full bg-white text-center text-base font-black leading-[56px] text-black">查看课程介绍</div>
      </button>
    );
  }
  const theme = serviceCardTheme(service.type, rank);
  const image = service.type === "agent" ? service.image : service.image;
  return (
    <button
      type="button"
      onClick={actionable ? onClick : undefined}
      className={cx(
        "group relative block min-h-[184px] w-full overflow-hidden rounded-[30px] border p-0 text-left shadow-[0_18px_48px_rgba(0,0,0,.32)] transition duration-200",
        actionable ? "active:scale-[.985]" : "cursor-default",
        rank === 1 ? "border-amber/50" : "border-white/10"
      )}
    >
      <div className={cx("absolute inset-0", theme.bg)} />
      <img src={image} alt={service.title} className={cx("absolute object-cover opacity-75 mix-blend-screen transition duration-500 group-hover:scale-105", theme.imageClass)} referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,.26),transparent_25%),linear-gradient(135deg,rgba(0,0,0,.2),rgba(0,0,0,.58))]" />
      <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full border border-white/15 bg-white/10 blur-[1px]" />
      <div className="absolute bottom-4 right-5 h-24 w-24 rounded-[28px] border border-white/15 bg-white/10 rotate-12" />
      {service.type === "agent" && (
        <div className="absolute right-5 top-14 z-10 h-16 w-16 overflow-hidden rounded-full border-2 border-white/70 bg-black shadow-[0_12px_32px_rgba(0,0,0,.35)]">
          <img src={hoffmanAgentAvatar} alt="Hoffman avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        </div>
      )}

      <div className="relative z-10 flex min-h-[184px] flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="mt-2 max-w-[260px] text-3xl font-black leading-[1.03] tracking-tight text-white">{service.title}</h3>
          </div>
          <span className={cx("shrink-0 rounded-full px-3 py-1 text-xs font-black", theme.badge)}>
            {service.tag}
          </span>
        </div>

        <div>
          <p className="max-w-[280px] text-sm font-semibold leading-5 text-white/86">{service.subtitle}</p>
          {service.type === "book" && (
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              {["知识框架", "语音版", "书籍Agent"].map((item) => <div key={item} className="rounded-full bg-black/25 px-2 py-1 text-[10px] font-bold text-white/82">{item}</div>)}
            </div>
          )}
          {service.type === "agent" && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["项目机会", "MVP", "用户访谈", "融资叙事"].map((item) => <span key={item} className="rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/82">{item}</span>)}
            </div>
          )}
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs leading-5 text-white/72">{service.meta}</div>
              <div className="mt-1 text-sm font-black text-white">{service.status}</div>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-xs font-black text-black shadow-[0_10px_28px_rgba(255,255,255,.16)]">
              {service.cta}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function serviceCardTheme(type: string, rank: number) {
  if (type === "course") {
    return {
      bg: "bg-[linear-gradient(135deg,#101010,#2b2410_52%,#f6c757)]",
      badge: "bg-amber text-black",
      imageClass: "right-3 top-4 h-32 w-24 rounded-[18px]"
    };
  }
  if (type === "agent") {
    return {
      bg: "bg-[linear-gradient(135deg,#151024,#37227a_55%,#7c4dff)]",
      badge: "bg-white text-black",
      imageClass: "right-4 top-5 h-28 w-28 rounded-full"
    };
  }
  if (type === "book") {
    return {
      bg: "bg-[linear-gradient(135deg,#151515,#4b1d24_52%,#ffb3c1)]",
      badge: "bg-white text-black",
      imageClass: "right-5 top-5 h-32 w-24 rounded-[18px]"
    };
  }
  if (rank % 3 === 0) {
    return {
      bg: "bg-[linear-gradient(135deg,#10211b,#1c5c4a_52%,#b6e388)]",
      badge: "bg-lichen text-black",
      imageClass: "right-0 top-0 h-full w-44 rounded-l-[40px]"
    };
  }
  return {
    bg: "bg-[linear-gradient(135deg,#111827,#184e77_54%,#6dd5ed)]",
    badge: "bg-amber text-black",
    imageClass: "right-0 top-0 h-full w-48 rounded-l-[42px]"
  };
}

function MainToolbar({ step, onGo }: { step: AppStep; onGo: (step: AppStep) => void }) {
  const show = step === "square" || step === "experts" || step === "my";
  if (!show) return null;
  const items: Array<[AppStep, string]> = [["square", "推荐"], ["experts", "专家列表"], ["my", "我的"]];
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-3 border-t border-white/10 bg-void/92 px-4 pb-4 pt-2 backdrop-blur-xl">
      {items.map(([id, label]) => (
        <button key={id} onClick={() => onGo(id)} className={cx("rounded-[20px] px-2 py-2 text-xs font-black transition active:scale-95", step === id ? "bg-amber text-black" : "text-smoke hover:bg-white/[.055] hover:text-white")}>{label}</button>
      ))}
    </nav>
  );
}

function AudioPlayerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/75 px-4 pb-5 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-[34px] border border-amber/30 bg-[#111113] p-5 shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Audio Blog</div>
            <h2 className="mt-2 text-2xl font-black">让大象飞起来的创新真相</h2>
            <p className="mt-2 text-sm leading-6 text-ash">以博客访谈语音方式快速进入整本书的创新创业语境。</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-ash">×</button>
        </div>
        <audio className="mt-5 w-full" controls autoPlay src={mediaUrl("audios/让大象飞起来的创新真相.m4a")}>当前浏览器不支持音频播放。</audio>
      </div>
    </div>
  );
}

function BookAccessCard({ onOpenAudio }: { onOpenAudio: () => void }) {
  return (
    <div className="space-y-3">
      <a href="https://www.foundersspace.com/make-elephants-fly/" target="_blank" rel="noreferrer" className="group relative block min-h-[188px] overflow-hidden rounded-[30px] border border-white/10 text-left shadow-[0_18px_48px_rgba(0,0,0,.32)] transition active:scale-[.985]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#151515,#4b1d24_52%,#ffb3c1)]" />
        <img src="https://www.foundersspace.com/wp-content/uploads/2021/02/Make-Elephants-Fly-shadow-565x765.jpg" alt="让大象飞" className="absolute right-5 top-5 h-32 w-24 rounded-[18px] object-cover opacity-85 mix-blend-screen transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,.26),transparent_25%),linear-gradient(135deg,rgba(0,0,0,.18),rgba(0,0,0,.58))]" />
        <div className="relative z-10 flex min-h-[188px] flex-col justify-between p-5">
          <div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">阅读书籍</span>
            <h3 className="mt-4 max-w-[260px] text-3xl font-black leading-[1.05] tracking-tight text-white">阅读《让大象飞》</h3>
            <p className="mt-3 max-w-[260px] text-sm font-semibold leading-6 text-white/82">霍夫曼把创新创业拆成机会识别、团队启动、产品验证、用户市场和高速迭代的完整路径。</p>
          </div>
          <div className="text-xs font-black text-white/82">点击卡片跳转书籍原文</div>
        </div>
      </a>
      <button onClick={onOpenAudio} className="h-12 w-full rounded-full border border-amber/40 bg-amber/10 text-sm font-black text-amber transition hover:bg-amber/20 active:scale-[.98]">语音阅读</button>
    </div>
  );
}


function FitResultModal({ open, profile, primaryNeed, onClose }: { open: boolean; profile: NeedProfile; primaryNeed: NeedKey; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 px-4 pb-5 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-[34px] border border-amber/30 bg-[#111113] p-5 shadow-glow">
        <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Insight Complete</div>
        <h2 className="mt-2 text-3xl font-black">用户需求洞察完成</h2>
        <p className="mt-2 text-sm leading-6 text-ash">你的当前主需求是「{needLabels[primaryNeed].title}」。后续专家课程会据此调整案例、问题和互动形式。</p>
        <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[.055] p-4">
          <NeedProfilePie profile={profile} />
        </div>
        <Card className="mt-4 p-4">
          <h3 className="text-lg font-black">当前课程适配方式</h3>
          <p className="mt-2 text-sm leading-7 text-ash">{courseVariants[primaryNeed].description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {courseVariants[primaryNeed].interactionMix.map((item) => <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-smoke">{item}</span>)}
          </div>
        </Card>
        <button onClick={onClose} className="mt-5 h-14 w-full rounded-full bg-amber text-base font-black text-black transition hover:brightness-110 active:scale-[.98]">进入专家列表</button>
      </div>
    </div>
  );
}

function MyPage({ profile, primaryNeed, onRestart }: { profile: NeedProfile; primaryNeed: NeedKey; onRestart: () => void }) {
  return (
    <section className="space-y-4">
      <Card className="border-amber/35 bg-amber/10">
        <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">My Thinker</div>
        <h2 className="mt-2 text-3xl font-black">我的适配结果</h2>
        <p className="mt-2 text-sm leading-6 text-ash">当前主需求是「{needLabels[primaryNeed].title}」。这个结果会影响课程案例、问题形式和后续服务推荐。</p>
      </Card>
      <Card>
        <NeedProfilePie profile={profile} />
      </Card>
      <Card>
        <h3 className="text-xl font-black">当前课程适配方式</h3>
        <p className="mt-2 text-sm leading-7 text-ash">{courseVariants[primaryNeed].description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {courseVariants[primaryNeed].interactionMix.map((item) => <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-smoke">{item}</span>)}
        </div>
      </Card>
      <button onClick={onRestart} className="h-14 w-full rounded-full border border-amber/40 bg-amber/10 text-base font-black text-amber transition hover:bg-amber/20 active:scale-[.98]">重新洞察</button>
    </section>
  );
}

function BookFrameworkPanel() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Book Breakdown</div>
        <h3 className="mt-2 text-2xl font-black">《{bookBreakdown.title}》拆解后的信息框架</h3>
        <p className="mt-2 text-sm leading-6 text-ash">{bookBreakdown.summary}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat value="6" label="主体章节" />
        <Stat value="30" label="观点卡" />
        <Stat value="5" label="校验项" />
      </div>
      <div className="space-y-3">
        {bookBreakdown.chapters.map((chapter, index) => (
          <details key={chapter.id} defaultOpen className="group overflow-hidden rounded-[24px] border border-white/10 bg-black/20 open:border-amber/40 open:bg-amber/10">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber">Chapter {index + 1}</div>
                <div className="mt-1 text-sm font-black leading-6">{chapter.title}</div>
              </div>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-lg transition group-open:rotate-45">+</span>
            </summary>
            <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-3">
              <p className="text-sm leading-6 text-ash">中心论点：{chapter.centralClaim}</p>
              <div className="flex flex-wrap gap-2">
                {chapter.contentTypes.map((type) => <span key={type} className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-smoke">{type}</span>)}
              </div>
              <div className="space-y-2">
                {chapter.insights.map((insight) => <div key={insight} className="rounded-[16px] bg-white/[.055] px-3 py-2 text-xs leading-5 text-ash">观点卡：{insight}</div>)}
              </div>
            </div>
          </details>
        ))}
      </div>
      <Card className="border-lichen/30 bg-lichen/10 p-4">
        <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Quality Gate</div>
        <h4 className="mt-2 text-xl font-black">拆解校验结果报告</h4>
        <div className="mt-4 space-y-3">
          {qualityChecks.map((check) => (
            <div key={check.label} className="rounded-[20px] border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold">{check.label}</div>
                <span className={cx("rounded-full px-3 py-1 text-[10px] font-black", check.status === "pass" ? "bg-lichen text-black" : "bg-amber text-black")}>{check.status.toUpperCase()} · {check.value}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-ash">{check.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FitResultPanel({ profile, primaryNeed }: { profile: NeedProfile; primaryNeed: NeedKey }) {
  return (
    <div className="space-y-4">
      <Card className="border-amber/35 bg-amber/10 p-4">
        <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Need Profile</div>
        <h3 className="mt-2 text-2xl font-black">你的当前适配结果：{needLabels[primaryNeed].title}</h3>
        <p className="mt-2 text-sm leading-6 text-ash">{needLabels[primaryNeed].desc}</p>
      </Card>
      <NeedProfilePie profile={profile} />
      <div className="grid grid-cols-2 gap-3">
        <Stat value={`${profile[primaryNeed]}%`} label="主需求权重" />
        <Stat value="0.76" label="识别置信度" />
      </div>
      <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 text-sm leading-7 text-ash">系统会基于这个画像调整案例、问题文案、互动形式和后续推荐。注意：这不是人格分类，而是你当前最需要哪种服务介入的权重画像。</div>
    </div>
  );
}

function AdaptiveCoursePanel({ course, variant, primaryNeed, onOpenAudio }: { course: Course; variant: (typeof courseVariants)[NeedKey]; primaryNeed: NeedKey; onOpenAudio: () => void }) {
  return (
    <div className="space-y-4">
      <Card className="border-plum/35 bg-plum/10 p-4">
        <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Adaptive Path</div>
        <h3 className="mt-2 text-2xl font-black">{variant.title}</h3>
        <p className="mt-2 text-sm leading-6 text-ash">{needLabels[primaryNeed].desc} {variant.emphasis}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {variant.interactionMix.map((item) => <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-smoke">{item}</span>)}
        </div>
      </Card>
      <div className="space-y-3">
        {course.modules.map((module, index) => (
          <div key={module.id} className="rounded-[26px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-amber text-sm font-black text-black">M{index + 1}</span>
              <div className="min-w-0">
                <h4 className="text-base font-black leading-6">{module.title}</h4>
                <p className="mt-1 text-xs leading-5 text-smoke">{module.question}</p>
              </div>
            </div>
            <div className="mt-3 rounded-[18px] border border-plum/30 bg-plum/10 px-3 py-2 text-xs leading-5 text-ash">你的版本：{variant.moduleModes[index]}</div>
            <div className="mt-3 rounded-[16px] border border-amber/20 bg-amber/10 px-3 py-2 text-[11px] leading-5 text-amber">预期产出：{module.deliverables.join(" / ")}</div>
          </div>
        ))}
      </div>
      <BookAccessCard onOpenAudio={onOpenAudio} />
    </div>
  );
}

function StepHeader({ step, agentSlot }: { step: AppStep; agentSlot?: ReactNode }) {
  return (
    <section className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[.26em] text-amber">{stepMeta[step].eyebrow}</div>
          <h1 className="mt-2 text-3xl font-black leading-tight">{stepMeta[step].title}</h1>
        </div>
        {agentSlot}
      </div>
    </section>
  );
}

function ExpertList({ onOpen, onMy }: { onOpen: (id: string) => void; onMy: () => void }) {
  return (
    <section className="space-y-8 pt-6">
      <div className="px-2">
        <div className="text-[11px] uppercase tracking-[.24em] text-amber">Thinker Expert</div>
        <h1 className="mt-2 text-3xl font-black">专家列表</h1>
      </div>
      {experts.map((expert) => (
        <button
          key={expert.id}
          onClick={() => onOpen(expert.id)}
          className="group w-full rounded-[30px] p-2 text-left transition duration-200 hover:bg-white/[.045] active:scale-[.985] active:bg-white/[.075]"
        >
          <div className="grid grid-cols-[136px_1fr] items-center gap-6">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full bg-white/10 transition duration-200 group-hover:ring-2 group-hover:ring-white/20">
              <img src={expert.avatarUrl} alt={`${expert.name} 头像`} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold leading-tight transition group-hover:text-amber">{expert.name}</h2>
              </div>
              <p className="mt-3 text-lg leading-8 text-ash">{expert.title}</p>
              <p className="mt-4 line-clamp-1 text-base leading-7 text-[#b9c3ff]">
                作品 {expert.books.map((book) => `《${book.title}》`).join(" ")}
              </p>
            </div>
          </div>
        </button>
      ))}
    </section>
  );
}

function ExpertHomePage({ expert, agentUnlocked, onOpenAgent, onStartCourse }: { expert: Expert; agentUnlocked: boolean; onOpenAgent: () => void; onStartCourse: () => void }) {
  const [activeTab, setActiveTab] = useState<"books" | "articles" | "courses">("books");
  return (
    <section className="-mx-5 space-y-8 bg-[#181818] px-5 pb-28 pt-8">
      <section className="flex gap-5">
        <img src={expert.avatarUrl} alt={`${expert.name} 头像`} className="h-24 w-24 rounded-full object-cover" referrerPolicy="no-referrer" />
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-semibold">{expert.name}</h2>
          <p className="mt-2 text-base leading-7 text-ash">{expert.title}</p>
          <p className="mt-3 text-sm leading-6 text-smoke">{expert.bio}</p>
        </div>
      </section>

      <button onClick={onOpenAgent} className="w-full rounded-[28px] border border-plum bg-plum/20 p-5 text-left transition hover:bg-plum/25 active:scale-[.99]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Expert Agent</div>
            <h3 className="mt-2 text-xl font-semibold">Hoffman 专家 Agent</h3>
            <p className="mt-2 text-sm leading-7 text-ash">{expert.agentIntro}</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xl text-white">›</span>
        </div>
      </button>

      <Card className="space-y-5 bg-white/[.045]">
        <div className="grid grid-cols-3 rounded-full border border-white/10 bg-black/30 p-1">
          {[
            ["books", "TA 的书籍"],
            ["articles", "TA 的文章"],
            ["courses", "专家课程"]
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as "books" | "articles" | "courses")}
              className={cx("h-10 rounded-full text-xs font-black transition active:scale-[.98]", activeTab === id ? "bg-amber text-black shadow-[0_10px_30px_rgba(246,199,87,.25)]" : "text-ash hover:bg-white/[.06] hover:text-white")}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "books" && (
          <section>
            <h3 className="text-2xl font-semibold">TA 的书籍</h3>
            <div className="mt-6 space-y-7">
              {expert.books.map((book) => (
                <div key={book.title} className="grid grid-cols-[88px_1fr] items-center gap-6">
                  <img src={book.coverUrl} alt={`${book.title} 封面`} className="h-32 w-24 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="text-2xl font-semibold">{book.title}</h4>
                    <p className="mt-4 text-lg text-smoke">{book.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "articles" && (
          <section>
            <h3 className="text-2xl font-semibold">TA 的文章</h3>
            <div className="mt-6 space-y-6">
              {expert.articles.map((article) => (
                <div key={article.title} className="grid grid-cols-[92px_1fr] items-center gap-5">
                  <img src={article.coverUrl} alt={`${article.title} 封面`} className="h-24 w-24 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <h4 className="line-clamp-2 text-xl font-semibold leading-7">{article.title}</h4>
                    <p className="mt-2 text-base text-smoke">{article.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "courses" && (
          <section className="space-y-4">
            <div>
              <h3 className="text-2xl font-semibold">专家课程列表</h3>
              <p className="mt-2 text-sm leading-6 text-ash">课程会基于你的用户需求洞察结果，生成不同的学习呈现形式。</p>
            </div>
            <div className="rounded-[28px] border border-amber/40 bg-amber/10 p-5">
              <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Book-based Course</div>
              <h4 className="mt-2 text-xl font-semibold">{demoCourse.title}</h4>
              <p className="mt-2 text-sm leading-7 text-ash">{demoCourse.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat value="6" label="书籍章节" />
                <Stat value="4" label="适配版本" />
                <Stat value="1" label="完成证书" />
              </div>
              <button onClick={onStartCourse} className="mt-4 h-12 w-full rounded-full bg-white text-sm font-bold text-black transition hover:brightness-110 active:scale-[.98]">开始课程</button>
            </div>
          </section>
        )}
      </Card>
    </section>
  );
}

function CoverPage({ expertName, course, variant, primaryNeed, needProfile, onStart, onOpenAudio }: { expertName: string; course: Course; variant: (typeof courseVariants)[NeedKey]; primaryNeed: NeedKey; needProfile: NeedProfile; onStart: () => void; onOpenAudio: () => void }) {
  const [activeTab, setActiveTab] = useState<CoverTab>("course");
  const audioSrc = mediaUrl("audios/让大象飞起来的创新真相.m4a");
  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[.055]">
        <div className="relative aspect-[4/5] bg-black">
          <video className="h-full w-full object-cover opacity-80" src={mediaUrl(course.keyPoints[0].video)} poster={posterUrl(course.keyPoints[0].video)} muted autoPlay loop playsInline />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute bottom-0 p-5">
            <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Adaptive Course</div>
            <h2 className="mt-2 text-4xl font-semibold leading-tight">{course.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ash">{course.description}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          <Stat value={`${course.durationMinutes}m`} label="预计学习" />
          <Stat value={`${course.moduleCount}`} label="书籍章节" />
          <Stat value={needLabels[primaryNeed].short} label="适配类型" />
        </div>
      </div>

      <Card>
        <div className="text-sm text-ash">专家</div>
        <div className="mt-1 text-xl font-semibold">{expertName}</div>
        <p className="mt-2 text-sm leading-6 text-ash">本课程先基于《让大象飞》完成书籍拆解，再根据你的前置评估画像生成对应课程形态。完成后仍进入现有证书、学习画像和下一阶段推荐流程。</p>
      </Card>

      <Card className="space-y-4">
        <div className="grid grid-cols-3 rounded-full border border-white/10 bg-black/30 p-1">
          {[
            ["book", "书籍框架"],
            ["fit", "适配结果"],
            ["course", "我的课程"]
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as CoverTab)}
              className={cx("h-10 rounded-full text-xs font-black transition active:scale-[.98]", activeTab === id ? "bg-amber text-black shadow-[0_10px_30px_rgba(246,199,87,.25)]" : "text-ash hover:bg-white/[.06] hover:text-white")}
            >
              {label}
            </button>
          ))}
        </div>
        {activeTab === "book" && <BookFrameworkPanel />}
        {activeTab === "fit" && <FitResultPanel profile={needProfile} primaryNeed={primaryNeed} />}
        {activeTab === "course" && <AdaptiveCoursePanel course={course} variant={variant} primaryNeed={primaryNeed} onOpenAudio={onOpenAudio} />}
      </Card>

      <PrimaryButton onClick={onStart}>开始我的适配课程</PrimaryButton>
    </section>
  );
}

function OverviewPage({ onNext }: { onNext: () => void }) {
  const steps = ["快速理解", "认知诊断", "核心观点", "互动问答", "开放表达", "获得证书", "进入下一阶段"];
  return (
    <section className="space-y-4">
      <HeroCard title="这不是视频课，而是一次成长分流" body="学员完成专家知识进入后，系统会根据答题、表达和项目意向推荐下一阶段路径。" />
      <div className="space-y-3">
        {steps.map((item, index) => (
          <div key={item} className="flex gap-3 rounded-[24px] border border-white/10 bg-white/[.055] p-4">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-plum text-sm font-bold">{index + 1}</div>
            <div>
              <h3 className="font-semibold">{item}</h3>
              <p className="mt-1 text-sm text-ash">预计 {index < 2 ? 2 : index < 5 ? 3 : 1} 分钟 · 完成后自动进入下一步</p>
            </div>
          </div>
        ))}
      </div>
      <PrimaryButton onClick={onNext}>先看 300 字速看</PrimaryButton>
    </section>
  );
}

function SummaryPage({ course, variant, onNext }: { course: Course; variant: (typeof courseVariants)[NeedKey]; onNext: () => void }) {
  return (
    <section className="space-y-4">
      <Card className="bg-gradient-to-br from-white/[.09] to-plum/20">
        <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">你的适配版本</div>
        <p className="mt-4 text-xl font-semibold leading-9">{variant.title}：{variant.emphasis}</p>
      </Card>
      <Card>
        <p className="whitespace-pre-line text-base leading-8 text-ash">{course.summary300}</p>
      </Card>
      <ModuleMap course={course} variant={variant} />
      <PrimaryButton onClick={onNext}>开始认知诊断</PrimaryButton>
    </section>
  );
}

function ModuleMap({ course, variant }: { course: Course; variant: (typeof courseVariants)[NeedKey] }) {
  return (
    <div className="space-y-3">
      {course.modules.map((mod, index) => (
        <Card key={mod.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold text-amber">M{index + 1}</div>
            <div>
              <h3 className="font-semibold leading-6">{mod.title}</h3>
              <p className="mt-1 text-sm leading-6 text-ash">{mod.question}</p>
              {mod.learningGoal && <p className="mt-2 text-xs leading-5 text-smoke">{mod.learningGoal}</p>}
              <div className="mt-3 rounded-[18px] border border-plum/30 bg-plum/10 px-3 py-2 text-xs leading-5 text-ash">本类型呈现：{variant.moduleModes[index]}</div>
              {Boolean(mod.contentAtoms?.length && mod.interactionBlocks?.length) && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-smoke">
                  <div className="rounded-[14px] border border-white/10 bg-black/20 px-3 py-2">原子卡 {mod.contentAtoms.length}</div>
                  <div className="rounded-[14px] border border-white/10 bg-black/20 px-3 py-2">互动块 {mod.interactionBlocks.length}</div>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {mod.deliverables.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-smoke">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function KeyPointCard({ point, index, total, variant, onNext }: { point: KeyPoint; index: number; total: number; variant: (typeof courseVariants)[NeedKey]; onNext: () => void }) {
  return (
    <section className="space-y-4">
      <ProgressPill current={index + 1} total={total} label="观点" />
      <Card className="overflow-hidden p-0">
        {point.video && <TaskVideo src={point.video} />}
        <div className="p-5">
          <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">观点 {String(index + 1).padStart(2, "0")}</div>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">{point.title}</h2>
          <p className="mt-4 text-xl leading-8 text-white">{point.oneSentence}</p>
          <p className="mt-4 text-sm leading-7 text-ash">{point.explanation}</p>
          <div className="mt-5 rounded-[22px] border border-white/10 bg-black/25 p-4 text-sm leading-6 text-smoke">案例：{point.example}</div>
          <div className="mt-3 rounded-[22px] border border-amber/25 bg-amber/10 p-4 text-sm leading-6 text-amber">适配任务：{variant.interactionMix[index % variant.interactionMix.length]}</div>
        </div>
      </Card>
      <EvidenceFootnotes title="观点来源" spans={point.evidenceSpans} baseId={`${point.id}-card`} compact />
      <PrimaryButton onClick={onNext}>进入互动问题</PrimaryButton>
    </section>
  );
}

function TaskVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (manualMode && !video.paused && !ended) {
      video.pause();
      setPlaying(false);
      return;
    }
    if (!manualMode || ended) {
      video.pause();
      video.currentTime = 0;
      video.loop = false;
      video.muted = false;
      video.volume = 1;
      setManualMode(true);
      setEnded(false);
    }
    void video.play();
    setPlaying(true);
  }

  return (
    <button type="button" onClick={togglePlay} className="relative block aspect-video w-full overflow-hidden bg-black text-left">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={mediaUrl(src)}
        poster={posterUrl(src)}
        muted={!manualMode}
        autoPlay={!manualMode}
        loop={!manualMode}
        playsInline
        onEnded={() => {
          const video = videoRef.current;
          if (video) {
            video.loop = false;
            video.pause();
          }
          setEnded(true);
          setPlaying(false);
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-4 right-4 rounded-full bg-white px-4 py-2 text-xs font-bold text-black">
        {playing ? "点击暂停" : ended ? "重新播放" : "点击播放"}
      </div>
    </button>
  );
}


function getCorrectOption(question: Question) {
  if (!question.options?.length) return undefined;
  if (typeof question.correctIndex === "number") return question.options[question.correctIndex];
  if (question.correctAnswer === "true" || question.correctAnswer === "false") {
    return question.options.find((item) => item.id === question.correctAnswer || item.text === question.correctAnswer);
  }
  return question.options.reduce((best, option) => ((option.score || 0) > (best.score || 0) ? option : best), question.options[0]);
}

function isCorrectAnswer(question: Question, answer: string | string[] | undefined) {
  const values = asAnswerArray(answer);
  if (!values.length) return false;
  if (question.type === "multiple") {
    if (typeof question.correctIndex === "number" && question.options?.length) {
      const correct = question.options[question.correctIndex];
      if (!correct) return false;
      return values.includes(correct.id) || values.includes(correct.text);
    }
    return false;
  }
  if (question.correctAnswer === "true" || question.correctAnswer === "false") {
    return values.some((item) => item.toLowerCase() === question.correctAnswer);
  }
  if (typeof question.correctIndex === "number" && question.options?.length) {
    const correct = question.options[question.correctIndex];
    if (!correct) return false;
    return values.some((item) => item === correct.id || item === correct.text);
  }
  return false;
}

function QuestionMediaHint({ question }: { question: Question }) {
  if (!question.media?.prompt) return null;
  return (
    <div className="mt-4 rounded-[18px] border border-amber/25 bg-amber/10 px-4 py-3 text-xs leading-5 text-amber">
      {question.media.type === "video" ? "视频判断" : "任务材料"}：{question.media.prompt}
    </div>
  );
}

function QuestionInput({ question, answer, onAnswer, compact }: { question: Question; answer: string | string[] | undefined; onAnswer: (id: string, value: string | string[]) => void; compact?: boolean }) {
  const options = truthyQuestionOptions(question);

  if (question.type === "open" || question.type === "text") {
    return (
      <textarea
        className="mt-5 min-h-32 w-full resize-none rounded-[22px] border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white outline-none placeholder:text-smoke focus:border-plum"
        placeholder="写下你的判断，越具体越好。"
        value={answerText(answer)}
        onChange={(event) => onAnswer(question.id, event.target.value)}
      />
    );
  }

  if (question.type === "multiple") {
    const current = asAnswerArray(answer);
    const isCompact = compact && options.length > 2;
    return (
      <div className={cx("mt-5 space-y-3", isCompact && "grid grid-cols-1") }>
        {options.map((option) => {
          const selected = current.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => {
                const next = selected ? current.filter((item) => item !== option.id) : [...current, option.id];
                onAnswer(question.id, next);
              }}
              className={cx("w-full rounded-[22px] border p-4 text-left text-sm leading-6 transition", selected ? "border-plum bg-plum/20 text-white" : "border-white/10 bg-black/25 text-ash")}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    );
  }

  if (options.length) {
    return (
      <div className="mt-5 space-y-3">
        {options.map((option) => {
          const selected = answer === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onAnswer(question.id, option.id)}
              className={cx("w-full rounded-[22px] border p-4 text-left text-sm leading-6", selected ? "border-plum bg-plum/20 text-white" : "border-white/10 bg-black/25 text-ash")}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <textarea
      className="mt-5 min-h-32 w-full resize-none rounded-[22px] border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white outline-none placeholder:text-smoke focus:border-plum"
      placeholder="写下你的判断，越具体越好。"
      value={answerText(answer)}
      onChange={(event) => onAnswer(question.id, event.target.value)}
    />
  );
}

function EvidenceFootnotes({ title, spans, baseId, compact = false }: { title: string; spans?: EvidenceSpan[]; baseId?: string; compact?: boolean }) {
  const list = spans ?? [];
  const [index, setIndex] = useState(0);
  const [contextOpen, setContextOpen] = useState(false);

  if (!list.length) return null;

  const safeIndex = Math.min(index, list.length - 1);
  const active = list[safeIndex];
  const anchorId = `${baseId || "evidence"}-${safeIndex}`;
  const contextId = `${anchorId}-context`;
  const jumpToContext = () => {
    setContextOpen(true);
    window.setTimeout(() => {
      const target = document.getElementById(active.contextBefore || active.contextAfter || active.contextSummary ? contextId : anchorId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 20);
  };
  const hasContext = Boolean(active.contextBefore || active.contextAfter || active.contextSummary);

  return (
    <Card className={cx("space-y-3", compact && "border-amber/25 bg-black/30") }>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-[.22em] text-plum">{title}</div>
        <button onClick={jumpToContext} className="text-xs font-bold text-ash underline underline-offset-2">{hasContext ? "查看上下文" : "跳转到证据"}</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((span, itemIndex) => (
          <button
            key={`${span.chapterIndex}-${span.paragraphIndex}-${itemIndex}`}
            onClick={() => {
              setIndex(itemIndex);
              setContextOpen(false);
            }}
            className={cx("rounded-full border px-3 py-1 text-[11px]", itemIndex === safeIndex ? "border-plum bg-plum/15 text-white" : "border-white/10 text-ash")}
          >
            证据 {itemIndex + 1}
          </button>
        ))}
      </div>
      <div id={anchorId} className="rounded-[22px] border border-white/10 bg-amber/10 p-4 text-sm leading-7 text-ash">
        <div className="text-xs text-ash">{active.sourceLabel || evidenceTitle(active)}｜来源定位：{active.matchKeyword || "章节主旨"}</div>
        <blockquote className="mt-2 text-ink">{active.quote}</blockquote>
      </div>
      {contextOpen && hasContext && (
        <div id={contextId} className="space-y-3 rounded-[22px] border border-plum/25 bg-plum/10 p-4 text-xs leading-6 text-ash">
          <div className="font-bold text-white">来源上下文</div>
          {active.contextSummary && <p>{active.contextSummary}</p>}
          {active.contextBefore && <p><span className="text-smoke">前文：</span>{active.contextBefore}</p>}
          <p><span className="text-smoke">锚点：</span>{active.quote}</p>
          {active.contextAfter && <p><span className="text-smoke">后文：</span>{active.contextAfter}</p>}
        </div>
      )}
    </Card>
  );
}

function QuestionStep({ question, answer, index, total, onAnswer, onPrev, onNext, nextLabel }: { question: Question; answer: string | string[] | undefined; index: number; total: number; onAnswer: (id: string, value: string | string[]) => void; onPrev: () => void; onNext: () => void; nextLabel: string }) {
  const hasAnswer = isQuestionAnswered(question, answer);
  return (
    <section className="space-y-4">
      <ProgressPill current={index + 1} total={total} />
      <Card>
        <h2 className="text-2xl font-semibold leading-8">{question.question}</h2>
        <QuestionMediaHint question={question} />
        <QuestionInput question={question} answer={answer} onAnswer={onAnswer} />
      </Card>
      <EvidenceFootnotes title="相关证据" spans={question.evidenceSpans} baseId={`${question.id}-question`} />
      <TwoButtons onPrev={onPrev} onNext={onNext} nextLabel={nextLabel} nextDisabled={!hasAnswer} prevDisabled={index === 0} />
    </section>
  );
}

function InteractionPage({ point, index, total, isLast, answer, revealed, onAnswer, onReveal, onNext }: { point: KeyPoint; index: number; total: number; isLast: boolean; answer: string | string[] | undefined; revealed: boolean; onAnswer: (id: string, value: string | string[]) => void; onReveal: () => void; onNext: () => void }) {
  const question = point.revealQuestion;
  const hasAnswer = isQuestionAnswered(question, answer);
  const correctOption = getCorrectOption(question);
  const isCorrect = isCorrectAnswer(question, answer);
  const showHint = revealed && (question.type !== "open" && question.type !== "text");
  return (
    <section className="space-y-4">
      <ProgressPill current={index + 1} total={total} label="互动" />
      <Card>
        <div className="text-xs font-bold uppercase tracking-[.22em] text-plum">先回答，再揭示</div>
        <h2 className="mt-3 text-2xl font-semibold leading-8">{question.question}</h2>
        <QuestionMediaHint question={question} />
        <QuestionInput question={question} answer={answer} onAnswer={onAnswer} compact />
      </Card>
      <EvidenceFootnotes title="互动证据来源" spans={question.evidenceSpans} baseId={`${question.id}-interaction`} />
      {revealed && (
        <div className="space-y-4">
          {showHint && (
            <Card className={cx("border-amber/40", isCorrect ? "bg-lichen/15" : "bg-amber/10")}> 
              <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Answer Check</div>
              <h3 className="mt-2 text-2xl font-black">{isCorrect ? "回答正确" : "需要校准"}</h3>
              {!isCorrect && correctOption && <p className="mt-3 text-sm leading-7 text-ash">标准答案：{correctOption.text}</p>}
            </Card>
          )}
          <Card className="border-amber/40 bg-amber/10">
            <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">{question.revealTitle || "专家揭示"}</div>
            <p className="mt-3 text-base leading-8 text-ink">{question.revealContent}</p>
          </Card>
        </div>
      )}
      {!revealed ? <PrimaryButton disabled={!hasAnswer} onClick={onReveal}>揭示专家观点</PrimaryButton> : <PrimaryButton onClick={onNext}>{isLast ? "进入小题目" : "下一张观点"}</PrimaryButton>}
    </section>
  );
}

function OpenQuestionPage({ course, answers, onAnswer, onNext }: { course: Course; answers: Answers; onAnswer: (id: string, value: string) => void; onNext: () => void }) {
  const requiredDone = answerText(answers.open_view).length > 0;
  return (
    <section className="space-y-4">
      <HeroCard title="把专家观点转成你的表达" body="这些开放题会进入你的学习画像，也会影响下一阶段推荐。" />
      {course.finalOpenQuestions.map((question) => (
        <Card key={question.id}>
          <label className="text-sm font-semibold leading-6">{question.question}</label>
          <textarea
            className="mt-3 min-h-28 w-full resize-none rounded-[22px] border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white outline-none placeholder:text-smoke focus:border-plum"
            placeholder="输入后将记录到你的学习画像"
            value={answerText(answers[question.id])}
            onChange={(event) => onAnswer(question.id, event.target.value)}
          />
        </Card>
      ))}
      <PrimaryButton disabled={!requiredDone} onClick={onNext}>完成学习</PrimaryButton>
    </section>
  );
}

function CompletePage({ completionRate, cardCount, questionCount, profile, recommendations, showMore, onToggleMore, onNext }: { completionRate: number; cardCount: number; questionCount: number; profile: ReturnType<typeof buildProfile>; recommendations: Recommendation[]; showMore: boolean; onToggleMore: () => void; onNext: () => void }) {
  const visibleRecommendations = showMore ? recommendations : recommendations.slice(0, 2);
  return (
    <section className="space-y-4">
      <Card className="bg-gradient-to-br from-lichen/25 to-plum/20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lichen text-3xl font-bold">✓</div>
        <h2 className="mt-5 text-3xl font-semibold">你已完成本模块学习</h2>
        <p className="mt-3 text-sm leading-7 text-ash">系统已经记录你的观点学习、互动问答和开放表达，接下来会生成证书和学习画像。</p>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <Stat value={String(cardCount)} label="核心观点" />
        <Stat value={String(questionCount)} label="互动问题" />
        <Stat value={`${completionRate}%`} label="完成度" />
      </div>
      <Card>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Next Stage</div>
            <h3 className="mt-2 text-xl font-semibold">基于你的学习画像，推荐下一阶段</h3>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-ash">{levelLabel(profile.level)}</span>
        </div>
        <div className="mt-4 space-y-3">
          {visibleRecommendations.map((item) => <RecommendationMiniCard key={item.id} item={item} />)}
        </div>
        {recommendations.length > 2 && (
          <button onClick={onToggleMore} className="mt-4 h-11 w-full rounded-full border border-white/10 bg-white/[.055] text-sm font-semibold text-ash">
            {showMore ? "收起更多推荐" : "显示更多第二阶段卡片"}
          </button>
        )}
      </Card>
      <PrimaryButton onClick={onNext}>生成我的证书</PrimaryButton>
    </section>
  );
}

function CertificatePage({ learnerName, onNext }: { learnerName: string; onNext: () => void }) {
  return (
    <section className="space-y-4">
      <div className="rounded-[34px] border border-amber/40 bg-[#f7f0df] p-5 text-[#241b12]">
        <div className="rounded-[26px] border border-[#b88942]/50 p-5 text-center">
          <div className="text-xs font-bold uppercase tracking-[.24em] text-[#8a642d]">Thinker Certificate</div>
          <h2 className="mt-6 text-3xl font-semibold leading-tight">专家知识基础模块完成奖状</h2>
          <p className="mt-6 text-sm text-[#6f604f]">授予</p>
          <div className="mt-2 text-3xl font-bold">{learnerName}</div>
          <p className="mt-6 text-sm leading-7 text-[#5b4d3e]">恭喜你完成《让大象飞：AI 创业基础模块》。你已完成专家核心观点学习、互动问答和开放表达任务。</p>
          <div className="mt-6 text-xs text-[#8a642d]">No. THK-{new Date().getFullYear()}-{String(Math.abs(learnerName.length * 9281)).padStart(6, "0")}</div>
        </div>
      </div>
      <PrimaryButton onClick={onNext}>查看我的学习画像</PrimaryButton>
    </section>
  );
}

function ProfilePage({ profile, onNext }: { profile: ReturnType<typeof buildProfile>; onNext: () => void }) {
  const rows = [
    ["知识理解度", profile.knowledgeScore],
    ["表达具体度", profile.specificityScore],
    ["逻辑一致性", profile.consistencyScore],
    ["项目意识", profile.projectSignalScore],
    ["专家方向匹配度", profile.expertFitScore]
  ] as const;
  return (
    <section className="space-y-4">
      <Card className="bg-gradient-to-br from-plum/25 to-white/[.06]">
        <div className="text-sm text-ash">综合推荐分</div>
        <div className="mt-2 text-6xl font-semibold">{profile.overallScore}</div>
        <div className="mt-3 rounded-full bg-white/10 px-4 py-2 text-sm text-amber">{levelLabel(profile.level)}</div>
      </Card>
      <Card>
        <div className="space-y-4">
          {rows.map(([label, value]) => <ScoreBar key={label} label={label} value={value} />)}
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold">你的标签</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.tags.slice(0, 8).map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-ash">{tag}</span>)}
        </div>
      </Card>
      <PrimaryButton onClick={onNext}>查看下一阶段推荐</PrimaryButton>
    </section>
  );
}

function RecommendationPage({ recommendations, profileLevel }: { recommendations: ReturnType<typeof pickRecommendations>; profileLevel: string }) {
  return (
    <section className="space-y-4">
      <HeroCard title="学习不是终点，下一阶段才是价值入口" body={`根据你的学习画像，你当前属于「${levelLabel(profileLevel)}」。Thinker 为你推荐以下路径。`} />
      {recommendations.map((item, index) => (
        <Card key={item.id} className={index === 0 ? "border-plum bg-plum/15" : ""}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[.2em] text-amber">推荐 {index + 1}</div>
              <h3 className="mt-2 text-xl font-semibold leading-7">{item.title}</h3>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-ash">{item.requiresApplication ? "需申请" : "可直接进入"}</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-ash">{item.reason}</p>
          <div className="mt-4 rounded-[20px] bg-black/25 p-3 text-xs leading-6 text-smoke">适合人群：{item.suitableFor} · 预计 {item.estimatedTime}</div>
          <button className="mt-4 h-12 w-full rounded-full bg-white text-sm font-bold text-black">{item.ctaText}</button>
        </Card>
      ))}
    </section>
  );
}

function RecommendationMiniCard({ item }: { item: Recommendation }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold leading-6">{item.title}</h4>
        <span className="shrink-0 rounded-full bg-plum/20 px-2 py-1 text-[10px] text-ash">{item.requiresApplication ? "申请制" : "可进入"}</span>
      </div>
      <p className="mt-2 text-xs leading-6 text-ash">{item.reason}</p>
      <button className="mt-3 h-10 w-full rounded-full bg-white text-xs font-bold text-black">{item.ctaText}</button>
    </div>
  );
}

function AgentPayPage({ expert, context, onPay }: { expert: Expert; context: string; onPay: () => void }) {
  return (
    <section className="space-y-5">
      <Card className="bg-gradient-to-br from-plum/25 to-white/[.06]">
        <div className="flex items-center gap-4">
          <img src={expert.avatarUrl} alt={`${expert.name} 头像`} className="h-16 w-16 rounded-full object-cover" referrerPolicy="no-referrer" />
          <div>
            <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Expert Agent</div>
            <h2 className="mt-1 text-2xl font-semibold">{expert.name}</h2>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-ash">{expert.agentIntro}</p>
      </Card>
      <Card>
        <div className="text-xs font-bold uppercase tracking-[.22em] text-plum">当前上下文</div>
        <p className="mt-3 text-base leading-7 text-ink">{context}</p>
      </Card>
      <Card className="border-amber/40 bg-amber/10">
        <div className="text-sm text-ash">模拟开通价</div>
        <div className="mt-2 text-6xl font-semibold">¥29</div>
        <div className="mt-3 text-sm leading-7 text-ash">开通后可以在课程学习中随时向专家 Agent 提问，并自动带上当前题目、观点或作业上下文。</div>
      </Card>
      <PrimaryButton onClick={onPay}>模拟支付并开通</PrimaryButton>
    </section>
  );
}

function AgentChatPage({ expert, context, draft, messages, onDraft, onSend }: { expert: Expert; context: string; draft: string; messages: string[]; onDraft: (value: string) => void; onSend: (context: string) => void }) {
  return (
    <section className="-mx-5 -mb-28 flex min-h-[calc(100vh-4rem)] flex-col px-5 pb-4">
      <div className="rounded-[24px] border border-white/10 bg-white/[.055] p-4">
        <div className="flex items-center gap-3">
          <img src={expert.avatarUrl} alt={`${expert.name} 头像`} className="h-11 w-11 rounded-full object-cover" referrerPolicy="no-referrer" />
          <div>
            <div className="font-semibold">{expert.name}</div>
            <div className="text-xs text-ash">专家 Agent 已在线</div>
          </div>
        </div>
        <div className="mt-3 rounded-[18px] bg-black/25 p-3 text-xs leading-6 text-smoke">当前上下文：{context}</div>
      </div>
      <div className="mt-4 flex-1 space-y-3 overflow-auto pb-4">
        {messages.map((message, index) => {
          const isUser = message.startsWith("你：");
          return (
            <div key={`${message}-${index}`} className={cx("max-w-[86%] rounded-[22px] px-4 py-3 text-sm leading-6", isUser ? "ml-auto bg-plum text-white" : "bg-white/[.07] text-ash")}>
              {!isUser && index === 0 ? <TypewriterText text={message} /> : message}
            </div>
          );
        })}
      </div>
      <div className="sticky bottom-0 rounded-[26px] border border-white/10 bg-void/95 p-3 backdrop-blur-xl">
        <textarea value={draft} onChange={(event) => onDraft(event.target.value)} placeholder="基于当前题目向专家 Agent 提问..." className="min-h-20 w-full resize-none rounded-[20px] border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white outline-none placeholder:text-smoke focus:border-plum" />
        <button onClick={() => onSend(context)} className="mt-2 h-11 w-full rounded-full bg-plum text-sm font-bold text-white">发送问题</button>
      </div>
    </section>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    setVisible(0);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisible(index);
      if (index >= text.length) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
  }, [text]);
  return <>{text.slice(0, visible)}{visible < text.length && <span className="animate-pulse text-amber">▌</span>}</>;
}

function AgentNudge({ step, context, onOpen }: { step: AppStep; context: string; onOpen: (context: string) => void }) {
  const show = ["diagnosis", "cards", "interaction", "quiz", "openQuestion"].includes(step);
  if (!show) return null;
  return (
    <button
      onClick={() => onOpen(context)}
      className="mt-1 shrink-0 rounded-[18px] border border-plum/45 bg-plum/15 px-3 py-2 text-left shadow-[0_14px_34px_rgba(124,77,255,.18)] transition hover:border-amber/60 hover:bg-amber/15 active:scale-95"
    >
      <div className="whitespace-nowrap text-xs font-black text-amber">专家Agent</div>
      <div className="mt-0.5 whitespace-nowrap text-[10px] text-ash">随时解答疑问</div>
    </button>
  );
}

function AgentOverlay({ mode, expert, context, draft, messages, onDraft, onPay, onSend, onClose }: { mode: "none" | "pay" | "chat"; expert: Expert; context: string; draft: string; messages: string[]; onDraft: (value: string) => void; onPay: () => void; onSend: (context: string) => void; onClose: () => void }) {
  if (mode === "none") return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 pb-4 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-[30px] border border-white/10 bg-[#101012] p-5 shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.22em] text-amber">Expert Agent</div>
            <h3 className="mt-2 text-2xl font-semibold">{expert.name}</h3>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-ash">×</button>
        </div>
        {mode === "pay" ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-7 text-ash">开通后，你可以在课程学习中随时基于当前上下文向 Hoffman 专家 Agent 提问，获得机会识别、MVP 和用户验证建议。</p>
            <div className="rounded-[24px] border border-plum/40 bg-plum/15 p-4">
              <div className="text-sm text-ash">模拟价格</div>
              <div className="mt-1 text-4xl font-semibold">¥29</div>
              <div className="mt-2 text-xs text-smoke">原型演示：点击后模拟支付成功</div>
            </div>
            <button onClick={onPay} className="h-12 w-full rounded-full bg-plum text-sm font-bold text-white">模拟支付并开通</button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-[20px] border border-white/10 bg-black/25 p-3 text-xs leading-6 text-smoke">当前上下文：{context}</div>
            <div className="max-h-72 space-y-3 overflow-auto rounded-[24px] border border-white/10 bg-black/25 p-3">
              {messages.map((message, index) => (
                <div key={`${message}-${index}`} className="rounded-[18px] bg-white/[.055] px-3 py-2 text-sm leading-6 text-ash">{message}</div>
              ))}
            </div>
            <textarea value={draft} onChange={(event) => onDraft(event.target.value)} placeholder="例如：我这个 AI 项目现在最应该验证什么？" className="min-h-24 w-full resize-none rounded-[22px] border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white outline-none placeholder:text-smoke focus:border-plum" />
            <button onClick={() => onSend(context)} className="h-12 w-full rounded-full bg-plum text-sm font-bold text-white">向专家 Agent 提问</button>
          </div>
        )}
      </div>
    </div>
  );
}

function BottomNav({ step, onBack }: { step: AppStep; onBack: () => void }) {
  if (step === "square" || step === "experts" || step === "my" || step === "expertHome" || step === "coursePay" || step === "fitSurvey" || step === "agentPay" || step === "agentChat" || step === "cover" || step === "recommendations") return null;
  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-void/90 px-5 py-3 backdrop-blur-xl safe-bottom">
      <button onClick={onBack} className="h-12 w-full rounded-full border border-white/10 bg-white/[.055] text-sm font-semibold text-ash">返回上一步</button>
    </div>
  );
}

function HeroCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="bg-gradient-to-br from-white/[.09] to-plum/20">
      <h2 className="text-2xl font-semibold leading-8">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-ash">{body}</p>
    </Card>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-[28px] border border-white/10 bg-white/[.055] p-5", className)}>{children}</section>;
}

function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} className="h-14 w-full rounded-full bg-plum text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40">{children}</button>;
}

function TwoButtons({ onPrev, onNext, nextLabel, nextDisabled, prevDisabled }: { onPrev: () => void; onNext: () => void; nextLabel: string; nextDisabled?: boolean; prevDisabled?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button disabled={prevDisabled} onClick={onPrev} className="h-12 rounded-full border border-white/10 bg-white/[.055] text-sm font-semibold text-ash disabled:opacity-30">上一题</button>
      <button disabled={nextDisabled} onClick={onNext} className="h-12 rounded-full bg-plum text-sm font-bold text-white disabled:opacity-40">{nextLabel}</button>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[.055] p-3 text-center">
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-[11px] text-smoke">{label}</div>
    </div>
  );
}

function ProgressPill({ current, total, label = "题目" }: { current: number; total: number; label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[.055] px-4 py-2 text-sm text-ash">
      <span>{label} {current}/{total}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-amber" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-ash">{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-plum" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function levelLabel(level: string) {
  const map: Record<string, string> = {
    high_potential: "高潜学员",
    advanced: "进阶学员",
    exploratory: "探索学员",
    basic: "基础学员"
  };
  return map[level] || level;
}
