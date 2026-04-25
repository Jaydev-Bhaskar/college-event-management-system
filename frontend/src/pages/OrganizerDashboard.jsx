import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import {
  LayoutDashboard, CalendarPlus, Users, BarChart3,
  Calendar, Eye, CheckCircle2, QrCode, Search,
  Upload, MapPin, Clock, PlusCircle, UserCircle, FileText, UserCheck, Edit3,
  CalendarDays, QrCode as QrIcon, Download, MessageSquare
} from 'lucide-react';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', description: '', location: '', category: '', date: '', time: '', endDate: '', endTime: '', maxParticipants: '', posterImage: ''
  });

  const [form, setForm] = useState({
    title: '', description: '', category: '', date: '', time: '', endDate: '', endTime: '', location: '', maxParticipants: '', posterImage: ''
  });

  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);

  const categories = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon'];

  const sidebarLinks = [
    {
      title: '',
      items: [
        { path: '/organizer', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
        { path: '/organizer/events', label: 'My Events', icon: <Calendar size={18} /> },
        { path: '/organizer/create', label: 'Create Event', icon: <PlusCircle size={18} /> },
        { path: '/organizer/participants', label: 'Participants', icon: <Users size={18} /> },
        { path: '/organizer/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
      ]
    },
    {
      title: 'TOOLS',
      items: [
        { path: '/organizer/registrations', label: 'My Registrations', icon: <UserCircle size={18} /> },
      ]
    }
  ];

  useEffect(() => { 
    fetchEvents(); 
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setRegsLoading(true);
    try {
      const res = await API.get('/registrations/my-events');
      setRegistrations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRegsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      // Show events the user created and events they manage
      const mine = res.data.filter(e => 
        (e.organizerId?._id === user._id || e.organizerId === user._id) || 
        (user.privileges?.managedEvents?.includes(e._id))
      );
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
      await API.post('/organizer/request', {
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      });
      addToast('Event proposal submitted successfully! Pending admin approval.', 'success');
      setForm({ title: '', description: '', category: '', date: '', time: '', location: '', maxParticipants: '' });
      navigate('/organizer/events');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create event', 'error');
    } finally { setCreateLoading(false); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
       addToast('File too large. Max 10MB', 'error');
       return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
       setForm({ ...form, posterImage: reader.result });
    };
    reader.readAsDataURL(file);
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

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await API.put(`/events/${editingEvent._id}`, editForm);
      addToast('Event updated successfully!', 'success');
      setEditingEvent(null);
      fetchMyEvents();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update event', 'error');
    } finally { setEditLoading(false); }
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

  const renderFormFields = (formData, setFormData) => (
    <>
      <label style={{ display: 'block', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem', background: 'var(--bg-body)', cursor: 'pointer' }}>
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) return addToast('File too large', 'error');
          const r = new FileReader(); r.onloadend = () => setFormData({...formData, posterImage: r.result}); r.readAsDataURL(file);
        }} style={{ display: 'none' }} />
        <Upload size={28} style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'inline-block' }} />
        <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{formData.posterImage ? 'Poster selected! Click to change' : 'Click to upload Event Poster'}</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Images only (max. 10MB)</p>
      </label>

      <div className="form-group mb-3">
        <label className="form-label">Event Title</label>
        <input className="form-input" placeholder="e.g. Annual Tech Symposium" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
      </div>
      <div className="form-group mb-3">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows="3" placeholder="Tell everyone what the event is about..." value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Category</label>
          <select className="form-input" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
            <option value="">Select a category</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Max Participants</label>
          <input type="number" className="form-input" placeholder="50" value={formData.maxParticipants || ''} onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })} />
        </div>
      </div>
      <h3 style={{ fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.95rem', marginTop: '0.5rem' }}>
        <MapPin size={16} style={{ color: 'var(--danger)' }} /> Time & Location
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Start Date</label>
          <input type="date" className="form-input" value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Start Time</label>
          <input type="time" className="form-input" value={formData.time || ''} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">End Date</label>
          <input type="date" className="form-input" value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">End Time</label>
          <input type="time" className="form-input" value={formData.endTime || ''} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
        </div>
      </div>
      <div className="form-group mb-4" style={{ marginTop: '1rem' }}>
        <label className="form-label">Location</label>
        <input className="form-input" placeholder="e.g. Main Auditorium" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
      </div>
    </>
  );

  const renderContent = () => {
    if (path === '/organizer/create') {
      return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Create New Event</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Provide all necessary information to help students discover your event.
            </p>
          </div>
          <div className="glass-card-static" style={{ padding: '2rem' }}>
            <form onSubmit={handleCreate}>
              {renderFormFields(form, setForm)}
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/organizer')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Publishing...' : <><CalendarPlus size={14} /> Publish Event</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    
    if (path === '/organizer/participants') {
      return (
        <>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Participants Directory</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              View and manage registered students for your events.
            </p>
          </div>
          
          <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Select Event</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {myEvents.length === 0 ? (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No events active.</span>
              ) : (
                myEvents.map(evt => (
                  <button 
                    key={evt._id}
                    className={`btn btn-sm ${selectedEvent?._id === evt._id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => viewParticipants(evt)}
                  >
                    {evt.title}
                  </button>
                ))
              )}
            </div>
          </div>

          {!selectedEvent ? (
            <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
              <Users size={48} />
              <h3>Participant Directory</h3>
              <p>Select an event from the options above to view its specific participants.</p>
            </div>
          ) : participantsLoading ? (
            <div className="glass-card-static" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : participants.length === 0 ? (
            <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
              <Users size={48} />
              <h3>No Participants Yet</h3>
              <p>No students have registered for {selectedEvent.title} yet.</p>
            </div>
          ) : (
            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{selectedEvent.title} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>({participants.length})</span></h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {participants.map((p) => (
                  <div className="participant-row" key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)' }}>
                    <div className="participant-info" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div className="participant-avatar" style={{ width: 36, height: 36, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        {p.userId?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.userId?.name || 'Unknown User'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.userId?.email || 'N/A'}</div>
                      </div>
                    </div>
                    {p.attendanceStatus === 'present' ? (
                      <span className="badge badge-success"><CheckCircle2 size={12} style={{ marginRight: 4 }} /> Present</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => markAttendance(p._id)}>
                        <QrCode size={12} style={{ marginRight: 4 }} /> Mark Present
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }

    if (path === '/organizer/analytics') {
      return (
        <>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>Event Analytics</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Analyze attendance and engagement data.
            </p>
          </div>
          <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
            <BarChart3 size={48} />
            <h3>Analytics Dashboard</h3>
            <p>Comprehensive analytics reporting is coming soon.</p>
          </div>
        </>
      );
    }

    if (path === '/organizer/registrations') {
      const upcomingRegs = registrations.filter((r) => {
        if (!r.eventId || !r.eventId.date) return false;
        const eventDate = new Date(r.eventId.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });

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

      return (
        <>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>My Registrations</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Events you are participating in as a student/faculty.
            </p>
          </div>

          {regsLoading ? (
            <div className="glass-card-static" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : upcomingRegs.length === 0 ? (
            <div className="glass-card-static empty-state" style={{ padding: '3rem 2rem' }}>
              <CalendarDays size={48} />
              <h3>No Registrations</h3>
              <p>You haven't registered for any upcoming events yet.</p>
              <button className="btn btn-primary" onClick={() => navigate('/events')}>Browse Events</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {upcomingRegs.map((r) => {
                const evt = r.eventId;
                if (!evt) return null;
                return (
                  <div key={r._id} className="glass-card-static" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{
                      height: 120,
                      background: evt.posterImage ? `url(${evt.posterImage}) center/cover` : 'linear-gradient(135deg, #0F766E, #1E293B)',
                      position: 'relative'
                    }}>
                      <span className="badge badge-info" style={{ position: 'absolute', top: 12, left: 12 }}>
                        {getDaysUntil(evt.date)}
                      </span>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{evt.title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} /> {evt.location || 'TBD'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> {evt.time || 'TBD'}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/events/${evt._id}`)}>Details</button>
                        {r.qrCode && (
                           <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => window.open(r.qrCode, '_blank')}>
                             <QrIcon size={14} /> Ticket
                           </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      );
    }

    // Default Dashboard & /organizer/events
    return (
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
              <button className="btn btn-primary" onClick={() => navigate('/organizer/create')}>Create Event</button>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                            onClick={() => navigate(`/organizer/event/${evt._id}`)}>
                            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Calendar size={14} />
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{evt.title}</span>
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
                          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                            <a href="#" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
                              onClick={(e) => { e.preventDefault(); viewParticipants(evt); }}>
                              <Users size={13} style={{ marginRight: 2 }} /> Participants
                            </a>
                            <a href="#" style={{ fontSize: '0.8rem', fontWeight: 500, color: '#7C3AED', display: 'flex', alignItems: 'center' }}
                              onClick={(e) => { e.preventDefault(); navigate(`/organizer/feedback-builder/${evt._id}`); }}>
                              <FileText size={13} style={{ marginRight: 2 }} /> Feedback
                            </a>
                            <a href="#" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--success)', display: 'flex', alignItems: 'center' }}
                              onClick={(e) => { e.preventDefault(); navigate(`/report/${evt._id}`); }}>
                              <BarChart3 size={13} style={{ marginRight: 2 }} /> Report
                            </a>
                            <a href="#" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
                              onClick={(e) => { 
                                e.preventDefault(); 
                                setEditingEvent(evt);
                                setEditForm({
                                  title: evt.title || '',
                                  description: evt.description || '',
                                  location: evt.location || '',
                                  category: evt.category || '',
                                  date: evt.date || '',
                                  time: evt.time || '',
                                  endDate: evt.endDate || '',
                                  endTime: evt.endTime || '',
                                  maxParticipants: evt.maxParticipants || '',
                                  posterImage: evt.posterImage || ''
                                });
                              }}>
                              <Edit3 size={13} style={{ marginRight: 2 }} /> Edit
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
    );
  };


  return (
    <div className="dashboard-layout">
      <Sidebar links={sidebarLinks} />

      <main className="dashboard-content">
        <div className="flex-between mb-4">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.2rem' }}>{
              path === '/organizer/create' ? 'Events Hub' : 'Organizer Dashboard'
            }</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="search-bar" style={{ minWidth: 200 }}>
              <Search size={14} />
              <input placeholder="Search events..." />
            </div>
            {path !== '/organizer/create' && (
              <button className="btn btn-primary" onClick={() => navigate('/organizer/create')}>
                <PlusCircle size={16} /> Create New Event
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="spinner-overlay"><div className="spinner" /></div>
        ) : (
          renderContent()
        )}
      </main>

      {/* Participants Modal */}
      <Modal
        isOpen={!!selectedEvent && path !== '/organizer/participants'}
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

      {/* Edit Event Modal */}
      <Modal 
        isOpen={!!editingEvent} 
        onClose={() => setEditingEvent(null)}
        title="Edit Event Details"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <form onSubmit={handleUpdateEvent}>
            {renderFormFields(editForm, setEditForm)}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingEvent(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
