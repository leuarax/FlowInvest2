import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortfolioAnalysis, analyzeInvestment } from '../utils/openai';
import { useTheme } from '@mui/material/styles';
import { 
  Container, Box, Typography, Button, Grid, Paper, 
  CircularProgress, IconButton, Divider, Card, 
  CardContent, Modal, Fade, Backdrop, Tooltip 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import SpeedIcon from '@mui/icons-material/Speed';
import FastAddPortfolio from './FastAddPortfolio';

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

// Helper function to format ROI values (handles both decimal and percentage formats)
const formatROI = (value) => {
  if (value === undefined || value === null) return '0.0';
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  // If the value is less than 1, assume it's a decimal and multiply by 100
  const displayValue = Math.abs(numValue) < 1 ? numValue * 100 : numValue;
  return displayValue.toFixed(1);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
          // Don't include duration/term as it's not needed
        };

        try {
          // Get analysis for the investment
          const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
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

      // Update investments in state and localStorage
      const updatedInvestments = [...investments, ...processedInvestments];
      setInvestments(updatedInvestments);
      localStorage.setItem('investments', JSON.stringify(updatedInvestments));
      
      // Recalculate stats
      const total = updatedInvestments.reduce((acc, inv) => acc + parseFloat(inv.amount || 0), 0);
      const avgROI = updatedInvestments.length > 0 
        ? updatedInvestments.reduce((acc, inv) => acc + parseFloat(inv.roiEstimate || 0), 0) / updatedInvestments.length 
        : 0;
      const avgRisk = updatedInvestments.length > 0 
        ? updatedInvestments.reduce((acc, inv) => acc + parseFloat(inv.riskScore || 0), 0) / updatedInvestments.length 
        : 0;

      setStats({
        totalPortfolio: total,
        avgROI,
        avgRisk,
        investmentCount: updatedInvestments.length,
      });
    } catch (error) {
      console.error('Error adding investments:', error);
      setError('Failed to add investments. Please try again.');
    }
  };

  useEffect(() => {
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));
    if (!userProfile) {
      navigate('/');
      return;
    }

    const storedInvestments = JSON.parse(localStorage.getItem('investments') || '[]');
    setInvestments(storedInvestments);

    // Calculate stats
    if (storedInvestments.length > 0) {
      const total = storedInvestments.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
      const avgROI = storedInvestments.reduce((acc, inv) => {
        const roi = parseFloat(String(inv.roiEstimate).replace(/[^0-9.-]+/g, ''));
        return acc + (isNaN(roi) ? 0 : roi);
      }, 0) / storedInvestments.length;
      const avgRisk = storedInvestments.reduce((acc, inv) => acc + parseFloat(inv.riskScore), 0) / storedInvestments.length;

      setStats({
        totalPortfolio: total,
        avgROI,
        avgRisk,
        investmentCount: storedInvestments.length,
      });
    }

    setLoading(false);
  }, [navigate]);

  const handleOpenModal = (investment) => {
    setSelectedInvestment(investment);
  };

  const handleCloseModal = () => {
    setSelectedInvestment(null);
  };

  const handleGetPortfolioAnalysis = async () => {
    setLoading(true);
    setError('');
    setPortfolioAnalysis(null);
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (!userProfile) {
        throw new Error('User profile not found. Please complete onboarding first.');
      }
      const analysis = await getPortfolioAnalysis(investments, userProfile);
      setPortfolioAnalysis(analysis);
    } catch (err) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const deleteInvestment = (investment) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      const updatedInvestments = investments.filter(
        inv => inv.name !== investment.name || inv.type !== investment.type || inv.date !== investment.date
      );
      localStorage.setItem('investments', JSON.stringify(updatedInvestments));
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
    }
  };

  const statCards = [
    { id: 'portfolio', title: 'Total Portfolio', value: `$${stats.totalPortfolio.toFixed(2)}`, color: '#4CAF50' },
    { id: 'roi', title: 'Avg ROI', value: `${stats.avgROI.toFixed(1)}%`, color: '#2196F3' },
    { id: 'risk', title: 'Avg Risk', value: `${stats.avgRisk.toFixed(1)}/10`, color: '#FFC107' },
    { id: 'investments', title: 'Investments', value: stats.investmentCount, color: '#9C27B0' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" component="h1" sx={{ mb: 1, color: theme.palette.primary.main, fontSize: { xs: '3rem', sm: '4rem', md: '5rem' } }}>
          FlowInvest
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {JSON.parse(localStorage.getItem('userProfile')).name}!
        </Typography>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Tooltip title="Quickly add multiple investments from a screenshot">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setFastAddOpen(true)}
            startIcon={<SpeedIcon />}
          >
            Fast Add Portfolio
          </Button>
        </Tooltip>
        <Button 
          variant="outlined" 
          onClick={handleGetPortfolioAnalysis} 
          disabled={investments.length === 0}
        >
          Analyze Portfolio
        </Button>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => navigate('/add-investment')}
        >
          Thinking about new investments?
        </Button>
      </Box>

      <FastAddPortfolio 
        open={fastAddOpen} 
        onClose={() => setFastAddOpen(false)}
        onAddInvestments={handleAddInvestments}
      />

      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.id}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                bgcolor: theme.palette.background.paper,
                boxShadow: 2,
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                {card.title}
              </Typography>
              <Typography variant="h3" sx={{ color: card.color }}>
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h4" sx={{ mb: 3, mt: 4, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Your Investments
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {investments.map((investment, index) => (
            <Grid item xs={12} md={6} key={`${investment.name}-${index}`}>
              <Paper
                onClick={() => handleOpenModal(investment)}
                sx={{
                  p: 3,
                  height: '100%',
                  bgcolor: theme.palette.background.paper,
                  boxShadow: 2,
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                  }
                }}
              >
                <IconButton
                  onClick={() => deleteInvestment(investment)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: theme.palette.error.main,
                  }}
                >
                  <DeleteIcon />
                </IconButton>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {investment.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                      color: getGradeColor(investment.grade),
                      ml: 2,
                    }}
                  >
                    {investment.grade || '-'}
                  </Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Type: {investment.type}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">
                    Amount: ${investment.amount}
                  </Typography>

                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">
                    Risk Score: {investment.riskScore}/10
                  </Typography>
                  <Box sx={{ width: '100px', height: 6 }}>
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: investment.riskScore > 5 ? '#F44336' : '#4CAF50',
                        borderRadius: 2,
                      }}
                    />
                  </Box>
                </Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Estimated ROI: {formatROI(investment.roiEstimate)}%
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {selectedInvestment && (
        <Modal
          open={!!selectedInvestment}
          onClose={handleCloseModal}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={!!selectedInvestment}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 600 },
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: { xs: 2, sm: 4 },
              borderRadius: 2,
              maxHeight: '90vh',
              overflowY: 'auto',
              wordWrap: 'break-word',
            }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>{selectedInvestment.name}</Typography>
              <Typography variant="h2" sx={{ color: getGradeColor(selectedInvestment.grade), fontWeight: 'bold', textAlign: 'center', mb: 2, fontSize: { xs: '3rem', sm: '3.75rem' } }}>
                {selectedInvestment.grade}
              </Typography>
              <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Risk Score: {selectedInvestment.riskScore}/10</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selectedInvestment.riskExplanation}</Typography>
              <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Average Estimated ROI: {formatROI(selectedInvestment.roiEstimate)}%
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-around', mb: 2, alignItems: 'center', gap: { xs: 2, sm: 0 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1rem' } }}>Pessimistic</Typography>
                  <Typography variant="h6" color="error.main" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{formatROI(selectedInvestment.roiScenarios?.pessimistic)}%</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1rem' } }}>Realistic</Typography>
                  <Typography variant="h6" color="warning.main" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{formatROI(selectedInvestment.roiScenarios?.realistic)}%</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1rem' } }}>Optimistic</Typography>
                  <Typography variant="h6" color="success.main" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{formatROI(selectedInvestment.roiScenarios?.optimistic)}%</Typography>
                </Box>
              </Box>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>Full Analysis:</Typography>
              <Typography variant="body2">{selectedInvestment.explanation}</Typography>
              <Button onClick={handleCloseModal} sx={{ mt: 3 }}>Close</Button>
            </Box>
          </Fade>
        </Modal>
      )}

      {error && <Typography color="error" sx={{ mt: 4 }}>Error: {error}</Typography>}

      {portfolioAnalysis && (
        <Modal
          open={!!portfolioAnalysis}
          onClose={() => setPortfolioAnalysis(null)}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={!!portfolioAnalysis}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95%', sm: 700 },
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: { xs: 2, sm: 4 },
              borderRadius: 2,
              maxHeight: '90vh',
              overflowY: 'auto',
              wordWrap: 'break-word',
            }}>
              <Typography variant="h4" gutterBottom>Portfolio Assessment</Typography>
              <Grid container spacing={4} sx={{ alignItems: 'center' }}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, border: `2px solid ${getGradeColor(portfolioAnalysis.grade)}`, borderRadius: '50%', width: 150, height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', mx: 'auto' }}>
                    <Typography variant="h2" component="div" sx={{ color: getGradeColor(portfolioAnalysis.grade), fontWeight: 'bold' }}>
                      {portfolioAnalysis.grade}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Overall Grade
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={9}>
                  <Typography variant="h6">Comprehensive Analysis</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{portfolioAnalysis.analysis}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h5" gutterBottom>AI Recommendations</Typography>
              <Grid container spacing={2}>
                {portfolioAnalysis.recommendations.map((rec, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card sx={{ height: '100%', boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="h6" component="div">{rec.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{rec.reason}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Button onClick={() => setPortfolioAnalysis(null)} sx={{ mt: 4 }} variant="contained" fullWidth>Close</Button>
            </Box>
          </Fade>
        </Modal>
      )}
    </Container>
  );
};

export default Dashboard;
