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
  FormControlLabel,
  Switch,
  Stack,
  Grid,
  Paper,
  LinearProgress,
} from '@mui/material';
import { useActivities, useTimeEntries, useGoals } from '../hooks';
import type { WeeklyStats } from '../models';

export const Analytics: React.FC = () => {
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
        monthly: { total: 0, completed: 0 },
        yearly: { total: 0, completed: 0 }
      },
      byActivity: {}
    }
  });

  const { data: activities = [] } = useActivities();
  const { data: timeEntries = [] } = useTimeEntries();
  const { data: goals = [] } = useGoals();

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateStats = async () => {
    const now = new Date();
    let startDate: Date;

    if (isMonthlyView) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    } else {
      // Calculate start of week (assuming Monday as first day)
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days, otherwise go back to Monday
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
    }

    const filteredEntries = timeEntries.filter(entry =>
      new Date(entry.startTime) >= startDate &&
      entry.endTime !== null
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
          monthly: { total: 0, completed: 0 },
          yearly: { total: 0, completed: 0 }
        },
        byActivity: {}
      }
    };

    for (const entry of filteredEntries) {
      if (entry.duration) {
        stats.totalTime += entry.duration;

        const activity = activities.find(a => a.id === entry.activityId);
        if (activity) {
          // Update activity totals
          stats.byActivity[activity.name] = (stats.byActivity[activity.name] || 0) + entry.duration;
          stats.byCategory[activity.category] = (stats.byCategory[activity.category] || 0) + entry.duration;
          if (activity.externalSystem) {
            stats.byExternalSystem[activity.externalSystem] = (stats.byExternalSystem[activity.externalSystem] || 0) + entry.duration;
          }

          // Update daily breakdown
          const entryDate = new Date(entry.startTime);
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayOfWeek = dayNames[entryDate.getDay()];

          if (!stats.dailyBreakdown[activity.name]) {
            stats.dailyBreakdown[activity.name] = {};
          }
          stats.dailyBreakdown[activity.name][dayOfWeek] = (stats.dailyBreakdown[activity.name][dayOfWeek] || 0) + entry.duration;
        }
      }
    }

    // Calculate goal statistics
    stats.goalStats.totalGoals = goals.length;

    for (const goal of goals) {
      // Calculate progress for this goal
      const goalEntries = filteredEntries.filter(entry => entry.activityId === goal.activityId);
      const progress = goalEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 3600; // Convert to hours
      const progressPercentage = (progress / goal.targetHours) * 100;
      const activity = activities.find(a => a.id === goal.activityId);

      if (activity) {
        stats.goalStats.byActivity[goal.id!] = {
          name: activity.name,
          target: goal.targetHours,
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

  useEffect(() => {
    calculateStats();
  }, [activities, timeEntries, goals, isMonthlyView]);

  const handleViewChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsMonthlyView(event.target.checked);
  };

  return (
    <Box sx={{ mx: 'auto', py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Analytics
        </Typography>
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

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {isMonthlyView ? "This Month's Overview" : "This Week's Overview"}
            </Typography>
            <Typography variant="h4" color="primary">
              {formatDuration(weeklyStats.totalTime)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total time tracked {isMonthlyView ? 'this month' : 'this week'}
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          <Grid size={{xs:12, md:6}}>
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

          <Grid size={{xs:12, md:6}}>
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

          <Grid size={{xs:12}}>
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
                      {Object.keys(weeklyStats.byExternalSystem).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            No external systems tracked this {isMonthlyView ? 'month' : 'week'}
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
            <Grid size={{xs:12}}>
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
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
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
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                                <TableCell key={day} align="right">
                                  {weeklyStats.dailyBreakdown[activity]?.[day]
                                    ? formatDuration(weeklyStats.dailyBreakdown[activity][day])
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
              <Grid size={{xs:12, md:4}}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {weeklyStats.goalStats.completedGoals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Goals
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{xs:12, md:4}}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {weeklyStats.goalStats.inProgressGoals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{xs:12, md:4}}>
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
                {Object.entries(weeklyStats.goalStats.byPeriod).map(([period, stats]) => (
                  <Grid size={{xs:12, md:4}} key={period}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {period.charAt(0).toUpperCase() + period.slice(1)} Goals
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Completed: {stats.completed}
                        </Typography>
                        <Typography variant="body2">
                          Total: {stats.total}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Paper>
                  </Grid>
                ))}
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
                            {goal.period.charAt(0).toUpperCase() + goal.period.slice(1)}
                          </TableCell>
                          <TableCell>{goal.target}h</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(goal.percentage, 100)}
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
    </Box>
  );
};
