import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  ArrowRight, GraduationCap, CalendarDays, MapPin, ExternalLink
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get('/events');
        setEvents(res.data.slice(0, 3));
      } catch (err) { console.error(err); }
    };
    fetchEvents();
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'organizer': return '/organizer';
      default: return '/dashboard';
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'Technical': return { bg: '#DBEAFE', color: '#2563EB', label: 'TECH' };
      case 'Cultural': return { bg: '#FEF3C7', color: '#D97706', label: 'ARTS' };
      case 'Sports': return { bg: '#D1FAE5', color: '#059669', label: 'SPORTS' };
      default: return { bg: '#EDE9FE', color: '#7C3AED', label: cat?.toUpperCase() || 'EVENT' };
    }
  };

  return (
    <div style={{ background: 'var(--bg-body)' }}>
      {/* --- Navbar --- */}
      <nav className="navbar">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon"><GraduationCap size={16} /></div>
          UniEvents
        </Link>
        <div className="navbar-links">
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Home</Link>
          <Link to="/events">Events</Link>
          {user ? (
            <Link to={getDashboardPath()} className="btn btn-primary btn-sm">Dashboard</Link>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* --- Hero --- */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" />
            LIVE CAMPUS HUB
          </div>

          <h1 className="hero-title">
            Campus Events,<br />
            <span className="gradient-text">Simplified.</span>
          </h1>

          <p className="hero-subtitle">
            Discover, organize, and manage university events all in one place. Stay connected with your campus community through workshops, festivals, and tech talks.
          </p>

          <div className="hero-actions">
            <Link to="/events" className="btn btn-primary btn-lg">
              Explore Events <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="btn btn-ghost btn-lg">
              Host an Event
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        <div className="hero-image-container">
          <div className="hero-image-card" style={{
            background: 'linear-gradient(135deg, #93C5FD, #A5B4FC)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <GraduationCap size={64} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
              <p style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.8 }}>Campus Life</p>
            </div>
            {/* Floating card */}
            <div className="hero-floating-card">
              <CalendarDays size={18} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Next Big Meetup</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Hackathon 2024 • Starts in 2 days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Upcoming Events --- */}
      <section className="features-section" style={{ background: 'var(--bg-body)' }}>
        <div className="flex-between mb-3">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Upcoming Events</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Don't miss out on these featured campus activities</p>
          </div>
          <Link to="/events" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontWeight: 500 }}>
            View all events <ExternalLink size={14} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          {events.length > 0 ? events.map((event) => {
            const catStyle = getCategoryStyle(event.category);
            return (
              <div className="event-card" key={event._id}>
                <div className="event-card-image" style={{
                  background: event.posterImage 
                    ? `url(${event.posterImage}) center/cover`
                    : 'linear-gradient(135deg, #0F766E, #115E59)',
                  height: 200
                }}>
                  <span className="event-category-badge" style={{ background: catStyle.bg, color: catStyle.color }}>
                    {catStyle.label}
                  </span>
                </div>
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                    <CalendarDays size={13} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>{formatDate(event.date)}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>{event.title}</h3>
                  {event.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <MapPin size={12} /> {event.location}
                    </div>
                  )}
                </div>
                <div style={{ padding: '0 1.25rem 1rem' }}>
                  <Link to={`/events/${event._id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Register Now
                  </Link>
                </div>
              </div>
            );
          }) : (
            /* Placeholder cards when no DB */
            [{title:'Annual Tech Symposium', loc:'Main Grand Hall', cat:'TECH', date:'Oct 15, 2024'},
             {title:'Spring Music Festival', loc:'Campus Green Area', cat:'ARTS', date:'Nov 02, 2024'},
             {title:'Career Fair 2024', loc:'Student Center Level 2', cat:'CAREER', date:'Nov 10, 2024'}
            ].map((e, i) => (
              <div className="event-card" key={i}>
                <div className="event-card-image" style={{
                  height: 200,
                  background: ['linear-gradient(135deg, #0F766E, #115E59)',
                               'linear-gradient(135deg, #92400E, #D97706)',
                               'linear-gradient(135deg, #0D9488, #5EEAD4)'][i]
                }}>
                  <span className="event-category-badge" style={{
                    background: ['#DBEAFE','#FEF3C7','#D1FAE5'][i],
                    color: ['#2563EB','#D97706','#059669'][i]
                  }}>{e.cat}</span>
                </div>
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                    <CalendarDays size={13} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>{e.date}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>{e.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <MapPin size={12} /> {e.loc}
                  </div>
                </div>
                <div style={{ padding: '0 1.25rem 1rem' }}>
                  <Link to="/events" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Register Now
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* --- CTA --- */}
      <section style={{ padding: '2rem 2rem 3rem', maxWidth: 'var(--container-max)', margin: '0 auto' }}>
        <div className="cta-section">
          <h2>Ready to host your own event?</h2>
          <p>Empower your organization. Get started with our easy-to-use event planning tools and reach thousands of students instantly.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-lg" style={{ background: 'white', color: 'var(--accent-bg)', fontWeight: 700 }}>
              Create Event
            </Link>
            <Link to="/events" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="footer">
        <div className="footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="logo-icon" style={{ width: 24, height: 24, borderRadius: 4 }}>
              <GraduationCap size={12} />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>UniEvents</span>
          </div>
          <p>© {new Date().getFullYear()} University Events Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
