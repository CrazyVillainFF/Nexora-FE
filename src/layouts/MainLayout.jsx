import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';

const MainLayout = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 2, md: 3.5 },
          pb: { xs: 9, md: 4 }, // Add bottom padding for mobile bottom bar
        }}
      >
        <Outlet />
      </Box>
      <MobileBottomNav />
    </Box>
  );
};

export default MainLayout;
