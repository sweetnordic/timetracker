import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import { Portal, Box } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { Toast } from '../components/Toast';
import type { ToastData } from '../components/Toast';
import type { AlertColor } from '@mui/material';

// Move types to separate file to fix react-refresh warning
export interface ToastContextType {
  showToast: (
    message: string,
    severity?: AlertColor,
    duration?: number,
    action?: ReactNode,
  ) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      severity: AlertColor = 'info',
      duration?: number,
      action?: ReactNode,
    ) => {
      const id = uuidv4();
      const newToast: ToastData = {
        id,
        message,
        severity,
        duration,
        action,
      };

      setToasts((prev) => {
        const updatedToasts = [newToast, ...prev];
        // Limit the number of toasts displayed
        return updatedToasts.slice(0, maxToasts);
      });
    },
    [maxToasts],
  );

  // Auto-dismiss toasts
  useEffect(() => {
    const timers: { [key: string]: NodeJS.Timeout } = {};

    toasts.forEach((toast) => {
      if (toast.duration !== 0 && !timers[toast.id]) {
        timers[toast.id] = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration || 5000);
      }
    });

    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast],
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast],
  );

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Portal>
        <Box
          sx={{
            position: 'fixed',
            top: 80, // Account for AppBar height
            right: 16,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 2, // Better spacing between toasts
            pointerEvents: 'none',
            maxWidth: 400,
          }}
        >
          {toasts.map((toast) => (
            <Box
              key={toast.id}
              sx={{
                pointerEvents: 'auto',
                animation: 'slideIn 0.3s ease-out',
                '@keyframes slideIn': {
                  from: {
                    transform: 'translateX(100%)',
                    opacity: 0,
                  },
                  to: {
                    transform: 'translateX(0)',
                    opacity: 1,
                  },
                },
              }}
            >
              <Toast toast={toast} onClose={removeToast} />
            </Box>
          ))}
        </Box>
      </Portal>
    </ToastContext.Provider>
  );
};
