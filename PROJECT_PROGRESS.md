# CodeClimb Project Progress

**Tagline:** Learn. Practice. Climb.
**Workspace:** `d:\CodeClimber`
**Last Updated:** 2026-11-26

## Phase 10B — Complete Coding Problem & Test Case Validation (Completed & Verified)
- **Live Judge0 Reference Validation (`150 / 150` Active Problems, `712` Test Cases):**
  - Executed sequential batches (`Batch 2: 26–50`, `Batch 3: 51–75`, `Batch 4: 76–100`, `Batch 5: 101–125`, `Batch 6: 126–150`) against `https://ce.judge0.com` using a resumable validation runner, saving validated Python reference solutions and `validationStatus` into MongoDB (`0` missing reference solutions, `0` unmapped problems).
  - Audited and corrected 2 faulty test cases discovered during live execution:
    - `#58 first-non-repeating-in-stream`: Fixed TC 4 (`abacabad`) `expectedOutput` from `aaabbccd` to `aabbbccc`.
    - `#145 word-search-grid`: Updated TC 3 (`[[A,B],[C,D]]`) query word from `ACDB` (valid 4-directional path) to `ACBD` so TC 3 tests a genuine `NO` case.
- **Frontend Code Quality & Lint Cleanup:**
  - Fixed `react-hooks/exhaustive-deps` warning in `client/src/pages/ProblemSolvePage.tsx` (`resolvedPreferredLang`).
  - Extracted non-component constants/helpers from `LanguageCodeEditor.tsx`, `CodeEditor.tsx`, and `TopicRow.tsx` into `languageTemplates.ts`, `editorConstants.ts`, and `topicHelpers.ts`, reducing ESLint warnings from `13` to `2` (`useAuth`/`useTheme` in context files).
- **Final Verification Results:**
  - `server` `npm test`: **3/3 files, 23/23 tests passed**
  - `client` `npm run lint`: **0 errors, 2 warnings**
  - `client` `npm test`: **1/1 file, 2/2 tests passed**
  - `client` `npm run build`: **`tsc -b && vite build` succeeded (2955 modules, 37.95s)**
  - Playwright Chromium E2E (`npx playwright test --project=chromium --workers=1`): **8/8 tests passed (36.2s)**

## Phase 10A — Final Functional Audit, Security & Problem Validation (Completed & Verified)
- **Security & Admin Provisioning (`server/src/seeds/seedDemo.js`, `server/src/seeds/provisionAdmin.js`, `server/package.json`):**
  - Enforced production guard in `seedDemo.js` so demo student accounts and default admin fallback passwords are disabled when `NODE_ENV === 'production'`.
  - Added standalone `npm run provision:admin` (`provisionAdmin.js`) to safely provision/update admin credentials from `server/.env` without resetting or reseeding database collections.
- **Accessibility & Mobile Admin Polish (`client/src/pages/AdminPage.tsx`, `AdminProblemsSection.tsx`, `AdminOperationsSection.tsx`):**
  - Added mobile sidebar close button (`aria-label="Close admin menu"`) and `aria-label="Close modal"` on Admin modals.
- **Coding Problem Quality Audit & Batch 1 Validation (`PROBLEM_VALIDATION.md`):**
  - Cleaned up temporary Phase 9 test problem (`150` active problems, `712` test cases, `0` unmapped problems).
  - Validated **25 / 25** Batch 1 coding problems (`#1`–`#25`) with real Python reference solutions executed via Judge0 CE against all sample and hidden test cases; documented all 150 problems in `PROBLEM_VALIDATION.md` (`125` remaining marked `Untested (Pending Phase 10B)`).
- **Playwright End-to-End & Regression Verification (`client/tests/e2e/app.spec.ts`, `client/tests/e2e/phase10_regression.spec.ts`):**
  - Installed Playwright Chromium (`1.65.1`) and ran `npx playwright test --project=chromium` against live frontend, backend, MongoDB Atlas, and Judge0 CE -> **8/8 E2E tests passed (10.7s)**.
- **Final Audit Report (`FINAL_AUDIT.md`):**
  - Documented implemented features, test results, security audit findings, Judge0 public endpoint limitations, 25/150 validated problems, and deployment readiness status.

