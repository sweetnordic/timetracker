import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Timer,
  Help as HelpIcon,
  Notifications,
  NotificationsOff,
  Settings
} from '@mui/icons-material';
import { useNotifications, useTrackingSettings, useUpdateTrackingSettings, useClearAllData } from '../hooks';
import { NotificationDialog, SettingsDialog, DeleteConfirmationDialog } from './';
import { useToast } from '../contexts';
import { DEFAULT_NOTIFICATION_THRESHOLD, DEFAULT_FIRST_DAY_OF_WEEK } from '../database/models';
import type { TrackingSettings } from '../models';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
          color: '#ffffff',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-selected': {
            color: '#ffffff',
            fontWeight: 600,
          },
          '&:hover': {
            color: 'rgba(255, 255, 255, 0.9)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#ffffff',
          height: 3,
        },
      },
    },
  },
});

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  // Notification management
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll: clearAllNotifications
  } = useNotifications();

  // Settings for notification toggle and settings dialog
  const { data: dbSettings } = useTrackingSettings();
  const updateSettings = useUpdateTrackingSettings();
  const clearAllData = useClearAllData();

  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const notificationsEnabled = dbSettings?.notifications_enabled ?? true;

  // Convert database settings to UI format
  const trackingSettings: TrackingSettings = dbSettings ? {
    maxDuration: dbSettings.max_duration,
    warningThreshold: dbSettings.warning_threshold,
    firstDayOfWeek: dbSettings.first_day_of_week,
    defaultGoalNotificationThreshold: dbSettings.default_goal_notification_threshold,
    notificationsEnabled: dbSettings.notifications_enabled,
  } : {
    maxDuration: 12 * 3600,
    warningThreshold: 3600,
    firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
    defaultGoalNotificationThreshold: DEFAULT_NOTIFICATION_THRESHOLD,
    notificationsEnabled: true
  };

  const getCurrentTab = () => {
    switch (location.pathname) {
      case '/':
      case '/tracker':
        return 'tracker';
      case '/manager':
        return 'manager';
      case '/help':
        return 'help';
      default:
        return 'tracker';
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    switch (newValue) {
      case 'tracker':
        navigate('/');
        break;
      case 'manager':
        navigate('/manager');
        break;
      case 'help':
        navigate('/help');
        break;
    }
  };

  const handleOpenNotificationCenter = () => {
    setIsNotificationDialogOpen(true);
  };

  const handleCloseNotificationDialog = () => {
    setIsNotificationDialogOpen(false);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!dbSettings) return;

    try {
      await updateSettings.mutateAsync({
        max_duration: dbSettings.max_duration,
        warning_threshold: dbSettings.warning_threshold,
        first_day_of_week: dbSettings.first_day_of_week,
        default_goal_notification_threshold: dbSettings.default_goal_notification_threshold,
        notifications_enabled: enabled,
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showError('Failed to update notification settings');
    }
  };

  const handleOpenSettings = () => {
    setShowSettingsDialog(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsDialog(false);
  };

  const handleSaveSettings = async (settings: TrackingSettings) => {
    try {
      await updateSettings.mutateAsync({
        max_duration: settings.maxDuration,
        warning_threshold: settings.warningThreshold,
        first_day_of_week: settings.firstDayOfWeek,
        default_goal_notification_threshold: settings.defaultGoalNotificationThreshold,
        notifications_enabled: settings.notificationsEnabled,
      });
      setShowSettingsDialog(false);
      showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Failed to save settings');
    }
  };

  const handleResetSettings = async () => {
    const defaultSettings = {
      maxDuration: 12 * 3600, // 12 hours in seconds
      warningThreshold: 3600, // 1 hour warning
      firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
      defaultGoalNotificationThreshold: DEFAULT_NOTIFICATION_THRESHOLD,
      notificationsEnabled: true,
    };

    try {
      await updateSettings.mutateAsync({
        max_duration: defaultSettings.maxDuration,
        warning_threshold: defaultSettings.warningThreshold,
        first_day_of_week: defaultSettings.firstDayOfWeek,
        default_goal_notification_threshold: defaultSettings.defaultGoalNotificationThreshold,
        notifications_enabled: defaultSettings.notificationsEnabled,
      });
      showSuccess('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showError('Failed to reset settings');
    }
  };

  const handleResetDatabase = async () => {
    try {
      await clearAllData.mutateAsync();
      setShowResetConfirm(false);
      showSuccess('Database has been reset successfully', 5000);
    } catch (error) {
      console.error('Error resetting database:', error);
      showError('Failed to reset database');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" elevation={2}>
        <Toolbar sx={{ minHeight: 64 }}>
          <Timer sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            Time Tracker
          </Typography>

          <Tabs
            value={getCurrentTab()}
            onChange={handleTabChange}
            sx={{ flexGrow: 1 }}
          >
            <Tab label="Time Tracker" value="tracker" />
            <Tab label="Activity Manager" value="manager" />
            <Tab label="Help" value="help" />
          </Tabs>

          <Tooltip title="Settings">
            <IconButton
              color="inherit"
              onClick={handleOpenSettings}
              sx={{ ml: 1 }}
            >
              <Settings />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleOpenNotificationCenter}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={unreadCount} color="error">
                {notificationsEnabled ? (
                  <Notifications />
                ) : (
                  <NotificationsOff />
                )}
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Help">
            <IconButton color="inherit" onClick={() => navigate('/help')} sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ minHeight: '100dvh', mt: 2 }}>
        <Box>
          <Outlet />
        </Box>
      </Container>

      {/* Global Settings Dialog */}
      <SettingsDialog
        open={showSettingsDialog}
        settings={trackingSettings}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        onReset={handleResetSettings}
        onResetDatabase={() => setShowResetConfirm(true)}
        isLoading={updateSettings.isPending}
      />

      {/* Database Reset Confirmation */}
      <DeleteConfirmationDialog
        open={showResetConfirm}
        title="Reset Database"
        message="Are you sure you want to reset the database? This will delete all activities, time entries, and categories. This action cannot be undone."
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetDatabase}
        confirmButtonText="Reset Database"
        isLoading={clearAllData.isPending}
      />

      {/* Global Notification Dialog */}
      <NotificationDialog
        open={isNotificationDialogOpen}
        onClose={handleCloseNotificationDialog}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAllNotifications}
        onDeleteNotification={deleteNotification}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
      />

      {/* Database Reset Confirmation - will be handled by SettingsDialog's confirm */}
    </ThemeProvider>
  );
};
