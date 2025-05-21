import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Button,
  Paper,
  Stack,
  Alert,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { db } from '../database/db';
import type { WorkSchedule } from '../database/types';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WorkScheduleConfig: React.FC = () => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const loadedSchedules = await db.getAllWorkSchedules();
      setSchedules(loadedSchedules);
    } catch (err) {
      setError('Failed to load work schedules');
      console.error('Error loading schedules:', err);
    }
  };

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedules(prev => prev.map(schedule =>
      schedule.day_of_week === dayOfWeek
        ? { ...schedule, [field]: value }
        : schedule
    ));
  };

  const handleWorkdayToggle = (dayOfWeek: number) => {
    setSchedules(prev => prev.map(schedule =>
      schedule.day_of_week === dayOfWeek
        ? {
            ...schedule,
            is_workday: !schedule.is_workday,
            start_time: !schedule.is_workday ? '09:00' : '00:00',
            end_time: !schedule.is_workday ? '17:00' : '00:00'
          }
        : schedule
    ));
  };

  const handleSave = async () => {
    try {
      for (const schedule of schedules) {
        await db.updateWorkSchedule(schedule);
      }
      setSuccess('Work schedule updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save work schedule');
      console.error('Error saving schedules:', err);
    }
  };

  const handleCancel = () => {
    loadSchedules();
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Work Schedule Configuration</Typography>
          {!isEditing ? (
            <Button variant="contained" onClick={() => setIsEditing(true)}>
              Edit Schedule
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave}>
                Save Changes
              </Button>
            </Stack>
          )}
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Work Day</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.day_of_week}>
                  <TableCell>{DAYS_OF_WEEK[schedule.day_of_week]}</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={schedule.is_workday}
                          onChange={() => handleWorkdayToggle(schedule.day_of_week)}
                          disabled={!isEditing}
                          size="small"
                        />
                      }
                      label={schedule.is_workday ? 'Yes' : 'No'}
                    />
                  </TableCell>
                  <TableCell>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <TimePicker
                        value={new Date(`2000-01-01T${schedule.start_time}`)}
                        onChange={(newValue) => {
                          if (newValue) {
                            const timeString = newValue.toTimeString().slice(0, 5);
                            handleTimeChange(schedule.day_of_week, 'start_time', timeString);
                          }
                        }}
                        disabled={!isEditing || !schedule.is_workday}
                        slotProps={{
                          textField: {
                            size: "small",
                            sx: { width: '120px' }
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </TableCell>
                  <TableCell>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <TimePicker
                        value={new Date(`2000-01-01T${schedule.end_time}`)}
                        onChange={(newValue) => {
                          if (newValue) {
                            const timeString = newValue.toTimeString().slice(0, 5);
                            handleTimeChange(schedule.day_of_week, 'end_time', timeString);
                          }
                        }}
                        disabled={!isEditing || !schedule.is_workday}
                        slotProps={{
                          textField: {
                            size: "small",
                            sx: { width: '120px' }
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
