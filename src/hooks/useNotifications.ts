import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { NotificationItem } from '../components/NotificationDialog';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback(
    (
      type: NotificationItem['type'],
      title: string,
      message: string,
      activityId?: string,
      goalId?: string,
    ) => {
      const notification: NotificationItem = {
        id: uuidv4(),
        type,
        title,
        message,
        timestamp: new Date(),
        read: false,
        activityId,
        goalId,
      };

      setNotifications((prev) => [notification, ...prev]);
      return notification.id;
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addGoalNotification = useCallback(
    (
      goalTitle: string,
      activityName: string,
      progress: number,
      activityId?: string,
      goalId?: string,
    ) => {
      const title = `Goal Achievement: ${goalTitle}`;
      const message = `You've reached ${progress.toFixed(1)}% of your goal for "${activityName}"! Keep up the great work!`;
      return addNotification('goal', title, message, activityId, goalId);
    },
    [addNotification],
  );

  const addWarningNotification = useCallback(
    (title: string, message: string, activityId?: string) => {
      return addNotification('warning', title, message, activityId);
    },
    [addNotification],
  );

  const addInfoNotification = useCallback(
    (title: string, message: string, activityId?: string) => {
      return addNotification('info', title, message, activityId);
    },
    [addNotification],
  );

  const addErrorNotification = useCallback(
    (title: string, message: string, activityId?: string) => {
      return addNotification('error', title, message, activityId);
    },
    [addNotification],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    addGoalNotification,
    addWarningNotification,
    addInfoNotification,
    addErrorNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};
