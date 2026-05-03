import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import { CalendarDays, Clock, DollarSign, MapPin, ArrowLeft, Share2, Upload, Users, Search, CheckCircle2 } from 'lucide-react';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [showRegForm, setShowRegForm] = useState(false);
  const [teammates, setTeammates] = useState([]);
  const [updatingTeammates, setUpdatingTeammates] = useState(false);
  const [searchQueries, setSearchQueries] = useState({});
  const [searchResults, setSearchResults] = useState({});

  const handleSearch = async (idx, query) => {
    setSearchQueries(prev => ({ ...prev, [idx]: query }));
    if (query.length < 2) {
      setSearchResults(prev => ({ ...prev, [idx]: [] }));
      return;
    }
    try {
      const res = await API.get(`/auth/search-students?query=${query}`);
      setSearchResults(prev => ({ ...prev, [idx]: res.data }));
    } catch (err) { console.error(err); }
  };

  const selectUser = (idx, selectedUser) => {
    const updated = [...teammates];
    updated[idx] = { 
      name: selectedUser.name, 
      studentId: selectedUser.studentId, 
      userId: selectedUser._id,
      status: 'pending' 
    };
    setTeammates(updated);
    setSearchQueries(prev => ({ ...prev, [idx]: '' }));
    setSearchResults(prev => ({ ...prev, [idx]: [] }));
  };

  const isEventConcluded = () => {
    if (!event) return false;
    const targetDateStr = event.endDate || event.date;
    if (!targetDateStr) return false;

    const datePart = targetDateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    const targetTimeStr = event.endTime || event.time || "23:59";
    const [hours, minutes] = targetTimeStr.split(':').map(Number);

    const eventEnd = new Date(year, month - 1, day, isNaN(hours) ? 23 : hours, isNaN(minutes) ? 59 : minutes, 0);
    return eventEnd <= new Date();
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await API.get(`/events/${id}`);
        setEvent(res.data);

        try {
          const dept = res.data.department || '';
          const settingsRes = await API.get(`/settings/public?department=${encodeURIComponent(dept)}`);
          setGlobalSettings(settingsRes.data);
        } catch (e) { console.error("Could not load settings", e); }

        if (user) {
          try {
            const regRes = await API.get('/registrations/my-events');
            const found = regRes.data.find(r => r.eventId?._id === id);
            if (found) {
              setRegistration(found);
              if (found.teamMembers) setTeammates(found.teamMembers);
            }
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
      const res = await API.post('/registrations/register', { 
        eventId: id, 
        teamName, 
        paymentScreenshot, 
        transactionId 
      });
      setRegistration(res.data.registration);
      addToast((event.requiresApproval || event.isPaid) ? 'Request sent for approval! ⏳' : 'Registered successfully! 🎉', 'success');
      setShowRegForm(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setRegLoading(false);
    }
  };

  const handleUpdateTeammates = async () => {
    setUpdatingTeammates(true);
    try {
      const res = await API.put(`/registrations/${registration._id}/members`, { teamMembers: teammates });
      setRegistration(res.data.registration);
      addToast('Team members updated successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update teammates', 'error');
    } finally { setUpdatingTeammates(false); }
  };

  const addTeammateRow = () => {
    if (event.maxTeamSize && teammates.length >= event.maxTeamSize - 1) {
      return addToast(`Max team size is ${event.maxTeamSize}`, 'warning');
    }
    setTeammates([...teammates, { name: '', studentId: '' }]);
  };

  const updateTeammate = (index, field, value) => {
    const updated = [...teammates];
    updated[index][field] = value;
    setTeammates(updated);
  };

  const removeTeammate = (index) => {
    setTeammates(teammates.filter((_, i) => i !== index));
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  }) : 'TBD';

  const formatTime = (d, t) => {
    if (!d) return '';
    const datePart = d.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const startStr = t || "00:00";
    const [sHours, sMinutes] = startStr.split(':').map(Number);
    const date = new Date(year, month - 1, day, isNaN(sHours) ? 0 : sHours, isNaN(sMinutes) ? 0 : sMinutes, 0);
    
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
            {isEventConcluded() ? (
              <span className="badge badge-error" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                Event Concluded
              </span>
            ) : !registration ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(event.registrationType === 'team' || event.isPaid) && !showRegForm ? (
                  <button className="btn btn-primary" onClick={() => setShowRegForm(true)}>Register Now</button>
                ) : showRegForm ? (
                  <div className="glass-card-static" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.8)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Complete Registration</h3>
                    
                    {event.registrationType === 'team' && (
                      <div className="form-group">
                        <label className="form-label">Team Name</label>
                        <input className="form-input" placeholder="Enter your team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                      </div>
                    )}

                    {event.isPaid && (
                  <div style={{ padding: '1.25rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--primary)', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <DollarSign size={16} /> Payment Instructions
                    </h4>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                      Please pay <strong>₹{event.registrationFee}</strong> to the account below and upload the screenshot of your transaction.
                    </p>
                    
                    <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      {(event.paymentQR || globalSettings?.paymentQRCode) && (
                        <div>
                          <img src={event.paymentQR || globalSettings.paymentQRCode} alt="Payment QR" style={{ width: 180, height: 180, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>Scan to pay ₹{event.registrationFee}</span>
                        </div>
                      )}
                      {!event.paymentQR && !globalSettings?.paymentQRCode && globalSettings?.upiId && (
                        <div style={{ padding: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>UPI ID</span>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{globalSettings.upiId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                        <div className="form-group mb-2">
                          <label className="form-label">Transaction ID</label>
                          <input className="form-input" placeholder="UPI Ref / Transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
                        </div>

                        <label style={{ display: 'block', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center', background: 'white', cursor: 'pointer' }}>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const r = new FileReader();
                            r.onloadend = () => setPaymentScreenshot(r.result);
                            r.readAsDataURL(file);
                          }} />
                          <Upload size={16} style={{ marginBottom: '0.25rem' }} />
                          <p style={{ fontSize: '0.75rem' }}>{paymentScreenshot ? 'Screenshot Uploaded! ✅' : 'Upload Payment Screenshot'}</p>
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRegister} disabled={regLoading || (event.registrationType === 'team' && !teamName) || (event.isPaid && !paymentScreenshot)}>
                            {regLoading ? 'Confirming...' : 'Confirm Registration'}
                          </button>
                          <button className="btn btn-ghost" onClick={() => setShowRegForm(false)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={handleRegister} disabled={regLoading}>
                        {regLoading ? 'Registering...' : 'Register Now'}
                      </button>
                    )}
              </div>
            ) : registration.registrationStatus === 'pending' ? (
              <span className="badge badge-info" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                ⏳ {event.isPaid ? 'Verifying Payment...' : 'Pending Approval'}
              </span>
            ) : registration.registrationStatus === 'rejected' ? (
              <span className="badge badge-error" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                ✕ Registration Rejected
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                <span className="badge badge-success" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', width: 'fit-content' }}>
                  ✓ Registered {registration.teamName && `(Team: ${registration.teamName})`}
                </span>

                {event.registrationType === 'team' && (
                  <div className="glass-card-static" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={18} style={{ color: 'var(--primary)' }} /> {registration.userId === user?._id ? 'Manage Team Members' : 'Team Members'}
                    </h4>
                    {registration.userId === user?._id ? (
                      <>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          Add your teammates' details below. (Max: {event.maxTeamSize || '∞'} members total)
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {teammates.map((tm, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                  <input 
                                    className="form-input" 
                                    style={{ fontSize: '0.85rem', padding: '0.45rem' }}
                                    placeholder="Search name or ID..." 
                                    value={tm.name || searchQueries[idx] || ''} 
                                    onChange={(e) => {
                                      updateTeammate(idx, 'name', e.target.value);
                                      handleSearch(idx, e.target.value);
                                    }} 
                                  />
                                  {searchResults[idx] !== undefined && (searchQueries[idx]?.length >= 2 || tm.name?.length >= 2) && (
                                    <div style={{ 
                                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                                      background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                                      boxShadow: 'var(--shadow-xl)', maxHeight: 200, overflowY: 'auto', marginTop: '4px',
                                      width: '250px'
                                    }}>
                                      {searchResults[idx]?.length > 0 ? (
                                        searchResults[idx].map(u => (
                                          <div 
                                            key={u._id} 
                                            onClick={() => selectUser(idx, u)}
                                            style={{ padding: '0.65rem 0.85rem', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-body)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                          >
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.studentId} • {u.department}</div>
                                          </div>
                                        ))
                                      ) : searchQueries[idx]?.length >= 2 ? (
                                        <div style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                          No students found
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                <input 
                                  className="form-input" 
                                  style={{ fontSize: '0.85rem', padding: '0.45rem' }}
                                  placeholder="Student ID" 
                                  value={tm.studentId} 
                                  onChange={(e) => updateTeammate(idx, 'studentId', e.target.value)} 
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  {tm.status === 'pending' && <Clock size={14} style={{ color: 'var(--warning)' }} title="Invitation Pending" />}
                                  {tm.status === 'accepted' && <CheckCircle2 size={14} style={{ color: 'var(--success)' }} title="Accepted" />}
                                  <button 
                                    onClick={() => removeTeammate(idx)}
                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem', fontWeight: 'bold' }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button 
                              className="btn btn-outline" 
                              onClick={addTeammateRow}
                              style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                            >
                              + Add Member
                            </button>
                            <button 
                              className="btn btn-primary" 
                              onClick={handleUpdateTeammates}
                              disabled={updatingTeammates}
                              style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                            >
                              {updatingTeammates ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {teammates.map((tm, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                            <span>{tm.name} ({tm.studentId})</span>
                            {tm.status === 'pending' && <span style={{ color: 'var(--warning)', fontSize: '0.7rem' }}>⌛ Pending</span>}
                            {tm.status === 'accepted' && <span style={{ color: 'var(--success)', fontSize: '0.7rem' }}>✓ Accepted</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <button 
              className="btn btn-outline" 
              onClick={() => {
                const url = window.location.href;
                const text = `🚀 New Event Alert: *${event.title}*!\n📅 Date: ${formatDate(event.date)}\n📍 Venue: ${event.location || 'TBD'}\n\nRegister here: ${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
            >
              <Share2 size={16} style={{ marginRight: '0.4rem' }}/> Share on WhatsApp
            </button>

            {globalSettings?.globalWhatsappLink && (
              <a href={globalSettings.globalWhatsappLink} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ borderColor: '#25D366', color: '#25D366' }}>
                Join WhatsApp Group
              </a>
            )}
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
              <div className="glass-card-static mb-3">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Location</h2>
                <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{event.location}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>University Central Campus</p>
              </div>
            )}
            
            {/* Organizer Contact */}
            {event.organizerContact && (
              <div className="glass-card-static">
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Contact Organizer</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{event.organizerContact}</p>
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
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {formatTime(event.date, event.time)}
                    {(event.endTime || event.endDate) && (
                      <>
                        {" - "}
                        {event.endDate && new Date(event.endDate).toDateString() !== new Date(event.date).toDateString() && (
                          <span style={{ fontSize: '0.85rem' }}>{formatDate(event.endDate)} </span>
                        )}
                        {formatTime(event.endDate || event.date, event.endTime || event.time)}
                      </>
                    )}
                  </div>
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
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{event.isPaid ? `₹${event.registrationFee}` : 'Free Entry'}</div>
                </div>
              </div>

              {/* Action Button */}
              {isEventConcluded() ? (
                <button 
                  className="btn btn-primary btn-lg" 
                  style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
                  onClick={() => {
                    if (!registration) {
                      addToast("Event has already concluded.", "warning");
                    } else if (registration.feedbackSubmitted) {
                      navigate('/dashboard/certificates');
                    } else {
                      navigate(`/feedback/student/${event._id}`);
                    }
                  }}
                >
                  {!registration ? 'Event Concluded' : (registration.feedbackSubmitted ? 'View Certificate' : 'Submit Feedback')}
                </button>
              ) : registration ? (
                <div style={{ textAlign: 'center' }}>
                  {registration.registrationStatus === 'confirmed' ? (
                    <button className="btn btn-primary btn-lg" style={{ width: '100%', borderRadius: 'var(--radius-lg)' }} onClick={() => navigate('/dashboard/tickets')}>
                      View Ticket
                    </button>
                  ) : (
                    <div className={`badge ${registration.registrationStatus === 'pending' ? 'badge-info' : 'badge-error'}`} style={{ width: '100%', padding: '0.75rem' }}>
                      {registration.registrationStatus === 'pending' ? 'Application Under Review' : 'Registration Rejected'}
                    </div>
                  )}
                </div>
              ) : (
                <button className="btn btn-primary btn-lg" style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
                  onClick={() => (event.registrationType === 'team' || event.isPaid) ? setShowRegForm(true) : handleRegister()} disabled={regLoading}>
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
        {registration?.qrCode && !isEventConcluded() && (
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
