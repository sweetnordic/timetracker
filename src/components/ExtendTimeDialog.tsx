import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box
} from '@mui/material';

interface ExtendTimeDialogProps {
  open: boolean;
  remainingMinutes: number;
  onExtend: () => void;
  onStop: () => void;
  onClose: () => void;
  activityName?: string;
}

export const ExtendTimeDialog: React.FC<ExtendTimeDialogProps> = ({
  open,
  remainingMinutes,
  onExtend,
  onStop,
  onClose,
  activityName
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Time Tracking Warning</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Time tracking will automatically stop in <strong>{remainingMinutes} minutes</strong>.
          </Typography>
          {activityName && (
            <Typography variant="body2" color="text.secondary">
              Currently tracking: {activityName}
            </Typography>
          )}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            You can extend the tracking time or stop tracking now.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onStop} color="error">
          Stop Tracking Now
        </Button>
        <Button onClick={onExtend} variant="contained" color="primary">
          Extend Time
        </Button>
        <Button onClick={onClose}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
