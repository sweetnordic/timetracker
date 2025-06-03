import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { TimeTracker, ActivityManager, HelpCenter, Analytics } from './pages'
import { Layout } from './components'
import { ToastProvider } from './contexts/ToastContext'
import { db } from './database/db'
import {
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Typography
} from '@mui/material'

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
  },
})

// Create the router
const router = createHashRouter([
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
        path: '/analytics',
        element: <Analytics />,
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
      <ToastProvider maxToasts={5}>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
