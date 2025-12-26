import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Notifications,
  Warning,
  CheckCircle,
  Info,
  Error,
  Clear,
  Settings,
  NotificationsOff,
} from '@mui/icons-material';
import { useToast } from '../contexts';
import type { AlertColor } from '@mui/material';

export interface NotificationItem {
  id: string;
  type: 'goal' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  activityId?: string;
  goalId?: string;
}

interface NotificationDialogProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
}

const getNotificationIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'goal':
      return <CheckCircle color="success" />;
    case 'warning':
      return <Warning color="warning" />;
    case 'info':
      return <Info color="info" />;
    case 'error':
      return <Error color="error" />;
    default:
      return <Notifications color="primary" />;
  }
};

const getNotificationColor = (type: NotificationItem['type']): AlertColor => {
  switch (type) {
    case 'goal':
      return 'success';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
};

const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return timestamp.toLocaleDateString();
};

export const NotificationDialog: React.FC<NotificationDialogProps> = ({
  open,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
  notificationsEnabled,
  onToggleNotifications,
}) => {
  const { showSuccess, showInfo } = useToast();
  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const sortedNotifications = [...notifications].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  const handleMarkAsRead = (notification: NotificationItem) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      onMarkAllAsRead();
      showInfo(`Marked ${unreadCount} notifications as read`);
    }
  };

  const handleClearAll = () => {
    if (notifications.length > 0) {
      onClearAll();
      showSuccess('All notifications cleared');
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    onToggleNotifications(enabled);
    showInfo(enabled ? 'Notifications enabled' : 'Notifications disabled');
  };

  const handleDeleteNotification = (notification: NotificationItem) => {
    onDeleteNotification(notification.id);
    showInfo('Notification deleted');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh', maxHeight: '80vh' },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
            <Typography variant="h6">Notifications</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Settings">
              <IconButton onClick={() => setShowSettings(!showSettings)}>
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title="Mark all as read">
              <IconButton
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear all">
              <IconButton
                onClick={handleClearAll}
                disabled={notifications.length === 0}
              >
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {showSettings && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Notification Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationsEnabled}
                    onChange={(e) =>
                      handleToggleNotifications(e.target.checked)
                    }
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {notificationsEnabled ? (
                      <Notifications />
                    ) : (
                      <NotificationsOff />
                    )}
                    {notificationsEnabled
                      ? 'Notifications Enabled'
                      : 'Notifications Disabled'}
                  </Box>
                }
              />
            </Alert>
            <Divider sx={{ mb: 2 }} />
          </Box>
        )}

        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <NotificationsOff
              sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications
            </Typography>
            <Typography variant="body2" color="text.disabled">
              You're all caught up! Notifications will appear here when you have
              goal achievements, warnings, or important updates.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {sortedNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: 1,
                    border: notification.read ? 'none' : '1px solid',
                    borderColor: notification.read
                      ? 'transparent'
                      : 'primary.light',
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteNotification(notification)}
                      size="small"
                    >
                      <Clear />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={notification.type}
                          color={getNotificationColor(notification.type)}
                          variant={notification.read ? 'outlined' : 'filled'}
                        />
                        {!notification.read && (
                          <Chip
                            size="small"
                            label="NEW"
                            color="primary"
                            variant="filled"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatTimeAgo(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                    onClick={() => handleMarkAsRead(notification)}
                    sx={{ cursor: notification.read ? 'default' : 'pointer' }}
                  />
                </ListItem>
                {index < sortedNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {notifications.length > 0 && (
            <>
              {notifications.length} total, {unreadCount} unread
            </>
          )}
        </Typography>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
