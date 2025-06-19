import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';
import { Container, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Grid, Paper, CircularProgress, ToggleButton, ToggleButtonGroup, Card, CardMedia } from '@mui/material';
import { getInvestmentAnalysis } from '../utils/openai';
import { interestOptions } from '../utils/constants';

const investmentTypes = interestOptions.map(option => ({
  value: option,
  label: option,
}));

const holdingTimeOptions = [
  { value: 'Short-term', label: 'Short-term (1-3 years)' },
  { value: 'Mid-term', label: 'Mid-term (3-7 years)' },
  { value: 'Long-term', label: 'Long-term (7+ years)' },
];

const getGradeColor = (grade) => {
  if (!grade) return 'text.secondary';
  const upperGrade = grade.toUpperCase();
  if (upperGrade.startsWith('A')) return 'success.main';
  if (upperGrade.startsWith('B')) return 'warning.light';
  if (upperGrade.startsWith('C')) return 'warning.main';
  if (upperGrade.startsWith('D')) return 'error.light';
  if (upperGrade.startsWith('F')) return 'error.main';
  return 'text.primary';
};

const InvestmentForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [inputMethod, setInputMethod] = useState('manual');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    amount: '',
    duration: '',
    date: '',
  });

  const handleSaveInvestment = () => {
    const investments = JSON.parse(localStorage.getItem('investments') || '[]');
    localStorage.setItem('investments', JSON.stringify([
      ...investments,
      { ...formData, ...analysis },
    ]));
    navigate('/dashboard');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview('');
  };

  const handleInputMethodChange = (event, newMethod) => {
    if (newMethod !== null) {
      setInputMethod(newMethod);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (inputMethod === 'manual' && (!formData.type || !formData.name || !formData.amount || !formData.duration || !formData.date)) {
      setError('Please fill in all required fields');
      return;
    }

    if (inputMethod === 'screenshot' && !screenshot) {
      setError('Please upload a screenshot');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile) {
        throw new Error('User profile not found. Please complete onboarding first.');
      }

      let analysis;
      
      if (inputMethod === 'screenshot') {
        const formData = new FormData();
        formData.append('screenshot', screenshot);
        formData.append('additionalNotes', additionalNotes);
        formData.append('userProfile', JSON.stringify(userProfile));
        
        const response = await fetch('/api/analyze-screenshot', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze screenshot');
        }
        
        analysis = await response.json();
      } else {
        analysis = await getInvestmentAnalysis(formData, userProfile);
      }
      
      setAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing investment:', error);
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message.includes('API key')) {
        errorMessage = 'Please enter your OpenAI API key in the browser prompt or set it in the .env file.';
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your key and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const containerStyles = isMobile ? { 
    width: '100%', 
    maxWidth: '100%',
    px: 2,
    mt: 2
  } : { 
    maxWidth: 'lg',
    mt: 4 
  };

  const paperStyles = isMobile ? {
    p: 2,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box'
  } : {
    p: 3,
    height: '100%'
  };

  return (
    <Container sx={containerStyles}>
      <Typography variant="h1" component="h1" sx={{ mb: 4 }}>
        FlowInvest
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              Investment Details
            </Typography>
            <Box sx={{ mb: 3 }}>
              <ToggleButtonGroup
                color="primary"
                value={inputMethod}
                exclusive
                onChange={handleInputMethodChange}
                aria-label="input method"
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton value="manual">Manual Input</ToggleButton>
                <ToggleButton value="screenshot">Upload Screenshot</ToggleButton>
              </ToggleButtonGroup>

              {inputMethod === 'screenshot' ? (
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="screenshot-upload"
                    type="file"
                    onChange={handleScreenshotUpload}
                    capture="environment"
                  />
                  <label htmlFor="screenshot-upload">
                    <Button
                      variant="contained"
                      component="span"
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {screenshot ? 'Change Screenshot' : 'Upload Screenshot'}
                    </Button>
                  </label>
                  
                  {screenshotPreview && (
                    <Box sx={{ mb: 2, position: 'relative' }}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="300"
                          image={screenshotPreview}
                          alt="Screenshot preview"
                          sx={{ objectFit: 'contain' }}
                        />
                      </Card>
                      <Button
                        size="small"
                        color="error"
                        onClick={removeScreenshot}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      >
                        Remove
                      </Button>
                    </Box>
                  )}
                  
                  <TextField
                    fullWidth
                    label="Additional Notes (Optional)"
                    multiline
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder="Add any additional information about this investment..."
                  />

                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading || !screenshot}
                    sx={{
                      mt: 2,
                      width: '100%',
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Analyze Screenshot'}
                  </Button>
                </Box>
              ) : (
                <form onSubmit={handleSubmit}>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Investment Type</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={handleInputChange}
                      name="type"
                      label="Investment Type"
                      required
                    >
                      {investmentTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Investment Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    sx={{ mb: 3 }}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Investment Amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    type="number"
                    sx={{ mb: 3 }}
                    required
                  />
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Holding Time</InputLabel>
                    <Select
                      value={formData.duration}
                      onChange={handleInputChange}
                      name="duration"
                      label="Holding Time"
                      required
                    >
                      {holdingTimeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Investment Date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    type="date"
                    sx={{ mb: 3 }}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                  
                  {error && (
                    <Typography color="error" sx={{ mt: 2, mb: 2, p: 2, backgroundColor: 'error.light', borderRadius: 1 }}>
                      {error}
                    </Typography>
                  )}
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading || !formData.type || !formData.name || !formData.amount || !formData.duration || !formData.date}
                    sx={{
                      mt: 2,
                      width: '100%',
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Get AI Assessment'}
                  </Button>
                </form>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={paperStyles}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              AI Assessment
            </Typography>
            {analysis ? (
              <Box>
                <Box sx={{ 
                  textAlign: 'center', 
                  mb: 3,
                  overflow: 'hidden',
                  wordBreak: 'break-word'
                }}>
                  <Typography 
                    variant={isMobile ? 'h2' : 'h1'} 
                    component="div" 
                    sx={{ 
                      color: getGradeColor(analysis.grade), 
                      fontWeight: 'bold',
                      fontSize: isMobile ? '3rem' : '4rem',
                      lineHeight: 1.2
                    }}
                  >
                    {analysis.grade}
                  </Typography>
                  <Typography 
                    variant={isMobile ? 'subtitle2' : 'subtitle1'} 
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Overall Grade
                  </Typography>
                </Box>
                <Box sx={{ 
                  mb: 3,
                  '& .MuiTypography-root': {
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }
                }}>
                  <Typography 
                    variant={isMobile ? 'subtitle2' : 'h6'} 
                    sx={{ 
                      mb: 1,
                      fontWeight: isMobile ? 'bold' : 'normal'
                    }}
                  >
                    Risk Analysis
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1">
                      Risk Score: {analysis.riskScore}/10
                    </Typography>
                    <Box sx={{ 
                      width: '100%', 
                      mt: 1,
                      '& .MuiLinearProgress-root': {
                        height: isMobile ? 6 : 8
                      }
                    }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: 8,
                          backgroundColor: 'grey.200',
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: `${(analysis.riskScore / 10) * 100}%`,
                            height: '100%',
                            backgroundColor: analysis.riskScore > 5 ? 'error.main' : 'success.main',
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Return on Investment
                  </Typography>
                  <Typography variant="body1">
                    Estimated ROI: {analysis.roiEstimate}%
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    Analysis Explanation
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {analysis.explanation}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleSaveInvestment}
                    sx={{
                      mt: 3,
                    }}
                  >
                    Save Investment
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {inputMethod === 'screenshot' 
                  ? 'Upload a screenshot and click "Analyze Screenshot" to get started' 
                  : 'Fill in the form and click "Get AI Assessment" to analyze your investment'}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
              <TextField
                fullWidth
                label="Investment Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                sx={{ mb: 3 }}
                required
              />
              <TextField
                fullWidth
                label="Investment Amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                type="number"
                sx={{ mb: 3 }}
                required
              />
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Holding Time</InputLabel>
                <Select
                  value={formData.duration}
                  onChange={handleInputChange}
                  name="duration"
                  label="Holding Time"
                  required
                >
                  {holdingTimeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Investment Date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                type="date"
                sx={{ mb: 3 }}
                required
                InputLabelProps={{ shrink: true }}
              />
              {error && (
                <Typography color="error" sx={{ mt: 2, mb: 2, p: 2, backgroundColor: 'error.light', borderRadius: 1 }}>
                  {error}
                </Typography>
              )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading || !formData.type || !formData.name || !formData.amount || !formData.duration || !formData.date}
                    sx={{
                      mt: 2,
                      width: '100%',
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Get AI Assessment'}
                  </Button>
                </form>
              )}
              
              {inputMethod === 'screenshot' && (
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSubmit}
                  disabled={loading || !screenshot}
                  sx={{
                    mt: 2,
                    width: '100%',
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Analyze Screenshot'}
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={paperStyles}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              AI Assessment
            </Typography>
            {analysis ? (
              <Box>
                <Box sx={{ 
                  textAlign: 'center', 
                  mb: 3,
                  overflow: 'hidden',
                  wordBreak: 'break-word'
                }}>
                  <Typography 
                    variant={isMobile ? 'h2' : 'h1'} 
                    component="div" 
                    sx={{ 
                      color: getGradeColor(analysis.grade), 
                      fontWeight: 'bold',
                      fontSize: isMobile ? '3rem' : '4rem',
                      lineHeight: 1.2
                    }}
                  >
                    {analysis.grade}
                  </Typography>
                  <Typography 
                    variant={isMobile ? 'subtitle2' : 'subtitle1'} 
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Overall Grade
                  </Typography>
                </Box>
                <Box sx={{ 
                  mb: 3,
                  '& .MuiTypography-root': {
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }
                }}>
                  <Typography 
                    variant={isMobile ? 'subtitle2' : 'h6'} 
                    sx={{ 
                      mb: 1,
                      fontWeight: isMobile ? 'bold' : 'normal'
                    }}
                  >
                    Risk Analysis
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1">
                      Risk Score: {analysis.riskScore}/10
                    </Typography>
                    <Box sx={{ 
                      width: '100%', 
                      mt: 1,
                      '& .MuiLinearProgress-root': {
                        height: isMobile ? 6 : 8
                      }
                    }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: 8,
                          backgroundColor: 'grey.200',
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: `${(analysis.riskScore / 10) * 100}%`,
                            height: '100%',
                            backgroundColor: analysis.riskScore > 5 ? 'error.main' : 'success.main',
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Return on Investment
                  </Typography>
                  <Typography variant="body1">
                    Estimated ROI: {analysis.roiEstimate}%
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    Analysis Explanation
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {analysis.explanation}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleSaveInvestment}
                    sx={{
                      mt: 3,
                    }}
                  >
                    Save Investment
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Click "Get AI Assessment" to analyze your investment
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InvestmentForm;
