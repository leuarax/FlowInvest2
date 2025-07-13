import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortfolioAnalysis } from '../utils/openai';
import { savePortfolioAnalysis } from '../utils/firebase';
import {
  Container, Box, Typography, Button, Grid, Paper, 
  CircularProgress, IconButton, Divider, 
  Modal, Fade, Backdrop, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WarningIcon from '@mui/icons-material/Warning';
import Footer from './Footer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { interestOptions } from '../utils/constants';

import GradeProgressArc from './GradeProgressArc';
import FastAddPortfolio from './FastAddPortfolio';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HomeIcon from '@mui/icons-material/Home';

console.log('Dashboard rendered');

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, getUserInvestments, updateUserProfile, deleteAccount, portfolioAnalysis, setPortfolioAnalysis, saveInvestment } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);
  const [stats, setStats] = useState({
    totalPortfolio: 0,
    avgROI: 0,
    avgROIRange: { pessimistic: 0, realistic: 0, optimistic: 0 },
    avgRisk: 0,
    investmentCount: 0,
  });
  const [portfolioAnalysisLoading, setPortfolioAnalysisLoading] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState('');

  const [editName, setEditName] = useState(userProfile?.displayName || userProfile?.name || '');
  const [editExperience, setEditExperience] = useState(userProfile?.experience || '');
  const [editRisk, setEditRisk] = useState(userProfile?.riskTolerance || '');
  const [editInterests, setEditInterests] = useState(userProfile?.interests || []);
  const [editGoal, setEditGoal] = useState(userProfile?.primaryGoal || '');
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsError, setPrefsError] = useState('');
  const [prefsSuccess, setPrefsSuccess] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [autoAnalysisComplete, setAutoAnalysisComplete] = useState(false);
  const [expandBannerDismissed] = useState(() => {
    const dismissed = localStorage.getItem('expandBannerDismissed');
    return dismissed === 'true';
  });
  
  const [hasHadAnalysis, setHasHadAnalysis] = useState(false);
  const [stressTestOpen, setStressTestOpen] = useState(false);
  const [stressTestInput, setStressTestInput] = useState('');
  const [stressTestLoading, setStressTestLoading] = useState(false);
  const [stressTestAnalysis, setStressTestAnalysis] = useState(null);
  const [stressTestError, setStressTestError] = useState('');
  const [portfolioAnalysisModalOpen, setPortfolioAnalysisModalOpen] = useState(false);
  const [fastAddPortfolioOpen, setFastAddPortfolioOpen] = useState(false);
  const [investmentRetryCount, setInvestmentRetryCount] = useState(0);
  const maxInvestmentRetries = 10;
  const investmentRetryDelay = 2000;

  // Add state to control edit mode for profile fields
  const [editingProfile, setEditingProfile] = useState(false);



  const loadInvestments = useCallback(async (retryCount = 0) => {
    try {
      console.log('loadInvestments called, retry count:', retryCount);
      const { investments: firebaseInvestments } = await getUserInvestments();
      console.log('Firebase investments loaded:', firebaseInvestments);
      console.log('Firebase investments length:', firebaseInvestments?.length);
      setInvestments(firebaseInvestments || []);
      if (firebaseInvestments && firebaseInvestments.length > 0) {
        const total = firebaseInvestments.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
        // Calculate weighted average ROI scenarios based on portfolio allocation
        const weightedROIScenarios = firebaseInvestments.reduce((acc, inv) => {
          const amount = parseFloat(inv.amount) || 0;
          const weight = total > 0 ? amount / total : 0;
          let pessimistic = inv.roiScenarios?.pessimistic || parseFloat(String(inv.roiEstimate).replace(/[^0-9.-]+/g, '')) || 0;
          let realistic = inv.roiScenarios?.realistic || parseFloat(String(inv.roiEstimate).replace(/[^0-9.-]+/g, '')) || 0;
          let optimistic = inv.roiScenarios?.optimistic || parseFloat(String(inv.roiEstimate).replace(/[^0-9.-]+/g, '')) || 0;
          if (inv.type === 'Real Estate') {
            const netCashflow = inv.cashflowAfterMortgage !== undefined && inv.cashflowAfterMortgage !== null
              ? parseFloat(inv.cashflowAfterMortgage)
              : (inv.cashflow !== undefined && inv.cashflow !== null ? parseFloat(inv.cashflow) : 0);
            const annualCashflow = netCashflow * 12;
            const cashflowROI = amount > 0 ? (annualCashflow / amount) * 100 : 0;
            pessimistic += cashflowROI;
            realistic += cashflowROI;
            optimistic += cashflowROI;
          }
          return {
            pessimistic: acc.pessimistic + (weight * pessimistic),
            realistic: acc.realistic + (weight * realistic),
            optimistic: acc.optimistic + (weight * optimistic)
          };
        }, { pessimistic: 0, realistic: 0, optimistic: 0 });
        const avgROI = weightedROIScenarios.realistic;
        const avgROIRange = {
          pessimistic: weightedROIScenarios.pessimistic,
          realistic: weightedROIScenarios.realistic,
          optimistic: weightedROIScenarios.optimistic
        };
        const avgRisk = firebaseInvestments.reduce((acc, inv) => acc + parseFloat(inv.riskScore), 0) / firebaseInvestments.length;
        setStats({
          totalPortfolio: total,
          avgROI,
          avgROIRange,
          avgRisk,
          investmentCount: firebaseInvestments.length,
        });
      }
    } catch (error) {
      console.error('Error loading investments:', error);
    }
  }, [getUserInvestments]);

  const handleGetPortfolioAnalysis = useCallback(async () => {
    setLoading(true);
    setPortfolioAnalysisLoading(true);
    setHasHadAnalysis(true);
    try {
      const { investments: freshInvestments } = await getUserInvestments();
      if (!freshInvestments || freshInvestments.length === 0) {
        throw new Error('Failed to load investments for analysis.');
      }
      let currentInvestments = freshInvestments;
      if (!userProfile) {
        throw new Error('User profile not found. Please complete your profile first.');
      }
      if (!userProfile.experience || !userProfile.riskTolerance || !userProfile.interests || !userProfile.primaryGoal) {
        throw new Error('User profile is incomplete. Please complete your profile first.');
      }
      console.log('About to call getPortfolioAnalysis with:', {
        investmentsLength: currentInvestments.length,
        investments: currentInvestments,
        userProfile: userProfile
      });
      const analysis = await getPortfolioAnalysis(currentInvestments, userProfile);
      console.log('New analysis received:', analysis);
      await savePortfolioAnalysis(user.uid, analysis);
      setPortfolioAnalysis(analysis);
      setPortfolioAnalysisModalOpen(true);
      if (updateUserProfile && user && user.uid) {
        await updateUserProfile({ hasHadAnalysis: true, lastAnalysisDate: new Date().toISOString() });
      }
      setTimeout(() => {
        console.log('Context portfolioAnalysis after set:', analysis);
      }, 100);
      setLoading(false);
      setAutoAnalysisComplete(true);
    } catch (err) {
      console.error('Portfolio analysis error:', err);
      console.error('Error details:', {
        userProfile: !!userProfile,
        userProfileData: userProfile,
        errorMessage: err.message,
        errorStack: err.stack
      });
      setLoading(false);
      setAutoAnalysisComplete(true);
    } finally {
      setPortfolioAnalysisLoading(false);
    }
  }, [user, userProfile, getUserInvestments, setPortfolioAnalysis, updateUserProfile]);

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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadInvestments();
  }, [user, navigate, loadInvestments]);

  useEffect(() => {
    const expectedCountStr = localStorage.getItem('expectedInvestmentCount');
    const expectedCount = expectedCountStr ? parseInt(expectedCountStr, 10) : null;
    if (
      userProfile &&
      Array.isArray(investments) &&
      investments !== null &&
      investments !== undefined
    ) {
      if (expectedCount !== null && !isNaN(expectedCount)) {
        if (investments.length < expectedCount && investmentRetryCount < maxInvestmentRetries) {
          setTimeout(() => {
            setInvestmentRetryCount((prev) => prev + 1);
            loadInvestments();
          }, investmentRetryDelay);
          return;
        }
      }
      // Only set loading to false if we have the expected number of investments or no expected count
      if (expectedCount === null || investments.length >= expectedCount) {
        setLoading(false);
      }
    }
  }, [userProfile, investments, investmentRetryCount, loadInvestments]);

  useEffect(() => {
    if (userProfile) {
      const hasAnalysisHistory = userProfile.hasHadAnalysis || userProfile.lastAnalysisDate;
      if (hasAnalysisHistory) {
        setHasHadAnalysis(true);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    const expectedCountStr = localStorage.getItem('expectedInvestmentCount');
    const expectedCount = expectedCountStr ? parseInt(expectedCountStr, 10) : null;
    const hasExpectedInvestments = expectedCount === null || investments.length >= expectedCount;
    
    if (!loading && isFirstLoad && hasExpectedInvestments && investments.length > 0 && userProfile && !portfolioAnalysis && !portfolioAnalysisLoading && !expandBannerDismissed && !hasHadAnalysis) {
      console.log('Auto-triggering portfolio analysis on first load');
      setIsFirstLoad(false);
      setHasHadAnalysis(true);
      handleGetPortfolioAnalysis();
    } else if (!loading && isFirstLoad && hasExpectedInvestments && investments.length > 0 && userProfile && !expandBannerDismissed && !hasHadAnalysis) {
      // If we have all investments but no analysis is needed, still complete the flow
      setIsFirstLoad(false);
      setAutoAnalysisComplete(true);
    }
  }, [loading, isFirstLoad, investments, userProfile, portfolioAnalysis, portfolioAnalysisLoading, expandBannerDismissed, hasHadAnalysis, handleGetPortfolioAnalysis]);

  useEffect(() => {
    const needsAnalysis = localStorage.getItem('needsPortfolioAnalysis') === 'true';
    const expectedCountStr = localStorage.getItem('expectedInvestmentCount');
    const expectedCount = expectedCountStr ? parseInt(expectedCountStr, 10) : null;
    const hasExpectedInvestments = expectedCount === null || investments.length >= expectedCount;
    
    if (needsAnalysis && !portfolioAnalysisModalOpen && hasExpectedInvestments && investments.length > 0) {
      handleGetPortfolioAnalysis();
    } else if (!needsAnalysis && hasExpectedInvestments && investments.length > 0) {
      // If no analysis is needed but we have all investments, complete the flow
      setAutoAnalysisComplete(true);
    }
  }, [portfolioAnalysisModalOpen, handleGetPortfolioAnalysis, investments]);

  const handleOpenStressTest = () => setStressTestOpen(true);
  const handleCloseStressTest = () => {
    setStressTestOpen(false);
    setStressTestError('');
    setStressTestInput('');
  };

  const handleSendStressTest = async () => {
    if (!stressTestInput.trim()) {
      setStressTestError('Please enter a scenario to test.');
      return;
    }

    try {
      setStressTestLoading(true);
      setStressTestError('');
      setStressTestAnalysis(null);
      
      let res, data;
      
      try {
        console.log('Trying local endpoint...');
        res = await fetch('http://localhost:3001/api/stress-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: stressTestInput, investments, userProfile })
        });
        
        console.log('Local response status:', res.status);
        console.log('Local response headers:', res.headers);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const responseText = await res.text();
        console.log('Local response text:', responseText.substring(0, 200));
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
        
        console.log('Local response data:', data);
      } catch (err) {
        console.log('Local endpoint failed:', err.message);
        
        try {
          console.log('Trying Vercel endpoint...');
          const currentOrigin = window.location.origin;
          const vercelEndpoint = `${currentOrigin}/api/stress-test`;
          console.log('Using endpoint:', vercelEndpoint);
          
          res = await fetch(vercelEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario: stressTestInput, investments, userProfile })
          });
          
          console.log('Vercel response status:', res.status);
          console.log('Vercel response headers:', res.headers);
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          
          const responseText = await res.text();
          console.log('Vercel response text:', responseText.substring(0, 200));
          
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
          }
          
          console.log('Vercel response data:', data);
        } catch (err2) {
          console.log('Vercel endpoint failed:', err2.message);
          
          try {
            console.log('Trying Vercel fallback endpoint...');
            res = await fetch('https://flow-invest2-hpr3.vercel.app/api/stress-test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scenario: stressTestInput, investments, userProfile })
            });
            
            console.log('Vercel fallback response status:', res.status);
            
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const responseText = await res.text();
            console.log('Vercel fallback response text:', responseText.substring(0, 200));
            
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
            }
            
            console.log('Vercel fallback response data:', data);
          } catch (err3) {
            console.log('Vercel fallback endpoint failed:', err3.message);
            throw new Error(`All endpoints failed. Local: ${err.message}, Vercel: ${err2.message}, Vercel Fallback: ${err3.message}`);
          }
        }
      }
      
      if (data.analysis === 'Please enter a different scenario.') {
        setStressTestError(data.analysis);
        setStressTestAnalysis(null);
      } else if (data.analysis && typeof data.analysis === 'string' && data.analysis.includes('```json')) {
        try {
          const jsonMatch = data.analysis.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[1]);
            setStressTestAnalysis(parsedData);
            setStressTestError('');
          } else {
            setStressTestError('Invalid response format.');
            setStressTestAnalysis(null);
          }
        } catch (parseError) {
          setStressTestError('Failed to parse analysis response.');
          setStressTestAnalysis(null);
        }
      } else if (data.grade || data.riskScore || data.roiEstimate) {
        setStressTestAnalysis(data);
        setStressTestError('');
      } else if (data.error) {
        setStressTestError(data.error);
        setStressTestAnalysis(null);
      } else {
        setStressTestError('No response.');
        setStressTestAnalysis(null);
      }
    } catch (e) {
      console.error('Unexpected error in stress test:', e);
      setStressTestError(`Error: ${e.message}`);
      setStressTestAnalysis(null);
    } finally {
      setStressTestLoading(false);
    }
  };

  const experienceOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];
  const riskOptions = [
    { value: 'conservative', label: 'Conservative' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'aggressive', label: 'Aggressive' },
  ];



  if (!autoAnalysisComplete) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
        <Typography variant="h6" sx={{ ml: 2, color: '#1F2937', fontWeight: 500 }}>
          Analyzing your portfolio...
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#ffffff'
      }}>
        <CircularProgress size={60} sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  console.log('Rendering Dashboard, portfolioAnalysis:', portfolioAnalysis);
  console.log('DEBUG: portfolioAnalysis.riskScore =', portfolioAnalysis && portfolioAnalysis.riskScore);

  const handleClosePortfolioAnalysisModal = () => {
    setPortfolioAnalysisModalOpen(false);
    localStorage.removeItem('needsPortfolioAnalysis');
    console.log('Removed needsPortfolioAnalysis flag from localStorage');
  };

  const handleAddInvestments = async (selectedInvestments) => {
    try {
      console.log('Adding investments:', selectedInvestments);
      
      for (const investment of selectedInvestments) {
        console.log('Saving investment:', {
          name: investment.name,
          type: investment.type,
          amount: investment.amount,
          roiEstimate: investment.roiEstimate,
          riskScore: investment.riskScore,
          grade: investment.grade,
          hasExplanation: !!investment.explanation,
          hasRoiScenarios: !!investment.roiScenarios
        });
        if (user && user.uid) {
          const { error } = await saveInvestment(investment);
          if (error) {
            throw new Error(`Failed to save investment ${investment.name}: ${error.message}`);
          }
        }
      }
      
      await loadInvestments();
      
      console.log(`Successfully added ${selectedInvestments.length} investments`);
    } catch (error) {
      console.error('Error adding investments:', error);
      throw error;
    }
  };

  return (
    <>
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
        <Container maxWidth="lg" sx={{ py: 3, px: 2 }}>
          {/* Header */}
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
            
            <IconButton
              onClick={() => setAccountSettingsOpen(true)}
              sx={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                width: 48,
                height: 48,
                '&:hover': {
                  backgroundColor: '#F3F4F6',
                  borderColor: '#D1D5DB'
                }
              }}
            >
              <AccountCircleIcon sx={{ color: '#6B7280', fontSize: 24 }} />
            </IconButton>
          </Box>

          {/* Portfolio Overview Card */}
          <Paper
            sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              p: 3,
              mb: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#1F2937', 
                  fontWeight: 600,
                  fontSize: '1.125rem'
                }}
              >
                Portfolio
              </Typography>
              
              {portfolioAnalysis && (
                <Box 
                  onClick={() => setPortfolioAnalysisModalOpen(true)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    px: 3,
                    py: 2,
                    '&:hover': {
                      backgroundColor: '#F3F4F6'
                    }
                  }}
                >
                  <GradeProgressArc 
                    grade={portfolioAnalysis.grade || 'C'} 
                    size={48}
                  />
                  <Typography 
                    sx={{ 
                      color: '#6B7280', 
                      fontSize: '1rem',
                      fontWeight: 500
                    }}
                  >
                    Grade
                  </Typography>
                </Box>
              )}
            </Box>

            <Typography 
              variant="h3" 
              sx={{ 
                color: '#1F2937', 
                fontWeight: 700,
                fontSize: { xs: '2rem', sm: '2.5rem' },
                mb: 1
              }}
            >
              ${stats.totalPortfolio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            
            <Typography 
              sx={{ 
                color: '#6B7280', 
                fontSize: '0.875rem',
                fontWeight: 500,
                mb: 3
              }}
            >
              Total value
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography 
                    sx={{ 
                      color: '#1F2937', 
                      fontWeight: 600,
                      fontSize: '1.25rem'
                    }}
                  >
                    {stats.investmentCount}
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: '#6B7280', 
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    Investments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography 
                    sx={{ 
                      color: '#1F2937', 
                      fontWeight: 600,
                      fontSize: '1.25rem'
                    }}
                  >
                    {stats.avgROIRange.pessimistic.toFixed(1)}% - {stats.avgROIRange.optimistic.toFixed(1)}%
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: '#6B7280', 
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    Avg Yearly ROI
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Quick Actions */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#1F2937', 
                fontWeight: 600,
                fontSize: '1.125rem',
                mb: 2
              }}
            >
              Quick Actions
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleGetPortfolioAnalysis}
                  disabled={portfolioAnalysisLoading}
                  startIcon={portfolioAnalysisLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <AnalyticsIcon />}
                  sx={{
                    backgroundColor: '#8B5CF6',
                    color: '#ffffff',
                    borderRadius: '12px',
                    py: 2,
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
                  {portfolioAnalysisLoading ? 'Analyzing...' : 'Analyze'}
                </Button>
              </Grid>
              
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleOpenStressTest}
                  startIcon={<ChatIcon />}
                  sx={{
                    borderColor: '#E5E7EB',
                    color: '#1F2937',
                    borderRadius: '12px',
                    py: 2,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#D1D5DB',
                      backgroundColor: '#F9FAFB'
                    }
                  }}
                >
                  Stress Test
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Services Grid */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#1F2937', 
                fontWeight: 600,
                fontSize: '1.125rem',
                mb: 2
              }}
            >
              Services
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper
                  onClick={() => navigate('/add-investment')}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#F9FAFB',
                      borderColor: '#D1D5DB'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#F3F4F6',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <TrendingUpIcon sx={{ color: '#6B7280', fontSize: 24 }} />
                  </Box>
                  <Typography 
                    sx={{ 
                      color: '#1F2937', 
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    Check Potential
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Paper
                  onClick={() => setFastAddPortfolioOpen(true)}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#F9FAFB',
                      borderColor: '#D1D5DB'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#F3F4F6',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <AddIcon sx={{ color: '#6B7280', fontSize: 24 }} />
                  </Box>
                  <Typography 
                    sx={{ 
                      color: '#1F2937', 
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    Fast Add
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Paper
                  onClick={() => navigate('/portfolio')}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#F9FAFB',
                      borderColor: '#D1D5DB'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#F3F4F6',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <AssessmentIcon sx={{ color: '#6B7280', fontSize: 24 }} />
                  </Box>
                  <Typography 
                    sx={{ 
                      color: '#1F2937', 
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    Portfolio Details
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Paper
                  onClick={() => navigate('/add-real-estate')}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#F9FAFB',
                      borderColor: '#D1D5DB'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#F3F4F6',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    <HomeIcon sx={{ color: '#6B7280', fontSize: 24 }} />
                  </Box>
                  <Typography 
                    sx={{ 
                      color: '#1F2937', 
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    Add Real Estate
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Portfolio Analysis Modal */}
          {portfolioAnalysis && (
            <Modal
              open={portfolioAnalysisModalOpen}
              onClose={handleClosePortfolioAnalysisModal}
              closeAfterTransition
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 500,
                sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
              }}
            >
              <Fade in={portfolioAnalysisModalOpen}>
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '95%', sm: '90%', md: '80%' },
                  maxWidth: '600px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  p: 3,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#1F2937',
                        fontSize: '1.5rem'
                      }}
                    >
                      Portfolio Analysis
                    </Typography>
                    
                    <IconButton
                      onClick={handleClosePortfolioAnalysisModal}
                      sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          backgroundColor: '#F3F4F6'
                        }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        backgroundColor: getGradeColor(portfolioAnalysis.grade),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography 
                        sx={{ 
                          color: '#ffffff', 
                          fontWeight: 700,
                          fontSize: '1.5rem'
                        }}
                      >
                        {portfolioAnalysis.grade || '—'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        sx={{ 
                          color: '#1F2937', 
                          fontWeight: 600,
                          fontSize: '1.125rem'
                        }}
                      >
                        Overall Grade
                      </Typography>
                      <Typography 
                        sx={{ 
                          color: '#6B7280', 
                          fontSize: '0.875rem'
                        }}
                      >
                        Based on your portfolio analysis
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      backgroundColor: '#F3F4F6',
                      borderRadius: '8px',
                      p: 1.5,
                      minWidth: 70
                    }}>
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                        Risk Score
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        color: portfolioAnalysis.riskScore >= 7 ? '#DC2626' : 
                               portfolioAnalysis.riskScore >= 5 ? '#F59E0B' : '#10B981',
                        fontWeight: 700 
                      }}>
                        {(() => {
                          const score = Number(portfolioAnalysis.riskScore);
                          return !isNaN(score) && score > 0 ? `${score}/10` : 'N/A';
                        })()}
                      </Typography>
                    </Box>
                  </Box>

                  <Paper sx={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    p: 3,
                    mb: 3
                  }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        color: '#374151',
                        lineHeight: 1.6,
                        fontSize: '0.875rem'
                      }}
                    >
                      {Array.isArray(portfolioAnalysis.analysis) && portfolioAnalysis.analysis.length > 0 ? (
                        <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                          {portfolioAnalysis.analysis.map((line, idx) => {
                            // Robustly extract sentiment marker
                            const match = line.match(/^•\s*\[([+\-~])\]\s*/);
                            let color = '#374151';
                            if (match) {
                              if (match[1] === '+') color = '#10b981'; // green
                              else if (match[1] === '-') color = '#ef4444'; // red
                              else if (match[1] === '~') color = '#f59e42'; // orange
                            }
                            // Remove bullet and sentiment marker for display
                            const cleanLine = line.replace(/^•\s*\[[+\-~]\]\s*/, '').trim();
                            return (
                              <li key={idx} style={{
                                marginBottom: 10,
                                color: color,
                                fontWeight: 600,
                                fontSize: '1.15em',
                                background: 'none',
                                padding: '2px 0',
                                listStyle: 'none',
                              }}>
                                {cleanLine}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        typeof portfolioAnalysis.analysis === 'string' && portfolioAnalysis.analysis.split('\n').filter(line => line.trim().startsWith('•')).length > 0 ? (
                          <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
                            {portfolioAnalysis.analysis.split('\n').filter(line => line.trim().startsWith('•')).map((line, idx) => {
                              let color = '#374151';
                              if (line.includes('[+]')) color = '#10b981';
                              else if (line.includes('[-]')) color = '#ef4444';
                              else if (line.includes('[~]')) color = '#f59e0b';
                              const cleanLine = line.replace(/^•\s*\[.\]\s*/, '');
                              return (
                                <li key={idx} style={{ marginBottom: 4, color: '#374151', display: 'flex', alignItems: 'center' }}>
                                  <span style={{
                                    color: color,
                                    fontWeight: 700,
                                    marginRight: 8,
                                    fontSize: '1.1em',
                                    display: 'inline-block',
                                    width: '1em'
                                  }}>•</span>
                                  <span>{cleanLine}</span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <span>{typeof portfolioAnalysis.analysis === 'string' ? portfolioAnalysis.analysis : 'No analysis available.'}</span>
                        )
                      )}
                    </Typography>
                  </Paper>



                  {/* Portfolio Performance Chart */}
                  {portfolioAnalysis.historicalValues && portfolioAnalysis.recommendedValues && (
                    <Paper sx={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      p: 3,
                      mb: 3
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#1F2937', 
                          mb: 2,
                          fontSize: '1.125rem'
                        }}
                      >
                        Your Portfolio Performance
                      </Typography>
                      
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={portfolioAnalysis.historicalValues.map((value, index) => {
                          const baseValue = portfolioAnalysis.historicalValues[0];
                          return {
                            year: index,
                            actual: value - baseValue,
                            recommended: portfolioAnalysis.recommendedValues[index] - baseValue
                          };
                        })}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="year" 
                            stroke="#6B7280"
                            fontSize={12}
                            tickFormatter={(value) => `${5 - value} years ago`}
                          />
                          <YAxis 
                            stroke="#6B7280"
                            fontSize={12}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#8B5CF6" 
                            strokeWidth={2}
                            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                            name="Current Portfolio"
                            activeDot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="recommended" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            name="With Recommendations"
                            activeDot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  )}

                  {portfolioAnalysis.recommendations && portfolioAnalysis.recommendations.length > 0 && (
                    <>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#1F2937', 
                          mb: 2,
                          fontSize: '1.125rem'
                        }}
                      >
                        Recommendations
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                        {portfolioAnalysis.recommendations.slice(0, 3).map((rec, index) => (
                          <Paper
                            key={index}
                            sx={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              p: 2
                            }}
                          >
                            <Typography 
                              sx={{ 
                                fontWeight: 600,
                                color: '#1F2937',
                                fontSize: '0.875rem',
                                mb: 1
                              }}
                            >
                              {typeof rec === 'string' ? rec : (rec?.name || 'Recommendation')}
                            </Typography>
                            {typeof rec !== 'string' && rec?.reason && (
                              <Typography 
                                sx={{ 
                                  color: '#6B7280',
                                  fontSize: '0.75rem',
                                  lineHeight: 1.5
                                }}
                              >
                                {rec.reason}
                              </Typography>
                            )}
                          </Paper>
                        ))}
                      </Box>
                    </>
                  )}

                  <Button 
                    onClick={handleClosePortfolioAnalysisModal}
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: '#8B5CF6',
                      color: '#ffffff',
                      borderRadius: '12px',
                      py: 2,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#7C3AED',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </Fade>
            </Modal>
          )}

          {/* Stress Test Modal */}
          <Modal
            open={stressTestOpen}
            onClose={handleCloseStressTest}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{ 
              timeout: 500, 
              sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } 
            }}
          >
            <Fade in={stressTestOpen}>
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '95%', sm: '90%', md: '80%' },
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                p: 3,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#1F2937',
                      fontSize: '1.5rem'
                    }}
                  >
                    {stressTestAnalysis ? 'Scenario Analysis' : 'Stress Test'}
                  </Typography>
                  
                  <IconButton
                    onClick={handleCloseStressTest}
                    sx={{
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        backgroundColor: '#F3F4F6'
                      }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                  </IconButton>
                </Box>

                {!stressTestAnalysis && (
                  <>
                    <Paper sx={{ 
                      backgroundColor: '#F9FAFB', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px', 
                      p: 2, 
                      mb: 3
                    }}>
                      <Typography 
                        sx={{ 
                          color: '#6B7280',
                          fontSize: '0.875rem',
                          lineHeight: 1.5
                        }}
                      >
                        Enter a market scenario (e.g., "2008-style crash", "interest rates rise by 3%", "tech sector collapse"). 
                        The AI will analyze how your portfolio would perform.
                      </Typography>
                    </Paper>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Describe a scenario..."
                        value={stressTestInput}
                        onChange={e => setStressTestInput(e.target.value)}
                        disabled={stressTestLoading}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            '& fieldset': {
                              border: 'none'
                            },
                            '&:hover': {
                              backgroundColor: '#F3F4F6'
                            },
                            '&.Mui-focused': {
                              backgroundColor: '#ffffff',
                              borderColor: '#8B5CF6'
                            }
                          }
                        }}
                      />
                    </Box>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSendStressTest}
                      disabled={stressTestLoading || !stressTestInput.trim()}
                      startIcon={stressTestLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : null}
                      sx={{
                        backgroundColor: '#8B5CF6',
                        color: '#ffffff',
                        borderRadius: '12px',
                        py: 2,
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
                      {stressTestLoading ? 'Analyzing...' : 'Analyze Scenario'}
                    </Button>
                  </>
                )}

                {stressTestError && (
                  <Paper sx={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '12px',
                    p: 3,
                    mb: 2
                  }}>
                    <Typography sx={{ color: '#DC2626', fontWeight: 600, fontSize: '0.875rem' }}>
                      {stressTestError}
                    </Typography>
                  </Paper>
                )}

                {stressTestAnalysis && (
                  <Fade in={!!stressTestAnalysis}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            backgroundColor: getGradeColor(stressTestAnalysis.grade),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography 
                            sx={{ 
                              color: '#ffffff', 
                              fontWeight: 700,
                              fontSize: '1.5rem'
                            }}
                          >
                            {stressTestAnalysis.grade}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography 
                            sx={{ 
                              color: '#1F2937', 
                              fontWeight: 600,
                              fontSize: '1.125rem'
                            }}
                          >
                            Scenario Grade
                          </Typography>
                          <Typography 
                            sx={{ 
                              color: '#6B7280', 
                              fontSize: '0.875rem'
                            }}
                          >
                            Portfolio performance under stress
                          </Typography>
                        </Box>
                      </Box>

                      <Paper sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        p: 3,
                        mb: 3
                      }}>
                        <Typography 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            color: '#374151',
                            lineHeight: 1.6,
                            fontSize: '0.875rem'
                          }}
                        >
                          {stressTestAnalysis.analysis}
                        </Typography>
                      </Paper>

                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Paper sx={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            p: 2,
                            textAlign: 'center'
                          }}>
                            <Typography 
                              sx={{ 
                                color: '#1F2937', 
                                fontWeight: 600,
                                fontSize: '1.25rem'
                              }}
                            >
                              {stressTestAnalysis.riskScore || 'N/A'}/10
                            </Typography>
                            <Typography 
                              sx={{ 
                                color: '#6B7280', 
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}
                            >
                              Risk Score
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Paper sx={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            p: 2,
                            textAlign: 'center'
                          }}>
                            <Typography 
                              sx={{ 
                                color: '#1F2937', 
                                fontWeight: 600,
                                fontSize: '1.25rem'
                              }}
                            >
                              {stressTestAnalysis.roiEstimate ? `${stressTestAnalysis.roiEstimate}%` : 'N/A'}
                            </Typography>
                            <Typography 
                              sx={{ 
                                color: '#6B7280', 
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}
                            >
                              ROI Estimate
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      {Array.isArray(stressTestAnalysis.recommendations) && stressTestAnalysis.recommendations.length > 0 && (
                        <>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#1F2937', 
                              mb: 2,
                              fontSize: '1.125rem'
                            }}
                          >
                            Recommendations
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                            {stressTestAnalysis.recommendations.slice(0, 3).map((rec, idx) => {
                              const recName = typeof rec === 'string' ? rec : (rec?.name || 'Recommendation');
                              return (
                                <Paper
                                  key={idx}
                                  sx={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    p: 2
                                  }}
                                >
                                  <Typography 
                                    sx={{ 
                                      fontWeight: 600,
                                      color: '#1F2937',
                                      fontSize: '0.875rem',
                                      mb: 1
                                    }}
                                  >
                                    {recName}
                                  </Typography>
                                  {typeof rec !== 'string' && rec?.reason && (
                                    <Typography 
                                      sx={{ 
                                        color: '#6B7280',
                                        fontSize: '0.75rem',
                                        lineHeight: 1.5
                                      }}
                                    >
                                      {rec.reason}
                                    </Typography>
                                  )}
                                </Paper>
                              );
                            })}
                          </Box>
                        </>
                      )}

                      <Button 
                        onClick={handleCloseStressTest}
                        fullWidth
                        variant="contained"
                        sx={{
                          backgroundColor: '#8B5CF6',
                          color: '#ffffff',
                          borderRadius: '12px',
                          py: 2,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          textTransform: 'none',
                          boxShadow: 'none',
                          '&:hover': {
                            backgroundColor: '#7C3AED',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        Close Analysis
                      </Button>
                    </Box>
                  </Fade>
                )}
              </Box>
            </Fade>
          </Modal>

          {/* Account Settings Modal */}
          <Dialog 
            open={accountSettingsOpen} 
            onClose={() => setAccountSettingsOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #E5E7EB'
              }
            }}
          >
            <DialogTitle sx={{ 
              backgroundColor: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
              borderRadius: '16px 16px 0 0',
              pb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountCircleIcon sx={{ fontSize: 24, color: '#6B7280' }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1F2937',
                    fontSize: '1.125rem'
                  }}
                >
                  Account Settings
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3, mt: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography 
                  sx={{ 
                    color: '#6B7280', 
                    fontWeight: 500, 
                    mb: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  Email
                </Typography>
                <Typography 
                  sx={{ 
                    color: '#1F2937', 
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}
                >
                  {user?.email || 'Not available'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography 
                  sx={{ 
                    color: '#6B7280', 
                    fontWeight: 500, 
                    mb: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  Display Name
                </Typography>
                {editingName ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      size="small"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      disabled={nameLoading}
                      error={!!nameError}
                      helperText={nameError}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px'
                        }
                      }}
                    />
                    <IconButton
                      color="primary"
                      onClick={async () => {
                        setNameLoading(true);
                        setNameError('');
                        setNameSuccess('');
                        if (!editName.trim()) {
                          setNameError('Name cannot be empty');
                          setNameLoading(false);
                          return;
                        }
                        const { error } = await updateUserProfile({ displayName: editName });
                        if (error) {
                          setNameError(error.message || 'Failed to update name');
                        } else {
                          setNameSuccess('Name updated!');
                          setEditingName(false);
                        }
                        setNameLoading(false);
                      }}
                      disabled={nameLoading}
                      sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          backgroundColor: '#F3F4F6'
                        }
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setEditingName(false);
                        setEditName(userProfile?.displayName || userProfile?.name || '');
                        setNameError('');
                      }}
                      disabled={nameLoading}
                      sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          backgroundColor: '#F3F4F6'
                        }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      sx={{ 
                        color: '#1F2937', 
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        flex: 1
                      }}
                    >
                      {userProfile?.displayName || userProfile?.name || 'Not set'}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => { 
                        setEditingName(true); 
                        setNameSuccess(''); 
                      }}
                      sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          backgroundColor: '#F3F4F6'
                        }
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                    </IconButton>
                  </Box>
                )}
                {nameSuccess && (
                  <Typography 
                    sx={{ 
                      color: '#10B981', 
                      mt: 1,
                      fontSize: '0.75rem'
                    }}
                  >
                    {nameSuccess}
                  </Typography>
                )}
              </Box>

              {/* Editable Profile Fields */}
              <Box sx={{ mb: 3 }}>
                {!editingProfile ? (
                  <>
                    <Typography sx={{ color: '#6B7280', fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>Experience</Typography>
                    <Typography sx={{ color: '#1F2937', fontWeight: 500, mb: 2, fontSize: '0.875rem' }}>{experienceOptions.find(opt => opt.value === userProfile?.experience)?.label || 'Not set'}</Typography>
                    <Typography sx={{ color: '#6B7280', fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>Risk Tolerance</Typography>
                    <Typography sx={{ color: '#1F2937', fontWeight: 500, mb: 2, fontSize: '0.875rem' }}>{riskOptions.find(opt => opt.value === userProfile?.riskTolerance)?.label || 'Not set'}</Typography>
                    <Typography sx={{ color: '#6B7280', fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>Interests</Typography>
                    <Typography sx={{ color: '#1F2937', fontWeight: 500, mb: 2, fontSize: '0.875rem' }}>{Array.isArray(userProfile?.interests) && userProfile.interests.length > 0 ? userProfile.interests.join(', ') : 'Not set'}</Typography>
                    <Typography sx={{ color: '#6B7280', fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>Primary Goal</Typography>
                    <Typography sx={{ color: '#1F2937', fontWeight: 500, mb: 2, fontSize: '0.875rem' }}>{userProfile?.primaryGoal || 'Not set'}</Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingProfile(true);
                        setEditExperience(userProfile?.experience || '');
                        setEditRisk(userProfile?.riskTolerance || '');
                        setEditInterests(userProfile?.interests || []);
                        setEditGoal(userProfile?.primaryGoal || '');
                        setPrefsError('');
                        setPrefsSuccess('');
                      }}
                      sx={{ borderRadius: '8px', minWidth: 120, mt: 1 }}
                    >
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography sx={{ color: '#6B7280', fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>Experience</Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={editExperience}
                      onChange={e => setEditExperience(e.target.value)}
                      sx={{ mb: 2, borderRadius: '8px' }}
                    >
                      {experienceOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                    <Typography sx={{ color: '#6B7280', fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>Risk Tolerance</Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={editRisk}
                      onChange={e => setEditRisk(e.target.value)}
                      sx={{ mb: 2, borderRadius: '8px' }}
                    >
                      {riskOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                    <Typography sx={{ color: '#6B7280', fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>Interests</Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      SelectProps={{ multiple: true }}
                      value={editInterests}
                      onChange={e => setEditInterests(e.target.value)}
                      sx={{ mb: 2, borderRadius: '8px' }}
                    >
                      {interestOptions.map(opt => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </TextField>
                    <Typography sx={{ color: '#6B7280', fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>Primary Goal</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={editGoal}
                      onChange={e => setEditGoal(e.target.value)}
                      sx={{ mb: 2, borderRadius: '8px' }}
                      placeholder="e.g. Save for retirement, grow wealth, etc."
                    />
                    {prefsError && (
                      <Typography sx={{ color: '#EF4444', fontSize: '0.75rem', mb: 1 }}>{prefsError}</Typography>
                    )}
                    {prefsSuccess && (
                      <Typography sx={{ color: '#10B981', fontSize: '0.75rem', mb: 1 }}>{prefsSuccess}</Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={prefsLoading}
                        onClick={async () => {
                          setPrefsLoading(true);
                          setPrefsError('');
                          setPrefsSuccess('');
                          if (!editExperience || !editRisk || !editInterests.length || !editGoal.trim()) {
                            setPrefsError('Please fill out all fields.');
                            setPrefsLoading(false);
                            return;
                          }
                          const { error } = await updateUserProfile({
                            experience: editExperience,
                            riskTolerance: editRisk,
                            interests: editInterests,
                            primaryGoal: editGoal
                          });
                          if (error) {
                            setPrefsError(error.message || 'Failed to update profile');
                          } else {
                            setPrefsSuccess('Profile updated!');
                            setEditingProfile(false);
                          }
                          setPrefsLoading(false);
                        }}
                        sx={{ borderRadius: '8px', minWidth: 120 }}
                      >
                        {prefsLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outlined"
                        disabled={prefsLoading}
                        onClick={() => {
                          setEditExperience(userProfile?.experience || '');
                          setEditRisk(userProfile?.riskTolerance || '');
                          setEditInterests(userProfile?.interests || []);
                          setEditGoal(userProfile?.primaryGoal || '');
                          setPrefsError('');
                          setPrefsSuccess('');
                          setEditingProfile(false);
                        }}
                        sx={{ borderRadius: '8px', minWidth: 120 }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ 
                p: 2, 
                backgroundColor: '#FEF2F2', 
                borderRadius: '12px',
                border: '1px solid #FECACA'
              }}>
                <Typography 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#DC2626', 
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  <WarningIcon sx={{ fontSize: 16 }} />
                  Danger Zone
                </Typography>
                <Typography 
                  sx={{ 
                    color: '#6B7280', 
                    mb: 2,
                    fontSize: '0.75rem'
                  }}
                >
                  Once you delete your account, there is no going back.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteAccountOpen(true)}
                  startIcon={<DeleteIcon />}
                  sx={{
                    borderColor: '#EF4444',
                    color: '#EF4444',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#DC2626',
                      backgroundColor: 'rgba(239, 68, 68, 0.04)'
                    }
                  }}
                >
                  Delete Account
                </Button>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                onClick={() => setAccountSettingsOpen(false)}
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: '#8B5CF6',
                  color: '#ffffff',
                  borderRadius: '12px',
                  py: 2,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    boxShadow: 'none'
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Account Confirmation Dialog */}
          <Dialog 
            open={deleteAccountOpen} 
            onClose={() => {
              setDeleteAccountOpen(false);
              setDeleteAccountPassword('');
              setDeleteAccountError('');
            }}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #E5E7EB'
              }
            }}
          >
            <DialogTitle sx={{ 
              backgroundColor: '#FEF2F2',
              borderBottom: '1px solid #FECACA',
              borderRadius: '16px 16px 0 0',
              pb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon sx={{ fontSize: 24, color: '#DC2626' }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#DC2626',
                    fontSize: '1.125rem'
                  }}
                >
                  Delete Account
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
              <Typography 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1F2937', 
                  mb: 2,
                  fontSize: '1rem'
                }}
              >
                Are you absolutely sure?
              </Typography>
              <Typography 
                sx={{ 
                  color: '#6B7280', 
                  mb: 3,
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }}
              >
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography 
                  sx={{ 
                    color: '#1F2937', 
                    mb: 2, 
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  Enter your password to confirm:
                </Typography>
                <TextField
                  fullWidth
                  type="password"
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                  placeholder="Enter your password"
                  variant="outlined"
                  error={!!deleteAccountError}
                  helperText={deleteAccountError}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#F9FAFB',
                      '& fieldset': {
                        borderColor: '#E5E7EB'
                      },
                      '&:hover fieldset': {
                        borderColor: deleteAccountError ? '#EF4444' : '#D1D5DB'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: deleteAccountError ? '#EF4444' : '#8B5CF6'
                      }
                    }
                  }}
                />
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
              <Button
                onClick={() => {
                  setDeleteAccountOpen(false);
                  setDeleteAccountPassword('');
                  setDeleteAccountError('');
                }}
                variant="outlined"
                sx={{
                  flex: 1,
                  borderColor: '#E5E7EB',
                  color: '#6B7280',
                  borderRadius: '12px',
                  py: 2,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#D1D5DB',
                    backgroundColor: '#F9FAFB'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!deleteAccountPassword.trim()) {
                    setDeleteAccountError('Please enter your password');
                    return;
                  }
                  
                  setDeleteAccountError('');
                  setDeleteAccountLoading(true);
                  try {
                    const { error } = await deleteAccount({
                      email: user.email,
                      password: deleteAccountPassword
                    });
                    if (error) {
                      console.error('Error deleting account:', error);
                      if (error.code === 'auth/requires-recent-login') {
                        setDeleteAccountError('Your session has expired. Please enter your password to continue.');
                      } else if (error.code === 'auth/wrong-password') {
                        setDeleteAccountError('Incorrect password. Please try again.');
                      } else {
                        setDeleteAccountError(error.message || 'Failed to delete account. Please try again.');
                      }
                    } else {
                      navigate('/');
                    }
                  } catch (error) {
                    console.error('Unexpected error deleting account:', error);
                    setDeleteAccountError('An unexpected error occurred. Please try again.');
                  } finally {
                    setDeleteAccountLoading(false);
                  }
                }}
                variant="contained"
                disabled={deleteAccountLoading || !deleteAccountPassword.trim()}
                startIcon={deleteAccountLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
                sx={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  color: '#ffffff',
                  borderRadius: '12px',
                  py: 2,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#DC2626',
                    boxShadow: 'none'
                  },
                  '&:disabled': {
                    backgroundColor: '#D1D5DB',
                    color: '#9CA3AF'
                  }
                }}
              >
                {deleteAccountLoading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Fast Add Portfolio Modal */}
          <FastAddPortfolio
            open={fastAddPortfolioOpen}
            onClose={() => setFastAddPortfolioOpen(false)}
            onAddInvestments={handleAddInvestments}
            userProfile={userProfile}
          />

          <Footer />
        </Container>
      </Box>
    </>
  );
};

export default Dashboard;

