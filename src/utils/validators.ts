import type {
  ValidationResult,
  FormFieldError,
  ActivityFormData,
  TimeFormData,
  GoalFormData
} from '../types/ui';
// Types are imported through ui types
// Individual model types no longer needed since type guards were moved

// Generic validation helper
export const createValidationResult = (
  errors: FormFieldError[] = []
): ValidationResult => ({
  isValid: errors.length === 0,
  errors,
});

// Field validation functions
export const validateRequired = (
  field: string,
  value: unknown,
  fieldName: string
): FormFieldError | null => {
  if (value === null || value === undefined || value === '') {
    return {
      field,
      message: `${fieldName} is required`,
      code: 'REQUIRED_FIELD',
    };
  }
  return null;
};

export const validateMinLength = (
  field: string,
  value: string,
  minLength: number,
  fieldName: string
): FormFieldError | null => {
  if (value.length < minLength) {
    return {
      field,
      message: `${fieldName} must be at least ${minLength} characters`,
      code: 'MIN_LENGTH',
    };
  }
  return null;
};

export const validateMaxLength = (
  field: string,
  value: string,
  maxLength: number,
  fieldName: string
): FormFieldError | null => {
  if (value.length > maxLength) {
    return {
      field,
      message: `${fieldName} must be no more than ${maxLength} characters`,
      code: 'MAX_LENGTH',
    };
  }
  return null;
};

export const validatePositiveNumber = (
  field: string,
  value: number,
  fieldName: string
): FormFieldError | null => {
  if (value <= 0) {
    return {
      field,
      message: `${fieldName} must be a positive number`,
      code: 'POSITIVE_NUMBER',
    };
  }
  return null;
};

export const validateDateRange = (
  endField: string,
  startDate: Date,
  endDate: Date | null
): FormFieldError[] => {
  const errors: FormFieldError[] = [];

  if (endDate && startDate >= endDate) {
    errors.push({
      field: endField,
      message: 'End time must be after start time',
      code: 'INVALID_DATE_RANGE',
    });
  }

  return errors;
};

// Specific validation functions
export const validateActivity = (data: ActivityFormData): ValidationResult => {
  const errors: FormFieldError[] = [];

  // Required fields
  const requiredError = validateRequired('name', data.name, 'Activity name');
  if (requiredError) errors.push(requiredError);

  const categoryError = validateRequired('category', data.category, 'Category');
  if (categoryError) errors.push(categoryError);

  // Length validations
  if (data.name) {
    const minLengthError = validateMinLength('name', data.name, 1, 'Activity name');
    if (minLengthError) errors.push(minLengthError);

    const maxLengthError = validateMaxLength('name', data.name, 100, 'Activity name');
    if (maxLengthError) errors.push(maxLengthError);
  }

  if (data.description) {
    const descMaxLengthError = validateMaxLength('description', data.description, 500, 'Description');
    if (descMaxLengthError) errors.push(descMaxLengthError);
  }

  // Order validation
  if (data.order < 0) {
    errors.push({
      field: 'order',
      message: 'Order must be a non-negative number',
      code: 'INVALID_ORDER',
    });
  }

  return createValidationResult(errors);
};

export const validateTimeEntry = (data: TimeFormData): ValidationResult => {
  const errors: FormFieldError[] = [];

  // Required fields
  const startTimeError = validateRequired('startTime', data.startTime, 'Start time');
  if (startTimeError) errors.push(startTimeError);

  // Date range validation
  if (data.startTime && data.endTime) {
    const dateRangeErrors = validateDateRange(
      'endTime',
      data.startTime,
      data.endTime
    );
    errors.push(...dateRangeErrors);
  }

  // Duration validation
  if (data.duration !== null && data.duration < 0) {
    errors.push({
      field: 'duration',
      message: 'Duration must be a positive number',
      code: 'INVALID_DURATION',
    });
  }

  // Notes length validation
  if (data.notes && data.notes.length > 1000) {
    const notesError = validateMaxLength('notes', data.notes, 1000, 'Notes');
    if (notesError) errors.push(notesError);
  }

  return createValidationResult(errors);
};

export const validateGoal = (data: GoalFormData): ValidationResult => {
  const errors: FormFieldError[] = [];

  // Required fields
  const activityError = validateRequired('activityId', data.activityId, 'Activity');
  if (activityError) errors.push(activityError);

  const targetError = validateRequired('targetHours', data.targetHours, 'Target hours');
  if (targetError) errors.push(targetError);

  const periodError = validateRequired('period', data.period, 'Period');
  if (periodError) errors.push(periodError);

  // Numeric validations
  if (data.targetHours !== undefined) {
    const positiveError = validatePositiveNumber('targetHours', data.targetHours, 'Target hours');
    if (positiveError) errors.push(positiveError);

    // Reasonable upper limit
    if (data.targetHours > 1000) {
      errors.push({
        field: 'targetHours',
        message: 'Target hours cannot exceed 1000',
        code: 'EXCESSIVE_TARGET',
      });
    }
  }

  // Notification threshold validation
  if (data.notificationThreshold < 0 || data.notificationThreshold > 100) {
    errors.push({
      field: 'notificationThreshold',
      message: 'Notification threshold must be between 0 and 100',
      code: 'INVALID_THRESHOLD',
    });
  }

  return createValidationResult(errors);
};

// Note: Type guards are available in ../utils/type-guards.ts
