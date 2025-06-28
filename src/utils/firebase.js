import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
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
  deleteDoc
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
    await signOut(auth);
    return { error: null };
  } catch (error) {
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
      console.log('User profile not found');
      return { profile: null, error: null };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null, error };
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

// Auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export default app; 