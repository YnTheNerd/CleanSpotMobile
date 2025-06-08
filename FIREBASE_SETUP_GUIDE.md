# Firebase Setup Guide for Real Mode

## Prerequisites
1. Make sure you have a Firebase project created in the Firebase Console
2. Ensure you have the correct Firebase configuration in `config/firebaseConfig.js`
3. Enable Authentication and Firestore in your Firebase project

## Authentication Setup
1. In Firebase Console, go to Authentication
2. Enable Email/Password authentication method
3. (Optional) Enable other authentication methods as needed

## Firestore Setup
1. Go to Firestore Database in Firebase Console
2. Create a new database if you haven't already
3. Start in production mode
4. Choose a location closest to your users
5. Copy the security rules from `firestore.rules` to your Firebase Console's Rules tab

## Data Structure
The app uses the following collections:

### signals
Stores user reports with the following structure:
```javascript
{
  description: string,
  imageUrl: string, // Base64 encoded image
  location: {
    latitude: number,
    longitude: number,
    address: string (optional),
    accuracy: number (optional)
  },
  userId: string,
  userEmail: string,
  userDisplayName: string,
  status: 'pending' | 'in_progress' | 'resolved',
  priority: 'low' | 'normal' | 'high',
  createdAt: timestamp,
  updatedAt: timestamp,
  adminNotes: string (optional),
  assignedTo: string (optional),
  resolvedAt: timestamp (optional)
}
```

### userStats
Stores user statistics:
```javascript
{
  totalReports: number,
  pendingReports: number,
  inProgressReports: number,
  resolvedReports: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Image Handling
- Images are stored as base64 strings in the Firestore documents
- Maximum document size is 1MB, so ensure images are properly compressed
- Use the imageUtils.js utility functions for image compression and conversion

## Security Rules
The provided Firestore rules implement:
1. Authentication requirement for all operations
2. User ownership validation
3. Data validation including image format checking
4. Admin-only operations for sensitive actions
5. Proper field validation for all documents

## Testing Real Mode
1. Ensure `USE_REAL_FIREBASE` is set to `true` in `services/firebaseService-hybrid.js`
2. Test user registration and login
3. Create a test report with a small image
4. Verify the report appears in Firestore
5. Check user stats are being updated

## Common Issues
1. If images fail to upload, check:
   - Image size (should be < 1MB after base64 encoding)
   - Image compression settings in imageUtils.js
   - Network connectivity

2. If authentication fails:
   - Verify Firebase config values
   - Check if the user exists in Firebase Auth
   - Ensure email verification settings match your requirements

3. If data operations fail:
   - Check Firestore Rules in Firebase Console
   - Verify user permissions
   - Check document structure matches required fields

## Performance Considerations
1. Keep base64 images under 1MB
2. Use pagination for listing signals
3. Implement caching for frequently accessed data
4. Consider implementing lazy loading for images