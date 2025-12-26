import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import type { TimeEntry, ActivityWithStats } from '../models';

interface TimeEntryDetailDialogProps {
  open: boolean;
  activity: ActivityWithStats | null;
  timeEntries: TimeEntry[];
  onClose: () => void;
  onAddEntry: () => void;
  onEditEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (entry: TimeEntry) => void;
  formatDuration: (seconds: number) => string;
}

export const TimeEntryDetailDialog: React.FC<TimeEntryDetailDialogProps> = ({
  open,
  activity,
  timeEntries,
  onClose,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  formatDuration,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Time Entries for {activity?.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" startIcon={<Add />} onClick={onAddEntry}>
            Add Entry
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timeEntries.map((entry) => (
                <TableRow
                  key={entry.id}
                  sx={{
                    bgcolor: !entry.endTime ? 'action.hover' : 'inherit',
                    '&:hover': {
                      bgcolor: !entry.endTime
                        ? 'action.selected'
                        : 'action.hover',
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!entry.endTime && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': {
                              '0%': {
                                opacity: 1,
                              },
                              '50%': {
                                opacity: 0.4,
                              },
                              '100%': {
                                opacity: 1,
                              },
                            },
                          }}
                        />
                      )}
                      {new Date(entry.startTime).toLocaleString()}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {entry.endTime ? (
                      new Date(entry.endTime).toLocaleString()
                    ) : (
                      <Typography color="primary" sx={{ fontWeight: 'medium' }}>
                        In Progress
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.duration ? formatDuration(entry.duration) : '-'}
                  </TableCell>
                  <TableCell>{entry.notes || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => onEditEntry(entry)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDeleteEntry(entry)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
