// UI Component Props Types
export interface BaseComponentProps {
  id?: string;
  className?: string;
  'data-testid'?: string;
}

// Form Types
export interface FormFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormFieldError[];
}

// Event Handler Types
export type OnSubmitHandler<T = unknown> = (data: T) => void | Promise<void>;
export type OnChangeHandler<T = unknown> = (value: T) => void;
export type OnClickHandler = (event: React.MouseEvent) => void;

// Time Tracking Specific Types
export interface TimeFormData {
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  notes: string;
}

export interface ActivityFormData {
  name: string;
  category: string;
  description: string;
  externalSystem: string;
  order: number;
}

export interface GoalFormData {
  activityId: string;
  targetHours: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notificationThreshold: number;
}

// Table/List Component Types
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  [key: string]: unknown;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

// Dialog/Modal Types
export interface DialogProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// Notification Types
export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';
export type NotificationDuration = number | null;

export interface NotificationPayload {
  message: string;
  severity?: NotificationSeverity;
  duration?: NotificationDuration;
  action?: React.ReactNode;
}

// Loading/Error States
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorCode?: string;
}

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

// Analytics Types for UI
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

// Export utility types
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
