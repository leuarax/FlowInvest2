import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button,
  Grid, Paper, CircularProgress, Alert, LinearProgress,
  Chip, Fade, Dialog, DialogTitle, DialogContent, IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Utility function to determine color based on grade
const getGradeColor = (grade) => {
  if (!grade) return '#6B7280';
  const upperGrade = grade.toUpperCase();
  if (upperGrade.startsWith('A')) return '#10B981';
  if (upperGrade.startsWith('B')) return '#F59E0B';
  if (upperGrade.startsWith('C')) return '#F97316';
  if (upperGrade.startsWith('D')) return '#EF4444';
  if (upperGrade.startsWith('F')) return '#DC2626';
  return '#6B7280';
};

const InvestmentForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // State for screenshot input
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Add state for showing the sample screenshot modal
  const [sampleOpen, setSampleOpen] = useState(false);

  const navigate = useNavigate();

  // Simulate analysis progress (in a real app, this would come from the server)
  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2; // Fixed increment instead of random
      if (progress >= 90) { // Stop at 90% to let the actual response complete it
        progress = 90;
        clearInterval(interval);
      }
      setAnalysisProgress(progress);
    }, 200);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAnalysisProgress(0);
    simulateProgress();

    if (!file) {
      setError('Please upload a screenshot.');
      setLoading(false);
      return;
    }

    const apiFormData = new FormData();
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    apiFormData.append('userProfile', JSON.stringify(userProfile));
    apiFormData.append('additionalNotes', additionalNotes);
    apiFormData.append('screenshot', file);

    try {
      let res;
      try {
        res = await fetch('http://localhost:3001/api/screenshot', {
          method: 'POST',
          body: apiFormData,
        });
      } catch (err) {
        console.log('Local server failed, trying production URL...', err);
        try {
          res = await fetch('/api/screenshot', {
            method: 'POST',
            body: apiFormData,
          });
        } catch (prodErr) {
          console.log('Production URL failed, trying Vercel fallback...', prodErr);
          res = await fetch('https://flow-invest2-hpr3.vercel.app/api/screenshot', {
            method: 'POST',
            body: apiFormData,
          });
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.message || errData.error || `HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      console.log('Analysis result:', result);
      
      // Handle both single object and array responses
      if (Array.isArray(result) && result.length > 0) {
        // If it's an array, take the first investment
        setAnalysis(result[0]);
      } else if (typeof result === 'object' && result !== null) {
        // If it's a single object
        setAnalysis(result);
      } else {
        throw new Error('Invalid analysis result received from server');
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysisProgress(100); // Complete the progress bar
      
      // Check if it's a screenshot analysis error
      if (err.message && (err.message.includes('Screenshot Analysis Failed') || 
                          err.message.includes('unable to process') ||
                          err.message.includes('unable to extract') ||
                          err.message.includes('does not contain clear investment information'))) {
        setError('AI couldn\'t analyse your image. Choose a screenshot similar to the sample with only one investment visible.');
      } else {
        setError(err.message || 'An unknown error occurred during analysis.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  return (
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

        {/* Main Content */}
        <Grid container spacing={4} sx={{ flex: 1, minHeight: 0 }}>
          {/* Left Side: Input Form - Only show when no analysis */}
          {!analysis && (
            <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Paper sx={{ 
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                p: 3,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                flex: 1
              }}>
              {/* New Heading and Subtext */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Thinking about a new investment?
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, color: '#374151' }}>
                  Check its potential by uploading a screenshot from your broker
                </Typography>
                <Button
                  variant="text"
                  startIcon={<HelpOutlineIcon />}
                  sx={{
                    color: '#667eea',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    mb: 1,
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.08)'
                    }
                  }}
                  onClick={() => setSampleOpen(true)}
                >
                  See a sample screenshot
                </Button>
              </Box>
              {/* Sample Screenshot Modal */}
              <Dialog open={sampleOpen} onClose={() => setSampleOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                  <span>Sample Screenshot</span>
                  <IconButton onClick={() => setSampleOpen(false)} size="small">
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                  <img
                    src="/sample-investment-screenshot.jpg"
                    alt="Sample screenshot"
                    style={{ maxWidth: '100%', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
                  />
                </DialogContent>
              </Dialog>

              <Grid container spacing={2}>
                {/* Upload Section */}
                <Grid item xs={12}>
                  <Box sx={{
                    border: '2px dashed #D1D5DB',
                    borderRadius: '12px',
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    '&:hover': {
                      borderColor: '#9CA3AF'
                    }
                  }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="screenshot-upload"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="screenshot-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        disabled={loading}
                        sx={{
                          backgroundColor: '#8B5CF6',
                          color: '#ffffff',
                          borderRadius: '12px',
                          py: 1,
                          px: 3,
                          fontWeight: 600,
                          textTransform: 'none',
                          boxShadow: 'none',
                          '&:hover': {
                            backgroundColor: '#7C3AED',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        {loading ? 'Uploading...' : 'Upload Screenshot'}
                      </Button>
                    </label>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        mt: 1,
                        color: '#10B981',
                        fontWeight: 500,
                        display: 'block'
                      }}
                    >
                      🔒 Your data is processed securely and never stored.
                    </Typography>
                  </Box>
                </Grid>

                {/* Preview Section */}
                {filePreview && (
                  <Grid item xs={12}>
                    <Fade in={!!filePreview}>
                      <Paper sx={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        p: 2,
                        backgroundColor: '#ffffff'
                      }}>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 1, fontWeight: 500 }}>
                          Screenshot Preview:
                        </Typography>
                        <Box sx={{
                          height: 200,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <img
                            src={filePreview}
                            alt="Uploaded screenshot"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                            }}
                          />
                        </Box>
                      </Paper>
                    </Fade>
                  </Grid>
                )}

                {/* Notes Section */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Additional Notes (Optional)"
                    variant="outlined"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        '& fieldset': {
                          borderColor: '#E5E7EB',
                        },
                        '&:hover fieldset': {
                          borderColor: '#D1D5DB',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#8B5CF6',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#6B7280',
                      },
                      '& .MuiInputBase-input': {
                        color: '#1F2937',
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
                    disabled={loading || !file}
                    startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <AnalyticsIcon />}
                    sx={{
                      backgroundColor: '#8B5CF6',
                      color: '#ffffff',
                      borderRadius: '12px',
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#7C3AED',
                        boxShadow: 'none'
                      },
                      '&:disabled': {
                        backgroundColor: '#E5E7EB',
                        color: '#9CA3AF'
                      }
                    }}
                  >
                    {loading ? `Analyzing... ${Math.round(analysisProgress)}%` : 'Analyze Investment'}
                  </Button>
                  
                  {loading && (
                    <LinearProgress 
                      variant="determinate" 
                      value={analysisProgress}
                      sx={{ 
                        mt: 2,
                        borderRadius: '4px',
                        height: '8px',
                        backgroundColor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#8B5CF6'
                        }
                      }} 
                    />
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          )}

          {/* Right Side: Analysis Results */}
          <Grid item xs={12} md={analysis ? 12 : 7} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ 
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              p: 3,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              flex: 1
            }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', mb: 1 }}>
                  AI Analysis Results
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  Comprehensive investment analysis powered by AI.
                </Typography>
              </Box>

              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '300px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px dashed #D1D5DB'
                }}>
                  <CircularProgress 
                    size={50}
                    thickness={4}
                    sx={{ color: '#8B5CF6', mb: 2 }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937', mb: 1 }}>
                    Analyzing Investment...
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Please wait while our AI processes your screenshot.
                  </Typography>
                </Box>
              ) : error ? (
                <Alert 
                  severity="error"
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FEE2E2',
                    color: '#DC2626',
                    '& .MuiAlert-icon': {
                      color: '#DC2626'
                    }
                  }}
                >
                  {error}
                </Alert>
              ) : analysis ? (
                <Fade in={!!analysis}>
                  <Box>
                    {/* Analysis Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {/* Grade Card */}
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          p: 2,
                          textAlign: 'center',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                          height: '100%'
                        }}>
                          <AssessmentIcon sx={{ fontSize: 32, color: getGradeColor(analysis.grade), mb: 1 }} />
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              color: getGradeColor(analysis.grade), 
                              fontWeight: 700,
                              mb: 0.5
                            }}
                          >
                            {analysis.grade || '-'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                            Overall Grade
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Risk Analysis Card */}
                      <Grid item xs={12} sm={8}>
                        <Paper sx={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          p: 2,
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                          height: '100%'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <SecurityIcon sx={{ fontSize: 24, color: '#1F2937', mr: 1 }} />
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                              Risk Analysis
                            </Typography>
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
                            {Math.round(analysis.riskScore) || 'N/A'}/10
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(analysis.riskScore || 0) * 10} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4, 
                              mb: 1,
                              backgroundColor: '#E5E7EB',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: analysis.riskScore > 7 
                                  ? '#EF4444'
                                  : analysis.riskScore > 4
                                  ? '#F59E0B'
                                  : '#10B981'
                              }
                            }} 
                          />
                          {analysis.riskExplanation && (
                            <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.5 }}>
                              {analysis.riskExplanation}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>

                      {/* ROI Scenarios Card */}
                      <Grid item xs={12}>
                        <Paper sx={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          p: 2,
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TrendingUpIcon sx={{ fontSize: 24, color: '#1F2937', mr: 1 }} />
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937' }}>
                              Yearly ROI Scenarios
                            </Typography>
                          </Box>
                          {analysis.roiScenarios ? (
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#EF4444', mb: 0.5 }}>
                                    {analysis.roiScenarios.pessimistic}%
                                  </Typography>
                                  <Chip 
                                    label="Pessimistic (Yearly)" 
                                    size="small"
                                    sx={{ 
                                      backgroundColor: '#FEF2F2',
                                      color: '#DC2626',
                                      fontWeight: 500
                                    }}
                                  />
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B5CF6', mb: 0.5 }}>
                                    {analysis.roiScenarios.realistic}%
                                  </Typography>
                                  <Chip 
                                    label="Realistic (Yearly)" 
                                    size="small"
                                    sx={{ 
                                      backgroundColor: '#F3E8FF',
                                      color: '#7C3AED',
                                      fontWeight: 500
                                    }}
                                  />
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981', mb: 0.5 }}>
                                    {analysis.roiScenarios.optimistic}%
                                  </Typography>
                                  <Chip 
                                    label="Optimistic (Yearly)" 
                                    size="small"
                                    sx={{ 
                                      backgroundColor: '#ECFDF5',
                                      color: '#059669',
                                      fontWeight: 500
                                    }}
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                          ) : (
                            <Typography sx={{ color: '#6B7280' }}>Not available.</Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Full Analysis */}
                    <Paper sx={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      p: 2,
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      mb: 3
                    }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1F2937', mb: 2 }}>
                        Detailed Analysis
                      </Typography>
                      {analysis.explanation ? (
                        <Box sx={{
                          backgroundColor: '#F9FAFB',
                          borderRadius: '8px',
                          p: 2,
                          border: '1px solid #E5E7EB'
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              lineHeight: 1.6, 
                              whiteSpace: 'pre-wrap',
                              color: '#374151'
                            }}
                          >
                            {analysis.explanation}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ color: '#6B7280' }}>Not available.</Typography>
                      )}
                    </Paper>

                    {/* New Analysis Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Button
                        onClick={() => {
                          setAnalysis(null);
                          setError(null);
                          setFile(null);
                          setFilePreview('');
                          setAdditionalNotes('');
                        }}
                        variant="outlined"
                        startIcon={<AnalyticsIcon />}
                        sx={{
                          borderColor: '#8B5CF6',
                          color: '#8B5CF6',
                          borderRadius: '12px',
                          px: 4,
                          py: 1.5,
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': {
                            borderColor: '#7C3AED',
                            backgroundColor: 'rgba(139, 92, 246, 0.04)'
                          }
                        }}
                      >
                        Analyze Another Investment
                      </Button>
                    </Box>
                  </Box>
                </Fade>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '300px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px dashed #D1D5DB'
                }}>
                  <AnalyticsIcon sx={{ fontSize: 60, color: '#9CA3AF', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 600, mb: 1 }}>
                    Ready for Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9CA3AF', textAlign: 'center' }}>
                    Upload a screenshot of an investment to begin AI analysis.
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

export default InvestmentForm;


