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
  Settings,
  LightMode,
  DarkMode,
  ImportExport
} from '@mui/icons-material';
import { useNotifications, useClearAllData } from '../hooks';
import { useSettings } from '../hooks/useSettings';
import { NotificationDialog, SettingsDialog, DeleteConfirmationDialog, DataDialog } from './';
import { useToast } from '../contexts';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  // Use new LocalStorage-based settings
  const {
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    isDarkMode,
    notificationsEnabled
  } = useSettings();

  // Create theme based on settings
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#104d93' : '#1976d2', // Darker blue for dark mode
        light: isDarkMode ? '#1976d2' : '#42a5f5',
        dark: isDarkMode ? '#0d47a1' : '#104d93',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f5f5',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#0b3565' : '#1976d2', // Darker blue for dark mode
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

  // Notification management
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll: clearAllNotifications
  } = useNotifications();

  // Database operations
  const clearAllData = useClearAllData();

  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDataDialog, setShowDataDialog] = useState(false);

  const getCurrentTab = () => {
    switch (location.pathname) {
      case '/':
      case '/tracker':
        return 'tracker';
      case '/manager':
        return 'manager';
      case '/analytics':
        return 'analytics';
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
      case 'analytics':
        navigate('/analytics');
        break;
      case 'help':
        navigate('/help');
        break;
    }
  };

  const handleThemeToggle = () => {
    updateSetting('darkMode', !isDarkMode);
  };

  const handleOpenNotificationCenter = () => {
    setIsNotificationDialogOpen(true);
  };

  const handleCloseNotificationDialog = () => {
    setIsNotificationDialogOpen(false);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    updateSetting('notificationsEnabled', enabled);
  };

  const handleOpenSettings = () => {
    setShowSettingsDialog(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsDialog(false);
  };

  const handleSaveSettings = async (newSettings: typeof settings) => {
    try {
      updateSettings(newSettings);
      setShowSettingsDialog(false);
      showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Failed to save settings');
    }
  };

  const handleResetSettings = async () => {
    try {
      resetSettings();
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
            <Tab label="Analytics" value="analytics" />
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

          <Tooltip title="Export/Import Data">
            <IconButton
              color="inherit"
              onClick={() => setShowDataDialog(true)}
              sx={{ ml: 1 }}
            >
              <ImportExport />
            </IconButton>
          </Tooltip>

          <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton
              color="inherit"
              onClick={handleThemeToggle}
              sx={{ ml: 1 }}
            >
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Help">
            <IconButton color="inherit" onClick={() => navigate('/help')} sx={{ ml: 1 }}>
              <HelpIcon />
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
        settings={settings}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        onReset={handleResetSettings}
        onResetDatabase={() => setShowResetConfirm(true)}
        isLoading={false}
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

      {/* Data Export/Import Dialog */}
      <DataDialog
        open={showDataDialog}
        onClose={() => setShowDataDialog(false)}
      />
    </ThemeProvider>
  );
};
