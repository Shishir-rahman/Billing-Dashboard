import React from 'react';
import { RefreshCw, Settings, Database, Moon, Sun, ShieldCheck } from 'lucide-react';
import { formatLastUpdated } from '../utils/formatters';

export function Header({
  dataSourceInfo,
  lastUpdated,
  isRefreshing,
  onRefresh,
  onOpenSettings,
  theme,
  onToggleTheme
}) {
  const isSample = dataSourceInfo?.includes('Sample');

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <ShieldCheck size={26} />
        </div>
        <div>
          <h1 className="brand-title">Sokrio Technologies Ltd.</h1>
          <div className="brand-subtitle">
            Receivable & Collection Management Hub
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="data-source-badge">
          <span className={`status-dot ${isSample ? 'sample' : 'connected'}`}></span>
          <span>{dataSourceInfo || 'Connecting...'}</span>
        </div>

        <div className="data-source-badge" title="Last Refreshed Timestamp">
          <span style={{ color: 'var(--text-muted)' }}>Updated:</span>
          <strong style={{ color: 'var(--brand-primary)' }}>{formatLastUpdated(lastUpdated)}</strong>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Fetch latest data from Google Sheets"
        >
          <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>

        <button
          className="btn btn-icon"
          onClick={onOpenSettings}
          title="Configure Google Sheet Integration"
        >
          <Settings size={17} />
        </button>

        <button
          className="btn btn-icon"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
