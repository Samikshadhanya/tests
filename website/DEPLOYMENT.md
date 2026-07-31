# MedHome Deployment

## Required Environment Variables

Set these in `.env.local` for local development and in Vercel Project Settings for production:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

`FIREBASE_PRIVATE_KEY` must include newline escapes when stored in Vercel.
Copy the value exactly from your Firebase service account JSON file — it will start with
`<YOUR_PRIVATE_KEY_VALUE_FROM_FIREBASE_CONSOLE>` and contain `\n` escape sequences.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Firebase Setup

1. Enable Google sign-in in Firebase Authentication.
2. Create a Firestore database.
3. Publish `firestore.rules` to Firestore rules.
4. Create a Firebase service account and copy `project_id`, `client_email`, and `private_key` into the server env vars.
5. Add your Vercel production domain to Firebase Authentication authorized domains.

## Vercel Checklist

1. Import the repository into Vercel.
2. Set all required environment variables.
3. Use the default Next.js build command: `npm run build`.
4. Deploy.
5. Sign in with Google once to verify `/api/users/profile` creates the user, default household, and default member profile.
