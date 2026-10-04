import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { recordApi, commentApi } from '../services/api';
import {
  ArrowLeft,
  Lock,
  Globe,
  User,
  Calendar,
  MessageSquare,
  Send,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  X,
  Save,
  ShieldCheck,
} from 'lucide-react';

export default function RecordDetails() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit record state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadRecordAndComments = async () => {
    setLoading(true);
    setError('');
    try {
      const recData = await recordApi.get(id);
      setRecord(recData);
      setEditTitle(recData.title);
      setEditContent(recData.content);
      setEditCategory(recData.category);
      setEditIsPrivate(Boolean(recData.is_private));

      const commData = await commentApi.list(id);
      setComments(commData);
    } catch (err) {
      setError(err.message || 'Failed to load record details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordAndComments();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await commentApi.create(id, { record_id: parseInt(id, 10), content: newComment });
      setNewComment('');
      // Reload comments
      const commData = await commentApi.list(id);
      setComments(commData);
    } catch (err) {
      alert('Failed to post comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const updated = await recordApi.update(id, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        is_private: editIsPrivate,
      });
      setRecord(updated);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update record: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!window.confirm(`Are you sure you want to delete Record #${id}?`)) return;
    try {
      await recordApi.delete(id);
      navigate('/records');
    } catch (err) {
      alert('Failed to delete record: ' + err.message);
    }
  };

  const handleInsertXssPayload = () => {
    setNewComment('<img src="invalid-image" onerror="alert(\'XSS Vulnerability Triggered!\')" /> <b>Urgent Review Needed</b>');
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" role="status" aria-label="Loading record"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-body">
        <div
          className="card"
          style={{
            maxWidth: '680px',
            margin: '2rem auto',
            border: '3px solid var(--color-critical)',
          }}
        >
          <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-critical)' }}>
            <AlertTriangle size={32} />
            <div>
              <h2 style={{ margin: 0 }}>403 Access Denied — Authorization Enforced</h2>
              <span className="text-xs text-muted">Server-Side Access Control (IDOR Protected)</span>
            </div>
          </div>
          <div
            style={{
              padding: '1rem',
              background: 'rgba(230, 57, 70, 0.08)',
              border: '2px solid var(--color-critical)',
              marginBottom: '1.25rem',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-critical)' }}>
              {error}
            </p>
            <div className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
              You are authenticated as <strong>{user?.name} (ID: #{user?.id})</strong>. The requested Record #{id} is a confidential document owned by another user.
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              background: '#f8fafc',
              border: '2px solid var(--border-color)',
              marginBottom: '1.5rem',
            }}
          >
            <div className="flex items-center gap-1 font-bold text-sm mb-1">
              <ShieldCheck size={16} color="var(--color-success)" />
              <span>ALG-CYBER-02 IDOR Verification Insight</span>
            </div>
            <p className="text-xs text-muted mb-0" style={{ lineHeight: 1.6 }}>
              This <strong>403 Forbidden</strong> response demonstrates that the backend authorization fix is functioning correctly.
              Even though the client requested the object directly by ID (<code>/api/records/{id}</code>), the backend verified record ownership and blocked horizontal privilege escalation.
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/records" className="btn btn-primary btn-sm">
              <ArrowLeft size={14} />
              <span>Return to My Records</span>
            </Link>
            <Link to="/dashboard" className="btn btn-outline btn-sm">
              <span>Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = record?.owner_id === user?.id;
  const canModify = isOwner || isAdmin;

  return (
    <div>
      <div className="page-header flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link to="/records" className="btn btn-outline btn-sm" aria-label="Back to records">
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>
          <div>
            <h1>{record?.title}</h1>
            <p className="text-muted text-sm">
              Record #{record?.id} • Category: {record?.category} • Owner: {record?.owner_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {record?.is_private ? (
            <span className="badge badge-critical flex items-center gap-1">
              <Lock size={12} />
              <span>Private Record</span>
            </span>
          ) : (
            <span className="badge badge-info flex items-center gap-1">
              <Globe size={12} />
              <span>Public Document</span>
            </span>
          )}

          {canModify && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn btn-outline btn-sm"
                title="Edit record"
              >
                <Edit size={14} />
                <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
              </button>
              <button
                onClick={handleDeleteRecord}
                className="btn btn-outline btn-sm"
                style={{ borderColor: 'var(--color-critical)', color: 'var(--color-critical)' }}
                title="Delete record"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '900px' }}>
        {/* IDOR Exploit Notice Banner: In VULNERABLE MODE when viewing another user's private record */}
        {record?.is_private && !isOwner && !isAdmin && (
          <div
            className="alert alert-error mb-3"
            style={{ border: '3px solid var(--color-critical)', background: '#fff5f5' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={22} color="var(--color-critical)" />
              <strong style={{ fontSize: '1rem', color: 'var(--color-critical)' }}>
                VULNERABILITY DEMONSTRATION: IDOR Data Leakage Active!
              </strong>
            </div>
            <p className="text-sm mb-2" style={{ lineHeight: 1.6 }}>
              You are authenticated as <strong>{user?.name} (ID: #{user?.id})</strong>, but you are viewing a private document belonging to <strong>{record?.owner_name} (ID: #{record?.owner_id})</strong>.
            </p>
            <div className="text-xs text-muted">
              Because the system is currently in <strong>Vulnerable Mode</strong> for IDOR, the backend failed to verify record ownership.
              Apply the fix in the Security Center to enforce 403 Forbidden on this request.
            </div>
          </div>
        )}

        {/* In-place Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="card mb-3">
            <h3 className="mb-2">Edit Record Details</h3>
            <div className="form-group mb-2">
              <label>Record Title</label>
              <input
                type="text"
                className="form-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-2">
              <label>Category</label>
              <input
                type="text"
                className="form-input"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-2">
              <label>Content / Body</label>
              <textarea
                className="form-input"
                rows={6}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editIsPrivate}
                  onChange={(e) => setEditIsPrivate(e.target.checked)}
                />
                <span className="text-sm font-bold">Mark as Confidential / Private Record</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingEdit}>
                <Save size={14} />
                <span>{savingEdit ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsEditing(false)}
              >
                <span>Cancel</span>
              </button>
            </div>
          </form>
        ) : (
          /* Record Content Box */
          <article className="card mb-3">
            <div className="card-header">
              <div className="flex items-center gap-2 text-sm text-muted">
                <User size={14} />
                <span>
                  Owner: <strong>{record?.owner_name}</strong> {isOwner && '(You)'}
                </span>
                <span>•</span>
                <Calendar size={14} />
                <span>Created: {new Date(record?.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div style={{ fontSize: '1.05rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {record?.content}
            </div>
          </article>
        )}

        {/* Comments Section — XSS Testing Ground */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <h3>Comments & Internal Discussion</h3>
            </div>
            <span className="text-sm text-muted">{comments.length} Comment(s)</span>
          </div>

          {/* New Comment Form */}
          <form onSubmit={handleAddComment} className="mb-3">
            <div className="form-group">
              <label htmlFor="comment-text">Post a Note / Comment</label>
              <textarea
                id="comment-text"
                className="form-input"
                rows={3}
                placeholder="Write a message, internal memo, or testing note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-between items-center flex-wrap gap-1">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleInsertXssPayload}
                style={{ borderColor: 'var(--color-high)', color: 'var(--color-high)' }}
                title="Inserts a test image onerror payload into the comment box"
              >
                <ShieldAlert size={14} />
                <span>Insert Test XSS Payload</span>
              </button>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submittingComment}
              >
                <Send size={14} />
                <span>{submittingComment ? 'Posting...' : 'Submit Comment'}</span>
              </button>
            </div>
          </form>

          {/* Comment List */}
          {comments.length === 0 ? (
            <p className="text-sm text-muted text-center py-2">
              No comments posted on this record yet. Be the first to leave a remark!
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '0.85rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <div className="flex justify-between items-center text-sm mb-1">
                    <strong>{c.user_name || 'Staff Member'}</strong>
                    <span className="text-sm text-muted">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div
                    style={{ fontSize: '0.95rem' }}
                    dangerouslySetInnerHTML={{ __html: c.content }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
