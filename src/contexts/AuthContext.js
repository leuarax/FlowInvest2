import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user/session on mount
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };
    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email, password, and onboarding info
  const signUp = async (email, password, onboardingData) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };
    // After sign up, create user profile row
    if (data.user) {
      await saveUserProfile(data.user.id, onboardingData);
    }
    return { data, error };
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) setUser(null);
    return { error };
  };

  // Save or update user profile (onboarding info)
  const saveUserProfile = async (userId, profileData) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      }, { onConflict: ['user_id'] });
    if (!error) setUserProfile(data);
    return { data, error };
  };

  // Save a new investment
  const saveInvestment = async (userId, investmentData) => {
    const { data, error } = await supabase
      .from('investments')
      .insert({
        user_id: userId,
        ...investmentData,
        created_at: new Date().toISOString(),
      });
    return { data, error };
  };

  // Fetch user investments
  const getUserInvestments = async (userId) => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  };

  // Save a new real estate investment
  const saveRealEstate = async (userId, realEstateData) => {
    const { data, error } = await supabase
      .from('real_estate_investments')
      .insert({
        user_id: userId,
        ...realEstateData,
        created_at: new Date().toISOString(),
      });
    return { data, error };
  };

  // Fetch user real estate investments
  const getUserRealEstate = async (userId) => {
    const { data, error } = await supabase
      .from('real_estate_investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    saveUserProfile,
    saveInvestment,
    getUserInvestments,
    saveRealEstate,
    getUserRealEstate,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 