import React from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Stop } from '@mui/icons-material';
import type { Activity } from '../models';

interface TrackingControlsProps {
  isTracking: boolean;
  currentActivity: Activity | null;
  elapsedTime: number;
  onStop: () => void;
  formatTime: (seconds: number) => string;
}

export const TrackingControls: React.FC<TrackingControlsProps> = ({
  isTracking,
  currentActivity,
  elapsedTime,
  onStop,
  formatTime,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isTracking || !currentActivity) {
    return null;
  }

  return (
    <Card
      elevation={3}
      sx={{
        mb: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.main}05)`,
        border: `1px solid ${theme.palette.primary.main}30`,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: 'success.main',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            />
            <Box>
              <Typography variant="h6" color="primary" fontWeight={600}>
                Currently Tracking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentActivity.name} • {currentActivity.category}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={formatTime(elapsedTime)}
              color="primary"
              variant="filled"
              sx={{
                fontSize: '1.1rem',
                fontWeight: 600,
                minWidth: '120px',
                fontFamily: 'monospace',
              }}
            />
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={onStop}
              size={isMobile ? 'small' : 'medium'}
            >
              Stop
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
