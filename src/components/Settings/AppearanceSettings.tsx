import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Stack,
  FormControl,
  FormControlLabel,
  Switch,
  FormHelperText,
} from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import type { TrackingSettings as TrackingSettingsType } from '../../models';

interface AppearanceSettingsProps {
  settings: TrackingSettingsType;
  onUpdate: (updates: Partial<TrackingSettingsType>) => void;
  isLoading?: boolean;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  settings,
  onUpdate,
  isLoading = false,
}) => {
  return (
    <Card>
      <CardHeader title="Appearance" />
      <CardContent>
        <Stack spacing={3}>
          <FormControl disabled={isLoading}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode ?? false}
                  onChange={(e) =>
                    onUpdate({
                      darkMode: e.target.checked,
                    })
                  }
                  icon={<LightMode />}
                  checkedIcon={<DarkMode />}
                />
              }
              label={settings.darkMode ? 'Dark Mode' : 'Light Mode'}
            />
            <FormHelperText>Toggle between light and dark theme</FormHelperText>
          </FormControl>
        </Stack>
      </CardContent>
    </Card>
  );
};
