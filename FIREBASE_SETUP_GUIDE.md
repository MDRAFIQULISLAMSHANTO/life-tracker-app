# Firebase Setup Guide - Livio Dashboard

Complete step-by-step guide to set up Firebase Authentication for your Livio dashboard.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Enter project name: **`livio-app`**
4. Click **"Continue"**
5. (Optional) Disable Google Analytics if you don't need it, or enable it
6. Click **"Create project"**
7. Wait for project creation (takes ~30 seconds)
8. Click **"Continue"**

## Step 2: Enable Authentication Methods

1. In Firebase Console, click on **"Authentication"** in the left sidebar
2. Click **"Get started"** button
3. Go to the **"Sign-in method"** tab
4. Enable the following providers:

### Email/Password

- Click on **"Email/Password"**
- Toggle **"Enable"** to ON
- Click **"Save"**

### Google Sign-In

- Click on **"Google"**
- Toggle **"Enable"** to ON
- Enter a project support email (your email)
- Click **"Save"**

### Phone Authentication

- Click on **"Phone"**
- Toggle **"Enable"** to ON
- Click **"Save"**

## Step 3: Get Firebase Configuration

1. In Firebase Console, click on the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click on the **Web icon** (`</>`) to add a web app
5. Register app:
   - App nickname: `Livio Web` (or any name)
   - Check **"Also set up Firebase Hosting"** (optional, can skip)
   - Click **"Register app"**
6. Copy the Firebase configuration object (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "livio-app.firebaseapp.com",
  projectId: "livio-app",
  storageBucket: "livio-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop",
};
```

## Step 4: Create Environment File

1. In your project root folder, create a file named `.env.local`
2. Copy the template below and fill in your Firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=livio-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=livio-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=livio-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
```

3. Replace the values with your actual Firebase config values

## Step 5: Restart Development Server

1. Stop your current dev server (press `Ctrl+C` in terminal)
2. Start it again:

```bash
npm run dev
```

## Step 6: Test Authentication

1. Open your browser to `http://localhost:3000`
2. You should be redirected to `/login`
3. Test each authentication method:

### Test Email/Password

- Enter any email and password
- Click "Create Account" (will create new user)
- Or click "Sign In" if user exists

### Test Google Sign-In

- Click "Continue with Google"
- Sign in with your Google account
- Should redirect to dashboard

### Test Phone Authentication

- Click "Continue with Phone"
- Enter phone number with country code (e.g., +8801234567890)
- Click "Continue with Phone"
- Enter the OTP code sent to your phone
- Click "Verify OTP"
- Should redirect to dashboard

## Step 7: Verify Dashboard Access

- After successful login, you should see the dashboard
- Try logging out from the profile dropdown (top right)
- Should redirect back to login page

## Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"

- Check that `.env.local` file exists in project root
- Verify all environment variables are correct
- Restart the dev server after creating `.env.local`

### Error: "Firebase is not configured"

- Make sure `.env.local` file exists
- Check that variable names start with `NEXT_PUBLIC_`
- Restart dev server after adding env variables

### Phone Auth Not Working

- Make sure Phone authentication is enabled in Firebase Console
- Verify phone number format includes country code (+880 for Bangladesh)
- Check browser console for errors

### Google Sign-In Not Working

- Verify Google provider is enabled in Firebase Console
- Check that project support email is set
- Clear browser cache and try again

## Quick Reference

**Project Name:** `livio-app`  
**Auth Methods:** Email/Password, Google, Phone  
**Environment File:** `.env.local` (in project root)  
**Dev Server:** `npm run dev`  
**Local URL:** `http://localhost:3000`

## Next Steps After Setup

1. ✅ Authentication is working
2. 🔜 Add Firestore database for data persistence
3. 🔜 Set up data models for transactions, budgets, etc.
4. 🔜 Connect dashboard to real data
5. 🔜 Add user profile management

---

**Need Help?**

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Setup](https://firebase.google.com/docs/auth)
- Check browser console for error messages


