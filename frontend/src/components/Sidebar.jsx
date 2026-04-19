import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Settings } from 'lucide-react';

export default function Sidebar({ links }) {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.85rem', marginBottom: '1.25rem' }}>
        <div className="logo-icon" style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <GraduationCap size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>EventHub</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {user?.role === 'admin' ? 'COLLEGE ADMIN' : user?.role === 'organizer' ? 'Organizer Portal' : 'Student Portal'}
          </div>
        </div>
      </div>

      {/* Links */}
      {links.map((section, i) => (
        <div key={i}>
          {section.title && (
            <div className="sidebar-section-title">{section.title}</div>
          )}
          {section.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      {/* User at bottom */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0 0.85rem' }}>
          <div className="profile-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.2 }}>{user?.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role || 'Student'}</div>
          </div>
          <button className="btn btn-icon btn-ghost" style={{ width: 28, height: 28 }}>
            <Settings size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
