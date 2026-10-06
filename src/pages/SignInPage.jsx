import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { name: 'Elena Rostova', role: 'VP Design', email: 'elena@nexora.io' },
  { name: 'Marcus Vance', role: 'Principal Architect', email: 'marcus@nexora.io' },
  { name: 'Dr. Anya Sharma', role: 'Chief AI Scientist', email: 'anya@nexora.io' },
];

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/home';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <Card sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3.5, boxShadow: 3 }}>
      <CardContent sx={{ p: '0 !important' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Welcome back to NEXORA
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to access your professional feed and network.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Demo Fast Logins Box */}
        <Box sx={{ p: 1.5, mb: 2.5, bgcolor: 'action.hover', borderRadius: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <AutoAwesomeRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={700} color="primary.main">
              1-Click Demo Profiles (Pre-seeded)
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {DEMO_ACCOUNTS.map((acc, idx) => (
              <Chip
                key={idx}
                label={`${acc.name.split(' ')[0]} (${acc.role})`}
                size="small"
                clickable
                onClick={() => fillDemo(acc.email)}
                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              color="primary"
              fullWidth
              disabled={submitting}
              sx={{ py: 1.25, fontSize: '0.95rem' }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            NEW TO NEXORA?
          </Typography>
        </Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Typography
              component={Link}
              to="/signup"
              variant="body2"
              color="primary"
              fontWeight={700}
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Join the Network
            </Typography>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SignInPage;
