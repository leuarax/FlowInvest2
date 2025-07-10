import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signUp as firebaseSignUp, 
  signIn as firebaseSignIn, 
  signOutUser as firebaseSignOut,
  createUserProfile,
  getUserProfile,
  deleteUserProfile,
  cleanupOrphanedInvestments,
  saveInvestment as firebaseSaveInvestment,
  getUserInvestments as firebaseGetUserInvestments,
  deleteInvestment as firebaseDeleteInvestment,
  onAuthStateChange,
  updateUserProfile as firebaseUpdateUserProfile,
  checkEmailVerification,
  resendVerificationEmail,
  sendPasswordResetEmailHandler,
  getPortfolioAnalysisAndHistory,
  savePortfolioAnalysis,
  deletePortfolioAnalysis // <-- add this import
} from '../utils/firebase';
import { deleteUser, updateEmail as firebaseUpdateEmail, sendEmailVerification, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getPortfolioAnalysis } from '../utils/openai';

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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [skipAuthListener, setSkipAuthListener] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState(null);
  const [gradeHistory, setGradeHistory] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user);
      
      // Skip auth listener during sign-in process to prevent interference with error display
      if (skipAuthListener) {
        console.log('Skipping auth listener during sign-in process');
        return;
      }
      
      // Only proceed if we have a valid user with a UID
      if (user && user.uid) {
        console.log('User authenticated, fetching profile for:', user.uid);
        setUser(user);
        
        // Check email verification status
        const { isVerified } = await checkEmailVerification(user);
        setEmailVerified(isVerified);
        
        // Get user profile from Firestore
        const { profile, error } = await getUserProfile(user.uid);
        if (!error && profile) {
          console.log('User profile found:', profile);
          setUserProfile(profile);
          // --- Portfolio Analysis & Grade History Logic ---
          // Only run if user profile is complete
          if (profile && profile.experience && profile.riskTolerance && profile.interests && profile.primaryGoal) {
            // Fetch latest analysis and history
            const { analysis } = await getPortfolioAnalysisAndHistory(user.uid);
            let needsUpdate = false;
            let lastAnalysisDate = null;
            if (analysis && analysis.updatedAt) {
              lastAnalysisDate = new Date(analysis.updatedAt.seconds ? analysis.updatedAt.seconds * 1000 : analysis.updatedAt);
            }
            // Check if last analysis is older than 24h
            if (!lastAnalysisDate || (Date.now() - lastAnalysisDate.getTime()) > 24 * 60 * 60 * 1000) {
              // Check if user has logged in within last 7 days
              if (!lastAnalysisDate || (Date.now() - lastAnalysisDate.getTime()) < 7 * 24 * 60 * 60 * 1000) {
                needsUpdate = true;
              }
            }
            let latestAnalysis = analysis;
            if (needsUpdate) {
              // Get user's investments
              const { investments } = await firebaseGetUserInvestments(user.uid);
              if (investments && investments.length > 0) {
                // Run new analysis
                const newAnalysis = await getPortfolioAnalysis(investments, profile);
                // Save to Firestore (also updates grade history)
                await savePortfolioAnalysis(user.uid, newAnalysis);
                // Fetch updated analysis
                const { analysis: updatedAnalysis } = await getPortfolioAnalysisAndHistory(user.uid);
                latestAnalysis = updatedAnalysis;
              }
            }
            setPortfolioAnalysis(latestAnalysis);
            setGradeHistory(latestAnalysis?.gradeHistory || []);
          } else {
            setPortfolioAnalysis(null);
            setGradeHistory([]);
          }
        } else {
          console.log('No user profile found or error:', error);
          if (!error) {
            // Profile doesn't exist but no error - this is an orphaned user
            // Only run cleanup if the user is actually authenticated (not during failed login)
            // AND we're not currently in the middle of a sign-in attempt
            if (user && user.uid && !isSigningIn) {
              console.log('Orphaned user detected, handling cleanup...');
              await handleOrphanedUser(user.uid);
            } else {
              console.log('Skipping orphaned user cleanup - user not properly authenticated or sign-in in progress');
            }
          }
          setUserProfile(null);
        }
      } else {
        console.log('No user authenticated or invalid user, clearing state');
        setUser(null);
        setUserProfile(null);
        setEmailVerified(false);
      }
      
      setLoading(false);
    }, [isSigningIn, skipAuthListener]);

    return unsubscribe;
  }, [isSigningIn, skipAuthListener]);

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
      setIsSigningIn(true);
      setSkipAuthListener(true);
      console.log('AuthContext: Starting sign in process');
      const { user: signedInUser, error } = await firebaseSignIn(email, password);
      
      if (error) {
        console.log('AuthContext: Firebase sign in error:', error);
        // Return the original Firebase authentication error
        return { user: null, error };
      }

      console.log('AuthContext: Firebase sign in successful, checking profile');
      // Check if user profile exists in Firestore
      if (signedInUser) {
        // Check email verification first
        const { isVerified } = await checkEmailVerification(signedInUser);
        if (!isVerified) {
          console.log('AuthContext: Email not verified, returning error');
          return { user: null, error: new Error('Please verify your email address before signing in. Check your inbox for a verification link.') };
        }
        
        const { profile, error: profileError } = await getUserProfile(signedInUser.uid);
        
        if (profileError) {
          console.error('AuthContext: Error checking user profile:', profileError);
          // Sign out the user since we can't verify their profile
          console.log('AuthContext: Signing out due to profile error');
          await firebaseSignOut();
          return { user: null, error: new Error('Unable to verify user profile. Please try again.') };
        }
        
        if (!profile) {
          console.log('AuthContext: User profile not found for authenticated user, returning error');
          // Clean up the orphaned user in the background
          handleOrphanedUser(signedInUser.uid).catch(error => {
            console.error('Error cleaning up orphaned user:', error);
          });
          // Don't sign out immediately - just return the error and let the Login component handle it
          console.log('AuthContext: Returning error object');
          return { user: null, error: new Error('Account not found. Please contact support or create a new account.') };
        }
      }

      console.log('AuthContext: Sign in successful');
      return { user: signedInUser, error: null };
    } catch (error) {
      console.error('AuthContext: Sign in error caught in catch block:', error);
      return { user: null, error };
    } finally {
      setLoading(false);
      setIsSigningIn(false);
      setSkipAuthListener(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // If user exists, check if profile still exists and clean up if needed
      if (user) {
        const { profile } = await getUserProfile(user.uid);
        if (!profile) {
          // Profile doesn't exist, clean up any orphaned investments
          console.log('Profile not found during sign out, cleaning up orphaned investments');
        }
      }
      
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

  const handleOrphanedUser = async (userId) => {
    try {
      console.log('Handling orphaned user:', userId);
      
      // Only attempt cleanup if we have a valid user
      if (!userId) {
        console.log('No userId provided, skipping cleanup');
        return { error: null };
      }
      
      // Clean up any orphaned investments
      const { deletedCount, error: cleanupError } = await cleanupOrphanedInvestments();
      if (cleanupError) {
        console.error('Error cleaning up orphaned investments:', cleanupError);
        // Don't throw the error, just log it and continue
        // This prevents the cleanup error from blocking the sign-out process
      } else if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} orphaned investments`);
      }
      
      // Don't sign out the user immediately - let the Login component handle the error
      // The user will be signed out by the auth state listener when needed
      
      return { error: null };
    } catch (error) {
      console.error('Handle orphaned user error:', error);
      // Don't sign out the user on error - let the Login component handle it
      return { error };
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

  const updateUserProfile = async (updates) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await firebaseUpdateUserProfile(user.uid, updates);
      
      if (error) {
        throw error;
      }

      // Refresh the user profile in local state
      const { profile, error: refreshError } = await getUserProfile(user.uid);
      if (!refreshError && profile) {
        setUserProfile(profile);
      }

      return { error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { error };
    }
  };

  const checkEmailVerificationStatus = async () => {
    if (!user) {
      return { isVerified: false, error: new Error('User not authenticated') };
    }

    try {
      setVerificationLoading(true);
      const { isVerified, error } = await checkEmailVerification(user);
      
      if (error) {
        throw error;
      }

      setEmailVerified(isVerified);
      return { isVerified, error: null };
    } catch (error) {
      console.error('Check email verification error:', error);
      return { isVerified: false, error };
    } finally {
      setVerificationLoading(false);
    }
  };

  const resendVerificationEmailHandler = async () => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      setVerificationLoading(true);
      const { error } = await resendVerificationEmail(user);
      
      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Resend verification email error:', error);
      return { error };
    } finally {
      setVerificationLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await sendPasswordResetEmailHandler(email);
      
      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error };
    }
  };

  const updateEmail = async (newEmail) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }
    try {
      await firebaseUpdateEmail(user, newEmail);
      // Update email in Firestore profile as well
      const { error } = await firebaseUpdateUserProfile(user.uid, { email: newEmail });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const sendEmailVerificationToNewEmail = async (newEmail) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }
    try {
      // Temporarily update the user's email to send verification (Firebase limitation)
      await firebaseUpdateEmail(user, newEmail);
      await sendEmailVerification(user);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Add a helper to reauthenticate the user
  const reauthenticateUser = async (email, password) => {
    if (!user) return { error: new Error('User not authenticated') };
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(user, credential);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteAccount = async (reauthData = null) => {
    if (!user) {
      return { error: new Error('User not authenticated') };
    }
    try {
      setLoading(true);
      // Delete user profile and all investments
      const { error: profileError } = await deleteUserProfile(user.uid);
      if (profileError) {
        console.error('Error deleting user profile:', profileError);
      }
      // Delete portfolio analysis
      const { error: analysisError } = await deletePortfolioAnalysis(user.uid);
      if (analysisError) {
        console.error('Error deleting portfolio analysis:', analysisError);
      }
      // Try to delete the Firebase Auth user
      try {
        await deleteUser(user);
      } catch (error) {
        if (error.code === 'auth/requires-recent-login' && reauthData) {
          // Try re-authenticating and retrying
          const { error: reauthError } = await reauthenticateUser(reauthData.email, reauthData.password);
          if (!reauthError) {
            await deleteUser(user);
          } else {
            return { error: reauthError };
          }
        } else if (error.code === 'auth/requires-recent-login') {
          // Signal to UI that re-auth is needed
          return { error: { code: 'auth/requires-recent-login' } };
        } else {
          throw error;
        }
      }
      setUser(null);
      setUserProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Delete account error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    emailVerified,
    verificationLoading,
    portfolioAnalysis,
    gradeHistory,
    signUp,
    signIn,
    signOut,
    deleteAccount,
    saveInvestment,
    getUserInvestments,
    deleteInvestment,
    updateUserProfile,
    checkEmailVerificationStatus,
    resendVerificationEmailHandler,
    resetPassword,
    updateEmail,
    sendEmailVerificationToNewEmail,
    reauthenticateUser,
    setPortfolioAnalysis, // <-- add this line
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 