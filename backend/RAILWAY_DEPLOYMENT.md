# Deploying Civic-Saathi Backend to Railway 🚂

This guide walks you through deploying the Spring Boot backend to [Railway's Free Tier](https://railway.app/), completely eliminating the need for unstable local tunnels!

## Prerequisites

1. A Railway account (Free Tier works fine).
2. A Supabase Database (for your PostgreSQL credentials).
3. The codebase pushed to your GitHub repository on the `feature/railway-deployment` branch (or merged into your main branch).

---

## Step 1: Create the Project

1. Log in to your [Railway Dashboard](https://railway.app/dashboard).
2. Click **New Project** in the top right corner.
3. Select **Deploy from GitHub repo**.
4. Authorize GitHub if prompted, and select the `Civic-Saathi` repository.
5. In the branch selection dropdown, select **`feature/railway-deployment`** (or your main/dev branch if you've already merged it).
6. **Important:** Do NOT click Deploy yet. Click **Add Variables** instead.

---

## Step 2: Configure the Root Directory

Since this project is a monorepo (it contains `mobile-app/`, `web-dashboard/`, and `backend/` all in one repository), you must explicitly tell Railway where the backend code lives.

1. Navigate to the **Settings** tab of your new Railway service.
2. Scroll down to the **Build** section.
3. Find the **Root Directory** field and change it to:
   ```text
   /backend
   ```
4. Save the changes. Railway will now look for the `pom.xml` and `nixpacks.toml` inside the `backend` folder instead of the project root.

---

## Step 3: Add Environment Variables

Your Spring Boot application requires several environment variables to connect to your database and handle security. 

1. Go to the **Variables** tab in Railway.
2. Add the following variables (matching the values in your local `.env` file):

| Variable Name | Example Value | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://aws-0-eu-central-1.pooler.supabase.com:6543/postgres` | Your Supabase connection string. |
| `DB_USERNAME` | `postgres.yourusername` | Your Supabase database user. |
| `DB_PASSWORD` | `your_secure_password` | Your Supabase database password. |
| `JWT_SECRET` | `your_very_long_secure_secret_key_123` | The secret used to sign auth tokens. |
| `CORS_ALLOWED_ORIGINS` | `*` | Allowed frontend domains. Use `*` temporarily, or explicitly set it to your Vercel URL (e.g., `https://civic-saathi-web.vercel.app`). |

---

## Step 4: Deploy and Generate Domain

1. Go to the **Deployments** tab. If a deployment hasn't started automatically, trigger a new deployment.
2. Railway's Nixpacks will automatically read the `nixpacks.toml` file, install Java 17, and run the Maven build. Wait a few minutes for this to complete.
3. Once the deployment turns green, go to the **Settings** tab.
4. Scroll down to **Networking**.
5. Click **Generate Domain**. Railway will instantly provide you with a public URL, for example:
   ```text
   https://civic-saathi-backend-production.up.railway.app
   ```

---

## Step 5: Update Your Frontends

Now that your backend is live on the internet, update your frontend apps to point to it!

### For the Web Dashboard (Vercel)
1. Go to your Vercel dashboard for the Web Dashboard project.
2. Navigate to **Settings > Environment Variables**.
3. Update `VITE_API_URL` to point to your new Railway domain, appending `/api/v1`:
   ```text
   VITE_API_URL=https://civic-saathi-backend-production.up.railway.app/api/v1
   ```
4. Redeploy the Vercel project for the changes to take effect.

### For the Mobile App (Expo)
1. Open your local `mobile-app/.env` file.
2. Change the `EXPO_PUBLIC_API_URL` to your new Railway domain:
   ```text
   EXPO_PUBLIC_API_URL=https://civic-saathi-backend-production.up.railway.app/api/v1
   ```
3. Restart your Expo server. You will no longer need to run `npm run tunnel`!

---

## Troubleshooting

- **Out of Memory Error (OOM):** Railway's free tier provides 500MB RAM. If the application crashes on startup, it might be running out of memory. We have deliberately kept the Hikari pool size small to help prevent this.
- **Connection Refused (Database):** Double-check your `DB_URL` and ensure it includes `jdbc:postgresql://`.
- **CORS Errors on Vercel:** Ensure your `CORS_ALLOWED_ORIGINS` environment variable in Railway exactly matches the URL of your Vercel app (with `https://` and no trailing slash).
