import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Button,
  Stack,
  Tooltip,
  Divider
} from '@mui/material';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useThemeMode } from '../theme/ThemeContext';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/signin');
  };

  const navItems = [
    { label: 'Feed', path: '/home', icon: HomeRoundedIcon },
    { label: 'Network', path: '/people', icon: PeopleAltRoundedIcon },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: NotificationsRoundedIcon,
      badge: unreadCount,
    },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: (theme) =>
          theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        zIndex: 1200,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 60, md: 70 }, gap: { xs: 1, sm: 2 } }}>
          {/* Brand Logo */}
          <Stack
            direction="row"
            spacing={1.25}
            onClick={() => navigate(isAuthenticated ? '/home' : '/')}
            sx={{ alignItems: 'center', cursor: 'pointer', flexShrink: 0, textDecoration: 'none' }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(18, 59, 93, 0.22)',
                color: '#fff',
              }}
            >
              <HubRoundedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                letterSpacing: '-0.03em',
                color: 'text.primary',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              NEXORA
            </Typography>
          </Stack>

          {/* Global Search Bar */}
          <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: 380, md: 460 }, mx: { xs: 1, sm: 2 } }}>
            <SearchBar />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop Nav Items */}
          {isAuthenticated ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', display: { xs: 'none', md: 'flex' } }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Button
                    key={item.path}
                    component={NavLink}
                    to={item.path}
                    startIcon={
                      item.badge > 0 ? (
                        <Badge badgeContent={item.badge} color="error" max={99}>
                          <Icon sx={{ fontSize: 20 }} />
                        </Badge>
                      ) : (
                        <Icon sx={{ fontSize: 20 }} />
                      )
                    }
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      bgcolor: isActive ? 'action.selected' : 'transparent',
                      px: 2,
                      py: 1,
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: 2.5,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        color: 'primary.main',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' } }}>
              <Button component={NavLink} to="/signin" variant="outlined" color="inherit">
                Sign In
              </Button>
              <Button component={NavLink} to="/signup" variant="contained" color="primary">
                Join Network
              </Button>
            </Stack>
          )}

          {/* Theme Switcher */}
          <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
            <IconButton onClick={toggleTheme} color="inherit" sx={{ ml: 0.5 }}>
              {mode === 'light' ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* User Profile Avatar / Menu */}
          {isAuthenticated && (
            <Box sx={{ ml: 1 }}>
              <IconButton onClick={handleOpenMenu} sx={{ p: 0.25 }}>
                <Avatar
                  src={user?.profilePicture}
                  alt={user?.name}
                  sx={{
                    width: 38,
                    height: 38,
                    border: (theme) => `2px solid ${theme.palette.primary.main}`,
                  }}
                >
                  {user?.name ? user.name[0] : 'U'}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 220,
                    borderRadius: 3,
                    boxShadow: 4,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {user?.headline || user?.email}
                  </Typography>
                </Box>
                <Divider />

                <MenuItem
                  onClick={() => {
                    handleCloseMenu();
                    navigate(`/profile/${user?._id}`);
                  }}
                >
                  <PersonOutlineRoundedIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                  View Profile
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    handleCloseMenu();
                    navigate('/profile/edit');
                  }}
                >
                  <EditOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                  Edit Profile
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    handleCloseMenu();
                    navigate('/settings');
                  }}
                >
                  <SettingsOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                  Account Settings
                </MenuItem>

                <Divider />

                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogoutRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
