import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import SiteBackdrop from '../components/SiteBackdrop';

const MainLayout = () => {
  return (
    <Box sx={{ width: '100%', maxWidth: '100vw', minWidth: 0, minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'stretch', position: 'relative', isolation: 'isolate', zIndex: 1, overflowX: 'clip' }}>
      <SiteBackdrop />
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: '1 1 auto',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
          py: { xs: 2.5, md: 4 },
          pb: { xs: 10, md: 5 },
        }}
      >
        <Outlet />
      </Box>
      <MobileBottomNav />
    </Box>
  );
};

export default MainLayout;
