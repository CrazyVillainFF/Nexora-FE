import React, { useState } from 'react';
import {
  Container,
  Card,
  Typography,
  Box,
  Stack,
  Avatar,
  IconButton,
  Button,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import { useNotifications } from '../context/NotificationContext';
import { formatTimeAgo } from '../utils/formatters';
import EmptyState from '../components/EmptyState';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter((n) => {
    if (tabIndex === 1) return !n.read;
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'post_like':
        return <FavoriteRoundedIcon sx={{ fontSize: 16, color: '#EF4444' }} />;
      case 'post_comment':
        return <ChatBubbleRoundedIcon sx={{ fontSize: 16, color: '#0EA5E9' }} />;
      case 'connection_request':
        return <PersonAddRoundedIcon sx={{ fontSize: 16, color: '#6366F1' }} />;
      case 'connection_accepted':
        return <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#10B981' }} />;
      default:
        return <NotificationsActiveOutlinedIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.read) {
      markAsRead(item._id);
    }
    if (item.type === 'connection_request' || item.type === 'connection_accepted') {
      if (item.type === 'connection_request') {
        navigate('/people');
      } else {
        navigate(`/profile/${item.sender?._id || item.sender}`);
      }
    } else if (item.post) {
      navigate('/home');
    }
  };

  return (
    <Container maxWidth="md">
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
            Activity & Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stay updated with your connections, interactions, and mentions.
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DoneAllRoundedIcon />}
            onClick={markAllAsRead}
          >
            Mark all read
          </Button>
        )}
      </Stack>

      {/* Filter Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          sx={{ px: 2, '& .MuiTab-root': { fontWeight: 600, py: 1.5 } }}
        >
          <Tab label={`All Notifications (${notifications.length})`} />
          <Tab label={`Unread (${unreadCount})`} />
        </Tabs>
      </Card>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress size={36} />
        </Box>
      ) : filteredNotifications.length > 0 ? (
        <Card sx={{ overflow: 'hidden' }}>
          {filteredNotifications.map((item, index) => {
            const sender = item.sender || {};
            return (
              <Box key={item._id}>
                <Box
                  onClick={() => handleNotificationClick(item)}
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    bgcolor: item.read ? 'transparent' : 'action.selected',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                    {/* Avatar with Type Icon Badge */}
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={sender.profilePicture}
                        alt={sender.name}
                        sx={{ width: 48, height: 48 }}
                      >
                        {sender.name ? sender.name[0] : 'U'}
                      </Avatar>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          bgcolor: 'background.paper',
                          borderRadius: '50%',
                          p: 0.35,
                          display: 'flex',
                          boxShadow: 1
                        }}
                      >
                        {getNotificationIcon(item.type)}
                      </Box>
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: item.read ? 500 : 700 }}>
                        {item.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(item.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Actions */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {!item.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          mr: 1
                        }}
                      />
                    )}
                    <Tooltip title="Delete notification">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item._id);
                        }}
                        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
                {index < filteredNotifications.length - 1 && <Divider />}
              </Box>
            );
          })}
        </Card>
      ) : (
        <EmptyState
          icon={NotificationsActiveOutlinedIcon}
          title={tabIndex === 1 ? 'No unread notifications' : 'You are all caught up!'}
          description="When members like your posts, comment on discussions, or connect with you, notifications will appear here."
        />
      )}
    </Container>
  );
};

export default NotificationsPage;
