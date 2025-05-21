# Time Tracker

A personal time tracking application built with React and IndexedDB, designed for easy time tracking and activity management.

## Project Overview

Time Tracker is a web application that helps you track time spent on various activities. It provides a simple interface for starting/stopping time tracking, managing activities, and viewing analytics.

## Core Features (v1.0)

### Time Tracking

- Start/stop time tracking for a single activity
- Manual time entry addition and editing
- Time tracking in hours and minutes
- Automatic rounding to nearest 15 minutes
- Configurable in-app reminders for long-running activities
- Automated tracking end:
  - Automatic stop when application is closed
  - Configurable maximum tracking duration (default: 12 hours)
  - Warning notification before auto-stopping
  - Option to extend tracking time if needed

### Activity Management

- Create and manage activity categories
- Add notes to time entries
- Edit existing time entries
- Delete time entries
- Set time goals for activities:
  - Daily, weekly, or monthly targets
  - Progress tracking and notifications
  - Visual progress indicators
  - Goal completion statistics

### Work Schedule & Off-time Management

- Configure work schedule:
  - Set different work hours for each day of the week
  - Define workweek length in days
  - Set workday start and end times
  - Visual progress tracking for workday/week
- Manage off-time periods:
  - Vacation days
  - Sick leave
  - Business trips
  - Education
  - Other time off
  - Color-coded off-time types
  - Support for recurring off-time patterns
- Features:
  - Workday progress tracking with visual progress bar
  - Workweek overview
  - Work-life balance dashboard
  - Overtime monitoring
  - Work-life balance analytics
- Integration:
  - Goals are ignored during off-time periods
  - Time tracking remains active during off-time
  - Off-time periods are excluded from analytics calculations
  - Off-time data included in exports
  - Work schedule is a separate entity from settings
  - Overlapping off-time periods are allowed
  - Time entries during off-time are included in analytics and goals

Note: This feature will be implemented incrementally, starting with basic work schedule configuration and off-time management, then expanding to include more advanced features in future updates.

### Analytics

- Overview of total time spent per activity
- Yearly time tracking summary
- Monthly time tracking summary
- Weekly overview
- Tabular data presentation
- Goal progress tracking and statistics
- Activity-specific goal analytics

### Data Persistence

- IndexedDB for persistent browser storage
- Automatic data saving
- Data export and import functionality
- Local storage only (no cloud sync)

## Future Features

- Multiple simultaneous activity tracking
- System notifications for reminders
- Activity goals and targets
- Charts and graphs for analytics
- Custom date range selection
- Activity tags and filtering

## Technical Architecture

### Frontend

- Web Application
- TypeScript for type safety
- React 18+ - Frontend framework
- TypeScript - Type-safe JavaScript
- Material-UI - UI component library and design
- IndexedDB - Browser-based database for persistent storage

### Development Tools

- TypeScript - Static type checking
- Vite - Build tool and development server
- ESLint - Code linting
- Prettier - Code formatting

### Project Structure

```sh
timetracker/
├── src/
│   ├── main/           # Main application code
│   ├── components/     # React components
│   ├── database/       # IndexedDB operations
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## Development Setup

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Build for production: `npm run build`

## Database Schema

### Categories

Categories are used to organize and group related activities. They provide a hierarchical structure for better activity management and reporting. Each category can contain multiple activities and has an order field for custom sorting.

- id (PRIMARY KEY)
- name
- order
- created_at
- updated_at

### Activities

Activities represent the main time tracking units. Each activity belongs to a category and can have multiple time entries and goals associated with it. Activities can optionally be linked to external systems for integration purposes.

- id (PRIMARY KEY)
- name
- category_id (FOREIGN KEY)
- description
- external_system
- created_at
- updated_at

### TimeEntries

Time entries record the actual time spent on activities. Each entry captures the start and end times, calculates the duration, and can include optional notes. Time entries are linked to specific activities and are used for tracking and reporting purposes.

- id (PRIMARY KEY)
- activity_id (FOREIGN KEY)
- start_time
- end_time
- duration
- notes
- created_at
- updated_at

### Goals

Goals define time targets for activities over specific periods (daily, weekly, or monthly). They include notification thresholds to alert users when they're approaching or reaching their goals. Goals are linked to specific activities and help users track their progress.

- id (PRIMARY KEY)
- activity_id (FOREIGN KEY)
- target_hours
- period (daily, weekly, monthly)
- notification_threshold
- created_at
- updated_at

### Settings

Settings store application-wide configuration values. This includes user preferences, notification settings, and other customizable options that affect the application's behavior.

- id (PRIMARY KEY)
- key
- value
- created_at
- updated_at
