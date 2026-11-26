# CodeClimb

**Learn. Practice. Climb.**

**A6 — Online Coding and Assessment Platform using Data Structures and Algorithms.**

CodeClimb is a full-stack online coding education, structured DSA learning, and automated code assessment platform built with React, TypeScript, Tailwind CSS, Node.js, Express, MongoDB Atlas, Monaco Editor, and Judge0 CE.

- **GitHub Repository:** https://github.com/navdeep-jangir/Online-Coding-and-Assessment-Platform-Project
- **Live Website URL (Vercel):** https://codeclimb-beta.vercel.app
- **Live Backend API URL (Render):** https://codeclimb-api-xv6m.onrender.com
- **Backend Health Endpoint:** https://codeclimb-api-xv6m.onrender.com/api/v1/health

---

## 1. Project Overview & Problem Statement

Students learning Data Structures and Algorithms (DSA) often struggle with fragmented resources: theory notes live on one site, curated problem sets on another, compilers in a separate IDE, and revision tracking in manual spreadsheets.

**CodeClimb** unifies the entire learning-to-assessment loop in a single platform:
1. **Learn** structured concepts across 24 DSA modules and 348 rich original notes with 4-language code examples and verified external links.
2. **Practice** 150 original coding problems in an integrated Monaco Editor backed by real isolated Judge0 CE execution (`C`, `C++`, `Java`, `Python`) and 712 sample/hidden test cases.
3. **Climb** with a DAG-based Intelligent Learning Path, spaced-repetition Smart Revision Mode, IST (`Asia/Kolkata`) Daily Challenges, XP, 18 achievements, leaderboards, and exportable performance analytics.

