# KalExamHai: Master Brain & Execution Roadmap (`brain.md`)

> **Single Source of Truth for Project Progress, Architecture, and Iterations.**  
> _Last Updated: 2026-11-01_

---

## 1. Project Overview & Mission

**KalExamHai (`kalexamhai.vercel.app`)** is an exam-preparation and question-paper generation engine specifically engineered for Mumbai University (MU) engineering students and tutors facing the compressed "last 24 to 72 hours" exam window.

- **Core Differentiator:**
  1. **Strict Format Fidelity:** Mark breakdowns (NEP-2020 IAT 20-mark & End-Sem 60-mark) are verified programmatically in code before display; a paper that fails validation is never shown.
  2. **Context-Only RAG:** Generated strictly from user-uploaded notes and syllabi—no fabricated questions, no generic AI drift.
  3. **High Math Fidelity:** Formatted with rigorous KaTeX LaTeX rendering.
  4. **Panic-Window Economics:** Low friction UPI impulse pricing (₹49/₹99).

---

## 2. Tech Stack & Architecture Boundary Rules

- **Framework:** Next.js (App Router, Server Actions, React Server Components).
- **Styling:** Tailwind CSS with custom design tokens (no arbitrary external CSS libraries unless isolated).
- **Language:** TypeScript (strict mode, no `any`).
- **Database & Auth:** Supabase Postgres + `pgvector` (HNSW cosine ops), Supabase Auth (SSR with HTTP-only cookies), Supabase Storage.
- **AI & Embeddings:** Google Gemini API (`gemini-2.5-flash` for generation, `gemini-embedding-001` at 768 dimensions for embeddings).
- **Payments:** Razorpay (UPI, GPay, PhonePe, Cards) with idempotent signed webhook verification.
- **Server Boundary Rules:**
  - All LLM calls and credit operations live in `src/server/**` with `import 'server-only'`.
  - Client never directly talks to Gemini, nor does it perform privileged database updates.
  - Append-only ledger for all credit mutations (`credit_ledger`).

---

## 3. Brand Identity & Design System

- **Theme:** **"Claude-Azure"** (Calm, airy, premium, stress-reducing, light-first).
- **Color Tokens:**
  - `canvas`: `#F9F9F6` (warm alabaster page background)
  - `surface`: `#FFFFFF` (crisp white cards, panels, inputs)
  - `ink`: `#1F2937` (slate dark body text)
  - `ink-muted`: `#6B7280` (subtitles and metadata)
  - `azure` / `azure-strong`: `#3B82F6` / `#2563EB` (electric blue accent, matching logo **E**)
  - `azure-soft`: `#EFF6FF` (ice-blue badge/active states)
  - `hairline`: `#E7E5E0` (faint dividers)
- **Typography:**
  - Interface: **Inter** (generous line spacing, clean scale).
  - Exam Paper Preview & Print: **Serif (Times New Roman)** for authentic university paper styling.
- **Brand Monogram:** Official vector from `docs/keh-logo.svg` (`K` & `H` in `#282E3C`, `E` in `#1F76AB`).
- **Visual Wow Elements:**
  - Liquid Glass Logo Reveal on pre-landing (`/`).
  - 3D Holo Cards on student flashcards.
  - Role Switcher on `/login` and `/signup`.
- **Strict Design Mandate (NO PILLS):**
  - STRICTLY AVOID PILL SHAPES (`rounded-full`) for tags, badges, buttons, banners, or chip containers anywhere across the site.
  - All tags and badges must use structured rectangular geometry with `rounded-[6px]` or clean text labels without pill containers. Only circular avatars and indicator dots may be round.

---

## 4. Monetization & Free Launch Strategy

### Free Launch Phase (Initial Viral Rollout — Active Policy)

To drive exponential WhatsApp word-of-mouth among Mumbai University colleges without paywall friction (and while Razorpay merchant KYC is pending bank verification):

