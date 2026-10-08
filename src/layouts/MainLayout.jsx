import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';

const MainLayout = () => {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: 1,
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
