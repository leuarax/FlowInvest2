import React, { useState } from 'react';
import { 
  Container, Box, Typography, TextField, Button, 
  Grid, Paper, CircularProgress, Alert, LinearProgress,
  Chip, Card, CardContent, Fade
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Footer from './Footer';

// Utility function to determine color based on grade
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

const InvestmentForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // State for screenshot input
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Simulate analysis progress (in a real app, this would come from the server)
  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setAnalysisProgress(progress);
    }, 500);
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
        res = await fetch('http://localhost:3001/api/analyze-screenshot', {
          method: 'POST',
          body: apiFormData,
        });
      } catch (err) {
        console.log('Local server failed, trying production URL...', err);
        res = await fetch('/api/analyze-screenshot', {
          method: 'POST',
          body: apiFormData,
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || `HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'An unknown error occurred during analysis.');
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pt: 4,
      display: 'flex',
      flexDirection: 'column'
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
            Thinking About a New Investment?
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Upload a screenshot of your potential investment and let our AI analyze it for you
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
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Upload Investment Screenshot
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Share a screenshot of your potential investment for AI analysis
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Upload Section */}
                <Grid item xs={12}>
                  <Box sx={{
                    border: '2px dashed rgba(102, 126, 234, 0.3)',
                    borderRadius: '16px',
                    p: 4,
                    textAlign: 'center',
                    background: filePreview ? 'transparent' : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
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
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '12px',
                          py: 1.5,
                          px: 4,
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {loading ? 'Uploading...' : 'Upload Screenshot'}
                      </Button>
                    </label>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        mt: 2,
                        color: '#10b981',
                        fontWeight: 600,
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px',
                        py: 1,
                        px: 2,
                        display: 'inline-block'
                      }}
                    >
                      🔒 Your screenshots are never stored anywhere
                    </Typography>
                  </Box>
                </Grid>

                {/* Preview Section */}
                {filePreview && (
                  <Grid item xs={12}>
                    <Fade in={!!filePreview}>
                      <Card sx={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                      }}>
                        <Box sx={{
                          position: 'relative',
                          height: 300,
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                        }}>
                          <img
                            src={filePreview}
                            alt="Uploaded screenshot"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              borderRadius: '16px'
                            }}
                          />
                          <Chip
                            label="Preview"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              background: 'rgba(255,255,255,0.9)',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      </Card>
                    </Fade>
                  </Grid>
                )}

                {/* Notes Section */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Additional Notes"
                    variant="outlined"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(248, 250, 252, 0.8)',
                        '&:hover fieldset': {
                          borderColor: '#667eea'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea'
                        }
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
                    {loading ? `Analyzing... ${Math.round(analysisProgress)}%` : 'Analyze Portfolio'}
                  </Button>
                  
                  {loading && (
                    <LinearProgress 
                      variant="determinate" 
                      value={analysisProgress}
                      sx={{ 
                        mt: 2,
                        borderRadius: '4px',
                        height: '8px',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }
                      }} 
                    />
                  )}
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
                  Comprehensive investment analysis powered by artificial intelligence
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
                    Analyzing Investment...
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    Our AI is processing your screenshot
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#667eea', fontWeight: 600 }}>
                    {Math.round(analysisProgress)}% Complete
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
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      {/* Grade Card */}
                      <Grid item xs={12} sm={4}>
                        <Card sx={{
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '16px',
                          textAlign: 'center',
                          p: 2,
                          height: '100%',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)'
                          }
                        }}>
                          <CardContent>
                            <AssessmentIcon sx={{ fontSize: 40, color: getGradeColor(analysis.grade), mb: 1 }} />
                            <Typography 
                              variant="h2" 
                              sx={{ 
                                color: getGradeColor(analysis.grade), 
                                fontWeight: 700,
                                mb: 1
                              }}
                            >
                              {analysis.grade || '-'}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#64748b', fontWeight: 600 }}>
                              Overall Grade
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Risk Analysis Card */}
                      <Grid item xs={12} sm={8}>
                        <Card sx={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '16px',
                          p: 2,
                          height: '100%',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)'
                          }
                        }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <SecurityIcon sx={{ fontSize: 32, color: '#3b82f6', mr: 1 }} />
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                Risk Analysis
                              </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', mb: 1 }}>
                              {analysis.riskScore || 'N/A'}/10
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={(analysis.riskScore || 0) * 10} 
                              sx={{ 
                                height: 12, 
                                borderRadius: 6, 
                                mb: 2,
                                '& .MuiLinearProgress-bar': {
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                }
                              }} 
                            />
                            {analysis.riskExplanation && (
                              <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.5 }}>
                                {analysis.riskExplanation}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* ROI Scenarios Card */}
                      <Grid item xs={12}>
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
                  <AnalyticsIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                    Ready for Analysis
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                    Upload a screenshot of an investment to begin AI analysis
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

