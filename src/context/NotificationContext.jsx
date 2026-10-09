import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setError('');
      return;
    }

    try {
      setLoading(true);
      const res = await notificationAPI.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
        setError('');
      }
    } catch (err) {
      console.error('[Notifications] Failed to load:', err.message);
      setError(err.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds if authenticated
    if (isAuthenticated) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, isAuthenticated]);

  const markAsRead = async (id) => {
    try {
      const res = await notificationAPI.markAsRead(id);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error('[Notification] Error marking as read:', err.message);
      setError(err.message || 'Could not update this notification.');
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await notificationAPI.markAllAsRead();
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error('[Notification] Error marking all as read:', err.message);
      setError(err.message || 'Could not mark notifications as read.');
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await notificationAPI.deleteNotification(id);
      if (res.data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error('[Notification] Error deleting notification:', err.message);
      setError(err.message || 'Could not remove this notification.');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        clearError: () => setError(''),
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
