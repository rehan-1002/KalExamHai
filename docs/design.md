# KalExamHai: Design and UI/UX Document

| Field | Value |
|---|---|
| Version | 0.2 (Claude-Azure theme; supersedes the 0.1 brutalist dark theme) |
| Depends on | `prd.md` |

---

## 1. Design Intent

KalExamHai should lower the user's stress, not mirror it. A tutor generating a 60-mark End-Sem paper, or a student opening flashcards the night before an exam, should land in a calm, bright, professional workspace that feels like a top-tier enterprise tool.

Keywords: calm, premium, airy, trustworthy, quiet.

The product is still fast and direct. Calm does not mean slow: few clicks, clear costs, clear states.

## 2. Theme Rules

**Allowed and encouraged**
- Warm alabaster and white surfaces.
- One refined Azure Blue accent, used sparingly for primary buttons, active states and key interactions.
- Soft, subtle drop shadows to separate cards, modals and navigation from the page.
- Moderate rounded corners.
- Clean sans-serif type with generous line height and spacing.
- Reassuring, clear, plain-language copy.

**Explicitly banned**
- Pure black backgrounds with high-contrast white text.
- Raw, brutalist 1px solid borders as the main structural device, and terminal or command-line aesthetics.
- Jarring neon colours (terminal green, caution yellow, neon anything).
- Heavy use of monospace fonts for standard reading text.
- Deadpan or slangy copy.

**Carried over from v0.1 (still banned)**
- Purple or pink gradients, glowing HUD cards, neon glows.
- Emojis anywhere in the product.
- Generic AI copywriting ("Unleash the power of AI", "Supercharge", "Magical").
- Decorative icon sets used as ornament. Functional icons are allowed (see 5.2).
- Kinetic text that repeats the same word.

Mandatory third-party components (section 8) are the only place where visual effects beyond this theme are allowed.

## 3. Visual Tokens

### 3.1 Colour

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F9F9F6` | Page background (warm alabaster) |
| `surface` | `#FFFFFF` | Cards, panels, modals, inputs |
| `ink` | `#1F2937` | Primary text (dark slate, not pure black) |
| `ink-muted` | `#6B7280` | Secondary text, captions |
| `hairline` | `#E7E5E0` | Faint dividers inside cards and tables |
| `azure` | `#3B82F6` | Brand accent: highlights, active indicators, links on large text, focus ring |
| `azure-strong` | `#2563EB` | Primary button fill and any small text in azure (meets AA contrast with white) |
| `azure-soft` | `#EFF6FF` | Selected rows, active tab background, info panels |
| `danger` | `#B42318` | Error text and icon only |
| `danger-soft` | `#FEF3F2` | Error panel background |

Rules:
- Azure is the single accent. Use it for at most one primary action per screen, plus active and selected states.
- **Contrast note:** white text on `#3B82F6` is about 3.7:1, which fails WCAG AA for normal-size text. Use `azure-strong` for button fills with white labels. Keep `azure` for large text, indicators and focus rings.
- No pure black (`#000000`) as a background or as body text. No neon or saturated yellow or green anywhere. Success states are shown with azure and a text label, not green.
- Error uses a muted red (`danger`) with a plain-language message. This is a deliberate addition because errors need to be distinguishable on a light theme; it is not a neon and is used only for errors.
- The app is light-only. `prefers-color-scheme: dark` is ignored.
- Print view: white background, black text, serif face (unchanged).

### 3.2 Typography
- Body, headings, buttons, labels, tables: **Inter** (self-hosted, variable).
- Paper preview and print view: a serif exam face (`"Times New Roman", Times, serif`) for fidelity with real papers.
- Monospace is reserved for IDs, code snippets and raw LaTeX fallbacks. Never for body copy, buttons or table content.
- Scale: 12 / 14 / 16 / 18 / 24 / 32 / 48 px. Body 16px, line height 1.6. Headings 1.25, weight 600, sentence case.
- Generous paragraph spacing: 16px between paragraphs, 32 to 48px between sections.

### 3.3 Spacing, Radius, Elevation
- 4px base grid: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: 6px inputs and small tags, 10px buttons, 12px cards and panels, 16px modals. No fully round pills except avatar and status dots.
- Elevation replaces borders as the main separator:

