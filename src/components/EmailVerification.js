import React, { useState } from 'react';
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

const EmailVerification = () => {
  const { user, verificationLoading, checkEmailVerificationStatus, resendVerificationEmailHandler } = useAuth();
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleCheckVerification = async () => {
    const { error } = await checkEmailVerificationStatus();
    if (error) {
      console.error('Error checking verification status:', error);
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
            border: '1px solid rgba(255, 255, 255, 0.3)',
            textAlign: 'center'
          }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <EmailIcon sx={{ fontSize: 64, color: '#667eea', mb: 2 }} />
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
                Verify Your Email
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
                We've sent a verification link to:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {user.email}
              </Typography>
            </Box>

            {/* Instructions */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
                Please check your email and click the verification link to continue.
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Don't see the email? Check your spam folder.
              </Typography>
            </Box>

            {/* Success/Error Messages */}
            {resendSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Verification email sent successfully!
              </Alert>
            )}
            
            {resendError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {resendError}
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  py: 1.5,
                  px: 4,
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
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
                  px: 4,
                  fontWeight: 600,
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  }
                }}
              >
                Resend Verification Email
              </Button>
            </Box>

            {/* Additional Info */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e2e8f0' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Having trouble? Contact support at{' '}
                <Box component="span" sx={{ color: '#667eea', fontWeight: 600 }}>
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