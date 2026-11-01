# KalExamHai: Repository Architecture

| Field | Value |
|---|---|
| Version | 0.1 |
| Framework | Next.js (App Router), TypeScript, Tailwind CSS |

---

## 1. Conventions

- Route groups `(auth)`, `(tutor)`, `(student)`, `(marketing)` organize code but do not appear in URLs. To get URL prefixes `/tutor/**` and `/student/**`, each group contains a `tutor/` or `student/` folder.
- **Dependency direction:** `app` imports `features` and `ui`; `features` imports `ui`, `lib` and `server` (via actions only); `ui` imports nothing from `features` or `server`.
- **`/ui`**: dumb, presentational, no data fetching, no domain knowledge. Props in, JSX out.
- **`/features`**: domain-specific components and hooks for tutors, students, papers, documents, etc.
- **`/server`**: server-only logic (`import 'server-only'` at the top of each file). Contains Gemini, ingestion, credits, billing, validation.
- **Server actions** live next to the route that uses them as thin `actions.ts` files. They authenticate, authorize, validate input, then call `src/server/**`. No business logic in `actions.ts`.

## 2. Full Tree

```
kalexamhai/
├─ docs/
│  ├─ brd.md
│  ├─ prd.md
│  ├─ frd.md
│  ├─ design.md
│  ├─ folder_structure.md
│  └─ rules.md
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/
│  │  ├─ 0001_extensions_and_enums.sql
│  │  ├─ 0002_profiles_roles_triggers.sql
│  │  ├─ 0003_documents_chunks.sql
│  │  ├─ 0004_papers_materials.sql
│  │  ├─ 0005_credits_orders_passes.sql
│  │  ├─ 0006_rls_policies.sql
│  │  ├─ 0007_storage_policies.sql
│  │  └─ 0008_rpc_reserve_credits_match_chunks.sql
│  ├─ tests/                         # pgTAP RLS tests
│  └─ seed.sql
├─ public/
│  └─ fonts/                         # self-hosted Inter (variable)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                  # root layout, fonts, globals
│  │  ├─ globals.css                 # tokens, base resets, print CSS import
│  │  ├─ not-found.tsx
│  │  ├─ error.tsx
│  │  │
│  │  ├─ (marketing)/
│  │  │  ├─ page.tsx                 # "/" pre-landing (Liquid Glass Logo Reveal)
│  │  │  ├─ pricing/page.tsx
│  │  │  └─ terms/page.tsx
│  │  │
│  │  ├─ (auth)/
│  │  │  ├─ layout.tsx               # minimal canvas layout (alabaster, centred card)
│  │  │  ├─ login/page.tsx           # Auth Switch (role)
│  │  │  ├─ signup/page.tsx          # Auth Switch (role)
│  │  │  ├─ callback/route.ts        # Supabase code exchange
│  │  │  └─ actions.ts               # signIn, signUp, signOut
│  │  │
│  │  ├─ (tutor)/
│  │  │  └─ tutor/
│  │  │     ├─ layout.tsx            # role guard + tutor shell (left rail, credits)
│  │  │     ├─ page.tsx              # dashboard
│  │  │     ├─ documents/
│  │  │     │  ├─ page.tsx
│  │  │     │  ├─ [id]/page.tsx
│  │  │     │  └─ actions.ts
│  │  │     ├─ generate/
│  │  │     │  ├─ page.tsx           # IAT / End-Sem / Quiz wizard
│  │  │     │  └─ actions.ts         # generatePaper, generateQuiz
│  │  │     ├─ papers/
│  │  │     │  ├─ page.tsx           # history
│  │  │     │  └─ [id]/
│  │  │     │     ├─ page.tsx        # review + edit
│  │  │     │     ├─ print/page.tsx  # print route (white, A4)
│  │  │     │     └─ actions.ts      # regenerateSubQuestion, updatePaperText
│  │  │     ├─ quizzes/[id]/page.tsx
│  │  │     ├─ credits/
│  │  │     │  ├─ page.tsx           # balance, ledger, buy packs
│  │  │     │  └─ actions.ts         # createOrder
│  │  │     └─ settings/page.tsx     # institute name, logo
│  │  │
│  │  ├─ (student)/
│  │  │  └─ student/
│  │  │     ├─ layout.tsx            # role guard + student shell (bottom bar)
│  │  │     ├─ page.tsx
│  │  │     ├─ library/
│  │  │     │  ├─ page.tsx
│  │  │     │  └─ actions.ts
│  │  │     ├─ notes/[id]/page.tsx
│  │  │     ├─ flashcards/
│  │  │     │  ├─ page.tsx
│  │  │     │  └─ [id]/page.tsx      # Holo Card deck
│  │  │     ├─ survival-kit/[id]/page.tsx
│  │  │     ├─ viva/[id]/page.tsx
│  │  │     ├─ topics/[id]/page.tsx
│  │  │     ├─ generate/actions.ts   # generateMaterial
│  │  │     ├─ pass/
│  │  │     │  ├─ page.tsx           # paywall + purchase
│  │  │     │  └─ actions.ts
│  │  │     └─ settings/page.tsx
│  │  │
│  │  └─ api/
│  │     ├─ webhooks/payments/route.ts
│  │     ├─ documents/[id]/status/route.ts
│  │     └─ health/route.ts
│  │
│  ├─ components/
│  │  ├─ ui/                         # DUMB components
│  │  │  ├─ button.tsx
│  │  │  ├─ input.tsx
│  │  │  ├─ textarea.tsx
│  │  │  ├─ select.tsx
│  │  │  ├─ panel.tsx
│  │  │  ├─ table.tsx
│  │  │  ├─ tabs.tsx
│  │  │  ├─ badge.tsx
│  │  │  ├─ progress-bar.tsx
│  │  │  ├─ toast.tsx
│  │  │  ├─ modal.tsx
│  │  │  ├─ math-text.tsx            # safe react-katex wrapper (pure, no data fetching)
│  │  │  └─ index.ts
│  │  │
│  │  ├─ features/                   # DOMAIN components
│  │  │  ├─ auth/
│  │  │  │  ├─ role-auth-switch.tsx  # wraps vendor Auth Switch
│  │  │  │  └─ auth-form.tsx
│  │  │  ├─ marketing/
│  │  │  │  └─ logo-reveal.tsx       # wraps vendor Liquid Glass Logo Reveal
│  │  │  ├─ documents/
│  │  │  │  ├─ upload-dropzone.tsx
│  │  │  │  ├─ document-table.tsx
│  │  │  │  └─ status-badge.tsx
│  │  │  ├─ papers/
│  │  │  │  ├─ paper-view.tsx        # renders PaperJson
│  │  │  │  ├─ paper-print.tsx       # print layout
│  │  │  │  ├─ question-block.tsx
│  │  │  │  ├─ sub-question.tsx
│  │  │  │  ├─ source-panel.tsx
│  │  │  │  ├─ generate-form.tsx
│  │  │  │  └─ generation-progress.tsx
│  │  │  ├─ quizzes/
│  │  │  ├─ credits/
│  │  │  │  ├─ balance-strip.tsx
│  │  │  │  ├─ pack-list.tsx
│  │  │  │  └─ ledger-table.tsx
│  │  │  ├─ student/
│  │  │  │  ├─ output-picker.tsx
│  │  │  │  ├─ notes-view.tsx
│  │  │  │  ├─ flashcard-deck.tsx    # wraps vendor Holo Card
│  │  │  │  ├─ viva-view.tsx
│  │  │  │  └─ paywall-panel.tsx
│  │  │  └─ shell/
│  │  │     ├─ tutor-shell.tsx
│  │  │     └─ student-shell.tsx
│  │  │
│  │  └─ vendor/                     # third-party, isolated, header comments required
│  │     ├─ auth-switch/             # 21st.dev @appvibed01
│  │     ├─ liquid-glass-logo-reveal/ # 21st.dev @shepovalovdenis
│  │     └─ holo-card/               # React Bits
│  │
│  ├─ lib/                           # isomorphic, no secrets
│  │  ├─ supabase/
│  │  │  ├─ client.ts                # browser client (anon key)
│  │  │  ├─ server.ts                # server client w/ cookies (RSC, actions)
│  │  │  ├─ middleware.ts            # session refresh helper
│  │  │  └─ types.ts                 # generated DB types
│  │  ├─ latex/
│  │  │  ├─ segments.ts              # split text into text/math segments
│  │  │  └─ normalize-client.ts      # lightweight normalization only
│  │  ├─ schemas/                    # Zod schemas shared client+server
│  │  │  ├─ paper.ts
│  │  │  ├─ material.ts
│  │  │  └─ forms.ts
│  │  ├─ constants/
│  │  │  └─ routes.ts
│  │  └─ utils/
│  │     ├─ cn.ts
│  │     └─ format.ts
│  │
│  ├─ server/                        # SERVER-ONLY ('server-only' import)
│  │  ├─ supabase/
│  │  │  └─ admin.ts                 # service-role client. Never import from client code
│  │  ├─ auth/
│  │  │  ├─ require-role.ts          # requireTutor(), requireStudent()
│  │  │  └─ entitlements.ts          # hasActivePass(), limits check
│  │  ├─ gemini/
│  │  │  ├─ client.ts                # SDK init from env
│  │  │  ├─ generate-json.ts         # call + JSON mode + parse
│  │  │  ├─ embed.ts
│  │  │  ├─ extract-ocr.ts           # multimodal fallback
│  │  │  ├─ prompts/
│  │  │  │  ├─ system-grounding.ts
│  │  │  │  ├─ paper-iat.ts
│  │  │  │  ├─ paper-end-sem.ts
│  │  │  │  ├─ quiz.ts
│  │  │  │  ├─ notes.ts
│  │  │  │  ├─ flashcards.ts
│  │  │  │  ├─ viva.ts
│  │  │  │  └─ version.ts
│  │  │  └─ schemas/                 # Gemini response schemas derived from Zod
│  │  ├─ rag/
│  │  │  ├─ retrieve.ts              # per-slot retrieval, MMR, unit balancing
│  │  │  ├─ context-builder.ts       # token budget, CHUNK wrappers
│  │  │  └─ chunker.ts
│  │  ├─ ingestion/
│  │  │  ├─ pipeline.ts
│  │  │  ├─ extract-pdf.ts
│  │  │  └─ normalize.ts
│  │  ├─ exam/
│  │  │  ├─ formats.ts               # single source of truth for IAT and End-Sem
│  │  │  ├─ validate-paper.ts
│  │  │  ├─ sanitize-latex.ts        # includes server KaTeX dry-render
│  │  │  └─ generate-paper.ts        # orchestrates retrieve, generate, validate, retry
│  │  ├─ materials/
│  │  │  ├─ generate-material.ts
│  │  │  └─ validators.ts
│  │  ├─ credits/
│  │  │  ├─ reserve.ts               # wraps reserve_credits RPC
│  │  │  └─ refund.ts
│  │  ├─ billing/
│  │  │  ├─ skus.ts
│  │  │  ├─ limits.ts
│  │  │  ├─ create-order.ts
│  │  │  └─ handle-webhook.ts
│  │  └─ observability/
│  │     └─ log-generation.ts
│  │
│  ├─ hooks/                         # client hooks (use-document-status, use-flashcard-queue)
│  ├─ styles/
│  │  ├─ print.css                   # A4 print rules
│  │  └─ katex-overrides.css
│  ├─ types/
│  │  └─ index.ts
│  └─ middleware.ts                  # session + role redirect (UX layer; RLS is enforcement)
│
├─ tests/
│  ├─ unit/                          # validate-paper, sanitize-latex, formats
│  ├─ integration/                   # generate-paper with mocked Gemini
│  └─ e2e/                           # Playwright: role guards, flows
├─ .env.example
├─ eslint.config.mjs
├─ next.config.ts
├─ postcss.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

## 3. Where Things Live

### Supabase clients
| File | Used by | Key |
|---|---|---|
| `src/lib/supabase/client.ts` | Client components only | anon key |
| `src/lib/supabase/server.ts` | Server components, server actions, route handlers acting as the user | anon key + user cookies (RLS applies) |
| `src/lib/supabase/middleware.ts` | `src/middleware.ts` | anon key |
| `src/server/supabase/admin.ts` | Credit reservation, webhook handlers, ingestion writes to chunks | **service role**, server-only |

### Gemini
- All Gemini code is in `src/server/gemini/` and `src/server/rag/`.
- Entry points for the UI are server actions in `actions.ts` files:
  - `(tutor)/tutor/generate/actions.ts`: `generatePaper`, `generateQuiz`
  - `(tutor)/tutor/papers/[id]/actions.ts`: `regenerateSubQuestion`, `updatePaperText`
  - `(student)/student/generate/actions.ts`: `generateMaterial`
  - `(tutor|student)/**/documents|library/actions.ts`: `createDocument` (triggers ingestion)
- Each action follows the same skeleton: `requireRole` -> Zod-parse input -> entitlement/credit check -> call `src/server/**` service -> return a typed result object (`{ ok: true, data } | { ok: false, code }`).

### Shared schema
`src/lib/schemas/paper.ts` holds the Zod `PaperJson` used by both the server validator and the client renderer, so the client never renders unvalidated data. Format numbers come only from `src/server/exam/formats.ts` (server) and are exposed to the client as a read-only derived constant if needed.

### Environment (`.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
GEMINI_API_KEY=                   # server only
GEMINI_MODEL_GENERATION=
GEMINI_MODEL_EMBEDDING=
GEMINI_EMBEDDING_DIM=768
GEN_CONTEXT_TOKEN_BUDGET=24000
GEN_MAX_RETRIES=2
PAYMENT_KEY_ID=
PAYMENT_KEY_SECRET=               # server only
PAYMENT_WEBHOOK_SECRET=           # server only
NEXT_PUBLIC_APP_URL=
```
Only variables prefixed `NEXT_PUBLIC_` may be read in client code.
