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
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';

export default function FastAddPortfolio({ open, onClose, onAddInvestments }) {
  const [selected, setSelected] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
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
        data = await makeRequest('/api/analyze-portfolio');
      } catch (err) {
        console.log('Relative URL failed, trying absolute URL...', err);
        data = await makeRequest('https://flowinvest2.vercel.app/api/analyze-portfolio');
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

  const handleAddSelected = () => {
    const selectedInvestments = investments.filter((_, index) => selected[index]);
    onAddInvestments(selectedInvestments);
    handleClose();
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Fast Add Portfolio
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
          <Box sx={{ textAlign: 'center', p: previews.length === 0 ? 4 : 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ py: 1.5, px: 4, mb: 2 }}
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
              {previews.length === 0 && (
                <Typography variant="body2" color="textSecondary">
                  Upload one or more screenshots of your portfolio (e.g., from your broker) showing the name and amount of each asset.
                </Typography>
              )}
            </Box>

          {previews.length > 0 && (
            <Box>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" gutterBottom>
                    Portfolio Previews:
                  </Typography>
                  <Button startIcon={<ClearIcon />} onClick={handleClear} size="small">
                    Clear All
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                  {previews.map((previewUrl, index) => (
                    <img
                      key={index}
                      src={previewUrl}
                      alt={`Portfolio preview ${index + 1}`}
                      style={{ height: '100px', borderRadius: 4 }}
                    />
                  ))}
                </Box>
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box color="error.main" my={2}>
                  <Typography variant="body2">{error}</Typography>
                </Box>
              ) : investments.length > 0 ? (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Detected Investments:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selected.length > 0 && selected.every(Boolean)}
                              indeterminate={
                                selected.some(Boolean) && !selected.every(Boolean)
                              }
                              onChange={handleSelectAll}
                            />
                          </TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {investments.map((investment, index) => (
                          <TableRow key={index}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selected[index] || false}
                                onChange={() => handleSelectOne(index)}
                              />
                            </TableCell>
                            <TableCell>{investment.name || 'Unknown'}</TableCell>
                            <TableCell>{investment.type || 'Stock'}</TableCell>
                            <TableCell align="right">
                              {typeof investment.amount === 'number'
                                ? `$${investment.amount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}`
                                : investment.amount || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : null}
            </Box>
          )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {investments.length > 0 && (
          <Button onClick={handleUpload} color="primary" disabled={loading}>
            Re-analyze
          </Button>
        )}
        <Button
          onClick={investments.length > 0 ? handleAddSelected : handleUpload}
          color="primary"
          variant="contained"
          disabled={loading || files.length === 0 || (investments.length > 0 && selected.filter(Boolean).length === 0)}
        >
          {loading ? <CircularProgress size={24} /> : (investments.length > 0 ? 'Add Selected' : 'Analyze')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
