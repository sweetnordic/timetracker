import React from 'react';
import { Alert, IconButton } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { Close } from '@mui/icons-material';

export interface ToastData {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
  action?: React.ReactNode;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const handleClose = () => {
    onClose(toast.id);
  };

  return (
    <Alert
      onClose={handleClose}
      severity={toast.severity}
      variant="filled"
      sx={{
        width: '100%',
        minWidth: 300,
        boxShadow: 3,
        borderRadius: 1,
      }}
      action={
        toast.action || (
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <Close fontSize="small" />
          </IconButton>
        )
      }
    >
      {toast.message}
    </Alert>
  );
};
