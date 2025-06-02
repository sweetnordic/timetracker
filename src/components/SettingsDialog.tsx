import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Box
} from '@mui/material';
import type { TrackingSettings } from '../models';

interface SettingsDialogProps {
  open: boolean;
  settings: TrackingSettings;
  onClose: () => void;
  onSave: (settings: TrackingSettings) => Promise<void>;
  onReset: () => Promise<void>;
  onResetDatabase: () => void;
  isLoading?: boolean;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  settings,
  onClose,
  onSave,
  onReset,
  onResetDatabase,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<TrackingSettings>(settings);

  useEffect(() => {
    if (open) {
      setFormData(settings);
    }
  }, [settings, open]);

  const handleSave = async () => {
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleReset = async () => {
    try {
      await onReset();
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  const handleClose = () => {
    setFormData(settings); // Reset form data to original settings
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Tracking Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Maximum Tracking Duration (hours)"
            type="number"
            value={formData.maxDuration / 3600}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                maxDuration: Number(e.target.value) * 3600,
              }))
            }
            inputProps={{ min: 1, max: 24 }}
            fullWidth
            disabled={isLoading}
          />
          <TextField
            label="Warning Threshold (minutes)"
            type="number"
            value={formData.warningThreshold / 60}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                warningThreshold: Number(e.target.value) * 60,
              }))
            }
            inputProps={{ min: 5, max: 60 }}
            fullWidth
            disabled={isLoading}
          />
          <TextField
            label="Default Goal Notification Threshold (%)"
            type="number"
            value={formData.defaultGoalNotificationThreshold}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                defaultGoalNotificationThreshold: Number(e.target.value),
              }))
            }
            inputProps={{ min: 0, max: 100, step: 5 }}
            fullWidth
            helperText="Default percentage at which to notify when reaching a goal"
            disabled={isLoading}
          />
          <FormControl disabled={isLoading}>
            <FormLabel>First Day of Week</FormLabel>
            <RadioGroup
              value={formData.firstDayOfWeek}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  firstDayOfWeek: e.target.value as 'monday' | 'sunday',
                }))
              }
            >
              <FormControlLabel
                value="monday"
                control={<Radio />}
                label="Monday"
              />
              <FormControlLabel
                value="sunday"
                control={<Radio />}
                label="Sunday"
              />
            </RadioGroup>
          </FormControl>
          <FormControl disabled={isLoading}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.notificationsEnabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationsEnabled: e.target.checked,
                    }))
                  }
                />
              }
              label="Enable Goal Notifications"
            />
          </FormControl>
          <Button
            variant="outlined"
            color="error"
            onClick={onResetDatabase}
            fullWidth
            disabled={isLoading}
          >
            Reset Database
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color="secondary" disabled={isLoading}>
          Reset to Defaults
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
