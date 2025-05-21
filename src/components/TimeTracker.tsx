import React, { useState, useEffect, useRef } from 'react';
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
  Snackbar,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Switch
} from '@mui/material';
import { PlayArrow, Stop, History, Add, Edit, Delete, Settings, Timer, Download, Upload, BarChart } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { Activity, TrackingSettings, ImportData, TimeEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';


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


interface WeeklyStats {
  totalTime: number;
  byActivity: { [key: string]: number };
  byCategory: { [key: string]: number };
  byExternalSystem: { [key: string]: number };
  dailyBreakdown: {
    [key: string]: { // activity name
      [key: string]: number // day of week -> duration
    }
  };
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
    warningThreshold: 3600, // 1 hour warning
    firstDayOfWeek: 'monday'
  });
  const [showWarning, setShowWarning] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState<TrackingSettings>({
    maxDuration: 12 * 3600,
    warningThreshold: 3600,
    firstDayOfWeek: 'monday'
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'clear' | 'merge'>('clear');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isMonthlyView, setIsMonthlyView] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalTime: 0,
    byActivity: {},
    byCategory: {},
    byExternalSystem: {},
    dailyBreakdown: {}
  });

  useEffect(() => {
    const initDb = async () => {
      await db.init();

      // Check for in-progress time entries first
      const openEntries = await db.getOpenTimeEntries();
      const inProgressEntry = openEntries[0]; // Get the most recent open entry

      // Load activities
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

      // Set up in-progress entry if found
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
      id: editingEntry?.id || uuidv4(),
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
        name: activity.name || '',
        category: activity.category || '',
        description: activity.description || '',
        external_system: activity.external_system || ''
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
    setActivityFormData({
      name: '',
      category: '',
      description: '',
      external_system: ''
    });
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
        id: editingActivity?.id || uuidv4(),
        name: activityFormData.name,
        category: activityFormData.category,
        description: activityFormData.description,
        external_system: activityFormData.external_system,
        order: editingActivity?.order || 0,
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
        settingsFormData.warningThreshold,
        settingsFormData.firstDayOfWeek
      );
      setTrackingSettings(settingsFormData);
      setShowSettingsDialog(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleResetSettings = async () => {
    const defaultSettings = {
      maxDuration: 12 * 3600, // 12 hours in seconds
      warningThreshold: 3600, // 1 hour warning
      firstDayOfWeek: 'monday' as const
    };
    await db.updateTrackingSettings(
      defaultSettings.maxDuration,
      defaultSettings.warningThreshold,
      defaultSettings.firstDayOfWeek
    );
    setSettingsFormData(defaultSettings);
    setTrackingSettings(defaultSettings);
  };

  const handleExtendTime = () => {
    setShowWarning(false);
    // Extend the max duration by the warning threshold
    setTrackingSettings(prev => ({
      ...prev,
      maxDuration: prev.maxDuration + prev.warningThreshold
    }));
  };

  const handleExportData = async () => {
    try {
      const [activities, timeEntries, categories] = await Promise.all([
        db.getActivities(),
        db.getTimeEntries(),
        db.getCategories()
      ]);

      const exportData = {
        activities,
        timeEntries,
        categories,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const validateImportData = (data: any): data is ImportData => {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.activities) || !Array.isArray(data.timeEntries) || !Array.isArray(data.categories)) return false;
    if (typeof data.exportDate !== 'string') return false;

    // Validate activities
    for (const activity of data.activities) {
      if (!activity.name || !activity.category) return false;
    }

    // Validate time entries
    for (const entry of data.timeEntries) {
      if (!entry.activity_id || !entry.start_time) return false;
    }

    // Validate categories
    for (const category of data.categories) {
      if (!category.name) return false;
    }

    return true;
  };

  const handleImportClick = () => {
    setShowImportDialog(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the input value
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
    setImportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the input value
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      if (!validateImportData(data)) {
        setImportError('Invalid import file format');
        return;
      }

      if (importMode === 'clear') {
        await db.clearAllData();
      }

      // Get existing data for merging
      const existingCategories = await db.getCategories();
      const existingActivities = await db.getActivities();
      const existingTimeEntries = await db.getTimeEntries();

      // Import categories
      for (const category of data.categories) {
        // Skip if category already exists (when merging)
        if (importMode === 'merge' && existingCategories.some(c => c.name === category.name)) {
          continue;
        }
        await db.addCategory({
          name: category.name,
          order: category.order || 0,
          created_at: new Date(category.created_at),
          updated_at: new Date(category.updated_at)
        });
      }

      // Import activities
      for (const activity of data.activities) {
        // Skip if activity already exists (when merging)
        if (importMode === 'merge' && existingActivities.some(a =>
          a.name === activity.name && a.category === activity.category
        )) {
          continue;
        }
        await db.addActivity({
          name: activity.name,
          category: activity.category,
          description: activity.description || '',
          external_system: activity.external_system || '',
          order: activity.order || 0,
          created_at: new Date(activity.created_at),
          updated_at: new Date(activity.updated_at)
        });
      }

      // Get the newly added activities to map old IDs to new ones
      const newActivities = await db.getActivities();
      const activityIdMap = new Map();
      data.activities.forEach((oldActivity: Activity, index: number) => {
        if (newActivities[index]) {
          activityIdMap.set(oldActivity.id, newActivities[index].id);
        }
      });

      // Import time entries
      for (const entry of data.timeEntries) {
        // Skip if time entry already exists (when merging)
        if (importMode === 'merge' && existingTimeEntries.some(e =>
          e.activity_id === entry.activity_id &&
          new Date(e.start_time).getTime() === new Date(entry.start_time).getTime()
        )) {
          continue;
        }
        // Map the old activity_id to the new one
        const newActivityId = activityIdMap.get(entry.activity_id);
        if (newActivityId) {
          await db.addTimeEntry({
            activity_id: newActivityId,
            start_time: new Date(entry.start_time),
            end_time: entry.end_time ? new Date(entry.end_time) : null,
            duration: entry.duration,
            notes: entry.notes || '',
            created_at: new Date(entry.created_at),
            updated_at: new Date(entry.updated_at)
          });
        }
      }

      // Refresh the UI
      const loadedActivities = await db.getActivities();
      const activitiesWithStats = await Promise.all(
        loadedActivities.map(async (activity) => ({
          ...activity,
          totalDuration: await db.getTotalDurationByActivity(activity.id!),
        }))
      );
      setActivities(activitiesWithStats);

      const loadedCategories = await db.getCategories();
      setCategories(loadedCategories.map(cat => cat.name));

      setShowImportSuccess(true);
      setImportError(null);
      setShowImportDialog(false);
      setImportFile(null);
    } catch (error) {
      console.error('Error importing data:', error);
      setImportError('Error importing data. Please check the file format.');
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calculateStats = async () => {
    const now = new Date();
    let startDate: Date;

    if (isMonthlyView) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    } else {
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = trackingSettings.firstDayOfWeek === 'monday'
        ? (day === 0 ? -6 : 1 - day) // If Sunday, go back 6 days, otherwise go back to Monday
        : -day; // Go back to Sunday
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
    }

    const allEntries = await db.getTimeEntries();
    const filteredEntries = allEntries.filter(entry =>
      new Date(entry.start_time) >= startDate &&
      entry.end_time !== null
    );

    const stats: WeeklyStats = {
      totalTime: 0,
      byActivity: {},
      byCategory: {},
      byExternalSystem: {},
      dailyBreakdown: {}
    };

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const entry of filteredEntries) {
      if (entry.duration) {
        stats.totalTime += entry.duration;

        const activity = activities.find(a => a.id === entry.activity_id);
        if (activity) {
          // Update activity totals
          stats.byActivity[activity.name] = (stats.byActivity[activity.name] || 0) + entry.duration;
          stats.byCategory[activity.category] = (stats.byCategory[activity.category] || 0) + entry.duration;
          if (activity.external_system) {
            stats.byExternalSystem[activity.external_system] = (stats.byExternalSystem[activity.external_system] || 0) + entry.duration;
          }

          // Update daily breakdown
          const entryDate = new Date(entry.start_time);
          const dayOfWeek = daysOfWeek[entryDate.getDay()];

          if (!stats.dailyBreakdown[activity.name]) {
            stats.dailyBreakdown[activity.name] = {};
          }
          stats.dailyBreakdown[activity.name][dayOfWeek] = (stats.dailyBreakdown[activity.name][dayOfWeek] || 0) + entry.duration;
        }
      }
    }

    setWeeklyStats(stats);
  };

  const handleOpenAnalytics = async () => {
    await calculateStats();
    setShowAnalytics(true);
  };

  const handleCloseAnalytics = () => {
    setShowAnalytics(false);
  };

  const handleViewChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsMonthlyView(event.target.checked);
    await calculateStats();
  };

  const handleResetDatabase = async () => {
    try {
      // Clear all data first
      await db.clearAllData();

      // Close the database connection
      if (db) {
        await db.close();
      }

      // Reinitialize the database
      await db.init();

      // Reset all state
      setActivities([]);
      setCategories([]);
      setIsTracking(false);
      setCurrentActivity(null);
      setStartTime(null);
      setElapsedTime(0);

      // Load default settings
      const settings = await db.getTrackingSettings();
      setTrackingSettings(settings);
      setSettingsFormData(settings);

      setShowResetConfirm(false);
      setShowResetSuccess(true);
    } catch (error) {
      console.error('Error resetting database:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Time Tracker
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleOpenAnalytics} color="primary">
              <BarChart />
            </IconButton>
            <IconButton onClick={handleOpenSettings} color="primary">
              <Timer />
            </IconButton>
          </Box>
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
              <FormControl>
                <FormLabel>First Day of Week</FormLabel>
                <RadioGroup
                  value={settingsFormData.firstDayOfWeek}
                  onChange={(e) => setSettingsFormData(prev => ({
                    ...prev,
                    firstDayOfWeek: e.target.value as 'monday' | 'sunday'
                  }))}
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
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportData}
                  fullWidth
                >
                  Export Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={handleImportClick}
                  fullWidth
                >
                  Import Data
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
              </Box>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowResetConfirm(true)}
                fullWidth
              >
                Reset Database
              </Button>
              {importError && (
                <Alert severity="error" onClose={() => setImportError(null)}>
                  {importError}
                </Alert>
              )}
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

        <Dialog
          open={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
        >
          <DialogTitle>Reset Database</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to reset the database? This will delete all activities, time entries, and categories. This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResetConfirm(false)}>Cancel</Button>
            <Button onClick={handleResetDatabase} color="error" variant="contained">
              Reset Database
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
            Database has been reset successfully
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

        <Snackbar
          open={showImportSuccess}
          autoHideDuration={3000}
          onClose={() => setShowImportSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowImportSuccess(false)}
            severity="success"
            sx={{ width: '100%' }}
          >
            Data imported successfully
          </Alert>
        </Snackbar>

        <Dialog
          open={showImportDialog}
          onClose={handleCloseImportDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Import Data</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              {importFile ? (
                <>
                  <Typography>
                    Selected file: {importFile.name}
                  </Typography>
                  <FormControl>
                    <FormLabel>Import Mode</FormLabel>
                    <RadioGroup
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as 'clear' | 'merge')}
                    >
                      <FormControlLabel
                        value="clear"
                        control={<Radio />}
                        label="Clear existing data and import"
                      />
                      <FormControlLabel
                        value="merge"
                        control={<Radio />}
                        label="Merge with existing data"
                      />
                    </RadioGroup>
                  </FormControl>
                  {importMode === 'clear' && (
                    <Alert severity="warning">
                      This will delete all existing data before importing.
                    </Alert>
                  )}
                  {importMode === 'merge' && (
                    <Alert severity="info">
                      Duplicate entries will be skipped during import.
                    </Alert>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography gutterBottom>
                    Please select a JSON file to import.
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<Upload />}
                  >
                    Choose File
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </Button>
                </Box>
              )}
              {importError && (
                <Alert severity="error" onClose={() => setImportError(null)}>
                  {importError}
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseImportDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleImportConfirm}
              variant="contained"
              disabled={!importFile}
            >
              Import
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={showAnalytics}
          onClose={handleCloseAnalytics}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Analytics</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isMonthlyView}
                    onChange={handleViewChange}
                    color="primary"
                  />
                }
                label={isMonthlyView ? "Monthly View" : "Weekly View"}
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {isMonthlyView ? "This Month's Overview" : "This Week's Overview"}
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatDuration(weeklyStats.totalTime)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total time tracked {isMonthlyView ? "this month" : "this week"}
                  </Typography>
                </CardContent>
              </Card>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Time by Activity
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Activity</TableCell>
                              <TableCell align="right">Time</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(weeklyStats.byActivity)
                              .sort(([, a], [, b]) => b - a)
                              .map(([activity, duration]) => (
                                <TableRow key={activity}>
                                  <TableCell>{activity}</TableCell>
                                  <TableCell align="right">{formatDuration(duration)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Time by Category
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Category</TableCell>
                              <TableCell align="right">Time</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(weeklyStats.byCategory)
                              .sort(([, a], [, b]) => b - a)
                              .map(([category, duration]) => (
                                <TableRow key={category}>
                                  <TableCell>{category}</TableCell>
                                  <TableCell align="right">{formatDuration(duration)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Time by External System
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>External System</TableCell>
                              <TableCell align="right">Time</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(weeklyStats.byExternalSystem)
                              .sort(([, a], [, b]) => b - a)
                              .map(([system, duration]) => (
                                <TableRow key={system}>
                                  <TableCell>{system}</TableCell>
                                  <TableCell align="right">{formatDuration(duration)}</TableCell>
                                </TableRow>
                              ))}
                            {Object.keys(weeklyStats.byExternalSystem).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={2} align="center">
                                  No external systems tracked this week
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {!isMonthlyView && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Weekly Activity Breakdown
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Activity</TableCell>
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                  <TableCell key={day} align="right">{day}</TableCell>
                                ))}
                                <TableCell align="right">Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(weeklyStats.byActivity)
                                .sort(([, a], [, b]) => b - a)
                                .map(([activity, totalDuration]) => (
                                  <TableRow key={activity}>
                                    <TableCell>{activity}</TableCell>
                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                      <TableCell key={day} align="right">
                                        {weeklyStats.dailyBreakdown[activity]?.[day]
                                          ? formatDuration(weeklyStats.dailyBreakdown[activity][day])
                                          : '-'}
                                      </TableCell>
                                    ))}
                                    <TableCell align="right">{formatDuration(totalDuration)}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAnalytics}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};
