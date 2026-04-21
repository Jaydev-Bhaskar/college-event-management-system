import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Star, AlertCircle, Calendar, MapPin, User, Mail, Briefcase, Send } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ExpertFeedbackForm() {
  const { eventId } = useParams();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Expert details
  const [expertName, setExpertName] = useState('');
  const [expertEmail, setExpertEmail] = useState('');
  const [designation, setDesignation] = useState('');

  // Responses
  const [responses, setResponses] = useState([]);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchExpertForm();
  }, [eventId]);

  const fetchExpertForm = async () => {
    try {
      const res = await axios.get(`${API_BASE}/feedback-forms/expert-form/${eventId}`);
      setFormData(res.data);
      // Initialize responses
      const initialResponses = (res.data.expertSection?.questions || []).map((q, i) => ({
        questionIndex: i,
        questionText: q.text,
        value: ''
      }));
      setResponses(initialResponses);
    } catch (err) {
      setError(err.response?.data?.message || 'Expert feedback form not available.');
    } finally {
      setLoading(false);
    }
  };

  const updateResponse = (index, value) => {
    const updated = [...responses];
    updated[index] = { ...updated[index], value };
    setResponses(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expertName.trim()) {
      alert('Please enter your name.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/feedback/expert`, {
        eventId,
        expertName,
        expertEmail,
        designation,
        responses,
        comments
      });
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }) : '';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 440, background: 'var(--bg-base)', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <AlertCircle size={48} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Form Not Available</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, background: 'var(--bg-base)', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Thank You!</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your expert feedback for <strong>{formData?.event?.title}</strong> has been submitted successfully.
            The event organizer will review your responses.
          </p>
        </div>
      </div>
    );
  }

  const questions = formData?.expertSection?.questions || [];
  const event = formData?.event;

  const renderQuestionInput = (q, index) => {
    const val = responses[index]?.value || '';

    if (q.type === 'rating_1_5') {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n} type="button"
              onClick={() => updateResponse(index, n)}
              style={{
                width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                border: val === n ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: val === n ? 'var(--primary-light)' : 'var(--bg-body)',
                color: val === n ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {n}
            </button>
          ))}
        </div>
      );
    }

    if (q.type === 'rating_1_3') {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {[1, 2, 3].map(n => (
            <button
              key={n} type="button"
              onClick={() => updateResponse(index, n)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)',
                border: val === n ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: val === n ? 'var(--primary-light)' : 'var(--bg-body)',
                color: val === n ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {n === 1 ? 'Poor' : n === 2 ? 'Average' : 'Excellent'}
            </button>
          ))}
        </div>
      );
    }

    if (q.type === 'mcq') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {(q.options || []).map((opt, oi) => (
            <label key={oi} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              border: val === opt ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: val === opt ? 'var(--primary-light)' : 'var(--bg-body)',
              transition: 'all 0.15s'
            }}>
              <input
                type="radio" name={`expert_q_${index}`} value={opt}
                checked={val === opt}
                onChange={() => updateResponse(index, opt)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: val === opt ? 600 : 400 }}>{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    if (q.type === 'yes_no') {
      return (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          {['Yes', 'No'].map(opt => (
            <button
              key={opt} type="button"
              onClick={() => updateResponse(index, opt)}
              style={{
                padding: '0.5rem 2rem', borderRadius: 'var(--radius-sm)',
                border: val === opt ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: val === opt ? 'var(--primary-light)' : 'var(--bg-body)',
                color: val === opt ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (q.type === 'long_text') {
      return (
        <textarea
          className="form-input"
          rows={3}
          placeholder="Enter your detailed response..."
          value={val}
          onChange={(e) => updateResponse(index, e.target.value)}
          style={{ marginTop: '0.5rem' }}
        />
      );
    }

    // short_text default
    return (
      <input
        className="form-input"
        placeholder="Enter your response..."
        value={val}
        onChange={(e) => updateResponse(index, e.target.value)}
        style={{ marginTop: '0.5rem' }}
      />
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: 'var(--radius-lg)', padding: '2rem 2rem 1.5rem', marginBottom: '1.5rem',
          color: '#fff'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(255,255,255,0.15)', padding: '0.3rem 0.85rem',
            borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
            marginBottom: '1rem', backdropFilter: 'blur(8px)'
          }}>
            <Star size={13} /> Expert Feedback Form
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {event?.title || 'Event Feedback'}
          </h1>
          {event && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', opacity: 0.85, fontSize: '0.85rem' }}>
              {event.date && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} /> {formatDate(event.date)}
                </span>
              )}
              {event.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} /> {event.location}
                </span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Expert Info Card */}
          <div style={{
            background: 'var(--bg-base)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1rem'
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Your Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} /> Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input className="form-input" placeholder="Dr. John Smith" value={expertName}
                  onChange={(e) => setExpertName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} /> Email
                </label>
                <input className="form-input" type="email" placeholder="john@university.edu" value={expertEmail}
                  onChange={(e) => setExpertEmail(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Briefcase size={14} /> Designation / Organization
              </label>
              <input className="form-input" placeholder="e.g. Professor, IIT Delhi" value={designation}
                onChange={(e) => setDesignation(e.target.value)} />
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, index) => (
            <div key={q._id || index} style={{
              background: 'var(--bg-base)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                }}>
                  {index + 1}
                </span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {q.text}
                    {q.required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
                  </p>
                  <span style={{
                    fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {q.type.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              {renderQuestionInput(q, index)}
            </div>
          ))}

          {/* Additional Comments */}
          <div style={{
            background: 'var(--bg-base)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem' }}>Additional Comments</h3>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Share any additional thoughts, suggestions, or observations about the event..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
            style={{ width: '100%', borderRadius: 'var(--radius-md)', fontSize: '1rem', padding: '0.85rem' }}
          >
            {submitting ? 'Submitting...' : (
              <><Send size={18} /> Submit Expert Feedback</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
