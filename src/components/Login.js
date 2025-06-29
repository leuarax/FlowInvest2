import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Paper,
  Link,
  IconButton,
  InputAdornment,
  Fade,
  Alert
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Global variable to persist error across component re-mounts
let globalLoginError = '';

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showError, setShowError] = useState(false);
  const prevFormDataRef = useRef({ email: '', password: '' });
  const errorRef = useRef('');

  console.log('Login component rendered, loginError:', loginError, 'showError:', showError, 'errorRef.current:', errorRef.current, 'globalLoginError:', globalLoginError);

  // Debug effect to track error state changes
  React.useEffect(() => {
    console.log('Error state changed - loginError:', loginError, 'showError:', showError);
    if (loginError && !showError) {
      console.log('WARNING: loginError is set but showError is false!');
    }
    if (!loginError && showError) {
      console.log('WARNING: showError is true but loginError is empty!');
    }
  }, [loginError, showError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const prevValue = prevFormDataRef.current[name];
    console.log('handleInputChange called for:', name, 'with value:', value, 'previous value:', prevValue);
    
    // Update the ref with current values
    prevFormDataRef.current = { ...prevFormDataRef.current, [name]: value };
    
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear field-specific errors when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
    // Only clear login error if user actually changed the input (not during re-renders)
    if (loginError && value !== prevValue) {
      console.log('Clearing loginError due to user input');
      setLoginError('');
      setShowError(false);
      errorRef.current = '';
      globalLoginError = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Don't clear error at the start - let it persist until we know the result

    try {
      console.log('Attempting to sign in with email:', formData.email);
      const result = await signIn(formData.email, formData.password);
      console.log('SignIn result:', result);
      
      const { user, error } = result;
      
      if (error) {
        console.error('Login error:', error);
        let errorMsg = 'Invalid email or password. Please check your credentials and try again.';
        
        // Handle specific error messages
        if (error.message && error.message.includes('verify your email')) {
          errorMsg = error.message;
        } else if (error.code === 'auth/user-not-found') {
          errorMsg = 'No account found with this email address. Please check your email or create a new account.';
        } else if (error.code === 'auth/wrong-password') {
          errorMsg = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMsg = 'Too many failed login attempts. Please try again later.';
        }
        
        console.log('Setting loginError to:', errorMsg);
        
        // Set error in global variable, ref and state
        globalLoginError = errorMsg;
        errorRef.current = errorMsg;
        setLoginError(errorMsg);
        console.log('About to set showError to true');
        setShowError(true);
        console.log('setShowError(true) called');
        
        console.log('setLoginError called');
        return;
      }

      if (user) {
        console.log('Login successful, user:', user);
        // Clear error on successful login
        setLoginError('');
        setShowError(false);
        errorRef.current = '';
        globalLoginError = '';
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      const errorMsg = 'Invalid email or password. Please check your credentials and try again.';
      globalLoginError = errorMsg;
      errorRef.current = errorMsg;
      setLoginError(errorMsg);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
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
                variant="h3" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Sign in to your FlowInvest account
              </Typography>
            </Box>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
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

              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
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

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleForgotPassword}
                  sx={{
                    color: '#667eea',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)'
                  },
                  '&:disabled': {
                    background: '#e2e8f0',
                    color: '#94a3b8'
                  }
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>

            {/* Login Error Alert */}
            {globalLoginError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {globalLoginError}
              </Alert>
            )}
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login; 