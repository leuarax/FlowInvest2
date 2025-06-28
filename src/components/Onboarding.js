import React, { useState } from 'react';
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
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { interestOptions } from '../utils/constants';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    experience: '',
    riskTolerance: '',
    interests: [],
    primaryGoal: '',
  });

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
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNext = () => {
    if (currentStep === 4) {
      if (formData.interests.length === 0) {
        alert('Please select at least one interest.');
        return;
      }
      if (!formData.primaryGoal.trim()) {
        alert('Please enter your investment goals.');
        return;
      }
      
      setLoading(true);
      try {
        localStorage.setItem('userProfile', JSON.stringify(formData));
        navigate('/dashboard');
      } catch (error) {
        console.error('Error saving profile:', error);
        setLoading(false);
      }
      return;
    }

    if (currentStep === 0 && !formData.name) return;
    if (currentStep === 1 && !formData.experience) return;
    if (currentStep === 2 && !formData.riskTolerance) return;
    if (currentStep === 3 && formData.interests.length === 0) {
      alert('Please select at least one interest.');
      return;
    }

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

      case 4:
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
            {[0, 1, 2, 3, 4].map((index) => (
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
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : currentStep === 4 ? 'Get Started' : 'Next'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Onboarding;