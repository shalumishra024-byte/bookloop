# BookLoop Production Deployment Guide (Vercel + Render + Neon)

This guide walks through deploying the **BookLoop** frontend (`client/`) to **Vercel** and the backend (`server/`) to **Render**, connected to **NeonDB** and **Neon Managed Better Auth**.

---

## 1. Deploy Backend (`server/`) to Render

You can deploy either via the included [`render.yaml`](file:///c:/Users/ACER/OneDrive/Desktop/bookloop/render.yaml) Blueprint or manually as a Web Service:

1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service** (connect `shalumishra024-byte/bookloop`).
2. Configure the service settings:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Add the following **Environment Variables** in Render:

| Key | Value / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your NeonDB PostgreSQL pooled connection string |
| `JWT_SECRET` | A strong random 32+ character secret string |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | Your Vercel frontend URL (e.g., `https://bookloop.vercel.app`) — comma-separated if multiple |
| `NEON_AUTH_BASE_URL` | Your Neon Managed Auth URL (`.../neondb/auth`) |
| `NEON_AUTH_JWKS_URL` | Your Neon Managed Auth JWKS URL (`.../neondb/auth/.well-known/jwks.json`) |

4. Deploy and note your Render URL (e.g., `https://bookloop-api.onrender.com`).
   Verify it is live by visiting `https://bookloop-api.onrender.com/api/health`.

---

## 2. Deploy Frontend (`client/`) to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new) and import `shalumishra024-byte/bookloop`.
2. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - *(Note: `client/vercel.json` is already configured with SPA rewrites so React Router routes work on page refresh.)*
3. Add the following **Environment Variables** in Vercel:

| Key | Value / Description |
| :--- | :--- |
| `VITE_API_URL` | Your Render backend URL without trailing slash (e.g., `https://bookloop-api.onrender.com`) |
| `VITE_NEON_AUTH_URL` | Your Neon Managed Auth URL (`.../neondb/auth`) |

4. Click **Deploy** and note your Vercel URL (e.g., `https://bookloop.vercel.app`).

---

## 3. Post-Deploy Sync (CORS & Neon Auth Trusted Domains)

Once Vercel gives you your live frontend URL (e.g. `https://bookloop.vercel.app`):

1. **Update Render `FRONTEND_URL`**:
   Set `FRONTEND_URL` in Render's Environment tab to `https://bookloop.vercel.app` (or `https://bookloop.vercel.app,http://localhost:5173`) and trigger a redeploy/restart.
2. **Allow Vercel Origin in Neon Auth**:
   Run the Neon CLI locally so Neon Managed Better Auth trusts requests from your Vercel domain:
   ```bash
   npx neon neon-auth domain add https://bookloop.vercel.app
   ```
