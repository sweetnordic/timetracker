import React, { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  Tooltip,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  LinearProgress,
} from '@mui/material';
import { PlayArrow, Stop, History, Timer, Category } from '@mui/icons-material';
import {
  useActivities,
  useTimeEntries,
  useTimeEntriesByActivity,
  useOpenTimeEntries,
  useAddTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useSettings,
  useClearAllData,
  useNotifications,
  useGoals
} from '../hooks';
import {
  TimeEntryDetailDialog,
  TimeEntryFormDialog,
  DeleteConfirmationDialog,
  ExtendTimeDialog
} from '../components';
import { useToast } from '../contexts';
import type { Activity, ActivityWithStats, TimeEntry } from '../models';
import { v4 as uuidv4 } from 'uuid';

interface TimeEntryFormData {
  startTime: Date;
  endTime: Date;
  duration: number;
  notes: string;
}

export const TimeTracker: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Toast notifications
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // Notification management (for adding notifications from TimeTracker actions)
  const {
    addWarningNotification,
    addInfoNotification,
    addErrorNotification,
  } = useNotifications();

  // Use LocalStorage-based settings
  const { settings: trackingSettings } = useSettings();

  // Queries
  const { data: dbActivities = [], isLoading: activitiesLoading } = useActivities();
  const { data: dbOpenEntries = [] } = useOpenTimeEntries();
  const { data: allTimeEntries = [] } = useTimeEntries();
  const { data: allGoals = [] } = useGoals();

  // Mutations
  const addTimeEntry = useAddTimeEntry();
  const updateTimeEntry = useUpdateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();
  const clearAllData = useClearAllData();

  // Convert database models to UI models with useMemo to prevent infinite loops
  const activities: ActivityWithStats[] = useMemo(() => {
    return dbActivities.map(dbActivity => {
      // Calculate total duration for this activity
      const activityTimeEntries = allTimeEntries.filter((entry: TimeEntry) =>
        entry.activityId === dbActivity.id && entry.duration !== null
      );
      const totalDuration = activityTimeEntries.reduce((total: number, entry: TimeEntry) =>
        total + (entry.duration || 0), 0
      );

      return {
        ...dbActivity,
        totalDuration,
      };
    });
  }, [dbActivities, allTimeEntries]);

  // State management
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithStats | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [warningShown, setWarningShown] = useState(false);

  // Query for time entries when detail dialog is open
  const { data: dbActivityTimeEntries = [] } = useTimeEntriesByActivity(selectedActivity?.id || '');

  // Group activities by category for better organization
  const activitiesByCategory = useMemo(() => {
    const grouped = activities.reduce((acc, activity) => {
      if (!acc[activity.category]) {
        acc[activity.category] = [];
      }
      acc[activity.category].push(activity);
      return acc;
    }, {} as Record<string, ActivityWithStats[]>);
    return grouped;
  }, [activities]);

  // Initialize component state on load
  useEffect(() => {
    // Check for in-progress time entries
    const inProgressEntry = dbOpenEntries[0]; // Get the most recent open entry

    if (inProgressEntry) {
      const activity = activities.find(a => a.id === inProgressEntry.activityId);
      if (activity) {
        setCurrentActivity(activity);
        setIsTracking(true);
        setStartTime(new Date(inProgressEntry.startTime));
        const elapsed = Math.floor((new Date().getTime() - new Date(inProgressEntry.startTime).getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    }
  }, [dbOpenEntries, activities]);

  // Update time entries when activity changes
  useEffect(() => {
    if (selectedActivity && dbActivityTimeEntries) {
      setTimeEntries(dbActivityTimeEntries);
    }
  }, [selectedActivity, dbActivityTimeEntries]);

  useEffect(() => {
    let interval: number;
    if (isTracking && startTime) {
      interval = window.setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);

        // Check for warning threshold - show dialog only once
        const remainingTime = trackingSettings.maxDuration - elapsed;
        if (remainingTime <= trackingSettings.warningThreshold && !warningShown) {
          setShowExtendDialog(true);
          setWarningShown(true);

          const remainingMinutes = Math.ceil(remainingTime / 60);
          const title = "Time Tracking Warning";
          const message = `Time tracking will stop in ${remainingMinutes} minutes`;

          if (trackingSettings.notificationsEnabled) {
            addWarningNotification(title, message, currentActivity?.id);
          }
        }

        // Auto-stop if max duration reached
        if (elapsed >= trackingSettings.maxDuration) {
          stopTracking();
          const title = "Time Tracking Stopped";
          const message = "Maximum duration reached";

          if (trackingSettings.notificationsEnabled) {
            addWarningNotification(title, message, currentActivity?.id);
          }
          showWarning(message);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime, trackingSettings, currentActivity, warningShown, addWarningNotification, showWarning]);

  const startTracking = async (activity: Activity) => {
    if (isTracking) return;

    setCurrentActivity(activity);
    setIsTracking(true);
    setWarningShown(false);
    const now = new Date();
    setStartTime(now);

    try {
      await addTimeEntry.mutateAsync({
        activityId: activity.id!,
        startTime: now,
        endTime: null,
        duration: null,
        notes: '',
        createdAt: now,
        updatedAt: now,
      });

      const title = "Time Tracking Started";
      const message = `Started tracking: ${activity.name}`;

      if (trackingSettings.notificationsEnabled) {
        addInfoNotification(title, message, activity.id);
      }
      showInfo(message, 3000);
    } catch (error) {
      console.error('Error starting time tracking:', error);

      const title = "Time Tracking Error";
      const message = "Failed to start time tracking";

      if (trackingSettings.notificationsEnabled) {
        addErrorNotification(title, message, activity.id);
      }
      showError(message);

      setIsTracking(false);
      setCurrentActivity(null);
      setStartTime(null);
    }
  };

  const stopTracking = async () => {
    if (!isTracking || !currentActivity || !startTime) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    // Round up to nearest 15 minutes (900 seconds) - always round up, never down
    const roundedDuration = Math.ceil(duration / 900) * 900;

    try {
      // Find the most recent open entry for this activity
      const openEntry = dbOpenEntries.find(entry =>
        entry.activityId === currentActivity.id && entry.endTime === null
      );

      if (openEntry) {
        await updateTimeEntry.mutateAsync({
          id: openEntry.id,
          activityId: currentActivity.id!,
          startTime: startTime,
          endTime: now,
          duration: roundedDuration,
          notes: '',
          createdAt: startTime,
          updatedAt: now,
        });
      }

      setIsTracking(false);
      setCurrentActivity(null);
      setStartTime(null);
      setElapsedTime(0);

      const title = "Time Tracking Completed";
      const message = `Stopped tracking: ${currentActivity.name} (${formatDuration(roundedDuration)})`;

      if (trackingSettings.notificationsEnabled) {
        addInfoNotification(title, message, currentActivity.id);
      }
      showSuccess(message, 4000);
    } catch (error) {
      console.error('Error stopping time tracking:', error);

      const title = "Time Tracking Error";
      const message = "Failed to stop time tracking";

      if (trackingSettings.notificationsEnabled) {
        addErrorNotification(title, message, currentActivity?.id);
      }
      showError(message);
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

  // Calculate goal progress for an activity
  const getGoalProgress = (activity: ActivityWithStats) => {
    const activityGoals = allGoals.filter(goal => goal.activityId === activity.id);
    if (activityGoals.length === 0) return null;

    // For simplicity, let's show the first goal's progress
    const goal = activityGoals[0];
    const now = new Date();
    let startDate: Date;

    switch (goal.period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly': {
        startDate = new Date(now);
        const day = startDate.getDay();
        const diff = day === 0 ? -6 : 1 - day; // Monday as first day
        startDate.setDate(now.getDate() + diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return null;
    }

    // Filter time entries for the goal period
    const relevantEntries = allTimeEntries.filter((entry: TimeEntry) =>
      entry.activityId === activity.id &&
      entry.endTime &&
      new Date(entry.startTime) >= startDate &&
      new Date(entry.startTime) <= now
    );

    const progressSeconds = relevantEntries.reduce((total: number, entry: TimeEntry) =>
      total + (entry.duration || 0), 0
    );
    const progressHours = progressSeconds / 3600;
    const progressPercentage = Math.min((progressHours / goal.targetHours) * 100, 100);

    return {
      goal,
      progressHours,
      progressPercentage,
      period: goal.period
    };
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
    setEditingEntry(entry || null);
    setIsEntryDialogOpen(true);
  };

  const handleCloseEntryDialog = () => {
    setIsEntryDialogOpen(false);
    setEditingEntry(null);
  };

  const handleSaveEntry = async (formData: TimeEntryFormData) => {
    if (!selectedActivity) return;

    const entry: TimeEntry = {
      id: editingEntry?.id || uuidv4(),
      activityId: selectedActivity.id!,
      startTime: formData.startTime,
      endTime: formData.endTime,
      duration: formData.duration,
      notes: formData.notes,
      createdAt: editingEntry?.createdAt || new Date(),
      updatedAt: new Date()
    };

    try {
      if (editingEntry) {
        await updateTimeEntry.mutateAsync(entry);
        showSuccess('Time entry updated successfully');
      } else {
        await addTimeEntry.mutateAsync(entry);
        showSuccess('Time entry added successfully');
      }
      handleCloseEntryDialog();
    } catch (error) {
      console.error('Error saving time entry:', error);
      showError('Failed to save time entry');
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
      showSuccess('Time entry deleted successfully');
    } catch (error) {
      console.error('Error deleting time entry:', error);
      showError('Failed to delete time entry');
    }
  };

  const handleResetDatabase = async () => {
    try {
      await clearAllData.mutateAsync();
      setShowResetConfirm(false);
      showSuccess('Database has been reset successfully', 5000);
    } catch (error) {
      console.error('Error resetting database:', error);
      showError('Failed to reset database');
    }
  };

  const handleExtendTime = () => {
    setShowExtendDialog(false);
    setWarningShown(false);
    showInfo('Time tracking extended', 3000);
  };

  const handleStopFromDialog = () => {
    setShowExtendDialog(false);
    stopTracking();
  };

  const handleCloseExtendDialog = () => {
    setShowExtendDialog(false);
  };

  // Render compact activity card for desktop
  const renderActivityCard = (activity: ActivityWithStats) => {
    const goalProgress = getGoalProgress(activity);

    return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {activity.name}
          </Typography>
          <Tooltip title="View History">
            <IconButton
              size="small"
              onClick={() => handleOpenDetail(activity)}
              sx={{ ml: 1 }}
            >
              <History fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            icon={<Category />}
            label={activity.category}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
          <Chip
            icon={<Timer />}
            label={formatDuration(activity.totalDuration)}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        </Stack>

        {/* Goal Progress */}
        {goalProgress && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {goalProgress.goal.targetHours}h {goalProgress.period}ly goal
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {goalProgress.progressHours.toFixed(1)}h ({goalProgress.progressPercentage.toFixed(0)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={goalProgress.progressPercentage}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: goalProgress.progressPercentage >= 100 ? 'success.main' : 'primary.main'
                }
              }}
            />
          </Box>
        )}

        {activity.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontSize: '0.875rem'
            }}
          >
            {activity.description}
          </Typography>
        )}

        {activity.externalSystem && (
          <Typography variant="caption" color="text.secondary" display="block">
            External: {activity.externalSystem}
          </Typography>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<PlayArrow />}
          onClick={() => startTracking(activity)}
          disabled={isTracking}
          size="small"
        >
          {isTracking && currentActivity?.id === activity.id ? 'Tracking...' : 'Start Tracking'}
        </Button>
      </Box>
    </Card>
  );
  };

  // Render mobile list item
  const renderMobileActivityItem = (activity: ActivityWithStats) => (
    <ListItem component={Card} sx={{ mb: 2 }}>
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
  );

  if (activitiesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: { xs: '100%', xl: '1400px' }, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Time Tracker
        </Typography>
      </Box>

      {/* Current Tracking Status */}
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

      {/* Activities Section */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Activities
      </Typography>

      {isMobile ? (
        // Mobile: List view
        <List>
          {activities.map((activity) => (
            <Box key={activity.id}>
              {renderMobileActivityItem(activity)}
            </Box>
          ))}
        </List>
      ) : (
        // Desktop: Grid view grouped by category
        <Box>
          {Object.keys(activitiesByCategory).length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center">
              No activities found. Create some activities in the Activity Manager to get started.
            </Typography>
          ) : (
            Object.entries(activitiesByCategory).map(([category, categoryActivities]) => (
              <Box key={category} sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: 'primary.main',
                    fontWeight: 600,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    pb: 1,
                    display: 'inline-block'
                  }}
                >
                  {category}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      lg: 'repeat(3, 1fr)',
                      xl: 'repeat(4, 1fr)'
                    },
                    gap: 3
                  }}
                >
                  {categoryActivities.map((activity) => (
                    <Box key={activity.id}>
                      {renderActivityCard(activity)}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* Component Dialogs */}
      <TimeEntryDetailDialog
        open={isDetailOpen}
        activity={selectedActivity}
        timeEntries={timeEntries}
        onClose={handleCloseDetail}
        onAddEntry={() => handleOpenEntryDialog()}
        onEditEntry={handleOpenEntryDialog}
        onDeleteEntry={handleDeleteClick}
        formatDuration={formatDuration}
      />

      <TimeEntryFormDialog
        open={isEntryDialogOpen}
        editingEntry={editingEntry}
        onClose={handleCloseEntryDialog}
        onSave={handleSaveEntry}
        formatDuration={formatDuration}
        isLoading={addTimeEntry.isPending || updateTimeEntry.isPending}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteTimeEntry.isPending}
      />

      <DeleteConfirmationDialog
        open={showResetConfirm}
        title="Reset Database"
        message="Are you sure you want to reset the database? This will delete all activities, time entries, and categories. This action cannot be undone."
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetDatabase}
        confirmButtonText="Reset Database"
        isLoading={clearAllData.isPending}
      />

      <ExtendTimeDialog
        open={showExtendDialog}
        remainingMinutes={Math.ceil((trackingSettings.maxDuration - elapsedTime) / 60)}
        onExtend={handleExtendTime}
        onStop={handleStopFromDialog}
        onClose={handleCloseExtendDialog}
        activityName={currentActivity?.name}
      />
    </Box>
  );
};
