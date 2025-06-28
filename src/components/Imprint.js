import React from 'react';
import { Box, Container, Typography, Paper, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Imprint = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4
    }}>
      <Container maxWidth="md">
        <Paper sx={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '24px',
          p: { xs: 3, md: 5 },
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}>
          <Box sx={{ mb: 4 }}>
            <Link
              component="button"
              onClick={() => navigate(-1)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#667eea',
                textDecoration: 'none',
                mb: 3,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              <ArrowBackIcon sx={{ mr: 1 }} />
              Back
            </Link>
            
            <Typography
              variant="h3"
              component="h1"
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                mb: 4,
                textAlign: 'center'
              }}
            >
              Imprint
            </Typography>
          </Box>

          <Box sx={{ color: '#1e293b' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
              Contact Information
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                David Habinski
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.6 }}>
                Tübingerstraße 10
              </Typography>
              <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.6 }}>
                71093 Weil im Schönbuch
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                Germany
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                Contact Details
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.6 }}>
                <strong>Phone:</strong> <Link href="tel:+4915738222976" sx={{ color: '#667eea', textDecoration: 'none' }}>
                  +49 157 38222976
                </Link>
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.6 }}>
                <strong>Email:</strong> <Link href="mailto:flowinvest.general@gmail.com" sx={{ color: '#667eea', textDecoration: 'none' }}>
                  flowinvest.general@gmail.com
                </Link>
              </Typography>
            </Box>

            <Box sx={{ 
              mt: 6, 
              pt: 4, 
              borderTop: '1px solid rgba(102, 126, 234, 0.2)',
              textAlign: 'center'
            }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                © 2025 FlowInvest. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Imprint; 