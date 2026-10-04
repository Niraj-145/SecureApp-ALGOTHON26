import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { securityApi, userApi } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Lock,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Users,
  Eye,
  PlusCircle,
  KeyRound,
  Shield,
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isAdmin) {
        const stats = await securityApi.dashboardStats();
        setAdminData(stats);
      } else {
        const data = await userApi.dashboard();
        setUserData(data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard data. Check backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isAdmin]);

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-medium)';
    return 'var(--color-critical)';
  };

  return (
    <div>
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="page-header flex justify-between items-center flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1>{isAdmin ? 'Security Operations Console' : `Welcome back, ${user?.name}`}</h1>
            <span
              style={{
                display: 'inline-block',
                background: isAdmin ? 'var(--color-critical)' : 'var(--color-primary)',
                color: '#fff',
                padding: '2px 8px',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {isAdmin ? 'Admin Authority' : 'Standard Member'}
            </span>
          </div>
          <p className="text-muted text-sm">
            {isAdmin
              ? 'Real-Time Vulnerability Assessment, System Health & Audit Activity'
              : 'Personal Workspace — Isolated Data Partition & Records Management'}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={loadDashboardData} className="btn btn-outline btn-sm" title="Refresh metrics">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          {isAdmin ? (
            <Link to="/security" className="btn btn-primary btn-sm">
              <Lock size={14} />
              <span>Open Security Center</span>
            </Link>
          ) : (
            <Link to="/records" className="btn btn-primary btn-sm">
              <FileText size={14} />
              <span>Browse My Records</span>
            </Link>
          )}
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
            <div className="spinner" role="status" aria-label="Loading dashboard data"></div>
          </div>
        ) : isAdmin ? (
          /* ══════════════════════════════════════════════════════ */
          /*  ROLE 1: ADMINISTRATOR DASHBOARD                       */
          /* ══════════════════════════════════════════════════════ */
          <div>
            {/* Top Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              {/* Score Card */}
              <div className="card flex items-center justify-between gap-2">
                <div>
                  <h3 className="mb-1">Security Score</h3>
                  <p className="text-sm text-muted mb-2">
                    Dynamic posture based on actual remediation state
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">
                      {adminData?.open_findings === 0
                        ? 'All vulnerabilities verified secure'
                        : `${adminData?.open_findings} finding(s) require remediation`}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '2.8rem',
                    fontWeight: 900,
                    color: getScoreColor(adminData?.score?.score || 0),
                    fontFamily: 'monospace',
                    border: '3px solid var(--border-color)',
                    padding: '0.4rem 1rem',
                    background: '#fafafa',
                  }}
                >
                  {adminData?.score?.score ?? 0}
                  <span style={{ fontSize: '1.2rem', color: '#888' }}>/100</span>
                </div>
              </div>

              {/* Vulnerability Summary Card */}
              <div className="card">
                <h3 className="mb-1">Vulnerability Summary</h3>
                <p className="text-sm text-muted mb-3">Live vulnerability tracking matrix</p>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <div
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'rgba(230, 57, 70, 0.08)',
                      border: '2px solid var(--color-critical)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-critical)' }}>
                      {adminData?.score?.critical ?? 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Critical</div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'rgba(244, 162, 97, 0.1)',
                      border: '2px solid var(--color-high)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-high)' }}>
                      {adminData?.score?.high ?? 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>High</div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'rgba(42, 157, 143, 0.1)',
                      border: '2px solid var(--color-success)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
                      {adminData?.score?.verified ?? 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Verified</div>
                  </div>
                </div>
                <div className="text-xs text-muted">
                  Assessment Status: <strong>{adminData?.assessment_status}</strong>
                </div>
              </div>

              {/* Platform Metrics Card */}
              <div className="card">
                <h3 className="mb-1">Enterprise Platform Scope</h3>
                <p className="text-sm text-muted mb-3">Managed multi-tenant records & identity</p>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span className="text-sm">Registered Accounts</span>
                  </div>
                  <span className="badge badge-default" style={{ fontSize: '0.9rem' }}>
                    {adminData?.total_users} Users
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1">
                    <FileText size={16} />
                    <span className="text-sm">Total Business Records</span>
                  </div>
                  <span className="badge badge-default" style={{ fontSize: '0.9rem' }}>
                    {adminData?.total_records} Records
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={16} color="var(--color-success)" />
                    <span className="text-sm">Access Control</span>
                  </div>
                  <span className="badge badge-success">Backend Enforced</span>
                </div>
              </div>
            </div>

            {/* Findings Matrix Section */}
            <div className="card mb-3">
              <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
                <div>
                  <h3>Open Findings & Security Lifecycle Status</h3>
                  <p className="text-sm text-muted">
                    Click any vulnerability to launch controlled exploit demonstration and code fix
                  </p>
                </div>
                <Link to="/security" className="btn btn-outline btn-sm">
                  <span>Manage All in Security Center</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Vulnerability</th>
                      <th>Severity</th>
                      <th>Affected Component</th>
                      <th>Fix Status</th>
                      <th>Verification</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData?.vulnerabilities?.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <strong>{v.name}</strong>
                          <div className="text-xs text-muted">{v.category}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${v.severity}`}>{v.severity}</span>
                        </td>
                        <td className="text-sm">{v.component}</td>
                        <td>
                          {v.is_fixed ? (
                            <span className="badge badge-success flex items-center gap-1" style={{ width: 'fit-content' }}>
                              <CheckCircle2 size={12} />
                              <span>Fixed</span>
                            </span>
                          ) : (
                            <span className="badge badge-critical flex items-center gap-1" style={{ width: 'fit-content' }}>
                              <XCircle size={12} />
                              <span>Vulnerable</span>
                            </span>
                          )}
                        </td>
                        <td>
                          {v.retest_passed ? (
                            <span className="badge badge-success">Verified Secure</span>
                          ) : (
                            <span className="badge badge-outline">Unverified</span>
                          )}
                        </td>
                        <td>
                          <Link to={`/security/vulnerabilities/${v.id}`} className="btn btn-outline btn-sm">
                            <span>Inspect</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Audit Activity Log */}
            <div className="card">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3>Recent Security Assessment Activity</h3>
                  <p className="text-sm text-muted">Immutable audit trail of demonstrations, fixes, and retests</p>
                </div>
                <Link to="/security/report" className="btn btn-outline btn-sm">
                  <FileCheck2 size={14} />
                  <span>View Security Report</span>
                </Link>
              </div>

              {adminData?.recent_activity?.length === 0 ? (
                <p className="text-muted text-sm py-2">No security assessment actions executed yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {adminData?.recent_activity?.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.75rem 1rem',
                        border: '2px solid var(--border-color)',
                        background: '#fafafa',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`badge ${
                              log.action === 'fix'
                                ? 'badge-success'
                                : log.action === 'retest'
                                ? 'badge-primary'
                                : 'badge-critical'
                            }`}
                            style={{ textTransform: 'uppercase' }}
                          >
                            {log.action}
                          </span>
                          <strong>{log.vuln_id}</strong>
                          <span className="text-sm text-muted">• Result: {log.result || 'executed'}</span>
                        </div>
                        {log.details && (
                          <div
                            className="text-xs text-muted mt-1"
                            style={{ fontFamily: 'monospace', maxWidth: '750px', whiteSpace: 'pre-wrap' }}
                          >
                            {log.details.slice(0, 160)}
                            {log.details.length > 160 ? '...' : ''}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted flex items-center gap-1">
                        <Clock size={12} />
                        <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════ */
          /*  ROLE 2: STANDARD USER DASHBOARD                       */
          /* ══════════════════════════════════════════════════════ */
          <div>
            {/* Top Metric Cards for Standard User */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              {/* My Records Card */}
              <div className="card">
                <div className="flex justify-between items-center mb-1">
                  <h3>My Records</h3>
                  <FileText size={22} color="var(--color-primary)" />
                </div>
                <p className="text-sm text-muted mb-3">Private & proprietary documents in your partition</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace' }}>
                  {userData?.my_records_count ?? 0}
                  <span style={{ fontSize: '1rem', color: '#888', fontWeight: 500, marginLeft: '0.5rem' }}>
                    Owned Records
                  </span>
                </div>
                <div className="mt-2">
                  <Link to="/records" className="text-sm font-bold flex items-center gap-1">
                    <span>Manage all my records</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Discussions Card */}
              <div className="card">
                <div className="flex justify-between items-center mb-1">
                  <h3>My Collaboration</h3>
                  <User size={22} color="var(--color-secondary)" />
                </div>
                <p className="text-sm text-muted mb-3">Comments and notes contributed across projects</p>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace' }}>
                  {userData?.my_comments_count ?? 0}
                  <span style={{ fontSize: '1rem', color: '#888', fontWeight: 500, marginLeft: '0.5rem' }}>
                    Notes Posted
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted">
                  Comments automatically sanitized for HTML entity security.
                </div>
              </div>

              {/* Data Isolation Status Card */}
              <div className="card">
                <div className="flex justify-between items-center mb-1">
                  <h3>Data Isolation</h3>
                  <ShieldCheck size={22} color="var(--color-success)" />
                </div>
                <p className="text-sm text-muted mb-3">Enterprise Zero-Trust security guarantee</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-success">IDOR Protected</span>
                  <span className="badge badge-default">Bcrypt Hashed</span>
                </div>
                <p className="text-xs text-muted">
                  Only your account (User #{user?.id}) and authorized administrators can access your private data.
                </p>
              </div>
            </div>

            {/* Interactive IDOR Testing Callout Sandbox */}
            <div
              className="card mb-3"
              style={{
                background: '#fffdfa',
                borderColor: 'var(--color-primary)',
                borderWidth: '3px',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0 }}>Authorization Demonstration Sandbox</h3>
              </div>
              <p className="text-sm mb-3">
                You are currently logged in as standard user <strong>{user?.name}</strong> (User ID: <strong>{user?.id}</strong>).
                In accordance with <strong>ALG-CYBER-02</strong>, you can test server-side authorization directly by attempting
                to read another user's private records:
              </p>
              <div className="flex gap-2 flex-wrap items-center">
                <Link to="/records/101" className="btn btn-outline btn-sm">
                  <span>Test Record #101 (Alice's Confidential Specs)</span>
                </Link>
                <Link to="/records/201" className="btn btn-outline btn-sm">
                  <span>Test Record #201 (Bob's Confidential Ledger)</span>
                </Link>
                <span className="text-xs text-muted">
                  • <em>In Vulnerable Mode:</em> cross-tenant access succeeds. <em>In Secure Mode:</em> server blocks with 403 Forbidden.
                </span>
              </div>
            </div>

            {/* My Records Table */}
            <div className="card mb-3">
              <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
                <div>
                  <h3>My Confidential Records</h3>
                  <p className="text-sm text-muted">Records created and owned by your account</p>
                </div>
                <Link to="/records" className="btn btn-primary btn-sm">
                  <PlusCircle size={14} />
                  <span>Create New Record</span>
                </Link>
              </div>

              {userData?.my_records?.length === 0 ? (
                <p className="text-muted text-sm py-2">You haven't created any records yet.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Privacy</th>
                        <th>Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData?.my_records?.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>#{r.id}</strong>
                          </td>
                          <td>
                            <strong>{r.title}</strong>
                          </td>
                          <td>
                            <span className="badge badge-default">{r.category}</span>
                          </td>
                          <td>
                            {r.is_private ? (
                              <span className="badge badge-critical">Private</span>
                            ) : (
                              <span className="badge badge-success">Public</span>
                            )}
                          </td>
                          <td className="text-sm text-muted">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <Link to={`/records/${r.id}`} className="btn btn-outline btn-sm">
                              <Eye size={12} />
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* My Activity Feed & Notifications */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              <div className="card">
                <h3 className="mb-2">My Recent Activity</h3>
                {userData?.my_activity?.length === 0 ? (
                  <p className="text-muted text-sm">No activity recorded yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {userData?.my_activity?.map((act, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: '1px solid var(--border-color)',
                          background: '#fafafa',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{act.title}</div>
                          {act.content && (
                            <div className="text-xs text-muted" style={{ fontStyle: 'italic' }}>
                              "{act.content}"
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h3 className="mb-2">Security & Isolation Notices</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {userData?.notifications?.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem',
                        border: '2px solid var(--border-color)',
                        background: n.type === 'success' ? 'rgba(42, 157, 143, 0.08)' : '#f4f6f8',
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1 font-bold text-sm">
                        <Shield size={14} color="var(--color-primary)" />
                        <span>{n.title}</span>
                      </div>
                      <p className="text-xs text-muted mb-0">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
