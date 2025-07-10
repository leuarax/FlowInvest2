import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Modal,
  Fade,
  Backdrop,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon
} from '@mui/icons-material';
import Footer from './Footer';

const Portfolio = () => {
  const navigate = useNavigate();
  const { user, getUserInvestments, deleteInvestment: deleteInvestmentFromFirebase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [stats, setStats] = useState({
    totalPortfolio: 0,
    avgROI: 0,
    avgRisk: 0,
    investmentCount: 0,
  });

  const loadInvestments = useCallback(async () => {
    try {
      const { investments: firebaseInvestments, error } = await getUserInvestments();
      
      if (error) {
        console.error('Error loading investments:', error);
        return;
      }

      setInvestments(firebaseInvestments);

      // Calculate stats
      if (firebaseInvestments.length > 0) {
        const total = firebaseInvestments.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
        const avgROI = firebaseInvestments.reduce((acc, inv) => {
          let roi = parseFloat(String(inv.roiEstimate).replace(/[^0-9.-]+/g, ''));
          if (inv.type === 'Real Estate') {
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadInvestments().finally(() => {
      setLoading(false);
    });
  }, [user, navigate, loadInvestments]);

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

  const formatROI = (value) => {
    if (!value) return '0.0';
    const num = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? '0.0' : num.toFixed(1);
  };

  const handleOpenModal = (investment) => {
    setSelectedInvestment(investment);
  };

  const handleCloseModal = () => {
    setSelectedInvestment(null);
  };

  const deleteInvestment = async (investment) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        const { error } = await deleteInvestmentFromFirebase(investment.id);
        if (error) {
          console.error('Error deleting investment:', error);
          return;
        }

        // Remove from local state
        const updatedInvestments = investments.filter(inv => inv.id !== investment.id);
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
      }
    }
  };



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
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: 4, pb: 6, flex: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
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
              mr: 3,
              '&:hover': {
                background: 'rgba(255,255,255,0.2)',
                borderColor: 'rgba(255,255,255,0.4)',
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Back to Dashboard
          </Button>
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 800,
              letterSpacing: '-0.02em'
            }}
          >
            Portfolio Details
          </Typography>
        </Box>



        {/* Investments Table */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
            Your Investments ({investments.length})
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <CircularProgress sx={{ color: 'white' }} size={60} thickness={4} />
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
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <TableContainer component={Paper} sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '20px',
                overflow: 'hidden',
                minWidth: { xs: 800, sm: 'unset' }
              }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow sx={{ background: 'rgba(255,255,255,0.1)' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        Investment
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        Type
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        Amount
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        ROI
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        Risk
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {investments.map((investment, index) => (
                      <TableRow
                        key={`${investment.name}-${index}`}
                        onClick={() => handleOpenModal(investment)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.1)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {investment.grade && (
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  fontWeight: 700,
                                  fontSize: '1rem',
                                  background: getGradeGradient(investment.grade),
                                  color: 'white',
                                  mr: 1,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
                                }}
                              >
                                {investment.grade}
                              </Avatar>
                            )}
                            <Typography
                              variant="body1"
                              sx={{
                                color: 'white',
                                fontWeight: 600,
                                maxWidth: { xs: 90, sm: 160, md: 220 },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.97rem', sm: '1.05rem' }
                              }}
                            >
                              {investment.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Chip 
                            label={investment.type || 'Stock'}
                            sx={{
                              background: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                            ${parseFloat(investment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography variant="body1" sx={{ color: '#10b981', fontWeight: 600 }}>
                            {formatROI(investment.roiEstimate)}%
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: 'white', minWidth: '30px' }}>
                              {investment.riskScore}/10
                            </Typography>
                            <Box sx={{ flex: 1, maxWidth: 60 }}>
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
                        </TableCell>
                        <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Tooltip title="Delete Investment">
                            <IconButton
                              onClick={(e) => { e.stopPropagation(); deleteInvestment(investment); }}
                              sx={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                '&:hover': {
                                  background: 'rgba(239, 68, 68, 0.3)',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
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

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                    Investment Details
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
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
                  </Box>
                </Box>

                {selectedInvestment.roiScenarios && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#1e293b', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                      ROI Scenarios
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                      <Paper sx={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '12px',
                        p: 1.2,
                        textAlign: 'center',
                        color: 'white'
                      }}>
                        <Typography variant="caption" sx={{ opacity: 0.8, mb: 0.5, fontSize: '0.85rem' }}>
                          Pessimistic
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                          {selectedInvestment.roiScenarios.pessimistic?.toFixed(1)}%
                        </Typography>
                      </Paper>
                      <Paper sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '12px',
                        p: 1.2,
                        textAlign: 'center',
                        color: 'white'
                      }}>
                        <Typography variant="caption" sx={{ opacity: 0.8, mb: 0.5, fontSize: '0.85rem' }}>
                          Realistic
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                          {selectedInvestment.roiScenarios.realistic?.toFixed(1)}%
                        </Typography>
                      </Paper>
                      <Paper sx={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        borderRadius: '12px',
                        p: 1.2,
                        textAlign: 'center',
                        color: 'white'
                      }}>
                        <Typography variant="caption" sx={{ opacity: 0.8, mb: 0.5, fontSize: '0.85rem' }}>
                          Optimistic
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                          {selectedInvestment.roiScenarios.optimistic?.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                )}

                {selectedInvestment.explanation && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1e293b' }}>
                      Analysis
                    </Typography>
                    <Paper sx={{
                      background: 'rgba(248,250,252,0.8)',
                      borderRadius: '12px',
                      p: 3,
                      border: '1px solid rgba(226,232,240,0.8)'
                    }}>
                      <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                        {selectedInvestment.explanation}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                      }
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Modal>
        )}
      </Container>
      <Footer />
    </Box>
  );
};

export default Portfolio; 