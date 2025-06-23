import React from 'react';
import {
  Box,
  Chip,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CloudOff,
  Cloud,
  Sync,
  Update,
  Close,
  WifiOff,
  Wifi,
} from '@mui/icons-material';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  showUpdateSnackbar?: boolean;
  compact?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showUpdateSnackbar = true,
  compact = false,
}) => {
  const theme = useTheme();
  const {
    isOnline,
    hasUpdateAvailable,
    installUpdate,
    optimizeCache,
    serviceWorker,
  } = useOfflineStatus();

  const [updateSnackbarOpen, setUpdateSnackbarOpen] = React.useState(false);

  // Show update snackbar when update is available
  React.useEffect(() => {
    if (hasUpdateAvailable && showUpdateSnackbar) {
      setUpdateSnackbarOpen(true);
    }
  }, [hasUpdateAvailable, showUpdateSnackbar]);

  const handleInstallUpdate = async () => {
    setUpdateSnackbarOpen(false);
    await installUpdate();
  };

  const handleCloseUpdateSnackbar = () => {
    setUpdateSnackbarOpen(false);
  };

  const handleOptimizeClick = () => {
    optimizeCache();
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={isOnline ? <Wifi /> : <WifiOff />}
          label={isOnline ? 'Online' : 'Offline'}
          size="small"
          color={isOnline ? 'success' : 'warning'}
          variant="outlined"
        />

        <IconButton
          size="small"
          onClick={handleOptimizeClick}
          title="Optimize app cache"
        >
          <Sync fontSize="small" />
        </IconButton>

        {hasUpdateAvailable && (
          <IconButton
            size="small"
            onClick={installUpdate}
            color="primary"
            title="Install app update"
          >
            <Update fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  }

  return (
    <>
      {/* Status Indicator */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: theme.zIndex.snackbar - 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Connection Status */}
        <Chip
          icon={isOnline ? <Cloud /> : <CloudOff />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption">
                {isOnline ? 'Online' : 'Offline'}
              </Typography>
              {serviceWorker.isRegistered && (
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  • PWA Ready
                </Typography>
              )}
            </Box>
          }
          color={isOnline ? 'success' : 'warning'}
          variant="filled"
          sx={{
            '& .MuiChip-label': {
              px: 1,
            },
          }}
        />

        {/* Cache Optimization Button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<Sync />}
          onClick={handleOptimizeClick}
          sx={{
            minWidth: 'auto',
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '&:hover': {
              borderColor: theme.palette.primary.dark,
              backgroundColor: `${theme.palette.primary.main}08`,
            },
          }}
        >
          Optimize Cache
        </Button>

        {/* Update Button */}
        {hasUpdateAvailable && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Update />}
            onClick={installUpdate}
            color="primary"
            sx={{
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          >
            Install Update
          </Button>
        )}
      </Box>

      {/* Update Available Snackbar */}
      <Snackbar
        open={updateSnackbarOpen}
        autoHideDuration={null} // Don't auto-hide
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleInstallUpdate}
                startIcon={<Update />}
              >
                Update Now
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={handleCloseUpdateSnackbar}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <Typography variant="body2">
            A new version of Time Tracker is available!
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};
