import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signUp as firebaseSignUp, 
  signIn as firebaseSignIn, 
  signOutUser as firebaseSignOut,
  createUserProfile,
  getUserProfile,
  saveInvestment as firebaseSaveInvestment,
  getUserInvestments as firebaseGetUserInvestments,
  deleteInvestment as firebaseDeleteInvestment,
  onAuthStateChange
} from '../utils/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user);
      setUser(user);
      
      if (user) {
        console.log('User authenticated, fetching profile for:', user.uid);
        // Get user profile from Firestore
        const { profile, error } = await getUserProfile(user.uid);
        if (!error && profile) {
          console.log('User profile found:', profile);
          setUserProfile(profile);
        } else {
          console.log('No user profile found or error:', error);
          setUserProfile(null);
        }
      } else {
        console.log('No user authenticated, clearing profile');
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, displayName, onboardingData = null) => {
    try {
      setLoading(true);
      const { user: newUser, error } = await firebaseSignUp(email, password, displayName);
      
      if (error) {
        throw error;
      }

      // Create user profile in Firestore
      const profileData = {
        displayName,
        email,
        ...onboardingData
      };

      const { error: profileError } = await createUserProfile(newUser.uid, profileData);
      
      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }

      return { user: newUser, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { user: signedInUser, error } = await firebaseSignIn(email, password);
      
      if (error) {
        throw error;
      }

      return { user: signedInUser, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await firebaseSignOut();
      
      if (error) {
        throw error;
      }

      setUser(null);
      setUserProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const saveInvestment = async (investmentData) => {
    if (!user) {
      return { id: null, error: new Error('User not authenticated') };
    }

    try {
      const { id, error } = await firebaseSaveInvestment(user.uid, investmentData);
      
      if (error) {
        throw error;
      }

      return { id, error: null };
    } catch (error) {
      console.error('Save investment error:', error);
      return { id: null, error };
    }
  };

  const getUserInvestments = async () => {
    if (!user) {
      return { investments: [], error: new Error('User not authenticated') };
    }

    try {
      const { investments, error } = await firebaseGetUserInvestments(user.uid);
      
      if (error) {
        throw error;
      }

      return { investments, error: null };
    } catch (error) {
      console.error('Get investments error:', error);
      return { investments: [], error };
    }
  };

  const deleteInvestment = async (investmentId) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await firebaseDeleteInvestment(investmentId);
      
      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Delete investment error:', error);
      return { error };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    saveInvestment,
    getUserInvestments,
    deleteInvestment
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 