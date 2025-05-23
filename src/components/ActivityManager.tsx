import React, { useState, useEffect } from 'react';
import { db } from '../database/db';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import type { Activity, Category } from '../database/models';
import { DEFAULT_ORDER } from '../database/models';

export const ActivityManager: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newActivityName, setNewActivityName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedCategoryName, setEditedCategoryName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const loadedActivities = await db.getActivities();
      const loadedCategories = await db.getCategories();
      setActivities(loadedActivities);
      setCategories(loadedCategories.sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER)));
    };
    loadData();
  }, []);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName || !selectedCategory) return;

    const now = new Date();
    const newActivity: Omit<Activity, 'id'> = {
      name: newActivityName,
      category: selectedCategory,
      description: '',
      external_system: '',
      order: DEFAULT_ORDER,
      created_at: now,
      updated_at: now,
    };

    await db.addActivity(newActivity);
    const updatedActivities = await db.getActivities();
    setActivities(updatedActivities);
    setNewActivityName('');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;

    const now = new Date();
    const newCategory: Omit<Category, 'id'> = {
      name: newCategoryName,
      order: categories.length > 0 ? Math.max(...categories.map(c => c.order || DEFAULT_ORDER)) + 1 : DEFAULT_ORDER,
      created_at: now,
      updated_at: now,
    };

    await db.addCategory(newCategory);
    const updatedCategories = await db.getCategories();
    setCategories(updatedCategories.sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER)));
    setNewCategoryName('');
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditedCategoryName(category.name);
    setEditDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will also remove all associated activities.')) {
      await db.deleteCategory(categoryId);
      const updatedCategories = await db.getCategories();
      setCategories(updatedCategories.sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER)));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editedCategoryName) return;

    const updatedCategory = {
      ...editingCategory,
      name: editedCategoryName,
      updated_at: new Date()
    };

    await db.updateCategory(updatedCategory);
    const updatedCategories = await db.getCategories();
    setCategories(updatedCategories.sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER)));
    setEditDialogOpen(false);
    setEditingCategory(null);
    setEditedCategoryName('');
  };

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCategory = categories[currentIndex];
    const targetCategory = categories[targetIndex];

    // Swap orders
    await Promise.all([
      db.updateCategoryOrder(currentCategory.id!, targetCategory.order || DEFAULT_ORDER),
      db.updateCategoryOrder(targetCategory.id!, currentCategory.order || DEFAULT_ORDER)
    ]);

    const updatedCategories = await db.getCategories();
    setCategories(updatedCategories.sort((a, b) => (a.order || DEFAULT_ORDER) - (b.order || DEFAULT_ORDER)));
  };

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
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newCategoryName}
              >
                Add
              </Button>
            </Stack>
          </Box>
          <List>
            {categories.map((category, index) => (
              <ListItem
                key={category.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      edge="end"
                      aria-label="move up"
                      onClick={() => handleMoveCategory(category.id!, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUpwardIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="move down"
                      onClick={() => handleMoveCategory(category.id!, 'down')}
                      disabled={index === categories.length - 1}
                    >
                      <ArrowDownwardIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditCategory(category)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteCategory(category.id!)}
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
              />
              <TextField
                fullWidth
                select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newActivityName || !selectedCategory}
                fullWidth
              >
                Add Activity
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

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={editedCategoryName}
            onChange={(e) => setEditedCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
