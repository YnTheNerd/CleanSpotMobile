# Firebase Optimization Guide for CleanSpot

## Database Performance Optimizations

### 1. Query Optimization

#### Current Optimized Queries
```javascript
// ✅ OPTIMIZED: User's reports with pagination
const getUserSignals = async (pageSize = 20, lastDoc = null) => {
  let q = query(
    collection(db, 'signals'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  // Pagination support included
};

// ✅ OPTIMIZED: Filtered reports by status
const getUserSignalsByStatus = async (status) => {
  const q = query(
    collection(db, 'signals'),
    where('userId', '==', user.uid),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
};
```

#### Required Firestore Indexes
```
// Add these indexes in Firebase Console > Firestore > Indexes

1. Collection: signals
   Fields: userId (Ascending), createdAt (Descending)
   
2. Collection: signals
   Fields: userId (Ascending), status (Ascending), createdAt (Descending)
   
3. Collection: signals
   Fields: status (Ascending), createdAt (Descending)
```

### 2. Image Storage Optimization

#### Current Implementation Benefits
- ✅ Images stored in Firebase Storage (not Firestore)
- ✅ Compression to <1MB before upload
- ✅ Structured storage paths: `reports/{userId}/{timestamp}.jpg`

#### Additional Optimizations
```javascript
// Enhanced image upload with metadata
const uploadImageOptimized = async (imageUri, userId) => {
  const timestamp = Date.now();
  const imagePath = `reports/${userId}/${timestamp}.jpg`;
  
  // Add metadata for better management
  const metadata = {
    customMetadata: {
      'uploadedBy': userId,
      'uploadedAt': timestamp.toString(),
      'source': 'mobile_app',
      'compressed': 'true'
    }
  };
  
  const imageRef = ref(storage, imagePath);
  const snapshot = await uploadBytes(imageRef, blob, metadata);
  return await getDownloadURL(snapshot.ref);
};
```

### 3. Caching Strategy

#### Client-Side Caching
```javascript
// Implement in React Native components
const [cachedReports, setCachedReports] = useState(new Map());

const getCachedReports = async (userId) => {
  const cacheKey = `reports_${userId}`;
  const cached = cachedReports.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
    return cached.data;
  }
  
  const fresh = await firestoreService.getUserSignals();
  setCachedReports(prev => new Map(prev).set(cacheKey, {
    data: fresh,
    timestamp: Date.now()
  }));
  
  return fresh;
};
```

### 4. Batch Operations

#### Optimized Admin Operations
```javascript
// Use batch writes for multiple updates
const batchUpdateSignals = async (updates) => {
  const batch = writeBatch(db);
  
  updates.forEach(({ signalId, data }) => {
    const signalRef = doc(db, 'signals', signalId);
    batch.update(signalRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit(); // Single network call
};
```

## Cost Optimization Strategies

### 1. Read Optimization

#### Pagination Implementation
```javascript
// Reduces reads by loading data in chunks
const loadReportsWithPagination = async () => {
  const result = await firestoreService.getUserSignals(20, lastDoc);
  
  setReports(prev => [...prev, ...result.signals]);
  setLastDoc(result.lastDoc);
  setHasMore(result.hasMore);
};
```

#### Smart Refresh Strategy
```javascript
// Only refresh when necessary
const smartRefresh = async () => {
  const lastUpdate = localStorage.getItem('lastReportsUpdate');
  const now = Date.now();
  
  // Only refresh if data is older than 5 minutes
  if (!lastUpdate || now - parseInt(lastUpdate) > 300000) {
    await loadReports();
    localStorage.setItem('lastReportsUpdate', now.toString());
  }
};
```

### 2. Write Optimization

#### Debounced Updates
```javascript
// Prevent excessive writes during user input
import { debounce } from 'lodash';

const debouncedUpdateDescription = debounce(async (signalId, description) => {
  await firestoreService.updateSignal(signalId, { description });
}, 2000); // Wait 2 seconds after user stops typing
```

### 3. Storage Cost Optimization

#### Image Lifecycle Management
```javascript
// Clean up old images (implement as Cloud Function)
const cleanupOldImages = async () => {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months old
  
  const oldSignals = await getDocs(query(
    collection(db, 'signals'),
    where('createdAt', '<', cutoffDate),
    where('status', '==', 'resolved')
  ));
  
  // Archive or delete old resolved reports
};
```

