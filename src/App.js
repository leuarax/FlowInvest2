import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';

// Components
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import InvestmentForm from './components/InvestmentForm';
import AddRealEstate from './components/AddRealEstate';
import Imprint from './components/Imprint';
import PrivacyPolicy from './components/PrivacyPolicy';
import FinancialDisclaimer from './components/FinancialDisclaimer';
import Login from './components/Login';
import Registration from './components/Registration';
import EmailVerification from './components/EmailVerification';
import ForgotPassword from './components/ForgotPassword';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, emailVerified, loading } = useAuth();
  console.log('ProtectedRoute', { loading, user, emailVerified });
  
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <CircularProgress 
          size={80}
          thickness={4}
          sx={{
            color: 'white',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but email is not verified, redirect to email verification
  if (!emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  
  console.log('Matched /dashboard route (inside ProtectedRoute)');
  return children;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  console.log('PublicRoute', { loading, user, userProfile });
  
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <CircularProgress 
          size={80}
          thickness={4}
          sx={{
            color: 'white',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
      </Box>
    );
  }
  
  // Only redirect to dashboard if user has both auth and profile
  if (user && userProfile) {
    console.log('User authenticated with profile, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Email Verification Route Component
const EmailVerificationRoute = ({ children }) => {
  const { user, emailVerified, loading } = useAuth();
  console.log('EmailVerificationRoute', { loading, user, emailVerified });
  
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <CircularProgress 
          size={80}
          thickness={4}
          sx={{
            color: 'white',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If email is already verified, redirect to dashboard
  if (emailVerified) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#007AFF',
      light: '#3399FF',
      dark: '#0052CC',
    },
    secondary: {
      main: '#FF3B30',
      light: '#FF6B60',
      dark: '#D93025',
    },
    background: {
      default: '#F5F5F7',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.1)',
    '0px 2px 4px rgba(0, 0, 0, 0.1)',
    '0px 3px 6px rgba(0, 0, 0, 0.1)',
    '0px 4px 8px rgba(0, 0, 0, 0.1)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: '12px 24px',
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

console.log('App.js loaded');

function AppRoutes() {
  console.log('AppRoutes rendered');
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/registration" element={
        <PublicRoute>
          <Registration />
        </PublicRoute>
      } />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/portfolio" element={
        <ProtectedRoute>
          <Portfolio />
        </ProtectedRoute>
      } />
      <Route path="/add-investment" element={
        <ProtectedRoute>
          <InvestmentForm />
        </ProtectedRoute>
      } />
      <Route path="/add-real-estate" element={
        <ProtectedRoute>
          <AddRealEstate />
        </ProtectedRoute>
      } />
      <Route path="/verify-email" element={
        <EmailVerificationRoute>
          <EmailVerification />
        </EmailVerificationRoute>
      } />
      <Route path="/imprint" element={<Imprint />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/financial-disclaimer" element={<FinancialDisclaimer />} />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      } />
    </Routes>
  );
}

function App() {
  console.log('App rendered');
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <AppRoutes />
        </Box>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

