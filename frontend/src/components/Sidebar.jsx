import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  User,
  LogOut,
  FileCheck2,
  FileQuestion,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
        style={{ display: isOpen ? 'block' : 'none' }}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation">
        <div className="sidebar-brand">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={26} color="#ffffff" />
            <h2>SecureApp</h2>
          </div>
          <span>{isAdmin ? 'Security Operations Console' : 'Business Portal'}</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">
            {isAdmin ? 'Admin Management' : 'My Workspace'}
          </div>
          <NavLink to="/dashboard" className={navClass} onClick={onClose}>
            <LayoutDashboard size={18} />
            <span>{isAdmin ? 'Admin Dashboard' : 'My Dashboard'}</span>
          </NavLink>
          <NavLink to="/records" className={navClass} onClick={onClose}>
            <FileText size={18} />
            <span>{isAdmin ? 'All Business Records' : 'My Records'}</span>
          </NavLink>
          <NavLink to="/profile" className={navClass} onClick={onClose}>
            <User size={18} />
            <span>My Profile</span>
          </NavLink>

          {/* ADMIN ONLY: Security Assessment & Audit */}
          {isAdmin && (
            <>
              <div className="sidebar-section-label">Security Management</div>
              <NavLink to="/security" className={navClass} onClick={onClose}>
                <Lock size={18} />
                <span>Security Center</span>
              </NavLink>
              <NavLink to="/security/report" className={navClass} onClick={onClose}>
                <FileCheck2 size={18} />
                <span>Security Report</span>
              </NavLink>
            </>
          )}

          <div className="sidebar-section-label">Compliance & Legal</div>
          <NavLink to="/privacy" className={navClass} onClick={onClose}>
            <FileQuestion size={18} />
            <span>Privacy Policy</span>
          </NavLink>
          <NavLink to="/terms" className={navClass} onClick={onClose}>
            <FileQuestion size={18} />
            <span>Terms of Use</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="mb-2">
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              {user?.name || 'Authenticated User'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
              {user?.email}
            </div>
            <div style={{ marginTop: '6px' }}>
              {isAdmin ? (
                <span
                  style={{
                    display: 'inline-block',
                    background: 'var(--color-critical)',
                    color: '#fff',
                    padding: '2px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Admin Authority
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    padding: '2px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Standard Member
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline btn-sm w-full"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
