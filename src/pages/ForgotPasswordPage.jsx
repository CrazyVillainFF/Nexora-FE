import React, { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import PasswordTextField from '../components/PasswordTextField';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action) => {
    try {
      setBusy(true);
      setError('');
      await action();
    } catch (requestError) {
      setError(requestError.message || 'Password recovery could not continue.');
    } finally {
      setBusy(false);
    }
  };

  const requestCode = (event) => {
    event.preventDefault();
    return run(async () => {
      const response = await authAPI.requestPasswordReset(email.trim());
      setMessage(`${response.data.message} If five codes were already issued in the last 30 minutes, wait for that window to end before trying again.`);
      setStep('verify');
    });
  };

  const verifyCode = (event) => {
    event.preventDefault();
    return run(async () => {
      const response = await authAPI.verifyPasswordResetCode(email.trim(), code);
      setResetToken(response.data.resetToken);
      setStep('password');
      setMessage('Code verified. Choose a new password.');
    });
  };

  const savePassword = (event) => {
    event.preventDefault();
    return run(async () => {
      const response = await authAPI.completePasswordReset({ resetToken, newPassword, confirmPassword });
      setStep('complete');
      setMessage(response.data.message);
    });
  };

  return (
    <Card sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3.5, boxShadow: 3 }}>
      <CardContent sx={{ p: '0 !important' }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>Reset your password</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          We’ll send a six-digit code to your registered email address.
        </Typography>

        {message && <Alert severity={step === 'complete' ? 'success' : 'info'} sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {step === 'request' && (
          <Box component="form" onSubmit={requestCode}>
            <Stack spacing={2}>
              <TextField label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth autoComplete="email" />
              <Button type="submit" variant="contained" disabled={busy}>{busy ? <CircularProgress size={22} color="inherit" /> : 'Send reset code'}</Button>
            </Stack>
          </Box>
        )}

        {step === 'verify' && (
          <Box component="form" onSubmit={verifyCode}>
            <Stack spacing={2}>
              <TextField label="Six-digit code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required fullWidth inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6, pattern: '[0-9]{6}' }} />
              <Button type="submit" variant="contained" disabled={busy || code.length !== 6}>{busy ? <CircularProgress size={22} color="inherit" /> : 'Verify code'}</Button>
              <Button type="button" variant="text" onClick={() => { setCode(''); setStep('request'); }} disabled={busy}>Use another email or request a new code</Button>
            </Stack>
          </Box>
        )}

        {step === 'password' && (
          <Box component="form" onSubmit={savePassword}>
            <Stack spacing={2}>
              <PasswordTextField label="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required fullWidth autoComplete="new-password" inputProps={{ minLength: 8, maxLength: 128 }} />
              <PasswordTextField label="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required fullWidth autoComplete="new-password" inputProps={{ minLength: 8, maxLength: 128 }} />
              <Button type="submit" variant="contained" disabled={busy || newPassword.length < 8 || newPassword !== confirmPassword}>{busy ? <CircularProgress size={22} color="inherit" /> : 'Save new password'}</Button>
            </Stack>
          </Box>
        )}

        {step === 'complete' && <Button component={Link} to="/signin" variant="contained" fullWidth sx={{ mt: 1 }}>Return to sign in</Button>}

        {step !== 'complete' && <Box sx={{ mt: 2.5, textAlign: 'center' }}>
          <Typography component={Link} to="/signin" variant="body2" color="primary" sx={{ textDecoration: 'none' }}>Back to sign in</Typography>
        </Box>}
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordPage;
