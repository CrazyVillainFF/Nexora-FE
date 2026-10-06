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
  CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useAuth } from '../context/AuthContext';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jobTitle: '',
    company: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, jobTitle, company } = formData;

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        headline: jobTitle && company ? `${jobTitle} at ${company}` : jobTitle || 'Professional at NEXORA'
      });
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Unable to complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3.5, boxShadow: 3 }}>
      <CardContent sx={{ p: '0 !important' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Join the NEXORA Network
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect with leading founders, architects, and designers worldwide.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              name="name"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Work or Personal Email"
              name="email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Job Title (e.g. Lead Designer)"
                name="jobTitle"
                fullWidth
                value={formData.jobTitle}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessCenterOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Company / Org"
                name="company"
                fullWidth
                value={formData.company}
                onChange={handleChange}
              />
            </Stack>

            <TextField
              label="Password (min. 6 characters)"
              name="password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={formData.password}
              onChange={handleChange}
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

            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
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
              sx={{ py: 1.25, fontSize: '0.95rem', mt: 1 }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            ALREADY REGISTERED?
          </Typography>
        </Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Typography
              component={Link}
              to="/signin"
              variant="body2"
              color="primary"
              fontWeight={700}
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Sign In
            </Typography>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SignUpPage;
