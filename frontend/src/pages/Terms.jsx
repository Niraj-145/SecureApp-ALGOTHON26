import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function Terms() {
  return (
    <div>
      <div className="page-header flex items-center gap-2">
        <Link to="/dashboard" className="btn btn-outline btn-sm">
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
        <div>
          <h1>Terms & Conditions</h1>
          <p className="text-muted text-sm">Acceptable Use & Educational Security Guidelines</p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '800px' }}>
        <article className="card" style={{ lineHeight: '1.7' }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-high)' }}>
            <AlertTriangle size={22} />
            <h2>Acceptable Use & Ethical Security Policy</h2>
          </div>
          <p className="text-sm text-muted mb-3">Effective Date: October 4, 2026</p>

          <h3 className="mb-1">1. Educational & Demonstration Purpose</h3>
          <p className="mb-3 text-secondary">
            SecureApp is provided strictly for educational, research, and technical evaluation purposes in connection with ALGOTHON'26. The platform intentionally includes controlled vulnerable software constructs designed to demonstrate the complete defensive security lifecycle: Discover → Identify → Safely Demonstrate → Fix → Retest → Verify → Report.
          </p>

          <h3 className="mb-1">2. Local Scope Limitation</h3>
          <p className="mb-3 text-secondary">
            Users and evaluators agree that all security tests, demonstrations, and simulated exploits shall only be performed against the local, self-hosted SecureApp instance (<code>localhost</code> / <code>127.0.0.1</code>).
          </p>

          <h3 className="mb-1">3. Prohibition of Unauthorized External Testing</h3>
          <p className="mb-3 text-secondary">
            Under no circumstances may any techniques, payloads, or automated routines demonstrated within SecureApp be deployed against third-party servers, production infrastructures, unauthorized web applications, or any systems without explicit prior written authorization from the system owners.
          </p>

          <h3 className="mb-1">4. Disclaimer of Warranty</h3>
          <p className="mb-3 text-secondary">
            The software is provided "as is", without warranty of any kind, express or implied. The authors and maintainers shall not be liable for any damages or consequences arising from unauthorized modification or misuse of the testbed.
          </p>
        </article>
      </div>
    </div>
  );
}
