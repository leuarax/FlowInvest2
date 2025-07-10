import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { saveInvestment } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [step, setStep] = useState(1); // 1: Location, 2: Property, 3: Financial, 4: Financing, 5: Analysis
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
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const analysisRef = useRef(null);

  useEffect(() => {
    if (analysisRef.current && !showFullAnalysis) {
      setIsClamped(analysisRef.current.scrollHeight > analysisRef.current.clientHeight + 1);
    } else {
      setIsClamped(false);
    }
  }, [analysis?.explanation, showFullAnalysis]);

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
        res = await fetch('/api/analyze-real-estate', {
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

  const handleSaveInvestment = async () => {
    if (!analysis) return;
    setLoading(true);
    try {
      const newInvestment = {
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
        date: new Date().toISOString().split('T')[0],
      };
      const { error } = await saveInvestment(newInvestment);
      if (error) {
        setError('Failed to save investment: ' + error);
        return;
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving investment:', error);
      setError('Failed to save investment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mobile-optimized field labels
  const getFieldLabel = (field, fullLabel, shortLabel) => {
    return isMobile ? shortLabel : fullLabel;
  };

  // Validation for each step
  const isStepValid = () => {
    if (step === 1) {
      return form.country && form.city && form.street;
    }
    if (step === 2) {
      return form.objectType && form.sqm && form.yearOfConstruction && form.lastRenovation;
    }
    if (step === 3) {
      return (
        form.netRent &&
        form.apportionableCosts &&
        form.nonApportionableCosts &&
        form.vacancy &&
        form.purchasePrice &&
        form.marketPrice
      );
    }
    if (step === 4) {
      return (
        form.residualDebt &&
        form.interest &&
        form.repaymentRate &&
        form.interestFixation
      );
    }
    return true;
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      minWidth: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflowY: 'auto',
      py: 0,
      px: 0
    }}>
      {/* Header Section: Always show at the top */}
      <Box sx={{ textAlign: 'center', mb: 4, mt: { xs: 12, sm: 6 } }}>
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
      </Box>
      {/* Back to Dashboard Button */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
        <Button
          onClick={() => navigate('/dashboard')}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'white',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '12px',
            px: { xs: 1.5, sm: 3 },
            py: { xs: 0.5, sm: 1.5 },
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 2,
            fontSize: { xs: '0.95rem', sm: '1rem' },
            minWidth: { xs: 'unset', sm: '120px' },
            '&:hover': {
              background: 'rgba(255,255,255,0.18)',
              borderColor: 'white',
              color: '#764ba2',
            },
            transition: 'all 0.3s ease'
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Grid container spacing={4} sx={{ flex: 1, minHeight: 0 }}>
          {/* Left Side: Input Form */}
          <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column' }}>
            {!(step === 5 && analysis) && (
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
                      {step === 1 ? 'Location Details' :
                       step === 2 ? 'Property Info' :
                       step === 3 ? 'Financial Details' :
                       step === 4 ? 'Financing' :
                       'Analysis'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {step === 1 && 'Enter the location of your real estate investment.'}
                    {step === 2 && 'Provide property information.'}
                    {step === 3 && 'Enter financial details.'}
                    {step === 4 && 'Enter financing details.'}
                    {step === 5 && 'Review analysis and save to your portfolio.'}
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {/* Step 1: Location Section */}
                  {step === 1 && <>
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
                  </>}
                  {/* Step 2: Property Info */}
                  {step === 2 && <>
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
                        label="Year Built" 
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
                  </>}
                  {/* Step 3: Financial Details */}
                  {step === 3 && <>
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
                        label={getFieldLabel('Vacancy M/Y', 'Vacancy M/Y', 'Vacancy M/Y')} 
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
                  </>}
                  {/* Step 4: Financing */}
                  {step === 4 && <>
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
                  </>}
                  {/* Step 5: Analysis and Save */}
                  {step === 5 && !analysis && (
                    <>
                      {/* No input fields for step 5 */}
                    </>
                  )}
                </Grid>

                {/* Step navigation buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  {step > 1 ? (
                    <Button variant="outlined" onClick={() => setStep(step - 1)}>
                      Back
                    </Button>
                  ) : <span />}
                  {step < 5 ? (
                    <Button variant="contained" onClick={() => setStep(step + 1)} disabled={!isStepValid()}>
                      Next
                    </Button>
                  ) : null}
                  {step === 5 && !analysis && (
                    <Button
                      variant="contained"
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
                        transition: 'all 0.3s ease',
                        ml: 2
                      }}
                    >
                      {loading ? 'Analyzing Real Estate...' : 'Analyze Real Estate'}
                    </Button>
                  )}
                </Box>
              </Paper>
            )}
          </Grid>

          {/* Right Side: Analysis Results */}
          {(step === 5 && analysis) && (
            <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column', mt: -8 }}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <HomeIcon sx={{ fontSize: 32, color: '#667eea', mr: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      AI Analysis Results
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Comprehensive real estate investment analysis powered by artificial intelligence
                  </Typography>
                </Box>
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
                          <>
                            <Box
                              ref={analysisRef}
                              sx={{
                                background: 'rgba(248, 250, 252, 0.8)',
                                borderRadius: '12px',
                                p: 3,
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: showFullAnalysis ? 'unset' : 3,
                                WebkitBoxOrient: 'vertical',
                                cursor: isClamped && !showFullAnalysis ? 'pointer' : 'default',
                              }}
                              onClick={() => isClamped && !showFullAnalysis && setShowFullAnalysis(true)}
                            >
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  lineHeight: 1.7, 
                                  whiteSpace: 'pre-wrap',
                                  color: '#374151',
                                  userSelect: 'text'
                                }}
                              >
                                {analysis.explanation}
                              </Typography>
                            </Box>
                            {isClamped && !showFullAnalysis && (
                              <Box sx={{ mt: 1 }}>
                                <Button size="small" onClick={e => { e.stopPropagation(); setShowFullAnalysis(true); }}>
                                  See more
                                </Button>
                              </Box>
                            )}
                            {showFullAnalysis && (
                              <Box sx={{ mt: 1 }}>
                                <Button size="small" onClick={e => { e.stopPropagation(); setShowFullAnalysis(false); }}>
                                  See less
                                </Button>
                              </Box>
                            )}
                          </>
                        ) : (
                          <Typography sx={{ color: '#64748b' }}>Not available.</Typography>
                        )}
                      </CardContent>
                    </Card>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                      <Button variant="outlined" onClick={() => setStep(step - 1)}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleSaveInvestment}
                        sx={{ borderRadius: '16px', py: 2, fontWeight: 700, fontSize: '1.1rem', ml: 2 }}
                        startIcon={<SaveIcon />}
                      >
                        Save to Portfolio
                      </Button>
                    </Box>
                  </Box>
                </Fade>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default AddRealEstate;

