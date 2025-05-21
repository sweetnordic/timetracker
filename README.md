# Time Tracker

A personal time tracking application built with React and IndexedDB, designed for easy time tracking and activity management.

## Project Overview

Time Tracker is a web application that helps you track time spent on various activities. It provides a simple interface for starting/stopping time tracking, managing activities, and viewing analytics.

## Tech Stack

### Core Technologies

- React 18+ - Frontend framework
- TypeScript - Type-safe JavaScript
- Vite - Build tool and development server
- Material-UI (MUI) - UI component library
- IndexedDB - Browser-based database

### Development Tools

- ESLint - Code linting
- Prettier - Code formatting
- TypeScript - Static type checking

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
- React for UI components
- Material-UI for consistent design
- TypeScript for type safety

### Data Storage

- IndexedDB for persistent storage
- TypeScript for type safety

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
- description
- external_system
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
