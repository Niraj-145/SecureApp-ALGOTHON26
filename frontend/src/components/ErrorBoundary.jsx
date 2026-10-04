import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SecureApp ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Inter, sans-serif',
          background: '#f5f3f0',
        }}>
          <div style={{
            maxWidth: '480px',
            padding: '2rem',
            border: '2px solid #1a1a1a',
            background: '#fff',
            boxShadow: '5px 5px 0 #1a1a1a',
          }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Something went wrong</h2>
            <p style={{ color: '#7a7a7a', fontSize: '0.9rem', marginBottom: '1rem' }}>
              An unexpected error occurred. Please try refreshing the page or returning to the login screen.
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#c0392b', marginBottom: '1rem' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => { window.location.href = '/login'; }}
              style={{
                padding: '0.6rem 1.2rem',
                background: '#1a1a1a',
                color: '#fff',
                border: '2px solid #1a1a1a',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
