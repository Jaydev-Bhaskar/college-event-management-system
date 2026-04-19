import { useAuth } from '../context/AuthContext';
import { User, Mail, Building2, ShieldCheck, Calendar } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="badge badge-danger">Admin</span>;
      case 'organizer': return <span className="badge badge-info">Organizer</span>;
      case 'teacher': return <span className="badge badge-warning">Teacher</span>;
      default: return <span className="badge badge-success">Student</span>;
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  }) : '—';

  const infoItems = [
    { icon: <User size={18} />, label: 'Full Name', value: user.name, bg: 'var(--primary-light)', color: 'var(--primary)' },
    { icon: <Mail size={18} />, label: 'Email', value: user.email, bg: 'var(--accent-light)', color: 'var(--accent)' },
    { icon: <Building2 size={18} />, label: 'Department', value: user.department || 'Not specified', bg: 'var(--info-light)', color: 'var(--info)' },
    { icon: <ShieldCheck size={18} />, label: 'Role', value: user.role, bg: 'var(--warning-light)', color: 'var(--warning)' },
  ];

  return (
    <div className="page-container">
      <div className="page-inner" style={{ maxWidth: '700px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>My Profile</h1>

        <div className="glass-card-static mb-3">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="profile-avatar" style={{ width: 56, height: 56, fontSize: '1.2rem' }}>
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{user.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</p>
              <div style={{ marginTop: '0.35rem' }}>{getRoleBadge(user.role)}</div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '0 -1.5rem 1.5rem' }} />

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {infoItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: item.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: item.color, flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, textTransform: item.label === 'Role' ? 'capitalize' : 'none' }}>{item.value}</div>
                </div>
              </div>
            ))}

            {user.createdAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: 'var(--success-light)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--success)', flexShrink: 0
                }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Member Since</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatDate(user.createdAt)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
