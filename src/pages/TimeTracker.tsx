import React, { useState, useEffect } from 'react';
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
  TextField,
  Stack,
  Alert,
  Snackbar,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
} from '@mui/material';
import { PlayArrow, Stop, History, Add, Edit, Delete, Settings, ArrowUpward, ArrowDownward, Notifications, NotificationsOff } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  useActivities,
  useUpdateActivityOrder,
  useTimeEntriesByActivity,
  useOpenTimeEntries,
  useAddTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useTrackingSettings,
  useUpdateTrackingSettings,
  useClearAllData
} from '../hooks';
import type { Activity, ActivityWithStats, TrackingSettings, TimeEntry } from '../models';
import type { DatabaseActivity, DatabaseTimeEntry } from '../database/models';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_ORDER, DEFAULT_NOTIFICATION_THRESHOLD, DEFAULT_FIRST_DAY_OF_WEEK } from '../database/models';

interface TimeEntryFormData {
  startTime: Date;
  endTime: Date;
  duration: number;
  notes: string;
}

// Helper to convert database models to UI models
const convertDatabaseActivityToUI = (dbActivity: DatabaseActivity): Activity => ({
  id: dbActivity.id,
  name: dbActivity.name,
  category: dbActivity.category,
  description: dbActivity.description,
  externalSystem: dbActivity.external_system,
  order: dbActivity.order,
  createdAt: dbActivity.created_at,
  updatedAt: dbActivity.updated_at,
});

const convertDatabaseTimeEntryToUI = (dbEntry: DatabaseTimeEntry): TimeEntry => ({
  id: dbEntry.id,
  activityId: dbEntry.activity_id,
  startTime: dbEntry.start_time,
  endTime: dbEntry.end_time,
  duration: dbEntry.duration,
  notes: dbEntry.notes,
  createdAt: dbEntry.created_at,
  updatedAt: dbEntry.updated_at,
});

