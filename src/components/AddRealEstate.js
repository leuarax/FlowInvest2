import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Grid, Paper, CircularProgress, Alert,
  Chip, Card, CardContent, Fade, useTheme, useMediaQuery
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SaveIcon from '@mui/icons-material/Save';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EuroIcon from '@mui/icons-material/Euro';
import Footer from './Footer';

const getGradeColor = (grade) => {
  if (!grade) return '#64748b';
  const upperGrade = grade.toUpperCase();
  if (upperGrade.startsWith('A')) return '#10b981';
  if (upperGrade.startsWith('B')) return '#f59e0b';
  if (upperGrade.startsWith('C')) return '#f97316';
  if (upperGrade.startsWith('D')) return '#ef4444';
  if (upperGrade.startsWith('F')) return '#dc2626';
  return '#64748b';
};

const AddRealEstate = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [form, setForm] = useState({
    country: '',
    city: '',
    street: '',
    objectType: '',
    sqm: '',
    yearOfConstruction: '',
    lastRenovation: '',
    netRent: '',
    apportionableCosts: '',
    nonApportionableCosts: '',
    vacancy: '',
    purchasePrice: '',
    marketPrice: '',
    residualDebt: '',
    interest: '',
    repaymentRate: '',
    interestFixation: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      let res;
      try {
        res = await fetch('http://localhost:3001/api/analyze-real-estate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } catch (err) {
        console.log('Local server failed, trying production URL...', err);
        res = await fetch('https://flowinvest2.vercel.app/api/analyze-real-estate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || `HTTP error! status: ${res.status}`);
      }
      const result = await res.json();
      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'An unknown error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvestment = () => {
    if (!analysis) return;
    const newInvestment = {
      id: Date.now(),
      name: `${form.objectType || 'Real Estate'} in ${form.city}`,
      type: 'Real Estate',
      ...form,
      amount: analysis.amount || form.purchasePrice || form.marketPrice || 0,
      grade: analysis.grade,
      riskScore: analysis.riskScore,
      riskExplanation: analysis.riskExplanation,
      roiEstimate: analysis.roiEstimate,
      roiScenarios: analysis.roiScenarios,
      explanation: analysis.explanation,
      cashflow: analysis.cashflow,
      cashflowAfterMortgage: analysis.cashflowAfterMortgage,
    };
    const investments = JSON.parse(localStorage.getItem('investments') || '[]');
    localStorage.setItem('investments', JSON.stringify([...investments, newInvestment]));
    navigate('/dashboard');
  };

  // Mobile-optimized field labels
  const getFieldLabel = (field, fullLabel, shortLabel) => {
    return isMobile ? shortLabel : fullLabel;
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pt: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Container maxWidth="lg" sx={{ flex: 1 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: 'white', 
              fontWeight: 700, 
              mb: 2,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            FlowInvest
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontWeight: 400,
              mb: 1
            }}
          >
            Add Real Estate Investment
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Enter your real estate details for comprehensive AI analysis
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ flex: 1, minHeight: 0 }}>
          {/* Left Side: Input Form */}
          <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ 
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '24px',
              p: 4,
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              flex: 1
            }}>
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HomeIcon sx={{ fontSize: 32, color: '#667eea', mr: 1 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Property Details
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Provide comprehensive information about your real estate investment
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Location Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                    📍 Location
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label="Country" 
                    name="country" 
                    value={form.country} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label={getFieldLabel('city', 'City (with ZipCode)', 'City + ZIP')} 
                    name="city" 
                    value={form.city} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label={getFieldLabel('street', 'Street and Housenumber', 'Street + No.')} 
                    name="street" 
                    value={form.street} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>

                {/* Property Details Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, mt: 2 }}>
                    🏠 Property Info
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label="Property Type" 
                    name="objectType" 
                    value={form.objectType} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Size (m²)" 
                    name="sqm" 
                    value={form.sqm} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label={getFieldLabel('yearOfConstruction', 'Year of Construction', 'Built Year')} 
                    name="yearOfConstruction" 
                    value={form.yearOfConstruction} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label={getFieldLabel('lastRenovation', 'Last Renovation', 'Last Renovated')} 
                    name="lastRenovation" 
                    value={form.lastRenovation} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>

                {/* Financial Details Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, mt: 2 }}>
                    💰 Financial Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Net Rent" 
                    name="netRent" 
                    value={form.netRent} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label={getFieldLabel('vacancy', 'Vacancy M/Y', 'Vacancy/Year')} 
                    name="vacancy" 
                    value={form.vacancy} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label={getFieldLabel('Shared Costs', 'Shared Costs', 'Shared Costs')} 
                    name="apportionableCosts" 
                    value={form.apportionableCosts} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label={getFieldLabel('Fixed Costs', 'Fixed Costs', 'Fixed Costs')} 
                    name="nonApportionableCosts" 
                    value={form.nonApportionableCosts} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Purchase Price" 
                    name="purchasePrice" 
                    value={form.purchasePrice} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Market Price" 
                    name="marketPrice" 
                    value={form.marketPrice} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>

                {/* Financing Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, mt: 2 }}>
                    🏦 Financing
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Residual Debt" 
                    name="residualDebt" 
                    value={form.residualDebt} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Interest Rate (%)" 
                    name="interest" 
                    value={form.interest} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label={getFieldLabel('Monthly Payment', 'Monthly Payment', 'Monthly Payment')} 
                    name="repaymentRate" 
                    value={form.repaymentRate} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label={getFieldLabel('Rate Fixed (mo.)', 'Rate Fixed (mo.)', 'Rate Fixed (mo.)')} 
                    name="interestFixation" 
                    value={form.interestFixation} 
                    onChange={handleChange} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' }
                      }
                    }}
                  />
                </Grid>

                {/* Analyze Button */}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAnalyze}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <AnalyticsIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '16px',
                      py: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)'
                      },
                      '&:disabled': {
                        background: 'rgba(100, 116, 139, 0.3)',
                        color: 'rgba(255,255,255,0.7)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? 'Analyzing Real Estate...' : 'Analyze Real Estate'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right Side: Analysis Results */}
          <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ 
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '24px',
              p: 4,
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              flex: 1
            }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  AI Analysis Results
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Comprehensive real estate investment analysis powered by artificial intelligence
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '400px',
                  background: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: '16px'
                }}>
                  <CircularProgress 
                    size={60}
                    thickness={4}
                    sx={{ color: '#667eea', mb: 3 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                    Analyzing Real Estate...
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Our AI is processing your property details
                  </Typography>
                </Box>
              ) : error ? (
                <Alert 
                  severity="error"
                  sx={{
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    '& .MuiAlert-icon': {
                      color: '#dc2626'
                    }
                  }}
                >
                  {error}
                </Alert>
              ) : analysis ? (
                <Fade in={!!analysis}>
                  <Box>
                    {/* Analysis Cards */}
                    <Grid container spacing={3} sx={{ mb: 6 }}>
                      {/* Grade Card */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '16px',
                          textAlign: 'center',
                          p: 1.5,
                          height: '100%',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)'
                          }
                        }}>
                          <CardContent sx={{ pb: 0 }}>
                            <AssessmentIcon sx={{ fontSize: 48, color: getGradeColor(analysis.grade), mb: 0.5 }} />
                            <Typography 
                              variant="h2" 
                              sx={{ 
                                color: getGradeColor(analysis.grade), 
                                fontWeight: 700,
                                mb: 0.5
                              }}
                            >
                              {analysis.grade || '-'}
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 0.5 }}>
                              Investment Grade
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#64748b' }}>
                              AI-powered assessment of investment quality
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Risk Analysis Card */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '16px',
                          p: 1.5,
                          height: '100%',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)'
                          }
                        }}>
                          <CardContent sx={{ pb: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                              <SecurityIcon sx={{ fontSize: 48, color: '#3b82f6', mr: 1 }} />
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                Risk Assessment
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                              <Typography variant="h2" sx={{ fontWeight: 700, color: '#3b82f6', mr: 1 }}>
                                {analysis.riskScore || 'N/A'}
                              </Typography>
                              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
                                /10 Risk Score
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ color: '#64748b' }}>
                              Comprehensive risk evaluation based on market factors
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* ROI Scenarios Card */}
                      <Grid item xs={12} sx={{ mt: 3 }}>
                        <Card sx={{
                          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                          borderRadius: '16px',
                          p: 2,
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)'
                          }
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                              <TrendingUpIcon sx={{ fontSize: 32, color: '#a855f7', mr: 1 }} />
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                ROI Scenarios
                              </Typography>
                            </Box>
                            {analysis.roiScenarios ? (
                              <Grid container spacing={3}>
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444', mb: 1 }}>
                                      {analysis.roiScenarios.pessimistic}%
                                    </Typography>
                                    <Chip 
                                      label="Pessimistic" 
                                      size="small"
                                      sx={{ 
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        fontWeight: 600
                                      }}
                                    />
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#a855f7', mb: 1 }}>
                                      {analysis.roiScenarios.realistic}%
                                    </Typography>
                                    <Chip 
                                      label="Realistic (Avg.)" 
                                      size="small"
                                      sx={{ 
                                        background: 'rgba(168, 85, 247, 0.2)',
                                        color: '#a855f7',
                                        fontWeight: 600
                                      }}
                                    />
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981', mb: 1 }}>
                                      {analysis.roiScenarios.optimistic}%
                                    </Typography>
                                    <Chip 
                                      label="Optimistic" 
                                      size="small"
                                      sx={{ 
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        fontWeight: 600
                                      }}
                                    />
                                  </Box>
                                </Grid>
                              </Grid>
                            ) : (
                              <Typography sx={{ color: '#64748b' }}>Not available.</Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Cashflow Analysis Card */}
                      <Grid item xs={12}>
                        <Card sx={{
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.1) 100%)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          borderRadius: '16px',
                          p: 2,
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)'
                          }
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                              <EuroIcon sx={{ fontSize: 32, color: '#22c55e', mr: 1 }} />
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                Monthly Cashflow Analysis
                              </Typography>
                            </Box>
                            <Grid container spacing={3}>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e', mb: 1 }}>
                                    {analysis.cashflow ? `€${analysis.cashflow}` : 'N/A'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                                    Gross Monthly Cashflow
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e', mb: 1 }}>
                                    {analysis.cashflowAfterMortgage ? `€${analysis.cashflowAfterMortgage}` : 'N/A'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                                    Net Cashflow After Mortgage
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Full Analysis */}
                    <Card sx={{
                      borderRadius: '16px',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      mb: 3
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                          Detailed Analysis
                        </Typography>
                        {analysis.explanation ? (
                          <Box sx={{
                            background: 'rgba(248, 250, 252, 0.8)',
                            borderRadius: '12px',
                            p: 3,
                            border: '1px solid rgba(226, 232, 240, 0.8)'
                          }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                lineHeight: 1.7, 
                                whiteSpace: 'pre-wrap',
                                color: '#374151'
                              }}
                            >
                              {analysis.explanation}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ color: '#64748b' }}>Not available.</Typography>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Save Button */}
                    <Button
                      variant="contained"
                      onClick={handleSaveInvestment}
                      startIcon={<SaveIcon />}
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '16px',
                        py: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 30px rgba(16, 185, 129, 0.4)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Save Investment to Portfolio
                    </Button>
                  </Box>
                </Fade>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '400px',
                  background: 'rgba(248, 250, 252, 0.8)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(226, 232, 240, 0.8)'
                }}>
                  <HomeIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                    Ready for Analysis
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                    Enter your real estate investment details to begin AI analysis
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default AddRealEstate;

