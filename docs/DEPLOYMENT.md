# CodeClimb Deployment Guide

## 1. MongoDB Setup
- **Local:** Install MongoDB Community Server and start `mongod` on port `27017` (`MONGODB_URI=mongodb://localhost:27017/codeclimb`).
- **Cloud (MongoDB Atlas):** Create a free M0 cluster, whitelist your server IP, and set `MONGODB_URI` to your SRV connection string.

## 2. Judge0 Code Execution Setup
CodeClimb integrates with **Judge0 CE** (`server/src/services/judge0Service.js`) and dynamically discovers supported language IDs from `/languages`.
- **Option A — Self-Hosted Docker (Recommended for production/college lab):**
  Run Judge0 CE with `docker-compose` and set `JUDGE0_API_URL=http://localhost:2358`.
- **Option B — RapidAPI Hosted Judge0:**
  Set `JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com`, `JUDGE0_API_KEY=<your-key>`, and `JUDGE0_API_HOST=judge0-ce.p.rapidapi.com`.
- **Fallback Behavior:** If Judge0 is not running or `JUDGE0_API_URL` is unset, CodeClimb returns HTTP `503` with an explicit `"Code execution service is currently unavailable"` message and never simulates fake execution.

## 3. Production Build & Hosting
1. Build frontend assets:
   ```bash
   cd client && npm run build
   ```
2. Set `NODE_ENV=production`, a strong `JWT_SECRET`, `CLIENT_URL` (your HTTPS frontend origin), and `TZ=Asia/Kolkata`.
3. Run the Express server with PM2 or Docker (`npm start` inside `server/`).
4. Put Nginx or a cloud load balancer in front with HTTPS enabled so `secure: true` HTTP-only cookies work properly.
