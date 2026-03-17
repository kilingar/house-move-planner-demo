# House Move Planner Demo

A simple checklist app for planning a home move or new-house setup.

This demo repo is designed to be easy to copy, edit, and deploy.

## Quick Start (5 Minutes)

1. Fork this repo to your GitHub account.
2. Open it in GitHub Codespaces.
3. Edit files in pages/ and data.js.
4. Commit and push from Codespaces.
5. Import your repo in Vercel and deploy.

## Recommended For Friends: GitHub Codespaces

If your friend is not technical, use GitHub Codespaces.
It avoids local setup and works fully in the browser.

How your friend can start:

1. Open your shared repository on GitHub.
2. Click Code > Codespaces > Create codespace on main.
3. Edit checklist files directly.
4. Commit and push changes.
5. Redeploy in Vercel.

## What You Can Do

- Customize rooms and checklist items quickly
- Deploy to Vercel in minutes
- Sync checked items across devices with Upstash Redis

## Privacy And Sharing

This demo repo is safe to share publicly.
If you build your own version, keep personal documents outside the repository.

## Copy This Project

Option A (quick): Fork on GitHub.

Option B (clean copy into your own repo):

1. Clone this repository.
2. Point git to your own new repository.
3. Push as main.

Commands:

git clone https://github.com/kilingar/house-move-planner-demo.git
cd house-move-planner-demo
git remote remove origin
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main

## Make Your Copy Private

If you copied this project and want your own private version:

1. Open your copied repository on GitHub.
2. Go to Settings > General.
3. In Danger Zone, choose Change repository visibility.
4. Select Private.

If your copy was made as a fork and your plan does not allow private forks, create a new private repository and push your code there using Option B above.

## Edit Rooms And Tasks

Most content lives in pages/*.js.
The page order/menu is controlled in data.js.

Each item looks like this:

{ id: "kitchen-plan-check-sockets", type: "plan", text: "Sockets, switches, and lights are tested and working" }

Field rules:

- id: unique and stable (do not rename existing ids after real usage starts)
- type: one of plan, buy, do
- text: checklist label shown in UI
- tasks: optional cross-tag
- group: optional grouping label

## Deploy To Vercel

1. Push your code to GitHub.
2. In Vercel, create a new project from your repo.
3. Deploy.

## Redis Setup (Cross-Device Sync)

The API route api/checklist.js saves and loads checklist state from Upstash Redis.

Without Redis:

- The API returns 503 with a clear message.
- Checkmarks only live in each browser local storage.
- Laptop and phone will not stay in sync.

With Redis configured:

- GET /api/checklist returns shared state.
- POST /api/checklist updates shared state.
- All devices for the same deployment see the same ticks.

### Configure Redis In Vercel

1. Open your Vercel project.
2. Go to Storage.
3. Add Upstash Redis and connect it.
4. Redeploy.

Accepted environment variable pairs:

- UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- KV_REST_API_URL and KV_REST_API_TOKEN (compatible fallback)

Optional key name override:

- CHECKLIST_STORAGE_KEY (default: house-project-checklist-v1)

## Verify Everything Works

1. Open https://<your-domain>/api/checklist
2. Confirm it returns JSON and not an error.
3. Check an item on device A.
4. Open on device B and refresh.
5. Confirm checked state matches.

## Troubleshooting

### Empty page or module/CORS error

Do not open index.html with file://
Use a local server or Vercel URL instead.

For local run:

python -m http.server 5500

Then open:

http://localhost:5500

### API returns 503

Redis is not configured for this deployment.
Attach Upstash Redis and redeploy.

### API returns 500

Usually a bad Redis credential value or integration issue.
Check environment values and redeploy.

### Checked states disappear after edits

You changed item ids.
State is keyed by id, so keep ids stable over time.