### Main Objectives
- Deliver a complete beginner-to-advanced DSA curriculum (`24` modules, `348` concepts, `348` curated notes).
- Provide real, isolated multi-language code execution and automated sample + hidden test-case grading.
- Apply core DSA algorithms (DAG + Kahn's Topological Sort, Priority Queues, Hash Maps/Sets, Merge Sort) directly inside the platform's recommendation, revision, and leaderboard engines.
- Provide a secure, role-based 13-section Admin Panel for curriculum, problem, test-case, student, and audit management.

---

## 2. Complete Feature List

### Student Features
- **24-Module DSA Roadmap:** Expandable `Module -> Subtopic -> Concept -> Notes & Resources -> Practice Problem` hierarchy with completion tracking and bookmarks.
- **Notes Reader:** Safe React Markdown rendering with visual diagrams, dry runs, complexity analysis, 4-language code tabs (`C`, `C++`, `Java`, `Python`), and verified CodeChef, LeetCode, and YouTube resources.
- **Language Learning Pages:** Dedicated interactive pages for `C`, `C++`, `Java`, and `Python` with Monaco pre-selection.
- **Practice Arena & Monaco Workspace:** 150 active coding problems, `CodeDraft` autosave, custom input execution, sample test-case runner, and full hidden test-case submission grading.
- **Intelligent Learning Path:** Prerequisite DAG + Kahn's topological sort + `MinPriorityQueue` recommending next concepts and practice problems.
- **Smart Revision Mode:** Spaced-repetition (`1, 3, 7, 14` days) `RevisionPriorityQueue` auto-populated on incorrect verdicts or manual difficulty flags.
- **Daily Coding Challenges:** Personalized IST (`Asia/Kolkata`) daily challenges with non-punitive streak tracking and atomic `+20` bonus XP.
- **Leaderboard, XP & Achievements:** Distinct-problem solved counts, Easy/Medium/Hard breakdown, Global/Weekly/Monthly rankings, `18` achievements, and opt-out privacy toggle.
- **Performance Analytics & Reports:** Recharts visualizations, searchable/filterable Submission History, RFC 4180 + formula-injection-safe CSV export, and printable PDF reports.

### Administrator Features (13-Section Admin Panel)
- **Overview & Health:** Live student, submission, curriculum, and Judge0 health metrics.
- **Student Management & Reports:** Search/filter students, activate/deactivate accounts, inspect progress, and export individual CSV/printable reports.
- **Coding Problems & Test Cases:** Draft-first creation, sample & hidden test-case management, live Judge0 reference-solution validation, publication gating, and soft archival.
- **Curriculum, Notes & Resources:** Module/topic management, DAG cycle detection (`detectCycle`), Markdown note editing, and external resource verification.
- **Operations:** Daily Challenge scheduling, Submission monitoring, Achievement management, and immutable Audit Logs.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, Monaco Editor, React Router v6, Axios |
| **Backend** | Node.js, Express.js, Mongoose (MongoDB Atlas), JWT (`httpOnly` cookies + Bearer fallback), bcryptjs, Helmet, HPP, Express Rate Limit, Express Validator |
| **Code Execution** | Judge0 CE v1.14.0 (dynamic `/languages` discovery for `C`, `C++`, `Java`, `Python`) |
| **Testing** | Vitest, Supertest, React Testing Library, Playwright (Chromium) |

---

## 4. Architecture Diagram

```text
+-------------------------------------------------------------------+
|                        Client (Vercel / Vite)                     |
|   React 18 + TypeScript + Tailwind + Monaco Editor + Recharts     |
+---------------------------------+---------------------------------+
                                  | HTTPS (/api/v1 via same-origin proxy)
                                  v
+-------------------------------------------------------------------+
|                   Backend API (Render / Node + Express)           |
|  Auth (JWT httpOnly) | Rate Limiter | Curriculum | Recommendations|
|  Submissions | Revisions | Daily Challenges | Leaderboard | Admin |
+----------------+---------------------------------+----------------+
                 |                                 |
                 v                                 v
+---------------------------------+   +-----------------------------+
|      MongoDB Atlas (codeclimb)  |   |   Judge0 CE Sandbox         |
|  24 Modules | 348 Notes         |   |   Isolated C / C++ /        |
|  150 Problems | 712 Test Cases  |   |   Java / Python Execution   |
+---------------------------------+   +-----------------------------+
```

---

## 5. DSA Concepts Used in the Application

- **Directed Acyclic Graph (DAG) & Kahn's Topological Sort:** Models prerequisite dependencies across DSA topics and detects cycles on curriculum updates (`server/src/utils/dsaAlgorithms.js`, `recommendationService.js`).
- **Min Priority Queue (Binary Heap):** Orders recommended topics and spaced-repetition revision items (`RevisionPriorityQueue`) by urgency and difficulty.
- **Hash Maps & Hash Sets:** Deduplicates distinct solved problems, tracks weak topics, and computes O(1) lookups across recommendation and analytics pipelines.
- **Merge Sort:** Deterministic multi-key leaderboard ranking (`xp DESC -> solvedCount DESC -> streak DESC -> name ASC`).

---

## 6. Workflows

### Student Workflow
1. Register or sign in (`/register`, `/login`) -> redirected to personalized **Dashboard** (`/dashboard`).
2. Follow **Recommended Next Topic** or explore the **24-Module DSA Roadmap** (`/roadmap`) -> read **Notes** (`/notes/:slug`).
3. Solve problems in the **Practice Arena** (`/practice/:slug`) using `C`, `C++`, `Java`, or `Python` -> earn XP and achievements.
4. Review mistakes in **Smart Revision Mode** (`/revision`), complete **Daily Challenges** (`/daily-challenge`), and track progress on **Performance** (`/performance`) & **Leaderboard** (`/leaderboard`).

### Administrator Workflow
1. Sign in with an administrator account provisioned via `npm run provision:admin` -> access `/admin`.
2. Create or edit problems in draft mode, attach sample & hidden test cases, run **Judge0 Reference Validation**, and publish.
3. Monitor student submissions, manage curriculum DAG prerequisites, schedule daily challenges, and review **Audit Logs**.

---

## 7. Supported Programming Languages

| Language | Compiler / Runtime | Judge0 Discovery |
|---|---|---|
| **C** | GCC 14.1.0 | Dynamic `/languages` match (`C (GCC...)`) |
| **C++** | GCC 14.1.0 | Dynamic `/languages` match (`C++ (GCC...)`) |
| **Java** | OpenJDK 17.0.6 | Dynamic `/languages` match (`Java (OpenJDK...)`) + `Main` wrapper |
| **Python** | Python 3 | Dynamic `/languages` match (`Python 3...`) |

---

## 8. Local Installation & Environment Setup

### Prerequisites
- **Node.js** v18+
- **MongoDB** (MongoDB Atlas or local MongoDB Community Server)
- **Judge0 CE** endpoint (`https://ce.judge0.com` for development, or self-hosted Docker / RapidAPI for production)

### Setup
```powershell
# 1. Install dependencies (root, server, client)
npm run install:all

# 2. Copy environment template and configure placeholders
Copy-Item server\.env.example server\.env
```

Configure `server/.env` (never commit `.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-strong-random-jwt-secret>
JWT_EXPIRE=7d
JUDGE0_API_URL=https://ce.judge0.com
JUDGE0_API_KEY=
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<your-strong-admin-password>
TZ=Asia/Kolkata
```

### Commands
| Command | Description |
|---|---|
| `npm run dev` | Run backend and frontend concurrently in development |
| `cd server && npm start` | Start production Express server |
| `cd client && npm run build` | Type-check and build production Vite bundle (`dist/`) |
| `cd server && npm run provision:admin` | Safely provision/rotate admin credentials from `server/.env` |
| `cd server && npm test` | Run backend unit & integration tests (Vitest + Supertest) |
| `cd client && npm test` | Run frontend unit tests (Vitest + Testing Library) |
| `cd client && npm run lint` | Run ESLint on frontend |
| `cd client && npx playwright test --project=chromium` | Run Playwright E2E regression tests |

---

## 9. Verification & Testing Results (Phase 10B)

- **Backend Tests (`cd server && npm test`):** `3/3` test files, `23/23` tests passed.
- **Frontend Unit Tests (`cd client && npm test`):** `1/1` file, `2/2` tests passed.
- **Frontend Lint (`cd client && npm run lint`):** `0` errors (`2` non-blocking `react-refresh` context-hook warnings).
- **Frontend Build (`cd client && npm run build`):** `tsc -b && vite build` succeeded (`2955` modules).
- **Playwright E2E (`npx playwright test --project=chromium --workers=1`):** `8/8` tests passed.
- **Coding Problem Validation:** `150/150` active coding problems (`712` test cases) live-validated in Python 3 via Judge0 CE (`0` unmapped problems).

---

## 10. Project Folder Structure

```text
CodeClimber/
├── client/                  # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/      # UI, editor, roadmap, and admin components
│   │   ├── contexts/        # AuthContext, ThemeContext
│   │   ├── pages/           # Student & Admin pages
│   │   ├── services/api.ts  # Axios client & typed API wrappers
│   │   └── types/           # TypeScript interfaces
│   ├── tests/               # Unit & Playwright E2E tests
│   └── vercel.json          # Vercel SPA & API proxy rewrites
├── server/                  # Node.js + Express + Mongoose backend
│   ├── src/
│   │   ├── config/          # DB connection & constants
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, RBAC, rate limiting, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express API v1 routers
│   │   ├── seeds/           # Curriculum, notes, achievements & admin provisioning
│   │   ├── services/        # Judge0, recommendations, revisions, XP
│   │   └── utils/           # DSA algorithms & helpers
│   └── tests/               # Unit & Supertest API integration tests
├── docs/                    # API, DSA, Deployment, and Demo documentation
├── FINAL_AUDIT.md           # Functional & security audit report
├── PROBLEM_VALIDATION.md    # 150-problem validation report
├── PROJECT_PROGRESS.md      # Phase-by-phase progress log
└── RESOURCE_COVERAGE.md     # External learning resource audit
```

---

## 11. Known Limitations
- **Public Judge0 CE Rate Limits:** Public `https://ce.judge0.com` is intended for development/demonstration; high-concurrency production usage requires a self-hosted Judge0 instance or RapidAPI Judge0 key.
- **Reference Solution Languages:** All `150` problems are live-validated in Python 3; C, C++, and Java reference solutions have not yet been batch-validated.
- **Hidden Assessment Data:** Hidden test-case seed files (`server/src/seeds/problems/`) and `.env` files are excluded from public version control and stored securely in MongoDB Atlas.
