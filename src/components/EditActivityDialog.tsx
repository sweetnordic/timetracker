import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem
} from '@mui/material';
import type { Activity } from '../models';
import type { DatabaseActivity } from '../database/models';

interface EditActivityDialogProps {
  open: boolean;
  activity: Activity | null;
  categories: string[];
  onClose: () => void;
  onSave: (updatedActivity: DatabaseActivity) => Promise<void>;
  isLoading?: boolean;
}

interface ActivityFormData {
  name: string;
  category: string;
  description: string;
  externalSystem: string;
}

export const EditActivityDialog: React.FC<EditActivityDialogProps> = ({
  open,
  activity,
  categories,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    category: '',
    description: '',
    externalSystem: '',
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name || '',
        category: activity.category || '',
        description: activity.description || '',
        externalSystem: activity.externalSystem || '',
      });
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        externalSystem: '',
      });
    }
  }, [activity, open]);

  const handleSave = async () => {
    if (!activity || !formData.name.trim() || !formData.category.trim()) return;

    const updatedActivity: DatabaseActivity = {
      id: activity.id!,
      name: formData.name.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      external_system: formData.externalSystem.trim(),
      order: activity.order,
      created_at: activity.createdAt,
      updated_at: new Date()
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
      externalSystem: '',
    });
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading && formData.name.trim() && formData.category.trim()) {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Activity</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
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
