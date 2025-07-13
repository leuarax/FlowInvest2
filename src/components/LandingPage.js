import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Container, Grid, Card, CardContent,
  Avatar, Fade, Slide, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import ChatIcon from '@mui/icons-material/Chat';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Footer from './Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const [animationTrigger, setAnimationTrigger] = useState(false);

  useEffect(() => {
    setAnimationTrigger(true);
  }, []);

  // Clear onboarding localStorage when landing page loads
  useEffect(() => {
    // Only clear onboarding data if user is not coming from onboarding flow
    const onboardingData = localStorage.getItem('onboardingData');
    if (!onboardingData) {
      // User is starting fresh, clear any leftover data
      localStorage.removeItem('onboardingStep');
      localStorage.removeItem('randomizedReferralOptions');
    }
    // Don't clear onboardingData if it exists - user might be coming from onboarding
  }, []);

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
      title: "AI Analysis",
      description: "AI-powered insights for informed decisions.",
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
      title: "Portfolio Overview",
      description: "Instant view of holdings and risk.",
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
      title: "Risk Assessment",
      description: "Comprehensive risk analysis and scoring.",
    },
    {
      icon: <HomeIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
      title: "Real Estate Tools",
      description: "Specialized tools for property analysis.",
    },
    {
      icon: <AssessmentIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
      title: "Investment Grading",
      description: "Clear A-F grades with detailed explanations.",
    },
    {
      icon: <ChatIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
      title: "Stress Testing",
      description: "Pressure-test portfolios with market shocks.",
    }
  ];

  const benefits = [
    "Make data-driven investment decisions",
    "Reduce investment risk through AI analysis",
    "Optimize portfolio performance automatically",
    "Access professional-grade investment tools",
    "Get personalized investment recommendations",
    "Be more aware of your portfolio"
  ];

  const testimonials = [
    {
      name: "Sarah J.",
      role: "Portfolio Manager",
      content: "FlowInvest transformed my analysis. AI insights are incredibly accurate, optimizing my portfolio by 23%. ",
      rating: 5
    },
    {
      name: "Michael C.",
      role: "Real Estate Investor",
      content: "The real estate tools are phenomenal. I quickly evaluate properties and make confident decisions.",
      rating: 5
    },
    {
      name: "Emma R.",
      role: "Financial Advisor",
      content: "My clients love the clear investment grades. It makes complex finance easy to understand.",
      rating: 5
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1F2937',
            fontSize: { xs: '1.75rem', sm: '2.25rem' }
          }}
        >
          FlowInvest
        </Typography>
        
        <Button
          variant="text"
          onClick={handleLogin}
          sx={{
            color: '#6B7280',
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(107, 114, 128, 0.04)',
            },
          }}
        >
          Sign In
        </Button>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8, mt: 8 }}>
          <Fade in={animationTrigger} timeout={1000}>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: '#1F2937',
                  mb: 1,
                  fontSize: { xs: '2.5rem', sm: '3rem' }
                }}
              >
                Analyze your Portfolio in under 2 Minutes
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#6B7280',
                  mb: 6,
                  maxWidth: '600px',
                  mx: 'auto',
                  lineHeight: 1.5,
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }}
              >
                Enter your Data. Upload a Screenshot. Instantly see all your strenghts and weaknesses. All powered by cutting-edge AI
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  startIcon={<RocketLaunchIcon />}
                  sx={{
                    backgroundColor: '#8B5CF6',
                    color: '#ffffff',
                    borderRadius: '16px',
                    px: 6,
                    py: 2,
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
                    '&:hover': {
                      backgroundColor: '#7C3AED',
                      boxShadow: '0 6px 16px rgba(139, 92, 246, 0.3)',
                    },
                  }}
                >
                  Get Started
                </Button>
              </Box>
              
              {/* Landing Page Screenshot */}
              <Fade in={animationTrigger} timeout={1500}>
                <Box sx={{ 
                  mt: 6, 
                  display: 'flex', 
                  justifyContent: 'center',
                  px: 2
                }}>
                  <Box sx={{
                    maxWidth: '100%',
                    width: { xs: '100%', sm: '90%', md: '80%', lg: '70%' },
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#ffffff',
                    position: 'relative'
                  }}>
                    <img
                      src="/landing-page-screenshot (2).png"
                      alt="FlowInvest Platform Screenshot"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: '16px',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                        pointerEvents: 'none',
                        WebkitTouchCallout: 'none',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    />
                    {/* Gradient overlay for bottom fade */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '100px',
                      background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.5) 100%)',
                      pointerEvents: 'none'
                    }} />
                    
                    {/* Gradient overlay for top fade */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '100px',
                      background: 'linear-gradient(to top, transparent 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.5) 100%)',
                      pointerEvents: 'none'
                    }} />
                    
                    {/* Gradient overlay for left side fade */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: '80px',
                      background: 'linear-gradient(to right, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
                      pointerEvents: 'none'
                    }} />
                    
                    {/* Gradient overlay for right side fade */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      right: 0,
                      width: '80px',
                      background: 'linear-gradient(to left, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
                      pointerEvents: 'none'
                    }} />
                  </Box>
                </Box>
              </Fade>
              
              {/* Slogan */}
              <Fade in={animationTrigger} timeout={1800}>
                <Box sx={{ 
                  mt: 4, 
                  textAlign: 'center',
                  px: 2
                }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: '#6B7280',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      fontStyle: 'italic',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Everything in one place
                  </Typography>
                </Box>
              </Fade>
            </Box>
          </Fade>

        </Box>
      </Container>

      {/* Stats Section */}
      <Box sx={{
        backgroundColor: '#F9FAFB',
        py: 8,
        mt: -3,
        borderTop: '1px solid #E5E7EB',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: '#1F2937',
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}>
              Trusted by Investors Worldwide
            </Typography>
            <Typography variant="body1" sx={{
              color: '#6B7280',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.5
            }}>
              Our AI has analyzed billions in assets with proven accuracy and reliability.
            </Typography>
          </Box>

          <Slide direction="up" in={animationTrigger} timeout={1200}>
            <Grid container spacing={3}>
              {[
                { number: "35yrs", label: "Market Data" },
                { number: "$2.5B+", label: "Assets Analyzed" },
                { number: "95%", label: "Accuracy" },
                { number: "24/7", label: "AI Support" }
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box sx={{
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    p: 3,
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="h4" sx={{
                      fontWeight: 700,
                      color: '#8B5CF6',
                      mb: 1
                    }}>
                      {stat.number}
                    </Typography>
                    <Typography variant="body1" sx={{
                      color: '#6B7280',
                      fontWeight: 500
                    }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Slide>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{
        backgroundColor: '#F9FAFB',
        py: 8,
      }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: '#1F2937',
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}>
              Key Features
            </Typography>
            <Typography variant="body1" sx={{
              color: '#6B7280',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.5
            }}>
              Everything you need for smarter investment decisions, powered by AI.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Fade in={animationTrigger} timeout={1000 + index * 100}>
                  <Card sx={{
                    height: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    p: 2,
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                  }}>
                    <CardContent>
                      <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '8px',
                        backgroundColor: '#F3EBFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" sx={{
                        fontWeight: 600,
                        color: '#1F2937',
                        mb: 1
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{
                        color: '#6B7280',
                        lineHeight: 1.5
                      }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box sx={{
        backgroundColor: '#1F2937',
        py: 8,
        color: '#ffffff'
      }}>
        <Container maxWidth="md">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2rem', sm: '2.5rem' }
              }}>
                Why Choose FlowInvest?
              </Typography>
              <Typography variant="body1" sx={{
                color: '#D1D5DB',
                mb: 4,
                lineHeight: 1.5
              }}>
                Transform your investment strategy with cutting-edge AI—unlock smarter insights and optimized portfolios today.
              </Typography>

              <Box sx={{ mb: 4 }}>
                {benefits.map((benefit, index) => (
                  <Fade in={animationTrigger} timeout={1500 + index * 100} key={index}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1.5
                    }}>
                      <CheckCircleIcon sx={{
                        color: '#10B981',
                        mr: 1,
                        fontSize: 20
                      }} />
                      <Typography variant="body2" sx={{
                        fontWeight: 500,
                        color: '#ffffff'
                      }}>
                        {benefit}
                      </Typography>
                    </Box>
                  </Fade>
                ))}
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={handleGetStarted}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  backgroundColor: '#8B5CF6',
                  color: '#ffffff',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    boxShadow: '0 6px 16px rgba(139, 92, 246, 0.3)',
                  },
                }}
              >
                Get Started Now
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{
                backgroundColor: '#374151',
                borderRadius: '12px',
                p: 3,
                border: '1px solid #4B5563',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              }}>
                <Typography variant="h5" sx={{
                  fontWeight: 600,
                  mb: 2,
                  textAlign: 'center',
                  color: '#ffffff'
                }}>
                  Investment Success Rate
                </Typography>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="h2" sx={{
                    fontSize: '3rem',
                    fontWeight: 700,
                    color: '#10B981'
                  }}>
                    95%
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{
                  textAlign: 'center',
                  color: '#D1D5DB',
                  lineHeight: 1.5
                }}>
                  Back-tested portfolios outperformed their benchmarks in the first three months on FlowInvest.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{
        backgroundColor: '#ffffff',
        py: 8
      }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: '#1F2937',
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}>
              What Our Users Say
            </Typography>
            <Typography variant="body1" sx={{
              color: '#6B7280',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.5
            }}>
              Join thousands of satisfied investors who have transformed their investment strategy with FlowInvest.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Fade in={animationTrigger} timeout={1800 + index * 100}>
                  <Card sx={{
                    height: '100%',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '12px',
                    p: 2,
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{
                          width: 48,
                          height: 48,
                          bgcolor: '#8B5CF6',
                          mr: 1.5
                        }}>
                          {testimonial.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{
                            fontWeight: 600,
                            color: '#1F2937'
                          }}>
                            {testimonial.name}
                          </Typography>
                          <Typography variant="body2" sx={{
                            color: '#6B7280'
                          }}>
                            {testimonial.role}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{
                        color: '#374151',
                        lineHeight: 1.5,
                        mb: 2,
                        fontStyle: 'italic'
                      }}>
                        "{testimonial.content}"
                      </Typography>

                      <Box sx={{ display: 'flex' }}>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <StarIcon key={i} sx={{
                            color: '#FBBF24',
                            fontSize: 16
                          }} />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box sx={{
        backgroundColor: '#F9FAFB',
        py: 8,
        borderTop: '1px solid #E5E7EB'
      }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: '#1F2937',
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}>
              Frequently Asked Questions
            </Typography>
            <Typography variant="body1" sx={{
              color: '#6B7280',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.5
            }}>
              Everything you need to know about FlowInvest and AI-powered investment analysis.
            </Typography>
          </Box>

          <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
            {[
              {
                question: "How does FlowInvest analyze my portfolio?",
                answer: "FlowInvest uses advanced AI algorithms to analyze your investments, considering factors like diversification, risk tolerance, market conditions, and your personal goals. We provide detailed grades, risk scores, and actionable recommendations."
              },
              {
                question: "Is my financial data secure?",
                answer: "Absolutely. We use bank-level encryption and security measures to protect your data. Your information is never shared with third parties, and we comply with all major financial data protection regulations."
              },
              {
                question: "How accurate is the AI analysis?",
                answer: "Our AI has been trained on 35+ years of market data and achieves 95% accuracy in portfolio analysis. The system continuously learns and improves from new market data and user feedback."
              },
              {
                question: "What types of investments does FlowInvest support?",
                answer: "We support stocks, bonds, ETFs, mutual funds, real estate investments, commodities, cryptocurrencies, options, futures, and much more. Our AI can analyze both individual investments and entire portfolios across multiple asset classes."
              },
              {
                question: "How long does it take to get my first analysis?",
                answer: "You can get your first portfolio analysis in under 2 minutes. Simply upload a screenshot of your portfolio and let the AI do its work."
              },
              {
                question: "Do I need to be an investment expert to use FlowInvest?",
                answer: "Not at all! FlowInvest is designed for investors of all experience levels. Our AI explains complex financial concepts in simple terms and provides clear, actionable recommendations."
              },
              {
                question: "Can I use FlowInvest for real estate investments?",
                answer: "Yes! We have specialized tools for real estate analysis, including cash flow analysis, ROI calculations, and market trend assessments. Our AI can evaluate both residential and commercial properties."
              },
              {
                question: "What if I disagree with the AI recommendations?",
                answer: "FlowInvest provides recommendations, but you always maintain full control over your investment decisions. Our analysis is meant to inform, not replace, your judgment. You can accept, modify, or ignore any suggestions."
              },
              {
                question: "How often should I update my portfolio analysis?",
                answer: "We recommend updating your analysis monthly or whenever you make significant changes to your portfolio. Our AI can track changes over time and show you how your portfolio's performance and risk profile evolve."
              },
              {
                question: "Is there a limit to how many investments I can analyze?",
                answer: "No limits! You can analyze portfolios of any size, from a few investments to hundreds of different assets. Our AI scales to handle portfolios of all sizes efficiently."
              },
              {
                question: "What makes FlowInvest different from other investment apps?",
                answer: "Unlike traditional apps that just track performance, FlowInvest provides intelligent analysis powered by AI. We don't just show you what's going on, we explain why and predict what might happen next, with personalized recommendations."
              },
            ].map((faq, index) => (
              <Fade in={animationTrigger} timeout={2000 + index * 100} key={index}>
                <Accordion sx={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  mb: 2,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                  '&:before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    margin: '8px 0',
                  }
                }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#8B5CF6' }} />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        margin: '16px 0',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(139, 92, 246, 0.02)',
                      }
                    }}
                  >
                    <Typography variant="h6" sx={{
                      fontWeight: 600,
                      color: '#1F2937',
                      fontSize: '1rem'
                    }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                    <Typography variant="body2" sx={{
                      color: '#6B7280',
                      lineHeight: 1.6
                    }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Fade>
            ))}
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default LandingPage;

