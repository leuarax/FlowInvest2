import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Paper,
  Fade,
  Alert,
  CircularProgress
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        let errorMessage = 'Failed to send password reset email. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Too many password reset attempts. Please try again later.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address.';
        }
        
        setError(errorMessage);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Paper sx={{
            p: 4,
            backgroundColor: '#F9FAFB',
            borderRadius: '16px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB'
          }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{ 
                  fontWeight: 700,
                  color: '#1F2937',
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                Reset Your Password
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280' }}>
                Enter your email address to receive a reset link.
              </Typography>
            </Box>

            {/* Success Message */}
            {success && (
              <Alert 
                severity="success" 
                icon={<CheckCircleIcon />}
                sx={{ 
                  mb: 3, 
                  borderRadius: '8px',
                  backgroundColor: '#ECFDF5',
                  color: '#059669'
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  Password reset email sent!
                </Typography>
                <Typography variant="body2">
                  Check your email for a link to reset your password.
                </Typography>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626'
                }}
              >
                {error}
              </Alert>
            )}

            {/* Password Reset Form */}
            {!success && (
              <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  error={!!emailError}
                  helperText={emailError}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <EmailIcon sx={{ color: '#9CA3AF', mr: 1 }} />
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#ffffff',
                      '& fieldset': {
                        borderColor: '#E5E7EB',
                      },
                      '&:hover fieldset': {
                        borderColor: '#D1D5DB',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#8B5CF6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#6B7280',
                    },
                    '& .MuiInputBase-input': {
                      color: '#1F2937',
                    }
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !email}
                  startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : null}
                  sx={{
                    backgroundColor: '#8B5CF6',
                    color: '#ffffff',
                    borderRadius: '12px',
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#7C3AED',
                      boxShadow: 'none'
                    },
                    '&:disabled': {
                      backgroundColor: '#E5E7EB',
                      color: '#9CA3AF'
                    }
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </Box>
            )}

            {/* Back to Login */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={handleBackToLogin}
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: '#6B7280',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#F3F4F6'
                  }
                }}
              >
                Back to Login
              </Button>
            </Box>


          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default ForgotPassword;


