// Simplified Firebase Service for Testing (No Firebase Dependencies)

// Mock Authentication Services
export const authService = {
  // Mock register function
  register: async (email, password, displayName) => {
    console.log("🔐 Mock Register:", { email, displayName });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          uid: 'mock-user-id',
          email: email,
          displayName: displayName,
        });
      }, 1000);
    });
  },

  // Mock login function
  login: async (email, password) => {
    console.log("🔐 Mock Login:", { email });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          uid: 'mock-user-id',
          email: email,
          displayName: 'Utilisateur Test',
        });
      }, 1000);
    });
  },

  // Mock logout function
  logout: async () => {
    console.log("🔐 Mock Logout");
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  },

  // Mock reset password
  resetPassword: async (email) => {
    console.log("🔐 Mock Reset Password:", { email });
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  },

  // Mock auth state listener
  onAuthStateChange: (callback) => {
    console.log("🔐 Mock Auth State Listener Setup");
    // Simulate no user initially
    setTimeout(() => callback(null), 100);
    
    // Return mock unsubscribe function
    return () => {
      console.log("🔐 Mock Auth State Listener Unsubscribed");
    };
  },

  // Mock get current user
  getCurrentUser: () => {
    console.log("🔐 Mock Get Current User");
    return null; // No user for testing
  }
};

// Mock Storage Services
export const storageService = {
  // Mock upload image
  uploadImage: async (imageUri, path) => {
    console.log("📁 Mock Upload Image:", { imageUri, path });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('https://mock-image-url.com/image.jpg');
      }, 2000);
    });
  }
};

// Mock Firestore Services
export const firestoreService = {
  // Mock create signal
  createSignal: async (signalData) => {
    console.log("📝 Mock Create Signal:", signalData);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('mock-signal-id-' + Date.now());
      }, 1500);
    });
  },

  // Mock get user signals
  getUserSignals: async (pageSize = 20, lastDoc = null) => {
    console.log("📋 Mock Get User Signals");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          signals: [], // Empty array for testing
          lastDoc: null,
          hasMore: false
        });
      }, 1000);
    });
  },

  // Mock get user signals by status
  getUserSignalsByStatus: async (status, pageSize = 20) => {
    console.log("📋 Mock Get User Signals By Status:", { status });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 1000);
    });
  },

  // Mock update signal status
  updateSignalStatus: async (signalId, status, adminNotes = '', assignedTo = null) => {
    console.log("📝 Mock Update Signal Status:", { signalId, status, adminNotes });
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  },

  // Mock get signal by ID
  getSignalById: async (signalId) => {
    console.log("📋 Mock Get Signal By ID:", { signalId });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: signalId,
          description: 'Mock signal description',
          status: 'pending',
          createdAt: new Date(),
        });
      }, 1000);
    });
  },

  // Mock get user stats
  getUserStats: async (userId = null) => {
    console.log("📊 Mock Get User Stats");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalReports: 0,
          pendingReports: 0,
          inProgressReports: 0,
          resolvedReports: 0
        });
      }, 1000);
    });
  }
};

console.log("🧪 Firebase Service Simple - Mock services loaded");
