import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, TextField, Button, 
  Grid, Paper, CircularProgress, ToggleButton, 
  ToggleButtonGroup, Alert, LinearProgress
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import EditIcon from '@mui/icons-material/Edit';

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
  const [inputMethod, setInputMethod] = useState('screenshot');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // State for screenshot input
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // State for manual input
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    amount: '',
    date: '',
  });

  const handleInputMethodChange = (event, newMethod) => {
    if (newMethod !== null) {
      setInputMethod(newMethod);
      setAnalysis(null);
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const apiFormData = new FormData();
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    apiFormData.append('userProfile', JSON.stringify(userProfile));
    apiFormData.append('additionalNotes', additionalNotes);

    if (inputMethod === 'screenshot') {
      if (!file) {
        setError('Please upload a screenshot.');
        setLoading(false);
        return;
      }
      apiFormData.append('screenshot', file);
    } else {
      apiFormData.append('manualData', JSON.stringify(formData));
    }

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

  const handleSaveInvestment = () => {
    if (!analysis) return;

    const newInvestment = {
      id: Date.now(),
      name: analysis.name || formData.name,
      type: analysis.type || formData.type,
      amount: analysis.amount || formData.amount,
      purchaseDate: formData.date,
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
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              Add New Investment
            </Typography>

            <ToggleButtonGroup
              value={inputMethod}
              exclusive
              onChange={handleInputMethodChange}
              aria-label="input method"
              fullWidth
              sx={{ mb: 3 }}
            >
              <ToggleButton value="screenshot" aria-label="screenshot upload">
                <CameraAltIcon sx={{ mr: 1 }} />
                Screenshot
              </ToggleButton>
              <ToggleButton value="manual" aria-label="manual entry">
                <EditIcon sx={{ mr: 1 }} />
                Manual Entry
              </ToggleButton>
            </ToggleButtonGroup>

            {inputMethod === 'screenshot' ? (
              <Box>
                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                  sx={{ mb: 2, py: 1.5 }}
                >
                  Upload Screenshot
                  <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                </Button>
                {filePreview && (
                  <Box sx={{ mb: 2, border: '1px dashed grey', p: 1 }}>
                    <img src={filePreview} alt="Screenshot preview" style={{ width: '100%', height: 'auto' }} />
                  </Box>
                )}
                <TextField
                  label="Additional Notes (Optional)"
                  multiline
                  rows={4}
                  fullWidth
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleAnalyze}
                  disabled={!file || loading}
                  fullWidth
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Analyze Screenshot'}
                </Button>
              </Box>
            ) : (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Investment Name" name="name" value={formData.name} onChange={handleFormChange} fullWidth required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Investment Type" name="type" value={formData.type} onChange={handleFormChange} fullWidth required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Amount Invested" name="amount" type="number" value={formData.amount} onChange={handleFormChange} fullWidth required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Purchase Date" name="date" type="date" value={formData.date} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} required />
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleAnalyze}
                  disabled={loading}
                  fullWidth
                  sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Get AI Assessment'}
                </Button>
              </Box>
            )}
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
                        {analysis.grade}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">Overall Grade</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6">Risk Analysis</Typography>
                      <Typography variant="body1">Score: {analysis.riskScore}/10</Typography>
                      <LinearProgress variant="determinate" value={analysis.riskScore * 10} sx={{ height: 10, borderRadius: 5, my: 1 }} />
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
                  Save Investment
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'text.secondary' }}>
                <Typography variant="body1">
                  {inputMethod === 'screenshot' 
                    ? 'Upload a screenshot to begin analysis.'
                    : 'Fill in the form to get an AI assessment.'}
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
