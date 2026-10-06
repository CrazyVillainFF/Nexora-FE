import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 8, md: 14 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
          textAlign: 'center',
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'radial-gradient(circle at 50% 10%, rgba(79, 70, 229, 0.08) 0%, transparent 60%)'
              : 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
        }}
      >
        <Container maxWidth="md">
          <Chip
            icon={<AutoAwesomeRoundedIcon sx={{ fontSize: '14px !important', color: 'primary.main' }} />}
            label="Introducing NEXORA 2.0 • Premium Professional Network"
            sx={{
              py: 0.5,
              px: 1,
              bgcolor: 'action.hover',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.85rem',
              mb: 3,
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.25rem' },
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.035em',
              mb: 3,
            }}
          >
            Build meaningful connections.{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Your career network, redesigned.
            </Box>
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.25rem' },
              lineHeight: 1.6,
              maxWidth: 680,
              mx: 'auto',
              mb: 4.5,
            }}
          >
            A high-signal ecosystem for software architects, product visionaries, AI researchers, and startup founders who value craft over noise.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              color="primary"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => navigate(isAuthenticated ? '/home' : '/signup')}
              sx={{ py: 1.5, px: 3.5, fontSize: '1rem' }}
            >
              {isAuthenticated ? 'Go to Your Feed' : 'Join the Network'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="inherit"
              onClick={() => navigate('/people')}
              sx={{ py: 1.5, px: 3, fontSize: '1rem' }}
            >
              Explore Professionals
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Interactive Highlights Preview */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Grid container spacing={3}>
          {[
            {
              icon: CodeRoundedIcon,
              title: 'Engineering & Architecture',
              desc: 'Deep technical discussions, system architecture breakdowns, and distributed systems insights from principal engineers.',
              color: '#4F46E5',
            },
            {
              icon: PaletteRoundedIcon,
              title: 'Product & Design Systems',
              desc: 'Critiques, spatial interface patterns, and design token architectures shared by world-class designers.',
              color: '#0284C7',
            },
            {
              icon: PsychologyRoundedIcon,
              title: 'Frontier AI & Research',
              desc: 'Direct discussions with ML scientists and research leads working on reasoning models and multimodal intelligence.',
              color: '#8B5CF6',
            },
            {
              icon: RocketLaunchRoundedIcon,
              title: 'Venture & Founder Guild',
              desc: 'High-velocity founder updates, talent matchmaking, and transparent company building playbooks.',
              color: '#10B981',
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 2,
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2.5,
                        bgcolor: `${item.color}15`,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <Icon sx={{ fontSize: 26 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* Curated Testimonials */}
      <Box sx={{ py: 10, bgcolor: 'action.hover' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Trusted by tech leaders across the globe
            </Typography>
            <Typography variant="body1" color="text.secondary">
              See why forward-thinking professionals have made NEXORA their primary network.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                name: 'Elena Rostova',
                role: 'VP of Product Design @ Stellaris AI',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                quote: 'NEXORA replaced the endless clickbait feeds with authentic peer discussions on complex spatial UI and design engineering.',
              },
              {
                name: 'Marcus Vance',
                role: 'Principal Systems Architect @ CloudScale',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                quote: 'The signal-to-noise ratio here is unmatched. I hired two staff Go engineers within three weeks of posting on NEXORA.',
              },
              {
                name: 'Dr. Anya Sharma',
                role: 'Chief AI Scientist @ Cognition Lab',
                avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
                quote: 'The depth of discussions on frontier architectures reminds me of early academic conferences. Truly refreshing.',
              },
            ].map((t, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 3, flex: 1, lineHeight: 1.6 }}>
                    "{t.quote}"
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={t.avatar} alt={t.name} sx={{ width: 48, height: 48 }} />
                    <Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700}>
                          {t.name}
                        </Typography>
                        <VerifiedRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t.role}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Footer Section */}
      <Container maxWidth="md" sx={{ py: 12, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Ready to experience the future of professional networking?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 540, mx: 'auto' }}>
          Create your verified profile in less than 2 minutes and start connecting with exceptional peers.
        </Typography>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={() => navigate('/signup')}
          sx={{ py: 1.5, px: 4, fontSize: '1.05rem' }}
        >
          Create Free Account
        </Button>
      </Container>
    </Box>
  );
};

export default LandingPage;
