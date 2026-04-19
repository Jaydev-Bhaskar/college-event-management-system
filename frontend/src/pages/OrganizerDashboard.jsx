import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import {
  LayoutDashboard, CalendarPlus, Users, BarChart3,
  Calendar, Eye, CheckCircle2, QrCode, Search,
  Upload, MapPin, Clock, PlusCircle, UserCircle, FileText, UserCheck
} from 'lucide-react';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: '', date: '', time: '', location: '', maxParticipants: ''
  });

  const categories = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon'];

  const sidebarLinks = [
    {
      title: '',
      items: [
        { path: '/organizer', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
        { path: '/organizer/events', label: 'My Events', icon: <Calendar size={18} /> },
        { path: '#create', label: 'Create Event', icon: <PlusCircle size={18} /> },
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

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      const mine = res.data.filter(e => e.organizerId?._id === user._id || e.organizerId === user._id);
      setMyEvents(mine);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.date) {
      addToast('Title, description, and date are required', 'warning');
      return;
    }
    setCreateLoading(true);
    try {
      await API.post('/events', {
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      });
      addToast('Event created successfully! 🎉', 'success');
      setShowCreate(false);
      setForm({ title: '', description: '', category: '', date: '', time: '', location: '', maxParticipants: '' });
      fetchEvents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create event', 'error');
    } finally { setCreateLoading(false); }
  };

  const viewParticipants = async (event) => {
    setSelectedEvent(event);
    setParticipantsLoading(true);
    try {
      const res = await API.get(`/registrations/event/${event._id}`);
      setParticipants(res.data);
    } catch (err) {
      addToast('Failed to load participants', 'error');
    } finally { setParticipantsLoading(false); }
  };

  const markAttendance = async (registrationId) => {
    try {
      await API.post('/registrations/attendance', { registrationId });
      addToast('Attendance marked!', 'success');
      if (selectedEvent) viewParticipants(selectedEvent);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to mark attendance', 'error');
    }
  };

  const totalParticipants = myEvents.reduce((acc, e) => acc + (e.maxParticipants || 0), 0);
  const upcomingCount = myEvents.filter(e => new Date(e.date) > new Date()).length;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';

  const getStatus = (d) => {
    const now = new Date();
    const date = new Date(d);
    if (date > now) return { label: 'Upcoming', color: 'badge-info' };
    return { label: 'Active', color: 'badge-success' };
  };

  const handleSidebarClick = (e) => {
    const target = e.target.closest('a[href="#create"]');
    if (target) {
      e.preventDefault();
      setShowCreate(true);
    }
  };

  return (
    <div className="dashboard-layout" onClick={handleSidebarClick}>
      <Sidebar links={sidebarLinks} />

      <main className="dashboard-content">
        <div className="flex-between mb-4">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.2rem' }}>Organizer Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="search-bar" style={{ minWidth: 200 }}>
              <Search size={14} />
              <input placeholder="Search events..." />
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <PlusCircle size={16} /> Create New Event
            </button>
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Participants</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 500 }}>↗ +12%</span>
                </div>
                <div className="stat-value">{totalParticipants.toLocaleString()}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across all your managed events</span>
              </div>

              <div className="stat-card amber">
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Events</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Steady</span>
                </div>
                <div className="stat-value">{myEvents.length}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently live and ongoing</span>
              </div>

              <div className="stat-card green">
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Attendance Rate</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 500 }}>↗ +5%</span>
                </div>
                <div className="stat-value">92%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average per event check-in</span>
              </div>
            </div>

            {/* Managed Events Table */}
            <div className="glass-card-static">
              <div className="flex-between mb-2">
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Managed Events</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overview of your current and upcoming college activities</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm">Export PDF</button>
                  <button className="btn btn-ghost btn-sm">≡ Filter</button>
                </div>
              </div>

              {myEvents.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <CalendarPlus size={48} />
                  <h3>No Events Created</h3>
                  <p>Start by creating your first campus event!</p>
                  <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Event</button>
                </div>
              ) : (
                <div style={{ overflow: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Event Name</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Registration Capacity</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myEvents.map((evt) => {
                        const status = getStatus(evt.date);
                        const capacity = evt.maxParticipants || 100;
                        const filled = Math.floor(Math.random() * capacity * 0.9);
                        const pct = Math.round((filled / capacity) * 100);
                        return (
                          <tr key={evt._id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Calendar size={14} />
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{evt.title}</span>
                              </div>
                            </td>
                            <td>{formatDate(evt.date)}</td>
                            <td><span className={`badge ${status.color}`}>{status.label}</span></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem' }}>{filled}/{capacity}</span>
                                <div style={{ flex: 1, height: 4, background: 'var(--bg-body)', borderRadius: 'var(--radius-full)', maxWidth: 80 }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 'var(--radius-full)' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pct}%</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <a href="#" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--primary)' }}
                                  onClick={(e) => { e.preventDefault(); viewParticipants(evt); }}>
                                  <Users size={13} style={{ marginRight: 2 }} /> Participants
                                </a>
                                <a href="#" style={{ fontSize: '0.8rem', fontWeight: 500, color: '#7C3AED' }}
                                  onClick={(e) => { e.preventDefault(); navigate(`/organizer/feedback-builder/${evt._id}`); }}>
                                  <FileText size={13} style={{ marginRight: 2 }} /> Feedback
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Showing 1 to {myEvents.length} of {myEvents.length} results</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-sm">‹</button>
                      <button className="btn btn-ghost btn-sm">›</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Event"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={createLoading}>
              {createLoading ? 'Creating...' : <><CalendarPlus size={14} /> Create Event</>}
            </button>
          </>
        }
      >
        <h3 style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Event Details</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Provide all necessary information to help students discover your event.</p>

        {/* Upload area */}
        <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem', background: 'var(--bg-body)' }}>
          <Upload size={28} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>Click to upload or drag and drop</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SVG, PNG, JPG or GIF (max. 10MB)</p>
        </div>

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Event Title</label>
            <input className="form-input" placeholder="e.g. Annual Tech Symposium 2024" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" placeholder="Tell everyone what the event is about..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Category</label>
              <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select a category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Max Participants</label>
              <input type="number" className="form-input" placeholder="50" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
            </div>
          </div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.95rem' }}>
            <MapPin size={16} style={{ color: 'var(--danger)' }} /> Time & Location
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" className="form-input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Location</label>
            <input className="form-input" placeholder="e.g. Main Auditorium, Block C" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </form>
      </Modal>

      {/* Participants Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => { setSelectedEvent(null); setParticipants([]); }}
        title={`Participants — ${selectedEvent?.title || ''}`}
      >
        {participantsLoading ? (
          <div className="spinner-overlay" style={{ minHeight: 150 }}><div className="spinner" /></div>
        ) : participants.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <Users size={48} />
            <h3>No Participants Yet</h3>
          </div>
        ) : (
          <div>
            {participants.map((p) => (
              <div className="participant-row" key={p._id}>
                <div className="participant-info">
                  <div className="participant-avatar">{p.userId?.name?.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.userId?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.userId?.email}</div>
                  </div>
                </div>
                {p.attendanceStatus === 'present' ? (
                  <span className="badge badge-success"><CheckCircle2 size={11} /> Present</span>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => markAttendance(p._id)}>
                    <QrCode size={13} /> Mark Present
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
