import React from 'react';
import ReactDOM from 'react-dom/client';
import { Chart as ChartJS, registerables } from 'chart.js';
import App from './App.jsx';

// Register all Chart.js controllers, scales, elements, and plugins globally
ChartJS.register(...registerables);

// Global React Error Boundary to catch UI errors gracefully
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', fontFamily: 'sans-serif' }}>
          <h2>Application Rendering Error</h2>
          <p style={{ marginTop: '1rem', color: '#9ca3af' }}>{this.state.error?.toString()}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', background: '#0ea5e9', color: '#fff', border: 'none' }}
          >
            Reload Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
