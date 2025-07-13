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
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid, // Added Grid import
  Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon
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
    avgROIRange: { pessimistic: 0, realistic: 0, optimistic: 0 },
    avgRisk: 0,
    investmentCount: 0,
  });
  const [roiModalOpen, setRoiModalOpen] = useState(false);

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
        
        const avgROI = weightedROIScenarios.realistic; // Use realistic as the main average
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
    if (!grade) return '#6B7280';
    const upperGrade = grade.toUpperCase();
    if (upperGrade.startsWith('A')) return '#10B981';
    if (upperGrade.startsWith('B')) return '#F59E0B';
    if (upperGrade.startsWith('C')) return '#F97316';
    if (upperGrade.startsWith('D')) return '#EF4444';
    if (upperGrade.startsWith('F')) return '#DC2626';
    return '#6B7280';
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
          
          // Calculate weighted average ROI scenarios based on portfolio allocation
          const weightedROIScenarios = updatedInvestments.reduce((acc, inv) => {
            const amount = parseFloat(inv.amount) || 0;
            const weight = total > 0 ? amount / total : 0;
            
            // Get ROI scenarios if available, otherwise use roiEstimate for all scenarios
            const pessimistic = inv.roiScenarios?.pessimistic || parseFloat(String(inv.roiEstimate).replace(/[^0-9.-]+/g, '')) || 0;
            const realistic = inv.roiScenarios?.realistic || parseFloat(String(inv.roiEstimate).replace(/[^0-9.-]+/g, '')) || 0;
            const optimistic = inv.roiScenarios?.optimistic || parseFloat(String(inv.roiEstimate).replace(/[^0-9.-]+/g, '')) || 0;
            
            return {
              pessimistic: acc.pessimistic + (weight * pessimistic),
              realistic: acc.realistic + (weight * realistic),
              optimistic: acc.optimistic + (weight * optimistic)
            };
          }, { pessimistic: 0, realistic: 0, optimistic: 0 });
          
          const avgROI = weightedROIScenarios.realistic; // Use realistic as the main average
          const avgROIRange = {
            pessimistic: weightedROIScenarios.pessimistic,
            realistic: weightedROIScenarios.realistic,
            optimistic: weightedROIScenarios.optimistic
          };
          const avgRisk = updatedInvestments.reduce((acc, inv) => acc + parseFloat(inv.riskScore), 0) / updatedInvestments.length;

          setStats({
            totalPortfolio: total,
            avgROI,
            avgROIRange,
            avgRisk,
            investmentCount: updatedInvestments.length,
          });
        } else {
          setStats({
            totalPortfolio: 0,
            avgROI: 0,
            avgROIRange: { pessimistic: 0, realistic: 0, optimistic: 0 },
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

        {/* Portfolio Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                backgroundColor: '#F3E8FF', // 10% purple
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                p: 2,
                textAlign: 'center',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography 
                sx={{ 
                  color: '#1F2937', 
                  fontWeight: 600,
                  fontSize: '1.5rem'
                }}
              >
                ${stats.totalPortfolio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography 
                sx={{ 
                  color: '#6B7280', 
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Total Value
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                backgroundColor: '#F3E8FF', // 10% purple
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                p: 2,
                textAlign: 'center',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography 
                sx={{ 
                  color: '#1F2937', 
                  fontWeight: 600,
                  fontSize: '1.5rem'
                }}
              >
                {stats.avgROIRange.pessimistic.toFixed(1)}% - {stats.avgROIRange.optimistic.toFixed(1)}%
              </Typography>
              <Typography 
                sx={{ 
                  color: '#6B7280', 
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Avg Yearly ROI
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                backgroundColor: '#F3E8FF', // 10% purple
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                p: 2,
                textAlign: 'center',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography 
                sx={{ 
                  color: '#1F2937', 
                  fontWeight: 600,
                  fontSize: '1.5rem'
                }}
              >
                {stats.avgRisk.toFixed(1)}/10
              </Typography>
              <Typography 
                sx={{ 
                  color: '#6B7280', 
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                Avg Risk
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Investments Table */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#1F2937', 
              mb: 2, 
              fontWeight: 600,
              fontSize: '1.125rem'
            }}
          >
            Your Investments ({investments.length})
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <CircularProgress sx={{ color: '#8B5CF6' }} size={40} />
            </Box>
          ) : investments.length === 0 ? (
            <Paper sx={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              p: 3,
              textAlign: 'center',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#1F2937', 
                  mb: 1,
                  fontWeight: 500
                }}
              >
                No investments yet
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6B7280',
                  fontSize: '0.875rem'
                }}
              >
                Add your first investment to see it here.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/add-investment')}
                sx={{
                  mt: 2,
                  backgroundColor: '#8B5CF6',
                  color: '#ffffff',
                  borderRadius: '12px',
                  py: 1,
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
                Add Investment
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              overflowX: 'auto',
              minWidth: { xs: '100%', sm: 'unset' }
            }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                    <TableCell sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>Investment</TableCell>
                    <TableCell sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>Amount</TableCell>
                    <TableCell sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>ROI</TableCell>
                    <TableCell sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>Risk</TableCell>
                    <TableCell sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {investments.map((investment, index) => (
                    <TableRow
                      key={`${investment.name}-${index}`}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { backgroundColor: '#F9FAFB' }
                      }}
                      onClick={() => handleOpenModal(investment)}
                    >
                      <TableCell sx={{ color: '#1F2937', fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {investment.grade && (
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                backgroundColor: getGradeColor(investment.grade),
                                color: '#ffffff',
                              }}
                            >
                              {investment.grade}
                            </Avatar>
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#1F2937',
                              fontWeight: 500,
                              maxWidth: { xs: 100, sm: 150 },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {investment.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#1F2937', fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>
                        ${parseFloat(investment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell sx={{ color: '#10B981', fontSize: '0.875rem', fontWeight: 500, borderBottom: '1px solid #E5E7EB' }}>
                        {formatROI(investment.roiEstimate)}%
                      </TableCell>
                      <TableCell sx={{ color: '#1F2937', fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#1F2937', minWidth: '30px' }}>
                            {investment.riskScore}/10
                          </Typography>
                          <Box sx={{ flex: 1, maxWidth: 60 }}>
                            <LinearProgress
                              variant="determinate"
                              value={(investment.riskScore / 10) * 100}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#E5E7EB',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  backgroundColor: investment.riskScore > 7 
                                    ? '#EF4444'
                                    : investment.riskScore > 4
                                    ? '#F59E0B'
                                    : '#10B981'
                                }
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid #E5E7EB' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            onClick={(e) => { e.stopPropagation(); deleteInvestment(investment); }}
                            sx={{
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              borderRadius: '8px',
                              width: 32,
                              height: 32,
                              '&:hover': {
                                backgroundColor: '#FEE2E2'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
              sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
            }}
          >
            <Fade in={!!selectedInvestment}>
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '95%', sm: '90%', md: '600px' },
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
                    {selectedInvestment.name}
                  </Typography>
                  
                  <IconButton
                    onClick={handleCloseModal}
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
                    <ArrowBackIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                  </IconButton>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      p: 2,
                      textAlign: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        {selectedInvestment.grade && (
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              fontWeight: 700,
                              fontSize: '1.25rem',
                              backgroundColor: getGradeColor(selectedInvestment.grade),
                              color: '#ffffff',
                            }}
                          >
                            {selectedInvestment.grade}
                          </Avatar>
                        )}
                        {!selectedInvestment.grade && (
                          <Typography 
                            sx={{ 
                              color: '#6B7280', 
                              fontWeight: 600,
                              fontSize: '1.25rem'
                            }}
                          >
                            -
                          </Typography>
                        )}
                      </Box>
                      <Typography 
                        sx={{ 
                          color: '#6B7280', 
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        Grade
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{
                      backgroundColor: '#F9FAFB',
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
                        ${parseFloat(selectedInvestment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Typography 
                        sx={{ 
                          color: '#6B7280', 
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        Amount
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{
                      backgroundColor: '#F9FAFB',
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
                        {formatROI(selectedInvestment.roiEstimate)}%
                      </Typography>
                      <Typography 
                        sx={{ 
                          color: '#6B7280', 
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        ROI
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Monthly Cashflow for Real Estate */}
                {selectedInvestment.type === 'Real Estate' && (selectedInvestment.cashflow || selectedInvestment.cashflowAfterMortgage) && (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        p: 2,
                        textAlign: 'center'
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937', mb: 1, fontSize: '1rem' }}>
                          Monthly Cashflow
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981', fontSize: '0.875rem' }}>
                                {selectedInvestment.cashflow !== undefined && selectedInvestment.cashflow !== null ? `€${selectedInvestment.cashflow}` : 'N/A'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                Gross
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981', fontSize: '0.875rem' }}>
                                {selectedInvestment.cashflowAfterMortgage !== undefined && selectedInvestment.cashflowAfterMortgage !== null ? `€${selectedInvestment.cashflowAfterMortgage}` : 'N/A'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                Net After Mortgage
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {selectedInvestment.roiScenarios && (
                  <Box sx={{ mb: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#1F2937', 
                        mb: 2,
                        fontSize: '1.125rem'
                      }}
                    >
                      ROI Scenarios
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Paper sx={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          p: 2,
                          textAlign: 'center'
                        }}>
                          <Typography 
                            sx={{ 
                              color: '#EF4444', 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}
                          >
                            {selectedInvestment.roiScenarios.pessimistic?.toFixed(1)}%
                          </Typography>
                          <Typography 
                            sx={{ 
                              color: '#6B7280', 
                              fontSize: '0.75rem'
                            }}
                          >
                            Pessimistic
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          p: 2,
                          textAlign: 'center'
                        }}>
                          <Typography 
                            sx={{ 
                              color: '#8B5CF6', 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}
                          >
                            {selectedInvestment.roiScenarios.realistic?.toFixed(1)}%
                          </Typography>
                          <Typography 
                            sx={{ 
                              color: '#6B7280', 
                              fontSize: '0.75rem'
                            }}
                          >
                            Realistic
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          p: 2,
                          textAlign: 'center'
                        }}>
                          <Typography 
                            sx={{ 
                              color: '#10B981', 
                              fontWeight: 600,
                              fontSize: '1rem'
                            }}
                          >
                            {selectedInvestment.roiScenarios.optimistic?.toFixed(1)}%
                          </Typography>
                          <Typography 
                            sx={{ 
                              color: '#6B7280', 
                              fontSize: '0.75rem'
                            }}
                          >
                            Optimistic
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#1F2937', 
                      mb: 2,
                      fontSize: '1.125rem'
                    }}
                  >
                    Analysis
                  </Typography>
                  <Paper sx={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    p: 2
                  }}>
                    {Array.isArray(selectedInvestment.analysis) && selectedInvestment.analysis.length > 0 ? (
                      <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                        {selectedInvestment.analysis.map((line, idx) => (
                          <li key={idx} style={{ marginBottom: 8, color: '#374151', fontSize: '0.95em' }}>{line}</li>
                        ))}
                      </ul>
                    ) : selectedInvestment.analysis ? (
                      <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.6, fontSize: '0.875rem' }}>
                        {selectedInvestment.analysis}
                      </Typography>
                    ) : null}
                    {selectedInvestment.explanation && (
                      <Typography variant="body2" sx={{ color: '#6B7280', mt: 2, fontSize: '0.85em' }}>
                        {selectedInvestment.explanation}
                      </Typography>
                    )}
                  </Paper>
                </Box>

                <Button
                  onClick={handleCloseModal}
                  fullWidth
                  variant="contained"
                  sx={{
                    backgroundColor: '#8B5CF6',
                    color: '#ffffff',
                    borderRadius: '12px',
                    py: 1.5,
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

        {/* ROI Calculation Modal */}
        <Dialog open={roiModalOpen} onClose={() => setRoiModalOpen(false)} maxWidth="sm" fullWidth
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
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: '#1F2937',
                fontSize: '1.125rem'
              }}
            >
              Average ROI Calculation
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6B7280', 
                mb: 2,
                fontSize: '0.875rem'
              }}
            >
              The table below shows the pessimistic, realistic, and optimistic ROI for each investment. The average for each scenario is shown at the bottom.
            </Typography>
            <TableContainer component={Paper} sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: 'none'
            }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                    <TableCell sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>Investment</TableCell>
                    <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>Pessimistic</TableCell>
                    <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>Realistic</TableCell>
                    <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>Optimistic</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {investments.map((inv, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: '#1F2937', fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>{inv.name}</TableCell>
                      <TableCell align="right" sx={{ color: '#1F2937', fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>{inv.roiScenarios ? `${parseFloat(inv.roiScenarios.pessimistic).toFixed(1)}%` : '-'}</TableCell>
                      <TableCell align="right" sx={{ color: '#1F2937', fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>{inv.roiScenarios ? `${parseFloat(inv.roiScenarios.realistic).toFixed(1)}%` : '-'}</TableCell>
                      <TableCell align="right" sx={{ color: '#1F2937', fontSize: '0.875rem', borderBottom: '1px solid #E5E7EB' }}>{inv.roiScenarios ? `${parseFloat(inv.roiScenarios.optimistic).toFixed(1)}%` : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {/* Averages Row */}
                  <TableRow sx={{ backgroundColor: '#F9FAFB', '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem' }}>Average</TableCell>
                    <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem' }}>
                      {(() => {
                        const vals = investments.map(inv => inv.roiScenarios ? parseFloat(inv.roiScenarios.pessimistic) : null).filter(v => v !== null && !isNaN(v));
                        return vals.length ? `${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)}%` : '-';
                      })()}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem' }}>
                      {(() => {
                        const vals = investments.map(inv => inv.roiScenarios ? parseFloat(inv.roiScenarios.realistic) : null).filter(v => v !== null && !isNaN(v));
                        return vals.length ? `${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)}%` : '-';
                      })()}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem' }}>
                      {(() => {
                        const vals = investments.map(inv => inv.roiScenarios ? parseFloat(inv.roiScenarios.optimistic) : null).filter(v => v !== null && !isNaN(v));
                        return vals.length ? `${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)}%` : '-';
                      })()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 3, 
                color: '#6B7280',
                fontSize: '0.75rem'
              }}
            >
              The Avg Yearly ROI shown on your portfolio is the average of the <b>realistic</b> ROI values across all your investments. Each investment's realistic ROI is estimated based on its type and data. The average is calculated as the sum of all realistic ROIs divided by the number of investments.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={() => setRoiModalOpen(false)} 
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: '#8B5CF6',
                color: '#ffffff',
                borderRadius: '12px',
                py: 1.5,
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
      </Container>
      <Footer />
    </Box>
  );
};

export default Portfolio;

