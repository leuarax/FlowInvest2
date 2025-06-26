import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Grid, Paper, CircularProgress, Alert, LinearProgress
} from '@mui/material';

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

const AddRealEstate = () => {
  const navigate = useNavigate();
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
      const res = await fetch('/api/analyze-real-estate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add Real Estate Investment
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField label="Country" name="country" value={form.country} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="City (with ZipCode)" name="city" value={form.city} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Street and Housenumber" name="street" value={form.street} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Object Type" name="objectType" value={form.objectType} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="m²" name="sqm" value={form.sqm} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Year of Construction" name="yearOfConstruction" value={form.yearOfConstruction} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Last Renovation" name="lastRenovation" value={form.lastRenovation} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Net Rent" name="netRent" value={form.netRent} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Apportionable Additional Costs" name="apportionableCosts" value={form.apportionableCosts} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Non-Apportionable Additional Costs" name="nonApportionableCosts" value={form.nonApportionableCosts} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Vacancy (Months per Year)" name="vacancy" value={form.vacancy} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Purchase Price" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Market Price" name="marketPrice" value={form.marketPrice} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Residual Debt" name="residualDebt" value={form.residualDebt} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Interest" name="interest" value={form.interest} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Repayment Rate (monthly)" name="repaymentRate" value={form.repaymentRate} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Interest Rate Fixation (months)" name="interestFixation" value={form.interestFixation} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <span>Analyzing...</span>
                    </Box>
                  ) : (
                    'Analyze Real Estate'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              AI Analysis
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : analysis ? (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Typography variant="h2" sx={{ color: getGradeColor(analysis.grade), fontWeight: 'bold' }}>
                        {analysis.grade || '-'}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">Overall Grade</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6">Risk Analysis</Typography>
                      <Typography variant="body1">Score: {analysis.riskScore || 'N/A'}/10</Typography>
                      <LinearProgress variant="determinate" value={(analysis.riskScore || 0) * 10} sx={{ height: 10, borderRadius: 5, my: 1 }} />
                      {analysis.riskExplanation && <Typography variant="body2" color="text.secondary">{analysis.riskExplanation}</Typography>}
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Typography variant="h6">ROI Scenarios</Typography>
                      {analysis.roiScenarios ? (
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', mt: 1 }}>
                          <Box>
                            <Typography variant="h6">{analysis.roiScenarios.pessimistic}%</Typography>
                            <Typography variant="caption">Pessimistic</Typography>
                          </Box>
                          <Box>
                            <Typography variant="h5" color="primary">{analysis.roiScenarios.realistic}%</Typography>
                            <Typography variant="caption">Realistic (Avg.)</Typography>
                          </Box>
                          <Box>
                            <Typography variant="h6">{analysis.roiScenarios.optimistic}%</Typography>
                            <Typography variant="caption">Optimistic</Typography>
                          </Box>
                        </Box>
                      ) : <Typography>Not available.</Typography>}
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Typography variant="h6">Estimated Monthly Cashflow</Typography>
                      <Typography variant="body1">{analysis.cashflow ? `${analysis.cashflow} €` : 'N/A'}</Typography>
                      <Typography variant="h6" sx={{ mt: 2 }}>Estimated Monthly Cashflow After Mortgage</Typography>
                      <Typography variant="body1">{analysis.cashflowAfterMortgage ? `${analysis.cashflowAfterMortgage} €` : 'N/A'}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Full Analysis
                  </Typography>
                  {analysis.explanation ? (
                    <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', p:1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      {analysis.explanation}
                    </Typography>
                  ) : <Typography>Not available.</Typography>}
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveInvestment}
                  sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
                  fullWidth
                >
                  Save Investment to Portfolio
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'text.secondary' }}>
                <Typography variant="body1">
                  Enter your real estate investment details to begin analysis.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AddRealEstate; 