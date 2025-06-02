import React, { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { TimeTracker, ActivityManager, HelpCenter } from './pages'
import { db } from './database/db'
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
  CircularProgress
} from '@mui/material'
import {
  Timer,
  Help as HelpIcon
} from '@mui/icons-material';
import './App.css'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

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

// Layout component that wraps all routes
function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  const getCurrentTab = () => {
    switch (location.pathname) {
      case '/':
      case '/tracker':
        return 'tracker'
      case '/manager':
        return 'manager'
      case '/help':
        return 'help'
      default:
        return 'tracker'
    }
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    switch (newValue) {
      case 'tracker':
        navigate('/')
        break
      case 'manager':
        navigate('/manager')
        break
      case 'help':
        navigate('/help')
        break
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Timer sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            Time Tracker
          </Typography>

          <Tabs
            value={getCurrentTab()}
            onChange={handleTabChange}
            sx={{
              flexGrow: 1,
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'white',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: 'white',
              },
            }}
          >
            <Tab label="Time Tracker" value="tracker" />
            <Tab label="Activity Manager" value="manager" />
            <Tab label="Help" value="help" />
          </Tabs>

          <Tooltip title="Help">
            <IconButton color="inherit" onClick={() => navigate('/help')} sx={{ ml: 2 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ minHeight: '100dvh', mt: 2 }}>
        <Box>
          <Outlet />
        </Box>
      </Container>
    </ThemeProvider>
  )
}

// Create the router
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <TimeTracker />,
      },
      {
        path: '/tracker',
        element: <TimeTracker />,
      },
      {
        path: '/manager',
        element: <ActivityManager />,
      },
      {
        path: '/help',
        element: <HelpCenter />,
      },
    ],
  },
])

function App() {
  const [isDbInitialized, setIsDbInitialized] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await db.init()
        setIsDbInitialized(true)
        console.log('Database initialized successfully')
      } catch (error) {
        console.error('Failed to initialize database:', error)
        setDbError('Failed to initialize database. Please refresh the page.')
      }
    }

    initializeDatabase()
  }, [])

  // Show loading screen while database is initializing
  if (!isDbInitialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Initializing Time Tracker...
          </Typography>
          {dbError && (
            <Typography variant="body2" color="error" sx={{ mt: 2, textAlign: 'center' }}>
              {dbError}
            </Typography>
          )}
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
