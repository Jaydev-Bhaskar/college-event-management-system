import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import { CalendarDays, Clock, DollarSign, MapPin, ArrowLeft, Share2 } from 'lucide-react';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await API.get(`/events/${id}`);
        setEvent(res.data);

        if (user) {
          try {
            const regRes = await API.get('/registrations/my-events');
            const found = regRes.data.find(r => r.eventId?._id === id);
            if (found) setRegistration(found);
          } catch {}
        }
      } catch (err) {
        addToast('Event not found', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) {
      addToast('Please login to register', 'warning');
      return;
    }
    setRegLoading(true);
    try {
      const res = await API.post(`/registrations/register/${id}`);
      setRegistration(res.data.registration);
      addToast('Registered successfully! 🎉', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setRegLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  }) : 'TBD';

  const formatTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const start = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${start} - 05:00 PM`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="spinner-overlay"><div className="spinner" /></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Event not found</h3>
          <Link to="/events" className="btn btn-primary">Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-inner" style={{ maxWidth: 1000 }}>
        {/* Hero Banner */}
        <div style={{
          background: event.posterImage 
            ? `url(${event.posterImage}) center/cover`
            : 'linear-gradient(135deg, #F1F5F9, #E2E8F0)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          position: 'relative',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          {event.category && (
            <span style={{
              display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.75rem',
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.65rem',
              width: 'fit-content'
            }}>
              {event.category}
            </span>
          )}
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {event.title}
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: 550 }}>
            {event.description?.slice(0, 150)}
          </p>
          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem' }}>
            {!registration ? (
              <button className="btn btn-primary" onClick={handleRegister} disabled={regLoading}>
                {regLoading ? 'Registering...' : 'Register Now'}
              </button>
            ) : (
              <span className="badge badge-success" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                ✓ Registered
              </span>
            )}
            <button className="btn btn-ghost">Add to Calendar</button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="event-detail-grid">
          {/* Left — About */}
          <div>
            <div className="glass-card-static mb-3">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>About the Event</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                {event.description || 'No description provided for this event.'}
              </p>
            </div>

            {/* Location */}
            {event.location && (
              <div className="glass-card-static">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Location</h2>
                <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{event.location}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>University Central Campus</p>
              </div>
            )}
          </div>

          {/* Right — Info Sidebar */}
          <div>
            <div className="glass-card-static mb-3">
              {/* Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CalendarDays size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Date</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatDate(event.date)}</div>
                </div>
              </div>

              {/* Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Time</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatTime(event.date)}</div>
                </div>
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-md)',
                  background: '#D1FAE5', color: '#059669',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Price</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Free Entry</div>
                </div>
              </div>

              {/* Claim Ticket */}
              {registration ? (
                <button className="btn btn-primary btn-lg" style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}>
                  Claim Ticket
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
                  onClick={handleRegister} disabled={regLoading}>
                  {regLoading ? 'Registering...' : 'Claim Ticket'}
                </button>
              )}
            </div>

            {/* Organized By */}
            <div className="glass-card-static mb-3">
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: '0.5rem' }}>
                Organized By
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div className="participant-avatar" style={{ width: 36, height: 36, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {event.organizerId?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{event.organizerId?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.organizerId?.department || 'Event Organizer'}</div>
                </div>
              </div>
              <a href="#" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>Contact Organizer</a>
            </div>

            {/* Share */}
            <div className="glass-card-static">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.65rem' }}>Share this event</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>Twitter</button>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>LinkedIn</button>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>Copy Link</button>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code */}
        {registration?.qrCode && (
          <div className="glass-card-static" style={{ marginTop: '1.5rem', textAlign: 'center', maxWidth: 400, margin: '1.5rem auto' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Your Entry Pass</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Scan for fast-track entry
            </p>
            <div className="qr-container" style={{ margin: '0 auto' }}>
              <img src={registration.qrCode} alt="QR Code" />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Download PDF</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer" style={{ marginTop: '3rem' }}>
        <div className="footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>© {new Date().getFullYear()} EventHub College Management</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Privacy Policy</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Terms of Service</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
