import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Paper,
  IconButton,
  InputAdornment,
  Fade,
  Alert
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveInvestment as firebaseSaveInvestment } from '../utils/firebase';
import { analyzeInvestment } from '../utils/openai';

// Global variable to persist registration error across component re-mounts
let globalRegistrationError = '';

const Registration = () => {
  const { signUp, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get onboarding data from localStorage
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      // setOnboardingData(JSON.parse(savedProfile));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
    // Clear auth error when user starts typing
    if (error) {
      setError('');
      globalRegistrationError = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    globalRegistrationError = '';

    try {
      console.log('Starting registration process...');
      
      // Get onboarding data from localStorage if available
      const onboardingData = localStorage.getItem('onboardingData');
      const parsedOnboardingData = onboardingData ? JSON.parse(onboardingData) : null;
      
      console.log('Onboarding data:', parsedOnboardingData);

      // Use email as display name if no name is provided in onboarding data
      const displayName = parsedOnboardingData?.displayName || parsedOnboardingData?.name || formData.email.split('@')[0];

      const { user, error } = await signUp(
        formData.email, 
        formData.password, 
        displayName,
        parsedOnboardingData
      );
      
      if (error) {
        console.error('Registration error:', error);
        
        // Handle specific Firebase errors
        let errorMessage = '';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered. Please try logging in instead.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
        } else {
          errorMessage = error.message || 'Registration failed. Please try again.';
        }
        
        // Set error in global variable and state
        globalRegistrationError = errorMessage;
        setError(errorMessage);
        return;
      }

      if (user) {
        console.log('Registration successful, user created:', user);
        // Set flag for dashboard to trigger analysis on first load
        localStorage.setItem('needsPortfolioAnalysis', 'true');
        // If there's portfolio analysis from onboarding, save it and the investments
        if (parsedOnboardingData?.portfolioAnalysis) {
          console.log('Found portfolio analysis in onboarding data:', parsedOnboardingData.portfolioAnalysis);
          console.log('Investments to save:', parsedOnboardingData.portfolioAnalysis.investments);
          
          // Save investments first, even if analysis fails
          if (parsedOnboardingData.portfolioAnalysis.investments && parsedOnboardingData.portfolioAnalysis.investments.length > 0) {
            console.log('Saving investments for user:', user.uid);
            console.log('Number of investments to save:', parsedOnboardingData.portfolioAnalysis.investments.length);
            
            for (const investment of parsedOnboardingData.portfolioAnalysis.investments) {
              console.log('Processing investment:', investment);
              
              try {
                // Get detailed analysis for each investment (same as Dashboard)
                const analysis = await analyzeInvestment(
                  {
                    ...investment,
                    type: investment.type || 'Stock',
                    name: investment.name || 'Unnamed Investment',
                    duration: 'Long-term' // Default duration for analysis
                  },
                  {
                    experience: parsedOnboardingData.experience,
                    riskTolerance: parsedOnboardingData.riskTolerance,
                    interests: parsedOnboardingData.interests,
                    primaryGoal: parsedOnboardingData.primaryGoal
                  }
                );
                
                // Merge the analysis with the investment data
                const investmentWithAnalysis = {
                  ...investment,
                  roiScenarios: analysis.roiScenarios || {
                    pessimistic: (analysis.roiEstimate || 8.5) * 0.8,
                    realistic: analysis.roiEstimate || 8.5,
                    optimistic: (analysis.roiEstimate || 8.5) * 1.2
                  },
                  roiEstimate: analysis.roiEstimate || 8.5,
                  riskScore: analysis.riskScore || 5,
                  grade: analysis.grade || 'B',
                  explanation: analysis.explanation || 'Investment from onboarding'
                };
                
                console.log('Investment with detailed analysis:', investmentWithAnalysis);
                
                const { id, error: investmentError } = await firebaseSaveInvestment(user.uid, investmentWithAnalysis);
                if (investmentError) {
                  console.error('Error saving onboarding investment:', investmentError);
                } else {
                  console.log('Successfully saved investment:', investment.name, 'with ID:', id);
                }
              } catch (analysisError) {
                console.error('Error analyzing investment during registration:', analysisError);
                
                // Fallback to basic analysis if detailed analysis fails
                const investmentWithBasicAnalysis = {
                  ...investment,
                  grade: parsedOnboardingData.portfolioAnalysis.grade || 'B',
                  riskScore: parsedOnboardingData.portfolioAnalysis.riskScore || 5,
                  roiEstimate: 8.5,
                  roiScenarios: {
                    pessimistic: 6.8,
                    realistic: 8.5,
                    optimistic: 10.2
                  },
                  explanation: parsedOnboardingData.portfolioAnalysis.summary || 'Investment from onboarding (basic analysis)'
                };
                
                const { id, error: investmentError } = await firebaseSaveInvestment(user.uid, investmentWithBasicAnalysis);
                if (investmentError) {
                  console.error('Error saving onboarding investment with basic analysis:', investmentError);
                } else {
                  console.log('Successfully saved investment with basic analysis:', investment.name, 'with ID:', id);
                }
              }
            }
          } else {
            console.log('No investments found in portfolio analysis');
          }
          // Store expected investment count in localStorage
          if (parsedOnboardingData && parsedOnboardingData.portfolioAnalysis && Array.isArray(parsedOnboardingData.portfolioAnalysis.investments)) {
            localStorage.setItem('expectedInvestmentCount', parsedOnboardingData.portfolioAnalysis.investments.length.toString());
          }
          
          try {
            // Get the full analysis for the user's portfolio
            const fullAnalysisResponse = await fetch('/api/analyze-portfolio', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                investments: parsedOnboardingData.portfolioAnalysis.investments || [],
                userProfile: {
                  experience: parsedOnboardingData.experience,
                  riskTolerance: parsedOnboardingData.riskTolerance,
                  interests: parsedOnboardingData.interests,
                  primaryGoal: parsedOnboardingData.primaryGoal
                },
                preview: false
              }),
            });

            if (fullAnalysisResponse.ok) {
              const fullAnalysis = await fullAnalysisResponse.json();
              console.log('Full analysis received:', fullAnalysis);
              
              // Save the full analysis to the user's profile
              await updateUserProfile({
                portfolioAnalysis: fullAnalysis
              });
            } else {
              console.error('Failed to get full analysis:', fullAnalysisResponse.status, fullAnalysisResponse.statusText);
            }
          } catch (analysisError) {
            console.error('Error saving portfolio analysis:', analysisError);
            // Don't fail registration if analysis saving fails
          }
        } else {
          console.log('No portfolio analysis found in onboarding data');
        }
        
        // Clear onboarding data from localStorage
        localStorage.removeItem('onboardingData');
        globalRegistrationError = '';
        navigate('/verify-email');
      }
    } catch (error) {
      console.error('Unexpected registration error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      globalRegistrationError = errorMessage;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
        `
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Paper sx={{
            p: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Create Your Account
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Complete your FlowInvest registration
              </Typography>
            </Box>



            {/* Error Alert */}
            {globalRegistrationError && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#b91c1c'
                }}
              >
                {globalRegistrationError}
              </Alert>
            )}

            {/* Registration Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    background: 'rgba(248, 250, 252, 0.8)',
                    '&:hover fieldset': {
                      borderColor: '#667eea'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />

              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    background: 'rgba(248, 250, 252, 0.8)',
                    '&:hover fieldset': {
                      borderColor: '#667eea'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />

              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword((show) => !show)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    background: 'rgba(248, 250, 252, 0.8)',
                    '&:hover fieldset': {
                      borderColor: '#667eea'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea'
                    }
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Box>

            {/* Sign In Link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                Already have an account?
              </Typography>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{
                  color: '#667eea',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                Sign In
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Registration; 