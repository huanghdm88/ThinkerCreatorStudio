#!/usr/bin/env python3
"""Generate structured Book-to-Course artifacts from a source text.

The script is intentionally deterministic: it creates stable chapter/paragraph
anchors, course modules, interaction blocks, multimodal manifests, and a
validation report using the Thinker course definition gates.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from statistics import mean
from typing import Any


SUPPORTED_TEXT_SOURCE_TYPES = {"txt", "md", "markdown"}

DEFAULT_TARGET_PERSONA = {
    "name": "默认知识学习者",
    "cognitiveLevel": "intermediate",
    "domain": "知识密集型阅读与未来议题学习",
    "usageScenario": "自学、读书会、企业内训、主题工作坊",
}

DEFAULT_CONSTRAINTS = {
    "targetCardsPerChapter": 5,
    "answerMinLen": 80,
    "answerMaxLen": 150,
    "questionMaxLen": 40,
    "transitionMinLen": 15,
    "transitionMaxLen": 30,
    "typesShare": {"choice": 0.55, "truefalse": 0.25, "open": 0.20},
    "maxTypeRun": 2,
    "maxRetries": 2,
}

ABSOLUTE_CLAIM_PATTERN = re.compile(r"(必然|永远|绝对|100%|百分之百|万能|一定会|完全没有)")
DATA_SUPPORT_PATTERN = re.compile(r"(数据显示|数据表明|研究显示|研究证明|统计显示|实验证明)")


@dataclass(frozen=True)
class CardTemplate:
    label: str
    question: str
    answer: str
    content_type: str
    interaction_type: str
    keywords: list[str]
    options: list[str] | None = None
    correct_index: int | None = None
    correct_answer: str | None = None


@dataclass(frozen=True)
class GenerationContext:
    target_persona: dict[str, Any]
    constraints: dict[str, Any]
    citation_style: str
    forbid_claims: list[str]
    risk_level: str
    output_language: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "targetPersona": self.target_persona,
            "constraints": self.constraints,
            "citationStyle": self.citation_style,
            "forbidClaims": self.forbid_claims,
            "riskLevel": self.risk_level,
            "outputLanguage": self.output_language,
        }



ASSET_FILENAMES = {
    "book_breakdown_json": "book-breakdown.json",
    "chapter_course_blueprint": "chapter-course-blueprint.json",
    "knowledge_atom_bank": "knowledge-atom-bank.json",
    "interaction_question_bank": "interaction-question-bank.json",
    "video_prompt_list": "video-prompt-list.json",
    "audio_blog_scripts": "audio-blog-scripts.json",
    "user_adaptation_rules": "user-adaptation-rules.json",
    "certificate_recommendation_rules": "certificate-recommendation-rules.json",
}


def clean_line(line: str) -> str:
    return line.replace("\ufeff", "").replace("\x01", "").replace("\x02", "").strip()


def compact_text(text: str, max_len: int = 72) -> str:
    text = re.sub(r"\s+", "", text)
    if len(text) <= max_len:
        return text
    return f"{text[:max_len]}..."


def text_len(text: str) -> int:
    return len(re.sub(r"\s+", "", text or ""))


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", "", text or "")


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def load_json_arg(value: str | None, label: str) -> dict[str, Any]:
    if not value:
        return {}
    path = Path(value)
    try:
        if path.exists():
            loaded = json.loads(path.read_text(encoding="utf-8"))
        else:
            loaded = json.loads(value)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON for {label}: {exc}") from exc
    if not isinstance(loaded, dict):
        raise SystemExit(f"{label} must be a JSON object")
    return loaded


def build_context(args: argparse.Namespace) -> GenerationContext:
    target_persona = {**DEFAULT_TARGET_PERSONA, **load_json_arg(args.target_persona, "--target-persona")}
    constraints = {**DEFAULT_CONSTRAINTS, **load_json_arg(args.constraints, "--constraints")}
    if not isinstance(constraints.get("typesShare"), dict):
        raise SystemExit("constraints.typesShare must be a JSON object")
    target_cards = int(constraints.get("targetCardsPerChapter", 5))
    if target_cards < 5 or target_cards > 7:
        raise SystemExit("constraints.targetCardsPerChapter must be between 5 and 7")
    constraints["targetCardsPerChapter"] = target_cards
    for key in [
        "answerMinLen",
        "answerMaxLen",
        "questionMaxLen",
        "transitionMinLen",
        "transitionMaxLen",
        "maxTypeRun",
        "maxRetries",
    ]:
        constraints[key] = int(constraints[key])
    if constraints["answerMinLen"] > constraints["answerMaxLen"]:
        raise SystemExit("constraints.answerMinLen cannot exceed answerMaxLen")
    if constraints["transitionMinLen"] > constraints["transitionMaxLen"]:
        raise SystemExit("constraints.transitionMinLen cannot exceed transitionMaxLen")
    return GenerationContext(
        target_persona=target_persona,
        constraints=constraints,
        citation_style=args.citation_style,
        forbid_claims=args.forbid_claim or [],
        risk_level=args.risk_level,
        output_language=args.output_language,
    )



def chinese_number(value: str) -> int | None:
    if value.isdigit():
        return int(value)
    numerals = {
        "零": 0,
        "一": 1,
        "二": 2,
        "两": 2,
        "三": 3,
        "四": 4,
        "五": 5,
        "六": 6,
        "七": 7,
        "八": 8,
        "九": 9,
        "十": 10,
    }
    if value in numerals:
        return numerals[value]
    if "十" in value:
        left, _, right = value.partition("十")
        tens = numerals.get(left, 1) if left else 1
        ones = numerals.get(right, 0) if right else 0
        return tens * 10 + ones
    return None


def heading_candidate(line: str) -> tuple[int, str, str] | None:
    line = clean_line(line)
    match = re.match(r"^第([一二三四五六七八九十百两0-9]+)(章|种力量|部分|篇|部)(?:\s+(.+))?$", line)
    if match:
        order = chinese_number(match.group(1))
        if order is None:
            return None
        return order, match.group(2), clean_line(match.group(3) or "")
    match = re.match(r"^(?:Chapter|CHAPTER)\s+([0-9]+|[IVXLC]+)[:.、\s]*(.*)$", line)
    if match:
        raw = match.group(1)
        order = int(raw) if raw.isdigit() else None
        if order is None:
            return None
        return order, "chapter", clean_line(match.group(2) or "")
    return None


def infer_title(lines: list[str], index: int, inline_title: str, fallback: str) -> str:
    if inline_title:
        return inline_title
    for line in lines[index + 1 : min(index + 8, len(lines))]:
        line = clean_line(line)
        if not line:
            continue
        if heading_candidate(line):
            break
        if len(line) <= 80:
            return line
    return fallback


def choose_heading_sequence(lines: list[str]) -> list[tuple[int, int, str]]:
    candidates: list[tuple[int, int, str, str]] = []
    for i, line in enumerate(lines):
        candidate = heading_candidate(line)
        if candidate is None:
            continue
        order, kind, inline_title = candidate
        if order <= 0 or order > 40:
            continue
        candidates.append((order, i, kind, inline_title))

    best: tuple[int, int, list[tuple[int, int, str]]] | None = None
    for start_pos, (order, line_no, kind, inline_title) in enumerate(candidates):
        if order != 1:
            continue
        sequence = [(order, line_no, infer_title(lines, line_no, inline_title, f"{kind} {order}"))]
        current_line = line_no
        next_order = 2
        for candidate_order, candidate_line, candidate_kind, candidate_title in candidates[start_pos + 1 :]:
            if candidate_kind != kind or candidate_line <= current_line:
                continue
            if candidate_order == next_order:
                sequence.append(
                    (
                        candidate_order,
                        candidate_line,
                        infer_title(lines, candidate_line, candidate_title, f"{kind} {candidate_order}"),
                    )
                )
                current_line = candidate_line
                next_order += 1
            elif candidate_order == 1 and len(sequence) > 1:
                break
        if len(sequence) < 2:
            continue
        span = sequence[-1][1] - sequence[0][1]
        score = (len(sequence), span)
        if best is None or score > (best[0], best[1]):
            best = (len(sequence), span, sequence)
    return best[2] if best else []


def fallback_chunk_sequence(lines: list[str], chunks: int = 5) -> list[tuple[int, int, str]]:
    nonempty = [(i, line) for i, line in enumerate(lines) if clean_line(line)]
    if not nonempty:
        return []
    first = nonempty[0][0]
    last = nonempty[-1][0]
    span = max(1, last - first)
    sequence = []
    for idx in range(chunks):
        line_no = first + int(span * idx / chunks)
        sequence.append((idx + 1, line_no, f"第 {idx + 1} 部分"))
    return sequence


def good_term(term: str) -> bool:
    term = term.strip(" ：:、，,.。；;（）()[]【】“”\"")
    stop_prefix = (
        "这种力量",
        "会推动",
        "并且",
        "从而",
        "而这",
        "而使",
        "它不但",
        "将会",
        "正在",
        "从",
        "让",
        "随着",
        "如果",
        "所以",
        "因为",
        "当",
        "在",
        "对",
        "用",
        "没有",
        "为了",
        "把",
        "可以",
        "能够",
        "会",
        "们会",
        "它们",
        "我们",
        "这个",
        "一个",
        "或者",
        "同时",
    )
    if not term or len(term) < 2 or len(term) > 36:
        return False
    if term.startswith(stop_prefix) or term.endswith(("的", "未", "方")):
        return False
    if re.fullmatch(r"\d+", term):
        return False
    if re.search(r"[。？！；]", term):
        return False
    if re.search(r"(我们|它们|他们|这个世界|上面这些|是否|能否|会不会|为什么|什么样|如何)", term):
        return False
    return True


def extract_toc_subheadings(lines: list[str], starts: list[tuple[int, int, str]]) -> dict[int, list[str]]:
    first_body_heading = starts[0][1]
    front_matter = lines[:first_body_heading]
    chapter_orders = {idx for idx, _, _ in starts}
    toc_markers: list[tuple[int, int, str]] = []
    for line_no, line in enumerate(front_matter):
        candidate = heading_candidate(line)
        if candidate is None:
            continue
        order, _, inline_title = candidate
        if order in chapter_orders:
            toc_markers.append((order, line_no, inline_title))

    subheadings: dict[int, list[str]] = {idx: [] for idx in chapter_orders}
    for pos, (order, line_no, inline_title) in enumerate(toc_markers):
        next_line = toc_markers[pos + 1][1] if pos + 1 < len(toc_markers) else first_body_heading
        chapter_title = next((title for idx, _, title in starts if idx == order), inline_title)
        for raw in front_matter[line_no + 1 : next_line]:
            item = clean_line(raw)
            if not item or item == chapter_title or heading_candidate(item):
                continue
            if item in {"目录", "前言", "推荐序一", "推荐序二", "特别致谢"}:
                continue
            if re.search(r"https?://|www\.", item):
                continue
            if good_term(item):
                subheadings[order].append(item)
    return subheadings


def parse_source(path: Path) -> dict[str, Any]:
    source_type = path.suffix.lstrip(".").lower() or "txt"
    if source_type not in SUPPORTED_TEXT_SOURCE_TYPES:
        supported = ", ".join(sorted(SUPPORTED_TEXT_SOURCE_TYPES))
        raise SystemExit(
            f"Unsupported source type '.{source_type}' for deterministic ingestion. "
            f"Convert the book to UTF-8 text/Markdown first. Supported: {supported}."
        )
    raw_lines = path.read_text(encoding="utf-8").splitlines()
    lines = [clean_line(line) for line in raw_lines]
    title = next((line for line in lines if line), path.stem)
    authors = []
    for line in lines[:80]:
        if "著" in line and len(line) <= 80:
            authors.append(re.sub(r"\s*著\s*$", "", line).strip())
            break
    if not authors:
        authors = ["unknown"]

    starts = choose_heading_sequence(lines) or fallback_chunk_sequence(lines)
    if len(starts) < 2:
        raise SystemExit(f"Could not infer chapter structure in {path}")
    toc_subheadings = extract_toc_subheadings(lines, starts)

    chapters = []
    for pos, (idx, start_line, chapter_title) in enumerate(starts):
        end_line = starts[pos + 1][1] if pos + 1 < len(starts) else next(
            (
                i
                for i in range(start_line + 1, len(lines))
                if lines[i] in {"附录", "后记", "结语", "译者注", "参考文献", "注释"}
                or lines[i].startswith("Making Elephants Fly 译者注")
            ),
            len(lines),
        )
        body_lines = [line for line in lines[start_line + 1 : end_line] if line]
        paragraphs = []
        for line in body_lines:
            if re.fullmatch(r"\[?\d+\]?", line):
                continue
            if re.search(r"https?://|www\.", line):
                continue
            if re.search(r"(付费资源|免费分享|请勿商用|boksharer|微信)", line, re.IGNORECASE):
                continue
            if line == chapter_title or heading_candidate(line):
                continue
            if len(line) < 5 and not any(ch in line for ch in "技术智能生命连接自动化量子太空创新市场组织用户"):
                continue
            paragraphs.append(line)
        chapter = {
            "chapterIndex": idx,
            "chapterTitle": chapter_title,
            "sourceLineStart": start_line + 1,
            "sourceLineEnd": end_line,
            "wordCount": sum(len(p) for p in paragraphs),
            "subheadings": toc_subheadings.get(idx, []),
            "paragraphs": [
                {"paragraphIndex": p_idx, "text": paragraph}
                for p_idx, paragraph in enumerate(paragraphs, 1)
            ],
        }
        chapters.append(chapter)

    return {
        "bookMeta": {
            "bookTitle": title,
            "authors": authors,
            "version": "source-text-local",
            "language": "zh-CN",
            "sourceType": source_type,
            "sourcePath": str(path),
        },
        "chapters": chapters,
        "diagnostics": {
            "chapterCount": len(chapters),
            "sourceLineCount": len(lines),
            "frontMatterLineCount": starts[0][1],
            "chapterStructure": "inferred-from-source",
            "notes": [
                "Main chapters were inferred from repeated ordered headings in the source text.",
                "Evidence snippets are capped to avoid copying long source passages.",
            ],
        },
    }


def keyword_variants(keyword: str) -> list[str]:
    cleaned = embedded_term(keyword)
    variants = [cleaned]
    variants.extend(
        part
        for part in re.split(r"[：:、，,和与及/（）()“”\" ]+", cleaned)
        if good_term(part)
    )
    seen = set()
    result = []
    for variant in variants:
        variant = variant.strip()
        if not variant or variant in seen:
            continue
        seen.add(variant)
        result.append(variant)
    return result


def paragraph_context(chapter: dict[str, Any], start_index: int, min_len: int = 30) -> tuple[str, int]:
    paragraphs = chapter["paragraphs"]
    by_index = {paragraph["paragraphIndex"]: paragraph["text"] for paragraph in paragraphs}
    pieces = []
    end_index = start_index
    for idx in range(start_index, start_index + 4):
        text = by_index.get(idx)
        if not text:
            continue
        pieces.append(text)
        end_index = idx
        if text_len("".join(pieces)) >= min_len:
            break
    return "".join(pieces), end_index


def fallback_evidence(chapter: dict[str, Any]) -> dict[str, Any]:
    paragraphs = chapter["paragraphs"]
    for paragraph in paragraphs:
        if len(paragraph["text"]) >= 30:
            return {
                "chapterIndex": chapter["chapterIndex"],
                "paragraphIndex": paragraph["paragraphIndex"],
                "paragraphIndexEnd": paragraph["paragraphIndex"],
                "quote": compact_text(paragraph["text"]),
                "matchKeyword": None,
                "anchorStatus": "fallback_unmatched",
            }
    return {
        "chapterIndex": chapter["chapterIndex"],
        "paragraphIndex": 1,
        "paragraphIndexEnd": 1,
        "quote": "",
        "matchKeyword": None,
        "anchorStatus": "missing",
    }


def chapter_title_evidence(chapter: dict[str, Any], keyword: str) -> dict[str, Any]:
    fallback = fallback_evidence(chapter)
    fallback.update(
        {
            "matchKeyword": keyword,
            "anchorStatus": "chapter_title_context",
            "sourceHeading": chapter["chapterTitle"],
        }
    )
    return fallback


def find_evidence(chapter: dict[str, Any], keywords: list[str]) -> dict[str, Any]:
    paragraphs = chapter["paragraphs"]
    for keyword in keywords:
        for variant in keyword_variants(keyword):
            for paragraph in paragraphs:
                if variant in paragraph["text"]:
                    context_text, end_index = paragraph_context(chapter, paragraph["paragraphIndex"])
                    return {
                        "chapterIndex": chapter["chapterIndex"],
                        "paragraphIndex": paragraph["paragraphIndex"],
                        "paragraphIndexEnd": end_index,
                        "quote": compact_text(context_text),
                        "matchKeyword": variant,
                        "anchorStatus": "keyword",
                    }
        if embedded_term(keyword) == embedded_term(chapter["chapterTitle"]):
            return chapter_title_evidence(chapter, embedded_term(keyword))
    return fallback_evidence(chapter)


def embedded_term(term: str) -> str:
    return term.replace("“", "").replace("”", "").replace('"', "").strip()


def make_transition(cards: list[CardTemplate], idx: int) -> str:
    if idx >= len(cards):
        return ""
    transitions = [
        "有了这个判断，再看它怎样运作。",
        "机制明确后，继续放到具体场景里。",
        "场景判断之后，再检查风险边界。",
        "识别风险后，再把观点转成行动。",
    ]
    return transitions[(idx - 1) % len(transitions)]


def target_need_fit(content_type: str) -> dict[str, int]:
    base = {
        "cognitive_opening": 55,
        "method_learning": 55,
        "conversation_solving": 50,
        "practice_participation": 45,
    }
    if content_type in {"counterintuitive_claim", "reframing", "assumption_challenge"}:
        base["cognitive_opening"] = 86
        base["conversation_solving"] = 68
    if content_type in {"data_validation", "team_design", "funding_strategy", "pivot_threshold"}:
        base["method_learning"] = 82
        base["practice_participation"] = 70
    if content_type in {"stakeholder_alignment", "ecosystem_collaboration", "listening"}:
        base["conversation_solving"] = 82
    if content_type in {"action_bias", "user_problem", "resource_constraint"}:
        base["practice_participation"] = 78
    if content_type in {"core_claim", "scenario_judgement"}:
        base["cognitive_opening"] = 82
        base["conversation_solving"] = 64
    if content_type in {"mechanism", "application_task"}:
        base["method_learning"] = 82
        base["practice_participation"] = 76
    if content_type in {"risk_tradeoff", "technology_ethics"}:
        base["cognitive_opening"] = 74
        base["conversation_solving"] = 80
    return base


def chapter_terms(chapter: dict[str, Any], limit: int = 8) -> list[str]:
    terms: list[str] = []
    title = chapter["chapterTitle"]
    for part in re.split(r"[：:、，, ]+", title):
        part = clean_line(part)
        if good_term(part):
            terms.append(part)

    terms.extend(chapter.get("subheadings", []))

    text = "\n".join(p["text"] for p in chapter["paragraphs"][:180])
    if not chapter.get("subheadings"):
        for paragraph in chapter["paragraphs"][:80]:
            line = paragraph["text"]
            if 4 <= len(line) <= 24 and not re.search(r"[。？！；，,]", line) and good_term(line):
                terms.append(line)
    for match in re.finditer(
        r"[\u4e00-\u9fffA-Za-z0-9]{1,12}(?:技术|智能|现实|接口|网络|芯片|机器人|算法|系统|经济|社会|生命|基因|计算|城市|工作|感官|意识|材料|数据|自动化|风险|隐私|伦理)",
        text,
    ):
        term = match.group(0)
        if good_term(term):
            terms.append(term)

    seen = set()
    result = []
    for term in terms:
        term = term.strip(" ：:、，,.。；;（）()[]【】\"")
        if not term or term in seen:
            continue
        if not good_term(term):
            continue
        seen.add(term)
        result.append(term)
        if len(result) >= limit:
            break
    return result or [title]


def card_terms(chapter: dict[str, Any]) -> tuple[str, str, str]:
    terms = chapter_terms(chapter, limit=12)
    supported_terms = [
        term
        for term in terms
        if find_evidence(chapter, [term]).get("anchorStatus") == "keyword"
    ]
    title = chapter["chapterTitle"]
    primary = short_topic(title)
    secondary = supported_terms[0] if supported_terms else (terms[1] if len(terms) > 1 else primary)
    third = supported_terms[1] if len(supported_terms) > 1 else (terms[2] if len(terms) > 2 else secondary)
    return primary, secondary, third


def make_generic_cards(chapter: dict[str, Any], target_cards: int = 5) -> list[CardTemplate]:
    title = chapter["chapterTitle"]
    primary, secondary, third = card_terms(chapter)
    title_text = embedded_term(title)
    primary_text = embedded_term(primary)
    secondary_text = embedded_term(secondary)
    third_text = embedded_term(third)
    cards = [
        CardTemplate(
            f"{primary}的核心命题",
            f"{primary}只是一个概念，还是会改变现实？",
            f"本章围绕“{title_text}”，把“{primary_text}”呈现为一种会改变行动环境的力量。学习者需要回到“{secondary_text}”等原文证据，判断它影响的是连接方式、组织流程、市场结构还是决策边界，再把判断带入具体案例，避免只把它当成热词。",
            "core_claim",
            "video_choice",
            [title, primary, secondary],
            ["只是概念名词", "会改变现实行动环境", "只适合专家讨论"],
            1,
        ),
        CardTemplate(
            f"{secondary}的作用机制",
            f"{secondary}为什么不是术语，却会形成力量？",
            f"课程不把本章处理成名词清单，而是要求学习者找出“{secondary_text}”如何连接技术、场景和行为变化。回答时要说明触发条件、受影响对象和可能后果；只有能说清机制，才算真正理解这一章。",
            "mechanism",
            "choice",
            [secondary, primary],
            ["说清机制和场景连接", "记住更多术语", "只看是否流行"],
            0,
        ),
        CardTemplate(
            f"{third}带来的场景判断",
            f"如果{third}成熟，哪个场景会先变化？",
            f"本卡把“{third_text}”转成场景判断任务：学习者需要从书中证据出发，判断它先改变个人体验、组织流程、产业结构还是公共治理，并解释为什么这个场景比其他场景更早出现变化，同时标出一个可回读的证据锚点。",
            "scenario_judgement",
            "open",
            [third, secondary, primary],
        ),
        CardTemplate(
            f"{primary}的风险边界",
            f"{primary}越强，风险会自动变小吗？",
            f"不会。越强大的力量越需要讨论边界、治理和副作用。本章学习不能只抓机会，也要识别隐私、安全、伦理、权力或资源分配方面的代价，并把这些代价写成可以被讨论和复核的判断。",
            "risk_tradeoff",
            "truefalse",
            ["风险", "隐私", "伦理", "控制", primary],
            correct_answer="false",
        ),
        CardTemplate(
            f"把{title}转成行动任务",
            f"学完本章只是理解概念，还是要提交练习？",
            f"把本章转化为一个可提交任务：选择一个真实行业或个人场景，写出“{primary_text}”带来的机会、受影响对象、关键风险和下一步验证方式。这个练习要能被同伴检查，而不是停留在泛泛感想。",
            "application_task",
            "choice",
            [title, primary, secondary, third],
            ["写一个机会-风险-验证表", "背诵全部案例", "只讨论未来想象"],
            0,
        ),
    ]
    if target_cards >= 6:
        cards.append(
            CardTemplate(
                f"{secondary}的治理边界",
                f"{secondary}越成熟，治理问题会自动消失吗？",
                f"不会。越成熟的机制越需要被放到治理边界中复核。学习者要从原文证据出发，说明“{secondary_text}”可能改变哪些权力、隐私、安全或资源分配关系，并判断哪些风险需要先被约束，写清判断依据。",
                "risk_tradeoff",
                "truefalse",
                ["风险", "隐私", "伦理", secondary, primary],
                correct_answer="false",
            )
        )
    if target_cards >= 7:
        cards.append(
            CardTemplate(
                f"{third}的迁移练习",
                f"把{third}迁移到新领域时，第一步该验证什么？",
                f"迁移不是套用概念，而是先找一个可观察场景，再判断“{third_text}”是否真的改变了对象、流程或决策。学习者需要写出一个小验证：对象是谁、变化是什么、证据从哪里来、风险怎样被记录。",
                "application_task",
                "choice",
                [third, secondary, primary],
                ["先验证对象、变化和证据", "先写完整商业计划", "只选择最热门领域"],
                0,
            )
        )
    return cards[:target_cards]


def evidence_initial_score(evidence: dict[str, Any]) -> float:
    if evidence.get("anchorStatus") != "keyword":
        if evidence.get("anchorStatus") == "chapter_title_context":
            return 0.78
        return 0.35
    if not evidence.get("matchKeyword") or text_len(evidence.get("quote", "")) < 12:
        return 0.58
    return 0.88


def question_dimension_score(question: str) -> float:
    hooks = ["为什么", "只是", "还是", "不是", "如果", "会", "吗", "哪个", "什么", "越", "提交"]
    return clamp(0.45 + 0.08 * sum(hook in question for hook in hooks), high=0.92)


def card_dimension_scores(card: dict[str, Any]) -> dict[str, float]:
    full_text = "".join(
        str(card.get(key, ""))
        for key in ["label", "question", "answer", "transition", "contentType"]
    )
    paradox_markers = ["只是", "还是", "不是", "而是", "不会", "越", "风险", "误判", "边界", "先变化"]
    transfer_markers = ["场景", "行业", "组织", "个人", "任务", "练习", "提交", "应用", "验证"]
    contest_markers = ["为什么", "哪个", "是否", "会", "吗", "边界", "风险", "判断"]
    return {
        "paradoxScore": clamp(0.55 + 0.07 * sum(marker in full_text for marker in paradox_markers), high=0.92),
        "contestabilityScore": clamp(0.55 + 0.06 * sum(marker in full_text for marker in contest_markers), high=0.9),
        "transferScore": clamp(0.55 + 0.06 * sum(marker in full_text for marker in transfer_markers), high=0.9),
        "questionScore": question_dimension_score(card["question"]),
    }


def card_quality_score(card: dict[str, Any], support_score: float) -> float:
    dimensions = card_dimension_scores(card)
    self_contained = 0.9 if text_len(card.get("answer", "")) >= 80 and text_len(card.get("question", "")) <= 40 else 0.65
    interest = dimensions["questionScore"]
    score = (
        0.25 * support_score
        + 0.25 * dimensions["paradoxScore"]
        + 0.20 * dimensions["contestabilityScore"]
        + 0.15 * self_contained
        + 0.15 * interest
    )
    return round(clamp(score), 3)


def make_candidate_insights(chapter: dict[str, Any], limit: int = 12) -> list[dict[str, Any]]:
    terms = chapter_terms(chapter, limit=limit)
    candidates = []
    for idx, term in enumerate(terms, 1):
        evidence = find_evidence(chapter, [term])
        support = evidence_initial_score(evidence)
        candidates.append(
            {
                "candidateId": f"ch{chapter['chapterIndex']}_cand_{idx:02d}",
                "term": term,
                "evidenceSpan": evidence,
                "supportScore": support,
                "paradoxHint": "risk_or_reframe" if re.search(r"(风险|边界|改变|力量|智能|自动化)", term) else "needs_review",
                "selected": idx <= 5,
            }
        )
    return candidates


def generate_breakdown(source: dict[str, Any], context: GenerationContext) -> dict[str, Any]:
    chapters = []
    for chapter in source["chapters"]:
        idx = chapter["chapterIndex"]
        templates = make_generic_cards(chapter, context.constraints["targetCardsPerChapter"])
        terms = chapter_terms(chapter)
        candidates = make_candidate_insights(chapter)
        insights = []
        for card_idx, template in enumerate(templates, 1):
            evidence = find_evidence(chapter, template.keywords)
            support_score = evidence_initial_score(evidence)
            card: dict[str, Any] = {
                "index": card_idx,
                "insightId": f"ch{idx}_card_{card_idx:02d}",
                "label": template.label,
                "question": template.question,
                "type": "choice" if template.options else ("truefalse" if template.correct_answer is not None else "open"),
                "answer": template.answer,
                "feedbackCorrect": "判断到位",
                "feedbackIncorrect": "回到证据",
                "transition": make_transition(templates, card_idx),
                "contentType": template.content_type,
                "interactionType": template.interaction_type,
                "evidenceSpans": [evidence],
                "supportScore": support_score,
            }
            card.update(card_dimension_scores(card))
            card["qualityScore"] = card_quality_score(card, support_score)
            if template.options:
                card["options"] = template.options
                card["correctIndex"] = template.correct_index
            if template.correct_answer is not None:
                card["correctAnswer"] = template.correct_answer
            insights.append(card)
        chapters.append(
            {
                "chapterIndex": idx,
                "chapterTitle": chapter["chapterTitle"],
                "centralClaim": central_claim(chapter, terms),
                "learningGoal": learning_goal(chapter),
                "candidateInsights": candidates,
                "insights": insights,
                "discussionQuestions": [
                    {
                        "question": f"本章哪个观点最能改变你对{short_topic(chapter['chapterTitle'])}的默认判断？",
                        "hint": "请引用至少一个观点卡和一个证据锚点。",
                    },
                    {
                        "question": f"如果把“{chapter['chapterTitle']}”转成课程任务，第一步练习是什么？",
                        "hint": "把行动写成可观察、可提交、可反馈的小任务。",
                    },
                ],
            }
        )

    card_scores = [
        insight["qualityScore"]
        for chapter in chapters
        for insight in chapter["insights"]
    ]
    return {
        "bookTitle": source["bookMeta"]["bookTitle"],
        "bookSummary300": book_summary(source),
        "diagnosticQuestion": diagnostic_question(source),
        "chapters": chapters,
        "globalDiscussionQuestions": [
            {
                "question": "这些章节合在一起形成了怎样的判断框架？",
                "hint": "用每章的核心力量、作用机制、风险边界和行动任务回答。",
            },
            {
                "question": "哪些观点适合转成你所在领域的一周学习或验证任务？",
                "hint": "优先选择能被证据验证的观点。",
            },
        ],
        "inputContract": context.as_dict(),
        "workflowDiagnostics": {
            "extractor": "deterministic candidates generated from chapter headings, source terms, and paragraph anchors",
            "scorer": "heuristic scores computed from evidence support, question hooks, contestability, and transfer markers",
            "reviewer": "strict hard-rule validation runs after asset generation",
            "reviser": "local deterministic length fixes are embedded in templates; failed cards are reported for future local rewrite",
        },
        "qualityGate": {
            "status": "pass" if min(card_scores) >= 0.82 else "warn",
            "score": round(mean(card_scores), 3),
            "checks": [],
        },
    }


def load_json_file(path: Path, label: str) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"{label} not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {label}: {exc}") from exc


def extract_breakdown_payload(raw: Any, label: str) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise SystemExit(f"{label} must be a JSON object")
    if isinstance(raw.get("assets"), dict) and isinstance(raw["assets"].get("book_breakdown_json"), dict):
        raw = raw["assets"]["book_breakdown_json"]
    elif isinstance(raw.get("book_breakdown_json"), dict):
        raw = raw["book_breakdown_json"]
    if not isinstance(raw, dict) or not isinstance(raw.get("chapters"), list):
        raise SystemExit(f"{label} must contain a book breakdown object with chapters[]")
    return raw


def default_interaction_type(card_type: str) -> str:
    return {
        "choice": "choice",
        "truefalse": "truefalse",
        "open": "open",
    }.get(card_type, "open")


def normalize_agent_card(raw_card: dict[str, Any], chapter_index: int, position: int, total_cards: int) -> dict[str, Any]:
    card = dict(raw_card)
    card_type = card.get("type")
    if not card_type:
        if card.get("options"):
            card_type = "choice"
        elif "correctAnswer" in card:
            card_type = "truefalse"
        else:
            card_type = "open"
    card["type"] = card_type
    card["index"] = int(card.get("index", position))
    card.setdefault("insightId", f"ch{chapter_index}_agent_card_{position:02d}")
    card.setdefault("label", "")
    card.setdefault("question", "")
    card.setdefault("answer", "")
    card.setdefault("feedbackCorrect", "判断到位")
    card.setdefault("feedbackIncorrect", "回到证据")
    if "transition" not in card:
        card["transition"] = "" if position == total_cards else make_transition([None] * total_cards, position)
    card.setdefault("contentType", "semantic_insight")
    card.setdefault("interactionType", default_interaction_type(card_type))
    if "evidenceSpans" not in card and isinstance(card.get("evidenceSpan"), dict):
        card["evidenceSpans"] = [card["evidenceSpan"]]
    card.setdefault("evidenceSpans", [])
    if card_type == "choice":
        card.setdefault("options", [])

    first_evidence = card["evidenceSpans"][0] if card["evidenceSpans"] else {}
    support_score = evidence_initial_score(first_evidence) if isinstance(first_evidence, dict) else 0.0
    card["supportScore"] = float(card.get("supportScore", support_score))
    card.update(card_dimension_scores(card))
    card["qualityScore"] = card_quality_score(card, card["supportScore"])
    return card


def normalize_agent_chapter(
    raw_chapter: dict[str, Any],
    source_chapters: dict[int, dict[str, Any]],
) -> dict[str, Any]:
    if "chapterIndex" not in raw_chapter:
        raise SystemExit("Agent breakdown chapter is missing chapterIndex")
    chapter_index = int(raw_chapter["chapterIndex"])
    source_chapter = source_chapters.get(chapter_index)
    if not source_chapter:
        raise SystemExit(f"Agent breakdown chapterIndex {chapter_index} is not present in the source map")
    raw_insights = raw_chapter.get("insights")
    if not isinstance(raw_insights, list):
        raise SystemExit(f"Agent breakdown chapter {chapter_index} must contain insights[]")
    insights = [
        normalize_agent_card(card, chapter_index, position, len(raw_insights))
        for position, card in enumerate(raw_insights, 1)
        if isinstance(card, dict)
    ]
    chapter_title = raw_chapter.get("chapterTitle") or source_chapter["chapterTitle"]
    return {
        "chapterIndex": chapter_index,
        "chapterTitle": chapter_title,
        "centralClaim": raw_chapter.get("centralClaim") or central_claim(source_chapter, chapter_terms(source_chapter)),
        "learningGoal": raw_chapter.get("learningGoal") or learning_goal(source_chapter),
        "candidateInsights": raw_chapter.get("candidateInsights", []),
        "insights": insights,
        "discussionQuestions": raw_chapter.get(
            "discussionQuestions",
            [
                {
                    "question": f"本章哪个观点最值得重新判断：{short_topic(chapter_title)}？",
                    "hint": "请引用观点卡和证据锚点回答。",
                }
            ],
        ),
        "reviewNotes": raw_chapter.get("reviewNotes", []),
        "revisionLog": raw_chapter.get("revisionLog", []),
    }


def load_agent_breakdown(path: Path, source: dict[str, Any], context: GenerationContext) -> dict[str, Any]:
    payload = extract_breakdown_payload(load_json_file(path, "--breakdown-input"), "--breakdown-input")
    source_chapters = {chapter["chapterIndex"]: chapter for chapter in source["chapters"]}
    chapters = [
        normalize_agent_chapter(chapter, source_chapters)
        for chapter in payload["chapters"]
        if isinstance(chapter, dict)
    ]
    if not chapters:
        raise SystemExit("--breakdown-input did not contain any valid chapter objects")
    card_scores = [
        insight["qualityScore"]
        for chapter in chapters
        for insight in chapter["insights"]
    ]
    workflow = payload.get("workflowDiagnostics") if isinstance(payload.get("workflowDiagnostics"), dict) else {}
    workflow = {
        **workflow,
        "extractor": "Codex agent-authored semantic breakdown loaded from --breakdown-input",
        "reviewer": "Codex review notes and revisionLog may be supplied; strict hard-rule validation remains authoritative",
        "reviser": "Codex revises failed cards by editing the breakdown JSON and rerunning validation",
    }
    return {
        "bookTitle": payload.get("bookTitle") or source["bookMeta"]["bookTitle"],
        "bookSummary300": payload.get("bookSummary300") or book_summary(source),
        "diagnosticQuestion": payload.get("diagnosticQuestion") or diagnostic_question(source),
        "chapters": chapters,
        "globalDiscussionQuestions": payload.get(
            "globalDiscussionQuestions",
            [
                {
                    "question": "哪些语义观点最能改变你对全书主题的判断？",
                    "hint": "请跨章节引用证据锚点回答。",
                },
                {
                    "question": "哪些观点可以转成一周内可验证的行动？",
                    "hint": "把行动写成可观察、可提交、可反馈的小任务。",
                },
            ],
        ),
        "inputContract": context.as_dict(),
        "workflowDiagnostics": workflow,
        "agentExtraction": {
            "mode": "codex-agent",
            "breakdownInput": str(path),
            "provider": "none",
        },
        "revisionLog": payload.get("revisionLog", []),
        "qualityGate": {
            "status": "pass" if card_scores and min(card_scores) >= 0.82 else "warn",
            "score": round(mean(card_scores), 3) if card_scores else 0,
            "checks": [],
        },
    }


def book_summary(source: dict[str, Any]) -> str:
    titles = "、".join(chapter["chapterTitle"] for chapter in source["chapters"])
    return f"《{source['bookMeta']['bookTitle']}》围绕{titles}展开。课程化处理应把每章拆成可互动、可评估、可迁移的学习任务，并保留证据锚点，而不是复述章节摘要。"


def diagnostic_question(source: dict[str, Any]) -> str:
    titles = "、".join(chapter["chapterTitle"] for chapter in source["chapters"][:6])
    return f"面对这本书的主题，你最需要理解哪一部分的机会、机制和风险：{titles}？"


def central_claim(chapter: dict[str, Any], terms: list[str]) -> str:
    focus = "、".join(terms[:3])
    return f"本章围绕“{chapter['chapterTitle']}”展开，重点说明{focus}如何改变现实场景，并要求学习者同时理解机会、机制与风险。"


def learning_goal(chapter: dict[str, Any]) -> str:
    return f"学员能够解释“{chapter['chapterTitle']}”的关键机制，识别应用场景和风险边界，并设计一个可验证的行动任务。"


def short_topic(title: str) -> str:
    return re.split(r"[：:、，, ]+", title)[0] or title


def generate_assets(source: dict[str, Any], breakdown: dict[str, Any], context: GenerationContext) -> dict[str, Any]:
    modules = []
    atoms = []
    interactions = []
    video_prompts = []
    audio_scripts = []

    for chapter in breakdown["chapters"]:
        idx = chapter["chapterIndex"]
        module_id = f"m{idx}"
        module_atoms = []
        module_interactions = []
        for insight in chapter["insights"]:
            atom_id = f"{module_id}_atom_{insight['index']:02d}"
            interaction_id = f"{module_id}_i{insight['index']:02d}"
            atom = {
                "atom_id": atom_id,
                "source_chapter": idx,
                "source_card_id": insight["insightId"],
                "title": insight["label"],
                "summary": insight["answer"],
                "content_type": insight["contentType"],
                "teaching_use": "用于引发判断、讨论、练习或项目迁移",
                "difficulty": "L2",
                "freshness_risk": "stable",
                "copyright_risk": "low-transformed",
                "evidence_spans": insight["evidenceSpans"],
                "tags": [source["bookMeta"]["bookTitle"], short_topic(chapter["chapterTitle"]), insight["contentType"]],
            }
            interaction = {
                "interaction_id": interaction_id,
                "source_atom_id": atom_id,
                "content_type": insight["contentType"],
                "interaction_type": insight["interactionType"],
                "target_need_fit": target_need_fit(insight["contentType"]),
                "prompt": insight["question"],
                "options": insight.get("options", []),
                "correct_index": insight.get("correctIndex"),
                "correct_answer": insight.get("correctAnswer"),
                "feedback": {
                    "correct": insight["feedbackCorrect"],
                    "incorrect": insight["feedbackIncorrect"],
                },
                "media": make_media(module_id, insight),
                "evidence_spans": insight["evidenceSpans"],
            }
            atoms.append(atom)
            interactions.append(interaction)
            module_atoms.append(atom_id)
            module_interactions.append(interaction_id)

        video_prompts.append(
            {
                "asset_id": f"{module_id}_video_prompt",
                "module_id": module_id,
                "duration_seconds": 15,
                "structure": [
                    "0-3秒：提出本章真实应用情景",
                    "3-9秒：呈现冲突、机会或风险误判",
                    "9-12秒：给出结果反转",
                    "12-15秒：留下判断问题",
                ],
                "prompt": f"用一个与本章主题相关的真实场景表现这一中心论点：{chapter['centralClaim']}，结尾抛出一个选择判断。",
                "instructional_role": "题目前置材料，不作装饰。",
            }
        )
        audio_scripts.append(
            {
                "asset_id": f"{module_id}_audio_blog",
                "module_id": module_id,
                "title": f"{chapter['chapterTitle']} 预习音频",
                "outline": [
                    f"用一个反常识问题引入{short_topic(chapter['chapterTitle'])}",
                    f"解释本章中心论点：{chapter['centralClaim']}",
                    "提示学习者先完成诊断题再进入卡片学习",
                ],
                "instructional_role": "降低进入门槛，放在章节预习页。",
            }
        )

        modules.append(
            {
                "module_id": module_id,
                "source_chapter": idx,
                "title": chapter["chapterTitle"],
                "central_claim": chapter["centralClaim"],
                "learning_goal": chapter["learningGoal"],
                "content_atoms": module_atoms,
                "interaction_blocks": module_interactions,
                "deliverable": deliverable(chapter["chapterTitle"]),
                "assessment": {
                    "type": "module_task",
                    "rubric": [
                        "是否引用证据锚点",
                        "是否能识别关键假设",
                        "是否提出可验证行动",
                    ],
                },
            }
        )

    course_blueprint = {
        "course_id": course_id(source),
        "book_meta": {
            "book_title": source["bookMeta"]["bookTitle"],
            "authors": source["bookMeta"]["authors"],
            "source_type": source["bookMeta"]["sourceType"],
        },
        "target_persona": context.target_persona,
        "input_contract": context.as_dict(),
        "modules": modules,
        "adaptive_rules": adaptation_rules(),
        "quality_gate": {},
    }

    assets = {
        "book_breakdown_json": breakdown,
        "chapter_course_blueprint": course_blueprint,
        "knowledge_atom_bank": {"atoms": atoms},
        "interaction_question_bank": {"interactions": interactions},
        "video_prompt_list": {"video_prompts": video_prompts},
        "audio_blog_scripts": {"audio_blog_scripts": audio_scripts},
        "user_adaptation_rules": adaptation_rules(),
        "certificate_recommendation_rules": certificate_rules(modules),
    }
    return assets


def make_media(module_id: str, insight: dict[str, Any]) -> dict[str, Any]:
    if insight["interactionType"] == "video_choice":
        return {
            "type": "video",
            "duration": 15,
            "prompt": f"学习者在真实场景中误判“{insight['label']}”，结尾让学习者选择真正问题或风险。",
        }
    return {
        "type": "text",
        "prompt": "阅读观点卡后完成判断或迁移练习。",
    }


def course_id(source: dict[str, Any]) -> str:
    stem = Path(source["bookMeta"]["sourcePath"]).stem
    safe = re.sub(r"[^A-Za-z0-9_-]+", "-", stem).strip("-").lower()
    return f"{safe or 'book'}-book-to-course"


def deliverable(chapter_title: str) -> str:
    return f"{short_topic(chapter_title)}机会-风险-行动画布"


def adaptation_rules() -> dict[str, Any]:
    return {
        "need_dimensions": {
            "cognitive_opening": "用反常识问题打开认知差距。",
            "method_learning": "把观点改写成步骤、清单和判断标准。",
            "conversation_solving": "把观点改写成对话、教练问题和会议提示。",
            "practice_participation": "把观点改写成可提交的小任务或项目动作。",
        },
        "interaction_score_formula": {
            "content_type_fit": 0.35,
            "user_need_fit": 0.35,
            "learning_stage_fit": 0.20,
            "media_availability": 0.10,
        },
        "copy_rules": [
            "不硬分类用户，只调整四类需求权重。",
            "同一证据可改写为不同提问方式，但不得改变原始主张。",
            "实践参与型版本必须包含可提交产物。",
        ],
    }


def certificate_rules(modules: list[dict[str, Any]]) -> dict[str, Any]:
    dimensions = [short_topic(module["title"]) for module in modules]
    return {
        "certificate": {
            "name": "主题课程学习完成证书",
            "completion_requirements": [
                "完成全部模块互动",
                "提交至少 80% 模块交付物",
                "完成最终机会-风险-行动画布",
            ],
        },
        "learning_profile": {
            "dimensions": dimensions,
            "source_modules": [module["module_id"] for module in modules],
        },
        "recommendations": [
            {
                "condition": "核心概念理解弱",
                "next_path": "进入概念复习、案例解释或专家 Agent 诊断",
            },
            {
                "condition": "实践提交充分但风险判断弱",
                "next_path": "推荐风险辨析、伦理讨论和导师复盘",
            },
            {
                "condition": "全部模块通过",
                "next_path": "推荐形成主题展示页、读书会分享或行业应用提案",
            },
        ],
    }


def source_paragraph_index(source: dict[str, Any]) -> dict[int, dict[int, str]]:
    return {
        chapter["chapterIndex"]: {
            paragraph["paragraphIndex"]: paragraph["text"]
            for paragraph in chapter["paragraphs"]
        }
        for chapter in source["chapters"]
    }


def evidence_source_text(
    source_index: dict[int, dict[int, str]],
    chapter_index: int,
    paragraph_index: int,
    paragraph_index_end: int | None,
) -> str:
    paragraphs = source_index.get(chapter_index, {})
    end = paragraph_index_end or paragraph_index
    return "".join(paragraphs.get(idx, "") for idx in range(paragraph_index, end + 1))


def keyword_matches_claim(keyword: str | None, card_text: str) -> bool:
    if not keyword:
        return False
    keyword_norm = normalize_text(keyword)
    if keyword_norm in card_text:
        return True
    return any(
        normalize_text(variant) in card_text
        for variant in keyword_variants(keyword)
        if text_len(variant) >= 2
    )


def evidence_support(card: dict[str, Any], source_index: dict[int, dict[int, str]]) -> dict[str, Any]:
    card_text = normalize_text(
        "".join(str(card.get(key, "")) for key in ["label", "question", "answer", "contentType"])
    )
    best = {
        "supported": False,
        "score": 0.0,
        "detail": "No evidence span was attached.",
        "sourceText": "",
    }
    for span in card.get("evidenceSpans", []):
        source_text = evidence_source_text(
            source_index,
            int(span.get("chapterIndex", -1)),
            int(span.get("paragraphIndex", -1)),
            int(span.get("paragraphIndexEnd", span.get("paragraphIndex", -1))),
        )
        quote = normalize_text(str(span.get("quote", "")).removesuffix("..."))
        source_norm = normalize_text(source_text)
        keyword = span.get("matchKeyword")
        readback_ok = bool(quote and quote in source_norm)
        heading_keyword_ok = (
            span.get("anchorStatus") == "chapter_title_context"
            and keyword
            and embedded_term(keyword) == embedded_term(str(span.get("sourceHeading", "")))
        )
        keyword_ok = bool(keyword and (keyword in source_text or heading_keyword_ok) and keyword_matches_claim(keyword, card_text))
        substantive_ok = text_len(source_text) >= 30
        anchor_ok = span.get("anchorStatus") in {"keyword", "chapter_title_context"}
        supported = readback_ok and keyword_ok and substantive_ok and anchor_ok
        score = 0.35
        if readback_ok:
            score += 0.2
        if keyword_ok:
            score += 0.25
        if substantive_ok:
            score += 0.1
        if anchor_ok:
            score += 0.1
        score = clamp(score)
        detail = (
            f"readback={readback_ok}, keyword={keyword or 'none'}, "
            f"keywordInClaim={keyword_ok}, substantive={substantive_ok}, anchor={span.get('anchorStatus')}"
        )
        if score > best["score"]:
            best = {
                "supported": supported,
                "score": round(score, 3),
                "detail": detail,
                "sourceText": source_text,
            }
    return best


def expected_type_counts(total: int, constraints: dict[str, Any]) -> dict[str, int]:
    raw_shares = constraints.get("typesShare") or DEFAULT_CONSTRAINTS["typesShare"]
    shares = {
        key: float(raw_shares.get(key, DEFAULT_CONSTRAINTS["typesShare"][key]))
        for key in ["choice", "truefalse", "open"]
    }
    share_total = sum(shares.values()) or 1.0
    normalized = {key: shares[key] / share_total for key in shares}
    exact = {key: normalized[key] * total for key in normalized}
    counts = {key: int(exact[key]) for key in exact}
    remaining = total - sum(counts.values())
    for key in sorted(exact, key=lambda item: exact[item] - counts[item], reverse=True)[:remaining]:
        counts[key] += 1
    return counts


def type_distribution_ok(cards: list[dict[str, Any]], constraints: dict[str, Any]) -> tuple[bool, str]:
    total = len(cards)
    if total == 0:
        return False, "No cards found."
    counts = Counter(card.get("type") for card in cards)
    expected = expected_type_counts(total, constraints)
    passed = all(counts.get(key, 0) == expected[key] for key in ["choice", "truefalse", "open"])
    ratios = {key: counts.get(key, 0) / total for key in ["choice", "truefalse", "open"]}
    detail = ", ".join(
        f"{key}={counts.get(key, 0)}/{total}({ratios[key]:.2f}), expected={expected[key]}"
        for key in ["choice", "truefalse", "open"]
    )
    return passed, detail


def risky_claim_checks(card: dict[str, Any], context: GenerationContext, evidence_text: str) -> list[tuple[str, bool, str, str]]:
    card_text = "".join(str(card.get(key, "")) for key in ["label", "question", "answer", "feedbackCorrect", "feedbackIncorrect"])
    checks = []
    absolute_hit = ABSOLUTE_CLAIM_PATTERN.search(card_text)
    checks.append(
        (
            "risk.absolute_claim",
            absolute_hit is None,
            "hard" if context.risk_level == "strict" else "warn",
            f"absolute expression={absolute_hit.group(0) if absolute_hit else 'none'}",
        )
    )
    data_hit = DATA_SUPPORT_PATTERN.search(card_text)
    evidence_has_data = bool(re.search(r"[\d%％一二三四五六七八九十百千万亿]+", evidence_text))
    checks.append(
        (
            "risk.unsupported_data_claim",
            data_hit is None or evidence_has_data,
            "hard",
            f"data-support phrase={data_hit.group(0) if data_hit else 'none'}",
        )
    )
    for claim in context.forbid_claims:
        if not claim:
            continue
        checks.append(
            (
                "risk.forbid_claim",
                claim not in card_text,
                "hard",
                f"forbidden claim={claim}",
            )
        )
    return checks


def validate_assets(
    assets: dict[str, Any],
    definition_path: Path,
    source: dict[str, Any],
    context: GenerationContext,
) -> dict[str, Any]:
    breakdown = assets["book_breakdown_json"]
    chapters = breakdown["chapters"]
    cards = [card for chapter in chapters for card in chapter["insights"]]
    interactions = assets["interaction_question_bank"]["interactions"]
    modules = assets["chapter_course_blueprint"]["modules"]

    constraints = context.constraints
    source_index = source_paragraph_index(source)
    rule_checks: list[dict[str, Any]] = []
    chapter_coverage_parts = []
    narrative_flow_parts = []
    self_check_passes = 0
    evidence_support_count = 0

    def add_check(gate: str, code: str, path: str, passed: bool, severity: str, detail: str) -> None:
        rule_checks.append(
            {
                "gate": gate,
                "code": code,
                "path": path,
                "passed": passed,
                "severity": severity,
                "detail": detail,
            }
        )

    for chapter in chapters:
        chapter_path = f"chapters[{chapter['chapterIndex']}]"
        chapter_cards = chapter["insights"]
        card_count_ok = 5 <= len(chapter_cards) <= 7
        add_check(
            "book_breakdown_rules",
            "chapter.card_count",
            chapter_path,
            card_count_ok,
            "hard",
            f"cardCount={len(chapter_cards)}, required=5-7",
        )
        target_card_count_ok = len(chapter_cards) == constraints["targetCardsPerChapter"]
        add_check(
            "book_breakdown_rules",
            "chapter.target_card_count",
            chapter_path,
            target_card_count_ok,
            "hard",
            f"cardCount={len(chapter_cards)}, target={constraints['targetCardsPerChapter']}",
        )
        distribution_ok, distribution_detail = type_distribution_ok(chapter_cards, constraints)
        add_check(
            "book_breakdown_rules",
            "chapter.type_distribution",
            chapter_path,
            distribution_ok,
            "hard",
            distribution_detail,
        )
        type_run = max_type_run(chapter_cards)
        type_runs_ok = type_run <= constraints["maxTypeRun"]
        add_check(
            "book_breakdown_rules",
            "chapter.max_type_run",
            chapter_path,
            type_runs_ok,
            "hard",
            f"maxTypeRun={type_run}, allowed<={constraints['maxTypeRun']}",
        )
        transitions = [card.get("transition", "") for card in chapter_cards[:-1]]
        transition_logic_ok = any(any(marker in transition for marker in ["再", "继续", "之后", "然后"]) for transition in transitions)
        add_check(
            "book_breakdown_rules",
            "chapter.transition_logic",
            chapter_path,
            transition_logic_ok,
            "warn",
            "At least one non-final transition should show logical continuation.",
        )
        duration = round(len(chapter_cards) * 2.2, 1)
        duration_ok = 10 <= duration <= 20
        add_check(
            "book_breakdown_rules",
            "chapter.estimated_duration",
            chapter_path,
            duration_ok,
            "warn",
            f"estimatedMinutes={duration}, expected=10-20",
        )
        discussion_ok = 1 <= len(chapter.get("discussionQuestions", [])) <= 2
        add_check(
            "book_breakdown_rules",
            "chapter.discussion_questions",
            chapter_path,
            discussion_ok,
            "hard",
            f"discussionQuestionCount={len(chapter.get('discussionQuestions', []))}, required=1-2",
        )
        candidates_ok = len(chapter.get("candidateInsights", [])) >= 5
        add_check(
            "extraction_workflow",
            "chapter.candidate_insights",
            chapter_path,
            candidates_ok,
            "warn",
            f"candidateCount={len(chapter.get('candidateInsights', []))}, target=10-12 when source terms allow",
        )
        chapter_coverage_parts.append(
            0.25 * card_count_ok
            + 0.20 * target_card_count_ok
            + 0.20 * distribution_ok
            + 0.20 * discussion_ok
            + 0.15 * candidates_ok
        )
        narrative_flow_parts.append(0.50 * type_runs_ok + 0.50 * transition_logic_ok)

        for position, card in enumerate(chapter_cards, 1):
            card_path = f"{chapter_path}.insights[{position}]"
            answer_len = text_len(card.get("answer", ""))
            add_check(
                "book_breakdown_rules",
                "card.answer_length",
                f"{card_path}.answer",
                constraints["answerMinLen"] <= answer_len <= constraints["answerMaxLen"],
                "hard",
                f"answerLen={answer_len}, required={constraints['answerMinLen']}-{constraints['answerMaxLen']}",
            )
            question_len = text_len(card.get("question", ""))
            add_check(
                "book_breakdown_rules",
                "card.question_length",
                f"{card_path}.question",
                question_len <= constraints["questionMaxLen"],
                "hard",
                f"questionLen={question_len}, max={constraints['questionMaxLen']}",
            )
            transition_len = text_len(card.get("transition", ""))
            is_last = position == len(chapter_cards)
            transition_ok = is_last and transition_len == 0 or (
                not is_last
                and constraints["transitionMinLen"] <= transition_len <= constraints["transitionMaxLen"]
            )
            add_check(
                "book_breakdown_rules",
                "card.transition_length",
                f"{card_path}.transition",
                transition_ok,
                "hard",
                f"transitionLen={transition_len}, required={constraints['transitionMinLen']}-{constraints['transitionMaxLen']} for non-final cards; final may be empty",
            )
            for feedback_key in ["feedbackCorrect", "feedbackIncorrect"]:
                feedback_len = text_len(card.get(feedback_key, ""))
                add_check(
                    "book_breakdown_rules",
                    f"card.{feedback_key}.length",
                    f"{card_path}.{feedback_key}",
                    feedback_len < 20,
                    "hard",
                    f"{feedback_key}Len={feedback_len}, required<20",
                )

            card_type = card.get("type")
            add_check(
                "book_breakdown_rules",
                "card.type",
                f"{card_path}.type",
                card_type in {"choice", "truefalse", "open"},
                "hard",
                f"type={card_type}",
            )
            if card_type == "choice":
                options = card.get("options", [])
                correct_index = card.get("correctIndex")
                add_check(
                    "book_breakdown_rules",
                    "card.choice.options",
                    f"{card_path}.options",
                    isinstance(options, list) and 2 <= len(options) <= 3,
                    "hard",
                    f"optionCount={len(options) if isinstance(options, list) else 'invalid'}, required=2-3",
                )
                add_check(
                    "book_breakdown_rules",
                    "card.choice.correct_index",
                    f"{card_path}.correctIndex",
                    isinstance(correct_index, int) and isinstance(options, list) and 0 <= correct_index < len(options),
                    "hard",
                    f"correctIndex={correct_index}",
                )
            elif card_type == "truefalse":
                add_check(
                    "book_breakdown_rules",
                    "card.truefalse.correct_answer",
                    f"{card_path}.correctAnswer",
                    isinstance(card.get("correctAnswer"), str)
                    and card.get("correctAnswer") in {"true", "false"},
                    "hard",
                    f"correctAnswer={card.get('correctAnswer')!r}, required string true/false",
                )
            elif card_type == "open":
                add_check(
                    "book_breakdown_rules",
                    "card.open.no_choice_fields",
                    card_path,
                    "correctIndex" not in card and not card.get("options"),
                    "hard",
                    "open cards must not carry choice answer fields",
                )

            support = evidence_support(card, source_index)
            if support["supported"]:
                evidence_support_count += 1
            card["supportScore"] = support["score"]
            add_check(
                "evidence",
                "card.evidence_claim_support",
                f"{card_path}.evidenceSpans",
                support["supported"],
                "hard",
                support["detail"],
            )
            for code, passed, severity, detail in risky_claim_checks(card, context, support["sourceText"]):
                add_check("accuracy", code, card_path, passed, severity, detail)

            preliminary_quality = card_quality_score(card, card["supportScore"])
            card_hard_failures = [
                check
                for check in rule_checks
                if check["path"].startswith(card_path)
                and check["severity"] == "hard"
                and not check["passed"]
            ]
            card["qualityScore"] = min(preliminary_quality, 0.69) if card_hard_failures else preliminary_quality
            card.update(card_dimension_scores(card))
            add_check(
                "book_breakdown_rules",
                "card.quality_threshold",
                f"{card_path}.qualityScore",
                card["qualityScore"] >= 0.78,
                "hard",
                f"qualityScore={card['qualityScore']}, required>=0.78",
            )
            if card["qualityScore"] >= 0.78 and support["supported"] and not card_hard_failures:
                self_check_passes += 1

    evidence_rate = evidence_support_count / len(cards) if cards else 0
    chapter_card_ok = all(5 <= len(chapter["insights"]) <= 7 for chapter in chapters)
    type_runs_ok = all(max_type_run(chapter["insights"]) <= constraints["maxTypeRun"] for chapter in chapters)
    module_interactions_ok = all(module["interaction_blocks"] for module in modules)
    adaptation_ok = all(
        key in assets["user_adaptation_rules"]["need_dimensions"]
        for key in ["cognitive_opening", "method_learning", "conversation_solving", "practice_participation"]
    )
    service_ok = bool(assets["certificate_recommendation_rules"]["recommendations"])
    asset_ok = all(key in assets for key in ASSET_FILENAMES)
    multimodal_ok = bool(assets["video_prompt_list"]["video_prompts"]) and bool(assets["audio_blog_scripts"]["audio_blog_scripts"])

    hard_failures = [
        check
        for check in rule_checks
        if check["severity"] == "hard" and not check["passed"]
    ]
    risk_failures = [
        check
        for check in hard_failures
        if check["gate"] == "accuracy" or check["gate"] == "evidence"
    ]

    card_avg = mean(card["qualityScore"] for card in cards) if cards else 0
    chapter_coverage = round(mean(chapter_coverage_parts), 3) if chapter_coverage_parts else 0
    narrative_flow = round(mean(narrative_flow_parts), 3) if narrative_flow_parts else 0
    self_check = round(self_check_passes / len(cards), 3) if cards else 0
    quality_score = round(0.45 * card_avg + 0.25 * chapter_coverage + 0.20 * self_check + 0.10 * evidence_rate, 3)

    gates = [
        {
            "gate": "evidence",
            "passed": evidence_rate == 1,
            "detail": f"{evidence_support_count}/{len(cards)} cards have readable evidence that shares a keyword with the card claim.",
        },
        {
            "gate": "accuracy",
            "passed": not risk_failures,
            "detail": "Rule-level accuracy checks require claim-supported evidence, no forbidden claims, no unbounded absolutes, and no unsupported data-support phrases.",
        },
        {
            "gate": "interaction",
            "passed": module_interactions_ok and len(interactions) == len(cards),
            "detail": "Every card maps to an interaction block.",
        },
        {
            "gate": "rhythm",
            "passed": type_runs_ok,
            "detail": "No chapter has more than two consecutive cards of the same type.",
        },
        {
            "gate": "user_adaptation",
            "passed": adaptation_ok,
            "detail": "Four need dimensions and scoring formula are present.",
        },
        {
            "gate": "service_handoff",
            "passed": service_ok,
            "detail": "Certificate, learning profile, and recommendation paths are present.",
        },
        {
            "gate": "eight_asset_families",
            "passed": asset_ok,
            "detail": "All eight asset families required by the PDF are present.",
        },
        {
            "gate": "multimodal_materials",
            "passed": multimodal_ok,
            "detail": "Video prompts and audio blog scripts are present.",
        },
        {
            "gate": "book_breakdown_rules",
            "passed": not hard_failures,
            "detail": f"Hard rule failures: {len(hard_failures)}.",
        },
    ]

    threshold_pass = (
        quality_score >= 0.82
        and chapter_coverage >= 0.82
        and narrative_flow >= 0.78
        and self_check >= 0.88
    )
    if hard_failures or quality_score < 0.70:
        status = "fail"
    elif threshold_pass and all(gate["passed"] for gate in gates):
        status = "pass"
    else:
        status = "warn"
    scores = {
        "qualityScore": quality_score,
        "chapterCoverageScore": chapter_coverage,
        "narrativeFlowScore": narrative_flow,
        "selfCheckPassRate": self_check,
        "evidenceIntegrity": round(evidence_rate, 3),
    }
    return {
        "status": status,
        "definitionSource": {
            "path": str(definition_path),
            "checkedAgainst": [
                "page 11: six quality gates and score thresholds",
                "page 11: eight final asset families",
                "page 12: ten-step execution flow and design principles",
            ],
        },
        "scores": scores,
        "thresholds": {
            "qualityScore": 0.82,
            "chapterCoverageScore": 0.82,
            "narrativeFlowScore": 0.78,
            "selfCheckPassRate": 0.88,
        },
        "gates": gates,
        "summary": {
            "chapterCount": len(chapters),
            "insightCardCount": len(cards),
            "moduleCount": len(modules),
            "interactionCount": len(interactions),
            "assetFamilies": sorted(ASSET_FILENAMES),
            "hardRuleFailureCount": len(hard_failures),
            "warningCount": sum(
                check["severity"] == "warn" and not check["passed"]
                for check in rule_checks
            ),
        },
        "ruleChecks": rule_checks,
        "hardRuleFailures": hard_failures[:50],
        "limitations": [
            "This is a structured first-pass course breakdown, not final editorial publication copy.",
            "Evidence snippets are intentionally short; use paragraph indexes for deeper review.",
            "Accuracy is checked by deterministic source anchors and risk patterns; a semantic reviewer should still sample cards before learner release.",
            "The extractor/reviewer/reviser loop is represented by deterministic candidates and diagnostics; LLM-assisted local rewriting remains a P1 enhancement.",
        ],
    }


def max_type_run(cards: list[dict[str, Any]]) -> int:
    max_run = 0
    current = None
    current_run = 0
    for card in cards:
        if card["type"] == current:
            current_run += 1
        else:
            current = card["type"]
            current_run = 1
        max_run = max(max_run, current_run)
    return max_run


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def write_preview(path: Path, data: dict[str, Any], validation: dict[str, Any]) -> None:
    book_title = data["source"]["bookMeta"]["bookTitle"]
    lines = [
        f"# {book_title} Book-to-Course Preview",
        "",
        f"Validation status: `{validation['status']}`",
        "",
        "## Scores",
        "",
    ]
    for key, value in validation["scores"].items():
        lines.append(f"- `{key}`: {value}")
    lines.extend(["", "## Modules", ""])
    for module in data["assets"]["chapter_course_blueprint"]["modules"]:
        lines.extend(
            [
                f"### {module['module_id'].upper()} {module['title']}",
                "",
                f"- Central claim: {module['central_claim']}",
                f"- Learning goal: {module['learning_goal']}",
                f"- Deliverable: {module['deliverable']}",
                f"- Interactions: {len(module['interaction_blocks'])}",
                "",
            ]
        )
    lines.extend(["## Artifact Families", ""])
    for key, filename in ASSET_FILENAMES.items():
        lines.append(f"- `{key}` -> `assets/{filename}`")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_master(
    source: dict[str, Any],
    assets: dict[str, Any],
    validation: dict[str, Any],
    context: GenerationContext,
) -> dict[str, Any]:
    combined_checks = validation["gates"] + validation.get("ruleChecks", [])
    assets["chapter_course_blueprint"]["quality_gate"] = {
        "status": validation["status"],
        "score": validation["scores"]["qualityScore"],
        "checks": combined_checks,
    }
    assets["book_breakdown_json"]["qualityGate"] = {
        "status": validation["status"],
        "score": validation["scores"]["qualityScore"],
        "checks": combined_checks,
    }
    return {
        "schemaVersion": "book-to-course-output/v1",
        "generatedBy": "book-to-course skill",
        "inputContract": context.as_dict(),
        "source": source,
        "assets": assets,
        "validation": validation,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--book", required=True, type=Path)
    parser.add_argument("--definition", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--target-persona", help="JSON object or path with name/cognitiveLevel/domain/usageScenario")
    parser.add_argument("--constraints", help="JSON object or path with checker constraints")
    parser.add_argument("--citation-style", choices=["sentence", "line", "page"], default="sentence")
    parser.add_argument("--forbid-claim", action="append", help="Claim text that must not appear in generated cards")
    parser.add_argument("--risk-level", choices=["strict", "normal"], default="strict")
    parser.add_argument("--output-language", default="zh-CN")
    parser.add_argument(
        "--source-map-out",
        type=Path,
        help="Optional path for the parsed source map that Codex can use during semantic extraction",
    )
    parser.add_argument(
        "--source-map-only",
        action="store_true",
        help="Write the parsed source map to --source-map-out or <out>/source-map.json, then exit",
    )
    parser.add_argument(
        "--breakdown-input",
        type=Path,
        help="Codex-authored book breakdown JSON to validate and turn into final course assets",
    )
    args = parser.parse_args()

    if not args.book.exists():
        raise SystemExit(f"Book not found: {args.book}")
    if not args.definition.exists():
        raise SystemExit(f"Definition not found: {args.definition}")
    if args.breakdown_input and not args.breakdown_input.exists():
        raise SystemExit(f"Breakdown input not found: {args.breakdown_input}")

    context = build_context(args)
    source = parse_source(args.book)
    source["inputContract"] = context.as_dict()

    out = args.out
    assets_dir = out / "assets"
    out.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(parents=True, exist_ok=True)

    source_map_path = args.source_map_out or (out / "source-map.json")
    if args.source_map_out or args.source_map_only:
        write_json(source_map_path, source)
    if args.source_map_only:
        print(json.dumps({
            "status": "source-map-written",
            "sourceMap": str(source_map_path),
            "summary": source["diagnostics"],
        }, ensure_ascii=False, indent=2))
        return

    if args.breakdown_input:
        breakdown = load_agent_breakdown(args.breakdown_input, source, context)
    else:
        breakdown = generate_breakdown(source, context)
    assets = generate_assets(source, breakdown, context)
    validation = validate_assets(assets, args.definition, source, context)
    master = build_master(source, assets, validation, context)

    write_json(out / "structured-course-data.json", master)
    write_json(out / "validation-report.json", validation)
    for key, filename in ASSET_FILENAMES.items():
        write_json(assets_dir / filename, assets[key])
    write_preview(out / "course-preview.md", master, validation)

    print(json.dumps({
        "status": validation["status"],
        "breakdownMode": "codex-agent" if args.breakdown_input else "deterministic",
        "breakdownInput": str(args.breakdown_input) if args.breakdown_input else None,
        "output": str(out / "structured-course-data.json"),
        "validation": str(out / "validation-report.json"),
        "preview": str(out / "course-preview.md"),
        "assets": str(assets_dir),
        "summary": validation["summary"],
        "scores": validation["scores"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
