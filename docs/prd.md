# KalExamHai: Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Version | 0.1 |
| Depends on | `brd.md` |
| Feeds | `frd.md`, `design.md` |

Priority: **P0** = MVP blocker, **P1** = MVP if time permits, **P2** = post-MVP.

---

## 1. Product Principles

1. **Context-only.** Every generated item must come from the user's uploaded material.
2. **Format is law.** Mark structure is validated in code. A paper that fails validation is never shown.
3. **Built for the last 24 hours.** Few clicks, fast results, mobile-first for students.
4. **Two roles, two worlds.** Tutors and students never see each other's dashboards or features.

## 2. Personas

**Tutor (Priya, 29).** Teaches Engineering Mathematics and Engineering Mechanics to three batches. Needs a fresh IAT paper per batch per cycle. Wants control over difficulty and unit coverage. Prints papers.

**Student (Rohan, 19).** Second-year, commuting by train, studying on his phone two days before End-Sem. Has a 90-page PDF from his professor and photos of notes. Wants a short plan of what to read, flashcards for the train, and viva questions for practicals.

## 3. Feature Requirements

### 3.1 Shared

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| SH-01 | Pre-landing page | P0 | Liquid Glass Logo Reveal plays once, then a single CTA leads to auth. Skippable. Respects reduced-motion. |
| SH-02 | Role-based signup and login | P0 | User picks Tutor or Student via Auth Switch. Role is stored on the profile and cannot be changed by the user afterward. |
| SH-03 | Document upload | P0 | Accepts PDF, TXT, MD (up to 25 MB, assumption). Shows status: uploaded, extracting, embedding, ready, failed. |
| SH-04 | Document library | P0 | List, rename, delete (deletes chunks and storage object). Shows subject, pages, status. |
| SH-05 | Unit/chapter scoping | P1 | User can limit generation to selected documents and, where detected, selected units. |
| SH-06 | Pasted-text input | P1 | User can paste notes as text instead of uploading a file. |
| SH-07 | Image/handwritten notes OCR | P2 | Photo upload extracted via multimodal model. |
| SH-08 | Report bad output | P1 | One-click report on any generated item with a reason code. |

### 3.2 Tutor

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| T-01 | Credit balance and purchase | P0 | Balance visible in header. Purchase of packs via gateway. Ledger visible. |
| T-02 | Generate IAT (20 marks) | P0 | Output exactly matches the IAT structure: Q1 = 10 marks (6 sub-questions of 2 marks, attempt 5), Q2 = 5 marks (2 sub-questions, attempt 1), Q3 = 5 marks (2 sub-questions, attempt 1). |
| T-03 | Generate End-Sem (60 marks) | P0 | Q1 compulsory = 15 marks (6 sub-questions of 3 marks, attempt 5). Q2 to Q6, each 15 marks with three sub-questions of 4, 5 and 6 marks. Instruction: attempt any 3 of Q2 to Q6. |
| T-04 | Generation parameters | P0 | Select documents, difficulty (easy/medium/hard mix), optional unit emphasis, optional Bloom-level mix. |
| T-05 | Answer key | P0 | Each sub-question has a model answer or marking scheme. Toggle to include or exclude on export. |
| T-06 | Source traceability | P0 | Each sub-question lists the source chunks (document, page). Tutor can open the source passage. |
| T-07 | Paper editing | P1 | Edit question text inline (LaTeX preview). Edits preserve mark structure; marks are not editable. |
| T-08 | Regenerate one sub-question | P1 | Regenerates a single sub-question at the same marks, within the same context. Free, capped at 5 per paper. |
| T-09 | PDF export | P0 | Print-quality A4 PDF with institute header, instructions, questions, optional answer key. |
| T-10 | Quiz generation | P0 | MCQ quiz (up to 15 questions) with answers and one-line explanations. Exportable and viewable. |
| T-11 | Paper history | P0 | List of past papers with format, date, source documents; reopen and re-export. |
| T-12 | Institute branding | P1 | Institute name and optional logo on the paper header. |

### 3.3 Student

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| S-01 | Quick notes | P0 | Condensed, headed notes per selected document or unit. Formulas in LaTeX. |
| S-02 | Flashcards | P0 | Deck of front/back cards from the material, shown with the Holo Card component. Free tier capped. |
| S-03 | Last-minute survival kit | P0 (paid) | One bundle: top formulas, definitions, must-know derivations, a 1-page revision order, and a 20-card flashcard set, ranked by emphasis in the source. |
| S-04 | Viva Prep | P0 (paid) | Questions grouped Easy, Medium, Tricky (examiner-style follow-ups). Each has a short model answer and a "likely follow-up". |
| S-05 | Likely Topics | P1 (paid) | Topic list ranked by weight in the uploaded material. Labelled as derived from the student's own material. |
| S-06 | Flashcard study mode | P1 | Flip, mark known/unknown, re-queue unknown. Progress stored. |
| S-07 | Semester pass purchase | P0 | One-time payment; entitlement unlocks paid features immediately after webhook confirmation. |
| S-08 | Free-tier limits and upsell | P0 | Limit messages are specific ("2 of 2 uploads used this month"), never generic marketing. |
| S-09 | Offline-friendly export | P2 | Save notes or flashcards as PDF. |

