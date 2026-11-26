# CodeClimb Deployment Guide

## 1. Production Architecture
- **GitHub Repository:** https://github.com/navdeep-jangir/Online-Coding-and-Assessment-Platform-Project (`main` branch)
- **Frontend Hosting (Vercel):** https://codeclimb-beta.vercel.app
  - Root Directory: `client`
  - Framework Preset: `Vite`
  - Install Command: `npm ci`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Proxy & SPA Rewrites (`client/vercel.json`): proxies `/api/(.*)` -> `https://codeclimb-api-xv6m.onrender.com/api/$1` (same-origin cookie authentication) and rewrites `/(.*)` -> `/index.html`.
- **Backend Hosting (Render):** https://codeclimb-api-xv6m.onrender.com
  - Root Directory: `server`
  - Runtime: `Node`
  - Build Command: `npm ci`
  - Start Command: `npm start`
  - Health Check Path: `/api/v1/health`
  - Auto-Deploy: `On Commit` (`main`)

## 2. Required Backend Environment Variables (Render Dashboard)
Configure these in **Render -> Environment** (never commit secrets to GitHub):
- `NODE_ENV=production`
- `MONGODB_URI` (MongoDB Atlas SRV URI targeting database `codeclimb` with least-privilege user)
- `JWT_SECRET` (cryptographically random 96-char hex secret)
- `JWT_EXPIRE=7d`
- `CLIENT_URL=https://codeclimb-beta.vercel.app`
- `JUDGE0_API_URL=https://ce.judge0.com` (or RapidAPI / self-hosted Judge0 endpoint)
- `JUDGE0_API_KEY` / `JUDGE0_API_HOST` *(if using RapidAPI Judge0)*
- `TZ=Asia/Kolkata`

## 3. MongoDB Atlas Setup
- Database name: `codeclimb` (contains 24 DSA modules, 348 curated notes, 150 active coding problems, 712 test cases, 150 validated Python reference solutions, achievements, and student/admin records).
- Add Render's outbound IP ranges (from Render **Connect -> Outbound**) to **MongoDB Atlas -> Network Access**.
- Never run destructive seed scripts (`seed:problems`, `seed:demo`) against production.
- To safely provision or rotate the administrator password locally:
  1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`.
  2. Run `cd server && npm run provision:admin`.

## 4. Judge0 Code Execution Setup
- **Current Demo Endpoint:** `https://ce.judge0.com` (public Judge0 CE v1.14.0 sandbox, dynamically resolves C, C++, Java, and Python).
- **Recommended Production Upgrade:** Self-hosted Docker Judge0 (`http://...`) or RapidAPI Judge0 (`https://judge0-ce.p.rapidapi.com` + `JUDGE0_API_KEY` + `JUDGE0_API_HOST`) for higher rate limits.
- **Fallback Behavior:** If Judge0 is unavailable, CodeClimb returns HTTP `503` without simulating fake execution.

## 5. Safe Continuous Deployment Updates
1. Make changes locally and run `cd server && npm test` and `cd client && npm run lint && npm test && npm run build`.
2. Commit and push to `main` on `navdeep-jangir/Online-Coding-and-Assessment-Platform-Project` (never commit `.env` or `server/src/seeds/problems/`).
3. Both Vercel (`client/`) and Render (`server/`) automatically redeploy from `main` without resetting MongoDB Atlas.
