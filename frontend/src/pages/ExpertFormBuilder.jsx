import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { getFeedbackFormByEvent, updateFeedbackForm, createFeedbackForm } from '../api/services';
import Sidebar from '../components/Sidebar';
import {
  LayoutDashboard, Calendar, PlusCircle, Users, BarChart3,
  UserCircle, Star, ArrowLeft, Save, Send, Eye, Copy
} from 'lucide-react';

export default function ExpertFormBuilder() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [formId, setFormId] = useState(null);
  const [formStatus, setFormStatus] = useState('draft');
  const [expertSection, setExpertSection] = useState({ enabled: false, questions: [] });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      const eventRes = await API.get(`/events/${eventId}`);
      setEvent(eventRes.data);

      try {
        const formRes = await getFeedbackFormByEvent(eventId);
        if (formRes.data) {
          setFormId(formRes.data._id);
          setFormStatus(formRes.data.status || 'draft');
          if (formRes.data.expertSection) {
            setExpertSection(formRes.data.expertSection);
          }
        }
      } catch (err) {
        // No existing form
      }
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate
    if (expertSection.enabled) {
      for (const q of expertSection.questions) {
        if (!q.text.trim()) return alert('Expert question text cannot be empty.');
        if (q.type === 'mcq' && (!q.options || q.options.length < 2)) {
          return alert('MCQ questions need at least 2 options.');
        }
      }
    }

    setSaving(true);
    try {
      if (formId) {
        await updateFeedbackForm(formId, { expertSection });
      } else {
        // Create form with just expert section
        const res = await createFeedbackForm({
          eventId,
          sections: [{ title: 'General Feedback', order: 0, questions: [] }],
          expertSection,
          status: 'draft'
        });
        setFormId(res.data.form._id);
      }
      alert('Expert feedback form saved!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    setExpertSection({
      ...expertSection,
      enabled: true,
      questions: [...expertSection.questions, { text: '', type: 'rating_1_5', required: true, options: [] }]
    });
  };

  const updateQuestion = (qIdx, updates) => {
    const updated = { ...expertSection };
    updated.questions = [...updated.questions];
    updated.questions[qIdx] = { ...updated.questions[qIdx], ...updates };
    setExpertSection(updated);
  };

  const removeQuestion = (qIdx) => {
    const updated = { ...expertSection };
    updated.questions = updated.questions.filter((_, i) => i !== qIdx);
    setExpertSection(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = { ...expertSection };
    updated.questions = [...updated.questions];
    const newOpts = [...(updated.questions[qIdx].options || [])];
    newOpts[optIdx] = value;
    updated.questions[qIdx] = { ...updated.questions[qIdx], options: newOpts };
    setExpertSection(updated);
  };

  const addOption = (qIdx) => {
    const updated = { ...expertSection };
    updated.questions = [...updated.questions];
    const q = updated.questions[qIdx];
    updated.questions[qIdx] = { ...q, options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] };
    setExpertSection(updated);
  };

  const removeOption = (qIdx, optIdx) => {
    const updated = { ...expertSection };
    updated.questions = [...updated.questions];
    updated.questions[qIdx] = {
      ...updated.questions[qIdx],
      options: (updated.questions[qIdx].options || []).filter((_, i) => i !== optIdx)
    };
    setExpertSection(updated);
  };

  const expertLink = `${window.location.origin}/feedback/expert/${eventId}`;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar links={sidebarLinks} />
        <main className="dashboard-content"><div className="loading-center">Loading...</div></main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar links={sidebarLinks} />
      <main className="dashboard-content fb-builder">

        {/* Header */}
        <div className="fb-builder-header">
          <div>
            <button className="fb-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={24} color="#7c3aed" /> Expert Feedback Form Builder
            </h1>
            <p className="text-secondary">{event?.title}</p>
          </div>
          <div className="fb-builder-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed15, #4f46e515)',
          border: '1px solid #7c3aed30', borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem', marginBottom: '1.5rem'
        }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>
            This form is separate from the student feedback form.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Experts receive a public link to fill out this form — no login is required.
            Their responses are stored separately and shown in the Event Report under "Expert Feedback & Review."
          </p>
        </div>

        {/* Enable Toggle */}
        <div className="fb-section-card" style={{ marginBottom: '1.5rem' }}>
          <div className="flex-between">
            <div>
              <h3 style={{ margin: 0 }}>Enable Expert Feedback</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Toggle this on to allow experts to submit feedback for this event.
              </p>
            </div>
            <label style={{
              position: 'relative', display: 'inline-block', width: 52, height: 28, cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={expertSection.enabled}
                onChange={(e) => setExpertSection({ ...expertSection, enabled: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: expertSection.enabled ? '#7c3aed' : '#d1d5db',
                borderRadius: 28, transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: 22, width: 22,
                  left: expertSection.enabled ? 26 : 3, bottom: 3,
                  background: '#fff', borderRadius: '50%', transition: '0.3s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>
        </div>

        {expertSection.enabled && (
          <>
            {/* Share Link */}
            {formStatus === 'published' && (
              <div className="fb-section-card" style={{ borderLeft: '4px solid #7c3aed', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={16} /> Expert Feedback Link
                </h3>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: 'var(--bg-body)', padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {expertLink}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '0.25rem' }}>
                      No login required — anyone with this link can submit expert feedback
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => { navigator.clipboard.writeText(expertLink); alert('Link copied!'); }}
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>
            )}

            {/* Questions Builder */}
            <div className="fb-section-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>📝 Expert Questions</h3>
              <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Add questions that the expert/resource person should answer about the event.
              </p>

              {expertSection.questions.length === 0 && (
                <div style={{
                  padding: '2.5rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)',
                  textAlign: 'center', marginBottom: '1rem', border: '2px dashed var(--border)'
                }}>
                  <Star size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>No questions yet</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Click the button below to add your first expert question</p>
                </div>
              )}

              {expertSection.questions.map((q, qIdx) => (
                <div key={qIdx} style={{
                  background: 'var(--bg-body)', borderRadius: 'var(--radius-md)',
                  padding: '1.25rem', marginBottom: '0.75rem', border: '1px solid var(--border)',
                  transition: 'box-shadow 0.2s'
                }}>
                  {/* Question Header */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#7c3aed15', color: '#7c3aed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, marginTop: 2
                    }}>
                      {qIdx + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <input
                        className="form-input"
                        placeholder="Enter your question for the expert..."
                        value={q.text}
                        onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                        style={{ fontWeight: 500, fontSize: '0.95rem' }}
                      />
                    </div>
                  </div>

                  {/* Controls Row */}
                  <div style={{
                    display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap',
                    paddingLeft: 44
                  }}>
                    <select
                      className="form-input"
                      value={q.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        updateQuestion(qIdx, {
                          type: newType,
                          options: newType === 'mcq' ? (q.options?.length ? q.options : ['Option 1', 'Option 2']) : []
                        });
                      }}
                      style={{ width: 'auto', minWidth: 170, fontSize: '0.85rem' }}
                    >
                      <option value="rating_1_5">⭐ Rating (1–5)</option>
                      <option value="rating_1_3">⭐ Rating (1–3)</option>
                      <option value="mcq">☰ Multiple Choice</option>
                      <option value="yes_no">✓ Yes / No</option>
                      <option value="short_text">✎ Short Text</option>
                      <option value="long_text">📄 Long Text</option>
                    </select>

                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)'
                    }}>
                      <input
                        type="checkbox"
                        checked={q.required !== false}
                        onChange={(e) => updateQuestion(qIdx, { required: e.target.checked })}
                        style={{ accentColor: '#7c3aed' }}
                      />
                      Required
                    </label>

                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)', marginLeft: 'auto', fontSize: '0.8rem' }}
                      onClick={() => removeQuestion(qIdx)}
                    >
                      ✕ Remove
                    </button>
                  </div>

                  {/* MCQ Options */}
                  {q.type === 'mcq' && (
                    <div style={{
                      marginTop: '0.75rem', paddingTop: '0.75rem', paddingLeft: 44,
                      borderTop: '1px dashed var(--border)'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Answer options:
                      </p>
                      {(q.options || []).map((opt, optIdx) => (
                        <div key={optIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: '50%', border: '2px solid #7c3aed40',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }} />
                          <input
                            className="form-input"
                            value={opt}
                            onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                            style={{ flex: 1, padding: '0.4rem 0.65rem', fontSize: '0.85rem' }}
                          />
                          {(q.options || []).length > 1 && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0.15rem 0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}
                              onClick={() => removeOption(qIdx, optIdx)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.8rem', color: '#7c3aed', marginTop: '0.25rem' }}
                        onClick={() => addOption(qIdx)}
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  {/* Preview */}
                  {q.type === 'rating_1_5' && (
                    <div style={{ paddingLeft: 44, marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Preview:</p>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)', background: 'var(--bg-body)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', color: 'var(--text-muted)'
                          }}>{n}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.type === 'rating_1_3' && (
                    <div style={{ paddingLeft: 44, marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Preview:</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['Poor', 'Average', 'Excellent'].map(label => (
                          <div key={label} style={{
                            padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)', background: 'var(--bg-body)',
                            fontSize: '0.75rem', color: 'var(--text-muted)'
                          }}>{label}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.type === 'yes_no' && (
                    <div style={{ paddingLeft: 44, marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Preview:</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['Yes', 'No'].map(label => (
                          <div key={label} style={{
                            padding: '0.35rem 1.25rem', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)', background: 'var(--bg-body)',
                            fontSize: '0.8rem', color: 'var(--text-muted)'
                          }}>{label}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Question Button */}
              <button
                className="btn btn-outline"
                style={{
                  width: '100%', justifyContent: 'center', borderStyle: 'dashed',
                  borderColor: '#7c3aed60', color: '#7c3aed', marginTop: '0.5rem'
                }}
                onClick={addQuestion}
              >
                + Add Expert Question
              </button>
            </div>

            {/* Quick Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: 'var(--bg-base)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', padding: '1rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed' }}>
                  {expertSection.questions.length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Questions</div>
              </div>
              <div style={{
                background: 'var(--bg-base)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', padding: '1rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed' }}>
                  {expertSection.questions.filter(q => q.required !== false).length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Required</div>
              </div>
              <div style={{
                background: 'var(--bg-base)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', padding: '1rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed' }}>
                  {expertSection.questions.filter(q => q.type.startsWith('rating')).length}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rating Qs</div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
