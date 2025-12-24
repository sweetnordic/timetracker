import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Stack,
  FormControl,
  FormControlLabel,
  Switch,
  FormHelperText,
} from '@mui/material';
import type { TrackingSettings as TrackingSettingsType } from '../../models';

interface NotificationSettingsProps {
  settings: TrackingSettingsType;
  onUpdate: (updates: Partial<TrackingSettingsType>) => void;
  isLoading?: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onUpdate,
  isLoading = false,
}) => {
  return (
    <Card>
      <CardHeader title="Notification Settings" />
      <CardContent>
        <Stack spacing={3}>
          <FormControl disabled={isLoading}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificationsEnabled}
                  onChange={(e) =>
                    onUpdate({
                      notificationsEnabled: e.target.checked,
                    })
                  }
                />
              }
              label="Enable Goal Notifications"
            />
            <FormHelperText>
              Receive notifications when approaching or reaching activity goals
            </FormHelperText>
          </FormControl>
          <TextField
            label="Default Goal Notification Threshold (%)"
            type="number"
            value={settings.defaultGoalNotificationThreshold}
            onChange={(e) =>
              onUpdate({
                defaultGoalNotificationThreshold: Number(e.target.value),
              })
            }
            inputProps={{ min: 0, max: 100, step: 5 }}
            fullWidth
            helperText="Default percentage at which to notify when reaching a goal"
            disabled={isLoading}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};
