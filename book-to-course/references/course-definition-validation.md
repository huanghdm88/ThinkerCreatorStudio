# Thinker Course Definition Validation

Use these checks when validating Book-to-Course output against `Thinker 书籍到多模态课程构建定义方案 v1.0.pdf`.

## Required Process

The output should reflect the PDF's execution flow:

1. Input book text and chapter structure.
2. Use book breakdown to generate 5-7 insight cards per chapter.
3. Label each card with content type.
4. Map chapters into course modules.
5. Match content types to interaction types.
6. Rewrite examples/questions through four user need weights.
7. Generate video prompts, audio scripts, and reading entrances.
8. Generate H5/course presentation structure.
9. Generate learning profile, certificate, and service recommendation.
10. Pass quality gates before release.

## Six Quality Gates

| Gate | Required Check |
| --- | --- |
| Evidence | Every insight card has a source anchor. |
| Accuracy | Output does not distort the author's claim. |
| Interaction | Interactions create cognitive conflict, not simple Q&A. |
| Rhythm | Question types are not overly repetitive. |
| User adaptation | Copy and examples adapt to the four user needs. |
| Service handoff | Ending can reasonably recommend follow-up services or next paths. |

## Score Thresholds

- `qualityScore >= 0.82`
- `chapterCoverageScore >= 0.82`
- `narrativeFlowScore >= 0.78`
- `selfCheckPassRate >= 0.88`

## Eight Final Asset Families

| Asset | Use |
| --- | --- |
| `book_breakdown_json` | Base course-generation data. |
| `chapter_course_blueprint` | Defines M1-M6 or chapter course structure. |
| `knowledge_atom_bank` | Supports cards, questions, and agent use. |
| `interaction_question_bank` | Supports H5 learning flow. |
| `video_prompt_list` | Supports video generation such as Jimeng or Seedance. |
| `audio_blog_scripts` | Supports low-barrier learning entry. |
| `user_adaptation_rules` | Rewrites copy/questions by four need weights. |
| `certificate_recommendation_rules` | Supports downstream service conversion. |

## Design Principles

- Do not make a summary: every content item should become an interactive learning task.
- Do not hard-classify users: use four need weights.
- Do not decorate with video: video must lead to judgement, choice, or expression.
- Do not leave the course isolated: the ending must connect to certificate, agent, activity, mentor, project, or other next path.
- Do not detach from the source: every insight must trace back to evidence anchors.

