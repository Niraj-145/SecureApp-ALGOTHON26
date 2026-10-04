import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { recordApi } from '../services/api';
import {
  FileText,
  Search,
  Plus,
  Lock,
  Globe,
  ArrowRight,
  ShieldAlert,
  X,
  User,
  KeyRound,
  ShieldCheck,
  Eye,
} from 'lucide-react';

export default function Records() {
  const { user, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New record form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchRecords = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await recordApi.list(query);
      setRecords(data);
    } catch (err) {
      setError(err.message || 'Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords('');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords(search);
  };

  const handleQuickSqlInjection = () => {
    const payload = "' OR '1'='1";
    setSearch(payload);
    fetchRecords(payload);
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await recordApi.create({
        title: newTitle,
        content: newContent,
        category: newCategory,
        is_private: newIsPrivate,
      });
      setShowModal(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      setNewIsPrivate(false);
      fetchRecords('');
    } catch (err) {
      setError(err.message || 'Failed to create record');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1>{isAdmin ? 'All Business Records & Document Repository' : 'My Business Records & Resources'}</h1>
            <span
              style={{
                display: 'inline-block',
                background: isAdmin ? 'var(--color-critical)' : 'var(--color-primary)',
                color: '#fff',
                padding: '2px 8px',
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {isAdmin ? 'Admin View: All Tenants' : 'Isolated User View'}
            </span>
          </div>
          <p className="text-muted text-sm">
            {isAdmin
              ? 'Comprehensive administrative view of all enterprise partitions, proprietary records, and policies.'
              : 'Secure workspace containing your private business records and company policies.'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary btn-sm"
          id="create-record-btn"
        >
          <Plus size={16} />
          <span>New Record</span>
        </button>
      </div>

      <div className="page-body">
        {/* IDOR Interactive Testing Callout */}
        <div
          className="card mb-3"
          style={{
            background: '#fafbfd',
            borderLeft: '4px solid var(--color-primary)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={18} color="var(--color-primary)" />
            <strong style={{ fontSize: '0.95rem' }}>Direct Object Reference (IDOR) Testing Matrix</strong>
          </div>
          <p className="text-xs text-muted mb-2">
            You are logged in as <strong>{user?.name} (ID: #{user?.id})</strong>.
            User 1 (Alice) owns <strong>Record #101</strong> & <strong>#102</strong>.
            User 2 (Bob) owns <strong>Record #201</strong> & <strong>#202</strong>.
            Admin can access all records. Direct links below test backend authorization:
          </p>
          <div className="flex gap-2 flex-wrap items-center">
            <Link to="/records/101" className="btn btn-outline btn-sm">
              <Eye size={12} />
              <span>Test Record #101 (Alice)</span>
            </Link>
            <Link to="/records/201" className="btn btn-outline btn-sm">
              <Eye size={12} />
              <span>Test Record #201 (Bob)</span>
            </Link>
            <span className="text-xs text-muted">
              • In Vulnerable Mode, cross-tenant access leaks. In Secure Mode, the backend strictly returns 403 Forbidden.
            </span>
          </div>
        </div>

        {/* Search & SQLi demonstration trigger */}
        <div className="card mb-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-1 flex-wrap items-center">
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search records by title or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="record-search-input"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              <Search size={14} />
              <span>Search</span>
            </button>
            {search && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  fetchRecords('');
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleQuickSqlInjection}
              title="Inject ' OR '1'='1 to test SQL Injection behavior in search"
              style={{ borderColor: 'var(--color-critical)', color: 'var(--color-critical)' }}
            >
              <ShieldAlert size={14} />
              <span>Test Payload: ' OR '1'='1</span>
            </button>
          </form>
          <span className="text-xs text-muted mt-2" style={{ display: 'block' }}>
            <strong>SQL Injection Control:</strong> In Vulnerable Mode, <code>' OR '1'='1</code> bypasses tenant boundaries. In Secure Mode, parameterized queries treat it as literal string data.
          </span>
        </div>

        {error && (
          <div className="alert alert-error mb-3" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" role="status" aria-label="Loading records"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="card empty-state">
            <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3>No Records Found</h3>
            <p className="text-sm text-muted mb-2">
              No documents matched your search query.
            </p>
            <button
              onClick={() => {
                setSearch('');
                fetchRecords('');
              }}
              className="btn btn-outline btn-sm"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Document Title</th>
                    <th>Owner / Partition</th>
                    <th>Category</th>
                    <th>Privacy</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const isOwnRecord = r.owner_id === user?.id;
                    return (
                      <tr key={r.id}>
                        <td>
                          <strong>#{r.id}</strong>
                        </td>
                        <td>
                          <strong>{r.title}</strong>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <User size={13} className="text-muted" />
                            <span className="text-sm">
                              {r.owner_name} {isOwnRecord && <strong style={{ color: 'var(--color-primary)' }}>(You)</strong>}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-default">{r.category}</span>
                        </td>
                        <td>
                          {r.is_private ? (
                            <span className="badge badge-critical flex items-center gap-1" style={{ width: 'fit-content' }}>
                              <Lock size={10} />
                              <span>Private</span>
                            </span>
                          ) : (
                            <span className="badge badge-success flex items-center gap-1" style={{ width: 'fit-content' }}>
                              <Globe size={10} />
                              <span>Public</span>
                            </span>
                          )}
                        </td>
                        <td className="text-sm text-muted">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <Link to={`/records/${r.id}`} className="btn btn-outline btn-sm">
                            <Eye size={12} />
                            <span>View Details</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Record Creation */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '540px' }}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 style={{ margin: 0 }}>Create Business Record</h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateRecord}>
              <div className="form-group mb-2">
                <label htmlFor="record-title">Record Title</label>
                <input
                  id="record-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Q4 Financial Projections"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group mb-2">
                <label htmlFor="record-category">Category</label>
                <select
                  id="record-category"
                  className="form-input"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="policy">Policy</option>
                  <option value="report">Report</option>
                  <option value="finance">Finance</option>
                  <option value="notes">Confidential Notes</option>
                </select>
              </div>

              <div className="form-group mb-2">
                <label htmlFor="record-content">Record Content</label>
                <textarea
                  id="record-content"
                  className="form-input"
                  rows={4}
                  placeholder="Enter detailed document notes or payload..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newIsPrivate}
                    onChange={(e) => setNewIsPrivate(e.target.checked)}
                  />
                  <span className="text-sm font-bold">
                    Mark as Private (Protected by Zero-Trust Access Control)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
