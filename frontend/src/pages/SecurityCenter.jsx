import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  Wrench,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  FileCheck2,
  ArrowRight,
  Terminal,
} from 'lucide-react';

export default function SecurityCenter() {
  const [scoreData, setScoreData] = useState(null);
  const [vulns, setVulns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [liveOutputs, setLiveOutputs] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [scoreRes, vulnRes] = await Promise.all([
        securityApi.score(),
        securityApi.vulnerabilities(),
      ]);
      setScoreData(scoreRes);
      setVulns(vulnRes);
    } catch (err) {
      setError(err.message || 'Failed to load security center metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (vulnId, actionType) => {
    setActionLoading((prev) => ({ ...prev, [`${vulnId}-${actionType}`]: true }));
    try {
      let res;
      if (actionType === 'demo') {
        res = await securityApi.demo(vulnId);
        setLiveOutputs((prev) => ({
          ...prev,
          [vulnId]: {
            type: 'demo',
            title: `Safe Demonstration (${vulnId})`,
            status: res.status,
            passed: res.passed,
            message: res.message,
            evidence: res.evidence,
          },
        }));
      } else if (actionType === 'fix') {
        res = await securityApi.fix(vulnId);
        setLiveOutputs((prev) => ({
          ...prev,
          [vulnId]: {
            type: 'fix',
            title: `Remediation Fix Applied (${vulnId})`,
            message: res.message,
          },
        }));
      } else if (actionType === 'retest') {
        res = await securityApi.retest(vulnId);
        setLiveOutputs((prev) => ({
          ...prev,
          [vulnId]: {
            type: 'retest',
            title: `Automated Retest Result (${vulnId})`,
            status: res.status,
            passed: res.passed,
            message: res.message,
            evidence: res.evidence,
          },
        }));
      }

      // Refresh overall scores and vulnerability states
      const [scoreRes, vulnRes] = await Promise.all([
        securityApi.score(),
        securityApi.vulnerabilities(),
      ]);
      setScoreData(scoreRes);
      setVulns(vulnRes);
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`${vulnId}-${actionType}`]: false }));
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all vulnerabilities back to vulnerable state for a fresh demonstration?')) {
      return;
    }
    setLoading(true);
    try {
      await securityApi.reset();
      setLiveOutputs({});
      await loadData();
    } catch (err) {
      alert('Reset failed: ' + err.message);
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-medium)';
    return 'var(--color-critical)';
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1>Security Operations Center</h1>
          <p className="text-muted text-sm">
            Discover • Demonstrate • Remediate • Retest • Verify Security Lifecycle
          </p>
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={handleReset}
            className="btn btn-outline btn-sm"
            title="Reset all states back to vulnerable for judging demo"
            id="reset-security-state-btn"
          >
            <RotateCcw size={14} />
            <span>Reset Demo State</span>
          </button>
          <Link to="/security/report" className="btn btn-primary btn-sm" id="view-report-header-btn">
            <FileCheck2 size={14} />
            <span>View Security Report</span>
          </Link>
        </div>
      </div>

      <div className="page-body">
        {error && (
          <div className="alert alert-error mb-3" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" role="status" aria-label="Loading security center"></div>
          </div>
        ) : (
          <>
            {/* Score & Posture Metric Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              <div className="card flex items-center justify-between gap-2">
                <div>
                  <h3 className="mb-1">Platform Security Score</h3>
                  <p className="text-sm text-muted mb-2">
                    Deterministic calculation: unaddressed vulnerabilities penalize score, verified fixes restore it.
                  </p>
                  <span
                    className="badge"
                    style={{
                      borderColor: getScoreColor(scoreData?.score || 0),
                      color: getScoreColor(scoreData?.score || 0),
                    }}
                  >
                    {scoreData?.score === 100
                      ? '100% Secure & Verified'
                      : scoreData?.score >= 60
                      ? 'Partially Remediated'
                      : 'Critical Vulnerabilities Present'}
                  </span>
                </div>
                <div
                  className="score-ring"
                  style={{ borderColor: getScoreColor(scoreData?.score || 0) }}
                >
                  <span
                    className="score-value"
                    style={{ color: getScoreColor(scoreData?.score || 0) }}
                  >
                    {scoreData?.score ?? 0}
                  </span>
                  <span className="score-label">/ 100</span>
                </div>
              </div>

              <div className="card flex flex-col justify-between">
                <div>
                  <h3 className="mb-1">Remediation Status</h3>
                  <p className="text-sm text-muted mb-2">
                    {scoreData?.verified} of {scoreData?.total_vulnerabilities} vulnerabilities verified secure through automated retesting
                  </p>
                </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-critical)' }}>
                      {scoreData?.critical}
                    </div>
                    <div className="stat-label">Critical</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-high)' }}>
                      {scoreData?.high}
                    </div>
                    <div className="stat-label">High</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                      {scoreData?.verified}
                    </div>
                    <div className="stat-label">Verified Fixed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: scoreData?.unfixed > 0 ? 'var(--color-critical)' : 'var(--color-success)' }}>
                      {scoreData?.unfixed}
                    </div>
                    <div className="stat-label">Unfixed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanatory banner */}
            <div className="card mb-3" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Terminal size={18} />
                <strong>Controlled Local Testing Methodology</strong>
              </div>
              <p className="text-sm text-muted">
                Each button triggers real backend code paths inside our local SQLite environment.
                <strong> Safely Demonstrate</strong> runs the exploit payload.
                <strong> Apply Fix</strong> activates the secure parameterized / encoded logic.
                <strong> Run Retest</strong> runs the security engine suite to confirm that exploitation is blocked.
              </p>
            </div>

            {/* Vulnerability Cards List */}
            <div className="flex flex-col gap-3">
              {vulns.map((v) => {
                const live = liveOutputs[v.id];
                const isDemoLoading = actionLoading[`${v.id}-demo`];
                const isFixLoading = actionLoading[`${v.id}-fix`];
                const isRetestLoading = actionLoading[`${v.id}-retest`];

                return (
                  <div key={v.id} className="card" id={`vuln-card-${v.id}`}>
                    <div className="card-header flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3>{v.name}</h3>
                        <span className={`badge badge-${v.severity}`}>{v.severity}</span>
                        <span className="badge badge-neutral">{v.component}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {v.is_retested && v.retest_passed ? (
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
                            VERIFIED SECURE
                          </span>
                        ) : v.is_fixed ? (
                          <span className="badge badge-info">
                            FIX APPLIED (NEEDS RETEST)
                          </span>
                        ) : (
                          <span className="badge badge-critical">
                            VULNERABLE
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm mb-2">{v.description}</p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                        <strong>Root Cause:</strong>
                        <p className="text-muted mt-1">{v.root_cause}</p>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                        <strong>Remediation Strategy:</strong>
                        <p className="text-muted mt-1">{v.fix_description}</p>
                      </div>
                    </div>

                    {/* Interactive Action Controls */}
                    <div className="flex justify-between items-center flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handleAction(v.id, 'demo')}
                          className="btn btn-outline btn-sm"
                          disabled={isDemoLoading}
                          id={`btn-demo-${v.id}`}
                        >
                          <Play size={14} color="var(--color-critical)" />
                          <span>{isDemoLoading ? 'Running Demo...' : 'Safely Demonstrate'}</span>
                        </button>

                        <button
                          onClick={() => handleAction(v.id, 'fix')}
                          className={`btn ${v.is_fixed ? 'btn-outline' : 'btn-warning'} btn-sm`}
                          disabled={isFixLoading || v.is_fixed}
                          id={`btn-fix-${v.id}`}
                        >
                          <Wrench size={14} />
                          <span>{isFixLoading ? 'Applying...' : v.is_fixed ? 'Fix Applied' : 'Apply Fix'}</span>
                        </button>

                        <button
                          onClick={() => handleAction(v.id, 'retest')}
                          className={`btn ${v.is_retested && v.retest_passed ? 'btn-success' : 'btn-primary'} btn-sm`}
                          disabled={isRetestLoading}
                          id={`btn-retest-${v.id}`}
                        >
                          <CheckCircle2 size={14} />
                          <span>{isRetestLoading ? 'Retesting...' : 'Run Retest'}</span>
                        </button>
                      </div>

                      <Link
                        to={`/security/vulnerabilities/${v.id}`}
                        className="btn btn-outline btn-sm"
                        id={`btn-details-${v.id}`}
                      >
                        <span>Deep-Dive Code & Logs</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>

                    {/* Live Evidence / Test Output Console */}
                    {live && (
                      <div className="mt-2">
                        <div
                          className="alert"
                          style={{
                            background: live.passed ? 'var(--color-success-bg)' : 'var(--color-critical-bg)',
                            borderColor: live.passed ? 'var(--color-success)' : 'var(--color-critical)',
                            color: live.passed ? 'var(--color-success)' : 'var(--color-critical)',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <strong>{live.title}: </strong>
                          {live.message}
                        </div>
                        {live.evidence && (
                          <div className="evidence-block">
                            {live.evidence}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Call-To-Action */}
            <div className="mt-3 text-center">
              <Link to="/security/report" className="btn btn-primary" id="view-report-bottom-btn">
                <FileCheck2 size={18} />
                <span>Generate Audit-Ready Security Report</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
