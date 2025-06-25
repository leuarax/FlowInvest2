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

  const [submitted, setSubmitted] = useState(false);

  const handleNext = () => {
    // --- FINAL STEP LOGIC ---
    if (currentStep === 3) {
      setSubmitted(true); // Set submitted to true to trigger validation UI

      if (formData.interests.length === 0) {
        alert('Please select at least one interest.');
        return; // Stop if interests are not selected
      }
      if (!formData.primaryGoal) {
        return; // Stop if goal is empty, UI will show error
      }
      
      // All validation passed, proceed to finish
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

    // --- INTERMEDIATE STEP LOGIC ---
    // No visual validation, just prevent moving forward silently
    if (currentStep === 0 && !formData.name) return;
    if (currentStep === 1 && !formData.experience) return;
    if (currentStep === 2 && !formData.riskTolerance) return;

    // If validation for intermediate step passed, move to next step
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setSubmitted(false); // Always reset validation state on going back
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom>
              Tell us about yourself
            </Typography>
            <TextField
              fullWidth
              name="name"
              label="What's your name?"
              value={formData.name}
              onChange={handleInputChange}
              sx={{ mb: 4 }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom>
              Your Investment Experience
            </Typography>
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <RadioGroup
                row
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
              >
                {experienceOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom>
              What's your risk tolerance?
            </Typography>
            <Box sx={{ mt: 2 }}>
              {riskOptions.map((option) => (
                <Box
                  key={option.value}
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Radio
                        checked={formData.riskTolerance === option.value}
                        onChange={(e) => handleInputChange(e)}
                        name="riskTolerance"
                        value={option.value}
                      />
                    }
                    label={option.label}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom>
              Investment Interests & Goals
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
              What interests you? (Select all that apply)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 4 }}>
              {interestOptions.map((interest) => (
                <Box
                  key={interest}
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
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
                      />
                    }
                    label={interest}
                  />
                </Box>
              ))}
            </Box>
            <TextField
              fullWidth
              label="Tell us everything about your investing (The more detail the better the results)"
              name="primaryGoal"
              value={formData.primaryGoal}
              onChange={handleInputChange}
              multiline
              rows={4}
              sx={{ mb: 4 }}
              required
              error={submitted && !formData.primaryGoal}
              helperText={submitted && !formData.primaryGoal ? 'This field is required.' : ''}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8, bgcolor: 'background.paper' }}>
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100px',
            bgcolor: 'primary.main',
            opacity: 0.1,
          }}
        />
      </Box>

      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            background: 'linear-gradient(45deg, #007AFF 30%, #3399FF 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          }}
        >
          FlowInvest
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          AI-Powered Investment Intelligence
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          {[0, 1, 2, 3].map((index) => (
            <Box
              key={index}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: currentStep >= index ? 'primary.main' : 'divider',
                mx: 1,
              }}
            />
          ))}
        </Box>
        <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          {renderStep()}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            {currentStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 4,
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
                borderRadius: 2,
                px: 4,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : currentStep === 3 ? 'Get Started' : 'Next'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Onboarding;
