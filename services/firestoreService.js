// Add proper error handling for permissions
export const createSignal = async (signalData, userId) => {
  try {
    // Ensure userId is included in the data
    const dataWithUser = {
      ...signalData,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending'
    };

    const docRef = await addDoc(collection(db, 'signals'), dataWithUser);
    
    // Update user stats
    await updateUserStats(userId);
    
    return docRef.id;
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new Error('Vous n\'avez pas les permissions pour créer un signalement');
    }
    throw error;
  }
};

// Get user stats with proper error handling
export const getUserStats = async (userId) => {
  try {
    const docRef = doc(db, 'userStats', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Create initial stats if they don't exist
      const initialStats = {
        totalReports: 0,
        pendingReports: 0,
        inProgressReports: 0,
        resolvedReports: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(docRef, initialStats);
      return initialStats;
    }
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.error('Permission denied for user stats:', userId);
      return null;
    }
    throw error;
  }
};