import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div>
      <div className="page-header flex items-center gap-2">
        <Link to="/dashboard" className="btn btn-outline btn-sm">
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
        <div>
          <h1>Privacy Policy</h1>
          <p className="text-muted text-sm">SecureApp Platform Data Governance & Processing Statement</p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '800px' }}>
        <article className="card" style={{ lineHeight: '1.7' }}>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={22} />
            <h2>Privacy & Data Protection Notice</h2>
          </div>
          <p className="text-sm text-muted mb-3">Effective Date: October 4, 2026</p>

          <h3 className="mb-1">1. Educational Context & Scope</h3>
          <p className="mb-3 text-secondary">
            SecureApp is an educational web application security assessment and remediation prototype developed for ALGOTHON'26 under problem statement ALG-CYBER-02. All data processed by this application is confined exclusively to the local SQLite database running on the host system.
          </p>

          <h3 className="mb-1">2. Information We Process</h3>
          <ul className="mb-3" style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
            <li><strong>Account Credentials:</strong> Name, email address, and bcrypt-hashed password strings for local authentication.</li>
            <li><strong>Application Records:</strong> Business document titles, descriptions, and categories created by test accounts.</li>
            <li><strong>Audit Logs:</strong> Timestamps and evidence outputs from simulated security retesting routines.</li>
          </ul>

          <h3 className="mb-1">3. Local Storage & Client Cookies</h3>
          <p className="mb-3 text-secondary">
            SecureApp utilizes client browser LocalStorage solely to maintain session state (JWT bearer tokens) and save consent preferences. No third-party tracking scripts, advertising pixels, or telemetry beacons are embedded in this application.
          </p>

          <h3 className="mb-1">4. Zero External Transmission Guarantee</h3>
          <p className="mb-3 text-secondary">
            No personal data, security payloads, or test outputs are transmitted over external networks or sent to third-party cloud services. All testing routines execute strictly against <code>127.0.0.1</code> local loopback endpoints.
          </p>

          <h3 className="mb-1">5. Contact & Questions</h3>
          <p className="text-secondary">
            For academic and hackathon evaluation inquiries regarding this policy, contact the project development team via the hackathon submission portal.
          </p>
        </article>
      </div>
    </div>
  );
}
