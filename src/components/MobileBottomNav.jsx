import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction, Badge } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        display: { xs: 'block', md: 'none' },
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(12px)',
        bgcolor: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(17, 24, 39, 0.92)',
      }}
      elevation={8}
    >
      <BottomNavigation
        showLabels
        value={location.pathname}
        onChange={(event, newValue) => {
          navigate(newValue);
        }}
        sx={{
          bgcolor: 'transparent',
          '& .Mui-selected': {
            color: 'primary.main',
            fontWeight: 700,
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          value="/home"
          icon={<HomeRoundedIcon />}
        />
        <BottomNavigationAction
          label="Network"
          value="/people"
          icon={<PeopleAltRoundedIcon />}
        />
        <BottomNavigationAction
          label="Alerts"
          value="/notifications"
          icon={
            unreadCount > 0 ? (
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsRoundedIcon />
              </Badge>
            ) : (
              <NotificationsRoundedIcon />
            )
          }
        />
        <BottomNavigationAction
          label="Profile"
          value={user ? `/profile/${user._id}` : '/signin'}
          icon={<PersonOutlineRoundedIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
