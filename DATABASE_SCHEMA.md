# CleanSpot Firestore Database Schema

## Overview
This document describes the optimized Firestore database structure for the CleanSpot mobile application.

## Collections

### 1. `signals` Collection
**Purpose**: Store all trash dump reports created by users

**Document Structure**:
```javascript
{
  // Core Data (Required)
  description: string,           // 10-1000 characters
  imageUrl: string,             // Firebase Storage URL
  location: {
    latitude: number,           // GPS latitude
    longitude: number,          // GPS longitude  
    address: string,            // Human-readable address (optional)
    accuracy: number | null     // GPS accuracy in meters
  },
  
  // User Data (Auto-populated)
  userId: string,               // Firebase Auth UID
  userEmail: string,            // User's email
  userDisplayName: string,      // User's display name or email prefix
  
  // Status & Workflow
  status: string,               // 'pending' | 'in_progress' | 'resolved'
  priority: string,             // 'low' | 'normal' | 'high' (for admin use)
  
  // Timestamps
  createdAt: Timestamp,         // When report was created
  updatedAt: Timestamp,         // Last modification time
  resolvedAt: Timestamp | null, // When marked as resolved
  
  // Admin Fields (for future web app)
  adminNotes: string,           // Admin comments/notes
  assignedTo: string | null,    // Admin user ID assigned to this report
  
  // Metadata
  reportSource: string,         // 'mobile_app' | 'web_app'
  version: string               // App version when created
}
```

**Indexes Required**:
- `userId` + `createdAt` (desc) - for user's reports list
- `userId` + `status` + `createdAt` (desc) - for filtered user reports
- `status` + `createdAt` (desc) - for admin dashboard
- `createdAt` (desc) - for admin all reports view

### 2. `userStats` Collection
**Purpose**: Track user statistics for gamification and analytics

**Document ID**: User's Firebase Auth UID

**Document Structure**:
```javascript
{
  totalReports: number,         // Total reports created by user
  pendingReports: number,       // Reports with 'pending' status
  inProgressReports: number,    // Reports with 'in_progress' status
  resolvedReports: number,      // Reports with 'resolved' status
  createdAt: Timestamp,         // When user first created a report
  updatedAt: Timestamp          // Last stats update
}
```

### 3. `admins` Collection (Future)
**Purpose**: Manage admin users for the web application

**Document ID**: Admin's Firebase Auth UID

**Document Structure**:
```javascript
{
  email: string,                // Admin email
  displayName: string,          // Admin name
  role: string,                 // 'admin' | 'super_admin'
  permissions: string[],        // Array of permission strings
  createdAt: Timestamp,         // When admin was added
  lastLogin: Timestamp,         // Last login time
  isActive: boolean             // Whether admin is active
}
```

### 4. `userProfiles` Collection (Optional)
**Purpose**: Extended user profile data

**Document ID**: User's Firebase Auth UID

**Document Structure**:
```javascript
{
  displayName: string,          // User's preferred display name
  avatar: string | null,        // Profile picture URL
  location: {                   // User's general location (optional)
    city: string,
    region: string,
    country: string
  },
  preferences: {
    notifications: boolean,     // Email notifications enabled
    language: string           // Preferred language
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 5. `feedback` Collection (Future)
**Purpose**: User feedback and support requests

**Document Structure**:
```javascript
{
  userId: string,               // User who submitted feedback
  userEmail: string,            // User's email
  type: string,                 // 'bug' | 'feature' | 'support' | 'other'
  subject: string,              // Feedback subject
  message: string,              // Feedback content
  status: string,               // 'open' | 'in_progress' | 'resolved'
  adminResponse: string,        // Admin response (optional)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 6. `appConfig` Collection (Future)
**Purpose**: Application configuration and settings

**Document Structure**:
```javascript
{
  maintenanceMode: boolean,     // Whether app is in maintenance
  minAppVersion: string,        // Minimum required app version
  maxImageSize: number,         // Max image size in bytes
  supportedLanguages: string[], // Supported language codes
  features: {                   // Feature flags
    mapSelection: boolean,
    pushNotifications: boolean,
    userProfiles: boolean
  },
  updatedAt: Timestamp
}
```

## Security Rules Summary

### User Permissions
- **Read**: Users can only read their own signals and stats
- **Create**: Users can create signals with valid data structure
- **Update**: Users can only update description of their own signals
- **Delete**: Users cannot delete signals

### Admin Permissions
- **Read**: Admins can read all signals, stats, and feedback
- **Update**: Admins can update signal status, add notes, assign reports
- **Delete**: Admins can delete signals if necessary

### Data Validation
- Description: 10-1000 characters
- Image URL: Must be Firebase Storage URL
- Location: Must have valid latitude/longitude
- Status: Must be one of predefined values

## Query Patterns & Performance

### Mobile App Queries
1. **User's Reports**: `userId == currentUser && orderBy('createdAt', 'desc')`
2. **User's Reports by Status**: `userId == currentUser && status == 'pending' && orderBy('createdAt', 'desc')`
3. **User Stats**: Direct document read by userId

### Admin Web App Queries (Future)
1. **All Reports**: `orderBy('createdAt', 'desc') + pagination`
2. **Reports by Status**: `status == 'pending' && orderBy('createdAt', 'desc')`
3. **Reports by Location**: Geoqueries using latitude/longitude

## Storage Optimization

### Images
- **Storage**: Firebase Storage (not Firestore)
- **Path Structure**: `reports/{userId}/{timestamp}.jpg`
- **Compression**: Images compressed to <1MB before upload
- **URLs**: Stored as download URLs in Firestore

### Pagination
- **Mobile**: 20 items per page
- **Admin**: 50 items per page
- **Implementation**: Using `startAfter()` with document snapshots

## Indexing Recommendations

### Composite Indexes
```
Collection: signals
Fields: userId (Ascending), createdAt (Descending)

Collection: signals  
Fields: userId (Ascending), status (Ascending), createdAt (Descending)

Collection: signals
Fields: status (Ascending), createdAt (Descending)
```

### Single Field Indexes
- All timestamp fields should be indexed
- Status field should be indexed
- UserId field should be indexed

## Migration Notes

### From Current Implementation
The current implementation is already compatible with this schema. The main changes are:
1. Enhanced data structure with additional fields
2. Added user stats tracking
3. Improved security rules
4. Added pagination support

### Backward Compatibility
All existing signals will continue to work. New fields will be added with default values where needed.

## Cost Optimization

### Free Tier Considerations
- **Reads**: Optimized with pagination to minimize reads
- **Writes**: Batch operations for admin updates
- **Storage**: Images stored in Firebase Storage, not Firestore
- **Bandwidth**: Compressed images reduce bandwidth usage

### Scaling Recommendations
- Implement Cloud Functions for complex operations
- Use Firestore bundles for common queries
- Consider regional deployment for better performance
- Implement caching for frequently accessed data
