import React from 'react';
import { Box, Container, Typography, Paper, Link, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Imprint = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      py: 3,
      position: 'relative'
    }}>
      <Container maxWidth="md" sx={{ px: 2 }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
          pb: 2,
          borderBottom: '1px solid #E5E7EB'
        }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: '#1F2937',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 700,
              letterSpacing: '-0.025em'
            }}
          >
            FlowInvest
          </Typography>

          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon />}
            sx={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              px: 2,
              py: 1,
              color: '#6B7280',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#F3F4F6',
                borderColor: '#D1D5DB'
              }
            }}
          >
            Back
          </Button>
        </Box>

        <Paper sx={{
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          p: { xs: 3, md: 4 },
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              color: '#1F2937',
              fontWeight: 700,
              mb: 3,
              textAlign: 'center',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            Imprint
          </Typography>

          <Box sx={{ color: '#374151' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937', fontSize: '1.125rem' }}>
              Contact Information
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>David Habinski</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Tübingerstraße 10
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                71093 Weil im Schönbuch
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Germany
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937', fontSize: '1.125rem' }}>
                Contact Details
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Phone:</strong> <Link href="tel:+4915738222976" sx={{ color: '#8B5CF6', textDecoration: 'none' }}>
                  +49 157 38222976
                </Link>
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Email:</strong> <Link href="mailto:flowinvest.general@gmail.com" sx={{ color: '#8B5CF6', textDecoration: 'none' }}>
                  flowinvest.general@gmail.com
                </Link>
              </Typography>
            </Box>

            <Box sx={{
              mt: 4,
              pt: 3,
              borderTop: '1px solid #E5E7EB',
              textAlign: 'center'
            }}>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
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


