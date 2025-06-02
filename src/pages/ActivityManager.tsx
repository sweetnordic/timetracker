import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  MenuItem,
  Divider,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import {
  useActivities,
  useAddActivity,
  useUpdateActivity,
  useUpdateActivityOrder,
  useCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useUpdateCategoryOrder
} from '../hooks';
import { EditCategoryDialog, EditActivityDialog, DeleteConfirmationDialog } from '../components';
import { useToast } from '../contexts';
import type { DatabaseActivity, DatabaseCategory } from '../database/models';
import type { Activity } from '../models';
import { DEFAULT_ORDER } from '../database/models';

export const ActivityManager: React.FC = () => {
  // Toast notifications
  const { showSuccess, showError, showInfo } = useToast();

  // Queries
  const { data: activities = [], isLoading: activitiesLoading, error: activitiesError } = useActivities();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();

  // Mutations
  const addActivity = useAddActivity();
  const updateActivity = useUpdateActivity();
  const updateActivityOrder = useUpdateActivityOrder();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategoryOrder = useUpdateCategoryOrder();

  // Local state
  const [newActivityName, setNewActivityName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<DatabaseCategory | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityEditDialogOpen, setActivityEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<DatabaseCategory | null>(null);

  // Use ref to track if order fixing has been performed to prevent infinite loops
  const orderFixingPerformed = useRef(false);

  // Sort categories and activities by order
  const sortedCategories = [...categories].sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER));
  const sortedActivities = [...activities].sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER));

  // Fix activities with duplicate order values (only once)
  useEffect(() => {
    if (activities.length > 0 && !orderFixingPerformed.current && !updateActivityOrder.isPending) {
      const orderCounts = new Map<number, number>();
      activities.forEach(activity => {
        const order = activity.order || DEFAULT_ORDER;
        orderCounts.set(order, (orderCounts.get(order) || 0) + 1);
      });

      // If there are duplicate orders, fix them
      const hasDuplicates = Array.from(orderCounts.values()).some(count => count > 1);
      if (hasDuplicates) {
        console.log('Fixing duplicate activity orders...');
        orderFixingPerformed.current = true;

        const duplicateActivities = activities.filter(activity =>
          activity.order === DEFAULT_ORDER ||
          activities.filter(a => a.order === activity.order).length > 1
        );

        duplicateActivities.forEach((activity, index) => {
          updateActivityOrder.mutateAsync({
            activityId: activity.id!,
            newOrder: DEFAULT_ORDER + index
          }).catch(error => {
            console.error('Error fixing activity order:', error);
          });
        });
      }
    }
  }, [activities, updateActivityOrder, updateActivityOrder.isPending]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName || !selectedCategory) return;

    const now = new Date();
    const newActivity: Omit<DatabaseActivity, 'id'> = {
      name: newActivityName,
      category: selectedCategory,
      description: '',
      external_system: '',
      order: activities.length > 0 ? Math.max(...activities.map(a => a.order || DEFAULT_ORDER)) + 1 : DEFAULT_ORDER,
      created_at: now,
      updated_at: now,
    };

    try {
      await addActivity.mutateAsync(newActivity);
      setNewActivityName('');
      showSuccess(`Activity "${newActivityName}" added successfully`);
    } catch (error) {
      console.error('Error adding activity:', error);
      showError('Failed to add activity');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;

    const now = new Date();
    const newCategory: Omit<DatabaseCategory, 'id'> = {
      name: newCategoryName,
      order: categories.length > 0 ? Math.max(...categories.map(c => c.order || DEFAULT_ORDER)) + 1 : DEFAULT_ORDER,
      created_at: now,
      updated_at: now,
    };

    try {
      await addCategory.mutateAsync(newCategory);
      setNewCategoryName('');
      showSuccess(`Category "${newCategoryName}" added successfully`);
    } catch (error) {
      console.error('Error adding category:', error);
      showError('Failed to add category');
    }
  };

  const handleEditCategory = (category: DatabaseCategory) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    setCategoryToDelete(categoryToDelete);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory.mutateAsync(categoryToDelete.id!);
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      showSuccess(`Category "${categoryToDelete.name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Failed to delete category');
    }
  };

  const handleCancelDeleteCategory = () => {
    setDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const handleSaveCategoryEdit = async (updatedCategory: DatabaseCategory) => {
    try {
      await updateCategory.mutateAsync(updatedCategory);
      showSuccess(`Category "${updatedCategory.name}" updated successfully`);
    } catch (error) {
      console.error('Error updating category:', error);
      showError('Failed to update category');
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingCategory(null);
  };

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedCategories.findIndex(c => c.id === categoryId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const currentCategory = sortedCategories[currentIndex];
    const targetCategory = sortedCategories[targetIndex];

    try {
      // Swap orders
      await Promise.all([
        updateCategoryOrder.mutateAsync({
          categoryId: currentCategory.id!,
          newOrder: targetCategory.order || DEFAULT_ORDER
        }),
        updateCategoryOrder.mutateAsync({
          categoryId: targetCategory.id!,
          newOrder: currentCategory.order || DEFAULT_ORDER
        })
      ]);
      showInfo(`Category "${currentCategory.name}" moved ${direction}`);
    } catch (error) {
      console.error('Error updating category order:', error);
      showError(`Failed to move category ${direction}`);
    }
  };

  const handleEditActivity = (activity: DatabaseActivity) => {
    // Convert DatabaseActivity to Activity for editing
    const activityForEdit: Activity = {
      id: activity.id,
      name: activity.name,
      category: activity.category,
      description: activity.description,
      externalSystem: activity.external_system,
      order: activity.order,
      createdAt: activity.created_at,
      updatedAt: activity.updated_at,
    };
    setEditingActivity(activityForEdit);
    setActivityEditDialogOpen(true);
  };

  const handleCloseActivityEditDialog = () => {
    setActivityEditDialogOpen(false);
    setEditingActivity(null);
  };

  const handleSaveActivityEdit = async (updatedActivity: DatabaseActivity) => {
    try {
      await updateActivity.mutateAsync(updatedActivity);
      handleCloseActivityEditDialog();
      showSuccess(`Activity "${updatedActivity.name}" updated successfully`);
    } catch (error) {
      console.error('Error updating activity:', error);
      showError('Failed to update activity');
    }
  };

  const handleMoveActivity = async (activityId: string, direction: 'up' | 'down') => {
    const currentIndex = sortedActivities.findIndex(a => a.id === activityId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedActivities.length) return;

    const currentActivity = sortedActivities[currentIndex];
    const targetActivity = sortedActivities[targetIndex];

    try {
      // Swap orders
      await Promise.all([
        updateActivityOrder.mutateAsync({
          activityId: currentActivity.id!,
          newOrder: targetActivity.order || DEFAULT_ORDER
        }),
        updateActivityOrder.mutateAsync({
          activityId: targetActivity.id!,
          newOrder: currentActivity.order || DEFAULT_ORDER
        })
      ]);
      showInfo(`Activity "${currentActivity.name}" moved ${direction}`);
    } catch (error) {
      console.error('Error updating activity order:', error);
      showError(`Failed to move activity ${direction}`);
    }
  };

  if (activitiesLoading || categoriesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (activitiesError || categoriesError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Error loading data: {activitiesError?.message || categoriesError?.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Activity Manager
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
        <Paper elevation={3} sx={{ p: 3, flex: 1 }}>
          <Typography variant="h5" gutterBottom>
            Categories
          </Typography>
          <Box component="form" onSubmit={handleAddCategory} sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                variant="outlined"
                size="small"
                disabled={addCategory.isPending}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newCategoryName || addCategory.isPending}
              >
                {addCategory.isPending ? 'Adding...' : 'Add'}
              </Button>
            </Stack>
          </Box>
          <List>
            {sortedCategories.map((category, index) => (
              <ListItem
                key={category.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      edge="end"
                      aria-label="move up"
                      onClick={() => handleMoveCategory(category.id!, 'up')}
                      disabled={index === 0 || updateCategoryOrder.isPending}
                    >
                      <ArrowUpwardIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="move down"
                      onClick={() => handleMoveCategory(category.id!, 'down')}
                      disabled={index === sortedCategories.length - 1 || updateCategoryOrder.isPending}
                    >
                      <ArrowDownwardIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditCategory(category)}
                      disabled={updateCategory.isPending}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteCategory(category.id!)}
                      disabled={deleteCategory.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText primary={category.name} />
              </ListItem>
            ))}
          </List>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, flex: 1 }}>
          <Typography variant="h5" gutterBottom>
            Activities
          </Typography>
          <Box component="form" onSubmit={handleAddActivity} sx={{ mb: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="New activity name"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                variant="outlined"
                size="small"
                disabled={addActivity.isPending}
              />
              <TextField
                fullWidth
                select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                variant="outlined"
                size="small"
                disabled={addActivity.isPending}
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>
                {sortedCategories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newActivityName || !selectedCategory || addActivity.isPending}
                fullWidth
              >
                {addActivity.isPending ? 'Adding...' : 'Add Activity'}
              </Button>
            </Stack>
          </Box>
          <Divider sx={{ my: 2 }} />
          <List>
            {sortedActivities.map((activity, index) => (
              <ListItem
                key={activity.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      edge="end"
                      aria-label="move up"
                      onClick={() => handleMoveActivity(activity.id!, 'up')}
                      disabled={index === 0 || updateActivityOrder.isPending}
                    >
                      <ArrowUpwardIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="move down"
                      onClick={() => handleMoveActivity(activity.id!, 'down')}
                      disabled={index === sortedActivities.length - 1 || updateActivityOrder.isPending}
                    >
                      <ArrowDownwardIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditActivity(activity)}
                      disabled={updateActivity.isPending}
                    >
                      <EditIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={activity.name}
                  secondary={`Category: ${activity.category}${activity.description ? ` • ${activity.description}` : ''}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Stack>

      <EditCategoryDialog
        open={editDialogOpen}
        category={editingCategory}
        onClose={handleCloseEditDialog}
        onSave={handleSaveCategoryEdit}
        isLoading={updateCategory.isPending}
      />

      <EditActivityDialog
        open={activityEditDialogOpen}
        activity={editingActivity}
        categories={sortedCategories.map(c => c.name)}
        onClose={handleCloseActivityEditDialog}
        onSave={handleSaveActivityEdit}
        isLoading={updateActivity.isPending}
      />

      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This will also remove all associated activities. This action cannot be undone.`}
        onClose={handleCancelDeleteCategory}
        onConfirm={handleConfirmDeleteCategory}
        confirmButtonText="Delete Category"
        isLoading={deleteCategory.isPending}
      />
    </Box>
  );
};