## Phase 9 — Complete Functional Admin Panel (Completed & Verified)
- **Task 1 & 14 — Secure Administrator Authentication & RBAC (`server/src/middleware/auth.js`, `server/src/routes/adminRoutes.js`, `client/src/components/common/AdminRoute.tsx`):**
  - Enforced server-side `protect` + `adminOnly` middleware (`401` unauthenticated, `403` non-admin) across all `/api/v1/admin/*` endpoints and admin mutations.
  - Verified student registration and `PUT /api/v1/auth/profile` reject `role` privilege escalation.
  - **Admin Account Configuration:** Administrator accounts can be provisioned securely via environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD` in `server/.env`) using `npm run seed` (`server/src/seeds/seedDemo.js`) without hardcoding production passwords in source code; admins log in via `/login` and are protected by `AdminRoute` (`/admin/*`), with password change and logout inside Admin Settings.
- **Task 2 — Professional Admin Dashboard (`client/src/pages/AdminPage.tsx`, `server/src/controllers/adminController.js`):**
  - Built a collapsible responsive Admin Sidebar covering all 13 sections: `Overview`, `Students`, `Coding Problems`, `Test Cases`, `DSA Curriculum`, `Notes & Resources`, `Daily Challenges`, `Submissions`, `Leaderboard`, `Achievements`, `Performance Reports`, `Audit Logs`, and `Settings`.
  - Wired `GET /api/v1/admin/stats` to live MongoDB metrics (`totalStudents`, `activeUsers`, `totalProblems`, `totalModules`, `totalConcepts`, `totalSubmissions`, `acceptedSubmissions`, `acceptanceRate`, `dailyActiveUsers`, `dailyChallengeParticipation`, `languageDistribution`, `recentRegistrations`, `recentSubmissions`, and live `judge0Health`).
- **Task 3 & 11 — Student Management & Performance Reports (`AdminOperationsSection.tsx`, `adminController.js`):**
  - Added student search, active/inactive filters, pagination, `GET /api/v1/admin/users/:id` (profile, progress, solved, XP, achievements, revisions, daily challenges without passwords/tokens), `PUT /api/v1/admin/users/:id/activate` & `/deactivate` (with `ConfirmDialog`), and individual CSV/printable performance reports (`GET /api/v1/admin/users/:id/export` & `/report`).
- **Task 4, 5 & 6 — Coding Problems, Test Cases & Reference Solution Validation (`Problem.js`, `problemController.js`, `testCaseController.js`, `adminController.js`, `AdminProblemsSection.tsx`):**
  - Added `referenceSolutions`, `validationStatus`, and `requiresRevalidation` to `Problem.js` (leaving all existing 150 problems `untested` until individually validated).
  - Enforced draft-first creation, `>= 1` sample + `>= 1` hidden test case + Judge0 reference-solution validation (`POST /api/v1/admin/problems/:id/validate-solution`) before publishing (`PUT /api/v1/admin/problems/:id/publish`), and soft-archival (`DELETE /api/v1/problems/:id`) preserving historical submissions.
  - Verified student-facing `GET /api/v1/problems/:slug` omits `referenceSolutions` and `GET /api/v1/test-cases/problem/:problemId` returns `isSample: true` only.
- **Task 7 & 8 — DSA Curriculum, Notes & External Resources (`AdminCurriculumSection.tsx`, `topicController.js`, `noteController.js`, `adminController.js`):**
  - Added `POST /api/v1/admin/curriculum/validate-dag` and `detectCycle` validation in `PUT /api/v1/topics/:id` to reject circular prerequisites.
  - Built Markdown note editor with safe `MarkdownPreview` and external resource manager (CodeChef, LeetCode, YouTube links + `verified` flag).
- **Task 9, 10, 12 & 13 — Daily Challenges, Submission Monitoring, Achievements & Audit Logs:**
  - Added `GET /api/v1/admin/daily-challenges`, upgraded `GET /api/v1/admin/submissions` (student display name, verdict, tests, runtime, memory, Judge0 failure count, no private code), added `GET/POST/PUT /api/v1/admin/achievements`, and wired non-fatal `logAdminAction` across admin mutations (`GET /api/v1/admin/audit-log`).
  - **Fixed Leaderboard Achievement Icon Bug (`LeaderboardPage.tsx`):** Replaced literal icon-name text (`Sparkles`, `Globe`, `Award`) with `BADGE_ICON_MAP` rendering Lucide SVG icons with `Award` fallback.
- **Verification Results:**
  - `server` `npm test`: `3` test files, `23` passed; `client` `npm run lint`: `0` errors (`13` warnings); `client` `npm test`: `1` test file, `2` passed; `client` `npm run build`: `tsc -b && vite build` succeeded.
  - Live API (`verify_phase9.mjs`): verified admin/student logins, `401`/`403` RBAC, privilege escalation rejection, live Admin stats (`totalStudents: 22`, `totalProblems: 150`, `totalModules: 24`, `totalConcepts: 348`, `judge0Health: 'healthy'`), student CSV export (no PII), full Draft -> Edit -> Sample/Hidden Test Cases -> Judge0 Reference Validation -> Publish -> Student Hidden-TC Protection -> Archive lifecycle, DAG cycle rejection, Daily Challenges, and Audit Logs.
  - Live Browser (`http://localhost:5173`): verified Leaderboard SVG badge icons, student `/admin` redirect to `/dashboard`, Admin login, collapsible sidebar, all 13 Admin sections, charts, modals, and audit log filtering with `0` console errors and `0` failed network requests.
  - **Minor Polish Notes:** At `390x844` mobile on `/admin`, when opened, the mobile sidebar drawer overlays the left side until closed; modal `×` close buttons can be enhanced with `aria-label="Close"` and `Escape`-key dismissal.

## Phase 8 — Leaderboard, XP, Achievements & Student Performance Analytics (Completed & Verified)
- **Task 1, 2, 3 & 7 — Performance Analytics, Submission History & Reports (`server/src/controllers/progressController.js`, `client/src/pages/PerformancePage.tsx`):**
  - Fixed response-shape mismatches between `progressController.js` and `PerformancePage.tsx` (`problemsByDifficulty`, `languageDistribution`, `topicPerformance`, `weeklyActivity`, `monthlyCalendar`, `submissionHistory`).
  - Added time-range filtering (`7d`, `30d`, `all`), `verdictDistribution`, cumulative `xpGrowth` from `XPEvent`, `roadmapCompletion`, `dailyChallengeStats`, `revisionStats`, `achievements`, and `recommendedNext`.
  - Upgraded **Submission History** with `passedTestCases/totalTestCases`, search, language & verdict filters, sorting (`newest`, `oldest`, `runtime`), pagination, **View Code** modal, and **Open** (`/practice/:slug`) links.
  - Wired **Export CSV** to `/api/v1/progress/export?range=...` (RFC 4180 + spreadsheet formula-injection safe, zero PII/credentials) and **Print Report** (`window.print()` with dedicated `@media print` report header).
- **Task 4 & 5 — Leaderboard Fixes & Upgrades (`server/src/controllers/leaderboardController.js`, `client/src/pages/LeaderboardPage.tsx`, `server/src/models/User.js`, `server/src/controllers/authController.js`):**
  - Fixed `Problems Solved = 0` bug by querying `$or: [{ verdict: 'Accepted' }, { status: 'Accepted' }]` and deduplicating distinct solved `problemId`s in a `Set` per user.
  - Added `easySolved`, `mediumSolved`, `hardSolved` counts, `UserAchievement` badge pills, Top 3 Podium, `minSolved` filter, `XPEvent`-based `weekly`/`monthly` rankings, `mergeSort` deterministic tie-breaking (`xp DESC -> solvedCount DESC -> streak DESC -> name ASC`), and `leaderboardOptOut` visibility toggle.
- **Task 6 — XP & Achievements (`server/src/services/xpService.js`, MongoDB `achievements`):**
  - Fixed `UserProgress.countDocuments({ user, isCompleted: true })`, handled `11000` duplicate-key race conditions in `awardXP`, and added full criteria evaluation (`accepted_count`, `topic_count` across arrays/strings/sorting/recursion/trees/graphs/DP, `daily_count`, `difficulty_count`, `language_count`, `streak`).
  - Safely upserted 4 additional achievements (`twenty_five_accepted`, `sorting_specialist`, `tree_explorer`, `daily_1` -> `18` total achievements) and exposed `getUserAchievementsWithProgress`.
- **Task 9 — DSA Documentation (`docs/DSA_DOCUMENTATION.md`):**
  - Documented actual usage, file locations, and complexities for Hash Maps/Sets, Merge Sort, Time-Series Arrays, and Submission Searching/Filtering/Sorting.
- **Verification Results:**
  - `server` `npm test`: `3` test files, `23` passed; `client` `npm run lint`: `0` errors (`13` existing warnings); `client` `npm test`: `1` test file, `2` passed; `client` `npm run build`: `tsc -b && vite build` succeeded.
  - Live API (`verify_phase8.mjs`): verified new-user empty states, Performance & Dashboard sync (`totalSolved: 2`, `xp: 115`, `rank: 1`, `3` earned achievements: `First Blood`, `Daily Challenge Completed`, `Polyglot`), Leaderboard (`2 solved`, `2E/0M/0H`, no email leakage), `leaderboardOptOut` toggle/restore, CSV export (`2092` bytes, no PII), and `404` private submission isolation.
  - Live Browser (`http://localhost:5173` as `demo@codeclimb.dev`): verified `/performance` (all charts populated, `3 of 18 unlocked`, `9` submissions, search filter, `Code` modal, `Last 7 Days` -> `All Time`, `Export CSV`, `Print Report`), `/leaderboard` (Top 3 Podium, `2 (2E / 0M / 0H)`, `Global`/`Weekly`/`Monthly` tabs), and `390x844` mobile layout with `0` console errors and `0` failed network requests.
  - Minor cosmetic note: achievement pills in the Leaderboard table render the icon name string (e.g. `Sparkles`, `Globe`, `Award`) before the badge title.

## Phase 7 — Intelligent Learning Path, Revision Mode & Daily Challenges (Completed & Verified)
- **Task 5 — Fixed Remaining 5 Problem-to-Topic Mappings:**
  - Mapped all `5` previously unmapped problems in MongoDB Atlas (`sum-of-array-recursive`, `remove-nth-from-end`, `first-non-repeating-in-stream`, `count-leaf-nodes`, `mirror-of-binary-tree`) to their corresponding existing DSA `Topic` records and synced `Note.relatedProblems`. Remaining unmapped problems: `0` (`150/150` mapped).
- **Task 1 & Task 6 — Intelligent DSA Learning Path (`server/src/services/recommendationService.js`, `docs/DSA_DOCUMENTATION.md`):**
  - Fixed `getUserCompletionState` to query all `UserProgress` documents (`isCompleted: true`), inspect `Submission.verdict === 'Accepted'`, track `incorrectProblems` in a `Set`, and read `user.preferredLanguage`.
  - Fixed `pickRecommendedProblems` `CastError` on string slugs, deduplicated `recommendedProblems` by `_id`, and prioritized previously failed problems + easy-first progression using `MinPriorityQueue` + Kahn's `topologicalSort` over the `Module`/`Topic` prerequisite DAG.
  - Updated `getWeakTopics` to check `(sub.verdict || sub.status) === 'Accepted'` and updated `docs/DSA_DOCUMENTATION.md` with exact implementation paths, algorithms, and complexities.
- **Task 2 — Automatic Smart Revision Mode (`Revision.js`, `revisionService.js`, `revisionController.js`, `revisionRoutes.js`, `submissionController.js`, `ProblemSolvePage.tsx`, `RevisionPage.tsx`):**
  - Added `revisionReason` and `lastSuccessfulRevision` to `Revision.js`.
  - Backed `RevisionPriorityQueue` in `revisionService.js` with `PriorityQueue` from `dsaAlgorithms.js` and enforced `[1, 3, 7, 14]` day spaced repetition.
  - Updated `submissionController.js` to auto-queue `Wrong Answer`, `Compilation Error`, `Runtime Error`, `Time Limit Exceeded`, and `Memory Limit Exceeded` (never `Internal Error` / service outages), and to mark revisions complete on `Accepted` without deleting `incorrectAttempts` history.
  - Rewrote `revisionController.js` & `revisionRoutes.js` with owner-scoped `GET /revisions`, `GET /revisions/due`, `POST /revisions`, `PUT /revisions/:id/complete`, `PUT /revisions/:id/reschedule`, and `DELETE /revisions/:id`.
  - Added **Difficult / In Revision** button in `ProblemSolvePage.tsx` and built the complete `RevisionPage.tsx` (Due Today, Upcoming, Incorrect Questions, Difficult Questions, Completed Revisions, Topic/Difficulty/Search filters, Start Revision, Mark as Revised, Reschedule, Remove).
- **Task 3 — Daily Coding Challenge (`ChallengeAttempt.js`, `dailyChallengeController.js`, `submissionController.js`, `DailyChallengePage.tsx`):**
  - Personalized daily challenge selection per user in `Asia/Kolkata` (`YYYY-MM-DD` `dateKey` unique index on `{ user, dateKey }`) supporting `Auto`, `Easy`, `Medium`, and `Hard` preferences, progress-aware topic matching, and 30-day repeat avoidance.
  - Enforced verified Judge0 `Accepted` submission requirement (manual `POST /daily-challenges/attempt` without `submissionId` rejected with `400`), awarding `+20` bonus XP at most once via atomic conditional `findOneAndUpdate({ isCompleted: false, xpAwarded: false })`.
  - Built `DailyChallengePage.tsx` with preference selector, Today's Challenge card, **Solve Challenge** -> `/practice/:slug`, non-punitive streak display, and Challenge History with optional **Practice** for missed dates.
- **Task 4 — Dashboard Integration (`progressController.js`, `DashboardPage.tsx`):**
  - Fixed `UserProgress` and `Submission.verdict` queries in `progressController.js` and synchronized Dashboard's `dailyChallenge` with `getOrAssignUserTodayChallenge`.
  - Wired **Recommended Next Topic** + **Continue Learning** (`/notes/:slug`), **Recommended Practice Problems**, **Today's Coding Challenge**, **Revision Reminders**, **Weak DSA Topics**, and **Recent Submissions** in `DashboardPage.tsx`.
- **Verification Results:**
  - `server` `npm test`: `3` test files, `23` tests passed.
  - `client` `npm run lint`: `0` errors (`13` warnings); `client` `npm test`: `1` test file, `2` passed; `client` `npm run build`: `tsc -b && vite build` succeeded.
  - Live API & Judge0 CE verification (`verify_phase7.mjs` & `verify_dc_xp.mjs`): verified all 13 scenarios including topic recommendation advancement (`Variables and constants -> Data types`), Wrong Answer + Compilation Error revision creation without duplicates, `Marked Difficult`, `Complete` + `Reschedule (+3d)` preserving attempts, manual Daily Challenge completion rejection (`400`), Judge0 `Accepted` Daily Challenge (`+10` problem XP + `+20` bonus XP), repeated `Accepted` awarding `0` duplicate XP, persistence across server restart, and `404` owner-scoped isolation for private revisions/submissions.
  - Live Browser (`http://localhost:5173` as `demo@codeclimb.dev`): verified `/dashboard` (3 unique Recommended Practice Problems, `Continue Learning` -> `/notes/data-types`, synchronized `Temperature Converter` Daily Challenge widget), `/revision` (summary cards, filters, `Difficult` button on `/practice/temperature-converter`, `Reschedule (+3d)`, `Mark as Revised`), and `/daily-challenge` (reload persistence, `Solve Challenge` -> Monaco workspace), with `0` console errors and `0` failed network requests.
- **Known Unresolved / Out-of-Scope Issues (Deferred to Phase 8+):**
  - On `/performance` (not part of Phase 7 scope), `Problems by Difficulty`, `Language Distribution`, `Topic-wise Performance`, `Weekly Activity Trend`, and `Submission History` UI components currently render empty states despite `/api/v1/progress/performance` returning `200` with populated data; `/leaderboard` `Problems Solved` column displays `0`.

## Phase 6 — Real Online Compiler and Automatic Code Assessment (Completed & Verified)
- **Real Isolated Judge0 CE Configuration (`server/.env`, `server/.env.example`):**
  - Configured `JUDGE0_API_URL=https://ce.judge0.com` (official public Judge0 CE v1.14.0 sandbox) and documented it in `server/.env.example`.
  - Verified dynamic `/languages` resolution across all 4 required languages: **C** (`GCC 14.1.0`, ID `103`), **C++** (`GCC 14.1.0`, ID `105`), **Java** (`JDK 17.0.6`, ID `91` with `wrapJavaCode` normalization), and **Python 3** (ID `113`/`71`).
- **Backend Security, Rate Limiting & Execution Hardening (`server/src/routes/submissionRoutes.js`, `server/src/controllers/submissionController.js`, `server/src/controllers/problemController.js`):**
  - Applied `submissionLimiter` (`15 req/min`) to `POST /api/v1/submissions/run` and `POST /api/v1/submissions/submit`.
  - Enforced `64 KB` max source code / custom input size, `32 KB` output truncation, `isSample: true` filtering when `testCaseIds` are passed to `runCode` (preventing hidden test-case leakage), and an in-memory per-user/problem `activeSubmissions` lock (`429` on duplicate concurrent submits).
  - Added `GET /api/v1/submissions/:id` (`getSubmissionById`, owner-scoped) and included `code`, `errorMessage`, and `compilerOutput` in `getSubmissions`.
  - Returned `xpAwarded` and `alreadySolved` in `submitCode` responses and synced `UserProgress` verified-topic completion on `Accepted`.
  - Added `.populate('topics', 'title slug')` to `getProblem` in `problemController.js` so problem topic pills display human-readable topic titles.
- **Frontend IDE, Draft Persistence & Result Normalization (`client/src/pages/ProblemSolvePage.tsx`):**
  - Fixed `extractDraftCodeForLanguage` to hydrate `CodeDraft` map responses (`{ python: "...", ... }`).
  - Updated `normalizeExecutionResult` to handle `runtimeMs`, `passed`/`total`, `xpAwarded`, synthesize custom-input `stdout` result rows, and derive top-level `verdict` / aggregated runtime & memory for sample `Run Code` responses.
  - Added a **Copy** (`Copy` / `Copied`) button to the right-panel Monaco editor toolbar next to `Reset`.
- **150-Problem & 712-Test-Case Structural Audit:**
  - Audited all `150` problems and `712` test cases in MongoDB Atlas: `0` missing descriptions, `0` missing I/O specs, `0` missing constraints, `0` missing examples, `0` problems without sample cases, `0` problems without hidden cases, and `0` missing starter templates across `c`, `cpp`, `java`, `python` (`150/150` have no stored reference solutions in DB; `5` problems have `noTopics`).
- **Verification Results:**
  - **Live Judge0 CE API Tests (`C`, `C++`, `Java`, `Python`):** Verified custom input (`42`), `Accepted` (`6/6`), `+10 XP` first-solve + `0 XP` duplicate-solve, `hiddenLeaked: false`, `Wrong Answer` (`0/6`), `Compilation Error` (`C++`), `Runtime Error` (`Python`), `CodeDraft` save/get, and `Submission` history with `code`.
  - **Automated Checks:** `server` `npm test` -> `3` test files, `23` tests passed; `client` `npm run lint` -> `0` errors (`13` warnings); `client` `tsc -b && vite build` -> succeeded.
  - **Live Browser (`http://localhost:5173/practice/sum-of-two-numbers` as `demo@codeclimb.dev`):** Verified readable topic pills (`Input and output`, `Arithmetic operators`), `Copy` -> `Copied` button, Python draft persistence across `page.reload()`, `Run Code` on Sample Test Cases (`Accepted`, `Passed 2/2 test cases`, `2482 ms`, `51.11 MB`), `Run Code` on Custom Input `100 250` (`Your Output: 350`), and `Submit` (`Accepted`, `6/6 passed`, `9549 ms`, `50.91 MB`) updating `Submissions` history with `0` console errors and `0` failed network requests.

## Phase 5E — External Learning Resources & Roadmap Resource UI (Completed & Verified)
- **Resource Coverage Audit (`RESOURCE_COVERAGE.md`):**
  - Audited all `348` concepts across all `24` modules and categorized them into: `Theory-only` (`116`), `Algorithm Concepts` (`88`), `Problem-solving Techniques` (`81`), `Data Structure Operations` (`46`), `Practice-oriented` (`13`), and `Programming Fundamentals` (`4`).
- **Verified External Resources (`server/src/seeds/notes/phase5eResources.js`, `server/src/seeds/upsertPhase5EResources.js`):**
  - Expanded HTTP/API-verified CodeChef problem links (`START01`, `FLOW001`, `HS08TEST`, `INTEST`, `FCTRL`, `FLOW006`, `FLOW007`, `PALL01`, `FCTRL2`, `CONFLIP`, `CNOTE`, `CLEANUP`, `LECANDY`, `LAPIN`, `HORSES`) and multi-problem `codechefLinks` / `leetcodeLinks` grouped by difficulty.
  - Expanded oEmbed-verified direct YouTube tutorials (Abdul Bari, CodeWithHarry, take U forward, Jenny's Lectures CS IT, CodeHelp - by Babbar, Michael Sambol, GeeksforGeeks, mycodeschool, NeetCode) with channel, language, and verification metadata.
  - Synced internal CodeClimb `Problem` mappings across both `Note.relatedProblems` and `Problem.topics` so Roadmap `Practice` buttons and Notes Reader `Related Practice Problems` stay 100% aligned.
- **Roadmap Resource Interface Upgrades (`server/src/models/Topic.js`, `client/src/types/index.ts`, `client/src/components/roadmap/TopicRow.tsx`):**
  - Extended `Topic.resources` schema with optional `channel`, `language`, `difficulty`, `verified`, `codechefLinks`, and `leetcodeLinks`.
  - Added compact `+N` `ResourcePopover` selectors in `TopicRow.tsx` for topics with multiple CodeChef, LeetCode, or YouTube resources, and visually distinguished **Direct YouTube Video** (red Play icon) vs **YouTube Search** (muted Search icon) vs **Resource Not Available**.
- **Live MongoDB Atlas Resource Audit (Post-Phase 5E):**
  - Verified CodeChef problem topics: `50` (up from `35`)
  - Verified LeetCode problem topics: `180` (up from `178`, plus multi-problem difficulty-organized sets)
  - Direct YouTube Video topics: `42` (`39` unique oEmbed-verified videos, up from `29` topics / `28` videos)
  - Remaining `YouTube Search` fallbacks: `306` (down from `319`)
  - Concepts with Internal CodeClimb Practice Problems: `151` (up from `98`)
- **Verification Results:**
  - `server`: `npm test` (Vitest) -> 3 test files, 23 tests passed.
  - `client`: `npm run lint` -> 0 errors (13 existing warnings); `tsc -b && vite build` -> succeeded.
  - Live Browser (`http://localhost:5173` as `demo@codeclimb.dev`): Verified `/roadmap?stage=beginner` (`#01`–`#05`), all 12 new CodeChef links, `+1`/`+2` multi-resource popovers (`Big O Notation`, `Factorial`, `Kadane's Algorithm`, `Majority Element / Stocks`, `Anagram Check`), Direct YouTube vs YouTube Search icons, `CC` self-reported persistence, and `/notes/big-o-notation`, `/notes/factorial`, `/notes/kadanes-algorithm`, with 0 console errors and 0 HTTP `4xx`/`5xx` responses.
- **Remaining / Future Improvements:**
  - `306` topics retain explicitly labeled `YouTube Search` fallbacks where direct video URLs have not yet been individually verified.
  - Judge0 code execution integration is deferred to the next phase as instructed.

## Phase 5D — Complete Modules 19–24 & Safe Markdown Rendering (Completed & Verified)
- **Modules 19–24 Rich Notes Completed (105 concepts across 6 modules):**
  - Module 19 (Greedy Algorithms): 11/11 (`server/src/seeds/notes/module19GreedyNotes.js`)
  - Module 20 (Graphs): 33/33 (`server/src/seeds/notes/module20GraphsNotes.js`)
  - Module 21 (Dynamic Programming): 29/29 (`server/src/seeds/notes/module21DpNotes.js`)
  - Module 22 (Tries): 10/10 (`server/src/seeds/notes/modules22to24Notes.js`)
  - Module 23 (Advanced String Algorithms): 8/8 (`server/src/seeds/notes/modules22to24Notes.js`)
  - Module 24 (Advanced Data Structures): 14/14 (`server/src/seeds/notes/modules22to24Notes.js`)
  - Every note includes Definition, Beginner-Friendly Explanation, Real-World Analogy, Algorithm/Pseudocode/Dry Run, Time & Space Complexity, Common Mistakes, Interview Tips, and 4-language implementations (`C`, `C++`, `Java`, `Python`) for coding topics.
- **Verified Learning Resources & Internal Practice Mapping (`server/src/seeds/notes/modules19to24Resources.js`, `server/src/seeds/upsertModules19to24.js`):**
  - Added HTTP/API-verified CodeChef problems (`CIELRCPT`, `NOKIA`, `FIRESC`, `DISHOWN`, `ALTARAY`, `DELISH`, `MULTQ3`, `FLIPCOIN`) and oEmbed-verified direct YouTube tutorials (Abdul Bari, take U forward, Aditya Verma, Tushar Roy). Topics without verified direct videos retain `YouTube Search` fallbacks.
  - Mapped internal CodeClimb `Problem` slugs directly to `note.relatedProblems` across Modules 19–24 (e.g., `activity-selection-problem`, `fractional-knapsack`, `shortest-path-dijkstra`, `0-1-knapsack`, `longest-common-subsequence`, `implement-trie-operations`, `kmp-pattern-search`, `range-sum-query-mutable`, `fenwick-tree-prefix-sums`).
  - Safely upserted via `server/src/seeds/upsertModules19to24.js` (scoped to Modules 19–24) without dropping collections or touching Modules 1–18 or student data.
- **Safe Markdown Rendering in Notes Reader (`client/src/components/common/MarkdownRenderer.tsx`, `client/src/pages/NotesPage.tsx`):**
  - Implemented zero-dependency, XSS-safe React `MarkdownRenderer` (no `dangerouslySetInnerHTML`) supporting headings, `**bold**`, `*italic*`, `` `inline code` ``, fenced code blocks, ordered/unordered lists, links, and GFM tables.
  - Integrated into `NotesPage.tsx` across Definition, Explanation, Real-World Analogy, Algorithm, Dry Run, Time/Space Complexity, Common Mistakes, and Interview Tips.
- **Live MongoDB Atlas Curriculum Audit (Post-Phase 5D):**
  - Total Modules: `24/24` (100% complete)
  - Total Concepts: `348/348` rich curated notes (0 template fallback notes)
  - Incomplete Modules: `0`
  - Verified External Links: `35` CodeChef links, `178` LeetCode links, `29` topics with direct YouTube video links, `319` topics with `YouTube Search` fallbacks
- **Verification Results:**
  - `server`: `npm test` (Vitest) -> 3 test files, 23 tests passed.
  - `client`: `npm run lint` -> 0 errors (13 existing warnings); `tsc -b && vite build` -> succeeded.
  - Live Browser (`http://localhost:5173` as `demo@codeclimb.dev`): Verified `/roadmap?stage=advanced` (`#19`–`#21`) and `/roadmap?stage=master` (`#22`–`#24`), CodeChef/LeetCode/direct YouTube/`YouTube Search`/internal `/practice/...` links, and 7 representative Notes Reader pages (`/notes/activity-selection`, `/notes/shortest-path-intro`, `/notes/dijkstras-algorithm`, `/notes/zero-one-knapsack`, `/notes/maximum-xor-using-binary-trie`, `/notes/kmp-algorithm`, `/notes/lazy-propagation`), confirming formatted `<table>`, `<strong>`, `<code>`, `<ul>`, `<ol>` rendering (zero raw markdown markers), 4-language code tabs + `Copy Code`, and `Previous Topic` / `Next Topic` navigation with 0 console errors and 0 HTTP `4xx`/`5xx` responses.
- **Remaining Notes:**
  - `319` topics still use `YouTube Search` fallbacks where direct video URLs were not yet individually verified; these can be incrementally upgraded without affecting curriculum completeness.

## Phase 5C — Detailed DSA Notes & Verified Learning Resources (Modules 13–18 Completed & Verified)
- **Modules 13–18 Rich Notes Completed (87 concepts across 6 modules):**
  - Module 13 (Two Pointers): 10/10 (`server/src/seeds/notes/modules13to15Notes.js`)
  - Module 14 (Sliding Window): 8/8 (`server/src/seeds/notes/modules13to15Notes.js`)
  - Module 15 (Bit Manipulation): 13/13 (`server/src/seeds/notes/modules13to15Notes.js`)
  - Module 16 (Backtracking): 11/11 (`server/src/seeds/notes/modules16to17Notes.js`)
  - Module 17 (Trees): 31/31 (`server/src/seeds/notes/modules16to17Notes.js` & `server/src/seeds/notes/modules17bto18Notes.js`)
  - Module 18 (Heaps and Priority Queues): 14/14 (`server/src/seeds/notes/modules17bto18Notes.js`)
  - Every note contains Definition, Beginner-Friendly Explanation, Real-World Analogy, Algorithm/Pseudocode/Dry Run, Time & Space Complexity (where applicable), Common Mistakes, Important Interview Observations, and 4-language implementations (C, C++, Java, Python) for coding topics.
- **Verified Learning Resources & Internal Practice Mapping (`server/src/seeds/notes/modules13to18Resources.js`, `server/src/seeds/upsertModules13to18.js`):**
  - Added HTTP/API-verified CodeChef problems (`RAINBOWA`, `NAME2`, `COVID19`, `CHEFZOT`, `ANDSUBAR`, `XORAGN`, `ANUMLA`, `TSECJ05`), LeetCode (`valid-palindrome`, `move-zeroes`), and oEmbed-verified direct YouTube tutorials (Abdul Bari, take U forward, CodeHelp - by Babbar, AlgoZen). Topics without verified direct videos retain `YouTube Search` fallbacks.
  - Mapped internal CodeClimb `Problem` slugs directly to `note.relatedProblems` across Modules 13–18 (e.g., `three-sum-count`, `container-with-most-water`, `trapping-rain-water`, `longest-unique-substring`, `single-number-xor`, `n-queens-count`, `lowest-common-ancestor`, `running-median-of-stream`).
  - Safely upserted via `server/src/seeds/upsertModules13to18.js` (scoped by `module: { $in: targetModIds }` so shared slugs like `heap-sort` in Module 18 are updated accurately without dropping any MongoDB collections).
- **Live MongoDB Atlas Curriculum Audit (Post-Phase 5C):**
  - Total Modules: `24` | Total Concepts: `348`
  - Rich Curated Notes: `245` (Modules 1–18: `243/243` = 100%, plus `2` core sample notes in Modules 20 & 21)
  - Template Fallback Notes Remaining: `103`
  - CodeChef Links: `27` | LeetCode Links: `178`
  - Direct YouTube Video Links: `25` topics | `YouTube Search` Fallbacks: `323` topics
  - **Remaining Incomplete Modules (Modules 19–24):**
    - `#19` Greedy Algorithms (`0/11`), `#20` Graphs (`1/33`), `#21` Dynamic Programming (`1/29`), `#22` Tries (`0/10`), `#23` Advanced String Algorithms (`0/8`), `#24` Advanced Data Structures (`0/14`).
- **Verification Results:**
  - `server`: `npm test` (Vitest) -> 3 test files, 23 tests passed.
  - `client`: `npm run lint` -> 0 errors (13 existing warnings); `tsc -b && vite build` -> succeeded.
  - Live Browser (`http://localhost:5173` as `demo@codeclimb.dev`): Verified `/roadmap?stage=advanced` (`#13`–`#18` expanded, CodeChef/LeetCode/YouTube/Practice links), and 6 representative Notes Reader pages (`/notes/three-sum`, `/notes/longest-substring-without-repeating`, `/notes/single-number`, `/notes/n-queens-problem`, `/notes/avl-rotations`, `/notes/median-from-data-stream`), 4-language tabs + `Copy Code`, `Previous Topic` / `Next Topic` navigation, Related Practice Problems links, and `Print / PDF` button, with 0 console errors and 0 HTTP `4xx`/`5xx` responses.
- **Outstanding Notes / Minor UI Observation:**
  - Inline markdown tokens (backticks/bold markers) inside Notes Reader prose paragraphs render as literal characters rather than styled inline code/bold HTML spans.

## Phase 5B — Detailed DSA Notes & Verified Learning Resources (Modules 7–12 Completed & Verified)
- **Modules 7–12 Rich Notes Completed (85 concepts across 6 modules):**
  - Module 7 (Sorting): 14/14 (`server/src/seeds/notes/modules7to9Notes.js`)
  - Module 8 (Searching): 12/12 (`server/src/seeds/notes/modules7to9Notes.js`)
  - Module 9 (Recursion): 13/13 (`server/src/seeds/notes/modules7to9Notes.js`)
  - Module 10 (Linked Lists): 17/17 (`server/src/seeds/notes/modules10to12Notes.js`)
  - Module 11 (Stacks): 16/16 (`server/src/seeds/notes/modules10to12Notes.js`)
  - Module 12 (Queues): 13/13 (`server/src/seeds/notes/modules10to12Notes.js`)
  - Every note contains Definition, Beginner-Friendly Explanation, Real-World Analogy, Algorithm/Pseudocode/Dry Run, Time & Space Complexity (where applicable), Common Mistakes, Important Interview Observations, and 4-language implementations (C, C++, Java, Python) for coding topics.
- **Verified Learning Resources (`server/src/seeds/notes/modules7to12Resources.js`):**
  - Added verified CodeChef problems (`TSORT`, `JOHNY`, `ZCO14003`, `STFOOD`, `STACKS`, `TRISQ`, `NOKIA`, `COMPILER`, `INPSTFIX`, `ONP`), LeetCode (`basic-calculator-ii`), and 13 direct YouTube tutorial links (Abdul Bari, take U forward, Jenny's Lectures, CodeWithHarry). Topics without verified direct videos retain `YouTube Search` fallbacks.
  - Safely upserted via `server/src/seeds/upsertModules7to12.js` without dropping or resetting any MongoDB collections.
- **Notes Reader & Navigation Enhancements (`server/src/controllers/topicController.js`, `client/src/pages/NotesPage.tsx`):**
  - Enhanced `GET /api/v1/topics/:slug` to populate `note.relatedProblems` (`title slug difficulty`) and return `prevTopic` / `nextTopic` within the module.
  - Added `Previous Topic` / `Next Topic` navigation links in `NotesPage.tsx`.
  - Fixed `Bookmark Notes` initial hydration bug in `NotesPage.tsx` (`bmRes.data?.data?.bookmarked`).
- **Live MongoDB Atlas Curriculum Audit (Post-Phase 5B):**
  - Total Modules: `24` | Total Concepts: `348`
  - Rich Curated Notes: `158` (Modules 1–6: `71`, Modules 7–12: `85`, plus `2` core sample notes in Modules 20 & 21)
  - Template Fallback Notes Remaining: `190`
  - CodeChef Links: `17` | LeetCode Links: `176`
  - Direct YouTube Video Links: `13` topics | `YouTube Search` Fallbacks: `335` topics
  - **Remaining Incomplete Modules (Modules 13–24):**
    - `#13` Two Pointers (`0/10`), `#14` Sliding Window (`0/8`), `#15` Bit Manipulation (`0/13`), `#16` Backtracking (`0/11`), `#17` Trees (`0/31`), `#18` Heaps and Priority Queues (`0/14`), `#19` Greedy Algorithms (`0/11`), `#20` Graphs (`1/33`), `#21` Dynamic Programming (`1/29`), `#22` Tries (`0/10`), `#23` Advanced String Algorithms (`0/8`), `#24` Advanced Data Structures (`0/14`).
- **Verification Results:**
  - `server`: `npm test` (Vitest) -> 3 test files, 23 tests passed.
  - `client`: `npm run lint` -> 0 errors (13 existing warnings); `tsc -b && vite build` -> succeeded.
  - Live Browser (`http://localhost:5173` as `demo@codeclimb.dev`): Verified `/roadmap?stage=intermediate` (`#07`, `#08`, `#10`, `#11`, `#12` links & badges), `/notes/merge-sort`, `/notes/binary-search-iterative`, `/notes/reverse-linked-list`, `/notes/infix-to-postfix`, `/notes/sliding-window-maximum`, `/notes/monotonic-queue` (related practice problem link), 4-language tabs + `Copy Code`, `Previous Topic` / `Next Topic` navigation, and reload persistence for both `Mark as Learned` (`Learned ✓`) and `Bookmark Notes` (`Bookmarked`), with 0 console errors and 0 HTTP `4xx`/`5xx` responses.

## Phase 5 — Complete DSA Roadmap & Learning Resources (Modules 1–6 Completed & Verified)
- [x] **Curriculum & Resource Coverage Audit (24 Modules, 348 Concepts):**
  - Total Modules: `24`
  - Total Concepts: `348`
  - Concepts with complete rich original notes: `76` (all `71` concepts across **Modules 1–6** via `modules1to6Notes.js` + `5` core concepts in Modules 7–24 via `sampleNotes.js`; remaining `272` concepts in Modules 7–24 currently use baseline notes and are pending rich note batches)
  - Verified CodeChef links: `6`
  - Verified LeetCode links: `175`
  - Verified direct YouTube video links: `0` (`348` YouTube Search fallback links, explicitly labeled `YouTube Search` in UI)
  - Concepts without external problem links (marked `Not Available`): `169`
  - Concepts with internal CodeClimb practice problems: `61`
- [x] **Roadmap & Notes Reader Enhancements:**
  - Fixed `UserProgress.isCompleted` persistence in `topicController.js` and `moduleController.js` (`getModules`, `getModule`, `getTopics`, `getTopic`, `updateProgress`), and added `selfReportedExternal` (`codechef`/`leetcode`) persistence + `problemSlug`, `isBookmarked`, `isVerified` enrichment.
  - Fixed `StrictPopulateError` 500 on `GET /api/v1/topics/:slug` in `topicController.js`.
  - Fixed module numbering `#01`–`#24` in `ModuleCard.tsx` and labeled `Not Available` + `YouTube Search` clearly in `TopicRow.tsx`.
  - Built full `NotesPage.tsx` reader (`/notes/:topicSlug`) with Definition, Explanation, Real-World Analogy, Algorithm, Pseudocode, Dry Run, Time/Space Complexity (omitted for theory-only concepts), Common Mistakes, Interview Tips, 4-language tabs (`C`, `C++`, `Java`, `Python`), Copy Code, Bookmark Notes, Mark as Learned, and Print/PDF.
  - Added `server/src/seeds/notes/modules1to6Notes.js` and safely upserted `76` complete notes into MongoDB Atlas via `upsertModules1to6Notes.js` without resetting any collections.
- [x] **Verification:**
  - `cd server && npm test`: `3` test files, `23` tests passed.
  - `cd client && npm run lint`: `0` errors (`13` warnings).
  - `cd client && npm run build`: `tsc -b && vite build` succeeded.
  - Live browser (`http://localhost:5173`): verified `#01`–`#24` module numbering, stage pills, 10 roadmap columns, completion checkbox persistence across `page.reload()`, bookmark toggle, `/notes/variables-and-constants`, and `/notes/kadanes-algorithm` (4 language tabs + Copy Code) with zero console or HTTP errors.
- [ ] **Remaining Content Batches:** Rich original notes & direct verified YouTube/CodeChef links for **Modules 7–24** (`272` concepts).

## Phase 2, 3 & 4 — Homepage Redesign, Feature Cards & Language Pages (Completed & Verified)
- [x] **Phase 2 (Homepage Hero & DSA Journey):**
  - Completely removed the Two Sum terminal demonstration (`climb_two_sum.cpp`, `Two Sum Indices`, `All Tests Passed`).
  - Added `GET /api/v1/modules/public-stats` (`moduleController.js`, `moduleRoutes.js`) returning live MongoDB counts (`24` DSA Modules, `348` Learning Concepts, `150` Coding Problems, `4` Programming Languages).
  - Built the interactive **"Build Your Coding Future."** DSA Learning Journey section in `LandingPage.tsx` with 4 live stat cards, 4 clickable learning stages (`Beginner`, `Intermediate`, `Advanced`, `Master DSA` -> `/roadmap?stage=...`), connecting lines, and **Explore DSA Roadmap** CTA.
  - Upgraded `RoadmapPage.tsx` to render all 24 MongoDB modules with stage filtering (`?stage=`), search, difficulty/status filters, expand/collapse, progress tracking, and bookmarks.
- [x] **Phase 3 (Clickable Feature Cards):**
  - Made all 4 feature cards (`Structured DSA Roadmap` -> `/roadmap`, `Practice Arena` -> `/practice`, `Daily Challenges` -> `/daily-challenge`, `Track Progress` -> `/performance`) fully clickable & keyboard-accessible with hover lift, arrow icons, and action labels.
  - Verified unauthenticated clicks redirect to `/login` and automatically redirect back to the intended destination after login.
- [x] **Phase 4 (Interactive Language Cards & Editor Pre-Selection):**
  - Created `LanguagePage.tsx` (`/languages`, `/languages/:lang`) for **C**, **C++**, **Java**, and **Python** with language switcher tabs, introductions, DSA libraries, 4 syntax/DSA code blocks with Copy buttons, YouTube tutorials, database-driven practice problems, and **Start Coding** CTA.
  - Wired `App.tsx` to load `ProblemSolvePage` (full Monaco Editor) at `/practice/:slug` and updated `ProblemSolvePage.tsx` to auto-select `?lang=` / `localStorage` / `user.preferredLanguage`.
- [x] **Navigation, Bug Fixes & Testing:**
  - Added smooth section scrolling (`scroll-mt-20`), auth-aware header (`Dashboard`/`Logout` when signed in), responsive mobile hamburger menu, and footer links.
  - Fixed `GET /api/v1/problems/tags` 404 by adding `getProblemTags` before `/:slug` in `problemRoutes.js`.
  - Verified `npm run lint` (`0` errors), `npm run build` (`tsc -b && vite build`), `npm test` (client `2/2` passed), and live browser verification across desktop & mobile (`390x844`) with zero console errors.

## Phase 1 — Fix Login and Registration Error 500 (Completed & Verified)
- [x] Configured `server/.env` with MongoDB Atlas (`codeclimb` database), auto-generated 96-char random `JWT_SECRET`, and verified `.gitignore` excludes `.env`.
- [x] Verified MongoDB Atlas connectivity (`codeclimb` cluster).
- [x] Ran `npm run seed` against MongoDB Atlas:
  - `24` DSA modules, `348` concepts/topics, `348` notes
  - `150` original coding problems, `712` test cases
  - `14` achievements, admin & demo student accounts, and today's Daily Challenge
- [x] Fixed backend DB fast-fail (`503` when disconnected), auth route aliases (`POST /logout`, `PUT /profile`, `PUT /password`), and `409`/`401` error messages.
- [x] Fixed `client/src/services/api.ts` (`getMe` / `updateProfile` response unwrapping and `5xx` server-unavailable message), `App.tsx` (`AppLayout` wrapper on protected routes for Sidebar + Navbar + Logout), `DashboardPage.tsx` (personalized welcome name), and `LoginPage.tsx` / `RegisterPage.tsx` (intended-destination redirect, authenticated redirect, deduplicated toasts).
- [x] Verified live in browser (`http://localhost:5173`): registration (`201 Created`), personalized dashboard (`200 OK`), reload persistence (`200 OK`), logout (`200 OK`), protected route redirect when logged out, and invalid-password error (`401` with single toast, zero `5xx`/console errors).

## Completed (Initial Build)
- [x] Root, `server/`, and `client/` project scaffold, `.env.example`, `.gitignore`, and `package.json` scripts
- [x] MongoDB Mongoose models (17 models in `server/src/models/`)
- [x] Backend core config (`db.js`, `constants.js`) and middleware (`auth.js`, `admin.js`, `errorHandler.js`, `rateLimiter.js`, `validate.js`)
- [x] Backend controllers & routes for auth, modules, topics, notes, problems, test-cases, submissions, code-drafts, bookmarks, revisions, recommendations, daily-challenges, leaderboard, progress, admin
- [x] Backend services (`judge0Service.js`, `recommendationService.js`, `revisionService.js`, `xpService.js`)
- [x] Core DSA algorithms module (`server/src/utils/dsaAlgorithms.js`) with unit tests (`server/tests/unit/dsaAlgorithms.test.js`)
- [x] Complete 24-module DSA curriculum (`modules1to6.js`, `modules7to12.js`, `modules13to18.js`, `modules19to24.js` — 24 modules, 348 concepts)
- [x] 150 original coding problems with 712+ test cases (`problems1to50.js`, `problems51to100.js`, `problems101to150.js`, `problemsExtra41.js`)
- [x] Original DSA notes (`sampleNotes.js` + automated baseline notes for every topic in `seedCurriculum.js`)
- [x] Achievements (`achievements.js`) and repeatable seed scripts (`index.js`, `seedCurriculum.js`, `seedProblems.js`, `seedDemo.js`)
- [x] Frontend UI (56 TypeScript/React files, responsive dark/light theme, Monaco editor, Recharts analytics, Admin panel)
- [x] ESLint config (`client/eslint.config.js`), Vitest configs (`server/vitest.config.js`, `client/vitest.config.ts`), Playwright config (`client/playwright.config.ts`) & E2E spec (`client/tests/e2e/app.spec.ts`)
- [x] Documentation (`README.md`, `docs/API.md`, `docs/DSA_DOCUMENTATION.md`, `docs/DEPLOYMENT.md`, `docs/COLLEGE_DEMO_GUIDE.md`)

## External Configuration Notes (Environment-Dependent)
- **MongoDB:** `mongod`/`mongosh` is not installed locally in this environment; configure `MONGODB_URI` in `server/.env` (local MongoDB or MongoDB Atlas) before running `npm run seed` or `npm run dev`.
- **Judge0:** Configure `JUDGE0_API_URL` (and `JUDGE0_API_KEY` if hosted) in `server/.env` for live C/C++/Java/Python execution. When unconfigured/unreachable, the backend accurately returns HTTP `503` without simulating fake execution.
- **Playwright E2E:** E2E spec created at `client/tests/e2e/app.spec.ts`; run `npm run test:e2e` with dev servers running and Playwright browsers installed.
