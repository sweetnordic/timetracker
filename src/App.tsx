import { useState } from 'react'
import { TimeTracker } from './components/TimeTracker'
import { ActivityManager } from './components/ActivityManager'
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
  CssBaseline
} from '@mui/material'
import './App.css'

const theme = createTheme({
  palette: {
    mode: 'light',
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
    },
  },
})

function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'manager'>('tracker')

  const handleTabChange = (_: React.SyntheticEvent, newValue: 'tracker' | 'manager') => {
    setActiveTab(newValue)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Time Tracker
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              centered
            >
              <Tab label="Time Tracker" value="tracker" />
              <Tab label="Activity Manager" value="manager" />
            </Tabs>
          </Box>

          <Box sx={{ mt: 2 }}>
            {activeTab === 'tracker' ? <TimeTracker /> : <ActivityManager />}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App
