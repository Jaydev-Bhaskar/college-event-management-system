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
  UserCircle, Calendar, Ticket, Download, PlusCircle, HelpCircle, Upload, MessageSquare, Users
} from 'lucide-react';
import Certificate from '../components/Certificate';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    title: '', description: '', category: '', date: '', time: '', location: '', maxParticipants: ''
  });
  const [requestLoading, setRequestLoading] = useState(false);

  const categories = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regsRes, invRes] = await Promise.all([
          API.get('/registrations/my-events'),
          API.get('/registrations/invitations')
        ]);
        setRegistrations(regsRes.data);
        setInvitations(invRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInvitation = async (id, status) => {
    try {
      await API.post('/registrations/invitations/respond', { registrationId: id, status });
      addToast(`Invitation ${status} successfully`, 'success');
      setInvitations(prev => prev.filter(inv => inv._id !== id));
      if (status === 'accepted') {
        const regsRes = await API.get('/registrations/my-events');
        setRegistrations(regsRes.data);
      }
    } catch (err) {
      addToast('Failed to respond to invitation', 'error');
    }
  };

  const sidebarLinks = [
    {
      title: '',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
        { path: '/dashboard/events', label: 'My Events', icon: <Calendar size={18} /> },
        { path: '/dashboard/tickets', label: 'QR Tickets', icon: <QrCode size={18} /> },
        { path: '/dashboard/certificates', label: 'Certificates', icon: <Award size={18} /> },
        { 
          path: '/dashboard', 
          label: 'Invitations', 
          icon: (
            <div style={{ position: 'relative' }}>
              <Users size={18} />
              {invitations.length > 0 && (
                <span style={{ 
                  position: 'absolute', top: -5, right: -5, 
                  background: 'var(--danger)', color: 'white', 
                  fontSize: '0.6rem', padding: '0.1rem 0.3rem', 
                  borderRadius: 'var(--radius-full)', border: '2px solid white' 
                }}>
                  {invitations.length}
                </span>
              )}
            </div>
          ) 
        },
        { path: '/dashboard/feedback', label: 'Pending Feedback', icon: <MessageSquare size={18} /> },
        { path: '/profile', label: 'Profile', icon: <UserCircle size={18} /> },
      ]
    },
    {
      title: 'ORGANIZER',
      items: (user?.role === 'organizer' || user?.baseRole === 'teacher' || user?.role === 'admin') ? [
        { path: '/organizer', label: 'Back to Portal', icon: <LayoutDashboard size={18} /> },
      ] : [
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

  // Robust date parser that handles timezones properly
  const getEventEndDateTime = (evt) => {
    if (!evt) return null;
    const targetDateStr = evt.endDate || evt.date;
    if (!targetDateStr) return null;

    const datePart = targetDateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    const targetTimeStr = evt.endTime || evt.time || "23:59";
    const [hours, minutes] = targetTimeStr.split(':').map(Number);

    return new Date(year, month - 1, day, isNaN(hours) ? 23 : hours, isNaN(minutes) ? 59 : minutes, 0);
  };

  const upcomingRegs = registrations.filter((r) => {
    const endDate = getEventEndDateTime(r.eventId);
    if (!endDate) return false;
    return endDate > new Date();
  });
  const attendedCount = registrations.filter(r => r.attendanceStatus === 'present').length;

  // Get the nearest upcoming registration for QR ticket display
  const nextEvent = upcomingRegs.sort((a, b) =>
    new Date(a.eventId?.date) - new Date(b.eventId?.date)
  )[0];

  const getDaysUntil = (evt) => {
    const eventEnd = getEventEndDateTime(evt);
    if (!eventEnd) return '';
    const today = new Date();
    
    // Check if it's currently active (between start and end)
    const eventStartStr = evt.date;
    if (eventStartStr) {
      const [sYear, sMonth, sDay] = eventStartStr.split('T')[0].split('-').map(Number);
      const sTimeStr = evt.time || "00:00";
      const [sHours, sMinutes] = sTimeStr.split(':').map(Number);
      const eventStart = new Date(sYear, sMonth - 1, sDay, isNaN(sHours) ? 0 : sHours, isNaN(sMinutes) ? 0 : sMinutes, 0);
      
      if (today >= eventStart && today < eventEnd) return 'HAPPENING NOW';
    }

    const diff = Math.round((eventEnd - today) / (1000 * 60 * 60 * 24));
    
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

  // The old manual canvas logic is now replaced by the automated Certificate component
  const [activeCertificate, setActiveCertificate] = useState(null);

  const renderContent = () => {
    if (path === '/dashboard/host') {
      // If user is a teacher or already an organizer, redirect to organizer portal
      if (user?.baseRole === 'teacher' || user?.role === 'organizer' || user?.role === 'admin') {
        setTimeout(() => navigate('/organizer'), 0);
        return <div className="spinner-overlay"><div className="spinner" /></div>;
      }

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
                        {getDaysUntil(evt)}
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
    
    if (path === '/dashboard/certificates') {
      const eligibleRegs = registrations.filter(r => r.attendanceStatus === 'present');

      return (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>My Achievement Certificates</h2>
          {eligibleRegs.length === 0 ? (
            <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
              <Award size={48} />
              <h3>No Certificates Yet</h3>
              <p>Your certificates will automatically appear here once your attendance is marked 'Present' for an event.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
              {eligibleRegs.map(r => {
                const eventEnd = getEventEndDateTime(r.eventId);
                const hasEnded = eventEnd && eventEnd <= new Date();
                const feedbackRequired = r.eventId?.feedbackForm?.status === 'published';
                const feedbackDone = r.feedbackSubmitted;
                
                let isDisabled = false;
                let reason = "";

                if (!hasEnded) {
                  isDisabled = true;
                  reason = "Available after event concludes";
                } else if (feedbackRequired && !feedbackDone) {
                  isDisabled = true;
                  reason = "Submit feedback to unlock";
                }

                // Pass the lock state to the Certificate component
                const regWithLock = { ...r, disabled: isDisabled, disabledReason: reason };

                return (
                  <div key={r._id} className="glass-card-static certificate-card" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    padding: '2rem 1.5rem', 
                    alignItems: 'center', 
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.3s ease'
                  }}>
                    {/* Verified Badge - Subtler Ribbon */}
                    <div style={{
                      position: 'absolute', top: 12, right: -30,
                      background: isDisabled ? '#94A3B8' : '#059669', 
                      color: 'white',
                      fontSize: '0.6rem', fontWeight: 800, padding: '0.25rem 3rem',
                      transform: 'rotate(45deg)', textTransform: 'uppercase',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      zIndex: 10
                    }}>
                      {isDisabled ? 'Pending' : 'Verified'}
                    </div>

                    <div style={{ 
                      width: '64px', height: '64px', 
                      background: isDisabled ? 'var(--bg-body)' : 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', 
                      borderRadius: 'var(--radius-full)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '1.25rem', color: isDisabled ? '#94A3B8' : '#059669',
                      border: '2px solid white',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <Award size={32} />
                    </div>
                    
                    <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {r.eventId?.title}
                      </h3>
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        fontSize: '0.75rem', color: 'var(--text-secondary)',
                        background: 'var(--bg-body)', padding: '0.25rem 0.75rem',
                        borderRadius: 'var(--radius-full)', border: '1px solid var(--border)'
                      }}>
                        <Calendar size={12} /> {r.eventId?.date ? new Date(r.eventId.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                      </div>
                    </div>

                    <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                      <Certificate 
                        registration={regWithLock} 
                        event={r.eventId} 
                        onDownloadComplete={() => addToast('Professional certificate saved!', 'success')} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    

    if (path === '/dashboard/feedback') {
      const pastEvents = registrations.filter((r) => {
        if (!r.eventId) return false;
        if (r.feedbackSubmitted) return false;
        
        const endDate = getEventEndDateTime(r.eventId);
        if (!endDate) return false;
        
        return endDate <= new Date();
      });

      return (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Pending Feedback Forms</h2>
          {pastEvents.length === 0 ? (
           <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
             <MessageSquare size={48} />
             <h3>No pending feedback forms</h3>
             <p>Your feedback forms will appear here exactly when your registered events conclude.</p>
           </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pastEvents.map(r => (
                <div key={r._id} className="glass-card-static" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{r.eventId.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Event concluded on {new Date(r.eventId.endDate || r.eventId.date).toLocaleDateString()}</p>
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

        {/* Team Invitations */}
        {invitations.length > 0 && (
          <div className="mb-4">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} style={{ color: 'var(--primary)' }} /> Team Invitations
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {invitations.map(inv => (
                <div key={inv._id} className="glass-card-static" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '4px solid var(--primary)' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{inv.eventId?.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Invited by <strong style={{ color: 'var(--text-primary)' }}>{inv.userId?.name}</strong> to join team <strong style={{ color: 'var(--text-primary)' }}>"{inv.teamName}"</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      onClick={() => handleInvitation(inv._id, 'accepted')}
                    >
                      Accept
                    </button>
                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      onClick={() => handleInvitation(inv._id, 'declined')}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                          {getDaysUntil(evt)}
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
