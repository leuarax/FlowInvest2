import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortfolioAnalysis, analyzeInvestment } from '../utils/openai';
import { 
  Container, Box, Typography, Button, Grid, Paper, 
  CircularProgress, IconButton, Divider, Card, 
  CardContent, Modal, Fade, Backdrop, Tooltip,
  LinearProgress, Chip, Avatar, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WarningIcon from '@mui/icons-material/Warning';
import FastAddPortfolio from './FastAddPortfolio';
import Footer from './Footer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import AddRealEstate from './AddRealEstate';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { interestOptions } from '../utils/constants';

console.log('Dashboard rendered');

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, getUserInvestments, saveInvestment, deleteInvestment: deleteInvestmentFromFirebase, updateUserProfile, deleteAccount } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);
  const [stats, setStats] = useState({
    totalPortfolio: 0,
    avgROI: 0,
    avgRisk: 0,
    investmentCount: 0,
  });
  const [portfolioAnalysis, setPortfolioAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [fastAddOpen, setFastAddOpen] = useState(false);
  const [stressTestOpen, setStressTestOpen] = useState(false);
  const [stressTestInput, setStressTestInput] = useState('');
  const [stressTestLoading, setStressTestLoading] = useState(false);
  const [stressTestAnalysis, setStressTestAnalysis] = useState(null);
  const [stressTestError, setStressTestError] = useState('');
  const [realEstateOpen, setRealEstateOpen] = useState(false);
  const [portfolioAnalysisLoading, setPortfolioAnalysisLoading] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
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
  
  const showOnboardingProgress = useMemo(() => {
    if (!userProfile) return false;
    if (userProfile.onboardingCompleted) return false;
    if (!userProfile.onboardingSteps) return true;
    // Show if any step is not completed
    return [1,2,3].some(id => !userProfile.onboardingSteps[id]);
  }, [userProfile]);
  
  // Onboarding progress state

  const loadInvestments = useCallback(async () => {
    try {
      console.log('loadInvestments called');
      const { investments: firebaseInvestments, error } = await getUserInvestments();
      console.log('Firebase investments loaded:', firebaseInvestments);
      console.log('Firebase investments length:', firebaseInvestments?.length);
      
      if (error) {
        console.error('Error loading investments:', error);
        setError('Failed to load investments');
        return;
      }

      console.log('Setting investments state to:', firebaseInvestments);
      setInvestments(firebaseInvestments);

      // Calculate stats
      if (firebaseInvestments.length > 0) {
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

      // Onboarding updates are handled by separate useEffect
    } catch (error) {
      console.error('Error loading investments:', error);
      setError('Failed to load investments');
    }
  }, [getUserInvestments]);

  // Define handleGetPortfolioAnalysis before using it in useMemo
  const handleGetPortfolioAnalysis = useCallback(async () => {
    setPortfolioAnalysisLoading(true);
    setError('');
    setPortfolioAnalysis(null);
    try {
      console.log('Starting portfolio analysis with:', { 
        userProfile: !!userProfile, 
        investmentsCount: investments.length,
        investments: investments,
        userProfileData: userProfile
      });
      
      if (!userProfile) {
        throw new Error('User profile not found. Please complete onboarding first.');
      }
      
      // Additional validation
      if (!userProfile.experience || !userProfile.riskTolerance || !userProfile.interests || !userProfile.primaryGoal) {
        throw new Error('User profile is incomplete. Please complete your profile first.');
      }
      
      // Ensure investments are loaded before proceeding
      let currentInvestments = investments;
      if (investments.length === 0) {
        console.log('Investments not loaded yet, loading them first...');
        await loadInvestments();
        // Get investments directly from the function since state updates are async
        const { investments: freshInvestments } = await getUserInvestments();
        currentInvestments = freshInvestments;
        console.log('Investments loaded, count:', currentInvestments.length);
      }
      
      console.log('About to call getPortfolioAnalysis with:', {
        investmentsLength: currentInvestments.length,
        investments: currentInvestments,
        userProfile: userProfile
      });
      
      // Debug: Check if userProfile has required fields
      console.log('UserProfile validation:', {
        hasUserProfile: !!userProfile,
        experience: userProfile?.experience,
        riskTolerance: userProfile?.riskTolerance,
        interests: userProfile?.interests,
        primaryGoal: userProfile?.primaryGoal,
        fullUserProfile: userProfile
      });
      
      // Debug: Check investments structure
      console.log('Investments validation:', {
        investmentsLength: currentInvestments.length,
        investmentsType: typeof currentInvestments,
        isArray: Array.isArray(currentInvestments),
        firstInvestment: currentInvestments[0],
        allInvestments: currentInvestments
      });
      
      // Final debug before API call
      console.log('=== FINAL DEBUG BEFORE API CALL ===');
      console.log('investments:', currentInvestments);
      console.log('userProfile:', userProfile);
      console.log('investments.length:', currentInvestments.length);
      console.log('userProfile exists:', !!userProfile);
      console.log('userProfile type:', typeof userProfile);
      console.log('userProfile keys:', userProfile ? Object.keys(userProfile) : 'null');
      
      const analysis = await getPortfolioAnalysis(currentInvestments, userProfile);
      setPortfolioAnalysis(analysis);
      
      // Step 2 completion is handled by the useEffect that watches portfolioAnalysis
    } catch (err) {
      console.error('Portfolio analysis error:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setPortfolioAnalysisLoading(false);
    }
  }, [userProfile, investments, loadInvestments, getUserInvestments, setPortfolioAnalysisLoading, setError, setPortfolioAnalysis]);

  const defaultOnboardingSteps = useMemo(() => [
    { id: 1, title: 'Add Your First Investment', completed: false, action: () => setFastAddOpen(true) },
    { id: 2, title: 'Get Portfolio Analysis', completed: false, action: () => handleGetPortfolioAnalysis() },
    { id: 3, title: 'Explore Stress Testing', completed: false, action: () => setStressTestOpen(true) }
  ], [setFastAddOpen, handleGetPortfolioAnalysis, setStressTestOpen]);

  const [onboardingSteps, setOnboardingSteps] = useState(defaultOnboardingSteps);

  // --- 1. Always sync onboarding steps with Firestore if available ---
  useEffect(() => {
    if (userProfile && userProfile.onboardingSteps) {
      console.log('SYNC: userProfile.onboardingSteps:', userProfile.onboardingSteps);
      setOnboardingSteps(prev =>
        prev.map(step => ({
          ...step,
          completed: !!userProfile.onboardingSteps[String(step.id)]
        }))
      );
    }
  }, [userProfile]);

  // --- 2. Helper to update a step in Firestore ---
  const markStepCompletedInFirestore = useCallback(async (stepId) => {
    if (!user || !user.uid) return;
    const updatedSteps = {
      ...(userProfile?.onboardingSteps || {}),
      [stepId]: true
    };
    console.log(`ACTION: Marking step ${stepId} as complete in Firestore`, updatedSteps);
    await updateUserProfile({ onboardingSteps: updatedSteps });
  }, [user, userProfile, updateUserProfile]);

  // --- 3. When a step is completed, only update Firestore ---
  // Step 1: investments
  useEffect(() => {
    const alreadyCompleted = userProfile?.onboardingSteps && userProfile.onboardingSteps[1];
    if (showOnboardingProgress && investments.length > 0 && !alreadyCompleted) {
      console.log('EFFECT: Step 1 effect triggered, marking as complete');
      markStepCompletedInFirestore(1);
    }
  }, [investments, showOnboardingProgress, markStepCompletedInFirestore, userProfile]);

  // Step 2: portfolio analysis
  useEffect(() => {
    const alreadyCompleted = userProfile?.onboardingSteps && userProfile.onboardingSteps[2];
    if (showOnboardingProgress && portfolioAnalysis && !alreadyCompleted) {
      console.log('EFFECT: Step 2 effect triggered, marking as complete');
      markStepCompletedInFirestore(2);
    }
  }, [portfolioAnalysis, showOnboardingProgress, markStepCompletedInFirestore, userProfile]);

  // Step 3: stress test
  useEffect(() => {
    const alreadyCompleted = userProfile?.onboardingSteps && userProfile.onboardingSteps[3];
    if (showOnboardingProgress && stressTestAnalysis && !alreadyCompleted) {
      console.log('EFFECT: Step 3 effect triggered, marking as complete');
      markStepCompletedInFirestore(3);
    }
  }, [stressTestAnalysis, showOnboardingProgress, markStepCompletedInFirestore, userProfile]);

  // --- 4. When all steps are completed, set onboardingCompleted: true as before ---
  useEffect(() => {
    if (!showOnboardingProgress) return;
    const allCompleted = onboardingSteps.every(step => step.completed);
    if (allCompleted && !userProfile?.onboardingCompleted) {
      updateUserProfile({ onboardingCompleted: true });
      // Optionally, you could also clear onboardingSteps from Firestore here
    }
  }, [onboardingSteps, showOnboardingProgress, userProfile, updateUserProfile]);

  // --- LOG onboardingSteps before rendering progress bar ---
  useEffect(() => {
    console.log('RENDER: onboardingSteps state:', onboardingSteps);
  }, [onboardingSteps]);

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

  const getGradeGradient = (grade) => {
    if (!grade) return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
    const upperGrade = grade.toUpperCase();
    if (upperGrade.startsWith('A')) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (upperGrade.startsWith('B')) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    if (upperGrade.startsWith('C')) return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
    if (upperGrade.startsWith('D')) return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    if (upperGrade.startsWith('F')) return 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
    return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
  };

  // Helper function to format ROI values (handles both decimal and percentage formats)
  const formatROI = (value) => {
    if (value === undefined || value === null) return '0.0';
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    // If the value is less than 1, assume it's a decimal and multiply by 100
    const displayValue = Math.abs(numValue) < 1 ? numValue * 100 : numValue;
    return displayValue.toFixed(1);
  };

  const handleAddInvestments = async (newInvestments) => {
    try {
      // Process each new investment to ensure required fields and get analysis
      const processedInvestments = await Promise.all(newInvestments.map(async (inv) => {
        // Basic investment data
        const baseInvestment = {
          ...inv,
          // Ensure required fields have default values
          amount: parseFloat(inv.amount) || 0,
          roiEstimate: inv.roiEstimate || 0,
          riskScore: inv.riskScore || 5,
          grade: inv.grade || 'B',
          date: inv.date || new Date().toISOString().split('T')[0],
        };

        try {
          // Get analysis for the investment
          const analysis = await analyzeInvestment(
            {
              ...baseInvestment,
              type: inv.type || 'Stock',
              name: inv.name || 'Unnamed Investment',
              duration: 'Long-term' // Default duration for analysis
            },
            userProfile
          );
          
          // Merge the analysis with the base investment
          return {
            ...baseInvestment,
            roiScenarios: analysis.roiScenarios || {
              pessimistic: baseInvestment.roiEstimate * 0.8,
              realistic: baseInvestment.roiEstimate,
              optimistic: baseInvestment.roiEstimate * 1.2
            },
            roiEstimate: analysis.roiEstimate || baseInvestment.roiEstimate,
            riskScore: analysis.riskScore || baseInvestment.riskScore,
            grade: analysis.grade || baseInvestment.grade,
            explanation: analysis.explanation || 'Automatically analyzed investment'
          };
        } catch (analysisError) {
          console.error('Error analyzing investment:', analysisError);
          // If analysis fails, use default values
          return {
            ...baseInvestment,
            roiScenarios: {
              pessimistic: baseInvestment.roiEstimate * 0.8,
              realistic: baseInvestment.roiEstimate,
              optimistic: baseInvestment.roiEstimate * 1.2
            },
            explanation: 'Automatically added investment (analysis not available)'
          };
        }
      }));

      // Save each investment to Firebase
      for (const investment of processedInvestments) {
        const { error } = await saveInvestment(investment);
        if (error) {
          console.error('Error saving investment:', error);
        }
      }

      // Reload investments from Firebase
      await loadInvestments();
      
    } catch (error) {
      console.error('Error adding investments:', error);
      setError('Failed to add investments. Please try again.');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // User exists, load investments
    loadInvestments().finally(() => {
      setLoading(false);
    });
  }, [user, navigate, loadInvestments]);

  const handleOpenModal = (investment) => {
    setSelectedInvestment(investment);
  };

  const handleCloseModal = () => {
    setSelectedInvestment(null);
  };

  const deleteInvestment = async (investment) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        // Delete from Firebase
        const { error } = await deleteInvestmentFromFirebase(investment.id);
        if (error) {
          console.error('Error deleting investment:', error);
          setError('Failed to delete investment');
          return;
        }

        // Remove from local state
        const updatedInvestments = investments.filter(
          inv => inv.id !== investment.id
        );
        setInvestments(updatedInvestments);
        
        // Recalculate stats
        if (updatedInvestments.length > 0) {
          const total = updatedInvestments.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
          const avgROI = updatedInvestments.reduce((acc, inv) => acc + parseFloat(inv.roiEstimate), 0) / updatedInvestments.length;
          const avgRisk = updatedInvestments.reduce((acc, inv) => acc + parseFloat(inv.riskScore), 0) / updatedInvestments.length;

          setStats({
            totalPortfolio: total,
            avgROI,
            avgRisk,
            investmentCount: updatedInvestments.length,
          });
        } else {
          setStats({
            totalPortfolio: 0,
            avgROI: 0,
            avgRisk: 0,
            investmentCount: 0,
          });
        }
      } catch (error) {
        console.error('Error deleting investment:', error);
        setError('Failed to delete investment');
      }
    }
  };

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
            
            // Update onboarding progress to mark step 3 as complete
            // if (showOnboardingProgress) {
            //   updateOnboardingProgress(investments);
            // }
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
        
        // Update onboarding progress to mark step 3 as complete
        // if (showOnboardingProgress) {
        //   updateOnboardingProgress(investments);
        // }
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
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 28 }} />,
    },
    { 
      id: 'roi', 
      title: 'Avg Yearly ROI', 
      value: `${stats.avgROI.toFixed(1)}%`, 
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
    },
    { 
      id: 'risk', 
      title: 'Avg Risk', 
      value: `${stats.avgRisk.toFixed(1)}/10`, 
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: <SecurityIcon sx={{ fontSize: 28 }} />,
    },
    { 
      id: 'investments', 
      title: 'Investments', 
      value: stats.investmentCount, 
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      icon: <AssessmentIcon sx={{ fontSize: 28 }} />,
    },
  ];

  // --- LOG onboardingSteps before rendering progress bar ---
  useEffect(() => {
    console.log('RENDER: onboardingSteps state:', onboardingSteps);
  }, [onboardingSteps]);

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

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
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
      {/* Loading Screen */}
      {loading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          zIndex: 9999,
          backdropFilter: 'blur(10px)'
        }}>
          <CircularProgress 
            size={80}
            thickness={4}
            sx={{
              color: 'white',
              mb: 3,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'white',
              fontWeight: 600,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              px: 3,
              py: 1
            }}
          >
            Loading your portfolio...
          </Typography>
        </Box>
      )}

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: 4, pb: 6, flex: 1 }}>
        {/* Header Section */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            mb: 4
          }}>
            <Box>
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
                  textShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                FlowInvest
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  fontWeight: 400
                }}
              >
                Welcome back, {userProfile?.displayName || userProfile?.name || 'Investor'}!
              </Typography>
            </Box>
            
            {/* Quick Actions - unified row for all screen sizes */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Tooltip title="Quickly add multiple investments from a screenshot">
                <Button 
                  variant="contained" 
                  onClick={() => setFastAddOpen(true)}
                  startIcon={<SpeedIcon />}
                  sx={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '16px',
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.25)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    },
                    transition: 'all 0.3s ease',
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Fast Add Portfolio
                </Button>
              </Tooltip>
              
              <Button
                variant="contained"
                onClick={() => setRealEstateOpen(true)}
                startIcon={<HomeIcon />}
                sx={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '16px',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.25)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  },
                  transition: 'all 0.3s ease',
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Add Real Estate
              </Button>

              <Tooltip title="Account Settings">
                <Button
                  variant="outlined"
                  onClick={() => setAccountSettingsOpen(true)}
                  startIcon={<AccountCircleIcon />}
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    borderRadius: '16px',
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.2)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    },
                    transition: 'all 0.3s ease',
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Your Account
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Onboarding Progress Bar - Only show for new users */}
          {showOnboardingProgress && (
            <Box sx={{ 
              mb: 4,
              p: 3
            }}>
              <Typography variant="h6" sx={{ 
                color: 'white', 
                fontWeight: 600, 
                mb: 3,
                textAlign: 'center'
              }}>
                🚀 Welcome to FlowInvest! Let's get you started
              </Typography>
              
              {/* Show error if there is one */}
              {error && (
                <Box sx={{ 
                  mb: 3,
                  p: 2,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px'
                }}>
                  <Typography variant="body2" sx={{ 
                    color: 'white',
                    fontWeight: 500
                  }}>
                    ⚠️ {error}
                  </Typography>
                </Box>
              )}
              
              {/* Progress Bar: Steps packaged together */}
              <Box sx={{
                position: 'relative',
                mb: 4,
                px: 2,
                pt: 1,
                pb: 2
              }}>
                {/* Progress Line (behind dots) */}
                <Box sx={{
                  position: 'absolute',
                  top: 28, // center of dot (dot is 40px, margin-bottom 16px)
                  left: 'calc(80px)', // half step width
                  right: 'calc(80px)', // half step width
                  height: 3,
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  zIndex: 1
                }} />
                {/* Completed Progress Line */}
                <Box sx={{
                  position: 'absolute',
                  top: 28,
                  left: 'calc(80px)',
                  height: 3,
                  background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                  borderRadius: 2,
                  zIndex: 2,
                  transition: 'width 0.5s ease',
                  width: `calc(${(onboardingSteps.filter(step => step.completed).length - 1) / (onboardingSteps.length - 1) * 100}% * (100% - 160px))`
                }} />
                {/* Steps: dot + text packaged together */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  position: 'relative',
                  zIndex: 3
                }}>
                  {onboardingSteps.map((step, index) => {
                    const isPreviousStepCompleted = index === 0 || onboardingSteps[index - 1].completed;
                    const isStepDisabled = !step.completed && !isPreviousStepCompleted;
                    return (
                      <Box key={step.id} sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: 160,
                        minWidth: 0
                      }}>
                        {/* Dot */}
                        <Box
                          onClick={!step.completed && isPreviousStepCompleted ? step.action : undefined}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: step.completed 
                              ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                              : isStepDisabled
                              ? 'rgba(255,255,255,0.2)'
                              : 'rgba(255,255,255,0.3)',
                            border: step.completed 
                              ? '3px solid #10b981'
                              : isStepDisabled
                              ? '3px solid rgba(255,255,255,0.1)'
                              : '3px solid rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: step.completed 
                              ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                              : 'none',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            color: 'white',
                            mb: 2,
                            cursor: step.completed || isStepDisabled ? 'default' : 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': !step.completed && !isStepDisabled ? {
                              transform: 'scale(1.08)'
                            } : {},
                            position: 'relative',
                            '&::before': step.completed ? {
                              content: '"✓"',
                              color: 'white',
                              fontSize: '18px',
                              fontWeight: 'bold'
                            } : {
                              content: `"${step.id}"`,
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }
                          }}
                        />
                        {/* Step Title */}
                        <Typography variant="body2" sx={{ 
                          color: 'white',
                          fontWeight: 500,
                          textAlign: 'center',
                          textDecoration: step.completed ? 'line-through' : 'none',
                          opacity: step.completed ? 0.7 : isStepDisabled ? 0.5 : 1,
                          fontSize: '1rem',
                          lineHeight: 1.3,
                          mb: 0.5
                        }}>
                          {step.title}
                        </Typography>
                        {/* Step Description */}
                        {!step.completed && (
                          <Typography variant="caption" sx={{ 
                            color: isStepDisabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)',
                            textAlign: 'center',
                            mt: 0.5,
                            fontSize: '0.85rem',
                            lineHeight: 1.2,
                            wordBreak: 'break-word'
                          }}>
                            {isStepDisabled ? 'Complete previous step first' : 'Click to get started'}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', mb: 2 }}>
            <Button 
              variant="outlined" 
              onClick={handleGetPortfolioAnalysis} 
              disabled={investments.length === 0 || portfolioAnalysisLoading}
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
              disabled={!portfolioAnalysis && !(userProfile?.onboardingSteps && userProfile.onboardingSteps[2])}
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
          </Box>
        </Box>

        <FastAddPortfolio 
          open={fastAddOpen} 
          onClose={() => setFastAddOpen(false)}
          onAddInvestments={handleAddInvestments}
        />

        {/* Add Real Estate Modal */}
        {realEstateOpen && (
          <AddRealEstate 
            onInvestmentAdded={(investments) => {
              // Removed updateOnboardingProgress call
              setRealEstateOpen(false);
            }}
          />
        )}

        {/* Stats Cards */}
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
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
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
                    opacity: 1
                  }
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
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Investments Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              color: 'white',
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '1.8rem', sm: '2.2rem' }
            }}
          >
            Your Investment Portfolio
          </Typography>

          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '200px'
            }}>
              <CircularProgress 
                sx={{ color: 'white' }}
                size={60}
                thickness={4}
              />
            </Box>
          ) : investments.length === 0 ? (
            <Paper sx={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '20px',
              p: 6,
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                No investments yet
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Start building your portfolio by adding your first investment
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {investments.map((investment, index) => (
                <Grid item xs={12} sm={6} lg={4} key={`${investment.name}-${index}`}>
                  <Paper
                    onClick={() => handleOpenModal(investment)}
                    sx={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '20px',
                      p: 3,
                      height: '100%',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        background: 'rgba(255,255,255,0.15)'
                      }
                    }}
                  >
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); deleteInvestment(investment); }}
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        zIndex: 3,
                        '&:hover': {
                          background: 'rgba(239, 68, 68, 0.3)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>

                    {/* Grade Badge */}
                    <Box sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: getGradeGradient(investment.grade),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: '1.5rem',
                          color: 'white',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      >
                        {investment.grade || '-'}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 10 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '1.1rem'
                        }}
                      >
                        {investment.name}
                      </Typography>
                      
                      <Chip 
                        label={investment.type}
                        size="small"
                        sx={{
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 500,
                          mb: 2,
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                      />

                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.7)',
                            mb: 0.5
                          }}
                        >
                          Investment Amount
                        </Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: 'white',
                            fontWeight: 600
                          }}
                        >
                          ${parseFloat(investment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.7)',
                            mb: 0.5
                          }}
                        >
                          Expected ROI
                        </Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#10b981',
                            fontWeight: 600
                          }}
                        >
                          {formatROI(investment.roiEstimate)}%
                        </Typography>
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255,255,255,0.7)'
                            }}
                          >
                            Risk Level
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'white',
                              fontWeight: 600
                            }}
                          >
                            {investment.riskScore}/10
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(investment.riskScore / 10) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              background: investment.riskScore > 7 
                                ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                                : investment.riskScore > 4
                                ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                                : 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Investment Detail Modal */}
        {selectedInvestment && (
          <Modal
            open={!!selectedInvestment}
            onClose={handleCloseModal}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
              timeout: 500,
              sx: { backdropFilter: 'blur(10px)' }
            }}
          >
            <Fade in={!!selectedInvestment}>
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '95%', sm: '90%', md: 700 },
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '24px',
                p: { xs: 3, sm: 4 },
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: getGradeGradient(selectedInvestment.grade),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 3,
                    border: '3px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '2rem',
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}
                    >
                      {selectedInvestment.grade}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography 
                      variant="h4" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#1e293b',
                        mb: 1,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {selectedInvestment.name}
                    </Typography>
                    <Chip 
                      label={selectedInvestment.type}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Box>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '16px',
                      p: 3,
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        Investment Amount
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        ${parseFloat(selectedInvestment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '16px',
                      p: 3,
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        Expected ROI
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {formatROI(selectedInvestment.roiEstimate)}%
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{
                      background: selectedInvestment.riskScore > 7 
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                        : selectedInvestment.riskScore > 4
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '16px',
                      p: 3,
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        Risk Score
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {selectedInvestment.riskScore}/10
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Cashflow Analysis Card (only for real estate with cashflow data) */}
                {selectedInvestment.type === 'Real Estate' && (selectedInvestment.cashflow || selectedInvestment.cashflowAfterMortgage) && (
                  <Grid item xs={12}>
                    <Paper sx={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      borderRadius: '16px',
                      p: 3,
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        Monthly Cashflow
                      </Typography>
                      <Grid container spacing={2} justifyContent="center">
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                            Gross Monthly Cashflow
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {selectedInvestment.cashflow ? `€${parseFloat(selectedInvestment.cashflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                            Net Cashflow After Mortgage
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {selectedInvestment.cashflowAfterMortgage ? `€${parseFloat(selectedInvestment.cashflowAfterMortgage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {selectedInvestment.roiScenarios && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>
                      ROI Scenarios
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                            Pessimistic
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 700 }}>
                            {formatROI(selectedInvestment.roiScenarios.pessimistic)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                            Realistic
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                            {formatROI(selectedInvestment.roiScenarios.realistic)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontWeight: 600 }}>
                            Optimistic
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>
                            {formatROI(selectedInvestment.roiScenarios.optimistic)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {selectedInvestment.explanation && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                      AI Analysis
                    </Typography>
                    <Paper sx={{
                      background: 'rgba(248, 250, 252, 0.8)',
                      borderRadius: '12px',
                      p: 3,
                      border: '1px solid rgba(226, 232, 240, 0.8)'
                    }}>
                      <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.6 }}>
                        {selectedInvestment.explanation}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button 
                    onClick={handleCloseModal}
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      px: 4,
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
                    Close
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Modal>
        )}

        {/* Portfolio Analysis Modal */}
        {portfolioAnalysis && (
          <Modal
            open={!!portfolioAnalysis}
            onClose={() => setPortfolioAnalysis(null)}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
              timeout: 500,
              sx: { backdropFilter: 'blur(10px)' }
            }}
          >
            <Fade in={!!portfolioAnalysis}>
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '95%', sm: '90%', md: 800 },
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '24px',
                p: { xs: 3, sm: 4 },
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
              }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#1e293b',
                    mb: 4,
                    textAlign: 'center'
                  }}
                >
                  Portfolio Assessment
                </Typography>
                
                <Grid container spacing={4} sx={{ alignItems: 'center', mb: 4 }}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{
                      textAlign: 'center',
                      p: 3,
                      border: `3px solid ${getGradeColor(portfolioAnalysis.grade)}`,
                      borderRadius: '50%',
                      width: 180,
                      height: 180,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      mx: 'auto',
                      background: `linear-gradient(135deg, ${getGradeColor(portfolioAnalysis.grade)}20, ${getGradeColor(portfolioAnalysis.grade)}10)`,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <Typography 
                        variant="h1" 
                        sx={{ 
                          color: getGradeColor(portfolioAnalysis.grade), 
                          fontWeight: 800,
                          fontSize: '3rem',
                          mb: 1
                        }}
                      >
                        {portfolioAnalysis.grade}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: '#64748b',
                          fontWeight: 600
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
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {portfolioAnalysis.recommendations?.map((rec, index) => (
                    <Grid item xs={12} md={4} key={index}>
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
                            {rec.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#64748b',
                              lineHeight: 1.5
                            }}
                          >
                            {rec.reason}
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
                    <ResponsiveContainer width="100%" height={320}>
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

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    onClick={() => setPortfolioAnalysis(null)}
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
              width: { xs: '95%', sm: '90%', md: 600 },
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '24px',
              p: { xs: 2, sm: 4 },
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
                    <Grid container spacing={4} sx={{ alignItems: 'center', mb: 4 }}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{
                          textAlign: 'center',
                          p: 3,
                          border: `3px solid ${getGradeColor(stressTestAnalysis.grade)}`,
                          borderRadius: '50%',
                          width: 180,
                          height: 180,
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
                              fontSize: '3rem',
                              mb: 1
                            }}
                          >
                            {stressTestAnalysis.grade}
                          </Typography>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              color: '#64748b',
                              fontWeight: 600
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
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} sm={4}>
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
                      <Grid item xs={12} sm={4}>
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
                      <Grid item xs={12} sm={4}>
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
                    <Grid container spacing={2} sx={{ mb: 4 }}>
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
                                    {typeof rec === 'string' ? '' : (rec?.reason || rec || '')}
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

        {/* Error Display - Only show actual errors, not onboarding messages */}
        {error && !error.includes('profile needs to be set up') && (
          <Paper sx={{
            background: 'rgba(239, 68, 68, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            p: 3,
            mt: 4
          }}>
            <Typography sx={{ color: '#ef4444', fontWeight: 600 }}>
              Error: {error}
            </Typography>
          </Paper>
        )}
      </Container>

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
        onClose={() => setDeleteAccountOpen(false)}
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
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setDeleteAccountOpen(false)}
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
              setDeleteAccountLoading(true);
              try {
                const { error } = await deleteAccount();
                if (error) {
                  console.error('Error deleting account:', error);
                  // You might want to show an error message here
                } else {
                  // Account deleted successfully, user will be redirected to login
                  navigate('/');
                }
              } catch (error) {
                console.error('Unexpected error deleting account:', error);
              } finally {
                setDeleteAccountLoading(false);
                setDeleteAccountOpen(false);
              }
            }}
            variant="contained"
            color="error"
            disabled={deleteAccountLoading}
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
      
      <Footer />

      {/* Mobile Top-Right Account Button */}
      {!accountSettingsOpen && (
        <Box
          sx={{
            display: { xs: 'block', sm: 'none' },
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 9999
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
    </Box>
  );
};

export default Dashboard;
