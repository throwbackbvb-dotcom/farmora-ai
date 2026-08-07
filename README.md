# Deploying Farmora AI (Render + Aiven, free tier)

This folder is your project, restructured for deployment:

```
farmora-deploy/
├── main.py              # updated: reads DB creds from env vars, serves frontend
├── requirements.txt
├── Procfile
├── .gitignore
└── static/
    ├── index.html
    ├── style.css
    └── script.js
```

Before you start, copy your two model files into this folder (next to `main.py`):
`xgb_crop_model.json` and `label_encoders.joblib`. They aren't included here
since they weren't part of what you uploaded to me.

---

## Step 1 — Create your free Aiven MySQL database

1. Go to https://aiven.io and sign up (no credit card required).
2. Click **Create service** → choose **MySQL** → select the **Free** plan → pick any region close to you → **Create service**.
3. Wait ~2 minutes for it to spin up (status turns green).
4. Open the service, go to the **Overview** tab, and note down: **Host**, **Port**, **User**, **Password**, **Database name** (default is `defaultdb`).
5. On the same page, download the **CA Certificate** (ca.pem) — click **Overview → Databases → download CA cert**, or find it under "Connection information." Save it into your project folder as `ca.pem`.

## Step 2 — Create a MySQL table setup check (optional but recommended)

Aiven's free MySQL starts empty — your app already creates tables automatically
(`CREATE TABLE IF NOT EXISTS...`) the first time it runs, so you don't need to
do anything manual here.

## Step 3 — Put the project on GitHub (no command line needed)

1. Go to https://github.com and create a free account if you don't have one.
2. Click the **+** icon (top right) → **New repository**. Name it `farmora-ai`,
   set it to **Private**, leave everything else default, click **Create repository**.
3. Download **GitHub Desktop** from https://desktop.github.com and install it.
4. Open GitHub Desktop and sign in with your GitHub account when prompted.
5. Click **File → Clone repository**, select the `farmora-ai` repo from the
   list, choose a location on your computer, click **Clone**.
6. This creates an empty `farmora-ai` folder on your computer. Copy
   **everything** from your `farmora-deploy` folder (including the `static`
   folder, `main.py`, `requirements.txt`, `Procfile`, `.gitignore`, and your
   `xgb_crop_model.json` / `label_encoders.joblib` / `ca.pem` files) into that
   `farmora-ai` folder.
7. Go back to GitHub Desktop — it will automatically list all the new files
   under "Changes." Type a short summary like `Initial deploy setup` in the
   box at the bottom left, then click **Commit to main**.
8. Click **Push origin** (top toolbar) to upload everything to GitHub.

⚠️ Since `ca.pem` and your model files aren't secrets by themselves, it's fine
to commit them — just never commit real passwords directly in code (we're
using environment variables specifically to avoid that).

## Step 4 — Create the Render web service

1. Go to https://render.com and sign up (you can sign up with your GitHub account, which makes step 2 easier).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if prompted, then select the `farmora-ai` repo.
4. Fill in:
   - **Name**: `farmora-ai` (or anything)
   - **Region**: closest to you
   - **Branch**: `main`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn main:app --workers=1 --threads=4 --timeout=120`
   - **Instance Type**: Free
5. Before clicking create, scroll to **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `DB_HOST` | (from Aiven overview page) |
   | `DB_PORT` | (from Aiven, usually a 5-digit port) |
   | `DB_USER` | (from Aiven, usually `avnadmin`) |
   | `DB_PASSWORD` | (from Aiven) |
   | `DB_NAME` | `defaultdb` (or your Aiven DB name) |
   | `DB_SSL_CA` | `ca.pem` |
6. Click **Create Web Service**. Render will build and deploy — this takes a few minutes. Watch the **Logs** tab for errors.
7. Once live, Render gives you a URL like `https://farmora-ai.onrender.com`.

## Step 5 — Point your ESP32 sensors at the live URL

In your ESP32 firmware, change the POST URL from your old local IP
(e.g. `http://192.168.x.x:5000/sensor`) to:

```
https://farmora-ai.onrender.com/sensor
```

Re-flash/upload the firmware to each sensor.

## Step 6 — Test it

1. Visit `https://farmora-ai.onrender.com` in a browser — you should see the Farmora frontend.
2. Send a test POST (e.g. from your phone or terminal) to `/sensor` and check the Render logs to confirm it's received and written to Aiven.
3. In Aiven's web console (Overview → **Query Editor** or **Databases**), check the `SENSORS` table and your per-sensor tables for new rows.

## Notes / things to expect as a beginner

- **Cold starts**: if there's no traffic for 15 minutes, Render puts the free service to sleep. The next request (or sensor POST) takes ~30-60 seconds to wake it back up. This is normal on the free tier.
- **One worker only**: the Procfile uses `--workers=1` on purpose — the background scheduler (`APScheduler`) that runs your watering job every 10 seconds would start multiple times and duplicate work if there were more than one worker process.
- **Redeploying**: any time you `git push` to `main`, Render automatically rebuilds and redeploys.
- **Logs**: Render's **Logs** tab (in your service dashboard) is your best friend for debugging — that's where your `print()` statements show up.
