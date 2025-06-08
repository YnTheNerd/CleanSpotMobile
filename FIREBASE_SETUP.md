# Firebase Setup Guide for CleanSpot

## 1. Firebase Project Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `cleanspot-mobile`
4. Enable Google Analytics (recommended)
5. Choose or create Analytics account
6. Click "Create project"

### Add Web App
1. In project overview, click "Web" icon (`</>`)
2. Enter app nickname: `CleanSpot Mobile`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. Copy the configuration object

## 2. Update Configuration

### Replace Firebase Config
Update `config/firebaseConfig.js` with your actual values:

```javascript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "cleanspot-mobile.firebaseapp.com",
  projectId: "cleanspot-mobile",
  storageBucket: "cleanspot-mobile.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## 3. Enable Firebase Services

### Authentication
1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Optionally enable **Google** for future use
4. In **Settings** tab, add your domain to authorized domains

### Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll update rules later)
4. Select location closest to your users
5. Click **Done**

### Storage
1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Select same location as Firestore
5. Click **Done**

## 4. Deploy Security Rules

### Firestore Rules
1. Go to **Firestore Database** > **Rules**
2. Replace the default rules with content from `firestore.rules`
3. Click **Publish**

### Storage Rules
1. Go to **Storage** > **Rules**
2. Replace with these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload images to their own folder
    match /reports/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow admins to read all images
    match /{allPaths=**} {
      allow read: if request.auth != null && 
                     (request.auth.token.email.matches('.*@admin\\.cleanspot\\.com') ||
                      exists(/databases/(default)/documents/admins/$(request.auth.uid)));
    }
  }
}
```

## 5. Create Required Indexes

### Firestore Indexes
Go to **Firestore Database** > **Indexes** and create these composite indexes:

1. **Collection**: `signals`
   - **Fields**: `userId` (Ascending), `createdAt` (Descending)
   - **Query scope**: Collection

2. **Collection**: `signals`
   - **Fields**: `userId` (Ascending), `status` (Ascending), `createdAt` (Descending)
   - **Query scope**: Collection

3. **Collection**: `signals`
   - **Fields**: `status` (Ascending), `createdAt` (Descending)
   - **Query scope**: Collection

### Single Field Indexes
These are usually created automatically, but verify they exist:
- `signals.userId`
- `signals.status`
- `signals.createdAt`
- `userStats.updatedAt`

## 6. Test the Setup

### Test Authentication
1. Run the app: `npm start`
2. Try creating an account
3. Try logging in
4. Check Firebase Console > Authentication > Users

### Test Firestore
1. Create a test report in the app
2. Check Firebase Console > Firestore Database
3. Verify the document structure matches the schema

### Test Storage
1. Add a photo to a report
2. Check Firebase Console > Storage
3. Verify image is uploaded to correct path

## 7. Production Configuration

### Environment Variables (Optional)
For better security, you can use environment variables:

```javascript
// config/firebaseConfig.js
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};
```

Create `.env` file:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=cleanspot-mobile.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=cleanspot-mobile
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=cleanspot-mobile.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Quota Monitoring
1. Go to **Usage and billing**
2. Set up budget alerts
3. Monitor daily usage to stay within free tier

## 8. Admin Setup (Future)

### Create Admin User
1. Create a regular user account first
2. Add document to `admins` collection:

```javascript
// Document ID: user's Firebase Auth UID
{
  email: "admin@cleanspot.com",
  displayName: "Admin User",
  role: "admin",
  permissions: ["read_all", "update_signals", "manage_users"],
  createdAt: new Date(),
  isActive: true
}
```

### Admin Email Domain
Update security rules to match your admin domain:
```javascript
// In firestore.rules, update this line:
request.auth.token.email.matches('.*@yourdomain\\.com')
```

## 9. Backup Strategy

### Automated Backups
1. Go to **Firestore Database** > **Backups**
2. Enable automated backups
3. Choose backup frequency (daily recommended)
4. Set retention period (30 days minimum)

### Manual Backup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Export Firestore data
firebase firestore:export gs://cleanspot-mobile.appspot.com/backups/$(date +%Y%m%d)
```

## 10. Monitoring & Analytics

### Performance Monitoring
1. Go to **Performance**
2. Enable Performance Monitoring
3. Add to your app (already included in our setup)

### Crashlytics (Optional)
1. Go to **Crashlytics**
2. Enable Crashlytics
3. Add SDK to React Native app

### Analytics Events
Track important events in your app:
```javascript
import { logEvent } from 'firebase/analytics';

// Track report creation
logEvent(analytics, 'report_created', {
  user_id: user.uid,
  location_accuracy: location.accuracy
});

// Track app usage
logEvent(analytics, 'screen_view', {
  screen_name: 'reports_list'
});
```

## 11. Troubleshooting

### Common Issues

#### "Permission denied" errors
- Check Firestore security rules
- Verify user is authenticated
- Ensure indexes are created

#### Images not uploading
- Check Storage security rules
- Verify image compression is working
- Check network connectivity

#### Slow queries
- Verify indexes are created
- Check query structure
- Consider pagination

### Debug Mode
Enable debug logging:
```javascript
// Add to firebaseConfig.js for development
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';
import { connectStorageEmulator } from 'firebase/storage';

if (__DEV__) {
  // Connect to emulators in development
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## 12. Cost Optimization

### Free Tier Limits
- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Storage**: 1GB storage, 1GB/day downloads
- **Authentication**: Unlimited

### Stay Within Limits
- Implement pagination (✅ already done)
- Use caching for frequently accessed data
- Compress images before upload (✅ already done)
- Monitor usage in Firebase Console

### Upgrade Triggers
Consider upgrading when you hit:
- 1000+ active users
- 40K+ daily reads consistently
- 15K+ daily writes consistently
- 800MB+ storage usage

## Next Steps

1. ✅ Complete Firebase setup following this guide
2. ✅ Test all functionality in development
3. ✅ Deploy security rules to production
4. 📱 Test on physical devices with Expo Go
5. 🚀 Prepare for app store deployment
6. 📊 Set up monitoring and analytics
7. 🔄 Plan for admin web app development

## Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Review security rules and indexes
3. Check network connectivity
4. Verify API keys and configuration
5. Consult Firebase documentation
6. Check our troubleshooting section above
