import React, { useState, useEffect } from 'react';
import { db } from '../database/db';

interface Activity {
  id?: number;
  name: string;
  category: string;
  created_at: Date;
  updated_at: Date;
}

export const TimeTracker: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const initDb = async () => {
      await db.init();
      const loadedActivities = await db.getActivities();
      setActivities(loadedActivities);
    };
    initDb();
  }, []);

  useEffect(() => {
    let interval: number;
    if (isTracking && startTime) {
      interval = window.setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const startTracking = async (activity: Activity) => {
    if (isTracking) return;

    setCurrentActivity(activity);
    setIsTracking(true);
    const now = new Date();
    setStartTime(now);

    await db.addTimeEntry({
      activity_id: activity.id!,
      start_time: now,
      end_time: null,
      duration: null,
      notes: '',
      created_at: now,
      updated_at: now,
    });
  };

  const stopTracking = async () => {
    if (!isTracking || !currentActivity || !startTime) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    // Round to nearest 15 minutes (900 seconds)
    const roundedDuration = Math.round(duration / 900) * 900;

    await db.updateTimeEntry({
      id: currentActivity.id,
      activity_id: currentActivity.id!,
      start_time: startTime,
      end_time: now,
      duration: roundedDuration,
      notes: '',
      created_at: startTime,
      updated_at: now,
    });

    setIsTracking(false);
    setCurrentActivity(null);
    setStartTime(null);
    setElapsedTime(0);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="time-tracker">
      <h2>Time Tracker</h2>

      <div className="current-tracking">
        {isTracking && currentActivity ? (
          <div>
            <h3>Currently Tracking: {currentActivity.name}</h3>
            <p>Elapsed Time: {formatTime(elapsedTime)}</p>
            <button onClick={stopTracking}>Stop Tracking</button>
          </div>
        ) : (
          <p>No activity being tracked</p>
        )}
      </div>

      <div className="activities">
        <h3>Activities</h3>
        <div className="activity-list">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <span>{activity.name}</span>
              <button
                onClick={() => startTracking(activity)}
                disabled={isTracking}
              >
                Start Tracking
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
