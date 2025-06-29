import React from 'react';
import { Box, Container, Typography, Paper, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const FinancialDisclaimer = () => {
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
              Financial Advice Disclaimer
            </Typography>
          </Box>

          <Box sx={{ lineHeight: 1.7 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
              Important Notice
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              This disclaimer is a legally binding agreement between you and FlowInvest regarding the use of our investment analysis platform. By using FlowInvest, you acknowledge and agree to the terms outlined in this disclaimer.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              1. Not Financial Advice
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              The information, analysis, and insights provided by FlowInvest are for educational and informational purposes only. We do not provide financial advice, investment recommendations, or any form of professional financial services. Our platform is designed to assist you in making your own investment decisions, but it should not be considered as a substitute for professional financial advice.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              2. No Investment Recommendations
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              FlowInvest does not recommend, endorse, or suggest any specific investments, securities, or financial products. Any analysis, grades, risk scores, or ROI estimates provided are based on artificial intelligence algorithms and should not be interpreted as investment recommendations. You are solely responsible for your investment decisions and their outcomes.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              3. Risk Disclosure
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              All investments carry inherent risks, including but not limited to:
              <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 24 }}>
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

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              4. AI Analysis Limitations
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              Our AI-powered analysis is based on available data and algorithms, but it has limitations:
              <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 24 }}>
                <li>AI analysis may not account for all market factors or recent developments</li>
                <li>Data accuracy depends on the information provided and available sources</li>
                <li>Market conditions can change rapidly, making analysis outdated</li>
                <li>AI models may not predict unexpected events or black swan events</li>
                <li>Analysis is based on historical patterns that may not repeat</li>
              </ul>
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              5. Professional Consultation
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              We strongly recommend consulting with qualified financial professionals before making investment decisions, including:
              <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 24 }}>
                <li>Licensed financial advisors</li>
                <li>Certified financial planners (CFP)</li>
                <li>Investment professionals</li>
                <li>Tax advisors</li>
                <li>Legal counsel for complex investment structures</li>
              </ul>
              These professionals can provide personalized advice based on your specific financial situation, goals, and risk tolerance.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              6. No Guarantees
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              FlowInvest makes no guarantees regarding:
              <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 24 }}>
                <li>Investment performance or returns</li>
                <li>Accuracy of analysis or predictions</li>
                <li>Completeness of information provided</li>
                <li>Suitability of investments for your specific situation</li>
                <li>Market timing or entry/exit points</li>
              </ul>
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              7. Regulatory Compliance
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              FlowInvest is not a registered investment advisor, broker-dealer, or financial services company. We do not hold any financial licenses or registrations. Our platform is designed for educational purposes and should not be used as the sole basis for investment decisions.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              8. User Responsibility
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              By using FlowInvest, you acknowledge that:
              <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 24 }}>
                <li>You are responsible for your own investment decisions</li>
                <li>You understand the risks involved in investing</li>
                <li>You will not rely solely on our analysis for investment decisions</li>
                <li>You will seek professional advice when appropriate</li>
                <li>You accept that investment losses are possible</li>
              </ul>
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              9. Limitation of Liability
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              To the maximum extent permitted by law, FlowInvest, its owners, employees, and affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of our platform or any investment decisions made based on our analysis. This includes but is not limited to investment losses, missed opportunities, or any financial harm.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              10. Jurisdiction and Governing Law
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              This disclaimer is governed by the laws of Germany. Any disputes arising from the use of FlowInvest shall be subject to the exclusive jurisdiction of the courts in Germany. Users from other jurisdictions should be aware that local laws may provide additional protections or limitations.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              11. Updates to Disclaimer
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              We reserve the right to update this disclaimer at any time. Continued use of FlowInvest after changes constitutes acceptance of the updated terms. We will notify users of significant changes through our platform.
            </Typography>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
              12. Contact Information
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }}>
              If you have questions about this disclaimer or our services, please contact us at:
              <br />
              <b>David Habinski</b><br />
              Tübingerstraße 10<br />
              71093 Weil im Schönbuch<br />
              Germany<br />
              <b>Email:</b> flowinvest.general@gmail.com
            </Typography>

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

export default FinancialDisclaimer; 