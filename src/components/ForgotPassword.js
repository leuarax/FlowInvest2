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
  CircularProgress,
  Link
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
        `
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Paper sx={{
            p: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                Reset Your Password
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Enter your email address and we'll send you a link to reset your password
              </Typography>
            </Box>

            {/* Success Message */}
            {success && (
              <Alert 
                severity="success" 
                icon={<CheckCircleIcon />}
                sx={{ 
                  mb: 3, 
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#065f46'
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  Password reset email sent!
                </Typography>
                <Typography variant="body2">
                  Check your email for a link to reset your password. The link will expire in 1 hour.
                </Typography>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#b91c1c'
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
                      <EmailIcon sx={{ color: '#667eea', mr: 1 }} />
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      background: 'rgba(248, 250, 252, 0.8)',
                      '&:hover fieldset': {
                        borderColor: '#667eea'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea'
                      }
                    }
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !email}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    py: 1.5,
                    px: 4,
                    fontWeight: 600,
                    mb: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                    '&:disabled': {
                      background: '#e2e8f0',
                      color: '#94a3b8'
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
                  color: '#667eea',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  }
                }}
              >
                Back to Login
              </Button>
            </Box>

            {/* Additional Info */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e2e8f0' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                Don't have an account?{' '}
                <Link 
                  href="/registration" 
                  sx={{ 
                    color: '#667eea', 
                    fontWeight: 600, 
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default ForgotPassword; 