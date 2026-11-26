# CodeClimb REST API Documentation

**Base URL:** `/api/v1`
**Authentication:** JWT stored in an HTTP-only cookie (`token`) with `Bearer` header fallback for API clients.

## Response Format
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "message": "..." }`

---

## 1. Authentication (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a student (`name`, `email`, `password`, `collegeName`, `preferredLanguage`). Role is forced to `student`. |
| `POST` | `/auth/login` | Public | Authenticate user and set HTTP-only JWT cookie. |
| `GET` | `/auth/logout` | Public | Clear authentication cookie. |
| `GET` | `/auth/me` | Private | Get currently authenticated user profile. |
| `PUT` | `/auth/change-password` | Private | Verify `currentPassword` and update to `newPassword`. |
| `PUT` | `/auth/update-profile` | Private | Update `name`, `collegeName`, `preferredLanguage`. |
| `POST` | `/auth/forgot-password` | Public | Generate time-limited SHA-256 reset token (10 min). |
| `PUT` | `/auth/reset-password/:token` | Public | Reset password using valid token. |

## 2. Curriculum & Notes (`/modules`, `/topics`, `/notes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/modules` | Public/Auth | List all 24 modules ordered by `order` with topic counts and user progress. |
| `GET` | `/modules/:id` | Public/Auth | Get single module and its topics. |
| `POST/PUT/DELETE` | `/modules` | Admin | Create, update, or archive a module. |
| `GET` | `/topics` | Public/Auth | List topics filtered by module, difficulty, or search. |
| `PUT` | `/topics/:id/progress` | Private | Toggle topic completion or self-reported external problem status. |
| `GET` | `/notes/topic/:topicId` | Private | Fetch full learning note (explanation, pseudocode, 4-language implementations). |
| `POST/PUT` | `/notes` | Admin | Create or update learning notes. |

## 3. Practice Problems & Test Cases (`/problems`, `/test-cases`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/problems` | Public/Auth | Paginated problem list with `difficulty`, `topic`, `search`, `status` (`solved`/`unsolved`). |
| `GET` | `/problems/recommended` | Private | Recommended unsolved problems based on user progress. |
| `GET` | `/problems/:slug` | Public/Auth | Problem details, sample test cases (hidden test cases excluded for students), starter code, and user drafts. |
| `POST/PUT/DELETE` | `/problems` | Admin | Create, update, or archive problems. |
| `GET` | `/test-cases/problem/:problemId` | Private | Sample test cases for students; all test cases for admins. |

## 4. Code Execution, Submissions & Drafts (`/submissions`, `/code-drafts`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/submissions/run` | Private | Run code via Judge0 against sample test cases or `customInput`. |
| `POST` | `/submissions/submit` | Private | Evaluate against all public & hidden test cases, record verdict, award XP, update revision queue. |
| `GET` | `/submissions/problem/:problemId` | Private | User's submission history for a problem. |
| `GET` | `/submissions/all` | Admin | All platform submissions with filters. |
| `POST` | `/code-drafts` | Private | Autosave code draft for `(user, problem, language)`. |
| `GET` | `/code-drafts/:problemId` | Private | Retrieve saved drafts per language. |

## 5. Learning Path, Revision, Daily Challenge, Leaderboard & Analytics
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/recommendations/next` | Private | DAG + Topological Sort next recommended topic with explanation. |
| `GET` | `/recommendations/weak-topics` | Private | Topics with low acceptance rates. |
| `GET` | `/revisions` | Private | Priority-ordered revision queue (`failed`, `difficult`, `bookmarked`, `overdue`). |
| `PUT` | `/revisions/:id/complete` | Private | Mark revision completed. |
| `PUT` | `/revisions/:id/reschedule` | Private | Reschedule using spaced repetition (`1, 3, 7, 14` days). |
| `GET` | `/daily-challenges/today` | Private | Today's challenge in `Asia/Kolkata` timezone. |
| `POST` | `/daily-challenges/attempt` | Private | Record attempt and award bonus XP without duplicates. |
| `GET` | `/daily-challenges/history` | Private | Past daily challenges and user completion status. |
| `GET` | `/leaderboard` | Private | Global, weekly, or monthly rankings (no private emails exposed). |
| `GET` | `/progress/dashboard` | Private | Real-time dashboard stats, streaks, recent submissions, weekly activity. |
| `GET` | `/progress/performance` | Private | Topic-wise, language-wise, and difficulty-wise analytics. |
| `GET` | `/progress/export` | Private | CSV export of student performance. |
| `GET/POST` | `/bookmarks` | Private | List and toggle bookmarks for problems, topics, and notes. |

## 6. Admin (`/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/stats` | Admin | Platform-wide totals and active user stats. |
| `GET` | `/admin/users` | Admin | Searchable, paginated user directory. |
| `PUT` | `/admin/users/:id/deactivate` | Admin | Deactivate a user account (recorded in audit log). |
| `GET` | `/admin/audit-log` | Admin | View `AdminAuditLog` entries. |
