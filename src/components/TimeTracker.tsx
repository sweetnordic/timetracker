import React, { useState, useEffect, useRef } from 'react';
import { DatabaseService } from '../database/db';
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
  Switch,
  Grid,
  LinearProgress,
  ListItemText,
} from '@mui/material';
import { PlayArrow, Stop, History, Add, Edit, Delete, Settings, Download, Upload, BarChart, ArrowUpward, ArrowDownward, Notifications, NotificationsOff } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { Activity, TrackingSettings, ImportData, TimeEntry, GoalWithProgress, WeeklyStats, FirstDayOfWeek, Period } from '../database/types';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_ORDER, DEFAULT_NOTIFICATION_THRESHOLD, DEFAULT_FIRST_DAY_OF_WEEK, WEEKDAYS } from '../database/types';
import { WorkScheduleConfig } from './WorkScheduleConfig';
import { OffTimeManager } from './OffTimeManager';
import { WorkScheduleProgress } from './WorkScheduleProgress';

interface TimeTrackerProps {
  db: DatabaseService;
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
  goal?: {
    target_hours: number;
    period: Period;
    notification_threshold: number;
  };
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ db }) => {
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
    external_system: '',
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings>({
    maxDuration: 12 * 3600, // 12 hours in seconds
    warningThreshold: 3600, // 1 hour warning
    firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
    defaultGoalNotificationThreshold: DEFAULT_NOTIFICATION_THRESHOLD,
    notificationsEnabled: true
  });
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
    dailyBreakdown: {},
    goalStats: {
      totalGoals: 0,
      completedGoals: 0,
      inProgressGoals: 0,
      byPeriod: {
        daily: { total: 0, completed: 0 },
        weekly: { total: 0, completed: 0 },
        monthly: { total: 0, completed: 0 }
      },
      byActivity: {}
    }
  });
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [goalNotification, setGoalNotification] = useState<{
    id: string;
    activity: Activity;
    goal: GoalWithProgress;
    timestamp: Date;
    isCompletion?: boolean;
  } | null>(null);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<Array<{
    id: string;
    activity: Activity;
    goal: GoalWithProgress;
    timestamp: Date;
    isCompletion?: boolean;
  }>>([]);

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

      // Load goals
      const loadedGoals = await db.getGoals();
      const goalsWithProgress = await Promise.all(
        loadedGoals.map(async (goal) => {
          const progress = await db.getGoalProgress(goal.id!);
          return {
            ...goal,
            progress,
            progressPercentage: (progress / goal.target_hours) * 100
          };
        })
      );
      setGoals(goalsWithProgress);
    };
    initDb();
  }, [db]);

  useEffect(() => {
    let interval: number;
    if (isTracking && startTime) {
      interval = window.setInterval(async () => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);

        // Check for warning threshold
        if (trackingSettings.maxDuration - elapsed <= trackingSettings.warningThreshold) {
          setShowWarning(true);
        }

        // Check goal progress
        if (currentActivity && trackingSettings.notificationsEnabled) {
          const activityGoals = goals.filter(g => g.activity_id === currentActivity.id);
          for (const goal of activityGoals) {
            const progress = await db.getGoalProgress(goal.id!);
            const progressPercentage = (progress / goal.target_hours) * 100;

            // Check for threshold notification
            if (progressPercentage >= goal.notification_threshold &&
                progressPercentage < goal.notification_threshold + 1) {
              const notification = {
                id: uuidv4(),
                activity: currentActivity,
                goal: {
                  ...goal,
                  progress,
                  progressPercentage
                },
                timestamp: new Date()
              };
              setGoalNotification(notification);
              setNotificationHistory(prev => [notification, ...prev].slice(0, 50));
            }

            // Check for goal completion notification
            if (progressPercentage >= 100 && progressPercentage < 100.1) {
              const notification = {
                id: uuidv4(),
                activity: currentActivity,
                goal: {
                  ...goal,
                  progress,
                  progressPercentage
                },
                timestamp: new Date(),
                isCompletion: true
              };
              setGoalNotification(notification);
              setNotificationHistory(prev => [notification, ...prev].slice(0, 50));
            }
          }
        }

        // Auto-stop if max duration reached
        if (elapsed >= trackingSettings.maxDuration) {
          stopTracking();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime, trackingSettings, currentActivity, goals, db]);

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
        external_system: activity.external_system || '',
      });
    } else {
      setEditingActivity(null);
      setActivityFormData({
        name: '',
        category: '',
        description: '',
        external_system: '',
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
      external_system: '',
    });
  };

  const handleActivityFormChange = (field: keyof ActivityFormData, value: string | { target_hours?: number; period?: Period; notification_threshold?: number }) => {
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
        order: editingActivity?.order || DEFAULT_ORDER,
        created_at: editingActivity?.created_at || new Date(),
        updated_at: new Date(),
      };

      if (editingActivity?.id) {
        await db.updateActivity(activity);
      } else {
        await db.addActivity(activity);
      }

      // Handle goal
      if (activityFormData.goal) {
        const existingGoal = goals.find(g => g.activity_id === activity.id);
        if (existingGoal) {
          await db.updateGoal({
            id: existingGoal.id,
            activity_id: activity.id!,
            target_hours: activityFormData.goal.target_hours,
            period: activityFormData.goal.period,
            notification_threshold: activityFormData.goal.notification_threshold,
            created_at: existingGoal.created_at,
            updated_at: new Date()
          });
        } else {
          await db.addGoal({
            activity_id: activity.id!,
            target_hours: activityFormData.goal.target_hours,
            period: activityFormData.goal.period,
            notification_threshold: activityFormData.goal.notification_threshold,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

      // Refresh activities and goals
      const [loadedActivities, loadedGoals] = await Promise.all([
        db.getActivities(),
        db.getGoals()
      ]);

      const activitiesWithStats = await Promise.all(
        loadedActivities.map(async (activity) => ({
          ...activity,
          totalDuration: await db.getTotalDurationByActivity(activity.id!),
        }))
      );
      setActivities(activitiesWithStats);

      const goalsWithProgress = await Promise.all(
        loadedGoals.map(async (goal) => {
          const progress = await db.getGoalProgress(goal.id!);
          return {
            ...goal,
            progress,
            progressPercentage: (progress / goal.target_hours) * 100
          };
        })
      );
      setGoals(goalsWithProgress);

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
        settingsFormData.firstDayOfWeek,
        settingsFormData.defaultGoalNotificationThreshold,
        settingsFormData.notificationsEnabled
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
      firstDayOfWeek: DEFAULT_FIRST_DAY_OF_WEEK,
      defaultGoalNotificationThreshold: DEFAULT_NOTIFICATION_THRESHOLD,
      notificationsEnabled: true
    };
    await db.updateTrackingSettings(
      defaultSettings.maxDuration,
      defaultSettings.warningThreshold,
      defaultSettings.firstDayOfWeek,
      defaultSettings.defaultGoalNotificationThreshold,
      defaultSettings.notificationsEnabled
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
      const [activities, timeEntries, categories, goals] = await Promise.all([
        db.getActivities(),
        db.getTimeEntries(),
        db.getCategories(),
        db.getGoals()
      ]);

      const exportData = {
        activities,
        timeEntries,
        categories,
        goals,
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

  const validateImportData = (data: unknown): data is ImportData => {
    if (!data || typeof data !== 'object') return false;
    const typedData = data as Record<string, unknown>;
    if (!Array.isArray(typedData.activities) ||
        !Array.isArray(typedData.timeEntries) ||
        !Array.isArray(typedData.categories) ||
        !Array.isArray(typedData.goals)) return false;
    if (typeof typedData.exportDate !== 'string') return false;

    // Validate activities
    for (const activity of typedData.activities) {
      if (!activity.name || !activity.category) return false;
    }

    // Validate time entries
    for (const entry of typedData.timeEntries) {
      if (!entry.activity_id || !entry.start_time) return false;
    }

    // Validate categories
    for (const category of typedData.categories) {
      if (!category.name) return false;
    }

    // Validate goals
    for (const goal of typedData.goals) {
      if (!goal.activity_id || !goal.target_hours || !goal.period) return false;
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
      const existingGoals = await db.getGoals();

      // Import categories
      for (const category of data.categories) {
        // Skip if category already exists (when merging)
        if (importMode === 'merge' && existingCategories.some(c => c.name === category.name)) {
          continue;
        }
        await db.addCategory({
          name: category.name,
          order: category.order || DEFAULT_ORDER,
          created_at: new Date(category.created_at),
          updated_at: new Date(category.updated_at),
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
          order: activity.order || DEFAULT_ORDER,
          created_at: new Date(activity.created_at),
          updated_at: new Date(activity.updated_at),
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

      // Import goals
      for (const goal of data.goals) {
        // Skip if goal already exists (when merging)
        if (importMode === 'merge' && existingGoals.some(g =>
          g.activity_id === goal.activity_id &&
          g.period === goal.period &&
          g.target_hours === goal.target_hours
        )) {
          continue;
        }
        // Map the old activity_id to the new one
        const newActivityId = activityIdMap.get(goal.activity_id);
        if (newActivityId) {
          await db.addGoal({
            activity_id: newActivityId,
            target_hours: goal.target_hours,
            period: goal.period,
            notification_threshold: goal.notification_threshold,
            created_at: new Date(goal.created_at),
            updated_at: new Date(goal.updated_at)
          });
        }
      }

      // Refresh the UI
      const [loadedActivities, loadedGoals] = await Promise.all([
        db.getActivities(),
        db.getGoals()
      ]);

      const activitiesWithStats = await Promise.all(
        loadedActivities.map(async (activity) => ({
          ...activity,
          totalDuration: await db.getTotalDurationByActivity(activity.id!),
        }))
      );
      setActivities(activitiesWithStats);

      const goalsWithProgress = await Promise.all(
        loadedGoals.map(async (goal) => {
          const progress = await db.getGoalProgress(goal.id!);
          return {
            ...goal,
            progress,
            progressPercentage: (progress / goal.target_hours) * 100
          };
        })
      );
      setGoals(goalsWithProgress);

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
      const diff = trackingSettings.firstDayOfWeek === DEFAULT_FIRST_DAY_OF_WEEK
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
      dailyBreakdown: {},
      goalStats: {
        totalGoals: 0,
        completedGoals: 0,
        inProgressGoals: 0,
        byPeriod: {
          daily: { total: 0, completed: 0 },
          weekly: { total: 0, completed: 0 },
          monthly: { total: 0, completed: 0 }
        },
        byActivity: {}
      }
    };

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
          const dayOfWeek = WEEKDAYS[entryDate.getDay()];

          if (!stats.dailyBreakdown[activity.name]) {
            stats.dailyBreakdown[activity.name] = {};
          }
          stats.dailyBreakdown[activity.name][dayOfWeek] = (stats.dailyBreakdown[activity.name][dayOfWeek] || 0) + entry.duration;
        }
      }
    }

    // Calculate goal statistics
    const allGoals = await db.getGoals();
    stats.goalStats.totalGoals = allGoals.length;

    for (const goal of allGoals) {
      const progress = await db.getGoalProgress(goal.id!);
      const progressPercentage = (progress / goal.target_hours) * 100;
      const activity = activities.find(a => a.id === goal.activity_id);

      if (activity) {
        stats.goalStats.byActivity[goal.id!] = {
          name: activity.name,
          target: goal.target_hours,
          progress,
          percentage: progressPercentage,
          period: goal.period
        };

        // Update period stats
        stats.goalStats.byPeriod[goal.period].total++;
        if (progressPercentage >= 100) {
          stats.goalStats.byPeriod[goal.period].completed++;
          stats.goalStats.completedGoals++;
        } else if (progressPercentage > 0) {
          stats.goalStats.inProgressGoals++;
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

      await db.updateActivityOrder(activity.id!, targetOrder);
      await db.updateActivityOrder(targetActivity.id!, currentOrder);

      // Refresh activities
      const loadedActivities = await db.getActivities();
      const activitiesWithStats = await Promise.all(
        loadedActivities.map(async (activity) => ({
          ...activity,
          totalDuration: await db.getTotalDurationByActivity(activity.id!),
        }))
      );
      setActivities(activitiesWithStats);
    } catch (error) {
      console.error('Error moving activity:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ pb: 4, minWidth: '500px' }}>
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
              onClick={() => setShowNotificationCenter(true)}
              color="primary"
            >
              {trackingSettings.notificationsEnabled ? (
                <Notifications />
              ) : (
                <NotificationsOff />
              )}
            </IconButton>
            <IconButton onClick={handleOpenAnalytics} color="primary">
              <BarChart />
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
        <WorkScheduleProgress db={db} />

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
                        <IconButton
                          size="small"
                          onClick={() => handleOpenActivityDialog(activity)}
                        >
                          <Edit />
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
                    {activity.external_system && (
                      <Typography variant="body2" color="text.secondary">
                        External System: {activity.external_system}
                      </Typography>
                    )}
                    {goals.find((g) => g.activity_id === activity.id) && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Goal Progress
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={
                            goals.find((g) => g.activity_id === activity.id)
                              ?.progressPercentage || 0
                          }
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(
                              goals.find((g) => g.activity_id === activity.id)
                                ?.progress || 0
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {
                              goals.find((g) => g.activity_id === activity.id)
                                ?.target_hours
                            }
                            h
                          </Typography>
                        </Box>
                      </Box>
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
                        bgcolor: !entry.end_time ? 'action.hover' : 'inherit',
                        '&:hover': {
                          bgcolor: !entry.end_time
                            ? 'action.selected'
                            : 'action.hover',
                        },
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
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
                        {entry.end_time ? (
                          new Date(entry.end_time).toLocaleString()
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
                  onChange={(newValue: Date | null) =>
                    newValue && handleEntryFormChange('start_time', newValue)
                  }
                />
                <DateTimePicker
                  label="End Time"
                  value={entryFormData.end_time}
                  onChange={(newValue: Date | null) =>
                    newValue && handleEntryFormChange('end_time', newValue)
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
                onChange={(e) =>
                  handleActivityFormChange('name', e.target.value)
                }
                required
                fullWidth
              />
              <TextField
                select
                label="Category"
                value={activityFormData.category}
                onChange={(e) =>
                  handleActivityFormChange('category', e.target.value)
                }
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
                onChange={(e) =>
                  handleActivityFormChange('description', e.target.value)
                }
                multiline
                rows={3}
                fullWidth
              />
              <TextField
                label="External System"
                value={activityFormData.external_system}
                onChange={(e) =>
                  handleActivityFormChange('external_system', e.target.value)
                }
                fullWidth
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Time Goal
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Target Hours"
                    type="number"
                    value={activityFormData.goal?.target_hours || ''}
                    onChange={(e) =>
                      handleActivityFormChange('goal', {
                        ...activityFormData.goal,
                        target_hours: Number(e.target.value),
                      })
                    }
                    inputProps={{ min: 0, step: 0.5 }}
                    fullWidth
                  />
                  <TextField
                    select
                    label="Period"
                    value={activityFormData.goal?.period || ''}
                    onChange={(e) =>
                      handleActivityFormChange('goal', {
                        ...activityFormData.goal,
                        period: e.target.value as Period,
                      })
                    }
                    fullWidth
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </TextField>
                  <TextField
                    label="Notification Threshold (%)"
                    type="number"
                    value={
                      activityFormData.goal?.notification_threshold ||
                      trackingSettings.defaultGoalNotificationThreshold
                    }
                    onChange={(e) =>
                      handleActivityFormChange('goal', {
                        ...activityFormData.goal,
                        notification_threshold: Number(e.target.value),
                      })
                    }
                    inputProps={{ min: 0, max: 100, step: 5 }}
                    fullWidth
                    helperText="You'll be notified when you reach this percentage of your goal"
                  />
                </Stack>
              </Box>
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
            Warning: Time tracking will stop in{' '}
            {Math.ceil((trackingSettings.maxDuration - elapsedTime) / 60)}{' '}
            minutes
          </Alert>
        </Snackbar>

        <Dialog
          open={showSettingsDialog}
          onClose={handleCloseSettings}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="h6">Work Schedule</Typography>
              <WorkScheduleConfig />

              <Typography variant="h6" sx={{ mt: 4 }}>
                Off-time Management
              </Typography>
              <OffTimeManager />

              <Typography variant="h6" sx={{ mt: 4 }}>
                Tracking Settings
              </Typography>
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
                      firstDayOfWeek: e.target.value as FirstDayOfWeek,
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

        {/* Goal Notification Snackbar */}
        <Snackbar
          open={!!goalNotification}
          autoHideDuration={5000}
          onClose={() => setGoalNotification(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setGoalNotification(null)}
            severity={goalNotification?.isCompletion ? 'success' : 'info'}
            sx={{ width: '100%' }}
          >
            {goalNotification?.isCompletion
              ? `🎉 Congratulations! You've completed your ${goalNotification.goal.period} goal for ${goalNotification.activity.name}!`
              : `Goal Progress Alert! You reached ${goalNotification?.goal.progressPercentage.toFixed(
                  1
                )}% of your ${goalNotification?.goal.period} goal for ${
                  goalNotification?.activity.name
                }`}
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
                  <Typography>Selected file: {importFile.name}</Typography>
                  <FormControl>
                    <FormLabel>Import Mode</FormLabel>
                    <RadioGroup
                      value={importMode}
                      onChange={(e) =>
                        setImportMode(e.target.value as 'clear' | 'merge')
                      }
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
            <Button onClick={handleCloseImportDialog}>Cancel</Button>
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
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6">Analytics</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isMonthlyView}
                    onChange={handleViewChange}
                    color="primary"
                  />
                }
                label={isMonthlyView ? 'Monthly View' : 'Weekly View'}
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {isMonthlyView
                      ? "This Month's Overview"
                      : "This Week's Overview"}
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatDuration(weeklyStats.totalTime)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total time tracked{' '}
                    {isMonthlyView ? 'this month' : 'this week'}
                  </Typography>
                </CardContent>
              </Card>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
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
                                  <TableCell align="right">
                                    {formatDuration(duration)}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
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
                                  <TableCell align="right">
                                    {formatDuration(duration)}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
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
                                  <TableCell align="right">
                                    {formatDuration(duration)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            {Object.keys(weeklyStats.byExternalSystem)
                              .length === 0 && (
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
                  <Grid size={{ xs: 12 }}>
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
                                {WEEKDAYS.map((day) => (
                                  <TableCell key={day} align="right">
                                    {day}
                                  </TableCell>
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
                                    {WEEKDAYS.map((day) => (
                                      <TableCell key={day} align="right">
                                        {weeklyStats.dailyBreakdown[activity]?.[
                                          day
                                        ]
                                          ? formatDuration(
                                              weeklyStats.dailyBreakdown[
                                                activity
                                              ][day]
                                            )
                                          : '-'}
                                      </TableCell>
                                    ))}
                                    <TableCell align="right">
                                      {formatDuration(totalDuration)}
                                    </TableCell>
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

              {/* Goal Statistics */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Goal Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {weeklyStats.goalStats.completedGoals}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed Goals
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {weeklyStats.goalStats.inProgressGoals}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          In Progress
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {weeklyStats.goalStats.totalGoals}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Goals
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Goals by Period
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(weeklyStats.goalStats.byPeriod).map(
                        ([period, stats]) => (
                          <Grid size={{ xs: 12, md: 4 }} key={period}>
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                {period.charAt(0).toUpperCase() +
                                  period.slice(1)}{' '}
                                Goals
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  mb: 1,
                                }}
                              >
                                <Typography variant="body2">
                                  Completed: {stats.completed}
                                </Typography>
                                <Typography variant="body2">
                                  Total: {stats.total}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={(stats.completed / stats.total) * 100}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Paper>
                          </Grid>
                        )
                      )}
                    </Grid>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Goal Progress by Activity
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Activity</TableCell>
                            <TableCell>Period</TableCell>
                            <TableCell>Target</TableCell>
                            <TableCell>Progress</TableCell>
                            <TableCell align="right">Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(weeklyStats.goalStats.byActivity)
                            .sort(([, a], [, b]) => b.percentage - a.percentage)
                            .map(([id, goal]) => (
                              <TableRow key={id}>
                                <TableCell>{goal.name}</TableCell>
                                <TableCell>
                                  {goal.period.charAt(0).toUpperCase() +
                                    goal.period.slice(1)}
                                </TableCell>
                                <TableCell>{goal.target}h</TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={goal.percentage}
                                        sx={{ height: 8, borderRadius: 4 }}
                                      />
                                    </Box>
                                    <Typography variant="body2">
                                      {formatDuration(goal.progress * 3600)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  {goal.percentage.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAnalytics}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Notification Center Dialog */}
        <Dialog
          open={showNotificationCenter}
          onClose={() => setShowNotificationCenter(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6">Notification Center</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={trackingSettings.notificationsEnabled}
                    onChange={(e) => {
                      const newSettings = {
                        ...trackingSettings,
                        notificationsEnabled: e.target.checked,
                      };
                      setTrackingSettings(newSettings);
                      db.updateTrackingSettings(
                        newSettings.maxDuration,
                        newSettings.warningThreshold,
                        newSettings.firstDayOfWeek,
                        newSettings.defaultGoalNotificationThreshold,
                        newSettings.notificationsEnabled
                      );
                    }}
                  />
                }
                label="Enable Notifications"
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              {notificationHistory.length === 0 ? (
                <Typography
                  color="text.secondary"
                  align="center"
                  sx={{ py: 4 }}
                >
                  No notifications yet
                </Typography>
              ) : (
                notificationHistory.map((notification) => (
                  <Paper key={notification.id} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {notification.isCompletion
                        ? '🎉 Goal Completed!'
                        : 'Goal Progress Alert!'}
                    </Typography>
                    <Typography variant="body2">
                      {notification.isCompletion
                        ? `You've completed your ${notification.goal.period} goal for ${notification.activity.name}!`
                        : `You reached ${notification.goal.progressPercentage.toFixed(
                            1
                          )}% of your ${notification.goal.period} goal for ${
                            notification.activity.name
                          }`}
                    </Typography>
                    <Typography variant="body2">
                      {formatDuration(notification.goal.progress * 3600)} /{' '}
                      {notification.goal.target_hours}h
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.timestamp.toLocaleString()}
                    </Typography>
                  </Paper>
                ))
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNotificationCenter(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};
