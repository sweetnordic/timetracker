import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
  Typography,
  Divider,
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as GoalIcon
} from '@mui/icons-material';
import type { Activity, Period } from '../models';
import { useGoalsByActivity, useAddGoal, useDeleteGoal } from '../hooks';
import { useToast } from '../contexts';

interface EditActivityDialogProps {
  open: boolean;
  activity: Activity | null;
  categories: string[];
  onClose: () => void;
  onSave: (updatedActivity: Activity) => Promise<void>;
  isLoading?: boolean;
}

export const EditActivityDialog: React.FC<EditActivityDialogProps> = ({
  open,
  activity,
  categories,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    externalSystem: ''
  });

  const [newGoal, setNewGoal] = useState({
    targetHours: 8,
    period: 'weekly' as Period,
    notificationThreshold: 80
  });

  const { showSuccess, showError } = useToast();

  // Goal hooks
  const { data: goals = [] } = useGoalsByActivity(activity?.id || '');
  const addGoal = useAddGoal();
  const deleteGoal = useDeleteGoal();

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name || '',
        category: activity.category || '',
        description: activity.description || '',
        externalSystem: activity.externalSystem || ''
      });
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        externalSystem: ''
      });
    }
  }, [activity]);

  const handleSave = async () => {
    if (!activity || !formData.name.trim() || !formData.category) return;

    const updatedActivity: Activity = {
      ...activity,
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description,
      externalSystem: formData.externalSystem,
      updatedAt: new Date()
    };

    try {
      await onSave(updatedActivity);
      handleClose();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      externalSystem: ''
    });
    setNewGoal({
      targetHours: 8,
      period: 'weekly',
      notificationThreshold: 80
    });
    onClose();
  };

  const handleAddGoal = async () => {
    if (!activity?.id) return;

    try {
      await addGoal.mutateAsync({
        activityId: activity.id,
        targetHours: newGoal.targetHours,
        period: newGoal.period,
        notificationThreshold: newGoal.notificationThreshold,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setNewGoal({
        targetHours: 8,
        period: 'weekly',
        notificationThreshold: 80
      });
      showSuccess('Goal added successfully');
    } catch (error) {
      console.error('Error adding goal:', error);
      showError('Failed to add goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal.mutateAsync(goalId);
      showSuccess('Goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
      showError('Failed to delete goal');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading && formData.name.trim() && formData.category.trim()) {
      handleSave();
    }
  };

  const formatPeriod = (period: Period) => {
    switch (period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return period;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Activity</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Activity Details */}
          <TextField
            autoFocus
            label="Activity Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            error={!formData.name.trim() && formData.name.length > 0}
            helperText={!formData.name.trim() && formData.name.length > 0 ? 'Activity name is required' : ''}
          />
          <TextField
            select
            label="Category"
            fullWidth
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            disabled={isLoading}
            error={!formData.category.trim() && formData.category.length > 0}
            helperText={!formData.category.trim() && formData.category.length > 0 ? 'Category is required' : ''}
          >
            <MenuItem value="">
              <em>Select a category</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={isLoading}
            helperText="Optional description for this activity"
          />
          <TextField
            label="External System"
            fullWidth
            value={formData.externalSystem}
            onChange={(e) => setFormData(prev => ({ ...prev, externalSystem: e.target.value }))}
            disabled={isLoading}
            helperText="Optional reference to external system or project"
          />

          <Divider />

          {/* Goal Settings */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GoalIcon />
              Goal Settings
            </Typography>

            {/* Existing Goals */}
            {goals.length > 0 && (
              <Stack spacing={2} sx={{ mb: 3 }}>
                {goals.map((goal) => (
                  <Card key={goal.id} variant="outlined">
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2">
                            {goal.targetHours}h per {formatPeriod(goal.period).toLowerCase()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Notification at {goal.notificationThreshold}%
                          </Typography>
                        </Box>
                        <Tooltip title="Delete Goal">
                          <IconButton
                            onClick={() => handleDeleteGoal(goal.id!)}
                            disabled={deleteGoal.isPending}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            {/* Add Goal */}
            <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="Target Hours"
                    type="number"
                    size="small"
                    fullWidth
                    value={newGoal.targetHours}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetHours: Number(e.target.value) }))}
                    inputProps={{ min: 0.5, max: 24, step: 0.5 }}
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Period</InputLabel>
                    <Select
                      value={newGoal.period}
                      label="Period"
                      onChange={(e) => setNewGoal(prev => ({ ...prev, period: e.target.value as Period }))}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Notification %"
                    type="number"
                    size="small"
                    fullWidth
                    value={newGoal.notificationThreshold}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, notificationThreshold: Number(e.target.value) }))}
                    inputProps={{ min: 10, max: 100, step: 5 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddGoal}
                    disabled={addGoal.isPending || !activity?.id}
                    size="small"
                    sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isLoading || !formData.name.trim() || !formData.category.trim()}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
