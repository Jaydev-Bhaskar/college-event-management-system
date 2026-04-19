import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';

export default function EventCard({ event }) {
  if (!event) return null;

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
      ' • ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'Technical': return 'TECH';
      case 'Cultural': return 'ARTS';
      case 'Sports': return 'SPORTS';
      case 'Workshop': return 'WORKSHOP';
      default: return cat?.toUpperCase() || 'EVENT';
    }
  };

  return (
    <Link to={`/events/${event._id}`} style={{ textDecoration: 'none' }}>
      <div className="event-card">
        <div className="event-card-image" style={{
          background: event.posterImage
            ? `url(${event.posterImage}) center/cover no-repeat`
            : 'linear-gradient(135deg, #0F766E, #115E59)'
        }}>
          {event.category && (
            <span className="event-category-badge">
              {getCategoryLabel(event.category)}
            </span>
          )}
          {!event.posterImage && (
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '2rem', fontWeight: 800 }}>
              {getCategoryLabel(event.category)}
            </span>
          )}
        </div>

        <div className="event-card-body">
          <h3 className="event-card-title">{event.title}</h3>
          <div className="event-card-meta">
            <span className="event-card-meta-item">
              <CalendarDays size={12} /> {formatDate(event.date)}
            </span>
            {event.location && (
              <span className="event-card-meta-item">
                <MapPin size={12} /> {event.location}
              </span>
            )}
          </div>
        </div>

        <div className="event-card-footer">
          <span className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
