import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Checkbox,
  Paper,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { interestOptions } from '../utils/constants';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../utils/firebase';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { saveInvestment } from '../utils/firebase';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

// import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Remove if not used
// import InsightsIcon from '@mui/icons-material/Insights'; // Remove if not used

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    experience: '',
    riskTolerance: '',
    referralSource: '',
    referralOther: '',
    interests: [],
    primaryGoal: '',
    screenshotFile: null,
    screenshotPreview: null,
    portfolioAnalysis: null,
    analysisLoading: false,
  });
  const [randomizedReferralOptions, setRandomizedReferralOptions] = useState([]);

  const referralOptions = React.useMemo(() => [
    { value: 'instagram', label: 'Instagram', description: 'Found us through social media content' },
    { value: 'tiktok', label: 'TikTok', description: 'Discovered us on TikTok' },
    { value: 'friend_recommendation', label: 'Friend Recommendation', description: 'Recommended by someone I know' },
    { value: 'search_engine', label: 'Search Engine', description: 'Found through Google or other search engines' },
    { value: 'blog_article', label: 'Blog/Article', description: 'Read about us in an article or blog post' },
    { value: 'podcast', label: 'Podcast', description: 'Heard about us on a podcast' },
    { value: 'other', label: 'Other', description: 'Another way not listed above' },
  ], []);

  // Function to get randomized referral options (excluding "other" which stays at the end)
  const getRandomizedReferralOptions = React.useCallback(() => {
    const optionsWithoutOther = referralOptions.filter(option => option.value !== 'other');
    const otherOption = referralOptions.find(option => option.value === 'other');
    
    // Shuffle the options excluding "other"
    const shuffledOptions = optionsWithoutOther.sort(() => Math.random() - 0.5);
    
    // Add "other" at the end
    return [...shuffledOptions, otherOption];
  }, [referralOptions]);

  const benefits = [
    {
      title: "Smart Portfolio Analysis",
      description: "Get AI-powered insights into your investment portfolio with detailed risk assessment and performance analysis.",
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: '#8B5CF6' }} />
    },
    {
      title: "Personalized Strategy",
      description: "Receive tailored investment recommendations based on your risk tolerance, goals, and market conditions.",
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: '#8B5CF6' }} /> // Use AnalyticsIcon or replace with InsightsIcon if needed
    },
    {
      title: "Portfolio Stress Test",
      description: "Test your portfolio against various market scenarios to understand potential risks and prepare for different economic conditions.",
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: '#8B5CF6' }} /> // Use AnalyticsIcon or replace with TrendingUpIcon if needed
    }
  ];

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('onboardingStep', currentStep.toString());
  }, [currentStep]);

  // Restore onboarding state from localStorage on component mount
  useEffect(() => {
    const savedStep = localStorage.getItem('onboardingStep');
    const savedFormData = localStorage.getItem('onboardingData');
    const savedRandomizedOptions = localStorage.getItem('randomizedReferralOptions');
    
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
    
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(prevData => ({
          ...prevData,
          ...parsedData,
          // Don't restore file-related data as it can't be serialized
          screenshotFile: null,
          screenshotPreview: null,
          portfolioAnalysis: null,
          analysisLoading: false,
        }));
      } catch (error) {
        console.error('Error parsing saved onboarding data:', error);
      }
    }
    
    // Initialize or restore randomized referral options
    if (savedRandomizedOptions) {
      try {
        setRandomizedReferralOptions(JSON.parse(savedRandomizedOptions));
      } catch (error) {
        console.error('Error parsing saved randomized options:', error);
        // Fallback to generating new randomized options
        const newRandomizedOptions = getRandomizedReferralOptions();
        setRandomizedReferralOptions(newRandomizedOptions);
        localStorage.setItem('randomizedReferralOptions', JSON.stringify(newRandomizedOptions));
      }
    } else {
      // First time user, generate new randomized options
      const newRandomizedOptions = getRandomizedReferralOptions();
      setRandomizedReferralOptions(newRandomizedOptions);
      localStorage.setItem('randomizedReferralOptions', JSON.stringify(newRandomizedOptions));
    }
    
    // Add initial history entry to prevent going back to landing page
    if (savedStep && parseInt(savedStep, 10) > 0) {
      window.history.replaceState(null, '', '/onboarding');
    }
  }, [getRandomizedReferralOptions]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event) => {
      const savedStep = localStorage.getItem('onboardingStep');
      if (savedStep && parseInt(savedStep, 10) > 0) {
        // Go back to the previous step instead of leaving onboarding
        const previousStep = parseInt(savedStep, 10) - 1;
        setCurrentStep(previousStep);
        localStorage.setItem('onboardingStep', previousStep.toString());
        
        // Push a new state to keep the user on the onboarding page
        window.history.pushState(null, '', '/onboarding');
      }
    };

    // Add history entry when user starts onboarding (step > 0)
    if (currentStep > 0) {
      window.history.pushState(null, '', '/onboarding');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep]);

  // Prevent navigation away from onboarding if user has progress
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const savedStep = localStorage.getItem('onboardingStep');
      if (savedStep && parseInt(savedStep, 10) > 0) {
        event.preventDefault();
        event.returnValue = 'You have unsaved progress in the onboarding. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const getGradeColor = (grade) => {
    if (!grade) return '#6B7280'; // Gray for N/A
    const upperGrade = grade.toUpperCase();
    if (upperGrade.startsWith('A')) return '#10B981'; // Green
    if (upperGrade.startsWith('B')) return '#F59E0B'; // Amber
    if (upperGrade.startsWith('C')) return '#F97316'; // Orange
    if (upperGrade.startsWith('D')) return '#EF4444'; // Red
    if (upperGrade.startsWith('F')) return '#DC2626'; // Darker Red
    return '#6B7280';
  };

  useEffect(() => {
    if (user) {
      signOut().then(() => {
        localStorage.removeItem('onboardingData');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('onboardingStep');
        localStorage.removeItem('randomizedReferralOptions');
      }).catch((error) => {
        console.error('Error logging out for onboarding:', error);
      });
    }
  }, [user, signOut]);

  // Check if user is already authenticated and has a profile
  useEffect(() => {
    const checkAuthStatus = async () => {
      // If user is authenticated and has a profile, redirect to dashboard
      if (user && localStorage.getItem('userProfile')) {
        navigate('/dashboard');
        return;
      }
    };
    
    checkAuthStatus();
  }, [user, navigate]);

  // Cleanup function to clear onboarding data when component unmounts
  useEffect(() => {
    return () => {
      // Only clear data if user is not completing the onboarding
      // (completion is handled in the final button click)
      const isCompleting = localStorage.getItem('onboardingStep') === '7' && 
                          localStorage.getItem('onboardingData');
      const isNavigatingToRegistration = window.location.pathname === '/registration';
      const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';
      
      if (!isCompleting && !isNavigatingToRegistration && !onboardingComplete) {
        // Keep the data for a short time in case user navigates back
        setTimeout(() => {
          if (!window.location.pathname.includes('/onboarding') && 
              !window.location.pathname.includes('/registration')) {
            localStorage.removeItem('onboardingStep');
            localStorage.removeItem('onboardingData');
            localStorage.removeItem('randomizedReferralOptions');
          }
        }, 5000); // Clear after 5 seconds if not on onboarding or registration page
      }
    };
  }, []);

  const experienceOptions = [
    { value: 'beginner', label: 'Beginner', description: 'New to investing, learning the basics' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience, comfortable with basics' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced investor, familiar with complex strategies' },
  ];

  const riskOptions = [
    { value: 'conservative', label: 'Conservative', description: 'Preserve capital, low risk tolerance' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced approach, moderate risk' },
    { value: 'aggressive', label: 'Aggressive', description: 'Growth-focused, high risk tolerance' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedFormData);
    
    // Save form data to localStorage on every change
    const dataToSave = {
      ...updatedFormData,
      // Don't save file-related data as it can't be serialized
      screenshotFile: null,
      screenshotPreview: null,
      portfolioAnalysis: null,
      analysisLoading: false,
    };
    localStorage.setItem('onboardingData', JSON.stringify(dataToSave));
  };

  const handleInterestChange = (interest) => {
    setFormData(prevData => {
      const isChecked = prevData.interests.includes(interest);
      const updatedData = isChecked ? {
        ...prevData,
        interests: prevData.interests.filter(item => item !== interest)
      } : {
        ...prevData,
        interests: [...prevData.interests, interest]
      };
      
      // Save form data to localStorage on every change
      const dataToSave = {
        ...updatedData,
        // Don't save file-related data as it can't be serialized
        screenshotFile: null,
        screenshotPreview: null,
        portfolioAnalysis: null,
        analysisLoading: false,
      };
      localStorage.setItem('onboardingData', JSON.stringify(dataToSave));
      
      return updatedData;
    });
  };

  const saveReferralSource = async () => {
    try {
      await addDoc(collection(db, 'referral_sources'), {
        source: formData.referralSource,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        ipAddress: 'anonymous'
      });
    } catch (error) {
      console.error('Error saving referral source:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        screenshotFile: file,
        screenshotPreview: URL.createObjectURL(file)
      });
    }
  };

  const analyzeScreenshot = async () => {
    if (!formData.screenshotFile) return;

    setFormData(prev => ({ ...prev, analysisLoading: true }));
    
    try {
      console.log('=== ANALYZE SCREENSHOT START ===');
      console.log('Current user state:', user);
      console.log('Form data userId:', formData.userId);
      console.log('User from context:', user?.uid);
      
      const screenshotFormData = new FormData();
      screenshotFormData.append('screenshot', formData.screenshotFile);
      
      // Debug logging
      console.log('File being uploaded:', {
        name: formData.screenshotFile.name,
        type: formData.screenshotFile.type,
        size: formData.screenshotFile.size
      });
      console.log('FormData entries:');
      for (let [key, value] of screenshotFormData.entries()) {
        console.log(key, value);
      }
      
      let recognitionResponse;
      try {
        recognitionResponse = await fetch('http://localhost:3001/api/batch-screenshot', {
          method: 'POST',
          body: screenshotFormData,
        });
      } catch (error) {
        try {
          recognitionResponse = await fetch('/api/batch-screenshot', {
            method: 'POST',
            body: screenshotFormData,
          });
        } catch (prodErr) {
          console.log('Production URL failed, trying Vercel fallback...', prodErr);
          recognitionResponse = await fetch('https://flow-invest2-hpr3.vercel.app/api/batch-screenshot', {
            method: 'POST',
            body: screenshotFormData,
          });
        }
      }
      if (!recognitionResponse.ok) {
        const errorText = await recognitionResponse.text();
        console.log('Server response status:', recognitionResponse.status);
        console.log('Server response headers:', recognitionResponse.headers);
        console.log('Server response text:', errorText);
        
        let errorMessage = `Failed to recognize screenshot: ${recognitionResponse.status}`;
        
        // Check if response is HTML (error page)
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html>')) {
          errorMessage = 'Server error - received HTML response instead of JSON';
        } else {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // If JSON parsing fails, use the raw error text
            errorMessage = errorText || errorMessage;
          }
        }
        
        throw new Error(errorMessage);
      }
      const recognitionJson = await recognitionResponse.json();
      let recognizedInvestments = recognitionJson.data || [];
      if (recognizedInvestments && !Array.isArray(recognizedInvestments)) {
        recognizedInvestments = [recognizedInvestments];
      }
      if (!Array.isArray(recognizedInvestments) || recognizedInvestments.length === 0) {
        setFormData(prev => ({ ...prev, analysisLoading: false }));
        alert('No investments could be recognized from your screenshot. Please try another image.');
        return;
      }
      if (Array.isArray(recognizedInvestments) && recognizedInvestments.length > 0) {
        const userId = formData.userId || (typeof user !== 'undefined' && user ? user.uid : null);
        console.log('Processing investments. User ID:', userId);
        console.log('Investments to process:', recognizedInvestments);
        
        if (userId) {
          // User is authenticated, save to Firebase
          console.log('User authenticated, saving to Firebase');
          for (const inv of recognizedInvestments) {
            console.log('Saving investment to Firebase:', inv.name);
            const result = await saveInvestment(userId, inv);
            console.log('Save result for', inv.name, ':', result);
            if (result.error) {
              console.error('Error saving investment:', inv.name, result.error);
            }
          }
          localStorage.setItem('expectedInvestmentCount', recognizedInvestments.length.toString());
          console.log('Set expectedInvestmentCount to:', recognizedInvestments.length);
        } else {
          // User not authenticated yet, save to localStorage for later
          console.log('User not authenticated, saving to localStorage for registration');
          const existingInvestments = JSON.parse(localStorage.getItem('onboardingInvestments') || '[]');
          const updatedInvestments = [...existingInvestments, ...recognizedInvestments];
          localStorage.setItem('onboardingInvestments', JSON.stringify(updatedInvestments));
          localStorage.setItem('expectedInvestmentCount', updatedInvestments.length.toString());
          console.log('Saved investments to localStorage:', updatedInvestments.length);
        }
      }
      const previewFormData = new FormData();
      previewFormData.append('investments', JSON.stringify(recognizedInvestments));
      previewFormData.append('userProfile', JSON.stringify({
        experience: formData.experience,
        riskTolerance: formData.riskTolerance,
        interests: formData.interests,
        primaryGoal: formData.primaryGoal
      }));
      previewFormData.append('preview', 'true');
      let previewAnalysis;
      try {
        previewAnalysis = await fetch('http://localhost:3001/api/analyze-portfolio', {
          method: 'POST',
          body: previewFormData,
        });
      } catch (error) {
        try {
          previewAnalysis = await fetch('/api/analyze-portfolio', {
            method: 'POST',
            body: previewFormData,
          });
        } catch (prodErr) {
          console.log('Production URL failed, trying Vercel fallback...', prodErr);
          previewAnalysis = await fetch('https://flow-invest2-hpr3.vercel.app/api/analyze-portfolio', {
            method: 'POST',
            body: previewFormData,
          });
        }
      }
      if (previewAnalysis.ok) {
        const previewData = await previewAnalysis.json();
        setFormData(prev => ({ 
          ...prev, 
          portfolioAnalysis: {
            ...previewData,
            investments: recognizedInvestments
          },
          analysisLoading: false 
        }));
      } else {
        const errorText = await previewAnalysis.text();
        throw new Error(`Failed to get preview analysis: ${previewAnalysis.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error analyzing screenshot:', error);
      setFormData(prev => ({ ...prev, analysisLoading: false }));
      
      // Show user-friendly error message
      let errorMessage = 'Failed to analyze screenshot. Please try again.';
      
      if (error.message.includes('File too large')) {
        errorMessage = 'Image file is too large. Please upload a smaller image (under 10MB).';
      } else if (error.message.includes('Only image files are allowed')) {
        errorMessage = 'Please upload an image file (JPEG, PNG, etc.).';
      } else if (error.message.includes('Unexpected end of form')) {
        errorMessage = 'Upload was interrupted. Please try again with a smaller image.';
      } else if (error.message.includes('No valid investments found')) {
        errorMessage = 'No investments could be recognized from your screenshot. Please try another image.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0 && !formData.name) {
      alert('Please enter your name.');
      return;
    }
    if (currentStep === 1 && !formData.experience) {
      alert('Please select your investment experience.');
      return;
    }
    if (currentStep === 2 && !formData.riskTolerance) {
      alert('Please select your risk tolerance.');
      return;
    }
    if (currentStep === 3 && !formData.referralSource) {
      alert('Please select how you heard about us.');
      return;
    }
    if (currentStep === 4 && formData.interests.length === 0) {
      alert('Please select at least one interest.');
      return;
    }
    if (currentStep === 6 && !formData.primaryGoal.trim()) {
      alert('Please enter your investment goals.');
      return;
    }
    if (currentStep === 2) {
      await saveReferralSource();
    }

    // Save form data to localStorage before moving to next step
    const dataToSave = {
      ...formData,
      // Don't save file-related data as it can't be serialized
      screenshotFile: null,
      screenshotPreview: null,
      portfolioAnalysis: null,
      analysisLoading: false,
    };
    
    console.log('Saving onboarding data to localStorage:', {
      dataToSave,
      hasExperience: !!dataToSave.experience,
      hasRiskTolerance: !!dataToSave.riskTolerance,
      hasInterests: !!dataToSave.interests,
      hasPrimaryGoal: !!dataToSave.primaryGoal
    });
    
    localStorage.setItem('onboardingData', JSON.stringify(dataToSave));

    const newStep = currentStep + 1;
    setCurrentStep(newStep);
    localStorage.setItem('onboardingStep', newStep.toString());
    
    // Update browser history for the new step
    window.history.pushState(null, '', '/onboarding');
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      localStorage.setItem('onboardingStep', newStep.toString());
      
      // Update browser history to reflect the step change
      if (newStep === 0) {
        // If going back to first step, replace the current history entry
        window.history.replaceState(null, '', '/onboarding');
      } else {
        // Push a new state for other steps
        window.history.pushState(null, '', '/onboarding');
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>
              What's your name?
            </Typography>
            <TextField
              fullWidth
              name="name"
              label="Your Name"
              value={formData.name}
              onChange={handleInputChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: '#9CA3AF' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 4,
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
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>
              Your Investment Experience
            </Typography>
            <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
              <RadioGroup
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
              >
                {experienceOptions.map((option) => (
                  <Paper
                    key={option.value}
                    sx={{
                      mb: 2,
                      p: 2,
                      backgroundColor: formData.experience === option.value ? '#F3EBFF' : '#ffffff',
                      border: '1px solid',
                      borderColor: formData.experience === option.value ? '#8B5CF6' : '#E5E7EB',
                      borderRadius: '12px',
                      boxShadow: formData.experience === option.value ? '0 4px 12px rgba(139, 92, 246, 0.1)' : 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: '#8B5CF6',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.05)'
                      }
                    }}
                  >
                    <FormControlLabel
                      value={option.value}
                      control={<Radio sx={{ color: '#8B5CF6', '&.Mui-checked': { color: '#8B5CF6' } }} />}
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                            {option.label}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            {option.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>
              What's your risk tolerance?
            </Typography>
            <Box sx={{ mt: 2 }}>
              {riskOptions.map((option) => (
                <Paper
                  key={option.value}
                  sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: formData.riskTolerance === option.value ? '#F3EBFF' : '#ffffff',
                    border: '1px solid',
                    borderColor: formData.riskTolerance === option.value ? '#8B5CF6' : '#E5E7EB',
                    borderRadius: '12px',
                    boxShadow: formData.riskTolerance === option.value ? '0 4px 12px rgba(139, 92, 246, 0.1)' : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#8B5CF6',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.05)'
                    }
                  }}
                >
                  <FormControlLabel
                    control={
                      <Radio
                        checked={formData.riskTolerance === option.value}
                        onChange={(e) => handleInputChange(e)}
                        name="riskTolerance"
                        value={option.value}
                        sx={{ color: '#8B5CF6', '&.Mui-checked': { color: '#8B5CF6' } }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                          {option.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          {option.description}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Paper>
              ))}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>
              How did you hear about us?
            </Typography>
            <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
              <RadioGroup
                name="referralSource"
                value={formData.referralSource}
                onChange={handleInputChange}
              >
                {randomizedReferralOptions.map((option) => (
                  <Paper
                    key={option.value}
                    sx={{
                      mb: 2,
                      p: 2,
                      backgroundColor: formData.referralSource === option.value ? '#F3EBFF' : '#ffffff',
                      border: '1px solid',
                      borderColor: formData.referralSource === option.value ? '#8B5CF6' : '#E5E7EB',
                      borderRadius: '12px',
                      boxShadow: formData.referralSource === option.value ? '0 4px 12px rgba(139, 92, 246, 0.1)' : 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: '#8B5CF6',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.05)'
                      }
                    }}
                  >
                    <FormControlLabel
                      value={option.value}
                      control={<Radio sx={{ color: '#8B5CF6', '&.Mui-checked': { color: '#8B5CF6' } }} />}
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                            {option.label}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>
                            {option.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>
            {formData.referralSource === 'other' && (
              <TextField
                fullWidth
                label="Please specify"
                name="referralOther"
                value={formData.referralOther}
                onChange={handleInputChange}
                variant="outlined"
                sx={{
                  mt: 2,
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
            )}
            <FormHelperText sx={{ color: '#6B7280', mt: 1 }}>
              This helps us improve our marketing and reach more investors.
            </FormHelperText>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>
              Investment Interests
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 4 }}>
              Select all that apply.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
              {interestOptions.map((interest) => (
                <Paper
                  key={interest}
                  sx={{
                    p: 2,
                    backgroundColor: formData.interests.includes(interest) ? '#F3EBFF' : '#ffffff',
                    border: '1px solid',
                    borderColor: formData.interests.includes(interest) ? '#8B5CF6' : '#E5E7EB',
                    borderRadius: '12px',
                    boxShadow: formData.interests.includes(interest) ? '0 4px 12px rgba(139, 92, 246, 0.1)' : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#8B5CF6',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.05)'
                    }
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.interests.includes(interest)}
                        onChange={() => handleInterestChange(interest)}
                        name={interest}
                        sx={{ color: '#8B5CF6', '&.Mui-checked': { color: '#8B5CF6' } }}
                      />
                    }
                    label={
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                        {interest}
                      </Typography>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Paper>
              ))}
            </Box>
          </Box>
        );

      case 5:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1F2937', mb: 2 }}>
              What you'll get with FlowInvest
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 1.5,
                mb: 1,
              }}
            >
              {benefits.map((benefit, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 1.5,
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                >
                  {benefit.icon}
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937', mt: 0.5, mb: 0.25 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280', lineHeight: 1.3 }}>
                    {benefit.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        );

      case 6:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>
              Your Investment Goals
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 4 }}>
              Tell us what you hope to achieve with your investments.
            </Typography>
            <TextField
              fullWidth
              label="e.g., Save for retirement, build passive income..."
              name="primaryGoal"
              value={formData.primaryGoal}
              onChange={handleInputChange}
              multiline
              rows={4}
              variant="outlined"
              sx={{
                mb: 4,
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
              required
            />
          </Box>
        );

      case 7:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>
              Analyze Your Portfolio
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 4 }}>
              Upload a screenshot of your current investment portfolio for a quick analysis. Take it straight from your broker like Robinhood, eToro, Trading 212, TradeRepublic, etc.
            </Typography>
            
            {!formData.screenshotFile ? (
              <Box
                sx={{
                  border: '2px dashed #D1D5DB',
                  borderRadius: '12px',
                  p: 4,
                  textAlign: 'center',
                  mb: 4,
                  backgroundColor: '#F9FAFB',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: '#8B5CF6',
                    backgroundColor: '#F3EBFF'
                  }
                }}
                onClick={() => document.getElementById('screenshot-upload').click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: '#8B5CF6', mb: 2 }} />
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937', mb: 1 }}>
                  Upload Portfolio Screenshot
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Click to select an image from your device.
                </Typography>
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </Box>
            ) : (!formData.analysisLoading && !formData.portfolioAnalysis) ? (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <img
                    src={formData.screenshotPreview}
                    alt="Portfolio Screenshot"
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB'
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        screenshotFile: null,
                        screenshotPreview: null,
                        portfolioAnalysis: null
                      }));
                    }}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      minWidth: 'auto',
                      p: '4px 8px',
                      backgroundColor: '#6B7280',
                      color: '#ffffff',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: '#4B5563'
                      }
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            ) : null}

            {formData.portfolioAnalysis && (
              <Paper sx={{ p: 3, backgroundColor: '#F9FAFB', borderRadius: '12px', mb: 4, border: '1px solid #E5E7EB' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937', mb: 2 }}>
                  Analysis Preview
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: getGradeColor(formData.portfolioAnalysis.grade),
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '20px'
                    }}
                  >
                    {formData.portfolioAnalysis.grade}
                  </Box>
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                      Grade: {formData.portfolioAnalysis.grade}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '8px',
                    p: 1,
                    minWidth: 60
                  }}>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                      Risk
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: formData.portfolioAnalysis.riskScore >= 7 ? '#DC2626' : 
                             formData.portfolioAnalysis.riskScore >= 5 ? '#F59E0B' : '#10B981',
                      fontWeight: 700 
                    }}>
                      {(() => {
                        const score = Number(formData.portfolioAnalysis.riskScore);
                        return !isNaN(score) && score > 0 ? `${Math.round(score)}/10` : 'N/A';
                      })()}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ color: '#374151', mb: 2 }}>
                  {(() => {
                    const text = formData.portfolioAnalysis.analysis;
                    // Remove bullet points, dashes, and other list markers
                    const cleanText = text.replace(/^[\s•\-*]+/, '').replace(/\n[\s•\-*]+/g, '\n');
                    // Split into sentences and take first 3
                    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
                    const firstThreeSentences = sentences.slice(0, 3);
                    const preview = firstThreeSentences.join('. ') + (sentences.length > 3 ? '...' : '');
                    return preview;
                  })()}
                </Typography>
                
                <Typography variant="body2" sx={{ color: '#6B7280', fontStyle: 'italic', mb: 2 }}>
                  Risk Level: {formData.portfolioAnalysis.riskScore >= 7 ? 'High' : 
                              formData.portfolioAnalysis.riskScore >= 5 ? 'Moderate' : 'Low'} 
                  ({Math.round(formData.portfolioAnalysis.riskScore)}/10)
                </Typography>
                
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: '#E0E7FF', 
                  borderRadius: '8px',
                  border: '1px solid #C7D2FE'
                }}>
                  <Typography variant="body2" sx={{ color: '#4338CA', fontStyle: 'italic' }}>
                    💡 This is a preview. Sign up to see the complete analysis.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4338CA', fontStyle: 'italic', mt: 1, fontSize: '0.875rem' }}>
                    Note: The full analysis may differ from this preview as it will be based on your complete profile and saved investments.
                  </Typography>
                </Box>
              </Paper>
            )}
            {formData.analysisLoading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
                <CircularProgress size={40} sx={{ color: '#8B5CF6', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#8B5CF6', fontWeight: 600 }}>
                  Analyzing your screenshot...
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Container maxWidth="sm">
        <Paper sx={{
          p: { xs: 3, md: 4 },
          backgroundColor: '#F9FAFB',
          borderRadius: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
          overflow: 'hidden'
        }}>
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
              Welcome to FlowInvest
            </Typography>
            <Typography variant="body1" sx={{ color: '#6B7280' }}>
              Let's get to know you better to tailor your investment experience.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <Box
                key={index}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: currentStep >= index ? '#8B5CF6' : '#E5E7EB',
                  mx: '4px',
                  transition: 'background-color 0.3s ease'
                }}
              />
            ))}
          </Box>

          {renderStep()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            {currentStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 2,
                  py: 1,
                  fontWeight: 600,
                  color: '#6B7280',
                  borderColor: '#D1D5DB',
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                    borderColor: '#9CA3AF'
                  },
                }}
              >
                Back
              </Button>
            )}
            
            {currentStep === 7 && formData.screenshotFile && !formData.portfolioAnalysis ? (
              <Button
                variant="contained"
                onClick={analyzeScreenshot}
                disabled={formData.analysisLoading}
                startIcon={!formData.analysisLoading ? <AnalyticsIcon /> : null}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 2,
                  py: 1,
                  fontWeight: 600,
                  backgroundColor: '#8B5CF6',
                  color: '#ffffff',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    boxShadow: 'none'
                  },
                  '&:disabled': {
                    backgroundColor: '#E5E7EB',
                    color: '#9CA3AF'
                  },
                  ml: currentStep > 0 ? 'auto' : 0
                }}
              >
                {formData.analysisLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Analyze Portfolio'}
              </Button>
            ) : currentStep === 7 && formData.portfolioAnalysis ? (
              <Button
                variant="contained"
                onClick={() => {
                  setLoading(true);
                  try {
                    console.log('Final onboarding step - formData being saved:', {
                      formData,
                      experience: formData.experience,
                      riskTolerance: formData.riskTolerance,
                      interests: formData.interests,
                      primaryGoal: formData.primaryGoal,
                      name: formData.name
                    });
                    
                    localStorage.setItem('onboardingData', JSON.stringify(formData));
                    console.log('onboardingData saved to localStorage');
                    
                    // Set a flag to prevent cleanup from clearing the data
                    localStorage.setItem('onboardingComplete', 'true');
                    
                    // Clear onboarding step since user is completing the flow
                    localStorage.removeItem('onboardingStep');
                    localStorage.removeItem('randomizedReferralOptions');
                    navigate('/registration');
                  } catch (error) {
                    console.error('Error saving profile:', error);
                    setLoading(false);
                  }
                }}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 2,
                  py: 1,
                  fontWeight: 600,
                  backgroundColor: '#8B5CF6',
                  color: '#ffffff',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    boxShadow: 'none'
                  },
                  '&:disabled': {
                    backgroundColor: '#E5E7EB',
                    color: '#9CA3AF'
                  },
                  ml: currentStep > 0 ? 'auto' : 0
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Sign up to see analysis'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 2,
                  py: 1,
                  fontWeight: 600,
                  backgroundColor: '#8B5CF6',
                  color: '#ffffff',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    boxShadow: 'none'
                  },
                  '&:disabled': {
                    backgroundColor: '#E5E7EB',
                    color: '#9CA3AF'
                  },
                  ml: currentStep > 0 ? 'auto' : 0
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Next'}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding;

