import React, { useState } from 'react';
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
  useCategories,
  useAddCategory,
  useUpdateCategory,
  useDeleteCategory,
  useUpdateCategoryOrder
} from '../hooks';
import { EditCategoryDialog } from '../components';
import { useToast } from '../contexts';
import type { DatabaseActivity, DatabaseCategory } from '../database/models';
import { DEFAULT_ORDER } from '../database/models';

export const ActivityManager: React.FC = () => {
  // Toast notifications
  const { showSuccess, showError, showInfo } = useToast();

  // Queries
  const { data: activities = [], isLoading: activitiesLoading, error: activitiesError } = useActivities();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();

  // Mutations
  const addActivity = useAddActivity();
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

  // Sort categories by order
  const sortedCategories = [...categories].sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER));

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName || !selectedCategory) return;

    const now = new Date();
    const newActivity: Omit<DatabaseActivity, 'id'> = {
      name: newActivityName,
      category: selectedCategory,
      description: '',
      external_system: '',
      order: DEFAULT_ORDER,
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

    if (window.confirm('Are you sure you want to delete this category? This will also remove all associated activities.')) {
      try {
        await deleteCategory.mutateAsync(categoryId);
        showSuccess(`Category "${categoryToDelete.name}" deleted successfully`);
      } catch (error) {
        console.error('Error deleting category:', error);
        showError('Failed to delete category');
      }
    }
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
            {activities.map((activity) => (
              <ListItem key={activity.id}>
                <ListItemText
                  primary={activity.name}
                  secondary={`Category: ${activity.category}`}
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
    </Box>
  );
};
