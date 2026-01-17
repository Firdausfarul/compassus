import { useTheme } from '../hooks/useTheme'

const CompassIcon = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8">
    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-[var(--primary)]" />
    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" className="text-[var(--primary)]" />
    <polygon points="50,15 56,45 50,50 44,45" fill="#ef4444" />
    <polygon points="50,85 56,55 50,50 44,55" fill="currentColor" className="text-[var(--text)]" />
    <polygon points="15,50 45,44 50,50 45,56" fill="currentColor" className="text-[var(--text-muted)]" />
    <polygon points="85,50 55,44 50,50 55,56" fill="currentColor" className="text-[var(--text-muted)]" />
    <circle cx="50" cy="50" r="6" fill="currentColor" className="text-[var(--primary)]" />
    <circle cx="50" cy="50" r="3" fill="currentColor" className="text-[var(--card)]" />
  </svg>
)

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

export function Layout({ children, activeTab, onTabChange }) {
  const { isDark, toggle } = useTheme()

  const tabs = [
    { id: 'call', label: 'Arbitrary Call', icon: '⚡' },
    { id: 'storage', label: 'Storage Inspect', icon: '🔍' },
    { id: 'trace', label: 'Trace Tx', icon: '🌳' }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="card border-t-0 border-x-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CompassIcon />
            <h1 className="text-xl font-bold">Compassus</h1>
            <span className="text-muted text-sm hidden sm:inline">Ethereum Dev Tools</span>
          </div>
          <button
            onClick={toggle}
            className="btn btn-secondary p-2"
            aria-label="Toggle theme"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="card border-t-0 border-x-0 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`tab whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="card border-b-0 border-x-0 px-6 py-4 text-center text-muted text-sm">
        Compassus - Ethereum Developer Tools
      </footer>
    </div>
  )
}
