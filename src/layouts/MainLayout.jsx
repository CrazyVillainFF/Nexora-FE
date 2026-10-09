import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import SiteBackdrop from '../components/SiteBackdrop';
import LocationOnboardingDialog from '../components/LocationOnboardingDialog';

const MainLayout = () => {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', isolation: 'isolate', zIndex: 1 }}>
      <SiteBackdrop />
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          width: '100%',
          minWidth: 0,
          position: 'relative',
          zIndex: 1,
          py: { xs: 2.5, md: 4 },
          pb: { xs: 'calc(62px + env(safe-area-inset-bottom) + 24px)', lg: 5 },
        }}
      >
        <Outlet />
      </Box>
      <MobileBottomNav />
      <LocationOnboardingDialog />
    </Box>
  );
};

export default MainLayout;
