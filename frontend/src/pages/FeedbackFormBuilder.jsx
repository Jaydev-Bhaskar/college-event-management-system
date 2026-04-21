import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createFeedbackForm, updateFeedbackForm, getFeedbackFormByEvent, getPOBank } from '../api/services';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import {
  LayoutDashboard, Calendar, Users, BarChart3,
  PlusCircle, UserCircle
} from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'rating_1_5', label: 'Rating (1-5)' },
  { value: 'rating_1_3', label: 'Rating (1-3)' },
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'yes_no', label: 'Yes / No' }
];

function QuestionEditor({ question, onChange, onRemove, availablePOs = [], availablePSOs = [] }) {
  const updateField = (field, value) => {
    onChange({ ...question, [field]: value });
  };

  return (
    <div className="fb-question-card">
      <div className="fb-question-header">
        <input
          className="fb-question-input"
          type="text"
          placeholder="Question text..."
          value={question.text}
          onChange={(e) => updateField('text', e.target.value)}
        />
        <button className="fb-question-remove" onClick={onRemove} title="Remove question">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="fb-question-options">
        <select value={question.type} onChange={(e) => updateField('type', e.target.value)}>
          {QUESTION_TYPES.map(qt => (
            <option key={qt.value} value={qt.value}>{qt.label}</option>
          ))}
        </select>

        {(availablePOs.length > 0 || availablePSOs.length > 0) && (
          <select 
            value={question.mappedPO || ''} 
            onChange={(e) => updateField('mappedPO', e.target.value)}
            style={{ padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
          >
            <option value="">No PO/PSO Mapping</option>
            {availablePOs.length > 0 && (
              <optgroup label="Programme Outcomes">
                {availablePOs.map(po => <option key={po.code} value={po.code}>{po.code}</option>)}
              </optgroup>
            )}
            {availablePSOs.length > 0 && (
              <optgroup label="Specific Outcomes">
                {availablePSOs.map(pso => <option key={pso.code} value={pso.code}>{pso.code}</option>)}
              </optgroup>
            )}
          </select>
        )}

        <label className="fb-checkbox">
          <input type="checkbox" checked={question.required} onChange={(e) => updateField('required', e.target.checked)} />
          Required
        </label>
      </div>

      {/* MCQ Options */}
      {question.type === 'mcq' && (
        <div className="fb-mcq-options">
          {(question.options || []).map((opt, i) => (
            <div key={i} className="fb-mcq-option">
              <span className="fb-mcq-bullet">○</span>
              <input
                type="text"
                value={opt}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => {
                  const newOpts = [...(question.options || [])];
                  newOpts[i] = e.target.value;
                  updateField('options', newOpts);
                }}
              />
              <button className="fb-mcq-remove" onClick={() => {
                const newOpts = question.options.filter((_, idx) => idx !== i);
                updateField('options', newOpts);
              }}>&times;</button>
            </div>
          ))}
          <button className="fb-mcq-add" onClick={() => updateField('options', [...(question.options || []), ''])}>
            + Add option
          </button>
        </div>
      )}

      {/* Preview */}
      <div className="fb-question-preview">
        {question.type === 'rating_1_5' && (
          <div className="fb-rating-preview">
            {[1,2,3,4,5].map(n => <span key={n} className="fb-rating-dot">{n}</span>)}
          </div>
        )}
        {question.type === 'rating_1_3' && (
          <div className="fb-rating-preview">
            {[1,2,3].map(n => <span key={n} className="fb-rating-dot">{n}</span>)}
          </div>
        )}
        {question.type === 'yes_no' && (
          <div className="fb-rating-preview">
            <span className="fb-rating-dot">Yes</span>
            <span className="fb-rating-dot">No</span>
          </div>
        )}
        {question.type === 'short_text' && <div className="fb-text-preview">Short answer text</div>}
        {question.type === 'long_text' && <div className="fb-text-preview fb-text-long">Long answer text</div>}
      </div>
    </div>
  );
}

function POQuestionEditor({ question, onChange, onRemove, availablePOs = [], availablePSOs = [] }) {
  const updateField = (field, value) => {
    onChange({ ...question, [field]: value });
  };
  
  const selectedPO = question.poCode || '';

  return (
    <div className="fb-question-card" style={{ borderLeft: '3px solid var(--accent)' }}>
      <div className="fb-question-header">
        <input
          className="fb-question-input"
          type="text"
          placeholder="PO/PSO Question text..."
          value={question.text}
          onChange={(e) => updateField('text', e.target.value)}
        />
        <button className="fb-question-remove" onClick={onRemove} title="Remove question">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="fb-question-options">
        <select value={question.type} onChange={(e) => updateField('type', e.target.value)}>
          <option value="mcq">Multiple Choice</option>
          <option value="rating_1_5">Rating (1-5)</option>
          <option value="short_text">Short Text</option>
        </select>

        <select 
          value={selectedPO} 
          onChange={(e) => updateField('poCode', e.target.value)}
          style={{ padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
        >
          <option value="">Select PO/PSO</option>
          {availablePOs.length > 0 && (
            <optgroup label="Programme Outcomes">
              {availablePOs.map(po => <option key={po.code} value={po.code}>{po.code}</option>)}
            </optgroup>
          )}
          {availablePSOs.length > 0 && (
            <optgroup label="Specific Outcomes">
              {availablePSOs.map(pso => <option key={pso.code} value={pso.code}>{pso.code}</option>)}
            </optgroup>
          )}
        </select>
        
        {/* Correct Answer Field for MCQs */}
        {question.type === 'mcq' && (
          <input
            type="text"
            placeholder="Correct Answer (for reports)"
            value={question.answer || ''}
            onChange={(e) => updateField('answer', e.target.value)}
            style={{ padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem', width: '200px' }}
          />
        )}
      </div>

      {question.type === 'mcq' && (
        <div className="fb-mcq-options">
          {(question.options || []).map((opt, i) => (
            <div key={i} className="fb-mcq-option">
              <span className="fb-mcq-bullet">○</span>
              <input
                type="text"
                value={opt}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => {
                  const newOpts = [...(question.options || [])];
                  newOpts[i] = e.target.value;
                  updateField('options', newOpts);
                }}
              />
              <button className="fb-mcq-remove" onClick={() => {
                const newOpts = question.options.filter((_, idx) => idx !== i);
                updateField('options', newOpts);
              }}>&times;</button>
            </div>
          ))}
          <button className="fb-mcq-add" onClick={() => updateField('options', [...(question.options || []), ''])}>
            + Add option
          </button>
        </div>
      )}
    </div>
  );
}

export default function FeedbackFormBuilder() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [formId, setFormId] = useState(null);
  const [sections, setSections] = useState([
    { title: 'General Feedback', order: 0, questions: [] }
  ]);
  const [poMapping, setPOMapping] = useState([]);
  const [psoMapping, setPSOMapping] = useState([]);
  const [poQuestions, setPoQuestions] = useState([]);
  const [openEndedQuestions, setOpenEndedQuestions] = useState([
    { text: 'Any suggestions for improvement?', required: false }
  ]);
  const [availablePOs, setAvailablePOs] = useState([]);
  const [availablePSOs, setAvailablePSOs] = useState([]);
  const [status, setStatus] = useState('draft');
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
      // Load event
      const eventRes = await API.get(`/events/${eventId}`);
      setEvent(eventRes.data);

      // Load PO bank for department
      const dept = eventRes.data.department || user.department;
      if (dept) {
        const poRes = await getPOBank(dept);
        setAvailablePOs(poRes.data.pos || []);
        setAvailablePSOs(poRes.data.psos || []);
      }

      // Load existing form if any
      try {
        const formRes = await getFeedbackFormByEvent(eventId);
        if (formRes.data) {
          setFormId(formRes.data._id);
          setSections(formRes.data.sections || []);
          setPOMapping(formRes.data.poMapping || []);
          setPSOMapping(formRes.data.psoMapping || []);
          setPoQuestions(formRes.data.poQuestions || []);
          setOpenEndedQuestions(formRes.data.openEndedQuestions || []);
          setStatus(formRes.data.status || 'draft');
        }
      } catch (err) {
        // No existing form — that's fine
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    setSections([...sections, {
      title: `Section ${sections.length + 1}`,
      order: sections.length,
      questions: []
    }]);
  };

  const removeSection = (idx) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== idx));
  };

  const updateSectionTitle = (idx, title) => {
    const updated = [...sections];
    updated[idx].title = title;
    setSections(updated);
  };

  const addQuestion = (sectionIdx) => {
    const updated = [...sections];
    updated[sectionIdx].questions.push({
      text: '',
      type: 'rating_1_5',
      required: true,
      options: []
    });
    setSections(updated);
  };

  const updateQuestion = (sectionIdx, qIdx, question) => {
    const updated = [...sections];
    updated[sectionIdx].questions[qIdx] = question;
    setSections(updated);
  };

  const removeQuestion = (sectionIdx, qIdx) => {
    const updated = [...sections];
    updated[sectionIdx].questions.splice(qIdx, 1);
    setSections(updated);
  };

  const togglePO = (code) => {
    setPOMapping(prev =>
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    );
  };

  const togglePSO = (code) => {
    setPSOMapping(prev =>
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    );
  };

  const handleSave = async (publishStatus) => {
    // Client-side validation to ensure no empty questions are saved
    for (const section of sections) {
      if (section.title.trim() === '') return alert('A section title cannot be empty.');
      for (const q of section.questions) {
        if (q.text.trim() === '') return alert('A question text cannot be empty.');
      }
    }
    for (const pq of poQuestions) {
      if (pq.text.trim() === '') return alert('A PO/PSO question text cannot be empty.');
    }
    for (const oq of openEndedQuestions) {
      if (oq.text.trim() === '') return alert('An open-ended question text cannot be empty.');
    }

    setSaving(true);
    try {
      const formData = {
        eventId,
        sections,
        poMapping,
        psoMapping,
        poQuestions,
        openEndedQuestions,
        status: publishStatus || status
      };

      if (formId) {
        await updateFeedbackForm(formId, formData);
      } else {
        const res = await createFeedbackForm(formData);
        setFormId(res.data.form._id);
      }

      setStatus(publishStatus || status);
      alert(publishStatus === 'published' ? 'Form published!' : 'Form saved as draft');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar links={sidebarLinks} />
        <main className="dashboard-content"><div className="loading-center">Loading form builder...</div></main>
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
              ← Back
            </button>
            <h1>Feedback Form Builder</h1>
            <p className="text-secondary">{event?.title}</p>
          </div>
          <div className="fb-builder-actions">
            <span className={`fb-status-badge ${status}`}>{status}</span>
            <button className="btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button className="btn-primary" onClick={() => handleSave('published')} disabled={saving}>
              Publish Form
            </button>
          </div>
        </div>

        {status === 'published' && (
          <div className="fb-section-card" style={{ borderLeft: '4px solid var(--brand-primary)', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, marginBottom: '0.5rem' }}>
               Share Feedback Links
            </h3>
            <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              The feedback form is published. Use these links to distribute to participants and experts. Students can also access it on their dashboards.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-base)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Student Feedback Link</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{window.location.origin}/feedback/student/{eventId}</div>
                </div>
                <button className="btn-secondary btn-sm" onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/feedback/student/${eventId}`); alert('Copied!');}}>Copy Link</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-base)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Expert Temporary Login Link</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{window.location.origin}/expert/login?eventId={eventId}</div>
                </div>
                <button className="btn-secondary btn-sm" onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/expert/login?eventId=${eventId}`); alert('Copied!');}}>Copy Link</button>
              </div>
            </div>
          </div>
        )}

        {/* PO/PSO Mapping */}
        {(availablePOs.length > 0 || availablePSOs.length > 0) && (
          <div className="fb-section-card fb-po-section">
            <h3>📊 PO/PSO Mapping</h3>
            <p className="text-secondary">Select the Programme Outcomes mapped to this event</p>

            {availablePOs.length > 0 && (
              <div className="fb-po-group">
                <h4>Programme Outcomes</h4>
                <div className="fb-po-pills">
                  {availablePOs.map(po => (
                    <button
                      key={po.code}
                      className={`fb-po-pill ${poMapping.includes(po.code) ? 'selected' : ''}`}
                      onClick={() => togglePO(po.code)}
                      title={po.description}
                    >
                      {po.code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availablePSOs.length > 0 && (
              <div className="fb-po-group">
                <h4>Programme Specific Outcomes</h4>
                <div className="fb-po-pills">
                  {availablePSOs.map(pso => (
                    <button
                      key={pso.code}
                      className={`fb-po-pill ${psoMapping.includes(pso.code) ? 'selected' : ''}`}
                      onClick={() => togglePSO(pso.code)}
                      title={pso.description}
                    >
                      {pso.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PO/PSO Specific Questions */}
        <div className="fb-section-card">
          <div className="fb-section-header">
            <h2 className="fb-section-title" style={{ margin: 0 }}>PO/PSO Specific Questions</h2>
            <button className="btn-secondary" onClick={() => setPoQuestions([...poQuestions, { text: '', type: 'mcq', poCode: '', options: [] }])}>
              + Add PO Question
            </button>
          </div>
          <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            These questions specifically evaluate selected POs and PSOs.
          </p>

          {poQuestions.map((q, qIdx) => (
            <POQuestionEditor
              key={`poq_${qIdx}`}
              question={q}
              onChange={(updated) => {
                const newQ = [...poQuestions];
                newQ[qIdx] = updated;
                setPoQuestions(newQ);
              }}
              onRemove={() => setPoQuestions(poQuestions.filter((_, i) => i !== qIdx))}
              availablePOs={availablePOs}
              availablePSOs={availablePSOs}
            />
          ))}
          {poQuestions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
              No PO/PSO specific questions added yet.
            </div>
          )}
        </div>

        {/* Sections */}
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="fb-section-card">
            <div className="fb-section-header">
              <input
                className="fb-section-title-input"
                value={section.title}
                onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                placeholder="Section title..."
              />
              {sections.length > 1 && (
                <button className="fb-section-remove" onClick={() => removeSection(sIdx)}>
                  Remove section
                </button>
              )}
            </div>

            {/* Questions */}
            {section.questions.map((q, qIdx) => (
              <QuestionEditor
                key={qIdx}
                question={q}
                onChange={(updated) => updateQuestion(sIdx, qIdx, updated)}
                onRemove={() => removeQuestion(sIdx, qIdx)}
                availablePOs={availablePOs}
                availablePSOs={availablePSOs}
              />
            ))}

            <button className="fb-add-question" onClick={() => addQuestion(sIdx)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
              </svg>
              Add Question
            </button>
          </div>
        ))}

        {/* Add Section */}
        <button className="fb-add-section" onClick={addSection}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          Add New Section
        </button>

        {/* Open-ended Questions */}
        <div className="fb-section-card">
          <h3>💬 Open-Ended Questions</h3>
          {openEndedQuestions.map((q, idx) => (
            <div key={idx} className="fb-open-question">
              <input
                type="text"
                value={q.text}
                onChange={(e) => {
                  const updated = [...openEndedQuestions];
                  updated[idx].text = e.target.value;
                  setOpenEndedQuestions(updated);
                }}
                placeholder="Your question..."
              />
              <button onClick={() => setOpenEndedQuestions(openEndedQuestions.filter((_, i) => i !== idx))}>
                &times;
              </button>
            </div>
          ))}
          <button className="fb-mcq-add" onClick={() => setOpenEndedQuestions([...openEndedQuestions, { text: '', required: false }])}>
            + Add open-ended question
          </button>
        </div>
      </main>
    </div>
  );
}
