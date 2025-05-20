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
  ListItemText,
  ListItemSecondaryAction,
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
  Container
} from '@mui/material';
import { PlayArrow, Stop, History } from '@mui/icons-material';

interface Activity {
  id?: number;
  name: string;
  category: string;
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

export const TimeTracker: React.FC = () => {
  const [activities, setActivities] = useState<ActivityWithStats[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithStats | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

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

    await db.updateTimeEntry({
      id: currentActivity.id,
      activity_id: currentActivity.id!,
      start_time: startTime,
      end_time: now,
      duration: roundedDuration,
      notes: '',
      created_at: startTime,
      updated_at: now,
    });

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

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Time Tracker
        </Typography>

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
              <CardContent sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <ListItemText
                  primary={activity.name}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Category: {activity.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Time: {formatDuration(activity.totalDuration)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="View History">
                    <IconButton
                      edge="end"
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
                </ListItemSecondaryAction>
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
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.start_time).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {entry.end_time ? new Date(entry.end_time).toLocaleString() : 'In Progress'}
                      </TableCell>
                      <TableCell>
                        {entry.duration ? formatDuration(entry.duration) : '-'}
                      </TableCell>
                      <TableCell>{entry.notes || '-'}</TableCell>
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
      </Box>
    </Container>
  );
};
