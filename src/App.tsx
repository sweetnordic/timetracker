import { useState } from 'react'
import { TimeTracker } from './components/TimeTracker'
import { ActivityManager } from './components/ActivityManager'
import { HelpCenter } from './components/HelpCenter'
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
  Tooltip
} from '@mui/material'
import {
  Timer,
  Help as HelpIcon
} from '@mui/icons-material';
import './App.css'

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
})

type Tabs = 'tracker' | 'manager' | 'help'

function App() {
  const [activeTab, setActiveTab] = useState<Tabs>('tracker')

  const handleTabChange = (_: React.SyntheticEvent, newValue: Tabs) => {
    setActiveTab(newValue)
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            <Timer sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Time Tracker
            </Typography>
            <Tooltip title="Help">
              <IconButton color="inherit" onClick={() => setActiveTab('help')} sx={{ ml: 2 }}>
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ minHeight: '100dvh', mt: 1 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs centered value={activeTab} onChange={handleTabChange}>
              <Tab label="Time Tracker" value="tracker" />
              <Tab label="Activity Manager" value="manager" />
              <Tab label="Help" value="help" />
            </Tabs>
          </Box>
          <Box>
            {activeTab === 'tracker' ? (
              <TimeTracker />
            ) : activeTab === 'manager' ? (
              <ActivityManager />
            ) : (
              <HelpCenter />
            )}
          </Box>
        </Container>
      </ThemeProvider>
    </>
  );
}

export default App
