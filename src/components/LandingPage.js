import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Container, Grid, Card, CardContent, 
  Avatar, Fade, Slide
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
import Footer from './Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const [animationTrigger, setAnimationTrigger] = useState(false);

  useEffect(() => {
    setAnimationTrigger(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  const features = [
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
      title: "AI-Powered Analysis",
      description: "Advanced artificial intelligence analyzes your investments and provides personalized recommendations based on market data and risk assessment.",
      color: "#667eea"
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      title: "Smart Portfolio Overview",
      description: "Instantly view and analyze all your holdings with valuations, risk breakdowns, and AI-powered insights.",
      color: "#10b981"
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: "Risk Assessment",
      description: "Comprehensive risk analysis with detailed explanations and grade-based scoring to help you make informed investment decisions.",
      color: "#f59e0b"
    },
    {
      icon: <HomeIcon sx={{ fontSize: 40 }} />,
      title: "Real Estate Analysis",
      description: "Specialized tools for real estate investment analysis including cashflow calculations, market valuations, and financing scenarios.",
      color: "#ef4444"
    },
    {
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      title: "Investment Grading",
      description: "Get clear A-F grades for your investments with detailed explanations of strengths, weaknesses, and improvement opportunities.",
      color: "#8b5cf6"
    },
    {
      icon: <ChatIcon sx={{ fontSize: 40 }} />,
      title: "Advanced Portfolio Stress Testing",
      description: "Pressure-test your portfolio by applying custom market shocks, macro events, and rate shifts, then gauge resilience with AI-driven risk forecasts.",
      color: "#06b6d4"
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
      name: "Sarah Johnson",
      role: "Portfolio Manager",
      content: "FlowInvest has transformed how I analyze investments. The AI insights are incredibly accurate and have helped me optimize my portfolio performance by 23%.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Real Estate Investor",
      content: "The real estate analysis tools are phenomenal. I can quickly evaluate properties and make confident investment decisions with comprehensive risk assessments.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Financial Advisor",
      content: "My clients love the clear investment grades and detailed explanations. It makes complex financial concepts easy to understand and act upon.",
      rating: 5
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          py: 8
        }}>
          <Fade in={animationTrigger} timeout={1000}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontSize: { xs: '3rem', md: '4.5rem', lg: '5.5rem' },
                  fontWeight: 800,
                  color: 'white',
                  mb: 3,
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.8) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                FlowInvest
              </Typography>
              
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: { xs: '1.5rem', md: '2rem', lg: '2.5rem' },
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.95)',
                  mb: 3,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              >
                AI-Powered Investment Intelligence
              </Typography>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.85)',
                  mb: 6,
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                Transform your investment strategy with cutting-edge artificial intelligence. 
                Get personalized analysis, risk assessments, and portfolio optimization 
                powered by advanced machine learning algorithms.
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  startIcon={<RocketLaunchIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,1) 100%)',
                    color: '#667eea',
                    borderRadius: '50px',
                    px: 4,
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 8px 32px rgba(255,255,255,0.3)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 40px rgba(255,255,255,0.4)',
                      background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,1) 100%)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Start Your Journey
                </Button>
              </Box>
            </Box>
          </Fade>

          {/* Stats Section */}
          <Slide direction="up" in={animationTrigger} timeout={1200}>
            <Grid container spacing={4} sx={{ mt: 8 }}>
              {[
                { number: "35yrs", label: "Market Datasets Ingested" },
                { number: "$2.5B+", label: "Assets Analyzed" },
                { number: "95%", label: "Accuracy Rate" },
                { number: "24/7", label: "AI Support" }
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box sx={{
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    p: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: 'white',
                      mb: 1
                    }}>
                      {stat.number}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontWeight: 500
                    }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Slide>
        </Box>
      </Container>

      {/* Features Section */}
      <Box sx={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        py: 12,
        position: 'relative'
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" sx={{ 
              fontWeight: 700, 
              color: '#1e293b',
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}>
              Powerful Features
            </Typography>
            <Typography variant="h6" sx={{ 
              color: '#64748b',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6
            }}>
              Everything you need to make smarter investment decisions, 
              powered by cutting-edge artificial intelligence technology.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Fade in={animationTrigger} timeout={1000 + index * 200}>
                  <Card sx={{
                    height: '100%',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '24px',
                    p: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <CardContent>
                      <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '20px',
                        background: `linear-gradient(135deg, ${feature.color}20 0%, ${feature.color}40 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        color: feature.color
                      }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 600, 
                        color: '#1e293b',
                        mb: 2
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: '#64748b',
                        lineHeight: 1.6
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
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        py: 12,
        color: 'white'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" sx={{ 
                fontWeight: 700,
                mb: 4,
                fontSize: { xs: '2.5rem', md: '3rem' }
              }}>
                Why Choose FlowInvest?
              </Typography>
              <Typography variant="h6" sx={{ 
                color: 'rgba(255,255,255,0.8)',
                mb: 4,
                lineHeight: 1.6
              }}>
                Transform your investment strategy with cutting-edge AI—unlock smarter insights and optimized portfolios today.
              </Typography>
              
              <Box sx={{ mb: 6 }}>
                {benefits.map((benefit, index) => (
                  <Fade in={animationTrigger} timeout={1500 + index * 100} key={index}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2 
                    }}>
                      <CheckCircleIcon sx={{ 
                        color: '#10b981', 
                        mr: 2,
                        fontSize: 24
                      }} />
                      <Typography variant="body1" sx={{ 
                        fontWeight: 500,
                        fontSize: '1.1rem'
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50px',
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Get Started Now
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                p: 4,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 600,
                  mb: 3,
                  textAlign: 'center'
                }}>
                  Investment Success Rate
                </Typography>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 3
                }}>
                  <Typography variant="h1" sx={{ 
                    fontSize: '4rem',
                    fontWeight: 800,
                    color: '#10b981'
                  }}>
                    95%
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ 
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.6
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
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        py: 12
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" sx={{ 
              fontWeight: 700, 
              color: '#1e293b',
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}>
              What Our Users Say
            </Typography>
            <Typography variant="h6" sx={{ 
              color: '#64748b',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6
            }}>
              Join thousands of satisfied investors who have transformed their 
              investment strategy with FlowInvest.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Fade in={animationTrigger} timeout={1800 + index * 200}>
                  <Card sx={{
                    height: '100%',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '24px',
                    p: 4,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{ 
                          width: 56, 
                          height: 56, 
                          bgcolor: '#667eea',
                          mr: 2
                        }}>
                          {testimonial.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            color: '#1e293b'
                          }}>
                            {testimonial.name}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: '#64748b'
                          }}>
                            {testimonial.role}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" sx={{ 
                        color: '#64748b',
                        lineHeight: 1.6,
                        mb: 3,
                        fontStyle: 'italic'
                      }}>
                        "{testimonial.content}"
                      </Typography>
                      
                      <Box sx={{ display: 'flex' }}>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <StarIcon key={i} sx={{ 
                            color: '#fbbf24', 
                            fontSize: 20 
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

      <Footer />
    </Box>
  );
};

export default LandingPage;