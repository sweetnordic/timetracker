import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stack,
  Grid,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { db } from '../database/db';
import type { WorkSchedule } from '../database/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';

interface WorkScheduleProgressProps {
  db: typeof db;
}

interface DayProgress {
  day: Date;
  schedule: WorkSchedule;
  progress: number;
  isWorkday: boolean;
  isToday: boolean;
}

export const WorkScheduleProgress: React.FC<WorkScheduleProgressProps> = ({ db }) => {
  const [weekProgress, setWeekProgress] = useState<DayProgress[]>([]);
  const [totalWeekProgress, setTotalWeekProgress] = useState(0);
  const [totalWorkHours, setTotalWorkHours] = useState(0);
  const [completedWorkHours, setCompletedWorkHours] = useState(0);

  useEffect(() => {
    loadWeekProgress();
    const interval = setInterval(loadWeekProgress, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadWeekProgress = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const progressData: DayProgress[] = [];
      let totalHours = 0;
      let completedHours = 0;

      for (const day of days) {
        const schedule = await db.getWorkSchedule(day.getDay());
        if (!schedule) continue;

        const isWorkday = schedule.is_workday;
        if (!isWorkday) {
          progressData.push({
            day,
            schedule,
            progress: 0,
            isWorkday: false,
            isToday: isToday(day),
          });
          continue;
        }

        const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
        const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
        const workDayStart = new Date(day);
        workDayStart.setHours(startHour, startMinute, 0);
        const workDayEnd = new Date(day);
        workDayEnd.setHours(endHour, endMinute, 0);

        const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        const now = new Date();
        let progress = 0;

        if (now > workDayEnd) {
          progress = 100;
        } else if (now > workDayStart) {
          const elapsedMinutes = (now.getHours() * 60 + now.getMinutes()) - (startHour * 60 + startMinute);
          progress = Math.min(100, (elapsedMinutes / totalMinutes) * 100);
        }

        const dayHours = totalMinutes / 60;
        totalHours += dayHours;
        completedHours += (progress / 100) * dayHours;

        progressData.push({
          day,
          schedule,
          progress,
          isWorkday: true,
          isToday: isToday(day),
        });
      }

      setWeekProgress(progressData);
      setTotalWorkHours(totalHours);
      setCompletedWorkHours(completedHours);
      setTotalWeekProgress((completedHours / totalHours) * 100);
    } catch (error) {
      console.error('Error loading work schedule progress:', error);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getDayName = (date: Date) => {
    return format(date, 'EEE');
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Work Schedule Progress</Typography>
          <Tooltip title="Shows your progress through the work week based on your configured schedule">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Stack spacing={2}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Weekly Progress</Typography>
              <Typography variant="body2">
                {completedWorkHours.toFixed(1)} / {totalWorkHours.toFixed(1)} hours
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalWeekProgress}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          <Grid container spacing={1}>
            {weekProgress.map((day) => (
              <Grid size={{ xs: 12 }} key={day.day.toString()}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    bgcolor: day.isToday ? 'action.selected' : 'background.paper',
                  }}
                >
                  <Typography variant="caption" display="block">
                    {getDayName(day.day)}
                  </Typography>
                  {day.isWorkday ? (
                    <>
                      <Typography variant="caption" display="block">
                        {formatTime(day.schedule.start_time)} - {formatTime(day.schedule.end_time)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={day.progress}
                        sx={{ mt: 0.5, height: 4 }}
                      />
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Off
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};
