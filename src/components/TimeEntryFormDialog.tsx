import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { TimeEntry } from '../models';

interface TimeEntryFormData {
  startTime: Date;
  endTime: Date;
  duration: number;
  notes: string;
}

interface TimeEntryFormDialogProps {
  open: boolean;
  editingEntry: TimeEntry | null;
  onClose: () => void;
  onSave: (formData: TimeEntryFormData) => Promise<void>;
  formatDuration: (seconds: number) => string;
  isLoading?: boolean;
}

export const TimeEntryFormDialog: React.FC<TimeEntryFormDialogProps> = ({
  open,
  editingEntry,
  onClose,
  onSave,
  formatDuration,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<TimeEntryFormData>({
    startTime: new Date(),
    endTime: new Date(),
    duration: 0,
    notes: '',
  });
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        startTime: new Date(editingEntry.startTime),
        endTime: editingEntry.endTime
          ? new Date(editingEntry.endTime)
          : new Date(),
        duration: editingEntry.duration || 0,
        notes: editingEntry.notes,
      });
    } else {
      setFormData({
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        notes: '',
      });
    }
    setTimeError(null);
  }, [editingEntry, open]);

  const handleFormChange = (
    field: keyof TimeEntryFormData,
    value: Date | string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // If start or end time changes, update duration
    if (field === 'startTime' || field === 'endTime') {
      const start =
        field === 'startTime' ? (value as Date) : formData.startTime;
      const end = field === 'endTime' ? (value as Date) : formData.endTime;

      if (start && end) {
        const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

        if (duration < 0) {
          setTimeError('End time must be after start time');
        } else {
          setTimeError(null);
        }

        setFormData((prev) => ({
          ...prev,
          duration: Math.max(0, Math.ceil(duration / 900) * 900), // Round up to nearest 15 minutes
        }));
      }
    }
  };

  const handleSave = async () => {
    if (timeError) return;

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  };

  const handleClose = () => {
    setTimeError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
      </DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {timeError && (
              <Alert severity="error" onClose={() => setTimeError(null)}>
                {timeError}
              </Alert>
            )}
            <DateTimePicker
              label="Start Time"
              value={formData.startTime}
              onChange={(newValue: Date | null) =>
                newValue && handleFormChange('startTime', newValue)
              }
              disabled={isLoading}
            />
            <DateTimePicker
              label="End Time"
              value={formData.endTime}
              onChange={(newValue: Date | null) =>
                newValue && handleFormChange('endTime', newValue)
              }
              disabled={isLoading}
            />
            <TextField
              label="Duration"
              value={formatDuration(formData.duration)}
              disabled
              helperText="Duration is automatically calculated from start and end times"
            />
            <TextField
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              disabled={isLoading}
            />
          </Stack>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!!timeError || isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
