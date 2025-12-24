import { useAutoStopTracking } from '../hooks/useAutoStopTracking';

/**
 * Component that handles automatic stopping of time tracking when the app closes.
 * This should be rendered at the root level of the app.
 */
export const AutoStopTracking: React.FC = () => {
  useAutoStopTracking();
  return null;
};
