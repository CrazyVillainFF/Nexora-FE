import React, { useState } from 'react';
import { Button, CircularProgress, Stack, Tooltip } from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import { connectionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ConnectionButton = ({
  userId,
  initialStatus = 'none', // 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'self'
  connectionId,
  size = 'medium',
  onStatusChange,
  sx = {}
}) => {
  const { isAuthenticated, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // If viewing self, do not show button
  if (status === 'self' || (currentUser && currentUser._id === userId)) {
    return null;
  }

  const handleConnect = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    try {
      setLoading(true);
      const res = await connectionAPI.sendRequest(userId);
      if (res.data.success) {
        setStatus('pending_sent');
        if (onStatusChange) onStatusChange('pending_sent');
      }
    } catch (err) {
      console.error('[Connection] Error sending request:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const res = await connectionAPI.acceptRequest(connectionId || userId);
      if (res.data.success) {
        setStatus('connected');
        if (onStatusChange) onStatusChange('connected');
      }
    } catch (err) {
      console.error('[Connection] Error accepting:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrRemove = async (e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const res = await connectionAPI.rejectOrRemove(connectionId || userId);
      if (res.data.success) {
        setStatus('none');
        if (onStatusChange) onStatusChange('none');
      }
    } catch (err) {
      console.error('[Connection] Error rejecting/removing:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button size={size} disabled variant="outlined" sx={{ minWidth: 100, ...sx }}>
        <CircularProgress size={18} />
      </Button>
    );
  }

  if (status === 'pending_received') {
    return (
      <Stack direction="row" spacing={1} sx={sx} onClick={(e) => e.stopPropagation()}>
        <Button
          size={size}
          variant="contained"
          color="primary"
          onClick={handleAccept}
          startIcon={<CheckRoundedIcon />}
        >
          Accept
        </Button>
        <Button
          size={size}
          variant="outlined"
          color="inherit"
          onClick={handleRejectOrRemove}
        >
          Decline
        </Button>
      </Stack>
    );
  }

  if (status === 'pending_sent') {
    return (
      <Tooltip title="Click to cancel pending invitation">
        <Button
          size={size}
          variant="outlined"
          color="inherit"
          onClick={handleRejectOrRemove}
          startIcon={<HourglassEmptyRoundedIcon />}
          sx={{
            borderColor: 'divider',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'error.main',
              color: 'error.main',
              bgcolor: 'rgba(239, 68, 68, 0.05)',
            },
            ...sx
          }}
        >
          Pending
        </Button>
      </Tooltip>
    );
  }

  if (status === 'connected') {
    return (
      <Button
        size={size}
        variant="outlined"
        color={isHovered ? 'error' : 'primary'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleRejectOrRemove}
        startIcon={isHovered ? <PersonRemoveOutlinedIcon /> : <CheckRoundedIcon />}
        sx={{
          minWidth: 110,
          transition: 'all 0.2s',
          borderColor: isHovered ? 'error.main' : 'primary.main',
          ...sx
        }}
      >
        {isHovered ? 'Remove' : 'Connected'}
      </Button>
    );
  }

  // Default: 'none'
  return (
    <Button
      size={size}
      variant="contained"
      color="primary"
      onClick={handleConnect}
      startIcon={<PersonAddOutlinedIcon />}
      sx={sx}
    >
      Connect
    </Button>
  );
};

export default ConnectionButton;
