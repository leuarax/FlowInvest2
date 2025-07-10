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
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { interestOptions } from '../utils/constants';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../utils/firebase';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { saveInvestment } from '../utils/firebase';

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
    interests: [],
    primaryGoal: '',
    screenshotFile: null,
    screenshotPreview: null,
    portfolioAnalysis: null,
    analysisLoading: false,
  });



  const getGradeGradient = (grade) => {
    if (!grade) return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
    const upperGrade = grade.toUpperCase();
    if (upperGrade.startsWith('A')) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (upperGrade.startsWith('B')) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    if (upperGrade.startsWith('C')) return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
    if (upperGrade.startsWith('D')) return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    if (upperGrade.startsWith('F')) return 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
    return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
  };

  // Check if user is already logged in and log them out
  useEffect(() => {
    if (user) {
      console.log('User is already logged in, logging out for onboarding');
      signOut().then(() => {
        // Clear any existing onboarding data
        localStorage.removeItem('onboardingData');
        localStorage.removeItem('userProfile');
        console.log('User logged out for onboarding');
      }).catch((error) => {
        console.error('Error logging out for onboarding:', error);
      });
    }
  }, [user, signOut]);

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

  const referralOptions = [
    { value: 'social_media', label: 'Social Media' },
    { value: 'friend_recommendation', label: 'Friend Recommendation' },
    { value: 'online_ad', label: 'Online Advertisement' },
    { value: 'search_engine', label: 'Search Engine' },
    { value: 'blog_article', label: 'Blog/Article' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'other', label: 'Other' },
  ];

  const benefits = [
    {
      title: "Smart Portfolio Analysis",
      description: "Get AI-powered insights into your investment portfolio with detailed risk assessment and performance analysis.",
      icon: "📊"
    },
    {
      title: "Personalized Investment Strategy",
      description: "Receive tailored investment recommendations based on your risk tolerance, goals, and market conditions.",
      icon: "🎯"
    },
    {
      title: "Portfolio Stress Test with Scenarios",
      description: "Test your portfolio against various market scenarios to understand potential risks and prepare for different economic conditions.",
      icon: "🧪"
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const saveReferralSource = async () => {
    try {
      console.log('Saving referral source to Firebase:', formData.referralSource);
      await addDoc(collection(db, 'referral_sources'), {
        source: formData.referralSource,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        ipAddress: 'anonymous' // We don't collect IP for privacy
      });
      console.log('Referral source saved successfully');
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
      // 1. Upload the screenshot to /api/screenshot to extract investments
      const screenshotFormData = new FormData();
      console.log('screenshotFile:', formData.screenshotFile); // Debug log to check file before sending
      screenshotFormData.append('screenshot', formData.screenshotFile); // Field name must be 'screenshot'
      let recognitionResponse;
      try {
        recognitionResponse = await fetch('http://localhost:3001/api/batch-screenshot', {
          method: 'POST',
          body: screenshotFormData,
        });
      } catch (error) {
        console.log('Local server failed for batch-screenshot, trying fallback endpoint...', error);
        recognitionResponse = await fetch('/api/batch-screenshot', {
          method: 'POST',
          body: screenshotFormData,
        });
      }
      if (!recognitionResponse.ok) {
        const errorText = await recognitionResponse.text();
        console.error('Screenshot recognition failed:', recognitionResponse.status, errorText);
        throw new Error(`Failed to recognize screenshot: ${recognitionResponse.status} - ${errorText}`);
      }
      const recognitionJson = await recognitionResponse.json();
      let recognizedInvestments = recognitionJson.data || [];
      // Normalize to array (like in normal portfolio analysis)
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
        if (userId) {
          for (const inv of recognizedInvestments) {
            await saveInvestment(userId, inv);
          }
        }
      }
      // 3. Call /api/analyze-portfolio with the recognized investments and preview=true
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
        console.log('Local server failed for analyze-portfolio, trying fallback endpoint...', error);
        previewAnalysis = await fetch('/api/analyze-portfolio', {
          method: 'POST',
          body: previewFormData,
        });
      }
      if (previewAnalysis.ok) {
        const previewData = await previewAnalysis.json();
        setFormData(prev => ({ 
          ...prev, 
          portfolioAnalysis: {
            ...previewData,
            investments: recognizedInvestments // Save the investments for later use
          },
          analysisLoading: false 
        }));
      } else {
        const errorText = await previewAnalysis.text();
        console.error('Preview analysis failed:', previewAnalysis.status, errorText);
        throw new Error(`Failed to get preview analysis: ${previewAnalysis.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error analyzing screenshot:', error);
      setFormData(prev => ({ ...prev, analysisLoading: false }));
    }
  };

  const handleNext = async () => {
    console.log('handleNext called, currentStep:', currentStep, 'formData:', formData);
    
    // Validate current step before proceeding
    if (currentStep === 0 && !formData.name) {
      console.log('Step 0 validation failed: no name');
      return;
    }
    if (currentStep === 1 && !formData.experience) {
      console.log('Step 1 validation failed: no experience');
      return;
    }
    if (currentStep === 2 && !formData.riskTolerance) {
      console.log('Step 2 validation failed: no risk tolerance');
      return;
    }
    if (currentStep === 3 && !formData.referralSource) {
      console.log('Step 3 validation failed: no referral source');
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
    // Save referral source after risk tolerance (step 2)
    if (currentStep === 2) {
      console.log('Saving referral source...');
      await saveReferralSource();
    }

    console.log('Moving to next step:', currentStep + 1);
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Tell us about yourself
            </Typography>
            <TextField
              fullWidth
              name="name"
              label="What's your name?"
              value={formData.name}
              onChange={handleInputChange}
              variant="outlined"
              sx={{
                mb: 4,
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
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
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
                      background: formData.experience === option.value ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid',
                      borderColor: formData.experience === option.value ? '#667eea' : 'rgba(255,255,255,0.3)',
                      borderRadius: '16px',
                      boxShadow: formData.experience === option.value ? '0 8px 25px rgba(102, 126, 234, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
                      }
                    }}
                  >
                    <FormControlLabel
                      value={option.value}
                      control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />}
                      label={
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {option.label}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
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
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              What's your risk tolerance?
            </Typography>
            <Box sx={{ mt: 2 }}>
              {riskOptions.map((option) => (
                <Paper
                  key={option.value}
                  sx={{
                    mb: 2,
                    p: 2,
                    background: formData.riskTolerance === option.value ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: formData.riskTolerance === option.value ? '#667eea' : 'rgba(255,255,255,0.3)',
                    borderRadius: '16px',
                    boxShadow: formData.riskTolerance === option.value ? '0 8px 25px rgba(102, 126, 234, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
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
                        sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {option.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
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
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              How did you hear about FlowInvest?
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
              Help us understand how to reach more investors like you.
            </Typography>
            <FormControl fullWidth sx={{ mb: 4 }}>
              <Select
                name="referralSource"
                value={formData.referralSource}
                onChange={handleInputChange}
                displayEmpty
                sx={{
                  borderRadius: '12px',
                  background: 'rgba(248, 250, 252, 0.8)',
                  '&:hover fieldset': {
                    borderColor: '#667eea'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea'
                  }
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select how you heard about us</em>
                </MenuItem>
                {referralOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>This helps us improve our marketing and reach more investors</FormHelperText>
            </FormControl>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Investment Interests
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
              What interests you? (Select all that apply)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
              {interestOptions.map((interest) => (
                <Paper
                  key={interest}
                  sx={{
                    p: 2,
                    background: formData.interests.includes(interest) ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: formData.interests.includes(interest) ? '#667eea' : 'rgba(255,255,255,0.3)',
                    borderRadius: '16px',
                    boxShadow: formData.interests.includes(interest) ? '0 8px 25px rgba(102, 126, 234, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
                    }
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.interests.includes(interest)}
                        onChange={(e) => {
                          setFormData(prevData => {
                            const isChecked = e.target.checked;
                            if (isChecked) {
                              return {
                                ...prevData,
                                interests: [...prevData.interests, interest]
                              };
                            } else {
                              return {
                                ...prevData,
                                interests: prevData.interests.filter(item => item !== interest)
                              };
                            }
                          });
                        }}
                        name={interest}
                        sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }}
                      />
                    }
                    label={
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
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
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              What you'll get with FlowInvest
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
              Here's what you can expect from your personalized investment experience:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              {benefits.map((benefit, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" sx={{ mr: 2 }}>
                      {benefit.icon}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {benefit.title}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#64748b' }}>
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
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Investment Goals
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
              Tell us about your investment goals and what you hope to achieve.
            </Typography>
            <TextField
              fullWidth
              label="Your investing goals"
              name="primaryGoal"
              value={formData.primaryGoal}
              onChange={handleInputChange}
              multiline
              rows={4}
              placeholder="e.g., Save for retirement, build passive income, grow wealth for children's education..."
              sx={{
                mb: 4,
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
              required
            />
          </Box>
        );

      case 7:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
              Let's analyze your portfolio
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
              Upload a screenshot of your current investment portfolio to get a quick analysis.
            </Typography>
            
            {!formData.screenshotFile ? (
              <Box
                sx={{
                  border: '2px dashed #667eea',
                  borderRadius: '16px',
                  p: 4,
                  textAlign: 'center',
                  mb: 4,
                  background: 'rgba(102, 126, 234, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderColor: '#5a67d8'
                  }
                }}
                onClick={() => document.getElementById('screenshot-upload').click()}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#1e293b', mb: 1 }}>
                  Upload Portfolio Screenshot
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Click to select a screenshot from your investment app or broker
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
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                  <Button
                    variant="outlined"
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
                      p: 1,
                      background: 'rgba(255,255,255,0.9)',
                      '&:hover': {
                        background: 'rgba(255,255,255,1)'
                      }
                    }}
                  >
                    ✕
                  </Button>
                </Box>
              </Box>
            ) : null}

            {formData.portfolioAnalysis && (
              <Paper sx={{ p: 3, background: 'rgba(102, 126, 234, 0.05)', borderRadius: '16px', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                  Portfolio Analysis Preview
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: getGradeGradient(formData.portfolioAnalysis.grade),
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '24px'
                    }}
                  >
                    {formData.portfolioAnalysis.grade}
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      Grade: {formData.portfolioAnalysis.grade}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Risk Score: {formData.portfolioAnalysis.riskScore !== undefined && formData.portfolioAnalysis.riskScore !== null ? formData.portfolioAnalysis.riskScore : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                  {formData.portfolioAnalysis.analysis}
                </Typography>
                
                <Box sx={{ 
                  p: 2, 
                  background: 'rgba(255,255,255,0.8)', 
                  borderRadius: '12px',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                    💡 This is just a preview. Sign up to see the complete analysis.
                  </Typography>
                </Box>
              </Paper>
            )}
            {formData.analysisLoading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
                <CircularProgress size={48} sx={{ color: '#667eea', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#667eea', fontWeight: 600 }}>
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Container maxWidth="md">
        <Paper sx={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '24px',
          p: { xs: 3, md: 5 },
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                mb: 1,
              }}
            >
              FlowInvest
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Let's get to know you better to tailor your investment experience.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <Box
                key={index}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: currentStep >= index ? '#667eea' : '#cbd5e1',
                  mx: 1,
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
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  color: '#667eea',
                  borderColor: '#667eea',
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderColor: '#5a67d8'
                  },
                  transition: 'all 0.3s ease'
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
                startIcon={formData.analysisLoading ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                  },
                  '&:disabled': {
                    background: 'rgba(100, 116, 139, 0.3)',
                    color: 'rgba(255,255,255,0.7)'
                  },
                  transition: 'all 0.3s ease',
                  ml: currentStep > 0 ? 'auto' : 0
                }}
              >
                {formData.analysisLoading ? 'Analyzing...' : 'Analyze Portfolio'}
              </Button>
            ) : currentStep === 7 && formData.portfolioAnalysis ? (
              <Button
                variant="contained"
                onClick={() => {
                  setLoading(true);
                  try {
                    localStorage.setItem('onboardingData', JSON.stringify(formData));
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
                  px: 2.5,
                  py: 1.5,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                  },
                  '&:disabled': {
                    background: 'rgba(100, 116, 139, 0.3)',
                    color: 'rgba(255,255,255,0.7)'
                  },
                  transition: 'all 0.3s ease',
                  ml: currentStep > 0 ? 'auto' : 0
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign up to see analysis'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                  },
                  '&:disabled': {
                    background: 'rgba(100, 116, 139, 0.3)',
                    color: 'rgba(255,255,255,0.7)'
                  },
                  transition: 'all 0.3s ease',
                  ml: currentStep > 0 ? 'auto' : 0
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Next'}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding;