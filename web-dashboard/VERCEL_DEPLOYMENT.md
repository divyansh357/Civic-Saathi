# Deploying Civic-Saathi Web Dashboard to Vercel 🚀

This guide walks you through deploying your React/Vite Web Dashboard to Vercel. 

**Good News:** The codebase is already 100% configured for Vercel! The `vercel.json` file in this directory automatically handles the build commands (`npm run build`) and ensures that React Router works perfectly without returning 404 errors when you refresh pages.

## Prerequisites

1. A Vercel account (Free Tier is perfect).
2. Your GitHub repository with the latest code pushed to your main branch (or the `feature/vercel-web-deployment` branch).
3. The live URL of your deployed Railway Backend.

---

## Step 1: Import the Project

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** and select **Project**.
3. Locate your `Civic-Saathi` GitHub repository and click **Import**.

---

## Step 2: Configure the Root Directory

Since this is a monorepo (containing the backend, mobile, and web apps), you must tell Vercel exactly where the React code lives.

1. Under the **Configure Project** section, look for the **Root Directory** setting.
2. Click **Edit**.
3. Select the `web-dashboard` folder and click **Save**.
4. The **Framework Preset** should automatically detect **Vite**. If it doesn't, select it manually.

---

## Step 3: Add Environment Variables

Your web dashboard needs to know where to send its API requests.

1. In the same configuration screen, open the **Environment Variables** section.
2. Add the following variable:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://your-railway-backend-url.up.railway.app/api/v1` |

*(Replace the value with your actual live Railway domain, making sure to include the `/api/v1` at the end with no trailing slash).*

---

## Step 4: Deploy!

1. Click the big **Deploy** button.
2. Vercel will install the NPM packages, run the Vite build, and deploy the application globally.
3. Once the confetti drops 🎉, click on your project to get your live URL (e.g., `https://civic-saathi-web.vercel.app`).

---

## Step 5: Final Railway Configuration (CORS)

For security reasons, your Railway backend will block requests from unauthorized domains. You must whitelist your new Vercel domain!

1. Copy your new Vercel domain URL (e.g., `https://civic-saathi-web.vercel.app`). Do not include a trailing slash `/`.
2. Go back to your **Railway Dashboard** -> Select the Backend Service -> **Variables**.
3. Find the `CORS_ALLOWED_ORIGINS` variable.
4. Replace `*` with your actual Vercel URL. If you have multiple URLs (like a local testing URL and a live URL), separate them with commas:
   ```text
   http://localhost:5173,https://civic-saathi-web.vercel.app
   ```
5. Railway will automatically restart the backend with the new security rules. Your live Web Dashboard will now securely communicate with your live Backend!
