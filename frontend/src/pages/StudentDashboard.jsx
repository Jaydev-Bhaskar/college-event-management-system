import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import EventCard from '../components/EventCard';
import { LayoutDashboard, CalendarDays, QrCode, Search,
  Award, Zap, MapPin, Clock,
  UserCircle, Calendar, Ticket, Download, PlusCircle, HelpCircle, Upload, MessageSquare
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    title: '', description: '', category: '', date: '', time: '', location: '', maxParticipants: ''
  });
  const [requestLoading, setRequestLoading] = useState(false);

  const categories = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon'];

  const sidebarLinks = [
    {
      title: '',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
        { path: '/dashboard/events', label: 'My Events', icon: <Calendar size={18} /> },
        { path: '/dashboard/tickets', label: 'QR Tickets', icon: <QrCode size={18} /> },
        { path: '/dashboard/certificates', label: 'Certificates', icon: <Award size={18} /> },
        { path: '/dashboard/feedback', label: 'Pending Feedback', icon: <MessageSquare size={18} /> },
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

  const upcomingRegs = registrations.filter((r) => {
    if (!r.eventId || !r.eventId.date) return false;
    const eventDate = new Date(r.eventId.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    return eventDate >= today;
  });
  const attendedCount = registrations.filter(r => r.attendanceStatus === 'present').length;

  // Get the nearest upcoming registration for QR ticket display
  const nextEvent = upcomingRegs.sort((a, b) =>
    new Date(a.eventId?.date) - new Date(b.eventId?.date)
  )[0];

  const getDaysUntil = (d) => {
    if (!d) return '';
    const eventD = new Date(d);
    const todayD = new Date();
    eventD.setHours(0, 0, 0, 0);
    todayD.setHours(0, 0, 0, 0);
    const diff = Math.round((eventD - todayD) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'TOMORROW';
    if (diff < 0) return 'COMPLETED';
    return `IN ${diff} DAYS`;
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.date) {
      addToast('Title, description, and date are required', 'warning');
      return;
    }
    setRequestLoading(true);
    try {
      await API.post('/organizer/request', {
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      });
      addToast('Organizer request submitted successfully! Pending admin approval.', 'success');
      setForm({ title: '', description: '', category: '', date: '', time: '', location: '', maxParticipants: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setRequestLoading(false);
    }
  };

  const location = useLocation();
  const path = location.pathname;

  const renderContent = () => {
    if (path === '/dashboard/host') {
      return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Host a New Event</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Submit a proposal to host an event on campus. Provide all necessary information to help students discover your event.
            </p>
          </div>
          <div className="glass-card-static" style={{ padding: '2rem' }}>
            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem', background: 'var(--bg-body)' }}>
              <Upload size={28} style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'inline-block' }} />
              <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>Click to upload or drag and drop Event Poster</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SVG, PNG, JPG or GIF (max. 10MB)</p>
            </div>

            <form onSubmit={handleRequestSubmit}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input className="form-input" placeholder="e.g. Annual Tech Symposium 2024" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="4" placeholder="Tell everyone what the event is about..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Participants</label>
                  <input type="number" className="form-input" placeholder="50" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
                </div>
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                <MapPin size={16} style={{ color: 'var(--danger)' }} /> Time & Location
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input type="time" className="form-input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="e.g. Main Auditorium, Block C" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>

              <div style={{ background: 'var(--warning-light)', color: 'var(--warning)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', gap: '0.75rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
                <HelpCircle size={18} style={{ flexShrink: 0 }} />
                <span>
                  By submitting this request, your Hod/Admin will review your proposal. Upon approval, you will be granted full Organizer privileges for this Event to manage and view analytics.
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={requestLoading}>
                  {requestLoading ? 'Submitting Proposal...' : <>Submit Proposal</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    if (path === '/dashboard/events') {
      return (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>My Registered Events</h2>
          {upcomingRegs.length === 0 ? (
            <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
              <CalendarDays size={48} />
              <h3>No upcoming events</h3>
              <p>Browse events and register for something exciting!</p>
              <Link to="/events" className="btn btn-primary btn-sm">Browse Events</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
              {upcomingRegs.map((r) => {
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
      );
    }
    
    if (path === '/dashboard/tickets') {
      return (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>QR Tickets</h2>
          {upcomingRegs.length === 0 ? (
            <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
              <QrCode size={48} />
              <h3>No tickets yet</h3>
              <p>Register for an event to get your QR ticket.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {upcomingRegs.map(r => {
                if (!r.eventId) return null;
                return (
                  <div key={r._id} className="glass-card-static" style={{ textAlign: 'center' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.15rem' }}>
                      {r.eventId.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Student Entry Ticket
                    </p>

                    {r.qrCode ? (
                      <div className="qr-container" style={{ margin: '0 auto 1rem' }}>
                        <img src={r.qrCode} alt="QR Code" style={{ width: 160, height: 160 }} />
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
                      <span style={{ fontWeight: 600 }}>#EVENT-{r._id?.slice(-4).toUpperCase()}</span>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                      <Download size={14} /> Download Pass
                    </button>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Scan at the entrance gate
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      );
    }
    

    if (path === '/dashboard/feedback') {
      const pastEvents = registrations.filter((r) => {
        if (!r.eventId || !r.eventId.date) return false;
        const eventDate = new Date(r.eventId.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate < today; 
      });

      return (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Pending Feedback Forms</h2>
          {pastEvents.length === 0 ? (
           <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
             <MessageSquare size={48} />
             <h3>No pending feedback forms</h3>
             <p>Your feedback forms will appear here after your registered events conclude.</p>
           </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pastEvents.map(r => (
                <div key={r._id} className="glass-card-static" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{r.eventId.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Event concluded on {new Date(r.eventId.date).toLocaleDateString()}</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => window.location.href = `/feedback/student/${r.eventId._id}`}>
                    Submit Feedback
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Default overview
    return (
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
    );
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
          renderContent()
        )}
      </main>
    </div>
  );
}
