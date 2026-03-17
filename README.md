# House Move Planner

A simple checklist app for planning a home move/new-house setup.

This repo is built so you can:
- Copy it
- Customize rooms/tasks quickly
- Deploy to Vercel
- Sync checklist ticks across devices using Upstash Redis

## Who This Is For

If you are moving into a new home and want a ready-to-edit checklist app, this is for you.
You can use ChatGPT/Copilot to quickly rewrite room lists, tasks, and labels.

## Important Before Sharing

This project folder may contain private document folders.
If you share with friends, share only the app code files:
- `index.html`
- `style.css`
- `app.js`
- `data.js`
- `pages/`
- `api/`
- `package.json`

Do not include personal document folders.

## 1. Copy The Project

Option A: Fork this repo on GitHub.

Option B: Create a new repo and push:

```bash
git clone <source-repo-url>
cd <repo-folder>
git remote remove origin
git remote add origin <your-new-repo-url>
git push -u origin main
```

## 2. Customize Rooms And Tasks

Most content lives in `pages/*.js`.
Each page exports a section with `items`.

Item format:

```js
{ id: "kitchen-plan-check-sockets", type: "plan", text: "Sockets, switches, and lights are tested and working" }
```

Fields:
- `id`: must be unique and stable (do not change after users start ticking items)
- `type`: `plan`, `buy`, or `do`
- `text`: the visible checklist line
- `tasks` (optional): cross-tag item under task filters
- `group` (optional): used for grouped planning pages

To add/remove a room, update imports and section order in `data.js`.

### Tip For ChatGPT

Use prompts like:

"Update my `pages/kitchen.js` list for a family of 4, keep IDs stable where possible, add new IDs only for new items, keep type as plan/buy/do."

## 3. Deploy To Vercel

1. Push your code to GitHub.
2. In Vercel, click New Project and import your repo.
3. Deploy.

Your app is static + serverless API (`/api/checklist`).
No local deploy tooling is required.

## 4. Enable Cross-Device Tick Sync (Upstash Redis)

This project uses `@upstash/redis` in `api/checklist.js`.

In Vercel:
1. Open your project.
2. Go to Storage.
3. Add an Upstash Redis integration.
4. Connect it to this project.
5. Redeploy.

The API accepts either env var pair:
- Preferred: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Compatible fallback: `KV_REST_API_URL`, `KV_REST_API_TOKEN`

Optional key override:
- `CHECKLIST_STORAGE_KEY` (default: `house-project-checklist-v1`)

## 5. Verify It Works

After deploy:
1. Open `/api/checklist` on your domain.
2. You should get JSON (not 500).
3. Tick an item on laptop.
4. Open same app on phone and refresh.
5. Tick state should match.

## Troubleshooting

### 500 from `/api/checklist`
Usually Redis is not attached or env vars are missing.
- Re-check Upstash integration in Vercel
- Confirm env vars exist in the deployed environment
- Redeploy after changes

### Ticks disappear after edits
Tick state is keyed by item `id`.
If you rename `id`s, existing checked states no longer match.
Keep IDs stable.

### Ticks differ by device
If Redis sync is not configured, each browser/device uses local storage only.
Configure Upstash and redeploy.

## Local Run (Optional)

You can still open with a simple server:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

Note: cross-device sync depends on deployed API and Redis.

## Suggested Workflow For Friends

1. Copy repo
2. Customize `pages/*.js`
3. Keep IDs stable
4. Deploy to Vercel
5. Add Upstash Redis
6. Redeploy
7. Start checking tasks on phone + laptop
