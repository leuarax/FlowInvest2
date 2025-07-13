import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Fade,
  Alert
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmailVerification = () => {
  const { user, emailVerified, verificationLoading, checkEmailVerificationStatus, resendVerificationEmailHandler } = useAuth();
  const navigate = useNavigate();
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [checkError, setCheckError] = useState('');

  // Redirect to dashboard if email is already verified
  useEffect(() => {
    if (emailVerified) {
      console.log('Email verified, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [emailVerified, navigate]);

  const handleCheckVerification = async () => {
    setCheckError('');
    console.log('Checking email verification status...');
    
    const { isVerified, error } = await checkEmailVerificationStatus();
    
    if (error) {
      console.error('Error checking verification status:', error);
      setCheckError('Failed to check verification status. Please try again.');
    } else if (isVerified) {
      console.log('Email verification successful, redirecting...');
      navigate('/dashboard');
    } else {
      setCheckError('Email not verified yet. Please check your inbox and click the verification link.');
    }
  };

  const handleResendEmail = async () => {
    setResendError('');
    setResendSuccess(false);
    
    const { error } = await resendVerificationEmailHandler();
    
    if (error) {
      setResendError('Failed to resend verification email. Please try again.');
    } else {
      setResendSuccess(true);
    }
  };

  if (!user) {
    return null;
  }

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
            border: '1px solid #E5E7EB',
            textAlign: 'center'
          }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <EmailIcon sx={{ fontSize: 64, color: '#8B5CF6', mb: 2 }} />
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
                Verify Your Email
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280', mb: 2 }}>
                We've sent a verification link to:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
                {user.email}
              </Typography>
            </Box>

            {/* Instructions */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ color: '#6B7280', mb: 2 }}>
                Please check your inbox and click the verification link.
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                Didn't receive it? Check your spam folder or resend.
              </Typography>
            </Box>

            {/* Success/Error Messages */}
            {resendSuccess && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669' }}>
                Verification email sent successfully!
              </Alert>
            )}
            
            {resendError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px', backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                {resendError}
              </Alert>
            )}

            {checkError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px', backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                {checkError}
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleCheckVerification}
                disabled={verificationLoading}
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
                  }
                }}
              >
                {verificationLoading ? 'Checking...' : "I've Verified My Email"}
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={handleResendEmail}
                disabled={verificationLoading}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: '#D1D5DB',
                  color: '#6B7280',
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                    borderColor: '#9CA3AF'
                  }
                }}
              >
                Resend Email
              </Button>
            </Box>

            {/* Additional Info */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E5E7EB' }}>
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                Need help? Contact support at{' '}
                <Box component="span" sx={{ color: '#8B5CF6', fontWeight: 600 }}>
                  support@flowinvest.com
                </Box>
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default EmailVerification;

