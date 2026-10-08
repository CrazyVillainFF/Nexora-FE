import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import SiteBackdrop from '../components/SiteBackdrop';

const MainLayout = () => {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', position: 'relative', isolation: 'isolate' }}>
      <SiteBackdrop />
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: 1,
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
