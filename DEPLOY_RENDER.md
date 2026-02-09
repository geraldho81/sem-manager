# Deploy SEM Manager on Render

## Step 1: Deploy Backend

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"+ New"** (top right) → **"Web Service"**
3. Connect your GitHub repo: `geraldho81/sem-manager`
4. Fill in these fields:

| Field | Value |
|-------|-------|
| Name | `sem-manager-backend` |
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT --ws wsproto` |
| Plan | Free |

5. Scroll to **Environment Variables** and add these:

| Key | Value |
|-----|-------|
| `KIMI_API_KEY` | Your Moonshot API key |
| `KIMI_API_BASE` | `https://api.moonshot.ai/v1` |
| `KIMI_MODEL_STANDARD` | `kimi-k2-turbo-preview` |
| `KIMI_MODEL_THINKING` | `kimi-k2.5` |
| `DATAFORSEO_LOGIN` | Your DataForSEO login |
| `DATAFORSEO_PASSWORD` | Your DataForSEO password |

6. Click **"Deploy Web Service"**
7. Wait for deploy to finish
8. Copy the backend URL (e.g. `https://sem-manager-vk0f.onrender.com`)

---

## Step 2: Deploy Frontend

1. Click **"+ New"** (top right) → **"Web Service"**
2. Connect the same repo: `geraldho81/sem-manager`
3. Fill in these fields:

| Field | Value |
|-------|-------|
| Name | `sem-manager-frontend` |
| Root Directory | `frontend` |
| Runtime | `Node` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Plan | Free |

4. Add **1 environment variable**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_BACKEND_URL` | Your backend URL from Step 1 (e.g. `https://sem-manager-vk0f.onrender.com`) |

5. Click **"Deploy Web Service"**
6. Wait for deploy to finish
7. Copy the frontend URL (e.g. `https://sem-manager-frontend.onrender.com`)

---

## Step 3: Link Backend to Frontend

1. Go back to your **backend** service on Render
2. Click **"Environment"** in the left sidebar
3. Click **"Edit"** and add one more variable:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | Your frontend URL from Step 2 (e.g. `https://sem-manager-frontend.onrender.com`) |

4. Click **"Save Changes"** — backend will auto-redeploy

---

## Done

Your app is live at the frontend URL.

### Notes
- Free tier spins down after 15 min of inactivity. First request after idle takes ~30-60s.
- Output files (Excel, MD) are stored in temp storage. Users should download immediately from the Results page.
- The Browse folder button is hidden on cloud deployment (only works on macOS locally).
