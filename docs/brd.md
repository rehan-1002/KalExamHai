# KalExamHai: Business Requirements Document (BRD)

| Field | Value |
|---|---|
| Product | KalExamHai (kalexamhai.vercel.app) |
| Version | 0.1 (MVP definition) |
| Owner | Founder / Product |
| Status | Draft for validation |

Items marked **[ASSUMPTION]** are hypotheses to validate before they are treated as commitments.

---

## 1. Problem Statement

Mumbai University engineering students prepare for IATs, End-Sems and Vivas in a compressed window, usually the last 24 to 72 hours. Their material is scattered: faculty PDFs, handwritten notes, photographed slides, WhatsApp forwards. Three problems follow.

1. **Students cannot convert their own material into exam-shaped practice.** Generic AI chat tools produce questions that ignore the MU NEP-2020 paper structure, drift outside the syllabus the student actually has, and mangle equations.
2. **Tutors spend hours hand-building practice papers.** Each paper has a strict mark structure (attempt rules, 2/3/4/5/6-mark splits). Doing this manually per batch, per subject, per exam cycle does not scale.
3. **Viva preparation is unstructured.** Students do not know what an external examiner will ask, and have no way to rehearse easy, medium and tricky questions from their own journal and subject material.

## 2. Target Audience (MU Ecosystem)

### 2.1 Primary: Tutors (B2B)
- Independent tutors and small coaching classes serving MU engineering batches (all branches, semesters I to VIII).
- Faculty who run internal practice tests.
- Pain: time per paper, format errors, equation formatting, repeated work every exam cycle.
- Buying behaviour: pays per use, prefers small prepaid packs over subscriptions. **[ASSUMPTION]**

### 2.2 Primary: Students (B2C)
- MU engineering students, mostly on mobile, on patchy data, studying under deadline stress.
- Pain: too much material, too little time, no feedback on what is likely to matter.
- Buying behaviour: price-sensitive, pays via UPI, buys at the moment of maximum stress (exam week).

### 2.3 Out of Scope Audiences (MVP)
Other universities, school boards, non-engineering MU streams, institutional (college-wide) licences.

## 3. Value Proposition

| Audience | Promise | Proof |
|---|---|---|
| Tutors | A valid MU-format IAT or End-Sem paper from your own material in under a minute. | Mark structure enforced in code, not by prompt alone. Every question traceable to a source chunk. |
| Students | Turn your own notes into last-minute notes, flashcards and viva questions. | Output generated strictly from uploaded context. No invented syllabus. |

**Differentiators**
- Format fidelity: strict NEP-2020 IAT (20) and End-Sem (60) structures, validated programmatically.
- Context fidelity: generation is bounded to the user's uploaded material. No dependence on a previous-year-question database.
- Math fidelity: LaTeX output rendered properly, with graceful fallback.
- Tone fit: built for the last-minute, not for browsing.

## 4. Scope

**In scope (MVP):** auth with two roles; document upload and indexing; tutor paper generation (IAT, End-Sem) and quiz generation; student quick notes, flashcards, survival kit, viva prep; credits for tutors; freemium plus semester pass for students; PDF export of papers.

**Out of scope (MVP):** previous-year-question database, historical paper analysis, collaboration or sharing between users, native mobile apps, institution admin consoles, non-MU formats.

**Naming caution:** the paid student tier includes "End-Sem predictions". Without a historical database, these are **likely-topic emphasis derived from the student's own uploaded material** (syllabus weightage, repeated emphasis in notes). Marketing copy must not imply analysis of past papers.

## 5. Monetization Strategy

All prices in INR and all quotas are **[ASSUMPTION]** pending customer interviews and measured cost per generation.

### 5.1 Tutors: SaaS with Credit Packs

Credits are prepaid, non-expiring for 12 months, and charged only on successful, validated generations.

| Action | Credit cost |
|---|---|
| IAT paper (20 marks) | 1 |
| End-Sem paper (60 marks) | 2 |
| Quiz (up to 15 questions) | 1 |
| Regenerate a single sub-question | 0 (capped at 5 per paper) |
| PDF export | 0 |

| Pack | Credits | Price (INR) |
|---|---|---|
| Starter | 5 | 49 |
| Standard | 25 | 199 |
| Pro | 60 | 399 |

- On signup, a tutor gets 2 free credits to trigger first-value.
- Failed generations (validation failure after retries, Gemini error) are fully refunded automatically.

