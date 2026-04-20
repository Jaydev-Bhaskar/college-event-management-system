import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import {
  LayoutDashboard, Users, Calendar, BarChart3, Settings, Search,
  CheckCircle2, XCircle, Clock, FileText, Bell, Moon,
  UserPlus, ShieldCheck, MapPin, Trash2, ShieldAlert
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const sidebarLinks = [
    {
      title: '',
      items: [
        { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
        { path: '/admin/requests', label: 'Organizer Requests', icon: <UserPlus size={18} /> },
        { path: '/admin/events', label: 'Events', icon: <Calendar size={18} /> },
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

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [reqRes, evtRes, usrRes] = await Promise.all([
        API.get('/admin/organizer-requests'),
        API.get('/events'),
        API.get('/admin/users'),
      ]);
      setRequests(reqRes.data);
      setEvents(evtRes.data);
      setStudents(usrRes.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      await API.post('/admin/approve-request', { requestId });
      addToast('Request approved! User is now an organizer.', 'success');
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve', 'error');
    } finally { setActionLoading(null); }
  };

  const handleReject = async (requestId) => {
    setActionLoading(requestId);
    try {
      await API.post('/admin/reject-request', { requestId });
      addToast('Request rejected.', 'info');
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reject', 'error');
    } finally { setActionLoading(null); }
  };

  const handleRevokePrivilege = async (userId) => {
    if (!window.confirm("Are you sure you want to revoke this student's organizer privileges?")) return;
    setActionLoading(userId);
    try {
      await API.post('/admin/revoke-organizer', { userId });
      addToast('Organizer privilege revoked.', 'success');
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to revoke privilege', 'error');
    } finally { setActionLoading(null); }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to permanently delete this event? This cannot be undone.")) return;
    setActionLoading(eventId);
    try {
      await API.delete(`/events/${eventId}`);
      addToast('Event deleted successfully', 'success');
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete event', 'error');
    } finally { setActionLoading(null); }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const activeEvents = events.filter(e => {
    if (!e.date) return false;
    const eventDate = new Date(e.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBD';

  const location = useLocation();
  const path = location.pathname;

  const renderContent = () => {
    if (path === '/admin/requests') {
      return (
        <>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Organizer Requests</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Review and manage student applications for event organizer privileges.
            </p>
          </div>
          <div className="glass-card-static">
            <div className="flex-between mb-2">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Pending Applications</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm">Export CSV</button>
                <button className="btn btn-ghost btn-sm">Filter</button>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <ShieldCheck size={48} />
                <h3>No Requests</h3>
                <p>No organizer requests have been submitted yet.</p>
              </div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Requester</th>
                      <th>Department</th>
                      <th>Proposed Event</th>
                      <th>Date Applied</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.filter(r => r.status === 'pending').map((req) => {
                      const initials = req.userId?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
                      return (
                        <tr key={req._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div className="participant-avatar" style={{
                                width: 32, height: 32, fontSize: '0.7rem',
                                background: ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#EDE9FE'][Math.floor(Math.random() * 4)],
                                color: ['#2563EB', '#059669', '#D97706', '#7C3AED'][Math.floor(Math.random() * 4)]
                              }}>
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.userId?.name || 'Unknown'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {req.userId?._id?.slice(-8)}</div>
                              </div>
                            </div>
                          </td>
                          <td>{req.userId?.department || 'Not specified'}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{req.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{req.description?.slice(0, 30)}</div>
                          </td>
                          <td>{formatDate(req.createdAt)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className="btn btn-sm"
                                style={{ background: 'var(--success)', color: 'white', fontSize: '0.75rem' }}
                                onClick={() => handleApprove(req._id)}
                                disabled={actionLoading === req._id}
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => handleReject(req._id)}
                                disabled={actionLoading === req._id}
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      );
    }

    if (path === '/admin/events') {
      return (
        <>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>All Events</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Manage all active and past events on the platform.
            </p>
          </div>
          {events.length === 0 ? (
            <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
              <Calendar size={48} />
              <h3>No events found</h3>
              <p>There are no events hosted on the platform yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {events.map((evt) => (
                <div key={evt._id} className="event-card">
                  <div className="event-card-image" style={{
                    height: 140,
                    background: evt.posterImage
                      ? `url(${evt.posterImage}) center/cover`
                      : 'linear-gradient(135deg, #0F766E, #1E293B)',
                    position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute', top: 8, left: 8,
                      padding: '0.2rem 0.55rem',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.65rem', fontWeight: 600
                    }}>
                      {formatDate(evt.date)}
                    </span>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDeleteEvent(evt._id)}
                      disabled={actionLoading === evt._id}
                      title="Delete Event"
                      style={{ position: 'absolute', top: 8, right: 8, background: 'var(--danger)', color: 'white', border: 'none', padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="event-card-body" style={{ padding: '1rem' }}>
                    <h3 className="event-card-title" style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{evt.title}</h3>
                    <div className="event-card-meta" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span className="event-card-meta-item"><MapPin size={12} /> {evt.location || 'TBD'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }

    if (path === '/admin/students') {
      return (
        <>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Student Directory</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              View and manage registered students within {user.department || 'the system'}.
            </p>
          </div>
          <div className="glass-card-static" style={{ overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="participant-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem', background: '#DBEAFE', color: '#2563EB' }}>
                          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{student.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{student._id.slice(-8)}</td>
                    <td>
                      {student.role === 'admin' ? (
                        <span className="badge badge-info">Admin</span>
                      ) : student.role === 'organizer' || student.privileges?.isOrganizer ? (
                        <span className="badge badge-warning">Organizer</span>
                      ) : (
                        <span className="badge badge-success">Student</span>
                      )}
                    </td>
                    <td>
                      {student.role !== 'admin' && (student.role === 'organizer' || student.privileges?.isOrganizer) && (
                        <button 
                          className="btn btn-sm" 
                          style={{ background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.75rem' }}
                          onClick={() => handleRevokePrivilege(student._id)}
                          disabled={actionLoading === student._id}
                        >
                          <ShieldAlert size={12} /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (path === '/admin/reports') {
      return (
        <>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Department Event Reports</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Access feedback, mapping, and PO/PSO analytics for all events hosted within {user.department || 'the system'}.
            </p>
          </div>
          {events.length === 0 ? (
            <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
              <FileText size={48} />
              <h3>No Reports Available</h3>
              <p>Reports will generate here once events have concluded.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {events.map((evt) => (
                <div key={evt._id} className="event-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="event-card-body" style={{ padding: '1.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <FileText size={24} style={{ color: 'var(--primary)' }} />
                      <span className="badge badge-info">{formatDate(evt.date)}</span>
                    </div>
                    <h3 className="event-card-title" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{evt.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      {evt.description?.slice(0, 60)}...
                    </p>
                  </div>
                  <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-body)' }}>
                    <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>
                      View Full Analysis
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }

    // Default Dashboard view
    return (
      <>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Platform overview and recent administrator alerts.
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card blue">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Pending</span>
            </div>
            <div className="stat-value">{pendingRequests.length}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>+12% from last week</span>
          </div>

          <div className="stat-card green">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Approved Organizers</span>
            </div>
            <div className="stat-value">{approvedRequests.length}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>+5% growth</span>
          </div>

          <div className="stat-card purple">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Events</span>
            </div>
            <div className="stat-value">{activeEvents.length}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>-2% this month</span>
          </div>
        </div>

        {/* Quick action section */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.5rem', marginTop: '1.25rem'
        }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Need help reviewing?</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Read the updated guidelines for student organization and event hosting eligibility.</p>
          </div>
          <button className="btn btn-primary btn-sm">View Guidelines</button>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar links={sidebarLinks} />

      <main className="dashboard-content">
        {/* Header */}
        <div className="flex-between mb-4">
          <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
            <Search size={14} />
            <input placeholder="Search requests, students or events..." />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-icon btn-ghost"><Bell size={18} /></button>
            <button className="btn btn-icon btn-ghost"><Moon size={18} /></button>
          </div>
        </div>

        {loading ? (
          <div className="spinner-overlay"><div className="spinner" /></div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
}