- **Daily Free Quota (All Users):**
  - **3 Free Generations Per Day** for both Students and Tutors.
  - Automatically resets every day at **12:00 AM IST (Midnight)**.
- **1 Premium Trial / Day:**
  - **Tutors:** 1 free generation of the 60-mark End-Semester Blueprint per day (with unlimited IAT 20M papers within the 3/3 daily cap).
  - **Students:** 1 free generation of the Last-Minute Survival Kit or Viva Defense per day (with unlimited 3D Flashcards & Quick Notes within the 3/3 daily cap).
- **Quota Exhaustion UX:**
  - Friendly countdown modal: *"You've used today's 3 free generations! Resets tonight at 12:00 AM IST."*
  - Pre-wired upgrade triggers ready for UPI payment activation.

---

### Subsequent Monetization Phase (Razorpay UPI Integration — On Merchant KYC Approval)

#### Students (Freemium + One-Time Passes via UPI)

- **Free Tier:** 3 generations/day (with 1 premium trial).
- **Exam-Night Emergency Pass (₹49):** 24 hours of unlimited access to Last-Minute Survival Kit, Viva Prep, Notes, and Flashcards (fair-use cap: 20 generations).
- **Semester Pass (₹99):** Full access across all subjects, units, Likely Topics, Survival Kits, and unlimited flashcards for the entire semester (fair-use cap: 50 generations/day).

#### Tutors (Freemium Bonus + Credit Packs)

- **Free Tier:** 3 generations/day (IAT & 1 End-Sem trial).
- **Signup Bonus:** 2 Free Credits automatically awarded on registration.
- **Actions Cost:**
  - IAT Paper (20 marks) = 1 credit
  - End-Sem Paper (60 marks) = 2 credits
  - MCQ Quiz (15 questions) = 1 credit
  - Sub-question re-roll (up to 5x) = FREE (0 credits)
  - PDF Export & Print = FREE (0 credits)
- **Prepaid Packs:**
  - Starter (5 Credits) = ₹49 (~₹9.80/credit)
  - Standard (25 Credits) = ₹199 (~₹8.00/credit)
  - Pro (60 Credits) = ₹399 (~₹6.65/credit)

---

## 5. Master Roadmap & Execution Phases

### **Phase 1: Project Foundation, Liquid Glass Logo Reveal & Pre-Landing Page**

- [x] Initialize Next.js project with App Router, TypeScript, Tailwind CSS, Lucide icons, Framer Motion.
- [x] Setup theme tokens in `globals.css` (`canvas`, `surface`, `ink`, `azure`, `azure-strong`, `hairline`, `shadow-card`, glassmorphic backdrops).
- [x] Import official `docs/keh-logo.svg` into public assets (`/keh-logo.svg`).
- [x] Build the **Liquid Glass Logo Reveal** component:
  - Glassmorphic canvas with refraction, ambient lighting, dynamic shimmer, and specular edges.
  - 2.8s entrance with smooth vector path draw.
  - Instant "Skip" button and `prefers-reduced-motion` static fallback.
- [x] Build the Pre-Landing hero (Minimalist Symmetrical Layout):
  - Liquid Glass WebGL shader ripples the larger KEH monogram on `#F9F9F6` alabaster canvas and stays anchored dead-center.
  - Below the logo: Brand title "KalExamHai" and single line: _"Turn your notes into tomorrow's exam paper."_
  - Two symmetrical rectangular tabs (NO pills, subtle elevation & micro-press on hover/active):
    - Primary Azure: `[ Sign in as Student ]` (`/login?role=student`)
    - Surface White: `[ Sign in as Tutor ]` (`/login?role=tutor`)
  - Absolute corner controls ("Skip" / "Replay") and absolute bottom footer to maintain exact mathematical vertical & horizontal symmetry.
  - Production build (`npm run build`) verified with exit code 0.

### **Phase 2: Authentication, Dual-Role Switcher & Admin Engine**