## Security Optimizations

### 1. Enhanced Security Rules

#### Rate Limiting (Firestore Rules)
```javascript
// Prevent spam by limiting writes per user
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /signals/{signalId} {
      allow create: if isAuthenticated() && 
                   isOwner(request.resource.data.userId) &&
                   // Limit to 10 reports per day per user
                   request.time > resource.data.lastReportTime + duration.value(86400, 's') ||
                   getUserReportsToday() < 10;
    }
  }
}
```

### 2. Data Validation

#### Client-Side Validation
```javascript
const validateSignalData = (data) => {
  const errors = {};
  
  if (!data.description || data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  
  if (!data.imageUrl || !data.imageUrl.includes('firebasestorage')) {
    errors.image = 'Valid image is required';
  }
  
  if (!data.location?.latitude || !data.location?.longitude) {
    errors.location = 'Valid location is required';
  }
  
  return errors;
};
```

## Monitoring & Analytics

### 1. Performance Monitoring

#### Query Performance Tracking
```javascript
const trackQueryPerformance = async (queryName, queryFunction) => {
  const startTime = Date.now();
  
  try {
    const result = await queryFunction();
    const duration = Date.now() - startTime;
    
    // Log to analytics
    console.log(`Query ${queryName} took ${duration}ms`);
    
    return result;
  } catch (error) {
    console.error(`Query ${queryName} failed:`, error);
    throw error;
  }
};
```

### 2. Usage Analytics

#### Track User Actions
```javascript
const trackUserAction = (action, metadata = {}) => {
  // Use Firebase Analytics or custom analytics
  analytics.logEvent(action, {
    user_id: auth.currentUser?.uid,
    timestamp: Date.now(),
    ...metadata
  });
};

// Usage examples
trackUserAction('report_created', { location_accuracy: location.accuracy });
trackUserAction('report_viewed', { report_status: report.status });
```

## Scalability Recommendations

### 1. Database Sharding Strategy

#### Geographic Sharding (Future)
```javascript
// Shard by geographic regions for better performance
const getRegionFromCoordinates = (lat, lng) => {
  // Simple example - implement proper geographic regions
  if (lat > 45) return 'north';
  if (lat < 45) return 'south';
  return 'central';
};

const getRegionalCollection = (location) => {
  const region = getRegionFromCoordinates(location.latitude, location.longitude);
  return `signals_${region}`;
};
```

### 2. Cloud Functions Integration

#### Automated Processing
```javascript
// Example Cloud Function for auto-processing
exports.processNewSignal = functions.firestore
  .document('signals/{signalId}')
  .onCreate(async (snap, context) => {
    const signal = snap.data();
    
    // Auto-categorize based on description
    const category = await categorizeSignal(signal.description);
    
    // Update signal with category
    await snap.ref.update({
      category: category,
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send notification to relevant authorities
    await notifyAuthorities(signal);
  });
```

## Implementation Checklist

### Immediate Actions
- [ ] Add required Firestore indexes
- [ ] Deploy security rules to production
- [ ] Implement pagination in mobile app
- [ ] Add client-side caching
- [ ] Set up performance monitoring

### Short-term (1-2 weeks)
- [ ] Implement batch operations for admin
- [ ] Add image metadata tracking
- [ ] Set up automated backups
- [ ] Implement rate limiting

### Long-term (1-3 months)
- [ ] Deploy Cloud Functions for automation
- [ ] Implement geographic sharding
- [ ] Add advanced analytics
- [ ] Set up automated cleanup processes

## Free Tier Limits & Monitoring

### Current Limits
- **Reads**: 50,000/day
- **Writes**: 20,000/day
- **Deletes**: 20,000/day
- **Storage**: 1 GB

### Monitoring Strategy
```javascript
// Track usage to stay within limits
const trackFirebaseUsage = {
  reads: 0,
  writes: 0,
  dailyLimit: {
    reads: 45000, // Leave buffer
    writes: 18000
  },
  
  incrementRead() {
    this.reads++;
    if (this.reads > this.dailyLimit.reads) {
      console.warn('Approaching read limit');
    }
  },
  
  incrementWrite() {
    this.writes++;
    if (this.writes > this.dailyLimit.writes) {
      console.warn('Approaching write limit');
    }
  }
};
```
