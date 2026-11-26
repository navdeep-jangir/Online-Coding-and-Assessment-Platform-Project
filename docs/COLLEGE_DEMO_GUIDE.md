# CodeClimb — College Project Demonstration Guide

**Project:** A6 – Online Coding and Assessment Platform using Data Structures and Algorithms  
**Tagline:** Learn. Practice. Climb.

## Recommended 8-Minute Demo Flow

1. **Landing Page (`/`):** Highlight the dark-mode UI (`#0D1117`), CodeClimb mountain+brackets logo, and platform overview.
2. **Student Registration & Auth (`/register`, `/login`):** Register a student account (name, email, password, college name, preferred language). Show that JWT is stored in an HTTP-only cookie and `role` cannot be escalated to `admin`.
3. **Student Dashboard (`/dashboard`):** Show database-driven stats (solved counts, streaks, XP, weekly Recharts activity chart, Daily Challenge card, Revision reminders, and Recommended Next Topic).
4. **24-Module DSA Roadmap (`/roadmap`):** Expand Module 1–24, filter by difficulty/status, toggle topic completion, open original Notes (`/notes/:topicSlug`) with 4-language implementations, and inspect verified LeetCode/CodeChef/YouTube links.
5. **Practice Arena & Monaco Editor (`/practice`, `/practice/:slug`):** Filter among 150 original problems, open the split-screen Monaco workspace, switch between C, C++, Java, and Python, run custom input, and submit for hidden test-case grading.
6. **Revision Mode & Daily Challenge (`/revision`, `/daily-challenge`):** Show spaced-repetition queue (`1, 3, 7, 14` days) and IST daily challenge timer.
7. **Leaderboard & Performance Analytics (`/leaderboard`, `/performance`):** Show Global/Weekly/Monthly rankings and exportable CSV/printable reports.
8. **Admin Panel (`/admin`):** Log in as admin to demonstrate problem/test-case management, user management, and `AdminAuditLog`.

## Key Viva Questions & Talking Points
- **Where is DSA actually used in the app?** Point to `server/src/utils/dsaAlgorithms.js` (DAG + Topological Sort for prerequisites, Min-Heap Priority Queue for revisions, Merge Sort for leaderboard, Binary Search, Hash Maps/Sets, and Cycle Detection).
- **How is untrusted student code isolated?** Student code never runs inside Node/Express; it is dispatched to Judge0 with CPU time limits, memory limits, and base64 encoding.
- **How is security enforced?** Server-side `protect` and `authorize('admin')` middleware, bcrypt password hashing, HTTP-only JWT cookies, Helmet, HPP, and rate limiting.
