import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user;
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    return { data, error }
  },

  // Sign in with Apple
  signInWithApple: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    return { data, error }
  }
}

// Database helper functions
export const db = {
  // Save user profile (onboarding data)
  saveUserProfile: async (userId, profileData) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        name: profileData.name,
        experience: profileData.experience,
        risk_tolerance: profileData.riskTolerance,
        interests: profileData.interests,
        primary_goal: profileData.primaryGoal,
        created_at: new Date().toISOString()
      })
    return { data, error }
  },

  // Get user profile
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  // Save investment
  saveInvestment: async (userId, investmentData) => {
    const { data, error } = await supabase
      .from('investments')
      .insert({
        user_id: userId,
        name: investmentData.name,
        type: investmentData.type,
        amount: investmentData.amount,
        date: investmentData.date,
        description: investmentData.description,
        created_at: new Date().toISOString()
      })
    return { data, error }
  },

  // Get user investments
  getUserInvestments: async (userId) => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Save real estate investment
  saveRealEstate: async (userId, realEstateData) => {
    const { data, error } = await supabase
      .from('real_estate_investments')
      .insert({
        user_id: userId,
        property_name: realEstateData.propertyName,
        property_type: realEstateData.propertyType,
        purchase_price: realEstateData.purchasePrice,
        current_value: realEstateData.currentValue,
        monthly_rent: realEstateData.monthlyRent,
        location: realEstateData.location,
        purchase_date: realEstateData.purchaseDate,
        created_at: new Date().toISOString()
      })
    return { data, error }
  },

  // Get user real estate investments
  getUserRealEstate: async (userId) => {
    const { data, error } = await supabase
      .from('real_estate_investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  }
} 