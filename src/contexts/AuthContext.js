import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../utils/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        console.log('Initial user:', currentUser);
        setUser(currentUser);
        
        if (currentUser) {
          const { data: profile } = await db.getUserProfile(currentUser.id);
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Error fetching initial user:', err);
      }
      console.log('AuthContext: setLoading(false) after getInitialUser');
      setLoading(false);
      console.log('AuthContext: loading is now', false);
    };

    getInitialUser();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user);
      setUser(session?.user ?? null);
      
      try {
        if (session?.user) {
          const { data: profile } = await db.getUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error in onAuthStateChange:', err);
      }
      
      console.log('AuthContext: setLoading(false) after onAuthStateChange');
      setLoading(false);
      console.log('AuthContext: loading is now', false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await auth.signUp(email, password);
    if (error) console.error('Sign up error:', error);
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await auth.signIn(email, password);
    if (error) console.error('Sign in error:', error);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await auth.signOut();
    if (error) console.error('Sign out error:', error);
    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await auth.signInWithGoogle();
    if (error) console.error('Google sign in error:', error);
    return { data, error };
  };

  const signInWithApple = async () => {
    const { data, error } = await auth.signInWithApple();
    if (error) console.error('Apple sign in error:', error);
    return { data, error };
  };

  const saveUserProfile = async (profileData) => {
    if (!user) return { error: 'No user logged in' };
    
    const { data, error } = await db.saveUserProfile(user.id, profileData);
    if (!error) {
      setUserProfile(data);
    }
    if (error) console.error('Save user profile error:', error);
    return { data, error };
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithApple,
    saveUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 