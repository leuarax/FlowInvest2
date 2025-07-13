import React from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const FinancialDisclaimer = () => {
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
            Financial Advice Disclaimer
          </Typography>

          <Box sx={{ lineHeight: 1.6, color: '#374151' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1F2937', fontSize: '1.125rem' }}>
              Important Notice
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              This disclaimer is a legally binding agreement between you and FlowInvest regarding the use of our investment analysis platform. By using FlowInvest, you acknowledge and agree to the terms outlined in this disclaimer.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              1. Not Financial Advice
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              The information, analysis, and insights provided by FlowInvest are for educational and informational purposes only. We do not provide financial advice, investment recommendations, or any form of professional financial services. Our platform is designed to assist you in making your own investment decisions, but it should not be considered as a substitute for professional financial advice.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              2. No Investment Recommendations
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              FlowInvest does not recommend, endorse, or suggest any specific investments, securities, or financial products. Any analysis, grades, risk scores, or ROI estimates provided are based on artificial intelligence algorithms and should not be interpreted as investment recommendations. You are solely responsible for your investment decisions and their outcomes.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              3. Risk Disclosure
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              All investments carry inherent risks, including but not limited to:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li>Market risk and volatility</li>
                <li>Economic downturns and recessions</li>
                <li>Company-specific risks and business failures</li>
                <li>Regulatory and legal changes</li>
                <li>Currency fluctuations (for international investments)</li>
                <li>Liquidity risk</li>
                <li>Inflation risk</li>
              </ul>
              Past performance does not guarantee future results. You may lose some or all of your invested capital.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              4. AI Analysis Limitations
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Our AI-powered analysis is based on available data and algorithms, but it has limitations:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li>AI analysis may not account for all market factors or recent developments</li>
                <li>Data accuracy depends on the information provided and available sources</li>
                <li>Market conditions can change rapidly, making analysis outdated</li>
                <li>AI models may not predict unexpected events or black swan events</li>
                <li>Analysis is based on historical patterns that may not repeat</li>
              </ul>
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              5. Professional Consultation
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We strongly recommend consulting with qualified financial professionals before making investment decisions, including:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li>Licensed financial advisors</li>
                <li>Certified financial planners (CFP)</li>
                <li>Investment professionals</li>
                <li>Tax advisors</li>
                <li>Legal counsel for complex investment structures</li>
              </ul>
              These professionals can provide personalized advice based on your specific financial situation, goals, and risk tolerance.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              6. No Guarantees
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              FlowInvest makes no guarantees regarding:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li>Investment performance or returns</li>
                <li>Accuracy of analysis or predictions</li>
                <li>Completeness of information provided</li>
                <li>Suitability of investments for your specific situation</li>
                <li>Market timing or entry/exit points</li>
              </ul>
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              7. Regulatory Compliance
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              FlowInvest is not a registered investment advisor, broker-dealer, or financial services company. We do not hold any financial licenses or registrations. Our platform is designed for educational purposes and should not be used as the sole basis for investment decisions.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              8. User Responsibility
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              By using FlowInvest, you acknowledge that:
              <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '24px' }}>
                <li>You are responsible for your own investment decisions</li>
                <li>You understand the risks involved in investing</li>
                <li>You will not rely solely on our analysis for investment decisions</li>
                <li>You will seek professional advice when appropriate</li>
                <li>You accept that investment losses are possible</li>
              </ul>
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              9. Limitation of Liability
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              To the maximum extent permitted by law, FlowInvest, its owners, employees, and affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of our platform or any investment decisions made based on our analysis. This includes but is not limited to investment losses, missed opportunities, or any financial harm.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              10. Jurisdiction and Governing Law
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              This disclaimer is governed by the laws of Germany. Any disputes arising from the use of FlowInvest shall be subject to the exclusive jurisdiction of the courts in Germany. Users from other jurisdictions should be aware that local laws may provide additional protections or limitations.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              11. Updates to Disclaimer
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We reserve the right to update this disclaimer at any time. Continued use of FlowInvest after changes constitutes acceptance of the updated terms. We will notify users of significant changes through our platform.
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1F2937', fontSize: '1.125rem' }}>
              12. Contact Information
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              If you have questions about this disclaimer or our services, please contact us at:
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

export default FinancialDisclaimer;


