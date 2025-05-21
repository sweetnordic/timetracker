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
  Button,
  Paper,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { db } from '../database/db';
import type { OffTime } from '../database/types';

type OffTimeType = 'vacation' | 'sick' | 'business_trip' | 'education' | 'other';

const OFF_TIME_TYPES: { value: OffTimeType; label: string }[] = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'business_trip', label: 'Business Trip' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

export const OffTimeManager: React.FC = () => {
  const [offTimeEntries, setOffTimeEntries] = useState<OffTime[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OffTime | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [type, setType] = useState<OffTimeType>('vacation');
  const [description, setDescription] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    loadOffTimeEntries();
  }, []);

  const loadOffTimeEntries = async () => {
    try {
      const entries = await db.getAllOffTime();
      setOffTimeEntries(entries);
    } catch (err) {
      setError('Failed to load off-time entries');
      console.error('Error loading off-time entries:', err);
    }
  };

  const handleOpenDialog = (entry?: OffTime) => {
    if (entry) {
      setEditingEntry(entry);
      setStartDate(new Date(entry.start_date));
      setEndDate(new Date(entry.end_date));
      setType(entry.type as OffTimeType);
      setDescription(entry.description || '');
      setIsRecurring(entry.is_recurring);
    } else {
      setEditingEntry(null);
      setStartDate(null);
      setEndDate(null);
      setType('vacation');
      setDescription('');
      setIsRecurring(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
    setStartDate(null);
    setEndDate(null);
    setType('vacation');
    setDescription('');
    setIsRecurring(false);
  };

  const handleSave = async () => {
    if (!startDate || !endDate || !type) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const offTimeEntry: OffTime = {
        id: editingEntry?.id,
        start_date: startDate,
        end_date: endDate,
        type,
        description,
        is_recurring: isRecurring,
        created_at: editingEntry?.created_at || new Date(),
        updated_at: new Date(),
      };

      if (editingEntry?.id) {
        await db.updateOffTime(offTimeEntry);
      } else {
        await db.addOffTime(offTimeEntry);
      }

      setSuccess(`Off-time period ${editingEntry ? 'updated' : 'added'} successfully`);
      handleCloseDialog();
      loadOffTimeEntries();
    } catch (err) {
      setError('Failed to save off-time entry');
      console.error('Error saving off-time entry:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this off-time period?')) {
      return;
    }

    try {
      await db.deleteOffTime(id);
      setSuccess('Off-time period deleted successfully');
      loadOffTimeEntries();
    } catch (err) {
      setError('Failed to delete off-time entry');
      console.error('Error deleting off-time entry:', err);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const getTypeLabel = (typeValue: string) => {
    return OFF_TIME_TYPES.find(t => t.value === typeValue)?.label || typeValue;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Off-time Management</Typography>
          <Button variant="contained" onClick={() => handleOpenDialog()}>
            Add Off-time Period
          </Button>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offTimeEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(new Date(entry.start_date))}</TableCell>
                  <TableCell>{formatDate(new Date(entry.end_date))}</TableCell>
                  <TableCell>{getTypeLabel(entry.type)}</TableCell>
                  <TableCell>{entry.description || '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(entry)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => entry.id && handleDelete(entry.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {offTimeEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No off-time periods configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingEntry ? 'Edit Off-time Period' : 'Add Off-time Period'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </LocalizationProvider>
              <TextField
                select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value as OffTimeType)}
                fullWidth
                size="small"
              >
                {OFF_TIME_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                fullWidth
                size="small"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    size="small"
                  />
                }
                label="Recurring Off-time"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
