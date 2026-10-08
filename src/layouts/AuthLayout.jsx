import React from 'react';
import { Box, Container, Grid, Typography, Stack, Chip, Card } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ReactableMark from '../components/ReactableMark';
import SiteBackdrop from '../components/SiteBackdrop';

const AuthLayout = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        isolation: 'isolate',
        py: { xs: 3, md: 6 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <SiteBackdrop />
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Left Marketing Pillar (Hidden on mobile) */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ pr: { md: 5 }, maxWidth: 520, position: 'relative', zIndex: 1 }}>
              {/* Brand Header */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={() => navigate('/')}
                sx={{ cursor: 'pointer', mb: 3 }}
              >
                <ReactableMark size={44} />
                <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em">
                  Reactable
                </Typography>
              </Stack>

              <Chip
                icon={<AutoAwesomeRoundedIcon sx={{ fontSize: '14px !important', color: 'primary.main' }} />}
                label="Professional community for people building technology"
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                  fontWeight: 700,
                  mb: 3,
                  py: 0.5,
                }}
              />

              <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.12, mb: 2 }}>
                Build professional relationships with more context.
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.05rem', lineHeight: 1.6 }}>
                Connect with architects, founders, design leaders, and engineers working across technology.
              </Typography>

              {/* Benefit highlights */}
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2.5,
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                      display: 'flex',
                    }}
                  >
                    <GroupsRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      A focused professional network
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Discover people and conversations that are relevant to your work.
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2.5,
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                      display: 'flex',
                    }}
                  >
                    <SecurityRoundedIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Clear profile controls
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Maintain your professional presence with confidence.
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Grid>

          {/* Right Authentication Form Container */}
          <Grid size={{ xs: 12, sm: 10, md: 6, lg: 5 }} sx={{ position: 'relative', zIndex: 1 }}>
            <Outlet />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AuthLayout;
