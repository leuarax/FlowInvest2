import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, TextField, Button, 
  Grid, Paper, CircularProgress, Alert, LinearProgress
} from '@mui/material';

// Utility function to determine color based on grade
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

const InvestmentForm = () => {
  const navigate = useNavigate();
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
      const res = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        body: apiFormData,
      });

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

  const handleSaveInvestment = () => {
    if (!analysis) return;

    const newInvestment = {
      id: Date.now(),
      name: analysis.name || 'N/A',
      type: analysis.type || 'N/A',
      amount: analysis.amount || 'N/A',
      purchaseDate: new Date().toISOString().split('T')[0],
      quantity: analysis.quantity || '',
      ticker: analysis.ticker || '',
      additionalNotes: additionalNotes,
      grade: analysis.grade,
      riskScore: analysis.riskScore,
      riskExplanation: analysis.riskExplanation,
      roiEstimate: analysis.roiEstimate,
      explanation: analysis.explanation,
      roiScenarios: analysis.roiScenarios || { pessimistic: 0, realistic: 0, optimistic: 0 },
    };

    const investments = JSON.parse(localStorage.getItem('investments') || '[]');
    localStorage.setItem('investments', JSON.stringify([...investments, newInvestment]));
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4}>
        {/* Left Side: Input Form */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Analysis
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Upload your portfolio screenshot:
                </Typography>
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
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} />
                        <span>Uploading...</span>
                      </Box>
                    ) : (
                      'Upload Screenshot'
                    )}
                  </Button>
                </label>
                {/* Privacy Note */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Your screenshots are never stored anywhere.
                </Typography>
              </Grid>
              {filePreview && (
                <Grid item xs={12}>
                  <Box sx={{
                    width: '100%',
                    height: 300,
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'grey.200',
                    position: 'relative',
                  }}>
                    <img
                      src={filePreview}
                      alt="Uploaded screenshot"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                </Grid>
              )}
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
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleAnalyze}
                  disabled={loading || !file}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <span>Analysing Portfolio {analysisProgress}%</span>
                    </Box>
                  ) : (
                    'Analyze Portfolio'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Side: AI Analysis Display */}
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
                  Upload a screenshot of an investment to begin analysis.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InvestmentForm;
