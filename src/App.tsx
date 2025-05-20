import { useState } from 'react'
import { TimeTracker } from './components/TimeTracker'
import { ActivityManager } from './components/ActivityManager'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'manager'>('tracker')

  return (
    <div className="app">
      <header>
        <h1>Time Tracker</h1>
        <nav>
          <button
            className={activeTab === 'tracker' ? 'active' : ''}
            onClick={() => setActiveTab('tracker')}
          >
            Time Tracker
          </button>
          <button
            className={activeTab === 'manager' ? 'active' : ''}
            onClick={() => setActiveTab('manager')}
          >
            Activity Manager
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'tracker' ? <TimeTracker /> : <ActivityManager />}
      </main>
    </div>
  )
}

export default App
