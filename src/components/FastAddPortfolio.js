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

export default function FastAddPortfolio({ open, onClose, onAddInvestments }) {
  const [selected, setSelected] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Reset state
    setInvestments([]);
    setSelected([]);
    setError('');
  };

  const handleUpload = async () => {
    if (!preview) return;
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      const file = await fetch(preview).then(r => r.blob());
      formData.append('screenshot', file, 'portfolio.png');
      
      console.log('Sending request to analyze portfolio...');
      
      const response = await fetch('http://localhost:3001/api/analyze-portfolio', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json().catch(e => {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid response from server');
      });
      
      console.log('Received response:', data);
      
      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }
      
      // Handle both array and single object responses
      let investments = [];
      if (Array.isArray(data.investments)) {
        investments = data.investments;
      } else if (data.investments && typeof data.investments === 'object') {
        investments = [data.investments];
      } else if (Array.isArray(data)) {
        investments = data;
      } else if (data && typeof data === 'object') {
        investments = [data];
      }
      
      console.log('Processed investments:', investments);
      setInvestments(investments);
      setSelected(Array(investments.length).fill(true));
    } catch (err) {
      console.error('Error analyzing portfolio:', err);
      setError(err.message || 'Failed to analyze portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (event) => {
    setSelected(selected.map(() => event.target.checked));
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

  const handleClose = () => {
    setPreview('');
    setInvestments([]);
    setSelected([]);
    setError('');
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
        {!preview ? (
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
          >
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="portfolio-upload"
              type="file"
              onChange={handleFileChange}
              capture="environment"
            />
            <label htmlFor="portfolio-upload">
              <Box display="flex" flexDirection="column" alignItems="center">
                <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
                <Typography variant="h6">Upload Portfolio Screenshot</Typography>
                <Typography variant="body2" color="textSecondary">
                  Upload a screenshot of your portfolio to quickly add multiple investments
                </Typography>
              </Box>
            </label>
          </Box>
        ) : (
          <Box>
            {preview && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Portfolio Preview:
                </Typography>
                <img
                  src={preview}
                  alt="Portfolio preview"
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 4 }}
                />
              </Box>
            )}

            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : investments.length > 0 ? (
              <Box mt={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Detected Investments:
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selected.every(Boolean)}
                            onChange={handleSelectAll}
                            indeterminate={selected.some(Boolean) && !selected.every(Boolean)}
                          />
                        </TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Quantity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {investments.map((investment, index) => (
                        <TableRow key={index} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selected[index]}
                              onChange={() => handleSelectOne(index)}
                            />
                          </TableCell>
                          <TableCell>{investment.name}</TableCell>
                          <TableCell>{investment.type}</TableCell>
                          <TableCell align="right">
                            {investment.amount?.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            })}
                          </TableCell>
                          <TableCell>{investment.quantity || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : null}
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {preview ? (
          <>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="retry-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="retry-upload">
              <Button component="span" color="inherit">
                Retry
              </Button>
            </label>
            {investments.length > 0 ? (
              <Button
                onClick={handleAddSelected}
                color="primary"
                variant="contained"
                disabled={!selected.some(Boolean)}
              >
                Add Selected ({selected.filter(Boolean).length})
              </Button>
            ) : (
              <Button
                onClick={handleUpload}
                color="primary"
                variant="contained"
                disabled={!preview}
              >
                Analyze Portfolio
              </Button>
            )}
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
