import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Timer, Timeline, BarChart, Settings, Storage, Notifications } from '@mui/icons-material';

export const HelpCenter: React.FC = () => {
  return (
    <Box sx={{ mx: 'auto', py: 5 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        Time Tracker Help Center
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{xs:12, md: 6}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timer color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Time Tracking</Typography>
              </Box>
              <Typography variant="body1" component="p">
                Start tracking time for any activity with a single click. The timer will run until you stop it or close the application.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Automatic rounding to nearest 15 minutes<br />
                • Configurable maximum tracking duration<br />
                • Warning notifications for long sessions<br />
                • Manual time entry addition and editing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12, md: 6}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timeline color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Activity Management</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Organize your activities into categories and track their progress over time.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Create and manage activity categories
                <br />
                • Add detailed notes to time entries
                <br />
                • Edit or delete existing entries
                <br />
                • Set and track time goals
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12, md: 6}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BarChart color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Analytics</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                View detailed statistics and insights about your time usage.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Weekly and monthly summaries
                <br />
                • Activity-specific analytics
                <br />
                • Category-based breakdowns
                <br />
                • Goal progress tracking
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12, md: 6}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Settings</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Customize the application to match your preferences.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Configure tracking duration limits
                <br />
                • Set notification preferences
                <br />
                • Choose first day of week
                <br />
                • Adjust goal notification thresholds
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12, md: 6}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Data Management</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                All your data is stored locally in your browser using IndexedDB.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Automatic data saving
                <br />
                • Export data to JSON file
                <br />
                • Import data from backup
                <br />
                • Merge or replace existing data
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12, md: 6}}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Notifications color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Goals & Notifications</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Set time goals for your activities and receive progress notifications.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Set daily, weekly, or monthly goals
                <br />
                • Track progress with visual indicators
                <br />
                • Receive goal completion notifications
                <br />
                • View goal statistics in analytics
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mx: 'auto', mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Frequently Asked Questions
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>How do I start tracking time?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Click the "Start Tracking" button next to any activity. The timer will begin immediately and continue until you stop it or close the application.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>How do I set up goals for activities?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              When creating or editing an activity, you can set time goals by specifying:
              <br />• Target hours
              <br />• Period (daily, weekly, or monthly)
              <br />• Notification threshold percentage
              <br />
              The system will track your progress and notify you when you reach your goal threshold.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>How is my data stored?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              All data is stored locally in your browser using IndexedDB. You can export your data to a JSON file for backup or transfer to another device. The export includes all activities, time entries, categories, and goals.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>How do I view my goal progress?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              You can view goal progress in several ways:
              <br />• Progress bars on activity cards
              <br />• Detailed statistics in the Analytics view
              <br />• Goal completion notifications
              <br />• Weekly and monthly goal summaries
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Can I import data from another device?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Yes, you can import data from a JSON file exported from another device. The import process allows you to either merge with existing data or replace it entirely. All your activities, time entries, categories, and goals will be preserved.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};
