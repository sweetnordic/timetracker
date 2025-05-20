import React, { useState, useEffect } from 'react';
import { db } from '../database/db';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Container,
  TextField,
  Stack,
  Alert,
  MenuItem,
  Snackbar
} from '@mui/material';
import { PlayArrow, Stop, History, Add, Edit, Delete, Settings, Timer } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface Activity {
  id?: number;
  name: string;
  category: string;
  description: string;
  external_system: string;
  created_at: Date;
  updated_at: Date;
}

interface TimeEntry {
  id?: number;
  activity_id: number;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

interface ActivityWithStats extends Activity {
  totalDuration: number;
}

interface TimeEntryFormData {
  start_time: Date;
  end_time: Date;
  duration: number;
  notes: string;
}

interface ActivityFormData {
  name: string;
  category: string;
  description: string;
  external_system: string;
}

interface TrackingSettings {
  maxDuration: number; // in seconds
  warningThreshold: number; // in seconds
}

export const TimeTracker: React.FC = () => {
  const [activities, setActivities] = useState<ActivityWithStats[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithStats | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [entryFormData, setEntryFormData] = useState<TimeEntryFormData>({
    start_time: new Date(),
    end_time: new Date(),
    duration: 0,
    notes: ''
  });
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityFormData, setActivityFormData] = useState<ActivityFormData>({
    name: '',
    category: '',
    description: '',
    external_system: ''
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings>({
    maxDuration: 12 * 3600, // 12 hours in seconds
    warningThreshold: 3600 // 1 hour warning
  });
  const [showWarning, setShowWarning] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState<TrackingSettings>({
    maxDuration: 12 * 3600,
    warningThreshold: 3600
  });
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      await db.init();
      const loadedActivities = await db.getActivities();
      const activitiesWithStats = await Promise.all(
        loadedActivities.map(async (activity) => ({
          ...activity,
          totalDuration: await db.getTotalDurationByActivity(activity.id!),
        }))
      );
      setActivities(activitiesWithStats);

      // Load categories
      const loadedCategories = await db.getCategories();
      setCategories(loadedCategories.map(cat => cat.name));

      // Load tracking settings
      const settings = await db.getTrackingSettings();
      setTrackingSettings(settings);
      setSettingsFormData(settings);

      // Check for in-progress time entries
      const allTimeEntries = await db.getTimeEntries();
      const sortedEntries = allTimeEntries.sort((a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
      const inProgressEntry = sortedEntries.find(entry => entry.end_time === null);

      if (inProgressEntry) {
        const activity = activitiesWithStats.find(a => a.id === inProgressEntry.activity_id);
        if (activity) {
          setCurrentActivity(activity);
          setIsTracking(true);
          setStartTime(new Date(inProgressEntry.start_time));
          const elapsed = Math.floor((new Date().getTime() - new Date(inProgressEntry.start_time).getTime()) / 1000);
          setElapsedTime(elapsed);
        }
      }
    };
    initDb();
  }, []);

  useEffect(() => {
    let interval: number;
    if (isTracking && startTime) {
      interval = window.setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);

        // Check for warning threshold
        if (trackingSettings.maxDuration - elapsed <= trackingSettings.warningThreshold) {
          setShowWarning(true);
        }

        // Auto-stop if max duration reached
        if (elapsed >= trackingSettings.maxDuration) {
          stopTracking();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime, trackingSettings]);

  const startTracking = async (activity: Activity) => {
    if (isTracking) return;

    setCurrentActivity(activity);
    setIsTracking(true);
    const now = new Date();
    setStartTime(now);

    await db.addTimeEntry({
      activity_id: activity.id!,
      start_time: now,
      end_time: null,
      duration: null,
      notes: '',
      created_at: now,
      updated_at: now,
    });
  };

  const stopTracking = async () => {
    if (!isTracking || !currentActivity || !startTime) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    // Round to nearest 15 minutes (900 seconds)
    const roundedDuration = Math.round(duration / 900) * 900;

    // Get all time entries for the current activity
    const activityEntries = await db.getTimeEntriesByActivity(currentActivity.id!);
    // Find the most recent open entry
    const openEntry = activityEntries
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .find(entry => entry.end_time === null);

    if (openEntry) {
      await db.updateTimeEntry({
        id: openEntry.id,
        activity_id: currentActivity.id!,
        start_time: startTime,
        end_time: now,
        duration: roundedDuration,
        notes: '',
        created_at: startTime,
        updated_at: now,
      });
    }

    // Update activities with new duration
    const updatedActivities = await Promise.all(
      activities.map(async (activity) => ({
        ...activity,
        totalDuration: await db.getTotalDurationByActivity(activity.id!),
      }))
    );
    setActivities(updatedActivities);

    setIsTracking(false);
    setCurrentActivity(null);
    setStartTime(null);
    setElapsedTime(0);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleOpenDetail = async (activity: ActivityWithStats) => {
    setSelectedActivity(activity);
    const entries = await db.getTimeEntriesByActivity(activity.id!);
    setTimeEntries(entries);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedActivity(null);
    setTimeEntries([]);
  };

  const handleOpenEntryDialog = (entry?: TimeEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setEntryFormData({
        start_time: new Date(entry.start_time),
        end_time: entry.end_time ? new Date(entry.end_time) : new Date(),
        duration: entry.duration || 0,
        notes: entry.notes
      });
    } else {
      setEditingEntry(null);
      setEntryFormData({
        start_time: new Date(),
        end_time: new Date(),
        duration: 0,
        notes: ''
      });
    }
    setIsEntryDialogOpen(true);
  };

  const handleCloseEntryDialog = () => {
    setIsEntryDialogOpen(false);
    setEditingEntry(null);
  };

  const handleEntryFormChange = (field: keyof TimeEntryFormData, value: Date | string) => {
    setEntryFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // If start or end time changes, update duration
    if (field === 'start_time' || field === 'end_time') {
      const start = field === 'start_time' ? value as Date : entryFormData.start_time;
      const end = field === 'end_time' ? value as Date : entryFormData.end_time;
      const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
      setEntryFormData(prev => ({
        ...prev,
        duration: Math.round(duration / 900) * 900 // Round to nearest 15 minutes
      }));
    }
  };

  const handleSaveEntry = async () => {
    if (!selectedActivity) return;

    const entry: TimeEntry = {
      id: editingEntry?.id,
      activity_id: selectedActivity.id!,
      start_time: entryFormData.start_time,
      end_time: entryFormData.end_time,
      duration: entryFormData.duration,
      notes: entryFormData.notes,
      created_at: editingEntry?.created_at || new Date(),
      updated_at: new Date()
    };

    if (editingEntry) {
      await db.updateTimeEntry(entry);
    } else {
      await db.addTimeEntry(entry);
    }

    // Refresh time entries
    const entries = await db.getTimeEntriesByActivity(selectedActivity.id!);
    setTimeEntries(entries);

    // Update activities with new duration
    const updatedActivities = await Promise.all(
      activities.map(async (activity) => ({
        ...activity,
        totalDuration: await db.getTotalDurationByActivity(activity.id!),
      }))
    );
    setActivities(updatedActivities);

    handleCloseEntryDialog();
  };

  const handleDeleteClick = (entry: TimeEntry) => {
    setEntryToDelete(entry);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete || !selectedActivity) return;

    // Delete the entry from the database
    await db.deleteTimeEntry(entryToDelete.id!);

    // Refresh time entries
    const entries = await db.getTimeEntriesByActivity(selectedActivity.id!);
    setTimeEntries(entries);

    // Update activities with new duration
    const updatedActivities = await Promise.all(
      activities.map(async (activity) => ({
        ...activity,
        totalDuration: await db.getTotalDurationByActivity(activity.id!),
      }))
    );
    setActivities(updatedActivities);

    setIsDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const handleOpenActivityDialog = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setActivityFormData({
        name: activity.name,
        category: activity.category,
        description: activity.description,
        external_system: activity.external_system
      });
    } else {
      setEditingActivity(null);
      setActivityFormData({
        name: '',
        category: '',
        description: '',
        external_system: ''
      });
    }
    setIsActivityDialogOpen(true);
  };

  const handleCloseActivityDialog = () => {
    setIsActivityDialogOpen(false);
    setEditingActivity(null);
  };

  const handleActivityFormChange = (field: keyof ActivityFormData, value: string) => {
    setActivityFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveActivity = async () => {
    if (!activityFormData.name || !activityFormData.category) return;

    try {
      const activity: Activity = {
        id: editingActivity?.id,
        name: activityFormData.name,
        category: activityFormData.category,
        description: activityFormData.description,
        external_system: activityFormData.external_system,
        created_at: editingActivity?.created_at || new Date(),
        updated_at: new Date()
      };

      if (editingActivity?.id) {
        await db.updateActivity(activity);
      } else {
        await db.addActivity(activity);
      }

      // Refresh activities
      const loadedActivities = await db.getActivities();
      const activitiesWithStats = await Promise.all(
        loadedActivities.map(async (activity) => ({
          ...activity,
          totalDuration: await db.getTotalDurationByActivity(activity.id!),
        }))
      );
      setActivities(activitiesWithStats);

      handleCloseActivityDialog();
    } catch (error) {
      console.error('Error saving activity:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleOpenSettings = () => {
    setSettingsFormData(trackingSettings);
    setShowSettingsDialog(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsDialog(false);
  };

  const handleSaveSettings = async () => {
    try {
      await db.updateTrackingSettings(
        settingsFormData.maxDuration,
        settingsFormData.warningThreshold
      );
      setTrackingSettings(settingsFormData);
      setShowSettingsDialog(false);
      setShowSaveSuccess(true);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleResetSettings = async () => {
    try {
      const defaultSettings = {
        maxDuration: 12 * 3600, // 12 hours in seconds
        warningThreshold: 3600 // 1 hour warning
      };
      await db.updateTrackingSettings(
        defaultSettings.maxDuration,
        defaultSettings.warningThreshold
      );
      setTrackingSettings(defaultSettings);
      setSettingsFormData(defaultSettings);
      setShowResetSuccess(true);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  const handleExtendTime = () => {
    setShowWarning(false);
    // Extend the max duration by the warning threshold
    setTrackingSettings(prev => ({
      ...prev,
      maxDuration: prev.maxDuration + prev.warningThreshold
    }));
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Time Tracker
          </Typography>
          <IconButton onClick={handleOpenSettings} color="primary">
            <Timer />
          </IconButton>
        </Box>

        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            bgcolor: isTracking ? 'primary.light' : 'background.paper',
            color: isTracking ? 'primary.contrastText' : 'text.primary'
          }}
        >
          {isTracking && currentActivity ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Currently Tracking: {currentActivity.name}
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={(elapsedTime % 3600) / 36}
                  size={120}
                  thickness={4}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" component="div">
                    {formatTime(elapsedTime)}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={stopTracking}
                size="large"
              >
                Stop Tracking
              </Button>
            </Box>
          ) : (
            <Typography variant="h6" align="center">
              No activity being tracked
            </Typography>
          )}
        </Paper>

        <Typography variant="h5" gutterBottom>
          Activities
        </Typography>
        <List>
          {activities.map((activity) => (
            <ListItem
              key={activity.id}
              component={Card}
              sx={{ mb: 2 }}
            >
              <CardContent sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" gutterBottom>
                        {activity.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenActivityDialog(activity)}
                      >
                        <Settings />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Category: {activity.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Time: {formatDuration(activity.totalDuration)}
                      </Typography>
                    </Box>
                    {activity.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {activity.description}
                      </Typography>
                    )}
                    {activity.external_system && (
                      <Typography variant="body2" color="text.secondary">
                        External System: {activity.external_system}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="View History">
                      <IconButton
                        onClick={() => handleOpenDetail(activity)}
                        color="primary"
                      >
                        <History />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrow />}
                      onClick={() => startTracking(activity)}
                      disabled={isTracking}
                    >
                      Start Tracking
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </ListItem>
          ))}
        </List>

        <Dialog
          open={isDetailOpen}
          onClose={handleCloseDetail}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Time Entries for {selectedActivity?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenEntryDialog()}
              >
                Add Entry
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      sx={{
                        bgcolor: !entry.end_time ? 'action.hover' : 'inherit',
                        '&:hover': {
                          bgcolor: !entry.end_time ? 'action.selected' : 'action.hover'
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {!entry.end_time && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': {
                                    opacity: 1,
                                  },
                                  '50%': {
                                    opacity: 0.4,
                                  },
                                  '100%': {
                                    opacity: 1,
                                  },
                                },
                              }}
                            />
                          )}
                          {new Date(entry.start_time).toLocaleString()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {entry.end_time ? new Date(entry.end_time).toLocaleString() : (
                          <Typography color="primary" sx={{ fontWeight: 'medium' }}>
                            In Progress
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.duration ? formatDuration(entry.duration) : '-'}
                      </TableCell>
                      <TableCell>{entry.notes || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEntryDialog(entry)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(entry)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetail}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isEntryDialogOpen}
          onClose={handleCloseEntryDialog}
          maxWidth="sm"
          fullWidth
        >
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
                  value={entryFormData.start_time}
                  onChange={(newValue: Date | null) => newValue && handleEntryFormChange('start_time', newValue)}
                />
                <DateTimePicker
                  label="End Time"
                  value={entryFormData.end_time}
                  onChange={(newValue: Date | null) => newValue && handleEntryFormChange('end_time', newValue)}
                />
                <TextField
                  label="Duration"
                  value={formatDuration(entryFormData.duration)}
                  disabled
                />
                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={entryFormData.notes}
                  onChange={(e) => handleEntryFormChange('notes', e.target.value)}
                />
              </Stack>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEntryDialog}>Cancel</Button>
            <Button
              onClick={handleSaveEntry}
              variant="contained"
              disabled={!!timeError}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Time Entry</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isActivityDialogOpen}
          onClose={handleCloseActivityDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingActivity ? 'Edit Activity' : 'Add Activity'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Name"
                value={activityFormData.name}
                onChange={(e) => handleActivityFormChange('name', e.target.value)}
                required
                fullWidth
              />
              <TextField
                select
                label="Category"
                value={activityFormData.category}
                onChange={(e) => handleActivityFormChange('category', e.target.value)}
                required
                fullWidth
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Description"
                value={activityFormData.description}
                onChange={(e) => handleActivityFormChange('description', e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
              <TextField
                label="External System"
                value={activityFormData.external_system}
                onChange={(e) => handleActivityFormChange('external_system', e.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseActivityDialog}>Cancel</Button>
            <Button
              onClick={handleSaveActivity}
              variant="contained"
              disabled={!activityFormData.name || !activityFormData.category}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={showWarning}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={handleExtendTime}>
                Extend Time
              </Button>
            }
          >
            Warning: Time tracking will stop in {Math.ceil((trackingSettings.maxDuration - elapsedTime) / 60)} minutes
          </Alert>
        </Snackbar>

        <Dialog
          open={showSettingsDialog}
          onClose={handleCloseSettings}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Tracking Settings</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Maximum Tracking Duration (hours)"
                type="number"
                value={settingsFormData.maxDuration / 3600}
                onChange={(e) => setSettingsFormData(prev => ({
                  ...prev,
                  maxDuration: Number(e.target.value) * 3600
                }))}
                inputProps={{ min: 1, max: 24 }}
                fullWidth
              />
              <TextField
                label="Warning Threshold (minutes)"
                type="number"
                value={settingsFormData.warningThreshold / 60}
                onChange={(e) => setSettingsFormData(prev => ({
                  ...prev,
                  warningThreshold: Number(e.target.value) * 60
                }))}
                inputProps={{ min: 5, max: 60 }}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleResetSettings} color="secondary">
              Reset to Defaults
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={handleCloseSettings}>Cancel</Button>
            <Button onClick={handleSaveSettings} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={showResetSuccess}
          autoHideDuration={3000}
          onClose={() => setShowResetSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowResetSuccess(false)}
            severity="success"
            sx={{ width: '100%' }}
          >
            Settings have been reset to defaults
          </Alert>
        </Snackbar>

        <Snackbar
          open={showSaveSuccess}
          autoHideDuration={3000}
          onClose={() => setShowSaveSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowSaveSuccess(false)}
            severity="success"
            sx={{ width: '100%' }}
          >
            Settings have been saved successfully
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};
