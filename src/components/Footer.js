import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: 'auto',
        width: '100%',
        left: 0,
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
      }}
    >
      <Container maxWidth="lg" sx={{ background: 'transparent' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 3 }
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
              fontFamily: '"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 400
            }}
          >
            © 2025 FlowInvest. All rights reserved.
          </Typography>
          
          <Link
            component={RouterLink}
            to="/imprint"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'white',
                textDecoration: 'underline'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Imprint
          </Link>
          <Link
            component={RouterLink}
            to="/privacy-policy"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'white',
                textDecoration: 'underline'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Privacy Policy
          </Link>
          
          <Link
            component={RouterLink}
            to="/financial-disclaimer"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'white',
                textDecoration: 'underline'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Financial Disclaimer
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 