### 3.4 Non-Functional Requirements

- **Latency:** IAT p95 at most 45s, End-Sem p95 at most 90s, notes and flashcards p95 at most 30s.
- **Mobile-first:** all student screens usable at 360px width; tutor screens usable at 768px and up.
- **Low bandwidth:** no autoplaying media outside the pre-landing; pages under 200 KB JS on student routes where feasible.
- **Accessibility:** WCAG AA contrast, full keyboard navigation, reduced-motion support for the mandatory animated components.
- **Privacy:** uploaded documents are private per user, never used to answer another user's request.
- **Reliability:** generation is idempotent per request ID; no double charge on retries.

## 4. User Flows

### 4.1 Entry: Pre-landing to Dashboard

```
/  (pre-landing)
  Liquid Glass Logo Reveal plays (3s max, skippable)
  Single CTA: "Enter"
    |
    v
/login or /signup  (Auth Switch)
  Choose role: TUTOR | STUDENT
  Email + password or magic link (Google OAuth optional, P1)
    |
    +-- new user  -> profile created with chosen role -> onboarding
    +-- returning -> role read from profile -> redirect
    |
    v
Role redirect (middleware)
  TUTOR   -> /tutor
  STUDENT -> /student
Cross-role URL access -> redirect to own dashboard
```

### 4.2 Tutor Flow: First Paper

```
/tutor (dashboard: credits, recent papers, "New paper")
  -> /tutor/documents  upload PDF -> status: ready
  -> /tutor/generate
       1. Pick format: IAT (20) | END-SEM (60)
       2. Pick documents (and units, optional)
       3. Set difficulty mix
       4. Confirm: "Costs 1 credit" -> Generate
  -> Progress screen (steps: retrieving, drafting, validating)
  -> /tutor/papers/[id]  review screen
       - Paper preview with LaTeX
       - Source panel per sub-question
       - Edit / regenerate sub-question
  -> Export PDF (with or without answer key)
```
Failure branch: validation fails after retries, the user sees "Generation failed. 1 credit refunded." and a retry button.

### 4.3 Student Flow: Last-Minute Kit

```
/student (dashboard: "Exam in 2 days?" quick actions, library)
  -> /student/library  upload PDF/notes
  -> Choose output: Quick Notes | Flashcards | Survival Kit | Viva Prep
       Free user selects Viva Prep or Survival Kit -> paywall screen
       (states price, what unlocks, one-tap UPI)
  -> Output screen
       Flashcards: Holo Card deck, flip, known/unknown
       Viva: Easy / Medium / Tricky tabs
  -> Save to history
```

### 4.4 Payment Flow

```
Select pack or pass
  -> Server creates order (idempotency key)
  -> Gateway checkout (UPI / card)
  -> Gateway webhook (signature verified) -> credits added or pass activated
  -> Client polls entitlement, shows confirmation
Webhook is the source of truth. Redirect return alone never grants access.
```

## 5. Content Rules for Generated Output

1. Use only provided context. If context is insufficient for a requested mark weight, return a coverage warning, never fabricate.
2. Math in LaTeX: inline `$...$`, display `$$...$$`.
3. Questions must be self-contained and answerable by a student who studied the material.
4. Viva questions are phrased as an external examiner would ask them, including follow-ups.
5. Difficulty labels must reflect actual reasoning demand: Easy = recall, Medium = application, Tricky = conceptual trap or edge case.

## 6. Release Plan

| Phase | Contents |
|---|---|
| Alpha (internal, 2 weeks) | SH-02, SH-03, SH-04, T-02, T-03, T-06, T-09 |
| Closed beta (20 tutors, 100 students) | + T-01, T-04, T-05, T-10, T-11, S-01, S-02, S-07, S-08 |
| Public MVP | + S-03, S-04, SH-01 polish, T-07, T-08 |
| Post-MVP | S-05 refinement, SH-07, S-09, institution plans |

## 7. Out of Scope (restated)

Previous-year-question analytics, social features, in-app tutor-to-student paper sharing, non-MU formats.
