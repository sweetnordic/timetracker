import { useEffect, useState } from 'react';
import { TimeTracker } from './components/TimeTracker';
import { ActivityManager } from './components/ActivityManager';
import { HelpCenter } from './components/HelpCenter';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Timer, Help as HelpIcon } from '@mui/icons-material';
import './App.css';
import { db } from './database/db';

const theme = createTheme({
  palette: {
    mode: 'light',
    /*
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#666',
          '&.Mui-selected': {
            color: '#1976d2',
          },
        },
      },
    }, **/
  },
});

function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'manager' | 'help'>( 'tracker' );

  useEffect(() => {
    const initializeDb = async () => {
      try {
        await db.init();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    initializeDb();
  }, []);

  const handleTabChange = (
    _: React.SyntheticEvent,
    newValue: 'tracker' | 'manager' | 'help'
  ) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl">
        <AppBar position="static">
          <Toolbar>
            <Timer sx={{ mr: 1 }} /> Time Tracker
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1 }}
            ></Typography>
            <Tooltip title="Help">
              <IconButton
                color="inherit"
                onClick={() => setActiveTab('help')}
                sx={{ ml: 2 }}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs centered value={activeTab} onChange={handleTabChange}>
              <Tab label="Time Tracker" value="tracker" />
              <Tab label="Activity Manager" value="manager" />
              <Tab label="Help" value="help" />
            </Tabs>
          </Box>

          <Box sx={{ mt: 2 }}>
            {activeTab === 'tracker' ? (
              <TimeTracker db={db} />
            ) : activeTab === 'manager' ? (
              <ActivityManager db={db} />
            ) : (
              <HelpCenter />
            )}
          </Box>
        </Container>
      </Container>
    </ThemeProvider>
  );
}

export default App;
