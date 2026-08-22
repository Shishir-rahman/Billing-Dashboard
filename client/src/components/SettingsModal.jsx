import React, { useState, useEffect } from 'react';
import { X, Settings, Database, Key, HelpCircle, Save, CheckCircle2 } from 'lucide-react';
import { getAppConfig, updateAppConfig } from '../utils/api';

export function SettingsModal({ isOpen, onClose, onConfigSaved }) {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Receivable Data');
  const [authMode, setAuthMode] = useState('sample_fallback');
  const [csvPublishUrl, setCsvPublishUrl] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [autoRefreshIntervalMinutes, setAutoRefreshIntervalMinutes] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const cfg = await getAppConfig();
      setSpreadsheetId(cfg.spreadsheetId || '');
      setSheetName(cfg.sheetName || 'Receivable Data');
      setAuthMode(cfg.authMode || 'sample_fallback');
      setCsvPublishUrl(cfg.csvPublishUrl || '');
      setAutoRefreshIntervalMinutes(cfg.autoRefreshIntervalMinutes || 5);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setMessage(null);
      await updateAppConfig({
        spreadsheetId,
        sheetName,
        authMode,
        csvPublishUrl,
        googleApiKey,
        autoRefreshIntervalMinutes: Number(autoRefreshIntervalMinutes)
      });
      setMessage({ type: 'success', text: 'Configuration saved! Fetching latest sheet data...' });
      setIsLoading(false);
      setTimeout(() => {
        onConfigSaved();
        onClose();
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save config' });
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="kpi-icon-box" style={{ width: '38px', height: '38px' }}>
              <Settings size={20} />
            </div>
            <div>
              <h2 className="card-title" style={{ fontSize: '1.1rem' }}>Google Sheets Integration Settings</h2>
              <p className="card-subtitle">Configure spreadsheet source, sync parameters & credentials</p>
            </div>
          </div>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {message && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.83rem',
                  background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                  border: `1px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`
                }}
              >
                {message.text}
              </div>
            )}

            {/* Data Source Mode Selection */}
            <div>
              <label className="filter-label" style={{ display: 'block', marginBottom: '0.4rem' }}>
                Data Integration Mode
              </label>
              <select
                className="filter-select"
                style={{ width: '100%', padding: '0.55rem' }}
                value={authMode}
                onChange={(e) => setAuthMode(e.target.value)}
              >
                <option value="sample_fallback">Sokrio Sample Dataset (Demo Mode)</option>
                <option value="csv_publish">Google Sheet Published Web/CSV URL (Recommended & Easiest)</option>
                <option value="google_api">Google Sheets API v4 (With GCP API Key)</option>
              </select>
            </div>

            {/* Spreadsheet ID & Sheet Name */}
            <div className="grid-equal-2col" style={{ gap: '0.85rem' }}>
              <div>
                <label className="filter-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Google Spreadsheet ID
                </label>
                <input
                  type="text"
                  className="filter-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgm..."
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                />
              </div>

              <div>
                <label className="filter-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Sheet / Tab Name
                </label>
                <input
                  type="text"
                  className="filter-input"
                  style={{ width: '100%' }}
                  placeholder="Receivable Data"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                />
              </div>
            </div>

            {/* Mode-specific optional inputs */}
            {authMode === 'csv_publish' && (
              <div>
                <label className="filter-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Custom Published CSV Link (Optional Override)
                </label>
                <input
                  type="text"
                  className="filter-input"
                  style={{ width: '100%' }}
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                  value={csvPublishUrl}
                  onChange={(e) => setCsvPublishUrl(e.target.value)}
                />
              </div>
            )}

            {authMode === 'google_api' && (
              <div>
                <label className="filter-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Google API Key (Kept Secure on Server)
                </label>
                <input
                  type="password"
                  className="filter-input"
                  style={{ width: '100%' }}
                  placeholder="AIzaSy..."
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="filter-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                Automatic Data Refresh Interval
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={autoRefreshIntervalMinutes}
                onChange={(e) => setAutoRefreshIntervalMinutes(e.target.value)}
              >
                <option value={0}>Disabled (Manual Refresh Only)</option>
                <option value={1}>Every 1 Minute</option>
                <option value={5}>Every 5 Minutes (Default)</option>
                <option value={15}>Every 15 Minutes</option>
              </select>
            </div>

            {/* Guide Box */}
            <div className="management-summary-card" style={{ padding: '0.85rem 1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <HelpCircle size={15} />
                Quick Guide to Connecting Your Actual Google Sheet
              </div>
              <ol style={{ paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                <li>Make sure your sheet tab is named <strong>"Receivable Data"</strong>.</li>
                <li>Verify your sheet contains the 18 standard columns specified in your system.</li>
                <li>In Google Sheets, go to <strong>File &gt; Share &gt; Publish to Web</strong>, select sheet tab "Receivable Data" as CSV, and click Publish.</li>
                <li>Paste the Spreadsheet ID above and select <strong>Published Web/CSV URL</strong>. Your backend will sync directly and securely.</li>
              </ol>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              <Save size={15} />
              <span>{isLoading ? 'Saving...' : 'Save & Sync Sheet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