| Token | Value | Use |
|---|---|---|
| `shadow-card` | `0 1px 2px rgba(31,41,55,0.06), 0 1px 3px rgba(31,41,55,0.08)` | Cards, tables, panels at rest |
| `shadow-raised` | `0 4px 12px rgba(31,41,55,0.08)` | Hover on interactive cards, dropdowns, nav |
| `shadow-modal` | `0 12px 32px rgba(31,41,55,0.14)` | Modals, popovers |

- Shadows are neutral and soft. No coloured shadows, no glows.
- Borders are allowed only as a faint `hairline` for inputs and dividers, never as heavy outlines.

### 3.4 Motion
- Subtle and fast: 150 to 200ms, ease-out. Fade and slight translate only.
- No parallax, no scroll-jacking, no bouncing.
- Respect `prefers-reduced-motion` everywhere, including mandatory components.

## 4. Layout

- Mobile-first. Student screens at 360px first; tutor screens at 768px first, then wider.
- Max content width 1120px, centred content column on desktop, comfortable margins (16px mobile, 32px desktop).
- Tutor navigation: left sidebar on desktop with soft `surface` background and shadow; top tabs on mobile.
- Student navigation: bottom bar of four labelled items on mobile, with an active azure indicator.
- Lists of documents, papers and ledger entries use clean tables inside a card, with row hover in `azure-soft`.
- Whitespace is a feature. Prefer fewer elements per screen over dense layouts.

## 5. Components (`/ui`)

### 5.1 Specifications

| Component | Spec |
|---|---|
| Button (primary) | `azure-strong` fill, white text, 10px radius, 44px min height, `shadow-card`; hover darkens slightly |
| Button (secondary) | `surface` fill, `ink` text, `hairline` border, `shadow-card`; hover `shadow-raised` |
| Button (quiet) | No fill, azure-strong text; hover `azure-soft` fill |
| Button (disabled) | `hairline` fill, `ink-muted` text, no shadow |
| Input / Textarea | `surface` fill, 1px `hairline` border, 6px radius, 44px height; focus ring azure |
| Select | Native select styled like input |
| Badge / Tag | Small rounded rectangle, 12px Inter medium; neutral = `canvas` fill, active = `azure-soft` fill with `azure-strong` text |
| Table | Inside a card; header row 12px `ink-muted` uppercase-free; row dividers `hairline`; hover row `azure-soft` |
| Card / Panel | `surface`, 12px radius, `shadow-card`, 24px padding |
| Tabs | Text tabs with a 2px azure underline on the active tab |
| Progress | Soft rounded bar, `azure-soft` track, `azure` fill, text label beside it ("Drafting, 14s") |
| Toast | `surface` card with `shadow-raised`, bottom-centre, 4s |
| Modal | `surface`, 16px radius, `shadow-modal`, backdrop `rgba(31,41,55,0.35)`. No backdrop blur outside vendor components |
| Error panel | `danger-soft` fill, `danger` text, 12px radius, starts with "Error:" and says what changed |
| Math block | `MathText` (see `rules.md`), horizontal scroll for long equations |
| Focus ring | `outline: 2px solid #3B82F6; outline-offset: 2px` on every interactive element |

### 5.2 Icons
Functional icons only (upload, download, close, check, chevron), one consistent thin-stroke set, always paired with a text label or an accessible name. No decorative icons, no icon-only marketing sections, no emojis. Pick one set and record it in `package.json` justification per `rules.md`.

## 6. Copywriting Rules

- Reassuring, clear and specific. Plain English, short sentences.
- State consequences and numbers: "This will use 2 credits." "You have 1 upload left this month."
- No slang, no deadpan jokes, no exclamation marks, no emojis, no promises of magic.
- Say what happened and what the user can do next.

| Avoid | Prefer |
|---|---|
| Unleash the power of AI to ace your exams! | Turn your notes into an exam-format paper. |
| Oops! Something went wrong | We could not generate this paper. Your 2 credits were returned. Try again. |
| Upgrade to Pro for more | Viva Prep is part of the Semester Pass (INR 199). |
| Exam kal hai? Start here. | Preparing for an exam? Upload your notes to begin. |

## 7. Key Screens

### 7.1 Pre-landing (`/`)
- Full-screen `canvas` background. The Liquid Glass Logo Reveal plays the KalExamHai logo (max 3s). After the reveal: one line of text and one button, "Get started".
- "Skip" link visible from the start. Reduced-motion users get the final frame immediately.
- No navigation bar, no feature grid.

