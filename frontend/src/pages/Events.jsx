import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { Search, CalendarDays, MapPin, Grid3X3, Monitor, Palette, Trophy, Wrench } from 'lucide-react';

const categories = [
  { label: 'All Events', icon: <Grid3X3 size={14} />, value: '' },
  { label: 'Tech', icon: <Monitor size={14} />, value: 'Technical' },
  { label: 'Arts', icon: <Palette size={14} />, value: 'Cultural' },
  { label: 'Sports', icon: <Trophy size={14} />, value: 'Sports' },
  { label: 'Workshops', icon: <Wrench size={14} />, value: 'Workshop' },
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get('/events');
        setEvents(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    let result = events;
    if (category) result = result.filter((e) => e.category === category);
    if (search) result = result.filter((e) =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, category, events]);

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
      ' • ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Technical': return { bg: '#DBEAFE', color: '#2563EB' };
      case 'Cultural': return { bg: '#FEF3C7', color: '#D97706' };
      case 'Sports': return { bg: '#D1FAE5', color: '#059669' };
      case 'Workshop': return { bg: '#EDE9FE', color: '#7C3AED' };
      default: return { bg: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <div className="page-container">
      <div className="page-inner">
        {/* Hero Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
            Discover what's happening.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 500 }}>
            Join the most exciting technical, cultural, and sports events across the campus.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              placeholder="Search events by name, club, or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => {}}>
            Search Events
          </button>
        </div>

        {/* Category Filters */}
        <div className="filter-bar">
          {categories.map((c) => (
            <button
              key={c.value}
              className={`filter-chip ${category === c.value ? 'active' : ''}`}
              onClick={() => setCategory(c.value)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="spinner-overlay"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <CalendarDays size={56} />
            <h3>No events found</h3>
            <p>Try changing your search or filter criteria.</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              {filtered.map((event) => {
                const catStyle = getCategoryColor(event.category);
                return (
                  <div className="event-card" key={event._id}>
                    {/* Image area */}
                    <div className="event-card-image" style={{
                      background: event.posterImage
                        ? `url(${event.posterImage}) center/cover`
                        : 'linear-gradient(135deg, #0F766E, #115E59)'
                    }}>
                      {event.category && (
                        <span className="event-category-badge" style={{
                          background: catStyle.bg, color: catStyle.color, border: 'none'
                        }}>
                          {event.category === 'Technical' ? 'TECH' :
                           event.category === 'Cultural' ? 'ARTS' :
                           event.category === 'Sports' ? 'SPORTS' :
                           event.category?.toUpperCase()}
                        </span>
                      )}
                      {!event.posterImage && (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '3rem', fontWeight: 800 }}>
                          {event.category?.toUpperCase() || 'EVENT'}
                        </span>
                      )}
                    </div>

                    <div className="event-card-body">
                      <h3 className="event-card-title">{event.title}</h3>
                      <div className="event-card-meta">
                        <span className="event-card-meta-item">
                          <CalendarDays size={13} /> {formatDate(event.date)}
                        </span>
                        {event.location && (
                          <span className="event-card-meta-item">
                            <MapPin size={13} /> {event.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="event-card-footer">
                      <Link
                        to={`/events/${event._id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {filtered.length > 8 && (
              <div style={{ textAlign: 'center' }}>
                <button className="btn btn-ghost">Load More Events ↓</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="footer" style={{ marginTop: '2rem' }}>
        <div className="footer-inner">
          <p>© {new Date().getFullYear()} EventHub University. All campus events at your fingertips.</p>
        </div>
      </footer>
    </div>
  );
}
