import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  Divider
} from '@mui/material';
import { Save, RestartAlt } from '@mui/icons-material';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../contexts';
import { useClearAllData } from '../hooks';
import {
  TrackingSettings,
  NotificationSettings,
  AppearanceSettings,
  DataSettings
} from '../components/Settings';

export const Settings: React.FC = () => {
  const { settings, updateSettings, updateSetting, resetSettings } = useSettings();
  const { showSuccess, showError } = useToast();
  const clearAllData = useClearAllData();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local settings when props change
  React.useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleUpdate = (updates: Partial<typeof settings>) => {
    setLocalSettings((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Handle dark mode toggle - save immediately for live theme updates
  const handleDarkModeUpdate = (updates: Partial<typeof settings>) => {
    if ('darkMode' in updates) {
      // Save dark mode immediately
      updateSetting('darkMode', updates.darkMode as boolean);
      // Also update local state to keep UI in sync
      setLocalSettings((prev) => ({ ...prev, ...updates }));
    } else {
      handleUpdate(updates);
    }
  };

  const handleSave = async () => {
    try {
      updateSettings(localSettings);
      setHasChanges(false);
      showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Failed to save settings');
    }
  };

  const handleReset = async () => {
    try {
      resetSettings();
      setHasChanges(false);
      showSuccess('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      showError('Failed to reset settings');
    }
  };

  const handleResetDatabase = async () => {
    try {
      await clearAllData.mutateAsync();
      showSuccess('Database has been reset successfully', 5000);
    } catch (error) {
      console.error('Error resetting database:', error);
      showError('Failed to reset database');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your application preferences and data
          </Typography>
        </Box>

        <Stack spacing={4}>
          <TrackingSettings
            settings={localSettings}
            onUpdate={handleUpdate}
          />

          <NotificationSettings
            settings={localSettings}
            onUpdate={handleUpdate}
          />

          <AppearanceSettings
            settings={localSettings}
            onUpdate={handleDarkModeUpdate}
          />

          <DataSettings
            onResetDatabase={handleResetDatabase}
            isLoading={clearAllData.isPending}
          />
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RestartAlt />}
            onClick={handleReset}
            disabled={!hasChanges}
          >
            Reset to Defaults
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
