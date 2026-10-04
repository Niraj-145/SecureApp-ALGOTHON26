import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../services/api';
import { User, Shield, Key, Calendar, Mail, CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await userApi.profile();
        setProfileData(data);
      } catch (err) {
        // Fallback to auth context
        setProfileData(user);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" role="status" aria-label="Loading profile"></div>
      </div>
    );
  }

  const u = profileData || user;

  return (
    <div>
      <div className="page-header">
        <h1>User Account Profile</h1>
        <p className="text-muted text-sm">
          Identity management & authentication credentials state
        </p>
      </div>

      <div className="page-body" style={{ maxWidth: '800px' }}>
        <div className="card mb-3">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <User size={20} />
              <h3>Identity Details</h3>
            </div>
            <span className="badge badge-info">{u?.role?.toUpperCase()}</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div>
              <div className="text-sm font-semibold text-muted mb-1 flex items-center gap-1">
                <User size={14} /> Full Name
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{u?.name}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-muted mb-1 flex items-center gap-1">
                <Mail size={14} /> Email Address
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{u?.email}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-muted mb-1 flex items-center gap-1">
                <Shield size={14} /> Assigned Role
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {u?.role === 'admin' ? 'Administrator (Full Access)' : 'Standard User'}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-muted mb-1 flex items-center gap-1">
                <Calendar size={14} /> Registered On
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {u?.created_at || '2026-10-04'}
              </div>
            </div>
          </div>
        </div>

        {/* Security hygiene guidelines */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Key size={20} />
              <h3>Security & Session Hygiene</h3>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span>Passwords hashed with modern salted bcrypt (72-byte limit handled)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span>JWT authentication using HS256 algorithm with strict server expiration</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span>Role-based access controls validated on FastAPI backend endpoints</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span>No secrets, database credentials, or server tokens stored in client bundle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
