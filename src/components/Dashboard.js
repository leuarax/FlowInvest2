import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Container, Box, Typography, Button, Grid, Paper, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

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
      const avgROI = storedInvestments.reduce((acc, inv) => acc + parseFloat(inv.roiEstimate), 0) / storedInvestments.length;
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
        <Typography variant="h1" component="h1" sx={{ mb: 1, color: theme.palette.primary.main }}>
          FlowInvest
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {JSON.parse(localStorage.getItem('userProfile')).name}!
        </Typography>
      </Box>

      <Button
        variant="contained"
        onClick={() => navigate('/add-investment')}
        sx={{
          mb: 4,
          backgroundColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        }}
      >
        + Start Your Investment Journey
      </Button>

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

      <Typography variant="h4" sx={{ mb: 3, mt: 4 }}>
        Your Investments
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {investments.map((investment) => (
            <Grid item xs={12} md={6} key={investment.name}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  bgcolor: theme.palette.background.paper,
                  boxShadow: 2,
                  position: 'relative',
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
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {investment.name}
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Type: {investment.type}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">
                    Amount: ${investment.amount}
                  </Typography>
                  <Typography variant="subtitle1">
                    Duration: {investment.duration} years
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
                  Estimated ROI: {investment.roiEstimate}%
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;