### 7.2 Auth (`/login`, `/signup`)
- Auth Switch handles role selection: Tutor or Student. The value is passed as `role` metadata on signup and used to label the form ("Tutor sign in").
- Form fields stacked below in a single `surface` card with `shadow-card`.

### 7.3 Tutor Dashboard (`/tutor`)
- Top row: credit balance card with a "Buy credits" quiet button.
- Two primary action cards: "New IAT paper (1 credit)" and "New End-Sem paper (2 credits)".
- Recent papers in a table card: title, format, date, actions.

### 7.4 Paper Generator and Review
- Generator: a single-column form in a card with a live cost line ("This will use 2 credits").
- Progress: a step list (Retrieving, Drafting, Validating) with a soft progress bar and elapsed seconds.
- Review: two panes on desktop (paper left on a white sheet with `shadow-raised`, sources right). Single column on mobile with collapsible sources. Structure labels read "Question 1, 10 marks, attempt 5 of 6".

### 7.5 Student Dashboard (`/student`)
- Welcome card: "Preparing for an exam? Choose a subject." Below it, four output cards: Quick notes, Flashcards, Survival kit, Viva prep. Paid items carry a quiet "Semester Pass" tag.
- Library as a table card.

### 7.6 Flashcards
- Deck uses the Holo Card (section 8). Controls beneath: Flip, Known, Not yet, as full-width buttons for thumb reach.

### 7.7 Viva Prep
- Tabs: Easy, Medium, Tricky. Difficulty is shown by tag style only: Easy = neutral tag, Medium = `azure-soft` tag, Tricky = `azure-strong` filled tag. No extra colours.
- Each item: question, tap to reveal answer and follow-up.

### 7.8 Paywall
- A single card: what is locked, the price, three lines on what is included, one payment button. No countdown timers or fake urgency.

## 8. Mandatory Third-Party Component Exceptions

These are the only elements allowed to use effects beyond the theme (glass, holographic sheen, motion). They stay isolated to the routes below.

| Component | Source | Allowed only on | Notes |
|---|---|---|---|
| Liquid Glass Logo Reveal | 21st.dev, `@shepovalovdenis` | Pre-landing (`/`) | Load dynamically on the client. Must sit on the `canvas` background, so verify the effect reads well on a light backdrop when the source is added. Static logo fallback for reduced-motion and slow devices. Must not block the primary button for more than 3s |
| Auth Switch | 21st.dev, `@appvibed01` | `/login`, `/signup` | Used for role selection. Theme it to `surface`, `ink` and `azure-strong` through props or a wrapper only; do not edit its internal logic. Output must map to the strict `tutor` and `student` values |
| Holo Card | React Bits | Student flashcard deck and study mode (`/student/flashcards/**`) | Card text must stay fully legible; the holo effect sits behind text. Disable tilt and holo effect under `prefers-reduced-motion` and show a plain white card with `shadow-card`. Render only a few cards at a time for low-end phones |

Integration rules:
1. Vendor source lives in `src/components/vendor/<component-name>/` with an `index.tsx` wrapper. Wrappers in `/features` import from there.
2. Each vendor folder has a header comment with source URL, author and date added.
3. An ESLint restriction blocks imports from `components/vendor` outside the permitted route features.
4. Any gradient, blur or glow CSS from these components is scoped to the component container and must not leak into app styles.

## 9. Accessibility

- All text meets WCAG AA. Check azure combinations against 3.1 (use `azure-strong` for small text and white-on-blue buttons).
- Minimum touch target 44px.
- Visible focus ring on every interactive element.
- Full keyboard operation, including flashcard flip (Space) and Known / Not yet (arrow keys).
- Render MathML alongside HTML via KaTeX so screen readers can read equations.
- Honour `prefers-reduced-motion`. Errors never rely on colour alone: they always include the word "Error" and a plain explanation.

## 10. Design Review Checklist (run before merging any UI)

- [ ] Background is `canvas` or `surface`; no pure black anywhere except print text?
- [ ] Only one accent colour (azure) used, and not more than one primary button per screen?
- [ ] Depth comes from the shadow tokens; no heavy borders, no coloured glows?
- [ ] Body copy is Inter; monospace not used for reading text?
- [ ] No neon, no emoji, no decorative icons?
- [ ] Copy is reassuring and specific, with costs and next steps stated?
- [ ] Azure text and button contrast checked against AA?
- [ ] Works at 360px width; focus ring and keyboard path verified?
- [ ] Any gradient, blur or glow confined to a section 8 component?
