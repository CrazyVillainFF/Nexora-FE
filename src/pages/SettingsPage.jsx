import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Box,
  Button,
  TextField,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../theme/ThemeContext';
import { authAPI } from '../services/api';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { mode, setThemeMode } = useThemeMode();
  const navigate = useNavigate();

  // Password update form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill in both current and new password.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError(null);
      await authAPI.updatePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setToastMessage('Password updated successfully.');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" gutterBottom>
          Account & App Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your interface appearance, security credentials, and preferences.
        </Typography>
      </Box>

      <Stack spacing={3.5}>
        {/* SECTION 1: Appearance & Theme */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <PaletteOutlinedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700}>
              Interface Appearance
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Select your preferred color mode for the NEXORA interface.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box
                onClick={() => setThemeMode('light')}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: (theme) =>
                    `2px solid ${mode === 'light' ? theme.palette.primary.main : theme.palette.divider}`,
                  bgcolor: mode === 'light' ? 'action.selected' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LightModeOutlinedIcon sx={{ color: mode === 'light' ? 'primary.main' : 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Light Mode
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Crisp, high-contrast light slate surfaces
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box
                onClick={() => setThemeMode('dark')}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: (theme) =>
                    `2px solid ${mode === 'dark' ? theme.palette.primary.main : theme.palette.divider}`,
                  bgcolor: mode === 'dark' ? 'action.selected' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <DarkModeOutlinedIcon sx={{ color: mode === 'dark' ? 'primary.main' : 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Dark Mode
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Deep obsidian tones tailored for late sessions
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* SECTION 2: Security & Password */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <SecurityRoundedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700}>
              Security & Password
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Update your account password to ensure your profile remains secure.
          </Typography>

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPasswordError(null)}>
              {passwordError}
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <Stack spacing={2} sx={{ maxWidth: 460 }}>
              <TextField
                label="Current Password"
                type="password"
                size="small"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
              <TextField
                label="New Password (min. 6 chars)"
                type="password"
                size="small"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
              <TextField
                label="Confirm New Password"
                type="password"
                size="small"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={changingPassword}
                sx={{ alignSelf: 'flex-start', px: 3, mt: 1 }}
              >
                {changingPassword ? <CircularProgress size={18} color="inherit" /> : 'Update Password'}
              </Button>
            </Stack>
          </form>
        </Card>

        {/* SECTION 3: Account Information */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Account Details
          </Typography>
          <Divider sx={{ mb: 2.5 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Registered Email
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {user?.email}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Account Status
              </Typography>
              <Typography variant="body1" fontWeight={600} color="success.main">
                Verified Member
              </Typography>
            </Grid>
          </Grid>
        </Card>

        {/* SECTION 4: Sign Out / Danger Zone */}
        <Card sx={{ p: 3, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="error.main">
                Sign Out of Current Session
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You will need to sign back in with your credentials to access protected features.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutRoundedIcon />}
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </Stack>
        </Card>
      </Stack>

      {/* Toast */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SettingsPage;
