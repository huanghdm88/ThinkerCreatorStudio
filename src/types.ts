export type AppStep =
  | "square"
  | "experts"
  | "my"
  | "expertHome"
  | "coursePay"
  | "fitSurvey"
  | "agentPay"
  | "agentChat"
  | "cover"
  | "overview"
  | "summary"
  | "diagnosis"
  | "cards"
  | "interaction"
  | "quiz"
  | "openQuestion"
  | "complete"
  | "certificate"
  | "profile"
  | "recommendations";

export type QuestionType = "single" | "multiple" | "choice" | "text" | "open" | "stance" | "truefalse" | "video_choice";
export type InteractionType = "choice" | "truefalse" | "open" | "video_choice";
export type ContentType = "core_claim" | "mechanism" | "scenario_judgement" | "risk_tradeoff" | "application_task";
export type NeedFit = Record<"cognitive_opening" | "method_learning" | "conversation_solving" | "practice_participation", number>;

export type EvidenceSpan = {
  chapterIndex: number;
  paragraphIndex: number;
  paragraphIndexEnd: number;
  quote: string;
  matchKeyword?: string;
  anchorStatus?: string;
  sourceHeading?: string;
  sourceLabel?: string;
  contextBefore?: string;
  contextAfter?: string;
  contextSummary?: string;
};

export type Option = {
  id: string;
  text: string;
  score?: number;
  tags?: string[];
};

export type Question = {
  id: string;
  type: QuestionType;
  question: string;
  interactionId?: string;
  sourceAtomId?: string;
  contentType?: ContentType;
  interactionType?: InteractionType;
  targetNeedFit?: NeedFit;
  options?: Option[];
  correctIndex?: number;
  correctAnswer?: "true" | "false";
  feedback?: {
    correct: string;
    incorrect: string;
  };
  media?: {
    type: "text" | "video";
    duration?: number;
    prompt?: string;
  };
  revealTitle?: string;
  revealContent?: string;
  nextPrompt?: string;
  evidenceSpans?: EvidenceSpan[];
};

export type Expert = {
  id: string;
  name: string;
  title: string;
  avatarTone: string;
  avatarUrl: string;
  bio: string;
  agentIntro: string;
  books: {
    title: string;
    meta: string;
    coverUrl: string;
  }[];
  articles: {
    title: string;
    source: string;
    coverUrl: string;
  }[];
  field: string;
  courseId: string;
  locked?: boolean;
};

export type CourseModule = {
  id: string;
  sourceChapter?: number;
  title: string;
  question: string;
  centralClaim?: string;
  learningGoal?: string;
  lessons: string[];
  deliverables: string[];
  contentAtoms?: string[];
  interactionBlocks?: string[];
  assessment?: {
    type: string;
    rubric: string[];
  };
};

export type KeyPoint = {
  id: string;
  sourceChapter?: number;
  sourceAtomId?: string;
  sourceCardId?: string;
  contentType?: ContentType;
  difficulty?: "L1" | "L2" | "L3";
  title: string;
  oneSentence: string;
  explanation: string;
  example: string;
  evidenceSpans?: EvidenceSpan[];
  tags?: string[];
  teachingUse?: string;
  video?: string;
  videoPromptId?: string;
  revealQuestion: Question;
};

export type VideoPrompt = {
  assetId: string;
  moduleId: string;
  durationSeconds: number;
  structure: string[];
  prompt: string;
  instructionalRole: string;
  reversal?: string;
  jimengPrompt?: string;
};

export type Course = {
  id: string;
  title: string;
  expertName: string;
  expertTitle: string;
  description: string;
  durationMinutes: number;
  moduleCount: number;
  rewardTitle: string;
  summary300: string;
  modules: CourseModule[];
  diagnosisQuestions: Question[];
  keyPoints: KeyPoint[];
  quizQuestions: Question[];
  finalOpenQuestions: Question[];
  videoPrompts?: VideoPrompt[];
};

export type Answers = Record<string, string | string[]>;

export type LearningProfile = {
  completionRate: number;
  knowledgeScore: number;
  specificityScore: number;
  consistencyScore: number;
  projectSignalScore: number;
  expertFitScore: number;
  overallScore: number;
  level: "high_potential" | "advanced" | "exploratory" | "basic";
  tags: string[];
  strengths: string[];
  weaknesses: string[];
};

export type Recommendation = {
  id: string;
  type:
    | "advanced_learning"
    | "project_diagnosis"
    | "project_challenge"
    | "expert_project_pool"
    | "coffee_chat"
    | "offline_lecture"
    | "workshop"
    | "mentor_service";
  title: string;
  reason: string;
  suitableFor: string;
  estimatedTime: string;
  requiresApplication: boolean;
  ctaText: string;
};
