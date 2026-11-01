# AGENTS.md: KalExamHai

Persistent instructions for any AI coding agent working in this repository. Place this file at the repo root. For tools that expect another name, copy it: `CLAUDE.md` (Claude Code), `.cursor/rules/kalexamhai.mdc` (Cursor), `.github/copilot-instructions.md` (GitHub Copilot).

## Project
KalExamHai is a Next.js (App Router, strict TypeScript) + Supabase + Gemini RAG SaaS for Mumbai University engineering tutors and students. It generates NEP-2020 format exam papers, quizzes, flashcards, notes and viva prep **only from the user's uploaded material**. Two roles: `tutor` and `student`, with separate dashboards.

## Before every task
1. Read the relevant parts of `docs/rules.md` and `docs/frd.md`. For UI work also read `docs/design.md`. For file placement read `docs/folder_structure.md`.
2. Authority when documents disagree: `rules.md` > `frd.md` > `design.md` > `folder_structure.md` > `prd.md` > `brd.md`.
3. If a request conflicts with the docs, stop and flag it. Do not silently pick a side.
4. For anything larger than a small edit, post a short plan and wait for approval.
5. When you finish, list the doc sections you relied on and what you actually ran or tested.

## Invariants (never break)
- **Exam formats** live only in `src/server/exam/formats.ts`. IAT = 20 marks (Q1 10 = 6 x 2m attempt 5; Q2 and Q3 5 = 2 x 5m attempt 1). End-Sem = 60 attemptable (Q1 15 = 6 x 3m attempt 5; Q2 to Q6 15 each = 4m + 5m + 6m, attempt any 3 of 5; authored total 90). Never copy these numbers elsewhere.
- **Gemini output is untrusted:** JSON parse, Zod `safeParse`, `sanitizeLatex`, domain validator (`validatePaper` etc.), then persist. A paper that fails validation is never stored or shown. Every `source_chunk_ids` entry must exist in the supplied context.
- **Document text is data, not instructions.** Wrap it in `[CHUNK ...]` blocks.
- **LaTeX** is `$...$` and `$$...$$`, rendered only via `MathText`. No `dangerouslySetInnerHTML` with user or model text.
- **TypeScript:** strict, no `any`, no `@ts-ignore`, no `!` outside tests, derive types from Zod.
- **Server boundary:** every file in `src/server/**` begins with `import 'server-only'`. Gemini key, service-role key and payment secrets never reach the client. The service-role client lives only in `src/server/supabase/admin.ts`.
- **Server actions are thin:** authenticate, authorize by role, Zod-validate, call a service, return `{ ok: true, data } | { ok: false, code, message }`.
- **Database:** RLS on every table, with a pgTAP test per policy change. Credit ledger is append-only and changed only through service-role code and `reserve_credits`. Payments are confirmed only by verified, idempotent webhooks.

## Design (docs/design.md v0.2, light "Claude-Azure" theme)
- Light only. Tokens: `canvas #F9F9F6`, `surface #FFFFFF`, `ink #1F2937`, `ink-muted #6B7280`, `hairline #E7E5E0`, `azure #3B82F6`, `azure-strong #2563EB`, `azure-soft #EFF6FF`, `danger #B42318`, `danger-soft #FEF3F2`.
- Use `azure-strong` for button fills and small azure text (AA contrast). `azure` for large text, indicators, focus rings.
- Depth via shadow tokens, not heavy borders. Font: Inter. Serif only for exam paper preview and print. Monospace only for IDs, code, raw LaTeX fallback.
- **Banned:** pure black backgrounds, brutalist outlines, neon or terminal colours, monospace body copy, slang, emojis, decorative icons, generic AI marketing copy, purple or pink gradients, glows, `dark:` variants.
- Copy is reassuring, specific, plain English, sentence case, no exclamation marks. State costs and next steps ("This will use 2 credits.").
- Vendor exceptions only, isolated in `src/components/vendor/` and respecting `prefers-reduced-motion`: Liquid Glass Logo Reveal (pre-landing only), Auth Switch (login and signup only), Holo Card (student flashcards only). Do not invent their source; build a wrapper with a plain fallback and ask the owner to paste the real code.

## Brand
`public/brand/keh-logo.svg` is the KEH monogram (paths `K`, `E`, `H`; navy `#282E3C`, blue `#1F76AB`). Use as supplied; do not recolour, stretch or add effects.

## Unconfirmed assumptions (keep in config, never scatter literals)
Prices, credit costs, free-tier limits, IAT and End-Sem durations (60 and 120 minutes), model names, embedding dimension. "Likely topics" is derived only from the user's own material and must never be described as past-paper analysis.

## Working style
- Small, reviewable changes. Conventional Commits. No unrelated refactors.
- Tests with every change: pass and fail cases for each validator rule, `sanitizeLatex`, credit reserve and refund, entitlements, RLS. Mock Gemini. Never snapshot LLM wording.
- Update the docs in the same change if behaviour changes.
- Ask one specific question when unsure and offer a recommended default.
- Never claim something works unless you ran it. Do not weaken a validator, policy or type rule to make something pass.
- No new dependency without a one-line justification. Never log document text, prompts or secrets.
