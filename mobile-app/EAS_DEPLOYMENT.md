# Building Civic-Saathi Mobile App (APK) 📱

This guide explains how to use Expo Application Services (EAS) to build a standalone Android APK file for Civic-Saathi. You can install this APK on any Android phone without needing to use the "Expo Go" app!

## Prerequisites

1. An [Expo Account](https://expo.dev).
2. The EAS CLI tool installed on your computer. If you don't have it, run:
   ```bash
   npm install -g eas-cli
   ```
3. Your mobile app must be completely configured to connect to your live Railway backend (i.e., your `.env` file should have `EXPO_PUBLIC_API_URL=https://your-railway.up.railway.app/api/v1`).

---

## Step 1: Login and Configure

1. Open a terminal inside the `mobile-app` directory.
2. Log in to your Expo account:
   ```bash
   eas login
   ```
   *(It will prompt you for your Expo username and password)*
3. Link your local project to your Expo account:
   ```bash
   eas build:configure
   ```
   *(If it asks what platforms to configure, select `All` or `Android`)*

---

## Step 2: Build the APK!

We have already set up a special configuration file (`eas.json`) that explicitly tells Expo to build a raw `.apk` file instead of a Google Play Store bundle (`.aab`). 

To start the cloud build, run:
```bash
eas build -p android --profile preview
```

### What happens next?
1. EAS will bundle your code and upload it to Expo's cloud servers.
2. It will give you a **link to a dashboard**. You can click the link to watch the build progress live.
3. The build usually takes about **5 to 10 minutes** to complete on the free tier.
4. Once it's done, your terminal (and the web dashboard) will provide a direct **Download Link** and a **QR Code**.

---

## Step 3: Install and Distribute

- **To install on your phone:** Simply scan the QR code from the Expo dashboard using your Android phone's camera. It will download the `.apk` file. Click it to install!
- **To share with friends:** You can send the downloaded `.apk` file to your friends via WhatsApp, Telegram, or email. They can tap it to install the app on their phones too.

---

## Important Notes & Troubleshooting

- **SafeAreaView Warning:** You might see a small warning about `SafeAreaView` being deprecated during the build or when starting Metro. This is a harmless cosmetic warning from one of the underlying libraries and does **not** affect the APK build or app functionality.
- **API Not Connecting:** If your app installs but can't log in, it means your `EXPO_PUBLIC_API_URL` was wrong when you started the build. Make sure you set it to your live backend *before* running `eas build`.
