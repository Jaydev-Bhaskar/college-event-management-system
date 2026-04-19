import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import EventCard from '../components/EventCard';
import {
  LayoutDashboard, CalendarDays, QrCode, Search,
  Award, Zap, MapPin, Clock,
  UserCircle, Calendar, Ticket, Download
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    {
      title: '',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
        { path: '/dashboard/events', label: 'My Events', icon: <Calendar size={18} /> },
        { path: '/dashboard/tickets', label: 'QR Tickets', icon: <QrCode size={18} /> },
        { path: '/dashboard/certificates', label: 'Certificates', icon: <Award size={18} /> },
        { path: '/profile', label: 'Profile', icon: <UserCircle size={18} /> },
      ]
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/registrations/my-events');
        setRegistrations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const upcomingRegs = registrations.filter(
    (r) => r.eventId && new Date(r.eventId.date) > new Date()
  );
  const attendedCount = registrations.filter(r => r.attendanceStatus === 'present').length;

  // Get the nearest upcoming registration for QR ticket display
  const nextEvent = upcomingRegs.sort((a, b) =>
    new Date(a.eventId?.date) - new Date(b.eventId?.date)
  )[0];

  const getDaysUntil = (d) => {
    if (!d) return '';
    const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'TOMORROW';
    return `IN ${diff} DAYS`;
  };

  return (
    <div className="dashboard-layout">
      <Sidebar links={sidebarLinks} />

      <main className="dashboard-content">
        {/* Header */}
        <div className="flex-between mb-4">
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.2rem' }}>
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              You have {upcomingRegs.length} event{upcomingRegs.length !== 1 ? 's' : ''} coming up this week.
            </p>
          </div>
          <div className="search-bar" style={{ minWidth: 220 }}>
            <Search size={14} />
            <input placeholder="Search events..." />
          </div>
        </div>

        {loading ? (
          <div className="spinner-overlay"><div className="spinner" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card blue">
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Events Attended</span>
                  <span style={{ color: 'var(--success)' }}>✓</span>
                </div>
                <div className="stat-value">{attendedCount}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>+2 this month</span>
              </div>

              <div className="stat-card amber">
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Certificates Earned</span>
                  <span style={{ color: 'var(--warning)' }}>🏆</span>
                </div>
                <div className="stat-value">{Math.floor(attendedCount * 0.7)}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>+1 this month</span>
              </div>

              <div className="stat-card purple">
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Points Earned</span>
                  <span style={{ color: '#7C3AED' }}>⚡</span>
                </div>
                <div className="stat-value">{attendedCount * 120 + 50}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top 5% student</span>
              </div>
            </div>

            {/* Two Column - Events & QR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
              {/* Registered Events */}
              <div>
                <div className="flex-between mb-2">
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>My Registered Events</h2>
                  <Link to="/events" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--primary)' }}>View all</Link>
                </div>

                {upcomingRegs.length === 0 ? (
                  <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
                    <CalendarDays size={48} />
                    <h3>No upcoming events</h3>
                    <p>Browse events and register for something exciting!</p>
                    <Link to="/events" className="btn btn-primary btn-sm">Browse Events</Link>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {upcomingRegs.slice(0, 4).map((r) => {
                      const evt = r.eventId;
                      if (!evt) return null;
                      return (
                        <Link to={`/events/${evt._id}`} key={r._id} className="event-card" style={{ textDecoration: 'none' }}>
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
                              {getDaysUntil(evt.date)}
                            </span>
                          </div>
                          <div className="event-card-body" style={{ padding: '0.75rem 1rem' }}>
                            <h3 className="event-card-title" style={{ fontSize: '0.95rem' }}>{evt.title}</h3>
                            <div className="event-card-meta" style={{ fontSize: '0.7rem' }}>
                              <span className="event-card-meta-item"><MapPin size={11} /> {evt.location || 'TBD'}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* QR Ticket */}
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.85rem' }}>Your Next QR Ticket</h2>

                {nextEvent ? (
                  <div className="glass-card-static" style={{ textAlign: 'center' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.15rem' }}>
                      {nextEvent.eventId?.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Student Entry Ticket
                    </p>

                    {nextEvent.qrCode ? (
                      <div className="qr-container" style={{ margin: '0 auto 1rem' }}>
                        <img src={nextEvent.qrCode} alt="QR Code" style={{ width: 160, height: 160 }} />
                      </div>
                    ) : (
                      <div style={{
                        width: 160, height: 160, margin: '0 auto 1rem',
                        background: 'var(--bg-body)', borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px dashed var(--border)'
                      }}>
                        <QrCode size={40} style={{ color: 'var(--primary)', opacity: 0.3 }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid var(--border)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Ticket ID</span>
                      <span style={{ fontWeight: 600 }}>#EVENT-{nextEvent._id?.slice(-4).toUpperCase()}</span>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                      <Download size={14} /> Download Pass
                    </button>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Scan at the entrance gate
                    </p>
                  </div>
                ) : (
                  <div className="glass-card-static empty-state" style={{ padding: '2rem' }}>
                    <QrCode size={40} />
                    <h3 style={{ fontSize: '0.95rem' }}>No tickets yet</h3>
                    <p>Register for an event to get your QR ticket.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* User footer in sidebar */}
    </div>
  );
}
