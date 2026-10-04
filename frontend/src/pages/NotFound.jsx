import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card card text-center">
        <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'var(--color-critical)' }}>
          <ShieldAlert size={48} />
        </div>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>404</h1>
        <h2>Resource Not Found</h2>
        <p className="text-sm text-muted mt-1 mb-3">
          The requested security resource or URL route does not exist within the SecureApp platform.
        </p>

        <Link to="/dashboard" className="btn btn-primary w-full">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