export const TimeTracker: React.FC = () => {
  // Queries
  const { data: dbActivities = [], isLoading: activitiesLoading } = useActivities();
  const { data: dbSettings } = useTrackingSettings();
  const { data: dbOpenEntries = [] } = useOpenTimeEntries();

  // Mutations
  const updateActivityOrder = useUpdateActivityOrder();
  const addTimeEntry = useAddTimeEntry();
  const updateTimeEntry = useUpdateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();
  const updateSettings = useUpdateTrackingSettings();
  const clearAllData = useClearAllData();

  // Convert database models to UI models
  const activities: ActivityWithStats[] = dbActivities.map(dbActivity => ({
    ...convertDatabaseActivityToUI(dbActivity),
    totalDuration: 0, // Will be updated separately
  }));

  const trackingSettings: TrackingSettings = dbSettings ? {
    maxDuration: dbSettings.max_duration,
    warningThreshold: dbSettings.warning_threshold,
    firstDayOfWeek: dbSettings.first_day_of_week,
    defaultGoalNotificationThreshold: dbSettings.default_goal_notification_threshold,
    notificationsEnabled: dbSettings.notifications_enabled,
  } : {
    maxDuration: 12 * 3600,
    warningThreshold: 3600,
    firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
    defaultGoalNotificationThreshold: DEFAULT_NOTIFICATION_THRESHOLD,
    notificationsEnabled: true
  };

  // Local state
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
    startTime: new Date(),
    endTime: new Date(),
    duration: 0,
    notes: ''
  });
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState<TrackingSettings>({
    maxDuration: 12 * 3600,
    warningThreshold: 3600,
    firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
    defaultGoalNotificationThreshold: DEFAULT_NOTIFICATION_THRESHOLD,
    notificationsEnabled: true
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  // Query for time entries when detail dialog is open
  const { data: dbActivityTimeEntries = [] } = useTimeEntriesByActivity(selectedActivity?.id || '');

  // Initialize component state on load
  useEffect(() => {
    // Check for in-progress time entries
    const inProgressEntry = dbOpenEntries[0]; // Get the most recent open entry

    if (inProgressEntry) {
      const activity = activities.find(a => a.id === inProgressEntry.activity_id);
      if (activity) {
        setCurrentActivity(activity);
        setIsTracking(true);
        setStartTime(new Date(inProgressEntry.start_time));
        const elapsed = Math.floor((new Date().getTime() - new Date(inProgressEntry.start_time).getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    }

    // Update settings form
    setSettingsFormData(trackingSettings);
  }, [dbOpenEntries, activities, trackingSettings]);

  // Update time entries when activity changes
  useEffect(() => {
    if (selectedActivity && dbActivityTimeEntries) {
      setTimeEntries(dbActivityTimeEntries.map(convertDatabaseTimeEntryToUI));
    }
  }, [selectedActivity, dbActivityTimeEntries]);

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

    try {
      await addTimeEntry.mutateAsync({
        activity_id: activity.id!,
        start_time: now,
        end_time: null,
        duration: null,
        notes: '',
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      console.error('Error starting time tracking:', error);
    }
  };

  const stopTracking = async () => {
    if (!isTracking || !currentActivity || !startTime) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    // Round to nearest 15 minutes (900 seconds)
    const roundedDuration = Math.round(duration / 900) * 900;

    try {
      // Find the most recent open entry for this activity
      const openEntry = dbOpenEntries.find(entry =>
        entry.activity_id === currentActivity.id && entry.end_time === null
      );

      if (openEntry) {
        await updateTimeEntry.mutateAsync({
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

      setIsTracking(false);
      setCurrentActivity(null);
      setStartTime(null);
      setElapsedTime(0);
    } catch (error) {
      console.error('Error stopping time tracking:', error);
    }
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

  const handleOpenDetail = (activity: ActivityWithStats) => {
    setSelectedActivity(activity);
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
        startTime: new Date(entry.startTime),
        endTime: entry.endTime ? new Date(entry.endTime) : new Date(),
        duration: entry.duration || 0,
        notes: entry.notes
      });
    } else {
      setEditingEntry(null);
      setEntryFormData({
        startTime: new Date(),
        endTime: new Date(),
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
    if (field === 'startTime' || field === 'endTime') {
      const start = field === 'startTime' ? value as Date : entryFormData.startTime;
      const end = field === 'endTime' ? value as Date : entryFormData.endTime;
      const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
      setEntryFormData(prev => ({
        ...prev,
        duration: Math.round(duration / 900) * 900 // Round to nearest 15 minutes
      }));
    }
  };

  const handleSaveEntry = async () => {
    if (!selectedActivity) return;

    const entry: DatabaseTimeEntry = {
      id: editingEntry?.id || uuidv4(),
      activity_id: selectedActivity.id!,
      start_time: entryFormData.startTime,
      end_time: entryFormData.endTime,
      duration: entryFormData.duration,
      notes: entryFormData.notes,
      created_at: editingEntry?.createdAt || new Date(),
      updated_at: new Date()
    };

    try {
      if (editingEntry) {
        await updateTimeEntry.mutateAsync(entry);
      } else {
        await addTimeEntry.mutateAsync(entry);
      }

      handleCloseEntryDialog();
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  };

  const handleDeleteClick = (entry: TimeEntry) => {
    setEntryToDelete(entry);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    try {
      await deleteTimeEntry.mutateAsync(entryToDelete.id!);
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting time entry:', error);
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
      await updateSettings.mutateAsync({
        max_duration: settingsFormData.maxDuration,
        warning_threshold: settingsFormData.warningThreshold,
        first_day_of_week: settingsFormData.firstDayOfWeek,
        default_goal_notification_threshold: settingsFormData.defaultGoalNotificationThreshold,
        notifications_enabled: settingsFormData.notificationsEnabled,
      });
      setShowSettingsDialog(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleResetSettings = async () => {
    const defaultSettings = {
      maxDuration: 12 * 3600, // 12 hours in seconds
      warningThreshold: 3600, // 1 hour warning
      firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
      defaultGoalNotificationThreshold: DEFAULT_NOTIFICATION_THRESHOLD,
      notificationsEnabled: true,
    };

    try {
      await updateSettings.mutateAsync({
        max_duration: defaultSettings.maxDuration,
        warning_threshold: defaultSettings.warningThreshold,
        first_day_of_week: defaultSettings.firstDayOfWeek,
        default_goal_notification_threshold: defaultSettings.defaultGoalNotificationThreshold,
        notifications_enabled: defaultSettings.notificationsEnabled,
      });
      setSettingsFormData(defaultSettings);
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  const handleExtendTime = () => {
    setShowWarning(false);
    // Extend the max duration by the warning threshold
    setSettingsFormData(prev => ({
      ...prev,
      maxDuration: prev.maxDuration + prev.warningThreshold
    }));
  };

  const handleMoveActivity = async (activity: Activity, direction: 'up' | 'down') => {
    try {
      const currentIndex = activities.findIndex(a => a.id === activity.id);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= activities.length) return;

      const targetActivity = activities[targetIndex];

      // Swap orders
      const currentOrder = activity.order || DEFAULT_ORDER;
      const targetOrder = targetActivity.order || DEFAULT_ORDER;

      await Promise.all([
        updateActivityOrder.mutateAsync({ activityId: activity.id!, newOrder: targetOrder }),
        updateActivityOrder.mutateAsync({ activityId: targetActivity.id!, newOrder: currentOrder })
      ]);
    } catch (error) {
      console.error('Error moving activity:', error);
    }
  };

  const handleResetDatabase = async () => {
    try {
      await clearAllData.mutateAsync();
      setShowResetConfirm(false);
      setShowResetSuccess(true);
    } catch (error) {
      console.error('Error resetting database:', error);
    }
  };

  if (activitiesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Time Tracker
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => console.log('Notification center not implemented')}
            color="primary"
          >
            {trackingSettings.notificationsEnabled ? (
              <Notifications />
            ) : (
              <NotificationsOff />
            )}
          </IconButton>
          <IconButton onClick={handleOpenSettings} color="primary">
            <Settings />
          </IconButton>
        </Box>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: isTracking ? 'primary.light' : 'background.paper',
          color: isTracking ? 'primary.contrastText' : 'text.primary',
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
          <ListItem key={activity.id} component={Card} sx={{ mb: 2 }}>
            <CardContent sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {activity.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveActivity(activity, 'up')}
                        disabled={activities.indexOf(activity) === 0}
                      >
                        <ArrowUpward />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveActivity(activity, 'down')}
                        disabled={
                          activities.indexOf(activity) ===
                          activities.length - 1
                        }
                      >
                        <ArrowDownward />
                      </IconButton>
                    </Box>
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
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {activity.description}
                    </Typography>
                  )}
                  {activity.externalSystem && (
                    <Typography variant="body2" color="text.secondary">
                      External System: {activity.externalSystem}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}
                >
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

      {/* Time Entry Detail Dialog */}
      <Dialog
        open={isDetailOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Time Entries for {selectedActivity?.name}</DialogTitle>
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
                      bgcolor: !entry.endTime ? 'action.hover' : 'inherit',
                      '&:hover': {
                        bgcolor: !entry.endTime
                          ? 'action.selected'
                          : 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {!entry.endTime && (
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
                        {new Date(entry.startTime).toLocaleString()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {entry.endTime ? (
                        new Date(entry.endTime).toLocaleString()
                      ) : (
                        <Typography
                          color="primary"
                          sx={{ fontWeight: 'medium' }}
                        >
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

      {/* Time Entry Form Dialog */}
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
                value={entryFormData.startTime}
                onChange={(newValue: Date | null) =>
                  newValue && handleEntryFormChange('startTime', newValue)
                }
              />
              <DateTimePicker
                label="End Time"
                value={entryFormData.endTime}
                onChange={(newValue: Date | null) =>
                  newValue && handleEntryFormChange('endTime', newValue)
                }
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
                onChange={(e) =>
                  handleEntryFormChange('notes', e.target.value)
                }
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Time Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this time entry? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning Snackbar */}
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
          Warning: Time tracking will stop in{' '}
          {Math.ceil((trackingSettings.maxDuration - elapsedTime) / 60)}{' '}
          minutes
        </Alert>
      </Snackbar>

      {/* Settings Dialog */}
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
              onChange={(e) =>
                setSettingsFormData((prev) => ({
                  ...prev,
                  maxDuration: Number(e.target.value) * 3600,
                }))
              }
              inputProps={{ min: 1, max: 24 }}
              fullWidth
            />
            <TextField
              label="Warning Threshold (minutes)"
              type="number"
              value={settingsFormData.warningThreshold / 60}
              onChange={(e) =>
                setSettingsFormData((prev) => ({
                  ...prev,
                  warningThreshold: Number(e.target.value) * 60,
                }))
              }
              inputProps={{ min: 5, max: 60 }}
              fullWidth
            />
            <TextField
              label="Default Goal Notification Threshold (%)"
              type="number"
              value={settingsFormData.defaultGoalNotificationThreshold}
              onChange={(e) =>
                setSettingsFormData((prev) => ({
                  ...prev,
                  defaultGoalNotificationThreshold: Number(e.target.value),
                }))
              }
              inputProps={{ min: 0, max: 100, step: 5 }}
              fullWidth
              helperText="Default percentage at which to notify when reaching a goal"
            />
            <FormControl>
              <FormLabel>First Day of Week</FormLabel>
              <RadioGroup
                value={settingsFormData.firstDayOfWeek}
                onChange={(e) =>
                  setSettingsFormData((prev) => ({
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
            <FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={settingsFormData.notificationsEnabled}
                    onChange={(e) =>
                      setSettingsFormData((prev) => ({
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
              onClick={() => setShowResetConfirm(true)}
              fullWidth
            >
              Reset Database
            </Button>
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

      {/* Reset Database Confirmation */}
      <Dialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
      >
        <DialogTitle>Reset Database</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset the database? This will delete all
            activities, time entries, and categories. This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetConfirm(false)}>Cancel</Button>
          <Button
            onClick={handleResetDatabase}
            color="error"
            variant="contained"
          >
            Reset Database
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Messages */}
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
          Database has been reset successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};
