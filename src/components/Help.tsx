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
  Grid,
  Card,
  CardContent,
  useTheme,
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
  const theme = useTheme();

  const features = [
    {
      title: 'Time Tracking',
      icon: <TimerIcon sx={{ fontSize: 40 }} />,
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
      icon: <CategoryIcon sx={{ fontSize: 40 }} />,
      items: [
        'Create and manage activity categories',
        'Add notes to time entries',
        'Edit existing time entries',
        'Delete time entries',
      ],
    },
    {
      title: 'Analytics',
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
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
      icon: <StorageIcon sx={{ fontSize: 40 }} />,
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
    <Container maxWidth="md" sx={{ pb: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
      >
        Help Center
      </Typography>

      {/* Features Section */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            textAlign: 'center',
            mb: 4,
            fontWeight: 'medium'
          }}
        >
          Features
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid size={{xs:12, md: 6}} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  }
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      color: theme.palette.primary.main
                    }}
                  >
                    {feature.icon}
                    <Typography
                      variant="h6"
                      sx={{
                        ml: 1,
                        fontWeight: 'medium'
                      }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                  <List dense>
                    {feature.items.map((item, itemIndex) => (
                      <ListItem
                        key={itemIndex}
                        sx={{
                          py: 0.5,
                          '&:before': {
                            content: '"•"',
                            color: theme.palette.primary.main,
                            fontWeight: 'bold',
                            mr: 1
                          }
                        }}
                      >
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.secondary'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* FAQ Section */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            textAlign: 'center',
            mb: 4,
            fontWeight: 'medium'
          }}
        >
          Frequently Asked Questions
        </Typography>
        {faqs.map((faq, index) => (
          <Accordion
            key={index}
            sx={{
              mb: 1,
              '&:before': {
                display: 'none',
              },
              '&.Mui-expanded': {
                margin: '0 0 8px 0',
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: theme.palette.background.default,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HelpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography>{faq.question}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{faq.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Container>
  );
};

export default Help;
