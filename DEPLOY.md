# Deploy Coffee Finder

## 1. Push to GitHub

```bash
cd /Users/sanket/coffee-sommelier
git add .
git commit -m "Initial commit: Coffee Finder app"
```

Then on [github.com/new](https://github.com/new):
- Create a new repo (e.g. `coffee-sommelier`)
- **Don't** add README or .gitignore
- Copy the repo URL

```bash
git remote add origin https://github.com/YOUR_USERNAME/coffee-sommelier.git
git branch -M main
git push -u origin main
```

---

## 2. Publish the Website

### Option A: Vercel (recommended – free)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** → import `coffee-sommelier`
3. Configure:
   - **Root Directory:** `consumer`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add env var (when you have a backend):
   - `VITE_API_URL` = your API URL (e.g. `https://your-api.railway.app`)
5. Deploy

Your site will be live at `https://coffee-sommelier-xxx.vercel.app`.

### Option B: Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Connect GitHub and select `coffee-sommelier`
3. Settings:
   - **Base directory:** `consumer`
   - **Build command:** `npm run build`
   - **Publish directory:** `consumer/dist`
4. Deploy

---

## 3. Backend (for full features)

The frontend needs the API for discover, orders, and auth. To run the backend online:

**Railway** ([railway.app](https://railway.app)):
- Connect your repo
- Deploy the `backend` folder
- Add Postgres from Railway
- Set `DATABASE_URL`, `CORS_ORIGINS` (e.g. `https://your-vercel-url.vercel.app`)
- Copy the API URL and set `VITE_API_URL` in Vercel

**Render** ([render.com](https://render.com)):
- New Web Service from repo
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0`
- Add a Postgres database and set `DATABASE_URL`

---

## 4. GitHub Pages (static only)

To host only the frontend (UI loads, but API calls will fail without a backend):

1. In consumer, add to `vite.config.ts`:
   ```ts
   base: '/coffee-sommelier/',  // your repo name
   ```
2. Build: `cd consumer && npm run build`
3. Deploy `consumer/dist` to the `gh-pages` branch, or use GitHub Actions.
