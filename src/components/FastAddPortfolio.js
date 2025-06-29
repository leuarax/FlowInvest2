import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Chip,
  LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function FastAddPortfolio({ open, onClose, onAddInvestments }) {
  const [selected, setSelected] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    const newPreviews = [];
    let loadedCount = 0;
    newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
            newPreviews.push(reader.result);
            loadedCount++;
            if (loadedCount === newFiles.length) {
                setPreviews(prev => [...prev, ...newPreviews]);
            }
        };
        reader.readAsDataURL(file);
    });

    setInvestments([]);
    setSelected([]);
    setError('');
    // Reset the file input value to allow selecting the same file again
    e.target.value = null;
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('screenshots', file);
      });

      const makeRequest = async (url) => {
        const res = await fetch(url, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          mode: 'cors'
        });
        const resText = await res.text();
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status} - ${resText}`);
        }
        try {
          return JSON.parse(resText);
        } catch (err) {
          throw new Error(`Invalid JSON response: ${resText.substring(0, 200)}...`);
        }
      };

      let data;
      try {
        data = await makeRequest('http://localhost:3001/api/analyze-portfolio');
      } catch (err) {
        console.log('Local server failed, trying production URL...', err);
        data = await makeRequest('/api/analyze-portfolio');
      }

      if (!data || !Array.isArray(data.data)) {
        console.error('Invalid API response structure:', data);
        throw new Error('API response did not contain an array of investments.');
      }

      const processedInvestments = data.data;

      setInvestments(processedInvestments);
      setSelected(processedInvestments.map(() => true));

    } catch (err) {
      console.error('Error analyzing portfolio:', err);
      setError(err.message || 'Failed to analyze portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(investments.map(() => true));
    } else {
      setSelected(investments.map(() => false));
    }
  };

  const handleSelectOne = (index) => {
    const newSelected = [...selected];
    newSelected[index] = !newSelected[index];
    setSelected(newSelected);
  };

  const handleAddSelected = async () => {
    setAddLoading(true);
    try {
      const selectedInvestments = investments.filter((_, index) => selected[index]);
      await onAddInvestments(selectedInvestments);
      handleClose();
    } finally {
      setAddLoading(false);
    }
  };
  
  const handleClear = () => {
    setFiles([]);
    setPreviews([]);
    setInvestments([]);
    setSelected([]);
    setError('');
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={addLoading ? undefined : handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }
      }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(10px)' }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        p: 3
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Fast Add Portfolio
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Upload screenshots to quickly analyze and add multiple investments
            </Typography>
          </Box>
          <IconButton 
            onClick={handleClose} 
            sx={{ 
              color: 'white',
              background: 'rgba(255,255,255,0.2)',
              '&:hover': {
                background: 'rgba(255,255,255,0.3)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        {/* Upload Section */}
        <Box sx={{ 
          textAlign: 'center', 
          p: previews.length === 0 ? 6 : 3,
          background: previews.length === 0 ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : 'transparent',
          borderRadius: '16px',
          border: previews.length === 0 ? '2px dashed rgba(102, 126, 234, 0.3)' : 'none',
          mb: 3,
          mt: 2
        }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              py: 2,
              px: 4,
              mb: 2,
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
            Upload Screenshot(s)
            <input 
              type="file" 
              multiple
              hidden 
              onChange={handleFileChange} 
              accept="image/*" 
            />
          </Button>

          <Typography 
            variant="caption" 
            sx={{ 
              mb: 2,
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

          {previews.length === 0 && (
            <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>
              Upload one or more screenshots of your portfolio (e.g., from your broker) showing the name and amount of each asset.
            </Typography>
          )}
        </Box>

        {/* Preview Section */}
        {previews.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Portfolio Previews ({previews.length})
              </Typography>
              <Button 
                startIcon={<ClearIcon />} 
                onClick={handleClear} 
                size="small"
                sx={{
                  color: '#ef4444',
                  borderColor: '#ef4444',
                  '&:hover': {
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: '#dc2626'
                  }
                }}
                variant="outlined"
              >
                Clear All
              </Button>
            </Box>
            
            <Paper sx={{
              p: 2,
              background: 'rgba(248, 250, 252, 0.8)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '12px'
            }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                overflowX: 'auto', 
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: 6
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: 3
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(102, 126, 234, 0.5)',
                  borderRadius: 3
                }
              }}>
                {previews.map((previewUrl, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt={`Portfolio preview ${index + 1}`}
                      style={{ 
                        height: '120px', 
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                    <Chip
                      label={`${index + 1}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(255,255,255,0.9)',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            py: 6,
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '16px',
            mb: 3
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
              Analyzing Portfolio...
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Our AI is processing your screenshots
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Paper sx={{
            p: 3,
            mb: 3,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px'
          }}>
            <Typography variant="body1" sx={{ color: '#dc2626', fontWeight: 600 }}>
              ⚠️ Analysis Error
            </Typography>
            <Typography variant="body2" sx={{ color: '#7f1d1d', mt: 1 }}>
              {error}
            </Typography>
          </Paper>
        )}

        {/* Results Table */}
        {investments.length > 0 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Detected Investments
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {selected.filter(Boolean).length} of {investments.length} selected
                </Typography>
              </Box>
              <Chip
                label={`${investments.length} found`}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>

            <TableContainer 
              component={Paper} 
              sx={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.length > 0 && selected.every(Boolean)}
                        indeterminate={
                          selected.some(Boolean) && !selected.every(Boolean)
                        }
                        onChange={handleSelectAll}
                        sx={{
                          color: '#667eea',
                          '&.Mui-checked': {
                            color: '#667eea'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#1e293b' }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {investments.map((investment, index) => (
                    <TableRow 
                      key={index}
                      sx={{
                        '&:hover': {
                          background: 'rgba(102, 126, 234, 0.05)'
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected[index] || false}
                          onChange={() => handleSelectOne(index)}
                          sx={{
                            color: '#667eea',
                            '&.Mui-checked': {
                              color: '#667eea'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {investment.name || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={investment.type || 'Stock'}
                          size="small"
                          sx={{
                            background: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea',
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                          {typeof investment.amount === 'number'
                            ? `$${investment.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}`
                            : investment.amount || 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        background: 'rgba(248, 250, 252, 0.8)',
        borderTop: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <Button 
          onClick={handleClose} 
          disabled={addLoading}
          sx={{
            color: '#64748b',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              background: 'rgba(100, 116, 139, 0.1)'
            }
          }}
        >
          Cancel
        </Button>

        {investments.length > 0 && (
          <Button 
            onClick={handleUpload} 
            disabled={loading || addLoading}
            startIcon={<RefreshIcon />}
            sx={{
              color: '#667eea',
              borderColor: '#667eea',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.1)',
                borderColor: '#5a67d8'
              }
            }}
            variant="outlined"
          >
            Re-analyze
          </Button>
        )}

        <Button
          onClick={investments.length > 0 ? handleAddSelected : handleUpload}
          variant="contained"
          disabled={loading || addLoading || files.length === 0 || (investments.length > 0 && selected.filter(Boolean).length === 0)}
          startIcon={
            (loading || addLoading) ? null : 
            investments.length > 0 ? <AddIcon /> : <AnalyticsIcon />
          }
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            minWidth: '140px',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
            },
            '&:disabled': {
              background: 'rgba(100, 116, 139, 0.3)',
              color: 'rgba(255,255,255,0.7)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {(loading || addLoading) ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            investments.length > 0 ? 'Add Selected' : 'Analyze'
          )}
        </Button>
      </DialogActions>

      {/* Loading Overlay */}
      {addLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 1301,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '24px'
          }}
        >
          <CircularProgress 
            size={60} 
            thickness={4}
            sx={{ color: '#667eea', mb: 3 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
            Adding Investments...
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Please wait while we process your selections
          </Typography>
          <LinearProgress 
            sx={{ 
              width: '200px', 
              mt: 2,
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }
            }} 
          />
        </Box>
      )}
    </Dialog>
  );
}