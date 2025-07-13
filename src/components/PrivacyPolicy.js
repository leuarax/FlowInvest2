import React from 'react';
import { Box, Container, Typography, Paper, Link, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const PrivacyPolicy = () => {
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
            Privacy Policy
          </Typography>

          <Box sx={{ color: '#374151' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937', fontSize: '1.125rem' }}>
              Introduction
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              At FlowInvest, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our website and services. By accessing or using FlowInvest, you agree to the terms of this Privacy Policy.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              1. Information We Collect
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We may collect the following types of information:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li><b>Personal Information:</b> Name, email address, phone number, and other contact details you provide when registering or contacting us.</li>
                <li><b>Investment Data:</b> Information about your investment portfolio, preferences, and goals that you enter into the platform.</li>
                <li><b>Usage Data:</b> Details about how you use our website, including IP address, browser type, device information, and pages visited.</li>
              </ul>
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              2. How We Use Your Information
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We use your information to:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li>Provide, operate, and maintain the FlowInvest platform</li>
                <li>Personalize your experience and deliver tailored investment insights</li>
                <li>Analyze usage and improve our services</li>
                <li>Communicate with you about updates, offers, and support</li>
                <li>Comply with legal obligations and protect our rights</li>
              </ul>
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              3. Data Sharing and Disclosure
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We do not sell your personal information. We may share your data with:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li>Service providers who help us operate and improve our platform</li>
                <li>Legal authorities if required by law or to protect our rights</li>
                <li>Other parties with your explicit consent</li>
              </ul>
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              4. Data Processing and Storage
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We use Supabase, a third-party service provider, to process and store your data. Supabase provides:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li><b>Authentication Services:</b> Secure user registration, login, and session management</li>
                <li><b>Database Storage:</b> Secure storage of your profile information, investment data, and preferences</li>
                <li><b>Data Security:</b> Industry-standard encryption and security measures to protect your information</li>
              </ul>
              Supabase is a service provided by Supabase Inc. and is subject to their own privacy policy, which can be found at <Link href="https://supabase.com/privacy" target="_blank" sx={{ color: '#8B5CF6' }}>https://supabase.com/privacy</Link>. By using FlowInvest, you acknowledge that your data will be processed by Supabase in accordance with their privacy policy and our data processing agreement.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              5. Data Security
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We implement industry-standard security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              6. Your Rights and Choices
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              You have the right to:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li>Access, update, or delete your personal information</li>
                <li>Opt out of marketing communications</li>
                <li>Request information about how your data is processed</li>
              </ul>
              To exercise these rights, please contact us at <b>flowinvest.general@gmail.com</b>.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              7. International Data Transfers
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Your information may be transferred to and processed in countries outside your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable laws.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              8. Children's Privacy
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              FlowInvest is not intended for children under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              9. Changes to This Privacy Policy
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the effective date below.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              10. Contact Us
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
              <br />
              <b>David Habinski</b><br />
              Tübingerstraße 10<br />
              71093 Weil im Schönbuch<br />
              Germany<br />
              <b>Email:</b> flowinvest.general@gmail.com
            </Typography>

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

export default PrivacyPolicy;


