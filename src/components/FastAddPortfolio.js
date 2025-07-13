import React, { useState, useCallback } from 'react';
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
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function FastAddPortfolio({ open, onClose, onAddInvestments, userProfile }) {
  const [selected, setSelected] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [sampleOpen, setSampleOpen] = useState(false);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;
    processFiles(newFiles);
  };

  const processFiles = useCallback((newFiles) => {
    // Filter for valid file types
    const validFiles = newFiles.filter(file => {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Please upload PNG, JPG, or PDF files only.`);
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    const updatedFiles = [...files, ...validFiles];
    if (updatedFiles.length > 5) {
      setError('Maximum 5 files allowed. Please remove some files first.');
      return;
    }

    setFiles(updatedFiles);
    setError('');

    const newPreviews = [];
    let loadedCount = 0;
    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
            newPreviews.push({
              url: reader.result,
              name: file.name,
              size: file.size
            });
            loadedCount++;
            if (loadedCount === validFiles.length) {
                setPreviews(prev => [...prev, ...newPreviews]);
            }
        };
        reader.readAsDataURL(file);
    });

    setInvestments([]);
    setSelected([]);
    setSuccess('');
  }, [files]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [processFiles]);

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    setError('');
    
    if (newFiles.length === 0) {
      setInvestments([]);
      setSelected([]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setProcessingProgress(0);

    try {
      // Process each file individually since the screenshot endpoint expects single files
      const allInvestments = [];
      
      const makeRequest = async (url, file) => {
        const formData = new FormData();
        
        // Add single file with correct field name
        formData.append('screenshot', file);
        
        // Add user profile for personalized analysis
        console.log('User profile for analysis:', userProfile);
        if (userProfile) {
          formData.append('userProfile', JSON.stringify(userProfile));
          console.log('Added user profile to form data');
        } else {
          console.log('No user profile available for analysis');
        }

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

      // Step 1: Extract investments from screenshots
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Processing file:', file.name);
        
        // Update progress
        setProcessingProgress((i / files.length) * 50);
        
        let fileData;
        try {
          console.log('Trying local server at http://localhost:3001/api/screenshot...');
          fileData = await makeRequest('http://localhost:3001/api/screenshot', file);
        } catch (err) {
          console.log('Local server failed, trying Vercel fallback...', err);
          try {
            fileData = await makeRequest('https://flow-invest2-hpr3.vercel.app/api/screenshot', file);
          } catch (vercelErr) {
            console.error('All endpoints failed for file:', file.name, { local: err.message, vercel: vercelErr.message });
            throw new Error(`API endpoints unavailable for file ${file.name}. Please ensure the local server is running (npm run server) or try again later. Local error: ${err.message}`);
          }
        }

        // The screenshot endpoint returns investments directly (not wrapped in data property)
        if (fileData && Array.isArray(fileData)) {
          allInvestments.push(...fileData);
          console.log(`Added ${fileData.length} investments from file ${file.name}`);
        } else {
          console.warn(`No valid investments found in file ${file.name}:`, fileData);
        }
      }

      if (allInvestments.length === 0) {
        throw new Error('No valid investments found in any of the uploaded files.');
      }

      console.log('Extracted investments:', allInvestments);
      setProcessingProgress(50);

      // Use correct API base for local vs production
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      // Step 2: Analyze investments with user profile using onboarding logic
      console.log('Analyzing investments with user profile using onboarding logic...');
      const analyzedInvestments = [];
      for (let i = 0; i < allInvestments.length; i++) {
        const investment = allInvestments[i];
        // Update progress for analysis phase
        setProcessingProgress(50 + (i / allInvestments.length) * 50);
        
        // Only keep the basic fields for analysis, and default date to today if missing
        const { name, type, amount, date } = investment;
        const cleanInvestment = {
          name,
          type,
          amount,
          date: date || new Date().toISOString().split('T')[0]
        };
        // Validation: skip if missing name/type or amount is not positive
        if (!cleanInvestment.name || !cleanInvestment.type || !cleanInvestment.amount || cleanInvestment.amount <= 0) {
          console.warn('Skipping invalid investment:', cleanInvestment);
          continue;
        }
        // Log what is being sent to /api/investment
        console.log('Sending to /api/investment:', cleanInvestment, userProfile);
        try {
          let response;
          try {
            response = await fetch(`${apiBase}/api/investment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                investmentData: cleanInvestment,
                userProfile: userProfile
              })
            });
          } catch (localErr) {
            console.log('Local investment analysis failed, trying Vercel fallback...', localErr);
            response = await fetch('https://flow-invest2-hpr3.vercel.app/api/investment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                investmentData: cleanInvestment,
                userProfile: userProfile
              })
            });
          }
          if (!response.ok) {
            throw new Error(`Analysis failed for ${cleanInvestment.name}: ${response.status}`);
          }
          const analysis = await response.json();
          analyzedInvestments.push({ ...cleanInvestment, ...analysis });
        } catch (err) {
          console.error('Error analyzing investment:', cleanInvestment.name, err);
          analyzedInvestments.push({
            ...cleanInvestment,
            roiEstimate: 0,
            riskScore: 5,
            grade: 'B',
            explanation: 'Analysis could not be completed for this investment.',
            riskExplanation: 'Default risk assessment applied.',
            roiScenarios: {
              pessimistic: 0,
              realistic: 0,
              optimistic: 0
            }
          });
        }
      }
      console.log('Analyzed investments:', analyzedInvestments);
      setInvestments(analyzedInvestments);
      setSelected(analyzedInvestments.map(() => true));
      setProcessingProgress(100);

    } catch (err) {
      console.error('Error analyzing portfolio:', err);
      setError(err.message || 'Failed to analyze portfolio');
    } finally {
      setLoading(false);
      setProcessingProgress(0);
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
      if (selectedInvestments.length === 0) {
        setError('Please select at least one investment to add.');
        return;
      }
      
      console.log('Adding selected investments:', selectedInvestments);
      await onAddInvestments(selectedInvestments);
      
      // Show success message
      setSuccess(`Successfully added ${selectedInvestments.length} investments to your portfolio!`);
      setError('');
      
      // Close after a short delay to show the success message
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error adding investments:', error);
      setError(`Failed to add investments: ${error.message}`);
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
    setSuccess('');
    setProcessingProgress(0);
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              Quick-Import Portfolio (straight from your broker)
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Drop a screenshot of your holdings—we'll auto-fill the assets for you.
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
        {/* Upload Zone */}
        <Box 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{ 
            textAlign: 'center', 
            p: previews.length > 0 ? 3 : 6,
            background: dragActive 
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)' 
              : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: '16px',
            border: dragActive 
              ? '2px dashed rgba(102, 126, 234, 0.6)' 
              : '2px dashed rgba(102, 126, 234, 0.3)',
            mb: 3,
            mt: 2,
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
              border: '2px dashed rgba(102, 126, 234, 0.5)'
            }
          }}
          onClick={() => document.getElementById('file-input').click()}
        >
          {previews.length === 0 ? (
            <>
              <CloudUploadIcon 
                sx={{ 
                  fontSize: 48, 
                  color: '#667eea', 
                  mb: 2,
                  opacity: dragActive ? 0.8 : 1
                }} 
              />
              
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                📥 Drag & drop or click to upload
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                PNG, JPG or PDF · Max 10 MB · Up to 5 files
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <LockIcon sx={{ fontSize: 16, color: '#10b981', mr: 1 }} />
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                  Images processed locally — nothing ever leaves your browser.
                </Typography>
              </Box>

              {/* See a sample screenshot button */}
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
                onClick={e => {
                  e.stopPropagation();
                  setSampleOpen(true);
                }}
              >
                See a sample screenshot
              </Button>
            </>
          ) : (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  📁 Uploaded Files ({previews.length})
                </Typography>
                <Button 
                  startIcon={<ClearIcon />} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }} 
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
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 2,
                mb: 2
              }}>
                {previews.map((preview, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '8px',
                      position: 'relative',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}
                      />
                      <Box sx={{ ml: 1, flex: 1 }}>
                        <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 500 }}>
                          {formatFileSize(preview.size)} • Ready
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        sx={{
                          color: '#ef4444',
                          p: 0.5,
                          '&:hover': {
                            background: 'rgba(239, 68, 68, 0.1)'
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
              
              <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                Click to add more files or drag & drop additional files
              </Typography>
            </>
          )}
          
          <input 
            id="file-input"
            type="file" 
            multiple
            hidden 
            onChange={handleFileChange} 
            accept="image/png,image/jpeg,image/jpg,application/pdf" 
          />
        </Box>



        {/* Processing Progress */}
        {loading && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Processing files...
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {Math.round(processingProgress)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={processingProgress}
              sx={{ 
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 4
                }
              }} 
            />
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
              ⚠️ Upload Error
            </Typography>
            <Typography variant="body2" sx={{ color: '#7f1d1d', mt: 1 }}>
              {error}
            </Typography>
          </Paper>
        )}

        {/* Success State */}
        {success && (
          <Paper sx={{
            p: 3,
            mb: 3,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px'
          }}>
            <Typography variant="body1" sx={{ color: '#059669', fontWeight: 600 }}>
              ✅ Success
            </Typography>
            <Typography variant="body2" sx={{ color: '#065f46', mt: 1 }}>
              {success}
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
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
              minWidth: { xs: 'auto', sm: 'auto' },
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
            src="/sample-screenshot.jpg"
            alt="Sample screenshot"
            style={{ maxWidth: '100%', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}