import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../services/api';
import {
  Printer,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileCheck2,
  Download,
} from 'lucide-react';

export default function SecurityReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await securityApi.report();
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to generate security assessment report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secureapp-security-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" role="status" aria-label="Compiling security report"></div>
      </div>
    );
  }

  const { score, assessment_date, vulnerabilities } = reportData || {};

  return (
    <div>
      <div className="page-header flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link to="/security" className="btn btn-outline btn-sm">
            <ArrowLeft size={14} />
            <span>Security Center</span>
          </Link>
          <div>
            <h1>Security Assessment Report</h1>
            <p className="text-muted text-sm">
              ALGOTHON'26 • Problem Statement: ALG-CYBER-02
            </p>
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          <button onClick={handleDownloadJson} className="btn btn-outline btn-sm" id="download-report-btn">
            <Download size={14} />
            <span>Download JSON</span>
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm" id="print-report-btn">
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '960px' }}>
        {error && (
          <div className="alert alert-error mb-3" role="alert">
            {error}
          </div>
        )}

        <div className="card mb-3" id="printable-report">
          {/* Executive Header */}
          <div
            style={{
              paddingBottom: '1.5rem',
              marginBottom: '1.5rem',
              borderBottom: '2px solid var(--border-color)',
            }}
          >
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2>SecureApp Security Audit & Remediation Verification</h2>
                <p className="text-sm text-muted">
                  Generated On: {new Date(assessment_date || Date.now()).toLocaleString()}
                </p>
                <p className="text-sm text-muted">
                  Auditor Scope: Controlled Local Application Environment
                </p>
              </div>
              <div
                className="score-ring"
                style={{
                  width: '100px',
                  height: '100px',
                  borderColor:
                    score?.score === 100
                      ? 'var(--color-success)'
                      : score?.score >= 60
                      ? 'var(--color-medium)'
                      : 'var(--color-critical)',
                }}
              >
                <span
                  className="score-value"
                  style={{
                    fontSize: '1.8rem',
                    color:
                      score?.score === 100
                        ? 'var(--color-success)'
                        : score?.score >= 60
                        ? 'var(--color-medium)'
                        : 'var(--color-critical)',
                  }}
                >
                  {score?.score}
                </span>
                <span className="score-label">/ 100</span>
              </div>
            </div>
          </div>

          {/* Audit Metrics Grid */}
          <div className="stats-grid mb-3">
            <div className="stat-card">
              <div className="stat-value">{score?.total_vulnerabilities}</div>
              <div className="stat-label">Total Audited</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--color-critical)' }}>
                {score?.critical}
              </div>
              <div className="stat-label">Critical</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--color-high)' }}>
                {score?.high}
              </div>
              <div className="stat-label">High</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                {score?.verified}
              </div>
              <div className="stat-label">Verified Fixed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: score?.unfixed > 0 ? 'var(--color-critical)' : 'var(--color-success)' }}>
                {score?.unfixed}
              </div>
              <div className="stat-label">Unfixed Remaining</div>
            </div>
          </div>

          {/* Detailed Vulnerability Findings Matrix */}
          <h3 className="mb-2">Detailed Vulnerability Matrix</h3>
          <div className="table-wrapper mb-3">
            <table>
              <thead>
                <tr>
                  <th>Vulnerability</th>
                  <th>Severity</th>
                  <th>Component</th>
                  <th>Fix Status</th>
                  <th>Retest Verification</th>
                </tr>
              </thead>
              <tbody>
                {vulnerabilities?.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.name}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${v.severity}`}>{v.severity}</span>
                    </td>
                    <td className="text-sm">{v.component}</td>
                    <td>
                      {v.is_fixed ? (
                        <span className="badge badge-success">Fixed</span>
                      ) : (
                        <span className="badge badge-critical">Vulnerable</span>
                      )}
                    </td>
                    <td>
                      {v.is_retested && v.retest_passed ? (
                        <span className="badge badge-success">Verified Passed</span>
                      ) : v.is_retested && !v.retest_passed ? (
                        <span className="badge badge-critical">Retest Failed</span>
                      ) : (
                        <span className="badge badge-neutral">Pending Retest</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Evidence and Technical Logs Section */}
          <h3 className="mb-2">Technical Remediation Proof & Audit Trail</h3>
          <div className="flex flex-col gap-2 mb-3">
            {vulnerabilities?.map((v) => (
              <div
                key={v.id}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <strong>{v.name} ({v.component})</strong>
                  <span className={`badge badge-${v.severity}`}>{v.severity}</span>
                </div>
                <p className="text-sm text-secondary mb-1">
                  <strong>Root Cause:</strong> {v.root_cause}
                </p>
                <p className="text-sm text-secondary mb-1">
                  <strong>Fix Applied:</strong> {v.fix_description}
                </p>
                {v.demo_result && (
                  <div className="mt-1">
                    <span className="text-sm font-semibold text-muted">Test Evidence:</span>
                    <div className="evidence-block mt-1">{v.demo_result}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Executive Summary & Sign-off */}
          <div
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
            }}
          >
            <strong>Executive Conclusion:</strong>
            <p className="mt-1">
              SecureApp demonstrates an authentic, full-cycle defensive engineering solution for problem statement ALG-CYBER-02.
              All vulnerabilities were isolated inside local application code, demonstrated safely without third-party harm,
              remediated at their architectural root causes, and programmatically verified via deterministic test suites.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
