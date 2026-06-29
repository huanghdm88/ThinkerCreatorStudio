import type { Answers, Course, LearningProfile, Recommendation } from "../types";
import { recommendationCatalog } from "../data/course";

function asArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function answerText(value: string | string[] | undefined) {
  return asArray(value).join(" ").trim();
}

function normalizeBool(value: string) {
  return value.trim().toLowerCase();
}

function scoreQuestion(course: Course, questionId: string, answer: string | string[] | undefined) {
  const allQuestions = [
    ...course.diagnosisQuestions,
    ...course.keyPoints.map((point) => point.revealQuestion),
    ...course.quizQuestions
  ];
  const question = allQuestions.find((item) => item.id === questionId);
  if (!question || !question.options) return answerText(answer).length > 0 ? 12 : 0;
  const selected = asArray(answer);

  if (question.correctAnswer === "true" || question.correctAnswer === "false") {
    return selected.some((item) => normalizeBool(item) === question.correctAnswer) ? 20 : 0;
  }

  if (typeof question.correctIndex === "number") {
    const correctOption = question.options[question.correctIndex];
    if (!correctOption) return answerText(answer).length > 0 ? 12 : 0;
    return selected.some((item) => item === correctOption.id || item === correctOption.text) ? Math.max(20, correctOption.score || 0) : 0;
  }

  const score = selected.reduce((sum, optionId) => {
    const option = question.options.find((item) => item.id === optionId || item.text === optionId);
    return sum + (option?.score || 0);
  }, 0);

  if (question.type === "multiple") {
    return Math.min(20, score);
  }

  return Math.min(20, score);
}

function collectTags(course: Course, answers: Answers) {
  const tags = new Set<string>();
  const allQuestions = [
    ...course.diagnosisQuestions,
    ...course.keyPoints.map((point) => point.revealQuestion),
    ...course.quizQuestions
  ];
  for (const question of allQuestions) {
    const selected = asArray(answers[question.id]);
    if (question.type === "truefalse" && question.correctAnswer) {
      if (selected.some((item) => normalizeBool(item) === question.correctAnswer)) {
        question.correctAnswer && tags.add(`正确${question.correctAnswer}`);
      }
      continue;
    }
    if (typeof question.correctIndex === "number" && question.options?.length) {
      const option = question.options[question.correctIndex];
      const selected = asArray(answers[question.id]);
      if (selected.some((item) => item === option?.id || item === option?.text)) {
        option?.tags?.forEach((tag) => tags.add(tag));
      }
      continue;
    }

    for (const optionId of selected) {
      const option = question.options?.find((item) => item.id === optionId || item.text === optionId);
      option?.tags?.forEach((tag) => tags.add(tag));
    }
  }
  return Array.from(tags);
}

function specificityFromText(text: string) {
  if (!text.trim()) return 0;
  let score = Math.min(72, text.trim().length * 1.4);
  if (/\d|小时|天|周|客户|用户|场景|成本|收入|付费|留存|转化|流程/.test(text)) score += 18;
  if (/验证|假设|痛点|行为|证据|MVP|宝箱|钥匙/.test(text)) score += 10;
  return Math.min(100, Math.round(score));
}

export function buildProfile(course: Course, answers: Answers, completionRate: number): LearningProfile {
  const scoredIds = [
    ...course.diagnosisQuestions.map((item) => item.id),
    ...course.keyPoints.map((item) => item.revealQuestion.id),
    ...course.quizQuestions.map((item) => item.id)
  ];
  const rawKnowledge = scoredIds.reduce((sum, id) => sum + scoreQuestion(course, id, answers[id]), 0);
  const knowledgeScore = Math.round((rawKnowledge / (scoredIds.length * 20)) * 100);

  const openView = answerText(answers.open_view);
  const openProject = answerText(answers.open_project);
  const specificityScore = Math.round((specificityFromText(openView) + specificityFromText(openProject)) / 2);
  const consistencyScore = Math.min(100, Math.round(knowledgeScore * 0.55 + specificityScore * 0.45));
  const projectSignalScore = Math.max(
    specificityFromText(openProject),
    /用户|客户|付费|项目|验证|MVP|创业|产品/.test(openProject) ? 76 : 0
  );
  const tags = collectTags(course, answers);
  const expertFitScore = Math.min(100, 45 + tags.filter((tag) => /验证|行为|实验|市场|需求|项目|学习速度/.test(tag)).length * 9);
  const overallScore = Math.round(
    knowledgeScore * 0.25 +
      specificityScore * 0.25 +
      consistencyScore * 0.2 +
      projectSignalScore * 0.2 +
      expertFitScore * 0.1
  );
  const level = overallScore >= 80 ? "high_potential" : overallScore >= 60 ? "advanced" : overallScore >= 40 ? "exploratory" : "basic";

  const strengths = [
    knowledgeScore >= 70 ? "能抓住专家核心判断" : "完成了基础学习路径",
    specificityScore >= 70 ? "表达中包含具体场景或项目线索" : "已经开始用自己的话表达观点",
    projectSignalScore >= 70 ? "具备进入项目诊断的信号" : "适合继续补强验证意识"
  ];
  const weaknesses = [
    knowledgeScore < 70 ? "部分概念还需要通过案例复习" : "可以进一步挑战真实项目应用",
    specificityScore < 70 ? "开放表达还可以更具体：对象、场景、数字、行为" : "下一步需要把表达转成行动计划",
    projectSignalScore < 70 ? "项目信号还不够明确" : "需要明确第一条关键假设"
  ];

  return {
    completionRate,
    knowledgeScore,
    specificityScore,
    consistencyScore,
    projectSignalScore,
    expertFitScore,
    overallScore,
    level,
    tags,
    strengths,
    weaknesses
  };
}

export function pickRecommendations(profile: LearningProfile): Recommendation[] {
  if (profile.level === "high_potential") {
    return recommendationCatalog.filter((item) => ["project_diagnosis", "coffee_chat", "project_challenge"].includes(item.type));
  }
  if (profile.level === "advanced") {
    return recommendationCatalog.filter((item) => ["advanced_learning", "project_challenge", "project_diagnosis"].includes(item.type));
  }
  if (profile.level === "exploratory") {
    return recommendationCatalog.filter((item) => ["advanced_learning", "offline_lecture"].includes(item.type));
  }
  return recommendationCatalog.filter((item) => item.type === "advanced_learning");
}
