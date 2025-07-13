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
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveInvestment as firebaseSaveInvestment } from '../utils/firebase';
import { analyzeInvestment } from '../utils/openai';

const Registration = () => {
  const { signUp } = useAuth();
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
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      // setOnboardingData(JSON.parse(savedProfile));
    }
    
    // Debug: Check what's in localStorage
    console.log('Registration useEffect - localStorage contents:', {
      onboardingData: localStorage.getItem('onboardingData'),
      onboardingInvestments: localStorage.getItem('onboardingInvestments'),
      userProfile: localStorage.getItem('userProfile'),
      onboardingStep: localStorage.getItem('onboardingStep')
    });
    
    // Monitor localStorage changes
    const checkLocalStorage = () => {
      const onboardingData = localStorage.getItem('onboardingData');
      if (!onboardingData) {
        console.log('WARNING: onboardingData was cleared from localStorage!');
        console.trace('Stack trace for when onboardingData was cleared');
      }
    };
    
    // Check every 100ms for the first 5 seconds
    const interval = setInterval(checkLocalStorage, 100);
    setTimeout(() => clearInterval(interval), 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
    if (error) {
      setError('');
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

    try {
      // Get onboarding data from localStorage at the time of submission
      const onboardingDataRaw = localStorage.getItem('onboardingData');
      console.log('Raw onboarding data from localStorage at submission:', onboardingDataRaw);
      
      let parsedOnboardingData = null;
      if (onboardingDataRaw) {
        try {
          parsedOnboardingData = JSON.parse(onboardingDataRaw);
          console.log('Successfully parsed onboarding data at submission:', parsedOnboardingData);
          console.log('Parsed data details:', {
            name: parsedOnboardingData.name,
            experience: parsedOnboardingData.experience,
            riskTolerance: parsedOnboardingData.riskTolerance,
            interests: parsedOnboardingData.interests,
            primaryGoal: parsedOnboardingData.primaryGoal,
            displayName: parsedOnboardingData.displayName
          });
        } catch (parseError) {
          console.error('Error parsing onboarding data at submission:', parseError);
        }
      } else {
        console.log('No onboarding data found in localStorage at submission time');
        // Check if there are any other localStorage keys that might contain the data
        console.log('All localStorage keys:', Object.keys(localStorage));
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          console.log(`localStorage[${key}]:`, localStorage.getItem(key));
        }
      }
      
      console.log('Registration - onboarding data from localStorage:', {
        rawOnboardingData: onboardingDataRaw,
        parsedOnboardingData,
        hasExperience: !!parsedOnboardingData?.experience,
        hasRiskTolerance: !!parsedOnboardingData?.riskTolerance,
        hasInterests: !!parsedOnboardingData?.interests,
        hasPrimaryGoal: !!parsedOnboardingData?.primaryGoal,
        experience: parsedOnboardingData?.experience,
        riskTolerance: parsedOnboardingData?.riskTolerance,
        interests: parsedOnboardingData?.interests,
        primaryGoal: parsedOnboardingData?.primaryGoal
      });
      
      const displayName = parsedOnboardingData?.displayName || parsedOnboardingData?.name || formData.email.split('@')[0];

      console.log('About to call signUp with:', {
        email: formData.email,
        displayName,
        onboardingData: parsedOnboardingData
      });

      const { user, error: authError } = await signUp(
        formData.email, 
        formData.password, 
        displayName,
        parsedOnboardingData
      );
      
      console.log('SignUp result:', { user: !!user, error: authError });
      
      if (authError) {
        let errorMessage = '';
        if (authError.code === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered. Please try logging in instead.';
        } else if (authError.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (authError.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address.';
        } else if (authError.code === 'auth/operation-not-allowed') {
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
        } else {
          errorMessage = authError.message || 'Registration failed. Please try again.';
        }
        
        setError(errorMessage);
        return;
      }

      if (user) {
        console.log('User created successfully, UID:', user.uid);
        localStorage.setItem('needsPortfolioAnalysis', 'true');
        
        // Handle investments from onboarding (only from localStorage to avoid duplicates)
        const onboardingInvestments = JSON.parse(localStorage.getItem('onboardingInvestments') || '[]');
        
        console.log('Processing investments during registration:', {
          onboardingInvestments: onboardingInvestments.length,
          totalInvestments: onboardingInvestments.length
        });
        
        if (onboardingInvestments.length > 0) {
          for (const investment of onboardingInvestments) {
            try {
              const analysis = await analyzeInvestment(
                {
                  ...investment,
                  type: investment.type || 'Stock',
                  name: investment.name || 'Unnamed Investment',
                  duration: 'Long-term' 
                },
                {
                  experience: parsedOnboardingData?.experience || 'beginner',
                  riskTolerance: parsedOnboardingData?.riskTolerance || 'conservative',
                  interests: parsedOnboardingData?.interests || ['Stocks'],
                  primaryGoal: parsedOnboardingData?.primaryGoal || 'Long-term growth'
                }
              );
              
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
              
              const { error: investmentError } = await firebaseSaveInvestment(user.uid, investmentWithAnalysis);
              if (investmentError) {
                console.error('Error saving onboarding investment:', investmentError);
              } else {
                console.log('Successfully saved investment:', investment.name);
              }
            } catch (analysisError) {
              console.error('Error analyzing investment during registration:', analysisError);
              
              const investmentWithBasicAnalysis = {
                ...investment,
                grade: 'B',
                riskScore: 5,
                roiEstimate: 8.5,
                roiScenarios: {
                  pessimistic: 6.8,
                  realistic: 8.5,
                  optimistic: 10.2
                },
                explanation: 'Investment from onboarding (basic analysis)'
              };
              
              const { error: investmentError } = await firebaseSaveInvestment(user.uid, investmentWithBasicAnalysis);
              if (investmentError) {
                console.error('Error saving onboarding investment with basic analysis:', investmentError);
              } else {
                console.log('Successfully saved investment with basic analysis:', investment.name);
              }
            }
          }
          
          localStorage.setItem('expectedInvestmentCount', onboardingInvestments.length.toString());
          console.log('Set expectedInvestmentCount to:', onboardingInvestments.length);
          
          // Clear the localStorage investments after saving to Firebase
          localStorage.removeItem('onboardingInvestments');
        }
        
        localStorage.removeItem('onboardingData');
        localStorage.removeItem('onboardingComplete'); // Clear the completion flag
        navigate('/verify-email');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Paper sx={{
            p: 4,
            backgroundColor: '#F9FAFB',
            borderRadius: '16px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB'
          }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{ 
                  fontWeight: 700,
                  color: '#1F2937',
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                Create Your Account
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280' }}>
                Join FlowInvest and start your journey
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626'
                }}
              >
                {error}
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
                      <EmailIcon sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    '& fieldset': {
                      borderColor: '#E5E7EB',
                    },
                    '&:hover fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8B5CF6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#6B7280',
                  },
                  '& .MuiInputBase-input': {
                    color: '#1F2937',
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
                      <LockIcon sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                        sx={{ color: '#9CA3AF' }}
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
                    backgroundColor: '#ffffff',
                    '& fieldset': {
                      borderColor: '#E5E7EB',
                    },
                    '&:hover fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8B5CF6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#6B7280',
                  },
                  '& .MuiInputBase-input': {
                    color: '#1F2937',
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
                      <LockIcon sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword((show) => !show)}
                        edge="end"
                        sx={{ color: '#9CA3AF' }}
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
                    backgroundColor: '#ffffff',
                    '& fieldset': {
                      borderColor: '#E5E7EB',
                    },
                    '&:hover fieldset': {
                      borderColor: '#D1D5DB',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8B5CF6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#6B7280',
                  },
                  '& .MuiInputBase-input': {
                    color: '#1F2937',
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  backgroundColor: '#8B5CF6',
                  color: '#ffffff',
                  borderRadius: '12px',
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    boxShadow: 'none'
                  },
                  '&:disabled': {
                    backgroundColor: '#E5E7EB',
                    color: '#9CA3AF'
                  }
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Create Account'}
              </Button>
            </Box>

            {/* Sign In Link */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  sx={{ 
                    color: '#8B5CF6', 
                    fontWeight: 600, 
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Registration;