- [x] Setup Supabase SSR auth client (`@supabase/ssr`) with secure cookies (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`).
- [x] Create `/login` and `/signup` routes powered by official vendor **Auth Switch** (`@appvibed01` on 21st.dev):
  - Isolated in [`src/components/vendor/auth-switch/`](file:///c:/Users/ASUS%20HN116WS/OneDrive/Desktop/KalExamHai/src/components/vendor/auth-switch/).
  - Themed with Claude-Azure design tokens (`#F9F9F6` canvas, `#FFFFFF` surface, `#2563EB` Azure gradient, zero pills).
  - Seamless animated sliding transition between Sign In and Sign Up modes.
  - Integrated **Dual-Role Switcher** (Student vs Faculty/Tutor) and Supabase Auth SSR wiring with Google OAuth & password auth.
- [x] Supabase database schema migration (`supabase/migrations/20261031_auth_schema.sql`):
  - `profiles` table with immutable role constraints & RLS.
  - `credit_ledger` append-only ledger with atomic `reserve_credits()` and `refund_credits()` stored procedures.
  - `on_auth_user_created` trigger with automatic 2-credit signup bonus for tutors.
- [x] Master Admin provisioning (`rehxnnn0@gmail.com`):
  - Automated trigger assigns `admin` role with 9,999 credits and permanent semester pass.
  - Elevated `AdminBar` component allowing one-click toggle between `/tutor` and `/student` portals.
- [x] Middleware route guards enforcing role boundaries on `/tutor/**`, `/student/**`, and `/admin/**`.
- [x] Next.js 16 Partial Prerendering (PPR) compatibility with `<Suspense>` boundaries; verified with `npm run build` (exit code 0).

### **Phase 3: Document Ingestion & pgvector RAG Pipeline**

- [x] Document upload UI (PDF, TXT, MD, pasted text up to 25MB) powered by official vendor **Illos Isometric File Uploads Dropzone** (`src/components/vendor/upload-dropzone/index.tsx`).
- [x] Supabase Storage private bucket configuration for document files with user-folder isolated RLS (`supabase/migrations/20261101_documents_rag.sql`).
- [x] Server-side text extraction & token-bounded chunking pipeline with Mumbai University syllabus unit/module detection (`src/server/ingestion/`).
- [x] Hybrid PDF text extractor with `pdf-parse` v2 and automatic fallback to Gemini 2.5 Flash multimodal OCR for scanned notes.
- [x] Vector embedding generation via Google Gemini SDK (`gemini-embedding-001` configured for 768 dimensions in `src/server/gemini/embed.ts`).
- [x] Store embeddings in Supabase `pgvector` with HNSW cosine index and `match_chunks` semantic retrieval procedure.
- [x] Real-time document library management: instant dynamic refetching (`getUserDocumentsAction`), cache invalidation (`revalidatePath`), and live status badges (`src/components/features/documents/`).
- [x] Live Ingestion Verified: `01 knapsack.pdf` successfully parsed, chunked, and embedded into pgvector.
- [x] Dedicated Document Library routes for Tutors (`/tutor/documents`) and Students (`/student/library`) with 1-click `[ Generate Paper ]` action triggers on ready documents.

### **Phase 4: Tutor Engine (NEP-2020 Question Paper Generator & PDF Export)**

- [x] Single Source of Truth Blueprint (`src/server/exam/formats.ts`):
  - IAT (20 Marks): Q1 compulsory (2M x 5), Q2 & Q3 internal choice (5M x 2 each).
  - End-Sem (60 Marks): Mumbai University 6-question blueprint totaling 60 attemptable marks.
- [x] Strict NEP-2020 Domain Validator (`src/server/exam/validate-paper.ts`) strictly validating mark distribution, option counts, and syllabus chunk citations before displaying papers.
- [x] KaTeX LaTeX Sanitizer (`src/server/exam/sanitize-latex.ts`) verifying equation escape sequences and rendering via `<MathText />` (`src/components/ui/math-text.tsx`).
- [x] Double-entry Credit Reservation & Auto-Refund (`src/server/credits/reserve.ts`, `src/server/credits/refund.ts`):
  - IAT: 1 credit; End-Sem: 2 credits.
  - Automatic refund on validation failure.
- [x] Paper Generator Form (`src/components/features/papers/generate-wizard.tsx` at `/tutor/generate`):
  - Ingested document selector with auto-selection of ready syllabus notes.
  - Format selector (IAT 20M vs End-Sem 60M), difficulty level, subject, course code.
  - Multi-step live progress indicator.
- [x] Interactive Paper Review (`src/components/features/papers/paper-view.tsx` at `/tutor/papers/[id]`):
  - Pure KaTeX equation rendering.
  - Sub-question re-roll: Free 0-credit single sub-question re-roll from syllabus chunks (`regenerateSubQuestionAction`).
  - Inline question text editing (`updateSubQuestionTextAction`).
  - 1-click clipboard copy of formatted examination text.
- [x] Authentic Mumbai University A4 Printable Sheet (`src/components/features/papers/paper-print.tsx` at `/tutor/papers/[id]/print`):
  - Times New Roman serif typography, official MU exam header, candidate instructions, mark boxes, and `@media print` 15mm margin controls.
- [x] Generated Papers Management (`src/app/tutor/papers/page.tsx`, `src/components/features/papers/paper-history-table.tsx`):
  - List, search, review, print, and delete previously generated papers.
- [x] Universal Generator Access: Available directly from Student Dashboard (`/student`), Knowledge Library rows, and Tutor Workspace (`/tutor`).
- [x] Strict NO PILLS geometry enforced across badges, buttons, and cards. Next.js 16 PPR production build verified with exit code 0.

### **Phase 5: Student Cramming Suite (Built for the Last 24 Hours)**

- [x] Database Schema & RLS Policies: `cram_artifacts` table supporting flashcards, quick notes, viva prep, and survival kits (`supabase/migrations/20261101_student_cram_schema.sql`).
- [x] Zod Schemas & Strict Data Contracts: `FlashcardsPayloadSchema`, `QuickNotesPayloadSchema`, `VivaPrepPayloadSchema`, `SurvivalKitPayloadSchema` (`src/lib/schemas/cram.ts`).
- [x] AI RAG Pipeline: Gemini 2.5 Flash context orchestration with KaTeX formula formatting and structured JSON output (`src/server/cram/generate-cram-artifact.ts`).
- [x] **3D Holo Flashcards**: Interactive 3D perspective card with gyro/mouse parallax reflection, smooth 3D flip animation, and active recall deck sorting ("Mastered" vs "Need Revision") (`src/components/features/cram/holo-card-3d.tsx`, `flashcard-deck.tsx`).
- [x] **Quick Notes & Formulas**: High-density summaries, textbook definitions, step-by-step algorithms, and exam hall trap warnings with print/copy actions (`src/components/features/cram/quick-notes-view.tsx`).
- [x] **Examiner Viva Prep**: Oral exam defense Q&A triaged into Easy, Medium, and Tricky professor trap alerts with counter-defenses (`src/components/features/cram/viva-prep-view.tsx`).
- [x] **Last-Minute Survival Kit**: 12–24h panic-window roadmap, expected marks rankings, and pass guarantee checklist (`src/components/features/cram/survival-kit-view.tsx`).
- [x] Student Cram Suite Routes: Universal generation wizard (`/student/cram/new`), dynamic artifact viewer (`/student/cram/[id]`), and active dashboard card hub (`/student`).
- [x] Strict NO PILLS geometry maintained across cards, badges, and buttons. Production build verified with exit code 0.
- [x] **Universal Navigation Tab System & Layouts** (`src/components/navigation/workspace-nav.tsx`, `src/app/tutor/layout.tsx`, `src/app/student/layout.tsx`):
  - Persistent, responsive horizontal navigation tabs across all Faculty routes (`Dashboard`, `Knowledge Library`, `Generate Paper`, `My Papers`) and Student routes (`Cram Hub`, `My Notes`, `New Cram Session`, `Practice Papers`).
  - Integrated 1-click Workspace Switcher between Faculty and Student modes.
  - Universal `<BackButton />` navigation on generator wizards, paper review views, and cram study views.
  - Live credit counter display with real-time decrement from immutable `credit_ledger`.
- [x] **Dual-Layer Security & Data Isolation Audit**:
  - PostgreSQL Row Level Security (RLS) verified across `documents`, `document_chunks`, `generated_papers`, `cram_artifacts`, `credit_ledger`, and `profiles`.
  - Non-admin access strictly blocked from `/admin`, Master Admin bar hidden, and server actions hardened with `isAdminEmail()`.
- [x] **Multimodal Ingestion for Handwritten Notes**:
  - `src/server/ingestion/extract-text.ts` verified with automatic Gemini 2.5 Flash Multimodal OCR fallback for scanned and handwritten notebook PDFs.

### **Phase 6A: Daily Free Quota System & Launch Mode**

- [x] Daily Quota Engine (`src/server/credits/daily-quota.ts`):
  - IST timezone midnight calculation (12:00 AM IST reset).
  - Track daily generations by user ID across `generated_papers` and `cram_artifacts`.
  - Cap at 3 generations / day with 1 premium trial (End-Sem 60M for Tutors / Survival Kit for Students).
  - Admin permanent bypass (`isUnlimited: true`).
- [x] UI Daily Quota Indicators:
  - Header badge in `WorkspaceNav`: `⚡ 3/3 Free Left Today` (or `⚡ Unlimited (Admin)`).
  - Live remaining counters on `/tutor/generate` and `/student/cram/new`.
  - Premium trial badge indicators on End-Sem and Survival Kit cards (`1 Free Daily Trial` vs `1/1 Daily Trial Used`).
- [x] Friendly Daily Quota Modal & Warnings:
  - Clear countdown notice to midnight reset when limit is reached.
  - Celebratory launch banners on Faculty and Student dashboards.
  - Pre-wired upgrade CTAs for future payment activation.

### **Phase 6B: Razorpay UPI Payments & Entitlement Webhooks (On KYC Approval)**

- [ ] Razorpay SDK server integration (`razorpay` package).
- [ ] Order creation server action for student passes (₹49 / ₹99) and tutor credit packs (₹49 / ₹199 / ₹399).
- [ ] Razorpay Checkout modal (UPI intent: GPay, PhonePe, Paytm, QR).
- [ ] Webhook Route Handler:
  - Signature verification with `PAYMENT_WEBHOOK_SECRET`.
  - Idempotent order processing on `gateway_payment_id`.
  - Activation of `passes` or addition of `credit_ledger` entries.

### **Phase 7: Mobile Polish, WhatsApp Rich Sharing & Legal Compliance**

- [x] **Printable Document & PDF Filename Exact Matching** (`src/app/tutor/papers/[id]/print/page.tsx`, `src/components/features/papers/paper-print.tsx`, `src/server/exam/generate-paper.ts`):
  - Guaranteed exact title preservation: When a tutor inputs the subject, exam title, course code, and institute name before generating the paper, those exact values are stored and rendered directly on the printable A4 document.
  - Dynamic `generateMetadata` and `document.title` synchronization: Setting `document.title` to the exact user input ensures browser "Save as PDF" defaults to the user's chosen title rather than a generic fallback.
- [x] **Role Switcher Scoped Exclusively to Admins** (`src/components/navigation/workspace-nav.tsx`):
  - Restricted the "Switch to Student / Faculty Mode" toggle in desktop and mobile navigation to users with `isAdmin === true`. Standard student and tutor accounts are locked to their respective dedicated experiences.
- [x] **OpenGraph & WhatsApp Social Media Cards** (`src/app/opengraph-image.tsx`, `src/app/layout.tsx`):
  - Dynamic 1200x630 branded social preview image generated natively via `next/og` (with `cacheComponents` compatibility).
  - Comprehensive OpenGraph and Twitter card metadata for high-converting previews when students share links in college WhatsApp groups.
- [x] **PWA Mobile Web App Manifest** (`src/app/manifest.ts`):
  - Configured for "Add to Home Screen" on Android Chrome and iOS Safari.
- [x] **Mobile Viewport & Touch Optimization (360px–400px)**:
  - Added `-webkit-overflow-scrolling: touch` and hidden scrollbar utilities (`globals.css`) for buttery horizontal navigation tabs.
  - Flashcard deck mobile touch action labels (`Review`, `Flip`, `Mastered`).
  - KaTeX mathematical display equations set to `overflow-x-auto max-w-full text-center` to eliminate horizontal page breakages.
- [x] **Official Legal & Payment Compliance Pages**:
  - `/terms`: Terms and Conditions governing university practice and academic integrity.
  - `/privacy`: Privacy Policy detailing document isolation, RLS encryption, and zero foundation model training.
  - `/refund-policy`: Transparent digital refund guidelines.
  - `/contact`: Dedicated student and faculty support desk with guaranteed response turnaround.
  - Footer navigation seamlessly integrated into Pre-Landing, Student, and Faculty dashboards.

### **Phase 8: GitHub Repository & Vercel Production Deployment**

- [x] **Git Repository Initialization & Remote Sync**:
  - Initialized git repository on branch `main`.
  - Configured remote: `https://github.com/rehan-1002/KalExamHai.git`.
  - Pushed production codebase cleanly (110 files, 21,970 insertions) with secrets strictly secured in `.gitignore`.
- [x] **Ultra-Fidelity Designer Animated README** (`README.md`):
  - Crafted comprehensive technical and visual documentation with dynamic shields, architecture diagrams (Mermaid), dual-persona feature matrix (Students vs Faculty), NEP-2020 format fidelity breakdown, daily free quota rules, and step-by-step local setup.
- [ ] Connect repository to Vercel and import project.
- [ ] Paste environment variables into Vercel dashboard.
- [ ] Add live domain to Supabase Auth URL Configuration.

---

## 6. Current Status & Phase Tracking

| Phase        | Milestone                                         | Status          | Target Date |
| ------------ | ------------------------------------------------- | --------------- | ----------- |
| **Phase 1**  | Foundation, Liquid Glass Reveal & Landing Page    | **COMPLETED** ✓ | 2026-10-31  |
| **Phase 2**  | Supabase Auth, Dual-Role Switcher & Admin Engine  | **COMPLETED** ✓ | 2026-10-31  |
| **Phase 3**  | Document Ingestion & RAG Pipeline                 | **COMPLETED** ✓ | 2026-11-01  |
| **Phase 4**  | Tutor Engine & NEP-2020 Paper Generator           | **COMPLETED** ✓ | 2026-11-01  |
| **Phase 5**  | Student Cramming Suite & Holo Flashcards          | **COMPLETED** ✓ | 2026-11-01  |
| **Phase 6A** | Daily Free Quota System (3/day + 1 Trial)         | **COMPLETED** ✓ | 2026-11-01  |
| **Phase 7**  | Mobile Polish, WhatsApp Sharing & Legal Compliance| **COMPLETED** ✓ | 2026-11-01  |
| **Phase 8**  | Vercel Production Deployment & Custom Domain      | **NEXT**        | Today       |
| **Phase 6B** | Razorpay UPI Payments (Deferred for KYC)          | PENDING KYC     | Later       |

---

## 7. Plan for Phase 8: Vercel Production Deployment

1. **Verify Production Secrets & Keys**:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   - `GEMINI_API_KEY` (ensure high quota and gemini-2.5-flash / gemini-embedding-001 access).
2. **Deploy to Vercel**:
   - Push code or link GitHub repository to Vercel project.
3. **Connect Custom Domain**:
   - Add DNS records (CNAME / A records) for live production URL.
   - Informative countdown to midnight reset.
