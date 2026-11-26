# CodeClimb — Deployment Status & Verification Report (Phase 10C)

**Date:** 2026-11-27
**Status:** **Live & Verified**

---

## 1. Deployment Details
| Component | Provider | URL / Identifier | Root Dir | Build / Start Command |
|---|---|---|---|---|
| **GitHub Repo** | GitHub (Public) | https://github.com/navdeep-jangir/Online-Coding-and-Assessment-Platform-Project (`main`) | `/` | N/A |
| **Frontend** | Vercel (Hobby) | https://codeclimb-beta.vercel.app | `client` | `npm ci` -> `npm run build` (`dist/`) |
| **Backend API** | Render (Free) | https://codeclimb-api-xv6m.onrender.com | `server` | `npm ci` -> `npm start` |
| **Health Check** | Render | https://codeclimb-api-xv6m.onrender.com/api/v1/health | — | `HTTP 200` (`database: "connected"`) |
| **Database** | MongoDB Atlas | `codeclimb` (`cluster.xhtj9ly.mongodb.net`) | — | Connected (Render outbound IPs whitelisted) |
| **Code Execution** | Judge0 CE | `https://ce.judge0.com` | — | Dynamic `/languages` (`C`, `C++`, `Java`, `Python`) |

### Required Environment Variable Names (No Secret Values)
- **Render (`server`):** `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `CLIENT_URL`, `JUDGE0_API_URL`, `TZ` (plus optional `JUDGE0_API_KEY`, `JUDGE0_API_HOST`).
- **Vercel (`client`):** None required (`client/vercel.json` proxies `/api/(.*)` to Render on the same origin).

---

## 2. Feature-Wise Live Verification Report (PASS / FAIL)

| # | Feature / Check | Result | Observed Evidence |
|---|---|---|---|
| 1 | Frontend <-> Backend Proxy Connectivity | **PASS** | `GET https://codeclimb-beta.vercel.app/api/v1/health` -> `HTTP 200` (`status: "ok"`, `database: "connected"`) |
| 2 | CORS & `CLIENT_URL` | **PASS** | Direct request with `Origin: https://codeclimb-beta.vercel.app` returned `access-control-allow-origin: https://codeclimb-beta.vercel.app`, `access-control-allow-credentials: true` |
| 3 | HTTP-Only Secure Cookies | **PASS** | `POST /api/v1/auth/register` set `HttpOnly; Secure; SameSite=Lax` cookie; persisted across `/dashboard` reload |
| 4 | `JWT_SECRET` & Admin Rotation | **PASS** | Local `JWT_SECRET` rotated (96 hex chars); `admin@codeclimb.dev` rotated via `npm run provision:admin`; old default rejected |
| 5 | Student Registration, Login & Logout | **PASS** | Registered temporary test accounts, blocked `role: admin` escalation (`student` assigned), logged out (`POST /api/v1/auth/logout` -> `200`), `/dashboard` redirected to `/login` |
| 6 | Administrator Login & RBAC | **PASS** | Student `/api/v1/admin/stats` -> `403`; Admin login -> `200`, `GET /api/v1/admin/stats` -> `200` (`totalProblems: 150`, `totalModules: 24`, `totalConcepts: 348`, `judge0Health: healthy`) |
| 7 | Judge0 4-Language Execution | **PASS** | Live `Accepted` on `sum-of-two-numbers` in **C**, **C++**, **Java**, and **Python**; custom input `200`; `Wrong Answer` & `Compilation Error` accurate |
| 8 | Protected Data Isolation | **PASS** | `referenceSolutions` omitted from problem API (`false`); `test-cases/problem/:id` returned only `2` sample cases (`hiddenTCsLeaked: false`) |
| 9 | 24 Modules, 348 Notes, 150 Problems | **PASS** | Homepage live DB stats (`24`, `348`, `150`, `4`); `/roadmap` rendered 24 modules; `/notes/variables-and-constants` rendered 4-language tabs |
| 10 | Student Workflows (Dashboard, Daily Challenge, Revision, Leaderboard, Performance, Bookmarks, Profile) | **PASS** | All endpoints returned `200` and all pages rendered with `0` console errors and `0` failed API requests |
| 11 | SPA Routing & Mobile Responsiveness | **PASS** | Direct `goto` + `reload` on `/login`, `/register`, `/languages/*`, `/dashboard` returned `200`; `390x844` mobile layout on `/` & `/roadmap` had zero horizontal overflow |
| 12 | Test Account Cleanup | **PASS** | All temporary/dev/E2E accounts deactivated (`isActive: false`); only `admin@codeclimb.dev` and `navdeepjangir2006@gmail.com` remain active |

---

## 3. Hosting & Security Limitations
- **Render Free Tier Cold Starts:** Spins down after 15 minutes of inactivity (~30–50s cold start on first wake).
- **Public Judge0 CE Rate Limits:** `https://ce.judge0.com` is a shared public sandbox suitable for college demonstrations; high-concurrency production usage should switch to self-hosted Docker or RapidAPI Judge0.
- **Hidden Test-Case Seed Files:** `server/src/seeds/problems/` is excluded from the public GitHub repository via `.gitignore`; all 150 problems and 712 test cases live in MongoDB Atlas.
- **Admin UI Browser Check:** Admin API login and `/admin/stats` were verified live over HTTPS; full 13-section Admin UI clicking was verified in Phase 10A/10B Playwright E2E (not re-clicked in the public browser subagent to avoid passing admin credentials to a subagent).

---

## 4. Future Update Instructions
1. Edit code locally, run `cd server && npm test` and `cd client && npm run lint && npm test && npm run build`.
2. Push to `main` on `navdeep-jangir/Online-Coding-and-Assessment-Platform-Project`.
3. Vercel and Render will auto-deploy their respective `client/` and `server/` directories without modifying MongoDB Atlas.
