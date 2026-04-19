import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ExpertDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionNotes, setSessionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const expertToken = localStorage.getItem('expert_token');
  const expertData = JSON.parse(localStorage.getItem('expert_data') || '{}');

  const expertAPI = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${expertToken}` }
  });

  useEffect(() => {
    if (!expertToken) {
      navigate('/expert/login');
      return;
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await expertAPI.get('/expert/dashboard');
      setDashboard(res.data);
      setSessionNotes(res.data.expert?.sessionNotes || '');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('expert_token');
        localStorage.removeItem('expert_data');
        navigate('/expert/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await expertAPI.put('/expert/notes', { sessionNotes });
      alert('Session notes saved');
    } catch (err) {
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('expert_token');
    localStorage.removeItem('expert_data');
    navigate('/expert/login');
  };

  if (loading) {
    return <div className="loading-center">Loading expert dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="loading-center">Failed to load dashboard</div>;
  }

  const { event, attendeeStats, expert } = dashboard;

  return (
    <div className="expert-dashboard">
      {/* Expert Topbar */}
      <header className="expert-topbar">
        <div className="expert-topbar-left">
          <div className="expert-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            <span>Expert Portal</span>
          </div>
          <span className="expert-event-title">{event.title}</span>
        </div>
        <div className="expert-topbar-right">
          <span className="expert-name">{expertData.expertName}</span>
          <button className="btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="expert-tabs">
        {[
          { key: 'overview', label: 'Event Overview', icon: '📋' },
          { key: 'stats', label: 'Attendee Stats', icon: '📊' },
          { key: 'notes', label: 'Session Notes', icon: '📝' },
          { key: 'profile', label: 'My Profile', icon: '👤' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`expert-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="expert-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="expert-overview">
            <div className="expert-event-card">
              <h2>{event.title}</h2>
              <p className="text-secondary">{event.description}</p>
              <div className="expert-event-meta">
                <div className="expert-meta-item">
                  <span className="expert-meta-label">Date</span>
                  <span>{new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="expert-meta-item">
                  <span className="expert-meta-label">Time</span>
                  <span>{event.time || 'TBA'}</span>
                </div>
                <div className="expert-meta-item">
                  <span className="expert-meta-label">Venue</span>
                  <span>{event.location || 'TBA'}</span>
                </div>
                <div className="expert-meta-item">
                  <span className="expert-meta-label">Department</span>
                  <span>{event.department}</span>
                </div>
                <div className="expert-meta-item">
                  <span className="expert-meta-label">Coordinator</span>
                  <span>{event.sessionCoordinator || event.organizer?.name}</span>
                </div>
                <div className="expert-meta-item">
                  <span className="expert-meta-label">Category</span>
                  <span>{event.category}</span>
                </div>
              </div>

              {event.objectives && (
                <div className="expert-objectives">
                  <h3>Objectives</h3>
                  <p>{event.objectives}</p>
                </div>
              )}

              {event.agenda && (
                <div className="expert-objectives">
                  <h3>Session Agenda</h3>
                  <p>{event.agenda}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="expert-stats">
            <div className="expert-stats-grid">
              <div className="expert-stat-card">
                <span className="expert-stat-number">{attendeeStats.totalRegistered}</span>
                <span className="expert-stat-label">Registered</span>
              </div>
              <div className="expert-stat-card">
                <span className="expert-stat-number">{attendeeStats.totalPresent}</span>
                <span className="expert-stat-label">Present</span>
              </div>
              <div className="expert-stat-card">
                <span className="expert-stat-number">{attendeeStats.attendanceRate}%</span>
                <span className="expert-stat-label">Attendance Rate</span>
              </div>
            </div>

            {attendeeStats.departmentBreakdown && attendeeStats.departmentBreakdown.length > 0 && (
              <div className="expert-dept-breakdown">
                <h3>Department Breakdown</h3>
                <div className="expert-dept-list">
                  {attendeeStats.departmentBreakdown.map((dept, idx) => (
                    <div key={idx} className="expert-dept-item">
                      <span className="expert-dept-name">{dept._id || 'Unknown'}</span>
                      <span className="expert-dept-count">{dept.count} students</span>
                      <div className="expert-dept-bar">
                        <div
                          className="expert-dept-fill"
                          style={{ width: `${(dept.count / attendeeStats.totalRegistered) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="expert-pii-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Individual student data is not shown for privacy. Only aggregate statistics are available.
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="expert-notes-section">
            <h3>Session Notes & Key Takeaways</h3>
            <p className="text-secondary">These notes will be included in the final event report.</p>
            <textarea
              className="expert-notes-textarea"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Write your session notes, key discussion points, and takeaways here..."
              rows={12}
            />
            <button className="btn-primary" onClick={saveNotes} disabled={saving}>
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="expert-profile-section">
            <div className="expert-profile-card">
              <div className="expert-profile-avatar">
                {expertData.expertName?.charAt(0) || 'E'}
              </div>
              <div className="expert-profile-info">
                <h2>{expertData.expertName}</h2>
                <p>{expertData.designation || 'Resource Person'}</p>
                <p className="text-secondary">{expertData.organization || ''}</p>
              </div>
            </div>
            <p className="text-secondary" style={{ marginTop: '1rem' }}>
              Your name and designation will appear on the event feedback report.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
