---
name: book-to-course
description: Convert a source book or long knowledge document into structured, multidimensional course material and validate it against the Thinker book-to-multimodal-course definition. Use when Codex needs to process UTF-8 .txt/.md sources, or text extracted from .pdf/.docx/EPUB-like sources, into chapter insight cards, CourseBlueprint modules, interaction blocks, multimodal asset manifests, user adaptation rules, quality gates, and final JSON/Markdown course artifacts.
---

# Book To Course

Use this skill to turn a book into course-ready structured data. The output must be more than a summary: it must preserve evidence anchors, create interactive learning material, map chapters into course modules, and pass the Thinker course construction validation rules.

## Workflow

1. Inspect the source book and the course definition file.
2. Infer the book's own structure before generating course content: use its table of contents, repeated ordered headings, parts, chapters, sections, or fallback chunks when the source has no usable headings.
3. Build a stable source map: book metadata, inferred chapter list, paragraph indexes, and diagnostics.
4. Generate 5-7 evidence-backed insight cards per inferred chapter, either through the deterministic generator or through Codex agent-mediated semantic extraction.
5. Map chapter breakdown into `CourseBlueprint` modules.
6. Generate interaction blocks, tasks, assessments, multimodal manifests, user adaptation rules, and learning-result rules.
7. Validate output against `references/course-definition-validation.md`.
8. Deliver artifact paths, not long excerpts in chat.

## Structure Discipline

- Do not assume the book is about entrepreneurship, innovation, technology, five forces, or any fixed prior domain.
- Do not reuse a previous book's chapter template as the default structure for a new book.
- First read the source and infer the most stable top-level learning units from the book itself.
- If a book has a domain-specific frame, preserve it as that book's local structure only.
- Keep diagnostics that explain how the chapter structure was inferred so another agent can audit the decision.

## Scripts

Use `scripts/generate_course_data.py` for deterministic artifact generation, source-map export, and validation of Codex-authored semantic breakdowns.

```bash
python3 .agents/skills/book-to-course/scripts/generate_course_data.py \
  --book "<source-book.txt>" \
  --definition "Thinker 书籍到多模态课程构建定义方案 v1.0.pdf" \
  --out output/book-to-course/<book-slug> \
  --risk-level strict
```

The deterministic script ingests UTF-8 text and Markdown. Convert PDF, DOCX, or EPUB-like inputs to reviewed text/Markdown before running it.

Optional contract overrides:

- `--target-persona '{"name":"...","cognitiveLevel":"beginner|intermediate|expert","domain":"...","usageScenario":"..."}'`
- `--constraints '{"targetCardsPerChapter":5,"answerMinLen":80,"answerMaxLen":150,"transitionMinLen":15,"transitionMaxLen":30,"maxTypeRun":2}'`
- `--forbid-claim "..."` for strict blocked claims.
- `--source-map-only` to write `<out>/source-map.json` and stop before course generation.
- `--source-map-out <path>` to write the parsed source map for Codex review.
- `--breakdown-input <agent-breakdown.json>` to validate and package a Codex-authored semantic breakdown instead of generating deterministic template cards.

The script writes:

- `structured-course-data.json`: master output containing all generated data and validation.
- `course-preview.md`: human-readable preview.
- `validation-report.json`: validation results against the Thinker definition.
- `assets/*.json`: the 8 final asset families required by the definition.

## Codex Agent Semantic Extraction

Use this mode when the user wants Codex itself to perform semantic extraction without wiring an external LLM provider into the script.

1. Run source-map export first:

```bash
python3 .agents/skills/book-to-course/scripts/generate_course_data.py \
  --book "<source-book.txt>" \
  --definition "Thinker 书籍到多模态课程构建定义方案 v1.0.pdf" \
  --out output/book-to-course/<book-slug> \
  --source-map-only
```

2. Codex reads `source-map.json` and the relevant source paragraphs, then writes `output/book-to-course/<book-slug>/agent-breakdown.json`.
3. Codex acts as extractor, reviewer, and reviser:
   - Extractor: create each chapter's `centralClaim`, 5-7 insight cards, discussion questions, and evidence spans from the chapter's own paragraphs.
   - Reviewer: check every card for evidence support, duplication, summary-like wording, weak interaction, unsupported absolutes, and type rhythm.
   - Reviser: only rewrite failed cards or evidence spans; do not silently change the source chapter structure.
4. Run validation and asset packaging:

```bash
python3 .agents/skills/book-to-course/scripts/generate_course_data.py \
  --book "<source-book.txt>" \
  --definition "Thinker 书籍到多模态课程构建定义方案 v1.0.pdf" \
  --out output/book-to-course/<book-slug> \
  --breakdown-input output/book-to-course/<book-slug>/agent-breakdown.json \
  --risk-level strict
```

5. If validation fails, Codex edits `agent-breakdown.json`, records the reason in `revisionLog`, and reruns the command until strict validation passes or the unresolved blocker is reported.

The final pass condition is always the deterministic validator, not Codex's confidence. Do not publish agent-authored material that has not produced `validation.status = pass`.

## Book Breakdown Contract

- Align chapter-card fields with `book-breakdown-skill-spec.md`: `index`, `label`, `question`, `type`, `options`, `correctIndex`/`correctAnswer`, feedback, `answer`, `transition`, `evidenceSpans`, and the four card scores.
- `truefalse` cards must write `correctAnswer` as the string `"true"` or `"false"` to match the book-breakdown schema.
- Strict validation must fail on card-count, type-distribution, answer length, question length, transition length, feedback length, malformed choice/open/truefalse fields, unsupported evidence, forbidden claims, unbounded absolutes, and unsupported data-support phrases.
- Deterministic mode provides candidate diagnostics, heuristic scoring, and strict reviewer checks.
- Codex-agent mode uses `--breakdown-input` for semantic extraction without an external LLM provider; Codex must preserve `revisionLog` for failed-card rewrites.
- Fully unattended provider-backed extractor/reviewer/reviser retries remain a later enhancement, not a silent pass condition.

## Evidence Discipline

- Keep evidence snippets short. Do not copy long passages from the book.
- Every insight card must include `evidenceSpans` with `chapterIndex`, `paragraphIndex`, and a short quote.
- If a claim cannot be supported by a paragraph anchor that can be read back and shares a keyword with the card claim, the strict rule checker must fail rather than forcing a pass.
- Preserve chapter and paragraph indexes so future agents can re-open the source text.

## Validation References

Read `book-breakdown-skill-spec.md` for the chapter-card contract and `references/course-definition-validation.md` when checking whether an output matches the Thinker PDF definition.
