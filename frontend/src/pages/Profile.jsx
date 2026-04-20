import { useAuth } from '../context/AuthContext';
import { 
  User, Mail, Building2, ShieldCheck, Calendar as CalendarIcon,
  LayoutDashboard, QrCode, Award, UserCircle, Users, BarChart3, Settings, FileText, UserPlus, PlusCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

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

  const getSidebarLinks = () => {
    switch (user.role) {
      case 'admin':
        return [
          {
            title: '',
            items: [
              { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
              { path: '/admin/requests', label: 'Organizer Requests', icon: <UserPlus size={18} /> },
              { path: '/admin/events', label: 'Events', icon: <CalendarIcon size={18} /> },
              { path: '/admin/students', label: 'Students', icon: <Users size={18} /> },
              { path: '/admin/po-bank', label: 'PO/PSO Bank', icon: <BarChart3 size={18} /> },
              { path: '/admin/reports', label: 'Reports', icon: <FileText size={18} /> },
            ]
          },
          {
            title: '',
            items: [
              { path: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
            ]
          }
        ];
      case 'organizer':
        return [
          {
            title: '',
            items: [
              { path: '/organizer', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
              { path: '/organizer/events', label: 'My Events', icon: <CalendarIcon size={18} /> },
              { path: '/organizer/create', label: 'Create Event', icon: <PlusCircle size={18} /> },
              { path: '/organizer/participants', label: 'Participants', icon: <Users size={18} /> },
              { path: '/organizer/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
            ]
          },
          {
            title: 'TOOLS',
            items: [
              { path: '/dashboard', label: 'My Registrations', icon: <UserCircle size={18} /> },
            ]
          }
        ];
      default:
        // Student / Teacher
        return [
          {
            title: '',
            items: [
              { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
              { path: '/dashboard/events', label: 'My Events', icon: <CalendarIcon size={18} /> },
              { path: '/dashboard/tickets', label: 'QR Tickets', icon: <QrCode size={18} /> },
              { path: '/dashboard/certificates', label: 'Certificates', icon: <Award size={18} /> },
              { path: '/profile', label: 'Profile', icon: <UserCircle size={18} /> },
            ]
          },
          {
            title: 'ORGANIZER',
            items: [
              { path: '/dashboard/host', label: 'Host an Event', icon: <PlusCircle size={18} /> },
            ]
          }
        ];
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar links={getSidebarLinks()} />
      <main className="dashboard-content">
        <div style={{ maxWidth: '700px' }}>
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
                    <CalendarIcon size={18} />
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
      </main>
    </div>
  );
}
