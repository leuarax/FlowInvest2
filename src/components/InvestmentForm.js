import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useTheme } from '@mui/material/styles';
import { Container, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Grid, Paper, CircularProgress } from '@mui/material';
import { getInvestmentAnalysis } from '../utils/openai';

const investmentTypes = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'realEstate', label: 'Real Estate' },
  { value: 'esg', label: 'ESG Investments' },
];

const InvestmentForm = () => {
  const navigate = useNavigate();
// const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.name || !formData.amount || !formData.duration || !formData.date) {
      return;
    }

    setLoading(true);
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile) {
        throw new Error('User profile not found. Please complete onboarding first.');
      }

      const analysis = await getInvestmentAnalysis(formData, userProfile);
      setAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing investment:', error);
      if (error.message.includes('API key')) {
        alert('Please enter your OpenAI API key in the browser prompt or set it in the .env file.');
      } else if (error.message.includes('Invalid API key')) {
        alert('Invalid OpenAI API key. Please check your key and try again.');
      } else {
        alert(`Failed to analyze investment: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h1" component="h1" sx={{ mb: 4 }}>
        FlowInvest
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              Investment Details
            </Typography>
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
              <TextField
                fullWidth
                label="Duration (Years)"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                type="number"
                sx={{ mb: 3 }}
                required
              />
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
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !formData.type || !formData.name || !formData.amount || !formData.duration || !formData.date}
                sx={{
                  mt: 2,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Get AI Assessment'}
              </Button>
            </form>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
              AI Assessment
            </Typography>
            {analysis ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Risk Analysis
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1">
                    Risk Score: {analysis.riskScore}/10
                  </Typography>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        backgroundColor: theme.palette.grey[200],
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(analysis.riskScore / 10) * 100}%`,
                          height: '100%',
                          backgroundColor: analysis.riskScore > 5 ? theme.palette.error.main : theme.palette.success.main,
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
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {analysis.explanation}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSaveInvestment}
                  sx={{
                    mt: 3,
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  Save Investment
                </Button>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
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
