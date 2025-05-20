# Time Tracker

A personal time tracking application built with Electron and SQLite, designed for easy time tracking and activity management.

## Project Overview

Time Tracker is a desktop application that helps you track time spent on various activities. It provides a simple interface for starting/stopping time tracking, managing activities, and viewing analytics.

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

### Analytics
- Overview of total time spent per activity
- Yearly time tracking summary
- Monthly time tracking summary
- Weekly overview
- Tabular data presentation

### Data Storage
- SQLite database for persistent storage
- Automatic data saving
- Local storage only (no cloud sync)

## Future Features
- Multiple simultaneous activity tracking
- System notifications for reminders
- Data export functionality (CSV/JSON)
- Activity goals and targets
- Charts and graphs for analytics
- Custom date range selection
- Activity tags and filtering

## Technical Architecture

### Frontend
- Electron for cross-platform desktop application
- React for UI components
- Material-UI for consistent design
- TypeScript for type safety

### Backend
- SQLite for data storage
- Node.js for application logic
- TypeScript for type safety

### Project Structure
```
timetracker/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React application
│   ├── database/       # SQLite database operations
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
├── package.json        # Project dependencies
└── README.md          # Project documentation
```

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Build for production: `npm run build`

## Database Schema

### Activities
- id (PRIMARY KEY)
- name
- category
- created_at
- updated_at

### TimeEntries
- id (PRIMARY KEY)
- activity_id (FOREIGN KEY)
- start_time
- end_time
- duration
- notes
- created_at
- updated_at

### Categories
- id (PRIMARY KEY)
- name
- created_at
- updated_at

## License
MIT License