### 5.2 Students: Freemium + Passes

| Tier | Includes | Limits | Price (INR) |
|---|---|---|---|
| Free | Quick notes, basic flashcards | 2 uploads per month, 3 generations per day, flashcard deck capped at 10 cards, no viva, no likely-topics | ₹0 |
| Exam-Night Pass (24 hours) | Full Survival Kit, Viva Prep, Quick Notes, Flashcards for immediate exam emergency | Fair-use cap of 20 generations in 24 hours | ₹49 |
| Semester Pass (one-time, per semester) | Everything in Free & 24h pass, uncapped within fair use, Viva Prep, Likely Topics, Survival Kit, unlimited flashcards across all subjects | Fair-use cap of 50 generations per day | ₹99 |

- No auto-renewal. One-time payment via UPI avoids subscription friction.
- Payments: UPI-first via Razorpay.

### 5.3 Unit Economics Guardrails
- Target gross margin of at least 80% per generation after LLM, embedding, storage and gateway fees.
- Instrument token usage per generation type from day one; set credit costs from measured data, not guesses.
- Hard per-user daily caps and per-request context bounds protect margin during exam-season spikes.

## 6. Success Metrics

| Category | Metric | MVP target |
|---|---|---|
| Activation | Tutor generates a first valid paper within 10 minutes of signup | 60% |
| Activation | Student generates first notes or flashcards within 5 minutes of signup | 70% |
| Quality | First-pass schema-valid generation rate (no retry) | at least 85% |
| Quality | Final valid generation rate (after retries) | at least 98% |
| Quality | Tutor "paper used as-is or lightly edited" (thumbs rating) | at least 70% |
| Engagement | Papers per active tutor per month | at least 4 |
| Revenue | Tutor free-to-paid conversion | at least 15% |
| Revenue | Student free-to-pass conversion during exam windows | at least 5% |
| Efficiency | Median generation latency (IAT / End-Sem) | under 30s / under 60s |
| Efficiency | LLM cost per generation vs. revenue per generation | cost at most 20% |
| Retention | Tutor repeat purchase within 60 days | at least 40% |

North Star: **valid papers and study kits generated per week during exam windows.**

## 7. Go-To-Market Strategy

1. **Seed with tutors, they bring students.** Onboard 20 to 30 tutors personally across Mumbai, Thane, Kalyan, Navi Mumbai. Offer free credits for feedback.
2. **Exam-calendar timing.** Launch pushes align with IAT and End-Sem windows. Run a "T-minus" campaign in the final week before each exam.
3. **Distribution channels.** Student WhatsApp and Telegram groups, college subreddits and Discord servers, Instagram reels by student creators, and campus ambassadors with referral credits.
4. **Referral loop.** Tutor shares a student-facing link that grants the student a free viva sample; tutor earns credits on student pass purchases. **[ASSUMPTION]**
5. **Trust building.** Show a sample generated paper with its source traceability on the pre-landing flow. Publish the exact mark structure the validator enforces.
6. **Feedback loop.** In-product report-a-bad-question button feeds the prompt iteration backlog.

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| LLM produces wrong mark structure | Product-breaking | Zod schema plus programmatic validator, retry with error feedback, refund on failure |
| LLM invents content not in the source | Trust loss | Context-bounded prompts, `source_chunk_ids` per question, insufficient-context flag, tutor review step |
| Broken LaTeX | Unreadable papers | Sanitizer, KaTeX error fallback, per-equation isolation |
| Copyrighted material uploaded by users | Legal | Terms requiring user ownership or permission, private storage, no cross-user sharing, takedown process |
| Gemini cost spike in exam season | Margin loss | Context budgets, caps, caching of embeddings, usage dashboards |
| Syllabus or format change by MU | Stale format | Format definitions live in versioned config, not scattered in prompts |
| Scanned or handwritten PDFs extract poorly | Bad output | OCR fallback via multimodal extraction, extraction-quality warning |
| Payment failures or UPI drop-offs | Lost revenue | Idempotent webhooks, retry-safe order flow |

## 9. Open Questions

1. Confirm exact MU NEP-2020 paper durations and instruction wording against official circulars.
2. Validate price points through 20 or more interviews each with tutors and students.
3. Decide whether tutors may share generated papers with students inside the product (post-MVP).
4. Decide the terms of service and content-ownership language with legal review.
