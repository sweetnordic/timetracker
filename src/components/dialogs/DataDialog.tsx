import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Download, Upload } from '@mui/icons-material';
import type { Activity, TimeEntry, Category, Goal } from '../../models';
import { db } from '../../database/db';
import { useToast } from '../../contexts';

interface ImportData {
  activities: Activity[];
  timeEntries: TimeEntry[];
  categories: Category[];
  goals: Goal[];
  exportDate: string;
  databaseVersion?: number;
}

interface DataDialogProps {
  open: boolean;
  onClose: () => void;
}

export const DataDialog: React.FC<DataDialogProps> = ({ open, onClose }) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'clear' | 'merge'>('clear');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showSuccess, showError } = useToast();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Get data directly from database service to ensure UI format
      const exportData: ImportData = {
        activities: await db.getActivities(),
        timeEntries: await db.getTimeEntries(),
        categories: await db.getCategories(),
        goals: await db.getGoals(),
        exportDate: new Date().toISOString(),
        databaseVersion: 1,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      showError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const validateImportData = (data: unknown): data is ImportData => {
    if (!data || typeof data !== 'object') return false;
    const typedData = data as Record<string, unknown>;

    if (
      !Array.isArray(typedData.activities) ||
      !Array.isArray(typedData.timeEntries) ||
      !Array.isArray(typedData.categories) ||
      !Array.isArray(typedData.goals)
    )
      return false;

    if (typeof typedData.exportDate !== 'string') return false;

    // Validate activities
    for (const activity of typedData.activities) {
      if (!activity || typeof activity !== 'object') return false;
      const act = activity as Record<string, unknown>;
      if (!act.name || !act.category) return false;
    }

    // Validate time entries
    for (const entry of typedData.timeEntries) {
      if (!entry || typeof entry !== 'object') return false;
      const ent = entry as Record<string, unknown>;
      if (!ent.activityId || !ent.startTime) return false;
    }

    // Validate categories
    for (const category of typedData.categories) {
      if (!category || typeof category !== 'object') return false;
      const cat = category as Record<string, unknown>;
      if (!cat.name) return false;
    }

    // Validate goals
    for (const goal of typedData.goals) {
      if (!goal || typeof goal !== 'object') return false;
      const g = goal as Record<string, unknown>;
      if (!g.activityId || typeof g.targetHours !== 'number' || !g.period)
        return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportError(null);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      if (!validateImportData(data)) {
        setImportError('Invalid import file format');
        return;
      }

      if (importMode === 'clear') {
        await db.clearAllData();
      }

      // Get existing data for merging - use direct DB calls to get UI format
      const existingCategories = await db.getCategories();
      const existingActivities = await db.getActivities();
      const existingTimeEntries = await db.getTimeEntries();
      const existingGoals = await db.getGoals();

      // Import categories
      for (const category of data.categories) {
        // Skip if category already exists (when merging)
        if (
          importMode === 'merge' &&
          existingCategories.some((c) => c.name === category.name)
        ) {
          continue;
        }
        await db.addCategory({
          name: category.name,
          order: category.order || 0,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt),
        });
      }

      // Import activities
      const activityIdMap = new Map<string, string>();
      for (const activity of data.activities) {
        // Skip if activity already exists (when merging)
        if (
          importMode === 'merge' &&
          existingActivities.some(
            (a) => a.name === activity.name && a.category === activity.category,
          )
        ) {
          continue;
        }
        const newId = await db.addActivity({
          name: activity.name,
          category: activity.category,
          description: activity.description || '',
          externalSystem: activity.externalSystem || '',
          order: activity.order || 0,
          createdAt: new Date(activity.createdAt),
          updatedAt: new Date(activity.updatedAt),
        });
        activityIdMap.set(activity.id!, newId);
      }

      // Import time entries
      for (const entry of data.timeEntries) {
        // Skip if time entry already exists (when merging)
        if (
          importMode === 'merge' &&
          existingTimeEntries.some(
            (e) =>
              e.activityId === entry.activityId &&
              new Date(e.startTime).getTime() ===
                new Date(entry.startTime).getTime(),
          )
        ) {
          continue;
        }
        // Map the old activity_id to the new one
        const newActivityId = activityIdMap.get(entry.activityId);
        if (newActivityId) {
          await db.addTimeEntry({
            activityId: newActivityId,
            startTime: new Date(entry.startTime),
            endTime: entry.endTime ? new Date(entry.endTime) : null,
            duration: entry.duration,
            notes: entry.notes || '',
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
          });
        }
      }

      // Import goals
      for (const goal of data.goals) {
        // Skip if goal already exists (when merging)
        if (
          importMode === 'merge' &&
          existingGoals.some(
            (g) =>
              g.activityId === goal.activityId &&
              g.period === goal.period &&
              g.targetHours === goal.targetHours,
          )
        ) {
          continue;
        }
        // Map the old activity_id to the new one
        const newActivityId = activityIdMap.get(goal.activityId);
        if (newActivityId) {
          await db.addGoal({
            activityId: newActivityId,
            targetHours: goal.targetHours,
            period: goal.period,
            notificationThreshold: goal.notificationThreshold,
            createdAt: new Date(goal.createdAt),
            updatedAt: new Date(goal.updatedAt),
          });
        }
      }

      showSuccess('Data imported successfully');
      setImportError(null);
      handleClose();
    } catch (error) {
      console.error('Error importing data:', error);
      setImportError('Error importing data. Please check the file format.');
      showError('Failed to import data');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setImportFile(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Data Management</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Export Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Export Data
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Export all your activities, time entries, categories, and goals to
              a JSON file.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportData}
              disabled={isExporting}
              fullWidth
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </Box>

          {/* Import Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Import Data
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Import data from a previously exported JSON file.
            </Typography>

            {importFile ? (
              <>
                <Typography gutterBottom>
                  Selected file: {importFile.name}
                </Typography>
                <FormControl sx={{ mb: 2 }}>
                  <FormLabel>Import Mode</FormLabel>
                  <RadioGroup
                    value={importMode}
                    onChange={(e) =>
                      setImportMode(e.target.value as 'clear' | 'merge')
                    }
                  >
                    <FormControlLabel
                      value="clear"
                      control={<Radio />}
                      label="Clear existing data and import"
                    />
                    <FormControlLabel
                      value="merge"
                      control={<Radio />}
                      label="Merge with existing data"
                    />
                  </RadioGroup>
                </FormControl>
                {importMode === 'clear' && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    This will delete all existing data before importing.
                  </Alert>
                )}
                {importMode === 'merge' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Duplicate entries will be skipped during import.
                  </Alert>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography gutterBottom>
                  Please select a JSON file to import.
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<Upload />}
                >
                  Choose File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                </Button>
              </Box>
            )}

            {importError && (
              <Alert
                severity="error"
                onClose={() => setImportError(null)}
                sx={{ mt: 2 }}
              >
                {importError}
              </Alert>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isImporting}>
          Cancel
        </Button>
        {importFile && (
          <Button
            onClick={handleImportConfirm}
            variant="contained"
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
