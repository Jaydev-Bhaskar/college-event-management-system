import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import jsQR from 'jsqr';
import Sidebar from '../components/Sidebar';
import {
  LayoutDashboard, Calendar, Users, BarChart3, PlusCircle, UserCircle,
  ArrowLeft, MapPin, Clock, CheckCircle2, QrCode, FileText, Edit3,
  Camera, UserCheck, X, Download, Image as ImageIcon
} from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { key: 'attendance', label: 'Attendance', icon: <UserCheck size={16} /> },
  { key: 'feedback', label: 'Feedback', icon: <FileText size={16} /> },
  { key: 'report', label: 'Report', icon: <BarChart3 size={16} /> },
];

export default function OrganizerEventView() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [scanMode, setScanMode] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
        { path: '/dashboard', label: 'My Registrations', icon: <UserCircle size={18} /> },
      ]
    }
  ];

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    if (activeTab === 'attendance' || activeTab === 'feedback') fetchParticipants();
    if (activeTab === 'report' || activeTab === 'feedback') fetchAnalytics();
  }, [activeTab]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const fetchEventData = async () => {
    try {
      const res = await API.get(`/events/${eventId}`);
      setEvent(res.data);
    } catch (err) {
      addToast('Event not found', 'error');
      navigate('/organizer');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    setParticipantsLoading(true);
    try {
      const res = await API.get(`/registrations/event/${eventId}`);
      setParticipants(res.data);
    } catch (err) {
      addToast('Failed to load participants', 'error');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await API.get(`/feedback/analytics/${eventId}`);
      setAnalytics(res.data);
    } catch (err) {
      // analytics not available yet
    }
  };

  const markAttendance = async (registrationId) => {
    try {
      await API.post('/registrations/attendance', { registrationId });
      addToast('Attendance marked!', 'success');
      fetchParticipants();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleQrScan = async () => {
    if (!qrInput.trim()) return;
    try {
      await API.post('/registrations/attendance/qr', { qrData: qrInput });
      addToast('Attendance marked via QR!', 'success');
      setQrInput('');
      fetchParticipants();
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid QR code', 'error');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            await API.post('/registrations/attendance/qr', { qrData: code.data });
            addToast('Attendance marked via uploaded QR!', 'success');
            fetchParticipants();
          } catch (err) {
            addToast(err.response?.data?.message || 'Invalid QR code', 'error');
          }
        } else {
          addToast('No QR code found in the image', 'error');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD';
  const presentCount = participants.filter(p => p.attendanceStatus === 'present').length;
  const filteredParticipants = participants.filter(p =>
    !searchTerm || p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar links={sidebarLinks} />
        <main className="dashboard-content"><div className="spinner-overlay"><div className="spinner" /></div></main>
      </div>
    );
  }

  if (!event) return null;

  const renderOverview = () => (
    <>
      {/* Event Hero */}
      <div className="glass-card-static" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        {event.posterImage && (
          <div style={{ height: 200, background: `url(${event.posterImage}) center/cover`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }} />
          </div>
        )}
        <div style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{event.title}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>{event.description}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Calendar size={16} /> {formatDate(event.date)}
            </div>
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <MapPin size={16} /> {event.location}
              </div>
            )}
            {event.category && (
              <span className="badge badge-info">{event.category}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card blue" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('attendance')}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registered</span>
          <div className="stat-value">{participants.length || '—'}</div>
        </div>
        <div className="stat-card green" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('attendance')}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Present</span>
          <div className="stat-value">{presentCount || '—'}</div>
        </div>
        <div className="stat-card amber">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Capacity</span>
          <div className="stat-value">{event.maxParticipants || '∞'}</div>
        </div>
        <div className="stat-card purple" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('report')}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Feedbacks</span>
          <div className="stat-value">{analytics?.totalResponses || '—'}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card-static" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => setActiveTab('attendance')}>
            <QrCode size={16} /> Scan QR / Mark Attendance
          </button>
          <button className="btn btn-outline" onClick={() => navigate(`/organizer/feedback-builder/${eventId}`)}>
            <FileText size={16} /> Manage Feedback Form
          </button>
          <button className="btn btn-outline" onClick={() => setActiveTab('report')}>
            <BarChart3 size={16} /> View Report
          </button>
          <button className="btn btn-ghost" onClick={() => navigate(`/events/${eventId}`)}>
            <Calendar size={16} /> Public Event Page
          </button>
        </div>
      </div>
    </>
  );

  const renderAttendance = () => (
    <>
      {/* QR Scanner Section */}
      <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <QrCode size={20} /> QR Attendance Scanner
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Paste or Scan QR Code Data</label>
            <input
              className="form-input"
              placeholder="Paste QR code data here..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQrScan()}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Upload QR Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="form-input"
              style={{ display: 'none' }}
              id="qr-upload"
            />
            <label htmlFor="qr-upload" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', height: '42px' }}>
              <ImageIcon size={16} /> Upload Image
            </label>
          </div>
          <button className="btn btn-primary" onClick={handleQrScan} style={{ whiteSpace: 'nowrap', height: '42px' }}>
            <CheckCircle2 size={16} /> Mark Present
          </button>
        </div>
        <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
          Students can show their QR code from their dashboard. Paste the scanned data above to instantly mark attendance.
        </p>
      </div>

      {/* Participants List */}
      <div className="glass-card-static" style={{ padding: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} /> Participants ({participants.length})
            <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>{presentCount} present</span>
          </h3>
          <div className="search-bar" style={{ minWidth: 220 }}>
            <input placeholder="Search participants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {participantsLoading ? (
          <div className="spinner-overlay" style={{ minHeight: 150 }}><div className="spinner" /></div>
        ) : filteredParticipants.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <Users size={48} />
            <h3>No Participants Yet</h3>
            <p>Share the event link to get registrations</p>
          </div>
        ) : (
          <div>
            {filteredParticipants.map((p) => (
              <div key={p._id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: p.attendanceStatus === 'present' ? 'var(--success-bg, #dcfce7)' : 'var(--primary-light)',
                    color: p.attendanceStatus === 'present' ? 'var(--success)' : 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.95rem'
                  }}>
                    {p.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.userId?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {p.userId?.email} {p.userId?.department && `• ${p.userId.department}`}
                    </div>
                  </div>
                </div>
                <div>
                  {p.attendanceStatus === 'present' ? (
                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} /> Present
                    </span>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => markAttendance(p._id)}>
                      <UserCheck size={14} /> Mark Present
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderFeedback = () => (
    <>
      <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Feedback Form Management</h3>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
          Create, edit, and publish your feedback form. Share links with students and expert reviewers.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => navigate(`/organizer/feedback-builder/${eventId}`)}>
            <FileText size={16} /> Open Feedback Form Builder
          </button>
          <button className="btn btn-outline" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/feedback/student/${eventId}`);
            addToast('Student feedback link copied!', 'success');
          }}>
            Copy Student Feedback Link
          </button>
        </div>
      </div>

      {/* Quick Analytics Preview */}
      {analytics && (
        <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Feedback Summary</h3>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card blue">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Responses</span>
              <div className="stat-value">{analytics.totalResponses}</div>
            </div>
            <div className="stat-card amber">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Average Rating</span>
              <div className="stat-value">{analytics.overallAverage} <span style={{ fontSize: '0.9rem' }}>/ 5</span></div>
            </div>
            <div className="stat-card green">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Expert Reviews</span>
              <div className="stat-value">{analytics.expertFeedbacks?.length || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Student Feedback Tracking */}
      <div className="glass-card-static" style={{ padding: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} /> Student Feedback Status
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {participants.filter(p => p.feedbackSubmitted).length} of {participants.length} submitted
          </span>
        </div>

        {participantsLoading ? (
          <div className="spinner-overlay" style={{ minHeight: 100 }}><div className="spinner" /></div>
        ) : participants.length === 0 ? (
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No participants registered yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {participants.map((p) => (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: p.feedbackSubmitted ? 'var(--success-bg, #dcfce7)' : 'var(--bg-body)',
                    color: p.feedbackSubmitted ? 'var(--success)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.9rem'
                  }}>
                    {p.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.userId?.name || 'Unknown User'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.userId?.email}</div>
                  </div>
                </div>
                <div>
                  {p.feedbackSubmitted ? (
                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} /> Submitted
                    </span>
                  ) : (
                    <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-body)', color: 'var(--text-muted)' }}>
                      <Clock size={13} /> Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderReport = () => (
    <>
      <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Event Report & Analytics</h3>
        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
          View the final report with feedback analytics, expert reviews, attendance data, and event photos.
        </p>
        <button className="btn btn-primary" onClick={() => navigate(`/report/${eventId}`)}>
          <BarChart3 size={16} /> Open Full Report
        </button>
      </div>

      {/* Inline Summary */}
      <div className="glass-card-static" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Quick Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Total Registered</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{participants.length}</span>
          </div>
          <div style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Attendance Rate</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {participants.length > 0 ? Math.round((presentCount / participants.length) * 100) : 0}%
            </span>
          </div>
          <div style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Feedback Responses</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{analytics?.totalResponses || 0}</span>
          </div>
          <div style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Avg. Satisfaction</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{analytics?.overallAverage || '—'} / 5</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar links={sidebarLinks} />
      <main className="dashboard-content">
        {/* Back + Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/organizer/events')} style={{ marginBottom: '0.75rem' }}>
            <ArrowLeft size={16} /> Back to Events
          </button>
          <div className="flex-between">
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{event.title}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {formatDate(event.date)} {event.location && `• ${event.location}`}
              </p>
            </div>
            <button className="btn btn-ghost" onClick={() => navigate(`/events/${eventId}`)}>
              View Public Page
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem', background: 'var(--bg-body)',
          padding: '0.3rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem'
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '0.65rem 1rem', border: 'none', cursor: 'pointer',
                borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                background: activeTab === tab.key ? 'var(--bg-base)' : 'transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'attendance' && renderAttendance()}
        {activeTab === 'feedback' && renderFeedback()}
        {activeTab === 'report' && renderReport()}
      </main>
    </div>
  );
}
