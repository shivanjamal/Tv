# Firebase Setup Instructions

To enable real-time chat functionality, you need to set up a Firebase project and configure it.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Anonymous** authentication:
   - Click on "Anonymous" in the Sign-in method tab
   - Enable it and click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location close to your users
5. Click **Enable**

## Step 4: Set Firestore Security Rules

1. Go to **Firestore Database** > **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read messages
    match /messages/{messageId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

3. Click **Publish**

## Step 5: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app (you can name it anything)
6. Copy the Firebase configuration object

## Step 6: Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 7: Test the Chat

1. Open your website
2. Open the chat
3. Send a message
4. Open the same page in another browser/incognito window
5. You should see messages appear in real-time!

## Important Notes

- **Test Mode**: The security rules above allow anyone to read/write. For production, implement proper authentication and rules.
- **Costs**: Firebase has a free tier (Spark plan) that should be sufficient for small to medium traffic.
- **Rate Limits**: Be aware of Firestore read/write limits on the free tier.

## Troubleshooting

- **"Firebase is not loaded"**: Check that firebase-config.js is loaded before script.js
- **"Permission denied"**: Check your Firestore security rules
- **Messages not appearing**: Check browser console for errors
- **Authentication errors**: Make sure Anonymous auth is enabled

## Production Considerations

For production, consider:
1. Implementing proper user authentication (email/password, Google, etc.)
2. Updating security rules to restrict access
3. Adding message moderation
4. Implementing rate limiting
5. Adding message deletion/editing features
6. Setting up Firebase hosting for better performance

