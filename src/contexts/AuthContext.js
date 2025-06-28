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
      const currentUser = await auth.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const { data: profile } = await db.getUserProfile(currentUser.id);
        setUserProfile(profile);
      }
      
      setLoading(false);
    };

    getInitialUser();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profile } = await db.getUserProfile(session.user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await auth.signUp(email, password);
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await auth.signIn(email, password);
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await auth.signInWithGoogle();
    return { data, error };
  };

  const signInWithApple = async () => {
    const { data, error } = await auth.signInWithApple();
    return { data, error };
  };

  const saveUserProfile = async (profileData) => {
    if (!user) return { error: 'No user logged in' };
    
    const { data, error } = await db.saveUserProfile(user.id, profileData);
    if (!error) {
      setUserProfile(data);
    }
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