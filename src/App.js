import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography } from '@mui/material';

// Components
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import InvestmentForm from './components/InvestmentForm';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Router>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-investment" element={<InvestmentForm />} />
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
