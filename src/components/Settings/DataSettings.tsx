import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Stack,
  Typography,
  Alert,
  Box
} from '@mui/material';
import { DeleteForever, Download, Upload } from '@mui/icons-material';
import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog';
import { DataDialog } from '../DataDialog';

interface DataSettingsProps {
  onResetDatabase: () => Promise<void>;
  isLoading?: boolean;
}

export const DataSettings: React.FC<DataSettingsProps> = ({
  onResetDatabase,
  isLoading = false
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDataDialog, setShowDataDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      await onResetDatabase();
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Error resetting database:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader title="Data Management" />
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Export Data
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Export all your activities, time entries, categories, and goals to a JSON file.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => setShowDataDialog(true)}
                disabled={isLoading}
                fullWidth
              >
                Export Data
              </Button>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Import Data
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Import data from a previously exported JSON file.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setShowDataDialog(true)}
                disabled={isLoading}
                fullWidth
              >
                Import Data
              </Button>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom color="error">
                Danger Zone
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will permanently delete all your data. This action cannot be undone.
              </Alert>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForever />}
                onClick={() => setShowResetConfirm(true)}
                disabled={isLoading || isResetting}
                fullWidth
              >
                Reset Database
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={showResetConfirm}
        title="Reset Database"
        message="Are you sure you want to reset the database? This will delete all activities, time entries, categories, and goals. This action cannot be undone."
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetDatabase}
        confirmButtonText="Reset Database"
        isLoading={isResetting}
      />

      <DataDialog
        open={showDataDialog}
        onClose={() => setShowDataDialog(false)}
      />
    </>
  );
};
