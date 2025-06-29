import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

// Your Firebase configuration
// You'll need to replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Authentication functions
export const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, {
      displayName: displayName
    });
    
    // Send email verification
    await sendEmailVerification(user);
    
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signOutUser = async () => {
  try {
    console.log('firebase: Starting sign out');
    await signOut(auth);
    console.log('firebase: Sign out successful');
    return { error: null };
  } catch (error) {
    console.error('firebase: Sign out error:', error);
    return { error };
  }
};

// Email verification functions
export const checkEmailVerification = async (user) => {
  try {
    // Reload the user to get the latest verification status
    await user.reload();
    return { isVerified: user.emailVerified, error: null };
  } catch (error) {
    console.error('Error checking email verification:', error);
    return { isVerified: false, error };
  }
};

export const resendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    return { error: null };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { error };
  }
};

export const sendPasswordResetEmailHandler = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { error };
  }
};

// User profile functions
export const createUserProfile = async (userId, profileData) => {
  try {
    console.log('Creating user profile for:', userId, 'with data:', profileData);
    
    await setDoc(doc(db, 'user_profiles', userId), {
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('User profile created successfully');
    return { error: null };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { error };
  }
};

export const getUserProfile = async (userId) => {
  try {
    console.log('Getting user profile for:', userId);
    
    const docRef = doc(db, 'user_profiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('User profile found:', docSnap.data());
      return { profile: docSnap.data(), error: null };
    } else {
      console.log('User profile not found - cleaning up orphaned investments');
      // If profile doesn't exist, clean up any orphaned investments
      await deleteAllUserInvestments(userId);
      return { profile: null, error: null };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null, error };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    console.log('Updating user profile for:', userId, 'with updates:', updates);
    
    // First get the current profile to ensure we don't overwrite existing data
    const { profile: currentProfile } = await getUserProfile(userId);
    
    if (!currentProfile) {
      console.error('Cannot update profile - profile does not exist');
      return { error: new Error('User profile not found') };
    }
    
    // Merge the updates with the existing profile
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, 'user_profiles', userId), updatedProfile);
    
    console.log('User profile updated successfully');
    return { error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { error };
  }
};

export const deleteUserProfile = async (userId) => {
  try {
    console.log('Deleting user profile and all investments for:', userId);
    
    // First delete all investments for this user
    const { error: investmentsError } = await deleteAllUserInvestments(userId);
    if (investmentsError) {
      console.error('Error deleting user investments:', investmentsError);
    }
    
    // Then delete the user profile
    await deleteDoc(doc(db, 'user_profiles', userId));
    console.log('User profile deleted successfully');
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return { error };
  }
};

// Investment functions
export const saveInvestment = async (userId, investmentData) => {
  try {
    const docRef = await addDoc(collection(db, 'investments'), {
      ...investmentData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error };
  }
};

export const getUserInvestments = async (userId) => {
  try {
    const q = query(collection(db, 'investments'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const investments = [];
    querySnapshot.forEach((doc) => {
      investments.push({ id: doc.id, ...doc.data() });
    });
    return { investments, error: null };
  } catch (error) {
    return { investments: [], error };
  }
};

export const deleteInvestment = async (investmentId) => {
  try {
    await deleteDoc(doc(db, 'investments', investmentId));
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const deleteAllUserInvestments = async (userId) => {
  try {
    console.log('Deleting all investments for user:', userId);
    
    // Get all investments for this user
    const q = query(collection(db, 'investments'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No investments found for user:', userId);
      return { deletedCount: 0, error: null };
    }
    
    // Use a batch to delete all investments efficiently
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    await batch.commit();
    console.log(`Deleted ${deletedCount} investments for user:`, userId);
    
    return { deletedCount, error: null };
  } catch (error) {
    console.error('Error deleting all user investments:', error);
    return { deletedCount: 0, error };
  }
};

// Utility function to clean up orphaned investments
export const cleanupOrphanedInvestments = async () => {
  try {
    console.log('Starting cleanup of orphaned investments...');
    
    // Get all investments
    const investmentsQuery = query(collection(db, 'investments'));
    const investmentsSnapshot = await getDocs(investmentsQuery);
    
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    // Check each investment to see if the user profile exists
    for (const investmentDoc of investmentsSnapshot.docs) {
      const investmentData = investmentDoc.data();
      const userId = investmentData.userId;
      
      if (userId) {
        try {
          // Check if user profile exists
          const profileDoc = await getDoc(doc(db, 'user_profiles', userId));
          if (!profileDoc.exists()) {
            // Profile doesn't exist, mark investment for deletion
            batch.delete(investmentDoc.ref);
            deletedCount++;
            console.log(`Marking orphaned investment for deletion: ${investmentDoc.id} (user: ${userId})`);
          }
        } catch (profileError) {
          console.error('Error checking profile for investment:', profileError);
          // If we can't check the profile due to permissions, skip this investment
          continue;
        }
      }
    }
    
    if (deletedCount > 0) {
      try {
        await batch.commit();
        console.log(`Cleaned up ${deletedCount} orphaned investments`);
      } catch (commitError) {
        console.error('Error committing batch delete:', commitError);
        // If batch commit fails due to permissions, return the error
        return { deletedCount: 0, error: commitError };
      }
    } else {
      console.log('No orphaned investments found');
    }
    
    return { deletedCount, error: null };
  } catch (error) {
    console.error('Error cleaning up orphaned investments:', error);
    // If the initial query fails due to permissions, return the error
    return { deletedCount: 0, error };
  }
};

// Auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export default app; 