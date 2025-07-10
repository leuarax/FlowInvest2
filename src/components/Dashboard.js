import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortfolioAnalysis } from '../utils/openai';
import { savePortfolioAnalysis } from '../utils/firebase'; // <-- add this import
import { 
  Container, Box, Typography, Button, Grid, Paper, 
  CircularProgress, IconButton, Divider, Card, 
  CardContent, Modal, Fade, Backdrop, Tooltip,
  LinearProgress, Chip, Avatar, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import AnalyticsIcon from '@mui/icons-material/Analytics';

import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WarningIcon from '@mui/icons-material/Warning';
import Footer from './Footer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { interestOptions } from '../utils/constants';
import ExploreIcon from '@mui/icons-material/Explore';

import GradeProgressArc from './GradeProgressArc';
import FastAddPortfolio from './FastAddPortfolio';

console.log('Dashboard rendered');

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, getUserInvestments, updateUserProfile, deleteAccount, portfolioAnalysis, gradeHistory, setPortfolioAnalysis, saveInvestment } = useAuth(); // <-- add saveInvestment
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);
  const [stats, setStats] = useState({
    totalPortfolio: 0,
    avgROI: 0,
    avgRisk: 0,
    investmentCount: 0,
  });
  const [portfolioAnalysisLoading, setPortfolioAnalysisLoading] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [editingPrefs, setEditingPrefs] = useState(false);
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
  const [showAddMoreMessage, setShowAddMoreMessage] = useState(false);
  const [expandBannerDismissed, setExpandBannerDismissed] = useState(() => {
    // Check localStorage for persisted banner dismissal state
    const dismissed = localStorage.getItem('expandBannerDismissed');
    return dismissed === 'true';
  });
  
  // Check if user has already had an analysis (for cross-device consistency)
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
  const investmentRetryDelay = 2000; // 2 seconds

  


  const loadInvestments = useCallback(async (retryCount = 0) => {
    try {
      console.log('loadInvestments called, retry count:', retryCount);
      const { investments: firebaseInvestments } = await getUserInvestments();
      console.log('Firebase investments loaded:', firebaseInvestments);
      console.log('Firebase investments length:', firebaseInvestments?.length);
      // Always set investments, even if empty or undefined
      setInvestments(firebaseInvestments || []);
      if (firebaseInvestments && firebaseInvestments.length > 0) {
        const total = firebaseInvestments.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
        // Calculate yearly ROI, including annualized cashflow for real estate
        const avgROI = firebaseInvestments.reduce((acc, inv) => {
          let roi = parseFloat(String(inv.roiEstimate).replace(/[^0-9.-]+/g, ''));
          if (inv.type === 'Real Estate') {
            // Annualize ROI and add annualized cashflow as percent of amount
            const amount = parseFloat(inv.amount) || 1;
            const netCashflow = inv.cashflowAfterMortgage !== undefined && inv.cashflowAfterMortgage !== null
              ? parseFloat(inv.cashflowAfterMortgage)
              : (inv.cashflow !== undefined && inv.cashflow !== null ? parseFloat(inv.cashflow) : 0);
            const annualCashflow = netCashflow * 12;
            const cashflowROI = amount > 0 ? (annualCashflow / amount) * 100 : 0;
            roi = roi * 12 + cashflowROI;
          }
          return acc + (isNaN(roi) ? 0 : roi);
        }, 0) / firebaseInvestments.length;
        const avgRisk = firebaseInvestments.reduce((acc, inv) => acc + parseFloat(inv.riskScore), 0) / firebaseInvestments.length;

        setStats({
          totalPortfolio: total,
          avgROI,
          avgRisk,
          investmentCount: firebaseInvestments.length,
        });
      }
    } catch (error) {
      console.error('Error loading investments:', error);
    }
  }, [getUserInvestments]);

  // Define handleGetPortfolioAnalysis before using it in useMemo
  const handleGetPortfolioAnalysis = useCallback(async () => {
    setLoading(true); // Show spinner while analysis is running
    setPortfolioAnalysisLoading(true);
    setHasHadAnalysis(true); // Mark that user has had an analysis
    try {
      // Always fetch latest investments from backend
      const { investments: freshInvestments } = await getUserInvestments();
      if (!freshInvestments || freshInvestments.length === 0) {
        throw new Error('Failed to load investments for analysis.');
      }
      let currentInvestments = freshInvestments;
      // Validate userProfile
      if (!userProfile) {
        throw new Error('User profile not found. Please complete your profile first.');
      }
      if (!userProfile.experience || !userProfile.riskTolerance || !userProfile.interests || !userProfile.primaryGoal) {
        throw new Error('User profile is incomplete. Please complete your profile first.');
      }
      // Debug logs
      console.log('About to call getPortfolioAnalysis with:', {
        investmentsLength: currentInvestments.length,
        investments: currentInvestments,
        userProfile: userProfile
      });
      const analysis = await getPortfolioAnalysis(currentInvestments, userProfile);
      console.log('New analysis received:', analysis); // <-- log new analysis
      await savePortfolioAnalysis(user.uid, analysis); // <-- save to Firestore
      setPortfolioAnalysis(analysis); // <-- update context/UI immediately
      setPortfolioAnalysisModalOpen(true); // <-- open the modal with the new analysis
      // --- NEW: Update user profile to mark analysis as seen ---
      if (updateUserProfile && user && user.uid) {
        await updateUserProfile({ hasHadAnalysis: true, lastAnalysisDate: new Date().toISOString() });
      }
      // --- END NEW ---
      setTimeout(() => {
        // Log context value after update (may be async)
        console.log('Context portfolioAnalysis after set:', analysis);
      }, 100);
      setLoading(false); // Hide spinner when analysis is ready
    } catch (err) {
      console.error('Portfolio analysis error:', err);
      console.error('Error details:', {
        userProfile: !!userProfile,
        userProfileData: userProfile,
        errorMessage: err.message,
        errorStack: err.stack
      });
      setLoading(false); // Hide spinner on error
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
    // Do not setLoading(false) here
  }, [user, navigate, loadInvestments]);

  useEffect(() => {
    // Only set loading to false if investments have been loaded (not null/undefined)
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
          // Not all investments loaded yet, retry after delay
          setTimeout(() => {
            setInvestmentRetryCount((prev) => prev + 1);
            loadInvestments();
          }, investmentRetryDelay);
          return;
        }
      }
      setLoading(false);
    }
  }, [userProfile, investments, investmentRetryCount, loadInvestments]);

  // Check if user has had analysis before (for cross-device consistency)
  useEffect(() => {
    if (userProfile) {
      // Check if user has had an analysis before by looking at their profile
      // or by checking if they have any analysis-related data
      const hasAnalysisHistory = userProfile.hasHadAnalysis || userProfile.lastAnalysisDate;
      if (hasAnalysisHistory) {
        setHasHadAnalysis(true);
      }
    }
  }, [userProfile]);

  // Auto-trigger portfolio analysis on first load if user has investments and profile
  useEffect(() => {
    // Only auto-trigger if:
    // 1. Not loading
    // 2. First load
    // 3. Has investments
    // 4. Has user profile
    // 5. No current analysis
    // 6. Not currently loading
    // 7. Banner not dismissed locally AND user hasn't had analysis before
    if (!loading && isFirstLoad && investments.length > 0 && userProfile && !portfolioAnalysis && !portfolioAnalysisLoading && !expandBannerDismissed && !hasHadAnalysis) {
      console.log('Auto-triggering portfolio analysis on first load');
      setIsFirstLoad(false);
      // Set autoAnalysisComplete to true for first-time users
      setAutoAnalysisComplete(true);
      setHasHadAnalysis(true);
      handleGetPortfolioAnalysis();
    }
  }, [loading, isFirstLoad, investments, userProfile, portfolioAnalysis, portfolioAnalysisLoading, expandBannerDismissed, hasHadAnalysis, handleGetPortfolioAnalysis]);

  useEffect(() => {
    const needsAnalysis = localStorage.getItem('needsPortfolioAnalysis') === 'true';
    if (needsAnalysis && !portfolioAnalysisModalOpen) {
      handleGetPortfolioAnalysis().then(() => {
        setAutoAnalysisComplete(true);
      });
    } else {
      setAutoAnalysisComplete(true);
    }
  }, [portfolioAnalysisModalOpen, handleGetPortfolioAnalysis]);

  const handleOpenStressTest = () => setStressTestOpen(true);
  const handleCloseStressTest = () => {
    setStressTestOpen(false);
    // Don't reset stressTestAnalysis to preserve step 3 completion
    // setStressTestAnalysis(null);
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
      
      // Try local endpoint first
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
        
        // Try Vercel endpoint using the same domain as the current page
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
          throw new Error(`Both endpoints failed. Local: ${err.message}, Vercel: ${err2.message}`);
        }
      }
      
      // Handle the response
      if (data.analysis === 'Please enter a different scenario.') {
        setStressTestError(data.analysis);
        setStressTestAnalysis(null);
      } else if (data.analysis && typeof data.analysis === 'string' && data.analysis.includes('```json')) {
        // Parse JSON from markdown code block
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
        // Direct JSON response
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

  const statCards = [
    { 
      id: 'portfolio', 
      title: 'Total Portfolio', 
      value: `$${stats.totalPortfolio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: <AccountCircleIcon sx={{ fontSize: 28 }} />, 
    }
  ];



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

  useEffect(() => {
    const needsAnalysis = localStorage.getItem('needsPortfolioAnalysis') === 'true';
    if (needsAnalysis && !portfolioAnalysisModalOpen) {
      handleGetPortfolioAnalysis().then(() => {
        setAutoAnalysisComplete(true);
      });
    } else {
      setAutoAnalysisComplete(true);
    }
  }, [portfolioAnalysisModalOpen, handleGetPortfolioAnalysis]);

  if (!autoAnalysisComplete) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Analyzing your portfolio...</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  // Add a log in the Dashboard render
  console.log('Rendering Dashboard, portfolioAnalysis:', portfolioAnalysis);

  const handleClosePortfolioAnalysisModal = () => {
    setPortfolioAnalysisModalOpen(false);
    localStorage.removeItem('needsPortfolioAnalysis');
    console.log('Removed needsPortfolioAnalysis flag from localStorage');
  };

  const handleAddInvestments = async (selectedInvestments) => {
    try {
      console.log('Adding investments:', selectedInvestments);
      
      // Add each selected investment to the user's portfolio
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
          // Use the saveInvestment function from the auth context
          const { error } = await saveInvestment(investment);
          if (error) {
            throw new Error(`Failed to save investment ${investment.name}: ${error.message}`);
          }
        }
      }
      
      // Reload investments to show the new ones
      await loadInvestments();
      
      // Show success message
      console.log(`Successfully added ${selectedInvestments.length} investments`);
    } catch (error) {
      console.error('Error adding investments:', error);
      throw error; // Re-throw so the modal can handle the error
    }
  };

  return (
    <>
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}>
        <Container maxWidth="xl" sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
          {/* Logo - always visible at the top */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, mt: 2 }}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                fontWeight: 800,
                letterSpacing: '-0.02em',
                mb: 1,
                textShadow: '0 4px 20px rgba(0,0,0,0.1)',
                ml: 3
              }}
            >
              FlowInvest
            </Typography>
          </Box>
          
          {/* Only show dashboard content after initial loading and analysis is complete */}
          {!loading && (!isFirstLoad || !portfolioAnalysisLoading) && (
            <>
              {/* Expand Portfolio Banner */}
              {showAddMoreMessage && !expandBannerDismissed && (
                <Fade in={showAddMoreMessage}>
                  <Paper sx={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1.5px solid #764ba2',
                    borderRadius: '16px',
                    p: 4,
                    mt: 2,
                    mb: 4,
                    position: 'relative',
                    color: '#fff',
                  }}>
                    <IconButton
                      onClick={() => { 
                        setShowAddMoreMessage(false); 
                        setExpandBannerDismissed(true);
                        localStorage.setItem('expandBannerDismissed', 'true');
                      }}
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        color: '#fff',
                        '&:hover': {
                          background: 'rgba(102, 126, 234, 0.2)'
                        }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <AddIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
                        Expand Your Portfolio
                      </Typography>
                    </Box>
                    <Typography variant="body1" component="div" sx={{ color: '#f3f4f6', mb: 3, lineHeight: 1.7, fontWeight: 500 }}>
                      Great! You've seen your first portfolio analysis. To get even more comprehensive insights and recommendations, consider adding investments from other brokers and platforms. This will help our AI provide a complete picture of your financial portfolio.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '12px',
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          textTransform: 'none',
                          color: '#fff',
                          boxShadow: 3,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Add More Investments
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ExploreIcon />}
                        sx={{
                          borderColor: '#fff',
                          color: '#fff',
                          borderRadius: '12px',
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#fff',
                            color: '#764ba2',
                            background: 'rgba(255,255,255,0.15)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Explore
                      </Button>
                    </Box>
                  </Paper>
                </Fade>
              )}

              {/* Action Buttons - only visible if banner is not up */}
              {(!showAddMoreMessage || expandBannerDismissed) && (
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', mb: 4 }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleGetPortfolioAnalysis} 
                    disabled={!user || portfolioAnalysisLoading}
                    startIcon={portfolioAnalysisLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <AnalyticsIcon />}
                    sx={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      borderRadius: '12px',
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.2)',
                        borderColor: 'rgba(255,255,255,0.4)',
                        transform: 'translateY(-1px)'
                      },
                      '&:disabled': {
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.5)',
                        borderColor: 'rgba(255,255,255,0.1)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {portfolioAnalysisLoading ? 'Analyzing Portfolio...' : 'Analyze Portfolio'}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleOpenStressTest}
                    disabled={portfolioAnalysisLoading}
                    startIcon={<ChatIcon />}
                    sx={{
                      borderRadius: '12px',
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      boxShadow: '0 4px 20px rgba(240,147,251,0.15)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                        transform: 'translateY(-1px)'
                      },
                      '&:disabled': {
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)',
                        boxShadow: 'none',
                        transform: 'none'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Stress Test Your Portfolio
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/add-investment')}
                    sx={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      borderRadius: '12px',
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.2)',
                        borderColor: 'rgba(255,255,255,0.4)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Thinking about a new investment?
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setFastAddPortfolioOpen(true)}
                    sx={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      borderRadius: '12px',
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.2)',
                        borderColor: 'rgba(255,255,255,0.4)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Fast Add Portfolio
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/add-real-estate')}
                    sx={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      borderRadius: '12px',
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.2)',
                        borderColor: 'rgba(255,255,255,0.4)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Add Real Estate
                  </Button>
                </Box>
              )}

              {/* Stats Cards - always visible */}
              <Grid container spacing={3} sx={{ mb: 6 }}>
                {statCards.map((card, index) => (
                  <Grid item xs={12} sm={6} lg={3} key={card.id}>
                    <Paper
                      sx={{
                        background: card.gradient,
                        borderRadius: '20px',
                        p: 3,
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'default',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'none',
                          boxShadow: 'none',
                          background: card.gradient
                        },
                        '&:focus': {
                          outline: 'none',
                          boxShadow: 'none',
                          background: card.gradient
                        },
                        '&:active': {
                          outline: 'none',
                          boxShadow: 'none',
                          background: card.gradient
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(255,255,255,0.1)',
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        },
                        '&:hover::before': {
                          opacity: card.id === 'portfolio' ? 1 : 0
                        },
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: 2 }}>
                          <Avatar sx={{ 
                            background: 'rgba(255,255,255,0.2)', 
                            backdropFilter: 'blur(10px)',
                            color: 'white',
                            width: 48,
                            height: 48
                          }}>
                            {card.icon}
                          </Avatar>
                        </Box>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 700,
                            mb: 1,
                            fontSize: { xs: '1.5rem', sm: '2rem' }
                          }}
                        >
                          {card.value}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.8)',
                            fontWeight: 500,
                            fontSize: '0.9rem'
                          }}
                        >
                          {card.title}
                        </Typography>
                        {/* Add buttons for portfolio card */}
                        {card.id === 'portfolio' && (
                          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                            <Button
                              variant="outlined"
                              sx={{
                                flex: 1,
                                borderRadius: '8px',
                                fontWeight: 700,
                                textTransform: 'none',
                                background: 'white',
                                color: '#667eea',
                                border: '2px solid #667eea',
                                boxShadow: '0 2px 8px rgba(102,126,234,0.08)',
                                fontSize: '0.95rem',
                                letterSpacing: 0.2,
                                px: 1.5,
                                py: 0.5,
                                minWidth: 0,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  background: '#f3f6fd',
                                  boxShadow: '0 6px 18px rgba(102,126,234,0.18)',
                                  color: '#4f65c0',
                                  borderColor: '#4f65c0',
                                  transform: 'translateY(-2px) scale(1.03)',
                                },
                                '&:active': { background: 'transparent', boxShadow: 'none' },
                              }}
                              onClick={() => navigate('/portfolio')}
                            >
                              See Details
                            </Button>
                            <Button
                              variant="outlined"
                              color="success"
                              sx={{
                                flex: 1,
                                borderRadius: '12px',
                                fontWeight: 600,
                                textTransform: 'none',
                                background: `linear-gradient(135deg, rgba(102,126,234,0.55) 0%, rgba(118,75,162,0.55) 100%)`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 0,
                                border: '2.5px solid #9ca3af',
                                boxShadow: 'none',
                                minHeight: 0,
                                minWidth: 0,
                                width: 104,
                                height: 104,
                                maxWidth: 120,
                                maxHeight: 120,
                                '&:hover': { background: 'transparent', boxShadow: 'none' },
                                '&:active': { background: 'transparent', boxShadow: 'none' },
                                '&:focus': { background: 'transparent', boxShadow: 'none' },
                              }}
                              onClick={() => setPortfolioAnalysisModalOpen(true)}
                              disabled={!portfolioAnalysis}
                            >
                              <GradeProgressArc grade={portfolioAnalysis?.grade} size={116} fontSize={80} />
                              <Box sx={{ width: '100%', textAlign: 'center', mt: 0.4 }}>
                                <span style={{ fontSize: '0.72rem', color: '#e0e7ef', opacity: 0.8, fontWeight: 500 }}>
                                  Click to see more
                                </span>
                              </Box>
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Portfolio Analysis Modal */}
              {portfolioAnalysis && (
                <Modal
                  open={portfolioAnalysisModalOpen}
                  onClose={handleClosePortfolioAnalysisModal}
                  closeAfterTransition
                  BackdropComponent={Backdrop}
                  BackdropProps={{
                    timeout: 500,
                    sx: { backdropFilter: 'blur(10px)' }
                  }}
                >
                  <Fade in={portfolioAnalysisModalOpen}>
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: { xs: '98%', sm: '95%', md: 800 },
                      maxHeight: '95vh',
                      overflowY: 'auto',
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: { xs: '16px', sm: '24px' },
                      p: { xs: 2, sm: 3, md: 4 },
                      boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                    }}>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 700,
                          color: '#1e293b',
                          mb: { xs: 3, sm: 4 },
                          textAlign: 'center',
                          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                        }}
                      >
                        Portfolio Assessment
                      </Typography>
                      
                      <Grid container spacing={{ xs: 2, sm: 4 }} sx={{ alignItems: 'center', mb: { xs: 3, sm: 4 } }}>
                        <Grid item xs={12} md={4}>
                        <Box sx={{
      textAlign: 'center',
       width: { xs: 80, sm: 120, md: 180 },
       height: { xs: 80, sm: 120, md: 180 },
       display: 'flex',
       flexDirection: 'column',
       justifyContent: 'center',
       alignItems: 'center',
       mx: 'auto',
     }}>
                            <Typography
                              variant="h1"
                              sx={{
                                color: getGradeColor(portfolioAnalysis.grade),
                                fontWeight: 800,
                                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                                lineHeight: 1,
                                mb: 1,
                                overflow: 'visible',
                                textOverflow: 'clip',
                              }}
                            >
                              {portfolioAnalysis.grade || '—'}
                            </Typography>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                color: '#64748b',
                                fontWeight: 600,
                                fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.1rem' }
                              }}
                            >
                              Overall Grade
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={8}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                            Comprehensive Analysis
                          </Typography>
                          <Paper sx={{
                            background: 'rgba(248, 250, 252, 0.8)',
                            borderRadius: '12px',
                            p: 3,
                            border: '1px solid rgba(226, 232, 240, 0.8)'
                          }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                whiteSpace: 'pre-wrap',
                                color: '#475569',
                                lineHeight: 1.6
                              }}
                            >
                              {portfolioAnalysis.analysis}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 4 }} />

                      <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                        AI Recommendations
                      </Typography>
                      
                      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
                        {portfolioAnalysis.recommendations?.map((rec, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card sx={{
                              height: '100%',
                              borderRadius: '16px',
                              background: 'rgba(248, 250, 252, 0.8)',
                              border: '1px solid rgba(226, 232, 240, 0.8)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 12px 30px rgba(0,0,0,0.1)'
                              }
                            }}>
                              <CardContent sx={{ p: 3 }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    mb: 2
                                  }}
                                >
                                  {typeof rec === 'string' ? rec : (rec?.name || 'Recommendation')}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#64748b',
                                    lineHeight: 1.5
                                  }}
                                >
                                  {typeof rec === 'string' ? '' : (rec?.reason || '')}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                      
                      {/* Portfolio Progress Graph */}
                      {portfolioAnalysis.historicalValues && portfolioAnalysis.recommendedValues && (
                        <Box sx={{ mt: 6, mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, textAlign: 'center' }}>
                            Portfolio Progress (Last 5 Years, Indexed)
                          </Typography>
                          <ResponsiveContainer width="100%" height={280}>
                            <LineChart
                              data={(() => {
                                const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 5 + i);
                                const histStart = portfolioAnalysis.historicalValues[0] || 1;
                                const recStart = portfolioAnalysis.recommendedValues[0] || 1;
                                return years.map((year, idx) => ({
                                  year: year.toString(),
                                  yourPortfolio: histStart ? (portfolioAnalysis.historicalValues[idx] / histStart) * 100 : 0,
                                  withRecommendations: recStart ? (portfolioAnalysis.recommendedValues[idx] / recStart) * 100 : 0,
                                }));
                              })()}
                              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" />
                              <YAxis label={{ value: 'Indexed Value', angle: -90, position: 'insideLeft' }} />
                              <RechartsTooltip formatter={(value) => `${value.toFixed(1)}`}/>
                              <Legend />
                              <Line type="monotone" dataKey="yourPortfolio" name="Your Portfolio" stroke="#667eea" strokeWidth={3} dot={{ r: 4 }} />
                              <Line type="monotone" dataKey="withRecommendations" name="Your Portfolio with our recommendations" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      )}

                      {/* Grade History Graph */}
                      {Array.isArray(gradeHistory) && gradeHistory.length > 0 && (
                        <Box sx={{ mt: 6, mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2, textAlign: 'center' }}>
                            Grade History (30 days)
                          </Typography>
                          <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={gradeHistory.map(g => ({ ...g, num: g.grade?.charCodeAt(0) }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                              <YAxis dataKey="num" domain={[65, 70]} tickFormatter={v => String.fromCharCode(v)} ticks={[65, 66, 67, 68, 70]} />
                              <RechartsTooltip formatter={(v, n, p) => n === 'num' ? String.fromCharCode(v) : v} />
                              <Line type="monotone" dataKey="num" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button 
                          onClick={handleClosePortfolioAnalysisModal}
                          variant="contained"
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '12px',
                            px: 6,
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Close Analysis
                        </Button>
                      </Box>
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
                BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(10px)' } }}
              >
                <Fade in={stressTestOpen}>
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '98%', sm: '95%', md: 600 },
                    maxHeight: '95vh',
                    overflowY: 'auto',
                    background: 'rgba(255,255,255,0.97)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: { xs: '16px', sm: '24px' },
                    p: { xs: 2, sm: 3, md: 4 },
                    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 400
                  }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, textAlign: 'center' }}>
                      {stressTestAnalysis ? 'Scenario Analysis' : 'Stress Test Your Portfolio'}
                    </Typography>
                    {!stressTestAnalysis && (
                      <Paper sx={{ background: 'rgba(248,250,252,0.8)', borderRadius: '12px', p: 2, mb: 2, border: '1px solid rgba(226,232,240,0.8)' }}>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          Enter a market scenario (e.g., "2008-style crash", "interest rates rise by 3%", "tech sector collapse"). The AI will analyze how your portfolio would perform and suggest actions to help you.
                        </Typography>
                      </Paper>
                    )}
                    {!stressTestAnalysis && (
                      <>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                          <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            maxRows={6}
                            placeholder="Describe a scenario..."
                            value={stressTestInput}
                            onChange={e => setStressTestInput(e.target.value)}
                            disabled={stressTestLoading}
                            sx={{
                              background: 'rgba(248,250,252,0.8)',
                              borderRadius: '12px',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                background: 'rgba(248,250,252,0.8)'
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSendStressTest}
                            disabled={stressTestLoading || !stressTestInput.trim()}
                            startIcon={stressTestLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : null}
                            sx={{
                              borderRadius: '12px',
                              px: 3,
                              py: 1.5,
                              fontWeight: 600,
                              textTransform: 'none',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              boxShadow: '0 4px 20px rgba(102,126,234,0.15)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                transform: 'translateY(-1px)'
                              },
                              '&:disabled': {
                                background: 'rgba(100, 116, 139, 0.3)',
                                color: 'rgba(255,255,255,0.7)'
                              },
                              transition: 'all 0.3s ease',
                              minHeight: '48px'
                            }}
                          >
                            {stressTestLoading ? 'Analyzing...' : 'Analyze'}
                          </Button>
                        </Box>
                        {stressTestLoading && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            py: 4,
                            background: 'rgba(102, 126, 234, 0.05)',
                            borderRadius: '16px',
                            mb: 2
                          }}>
                            <CircularProgress 
                              size={60}
                              thickness={4}
                              sx={{ 
                                color: '#667eea',
                                mb: 2
                              }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                              Analyzing Scenario...
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              Our AI is evaluating your portfolio under this scenario
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                    {stressTestError && (
                      <Paper sx={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        p: 3,
                        mb: 2
                      }}>
                        <Typography sx={{ color: '#ef4444', fontWeight: 600 }}>
                          {stressTestError}
                        </Typography>
                      </Paper>
                    )}
                    {stressTestAnalysis && (
                      <Fade in={!!stressTestAnalysis}>
                        <Box>
                          {/* Analysis Card (similar to portfolio analysis) */}
                          <Grid container spacing={{ xs: 2, sm: 4 }} sx={{ alignItems: 'center', mb: { xs: 3, sm: 4 } }}>
                            <Grid item xs={12} md={4}>
                              <Box sx={{
                                textAlign: 'center',
                                p: { xs: 2, sm: 3 },
                                border: `3px solid ${getGradeColor(stressTestAnalysis.grade)}`,
                                borderRadius: '50%',
                                width: { xs: 120, sm: 150, md: 180 },
                                height: { xs: 120, sm: 150, md: 180 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                mx: 'auto',
                                background: `linear-gradient(135deg, ${getGradeColor(stressTestAnalysis.grade)}20, ${getGradeColor(stressTestAnalysis.grade)}10)`,
                                backdropFilter: 'blur(10px)'
                              }}>
                                <Typography 
                                  variant="h1" 
                                  sx={{ 
                                    color: getGradeColor(stressTestAnalysis.grade), 
                                    fontWeight: 800,
                                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                                    mb: 1
                                  }}
                                >
                                  {stressTestAnalysis.grade}
                                </Typography>
                                <Typography 
                                  variant="subtitle1" 
                                  sx={{ 
                                    color: '#64748b',
                                    fontWeight: 600,
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                  }}
                                >
                                  Overall Grade
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={8}>
                              <Paper sx={{
                                background: 'rgba(248, 250, 252, 0.8)',
                                borderRadius: '12px',
                                p: 3,
                                border: '1px solid rgba(226, 232, 240, 0.8)'
                              }}>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    whiteSpace: 'pre-wrap',
                                    color: '#475569',
                                    lineHeight: 1.6
                                  }}
                                >
                                  {stressTestAnalysis.analysis}
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                          <Divider sx={{ my: 4 }} />
                          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
                            <Grid item xs={12} sm={6} md={4}>
                              <Card sx={{
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '16px',
                                p: 2,
                                height: '100%',
                                textAlign: 'center'
                              }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                                    Risk Score
                                  </Typography>
                                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', mb: 1 }}>
                                    {stressTestAnalysis.riskScore || 'N/A'}/10
                                  </Typography>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={(stressTestAnalysis.riskScore || 0) * 10} 
                                    sx={{ 
                                      height: 12, 
                                      borderRadius: 6, 
                                      mb: 2,
                                      '& .MuiLinearProgress-bar': {
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                      }
                                    }} 
                                  />
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Card sx={{
                                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                                border: '1px solid rgba(168, 85, 247, 0.2)',
                                borderRadius: '16px',
                                p: 2,
                                height: '100%',
                                textAlign: 'center'
                              }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                                    ROI Estimate
                                  </Typography>
                                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#a855f7', mb: 1 }}>
                                    {stressTestAnalysis.roiEstimate ? `${stressTestAnalysis.roiEstimate}%` : 'N/A'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                                    Yearly ROI (expected)
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                              <Card sx={{
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '16px',
                                p: 2,
                                height: '100%',
                                textAlign: 'center'
                              }}>
                                <CardContent>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                                    ROI Scenarios
                                  </Typography>
                                  {stressTestAnalysis.roiScenarios ? (
                                    <Box>
                                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Pessimistic: <b>{stressTestAnalysis.roiScenarios.pessimistic}%</b>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Realistic: <b>{stressTestAnalysis.roiScenarios.realistic}%</b>
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                                        Optimistic: <b>{stressTestAnalysis.roiScenarios.optimistic}%</b>
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography sx={{ color: '#64748b' }}>Not available.</Typography>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          </Grid>
                          <Divider sx={{ my: 4 }} />
                          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                            AI Recommendations
                          </Typography>
                          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
                            {Array.isArray(stressTestAnalysis.recommendations) && stressTestAnalysis.recommendations.length > 0 ? (
                              stressTestAnalysis.recommendations.map((rec, idx) => {
                                const recName = typeof rec === 'string' ? rec : (rec?.name || 'Recommendation');
                                const isBuy = recName.toLowerCase().includes('buy');
                                const isSell = recName.toLowerCase().includes('sell');
                                return (
                                  <Grid item xs={12} sm={6} md={4} key={idx}>
                                    <Card sx={{
                                      height: '100%',
                                      borderRadius: '16px',
                                      background: 'rgba(248, 250, 252, 0.8)',
                                      border: `1px solid ${isBuy ? 'rgba(16, 185, 129, 0.3)' : isSell ? 'rgba(239, 68, 68, 0.3)' : 'rgba(226, 232, 240, 0.8)'}`,
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 12px 30px rgba(0,0,0,0.1)'
                                      }
                                    }}>
                                      <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                          <Chip 
                                            label={isBuy ? 'BUY' : isSell ? 'SELL' : 'ACTION'}
                                            size="small"
                                            sx={{ 
                                              background: isBuy ? 'rgba(16, 185, 129, 0.1)' : isSell ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                              color: isBuy ? '#10b981' : isSell ? '#ef4444' : '#64748b',
                                              fontWeight: 600,
                                              mr: 1
                                            }}
                                          />
                                        </Box>
                                        <Typography 
                                          variant="h6" 
                                          sx={{ 
                                            fontWeight: 600,
                                            color: '#1e293b',
                                            mb: 2,
                                            fontSize: '1rem'
                                          }}
                                        >
                                          {recName}
                                        </Typography>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            color: '#64748b',
                                            lineHeight: 1.5
                                          }}
                                        >
                                          {typeof rec === 'string' ? '' : (rec?.reason || '')}
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                );
                              })
                            ) : (
                              <Grid item xs={12}>
                                <Typography sx={{ color: '#64748b' }}>No recommendations available.</Typography>
                              </Grid>
                            )}
                          </Grid>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Button 
                              onClick={handleCloseStressTest}
                              variant="contained"
                              sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '12px',
                                px: 6,
                                py: 1.5,
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              Close Analysis
                            </Button>
                          </Box>
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
                maxWidth="md"
                fullWidth
                PaperProps={{
                  sx: {
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                <DialogTitle sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '24px 24px 0 0',
                  pb: 3
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountCircleIcon sx={{ fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Account Settings
                    </Typography>
                  </Box>
                </DialogTitle>
                
                <DialogContent sx={{ p: 4 }}>
                  <Grid container spacing={3}>
                    {/* Account Information */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                        Account Information
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                          Email Address
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>
                          {user?.email || 'Not available'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                          Password
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>
                          ••••••••••••••••
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
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
                              sx={{ minWidth: 180 }}
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
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => {
                                setEditingName(false);
                                setEditName(userProfile?.displayName || userProfile?.name || '');
                                setNameError('');
                              }}
                              disabled={nameLoading}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>
                              {userProfile?.displayName || userProfile?.name || 'Not set'}
                            </Typography>
                            <IconButton size="small" onClick={() => { setEditingName(true); setNameSuccess(''); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                        {nameSuccess && (
                          <Typography variant="body2" sx={{ color: '#10b981', mt: 1 }}>{nameSuccess}</Typography>
                        )}
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                          Account Created
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>
                          {userProfile?.createdAt ? new Date(userProfile.createdAt.toDate()).toLocaleDateString() : 'Not available'}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Investment Preferences */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 3, flex: 1 }}>
                          Investment Preferences
                        </Typography>
                        {!editingPrefs && (
                          <IconButton size="small" onClick={() => {
                            setEditingPrefs(true);
                            setPrefsSuccess('');
                            setPrefsError('');
                          }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      {editingPrefs ? (
                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            select
                            label="Experience Level"
                            value={editExperience}
                            onChange={e => setEditExperience(e.target.value)}
                            fullWidth
                          >
                            {experienceOptions.map(opt => (
                              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            label="Risk Tolerance"
                            value={editRisk}
                            onChange={e => setEditRisk(e.target.value)}
                            fullWidth
                          >
                            {riskOptions.map(opt => (
                              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            label="Investment Interests"
                            value={editInterests}
                            onChange={e => setEditInterests(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            SelectProps={{ multiple: true }}
                            fullWidth
                          >
                            {interestOptions.map(opt => (
                              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            label="Primary Goal"
                            value={editGoal}
                            onChange={e => setEditGoal(e.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                          />
                          {prefsError && <Typography color="error">{prefsError}</Typography>}
                          {prefsSuccess && <Typography color="success.main">{prefsSuccess}</Typography>}
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Button
                              variant="contained"
                              onClick={async () => {
                                setPrefsLoading(true);
                                setPrefsError('');
                                setPrefsSuccess('');
                                try {
                                  const { error } = await updateUserProfile({
                                    experience: editExperience,
                                    riskTolerance: editRisk,
                                    interests: editInterests,
                                    primaryGoal: editGoal
                                  });
                                  if (error) {
                                    setPrefsError(error.message || 'Failed to update preferences');
                                  } else {
                                    setPrefsSuccess('Preferences updated!');
                                    setEditingPrefs(false);
                                  }
                                } catch (err) {
                                  setPrefsError('Failed to update preferences');
                                }
                                setPrefsLoading(false);
                              }}
                              disabled={prefsLoading}
                            >
                              Save
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setEditingPrefs(false);
                                setEditExperience(userProfile?.experience || '');
                                setEditRisk(userProfile?.riskTolerance || '');
                                setEditInterests(userProfile?.interests || []);
                                setEditGoal(userProfile?.primaryGoal || '');
                                setPrefsError('');
                                setPrefsSuccess('');
                              }}
                              disabled={prefsLoading}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>Experience Level</Typography>
                            <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>{userProfile?.experience || 'Not set'}</Typography>
                          </Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>Risk Tolerance</Typography>
                            <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>{userProfile?.riskTolerance || 'Not set'}</Typography>
                          </Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>Investment Interests</Typography>
                            <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>{userProfile?.interests ? userProfile.interests.join(', ') : 'Not set'}</Typography>
                          </Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>Primary Goal</Typography>
                            <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>{userProfile?.primaryGoal || 'Not set'}</Typography>
                          </Box>
                        </>
                      )}
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 4 }} />

                  {/* Danger Zone */}
                  <Box sx={{ 
                    p: 3, 
                    background: 'rgba(239, 68, 68, 0.05)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#dc2626', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon sx={{ fontSize: 24 }} />
                      Danger Zone
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                      Once you delete your account, there is no going back. Please be certain.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteAccountOpen(true)}
                      startIcon={<DeleteIcon />}
                      sx={{
                        borderColor: '#ef4444',
                        color: '#ef4444',
                        '&:hover': {
                          borderColor: '#dc2626',
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
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
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
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                <DialogTitle sx={{ 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  borderRadius: '24px 24px 0 0',
                  pb: 3
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WarningIcon sx={{ fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Delete Account
                    </Typography>
                  </Box>
                </DialogTitle>
                
                <DialogContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                    Are you absolutely sure?
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </Typography>
                  <Box sx={{ 
                    p: 3, 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ This will delete:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                      • Your account and profile
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      • All your investments and portfolio data
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      • All your analysis and recommendations
                    </Typography>
                  </Box>
                  
                  {/* Password Input */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body1" sx={{ color: '#1e293b', mb: 2, fontWeight: 600 }}>
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
                          '&:hover fieldset': {
                            borderColor: deleteAccountError ? '#ef4444' : '#667eea'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: deleteAccountError ? '#ef4444' : '#667eea'
                          }
                        }
                      }}
                    />
                  </Box>
                </DialogContent>
                
                <DialogActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    onClick={() => {
                      setDeleteAccountOpen(false);
                      setDeleteAccountPassword('');
                      setDeleteAccountError('');
                    }}
                    variant="outlined"
                    sx={{
                      borderColor: '#64748b',
                      color: '#64748b',
                      borderRadius: '12px',
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#475569',
                        backgroundColor: 'rgba(100, 116, 139, 0.04)'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      // Validate password
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
                          // Account deleted successfully, redirect to landing page
                          // Force a page refresh to ensure auth state is properly cleared
                          window.location.href = '/';
                        }
                      } catch (error) {
                        console.error('Unexpected error deleting account:', error);
                        setDeleteAccountError('An unexpected error occurred. Please try again.');
                      } finally {
                        setDeleteAccountLoading(false);
                      }
                    }}
                    variant="contained"
                    color="error"
                    disabled={deleteAccountLoading || !deleteAccountPassword.trim()}
                    startIcon={deleteAccountLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '12px',
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                      },
                      '&:disabled': {
                        background: '#e2e8f0',
                        color: '#94a3b8'
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
              {/* Mobile Top-Right Account Button */}
              {!accountSettingsOpen && (
                <Box
                  sx={{
                    display: { xs: 'block', sm: 'none' },
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1000 // Lowered from 9999 to ensure it is behind popups and overlays
                  }}
                >
                  <Tooltip title="Account Settings">
                    <Button
                      variant="outlined"
                      onClick={() => setAccountSettingsOpen(true)}
                      sx={{
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white',
                        borderRadius: '50%',
                        minWidth: '48px',
                        width: '48px',
                        height: '48px',
                        p: 0,
                        boxShadow: 3,
                        '&:hover': {
                          background: 'rgba(255,255,255,0.2)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <AccountCircleIcon />
                    </Button>
                  </Tooltip>
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default Dashboard;
