import React from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Timer as TimerIcon,
  Category as CategoryIcon,
  Analytics as AnalyticsIcon,
  Storage as StorageIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

const Help: React.FC = () => {
  const features = [
    {
      title: 'Time Tracking',
      icon: <TimerIcon />,
      items: [
        'Start/stop time tracking for activities',
        'Manual time entry addition and editing',
        'Time tracking in hours and minutes',
        'Automatic rounding to nearest 15 minutes',
        'Configurable in-app reminders',
        'Automatic tracking end with warnings',
      ],
    },
    {
      title: 'Activity Management',
      icon: <CategoryIcon />,
      items: [
        'Create and manage activity categories',
        'Add notes to time entries',
        'Edit existing time entries',
        'Delete time entries',
      ],
    },
    {
      title: 'Analytics',
      icon: <AnalyticsIcon />,
      items: [
        'Overview of total time spent per activity',
        'Yearly time tracking summary',
        'Monthly time tracking summary',
        'Weekly overview',
        'Tabular data presentation',
      ],
    },
    {
      title: 'Data Storage',
      icon: <StorageIcon />,
      items: [
        'IndexedDB for persistent, local browser storage',
        'Automatic data saving',
        'Data export and import functionality',
        'Local storage only (no cloud sync)',
      ],
    },
  ];

  const faqs = [
    {
      question: 'How do I start tracking time for an activity?',
      answer: 'Click on the "Start Tracking" button and select an activity from the dropdown menu. The timer will begin immediately.',
    },
    {
      question: 'Can I edit time entries after they are created?',
      answer: 'Yes, you can edit any time entry by clicking on it in the time entries list. You can modify the start time, end time, and notes.',
    },
    {
      question: 'What happens if I forget to stop tracking?',
      answer: 'The application will automatically stop tracking after 12 hours (configurable) and will show a warning notification before stopping.',
    },
    {
      question: 'How do I create a new activity category?',
      answer: 'Go to the Activities section and click "Add Category". Enter the category name and save it.',
    },
    {
      question: 'Can I export and import my time tracking data?',
      answer: 'Yes, you can export your data to a JSON file and import it back into the application. This is useful for backing up your data or transferring it to another device.',
    },
    {
      question: 'Where is my data stored?',
      answer: 'Your data is stored locally in your browser using IndexedDB. This means your data persists between sessions but is only available on the device where it was created.',
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Help Center
      </Typography>

      {/* Features Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Features
        </Typography>
        {features.map((feature, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {feature.icon}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {feature.title}
              </Typography>
            </Box>
            <List>
              {feature.items.map((item, itemIndex) => (
                <ListItem key={itemIndex}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            {index < features.length - 1 && <Divider />}
          </Box>
        ))}
      </Paper>

      {/* FAQ Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Frequently Asked Questions
        </Typography>
        {faqs.map((faq, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HelpIcon sx={{ mr: 1 }} />
                <Typography>{faq.question}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Container>
  );
};

export default Help;
