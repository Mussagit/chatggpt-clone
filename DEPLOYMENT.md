# 🚀 Deployment Guide: Full-Stack ChatGPT Clone

Deploy this full-stack project using **Render** (Backend), **Vercel** (Frontend), and a **Cloud MySQL Database**.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐
│        Vercel (Frontend)        │
│   React 19 + Vite Dark Theme    │
└────────────────┬────────────────┘
                 │
                 │ HTTPS API Calls (VITE_API_BASE_URL)
                 ▼
┌─────────────────────────────────┐
│         Render (Backend)        │
│      Express 5 + Google GenAI   │
└────────────────┬────────────────┘
                 │
                 │ MySQL Connection (with SSL)
                 ▼
┌─────────────────────────────────┐
│     Cloud MySQL Database        │
│   (TiDB Serverless / Aiven)     │
└─────────────────────────────────┘
```

---

## 📋 Prerequisites Checklist

1. **GitHub Repository**: Make sure your code is pushed to your GitHub repo.
2. **Google Gemini API Key**: Get one free from [Google AI Studio](https://aistudio.google.com/).
3. **Render Account**: Free account at [render.com](https://render.com).
4. **Vercel Account**: Free account at [vercel.com](https://vercel.com).
5. **Cloud MySQL Database**: Free MySQL instance (see Step 1 below).

---

## Step 1: Set Up Free Cloud MySQL Database (1-2 minutes)

Because Render does not provide free managed MySQL on their free tier, use a free cloud MySQL provider. **TiDB Cloud Serverless** or **Aiven** are recommended:

### Option A: TiDB Cloud Serverless (Recommended — 100% Free Forever, 5GB)
1. Go to [tidbcloud.com](https://tidbcloud.com) and sign up with GitHub/Google (No credit card needed).
2. Click **Create Cluster** and choose **Serverless (Free)**.
3. Click **Connect** in your TiDB dashboard:
   - Select **Connection String** -> **Node.js** or General.
   - TiDB will generate a connection URL formatted like:
     ```
     mysql://<username>:<password>@<host>:4000/<database_name>?ssl={"rejectUnauthorized":true}
     ```
   - Copy this URL.

> [!NOTE]
> **Automatic Table Creation**: You do **not** need to manually run SQL scripts! When your backend starts up on Render, it automatically creates the `sessions` and `conversations` tables for you.

---

## Step 2: Deploy Backend to Render

### Method 1: Using Render Blueprint (Fastest)

1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** at the top right and select **Blueprint**.
3. Connect your GitHub repository (`Mussagit/chatggpt-clone`).
4. Render will detect the included `render.yaml` file automatically.
5. Provide your values when prompted:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `DATABASE_URL`: Your full cloud MySQL connection URL from Step 1.
     *(Or fill in `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT=3306`, and `DB_SSL=true`)*.
   - `CORS_ORIGIN`: Set to `*` for now (you can update this to your Vercel URL later).
6. Click **Apply**. Render will install dependencies and start your backend.

---

### Method 2: Manual Web Service Setup

If you prefer to configure manually on Render:
1. Click **New +** -> **Web Service**.
2. Select your repository.
3. Fill in the following settings:
   - **Name**: `chatgpt-clone-backend` (or your choice)
   - **Root Directory**: `Backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Expand **Advanced** and set **Health Check Path** to: `/health`
5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Recommended |
   | `PORT` | `10000` | Standard Render web port |
   | `GEMINI_API_KEY` | `your_actual_gemini_api_key` | Required |
   | `GEMINI_MODEL_NAME`| `gemini-3.7-flash` | Default model |
   | `CORS_ORIGIN` | `*` | Or your Vercel URL |
   | `DATABASE_URL` | `mysql://user:pass@host:port/db?ssl=...` | Cloud DB URL |
   | *(or DB_HOST)* | `your_db_host` | If using separate credentials |
   | *(or DB_USER)* | `your_db_user` | If using separate credentials |
   | *(or DB_PASSWORD)* | `your_db_password` | If using separate credentials |
   | *(or DB_NAME)* | `your_db_name` | If using separate credentials |
   | *(or DB_PORT)* | `3306` | If using separate credentials |
   | *(or DB_SSL)* | `true` | Required for remote MySQL |
6. Click **Deploy Web Service**.
7. Wait 1-2 minutes until deployment completes.
8. Copy your Render backend URL (e.g., `https://chatgpt-clone-backend.onrender.com`).
9. **Verify**: Open `https://chatgpt-clone-backend.onrender.com/health` in your browser. You should see:
   ```json
   {"status":"healthy","timestamp":"..."}
   ```

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`Mussagit/chatggpt-clone`).
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `Frontend` *(or leave as root, root `vercel.json` is preconfigured)*.
   - **Build and Output Settings**: Default (`npm run build`, output: `dist`).
5. Under **Environment Variables**, add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://<your-render-backend-name>.onrender.com/api`
     *(Replace `<your-render-backend-name>` with your actual Render URL from Step 2)*.
6. Click **Deploy**.
7. In ~30 seconds, Vercel will finish building and provide your live URL (e.g., `https://chatggpt-clone.vercel.app`)!

---

## Step 4: Final Verification & Security

1. Open your live Vercel URL in your browser.
2. Send a test message (e.g., *"Hello! Tell me about yourself"*).
3. Create a new chat session to confirm that MySQL session storage works.
4. Try dark mode, prompt starters, and attaching an image or document.
5. **(Optional CORS tightening)**:
   - Go back to Render -> **chatgpt-clone-backend** -> **Environment**.
   - Change `CORS_ORIGIN` from `*` to your exact Vercel URL (e.g., `https://chatggpt-clone.vercel.app`).
   - Click **Save Changes**. Render will automatically redeploy.

---

## 🔧 Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **Backend fails on startup with `ECONNREFUSED`** | Backend is trying to connect to `127.0.0.1` instead of remote MySQL | Provide a remote cloud MySQL `DATABASE_URL` or `DB_HOST` in Render Environment Variables. |
| **MySQL SSL Handshake Error** | Remote MySQL requires encrypted connection | Set `DB_SSL=true` or include `?ssl={"rejectUnauthorized":false}` in `DATABASE_URL`. |
| **Frontend shows "Failed to fetch" / Network Error** | `VITE_API_BASE_URL` missing or incorrect on Vercel | Set `VITE_API_BASE_URL=https://<your-render-app>.onrender.com/api` on Vercel and redeploy. |
| **Render Free Tier Spin-Down Delay** | Free Render instances sleep after 15 mins of inactivity | The first request after sleep takes 30-50s to wake up. Subsequent requests are instant. |
