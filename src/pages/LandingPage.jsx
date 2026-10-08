import React from 'react';
import { Box, Button, Container, Grid, Stack, Typography, Card, CardContent, Avatar, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import heroImage from '../assets/hero.png';
import { useAuth } from '../context/AuthContext';

const principles = [
  { icon: GroupsRoundedIcon, title: 'Built for peers', body: 'A focused place to meet people doing thoughtful work in technology.' },
  { icon: InsightsRoundedIcon, title: 'A useful feed', body: 'Conversations, expertise, and professional context without unnecessary noise.' },
  { icon: SecurityRoundedIcon, title: 'Your profile, your control', body: 'Present your work and manage your presence with clear privacy boundaries.' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const primaryDestination = isAuthenticated ? '/home' : '/signup';

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 4, md: 7 }, pb: { xs: 7, md: 10 } }}>
        <Grid container spacing={{ xs: 5, md: 7 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ maxWidth: 610 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5, color: 'primary.main' }}>
                <Box sx={{ width: 26, height: 26, borderRadius: 1.25, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <HubRoundedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ letterSpacing: '.08em', fontSize: 12 }}>NEXORA PROFESSIONAL NETWORK</Typography>
              </Stack>
              <Typography variant="h1" sx={{ fontSize: { xs: '2.9rem', sm: '3.65rem', lg: '4.25rem' }, mb: 2.5 }}>
                Build the network behind your best work.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.12rem' }, maxWidth: 540, mb: 4 }}>
                Nexora brings together engineers, designers, founders, and researchers for professional relationships that make a difference.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate(primaryDestination)}>
                  {isAuthenticated ? 'Open your feed' : 'Create your profile'}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/signin')}>Sign in</Button>
              </Stack>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: 'relative', maxWidth: 590, ml: { md: 'auto' } }}>
              <Box component="img" src={heroImage} alt="Professionals collaborating at a shared workspace" sx={{ display: 'block', width: '100%', minHeight: { xs: 280, md: 430 }, objectFit: 'cover', borderRadius: 2, filter: 'saturate(.72) contrast(1.04)' }} />
              <Card sx={{ position: 'absolute', left: { xs: 16, md: -32 }, bottom: { xs: 16, md: 28 }, width: { xs: 'calc(100% - 32px)', sm: 310 }, bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,.96)' : 'rgba(23,33,43,.96)', backdropFilter: 'blur(12px)', boxShadow: 3 }}>
                <CardContent sx={{ p: '16px !important' }}>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: .5 }}>Professional context, not performance.</Typography>
                  <Typography variant="caption" color="text.secondary">A clear profile and relevant conversations make introductions more useful.</Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ borderTop: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
          <Grid container spacing={{ xs: 3, md: 0 }}>
            {principles.map(({ icon: Icon, title, body }, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={title}>
                <Box sx={{ px: { md: index === 0 ? 0 : 4 }, borderLeft: { md: index === 0 ? 0 : 1 }, borderColor: 'divider' }}>
                  <Icon sx={{ color: 'primary.main', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ mb: .75 }}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 290 }}>{body}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 11 } }}>
        <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.65rem' }, mb: 2 }}>A calmer place to grow your professional world.</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>The details matter: easier discovery, clear connection requests, and a profile that gives people a reason to reach out.</Typography>
            <Button variant="text" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate('/people')}>Explore the network</Button>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.subtle' }}>
              <Stack spacing={2.25} divider={<Divider flexItem />}>
                {[
                  ['Elena Rostova', 'Product design leader', 'A thoughtful network should help people find the right conversation faster.'],
                  ['Marcus Vance', 'Systems architect', 'The best introductions begin with enough context to make a useful connection.'],
                  ['Anya Sharma', 'AI researcher', 'Professional communities work when expertise is easy to find and share.'],
                ].map(([name, role, quote]) => (
                  <Stack key={name} direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38 }}>{name[0]}</Avatar>
                    <Box>
                      <Stack direction="row" spacing={.5} alignItems="center"><Typography variant="subtitle2">{name}</Typography><VerifiedRoundedIcon sx={{ fontSize: 15, color: 'primary.main' }} /></Stack>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: .5 }}>{role}</Typography>
                      <Typography variant="body2">“{quote}”</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, textAlign: 'center' }}>
          <Typography variant="h2" sx={{ color: 'inherit', fontSize: { xs: '2rem', md: '2.75rem' }, mb: 1.5 }}>Make your next connection count.</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.78)', maxWidth: 510, mx: 'auto', mb: 3 }}>Set up your professional profile and take part in the conversations that move your work forward.</Typography>
          <Button variant="contained" size="large" onClick={() => navigate(primaryDestination)} sx={{ bgcolor: '#FFFFFF', color: 'primary.dark', '&:hover': { bgcolor: '#E8F2F8' } }}>{isAuthenticated ? 'Open your feed' : 'Get started'}</Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
