import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';
import type { Category } from '../models';

interface EditCategoryDialogProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (updatedCategory: Category) => Promise<void>;
  isLoading?: boolean;
}

export const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
  open,
  category,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
    } else {
      setCategoryName('');
    }
  }, [category]);

  const handleSave = async () => {
    if (!category || !categoryName.trim()) return;

    const updatedCategory: Category = {
      ...category,
      name: categoryName.trim(),
      updatedAt: new Date()
    };

    try {
      await onSave(updatedCategory);
      handleClose();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleClose = () => {
    setCategoryName('');
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading && categoryName.trim()) {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Category</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Category Name"
          fullWidth
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          error={!categoryName.trim() && categoryName.length > 0}
          helperText={!categoryName.trim() && categoryName.length > 0 ? 'Category name is required' : ''}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isLoading || !categoryName.trim()}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
