import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  Switch,
} from '@mui/material';
import type { TrackingSettings as TrackingSettingsType } from '../../models';

interface TrackingSettingsProps {
  settings: TrackingSettingsType;
  onUpdate: (updates: Partial<TrackingSettingsType>) => void;
  isLoading?: boolean;
}

export const TrackingSettings: React.FC<TrackingSettingsProps> = ({
  settings,
  onUpdate,
  isLoading = false,
}) => {
  return (
    <Card>
      <CardHeader title="Tracking Settings" />
      <CardContent>
        <Stack spacing={3}>
          <TextField
            label="Maximum Tracking Duration (hours)"
            type="number"
            value={settings.maxDuration / 3600}
            onChange={(e) =>
              onUpdate({
                maxDuration: Number(e.target.value) * 3600,
              })
            }
            inputProps={{ min: 1, max: 24 }}
            fullWidth
            disabled={isLoading}
            helperText="Maximum duration before automatic stop warning"
          />
          <TextField
            label="Warning Threshold (minutes)"
            type="number"
            value={settings.warningThreshold / 60}
            onChange={(e) =>
              onUpdate({
                warningThreshold: Number(e.target.value) * 60,
              })
            }
            inputProps={{ min: 5, max: 60 }}
            fullWidth
            disabled={isLoading}
            helperText="Time before maximum duration to show warning"
          />
          <FormControl disabled={isLoading}>
            <FormLabel>First Day of Week</FormLabel>
            <RadioGroup
              value={settings.firstDayOfWeek}
              onChange={(e) =>
                onUpdate({
                  firstDayOfWeek: e.target.value as 'monday' | 'sunday',
                })
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
            <FormHelperText>
              Used for weekly reports and analytics
            </FormHelperText>
          </FormControl>
          <FormControl disabled={isLoading}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.stopTrackingOnClose ?? true}
                  onChange={(e) =>
                    onUpdate({
                      stopTrackingOnClose: e.target.checked,
                    })
                  }
                />
              }
              label="Stop Tracking on App Close"
            />
            <FormHelperText>
              When enabled, time tracking will automatically stop when you close
              the app or tab
            </FormHelperText>
          </FormControl>
          <FormControl disabled={isLoading}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.stopTrackingOnTabSwitch ?? true}
                  onChange={(e) =>
                    onUpdate({
                      stopTrackingOnTabSwitch: e.target.checked,
                    })
                  }
                />
              }
              label="Stop Tracking on Tab Switch"
            />
            <FormHelperText>
              When enabled, time tracking will automatically stop when you
              switch to another tab or minimize the window
            </FormHelperText>
          </FormControl>
        </Stack>
      </CardContent>
    </Card>
  );
};
