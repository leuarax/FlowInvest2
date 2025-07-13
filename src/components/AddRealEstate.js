import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container, Box, Typography, TextField, Button, Grid, Paper, CircularProgress,
  Card, CardContent, Fade, useTheme, useMediaQuery
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SaveIcon from '@mui/icons-material/Save';
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
        try {
          res = await fetch('/api/analyze-real-estate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });
        } catch (prodErr) {
          console.log('Production URL failed, trying Vercel fallback...', prodErr);
          res = await fetch('https://flow-invest2-hpr3.vercel.app/api/analyze-real-estate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });
        }
      }
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || `HTTP error! status: ${res.status}`);
      }
      const result = await res.json();
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis error:', err.message || 'An unknown error occurred during analysis.');
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
        console.error('Failed to save investment:', error);
        return;
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving investment:', error);
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
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflowY: 'auto',
      py: 0,
      px: 0
    }}>
      {/* Header */}
      <Container maxWidth="lg" sx={{ py: 3, px: 2, width: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 4,
          pb: 2,
          borderBottom: '1px solid #E5E7EB'
        }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: '#1F2937',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 700,
              letterSpacing: '-0.025em'
            }}
          >
            FlowInvest
          </Typography>
          
          <Button
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBackIcon />}
            sx={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              px: 2,
              py: 1,
              color: '#6B7280',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#F3F4F6',
                borderColor: '#D1D5DB'
              }
            }}
          >
            Dashboard
          </Button>
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {/* AI Analysis Results - Moved to top */}
        {(step === 5 && analysis) && (
          <Box sx={{ mb: 4 }}>
            <Paper sx={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              p: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AnalyticsIcon sx={{ fontSize: 24, color: '#8B5CF6', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', fontSize: '1.125rem' }}>
                    AI Analysis Results
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>
                  Comprehensive real estate investment analysis powered by AI
                </Typography>
              </Box>
              <Fade in={!!analysis}>
                <Box>
                  {/* Analysis Cards */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {/* Grade Card */}
                    <Grid item xs={12} sm={6}>
                      <Card sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        p: 2,
                        height: '100%'
                      }}>
                        <CardContent sx={{ pb: 0 }}>
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              color: getGradeColor(analysis.grade), 
                              fontWeight: 700,
                              mb: 1
                            }}
                          >
                            {analysis.grade || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.875rem' }}>
                            Investment Grade
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Risk Analysis Card */}
                    <Grid item xs={12} sm={6}>
                      <Card sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        p: 2,
                        height: '100%'
                      }}>
                        <CardContent sx={{ pb: 0 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
                            {Math.round(analysis.riskScore) || 'N/A'}/10
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.875rem' }}>
                            Risk Score
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* ROI Scenarios Card */}
                    <Grid item xs={12}>
                      <Card sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        p: 2,
                      }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', mb: 2, fontSize: '1rem' }}>
                            ROI Scenarios
                          </Typography>
                          {analysis.roiScenarios ? (
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#EF4444', fontSize: '0.875rem' }}>
                                    {analysis.roiScenarios.pessimistic}%
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                    Pessimistic
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#8B5CF6', fontSize: '0.875rem' }}>
                                    {analysis.roiScenarios.realistic}%
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                    Realistic
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981', fontSize: '0.875rem' }}>
                                    {analysis.roiScenarios.optimistic}%
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                    Optimistic
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          ) : (
                            <Typography sx={{ color: '#6B7280', fontSize: '0.875rem' }}>Not available.</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Cashflow Analysis Card */}
                    <Grid item xs={12}>
                      <Card sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        p: 2,
                      }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', mb: 2, fontSize: '1rem' }}>
                            Monthly Cashflow
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981', fontSize: '0.875rem' }}>
                                  {analysis.cashflow ? `€${analysis.cashflow}` : 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                  Gross
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981', fontSize: '0.875rem' }}>
                                  {analysis.cashflowAfterMortgage ? `€${analysis.cashflowAfterMortgage}` : 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                  Net After Mortgage
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
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    mb: 3
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', mb: 2, fontSize: '1rem' }}>
                        Detailed Analysis
                      </Typography>
                      {analysis.analysis || analysis.explanation ? (
                        <>
                          <Box
                            ref={analysisRef}
                            sx={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              p: 2,
                              border: '1px solid #E5E7EB',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: showFullAnalysis ? 'unset' : 5,
                              WebkitBoxOrient: 'vertical',
                              cursor: isClamped && !showFullAnalysis ? 'pointer' : 'default',
                            }}
                            onClick={() => isClamped && !showFullAnalysis && setShowFullAnalysis(true)}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                lineHeight: 1.6, 
                                whiteSpace: 'pre-wrap',
                                color: '#374151',
                                userSelect: 'text',
                                fontSize: '0.875rem'
                              }}
                            >
                              {analysis.analysis || analysis.explanation}
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
                        <Typography sx={{ color: '#6B7280', fontSize: '0.875rem' }}>Not available.</Typography>
                      )}
                    </CardContent>
                  </Card>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSaveInvestment}
                      sx={{
                        backgroundColor: '#8B5CF6',
                        color: '#ffffff',
                        borderRadius: '12px',
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: '#7C3AED',
                          boxShadow: 'none'
                        }
                      }}
                      startIcon={<SaveIcon />}
                    >
                      Save to Portfolio
                    </Button>
                  </Box>
                </Box>
              </Fade>
            </Paper>
          </Box>
        )}

        <Grid container spacing={4} sx={{ flex: 1, minHeight: 0 }}>
          {/* Input Form - Full width when analysis is shown */}
          <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
            {!(step === 5 && analysis) && (
              <Paper sx={{ 
                backgroundColor: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                p: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                flex: 1
              }}>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <HomeIcon sx={{ fontSize: 24, color: '#8B5CF6', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', fontSize: '1.125rem' }}>
                      {step === 1 ? 'Location Details' :
                       step === 2 ? 'Property Info' :
                       step === 3 ? 'Financial Details' :
                       step === 4 ? 'Financing' :
                       'Analysis'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.875rem' }}>
                    {step === 1 && 'Enter the location of your real estate investment.'}
                    {step === 2 && 'Provide property information.'}
                    {step === 3 && 'Enter financial details.'}
                    {step === 4 && 'Enter financing details.'}
                    {step === 5 && 'Review analysis and save to your portfolio.'}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                            borderRadius: '8px',
                            backgroundColor: '#F9FAFB',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#8B5CF6' }
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
                    <Button 
                      variant="outlined" 
                      onClick={() => setStep(step - 1)}
                      sx={{
                        borderColor: '#E5E7EB',
                        color: '#1F2937',
                        borderRadius: '12px',
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#D1D5DB',
                          backgroundColor: '#F9FAFB'
                        }
                      }}
                    >
                      Back
                    </Button>
                  ) : <span />}
                  {step < 5 ? (
                    <Button 
                      variant="contained" 
                      onClick={() => setStep(step + 1)} 
                      disabled={!isStepValid()}
                      sx={{
                        backgroundColor: '#8B5CF6',
                        color: '#ffffff',
                        borderRadius: '12px',
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: '#7C3AED',
                          boxShadow: 'none'
                        },
                        '&:disabled': {
                          backgroundColor: '#D1D5DB',
                          color: '#9CA3AF'
                        }
                      }}
                    >
                      Next
                    </Button>
                  ) : null}
                  {step === 5 && !analysis && (
                    <Button
                      variant="contained"
                      onClick={handleAnalyze}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <AnalyticsIcon />}
                      sx={{
                        backgroundColor: '#8B5CF6',
                        color: '#ffffff',
                        borderRadius: '12px',
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: '#7C3AED',
                          boxShadow: 'none'
                        },
                        '&:disabled': {
                          backgroundColor: '#D1D5DB',
                          color: '#9CA3AF'
                        },
                        ml: 2
                      }}
                    >
                      {loading ? 'Analyzing...' : 'Analyze Real Estate'}
                    </Button>
                  )}
                </Box>
              </Paper>
            )}
          </Grid>


        </Grid>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default AddRealEstate;



