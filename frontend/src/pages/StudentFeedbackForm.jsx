import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useToast } from '../context/ToastContext';

export default function StudentFeedbackForm() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formConfig, setFormConfig] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const [formRes, eventRes, regsRes] = await Promise.all([
          API.get(`/feedback-forms/event/${eventId}`),
          API.get(`/events/${eventId}`),
          API.get('/registrations/my-events')
        ]);

        const form = formRes.data;
        const event = eventRes.data;
        const myRegs = regsRes.data || [];

        // Add admin/organizer bypass so they can preview the form
        const isRegistered = myRegs.some(reg => reg.eventId?._id === eventId || reg.eventId === eventId);
        
        // Wait, what if the user is an organizer or admin previewing the form?
        const currentUserStr = localStorage.getItem('user');
        const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        const isPrivileged = currentUser && ['admin', 'organizer'].includes(currentUser.role);

        if (!isRegistered && !isPrivileged) {
          addToast("You must be registered for this event to submit feedback.", "error");
          navigate('/events');
          return;
        }

        if (form.status === 'draft') {
          throw new Error('Form not published');
        }

        setFormConfig(form);
        setEventData(event);
        
        // Initialize default answers
        const initial = {};
        form.sections?.forEach(s => {
          s.questions?.forEach(q => initial[q._id || q.text] = '');
        });
        form.poQuestions?.forEach((q, idx) => initial[q._id || `poq_${idx}`] = '');
        form.openEndedQuestions?.forEach((q, idx) => initial[q._id || `oeq_${idx}`] = '');
        setAnswers(initial);
      } catch (err) {
        addToast(err.message === 'Form not published' ? "Form hasn't been published yet." : "Feedback form not found.", "error");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [eventId, navigate, addToast]);

  const handleUpdate = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let totalRating = 0;
      let ratingCount = 0;
      const responses = [];
      
      formConfig.sections?.forEach((s, sIdx) => {
        s.questions?.forEach((q, qIdx) => {
          let val = answers[q._id || q.text];
          if (q.type === 'mcq' && val !== undefined && val !== '') val = q.options[Number(val)];
          
          if (q.type === 'rating_1_5' && val) {
            totalRating += Number(val);
            ratingCount++;
          }

          responses.push({
            sectionId: s.title,
            questionIndex: qIdx,
            value: val
          });
        });
      });

      const poResponses = [];
      formConfig.poQuestions?.forEach((q, qIdx) => {
        let val = answers[q._id || `poq_${qIdx}`];
        if (q.type === 'mcq' && val !== undefined && val !== '') val = q.options[Number(val)];

        if (q.type === 'rating_1_5' && val) {
          totalRating += Number(val);
          ratingCount++;
        }

        poResponses.push({
          poCode: q.poCode || 'General',
          questionIndex: qIdx,
          selectedOption: String(val)
        });
      });

      const openEndedResponses = [];
      formConfig.openEndedQuestions?.forEach((q, qIdx) => {
        openEndedResponses.push({
          questionIndex: qIdx,
          answer: answers[q._id || `oeq_${qIdx}`]
        });
      });

      const calculatedOverall = ratingCount > 0 ? (totalRating / ratingCount) : 5;

      const payload = {
        eventId,
        responses,
        poResponses,
        openEndedResponses,
        overallRating: calculatedOverall
      };

      await API.post(`/feedback/student`, payload);
      addToast('Feedback submitted successfully! Thank you.', 'success');
      navigate('/dashboard/certificates');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit feedback.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-center">Loading feedback form...</div>;
  if (!formConfig) return null;

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{eventData?.title} - Feedback</h1>
        <p className="text-secondary">Please fill out this evaluation form. Your responses are vital for our quality assessment.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {formConfig.sections.map((section, sIdx) => (
          <div key={sIdx} className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{section.title}</h3>
            {section.questions.map((q, qIdx) => {
              const qId = q._id || q.text;
              return (
              <div key={qId} style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  {q.text} {q.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                </p>
                
                {q.type === 'mcq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options?.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name={qId} value={i} checked={String(answers[qId]) === String(i)} onChange={(e) => handleUpdate(qId, e.target.value)} required={q.required} />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'rating_1_5' && (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {[1,2,3,4,5].map(v => (
                      <label key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="radio" name={qId} value={v} checked={String(answers[qId]) === String(v)} onChange={(e) => handleUpdate(qId, e.target.value)} required={q.required} />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'short_text' && (
                  <input type="text" className="form-control" value={answers[qId] || ''} onChange={(e) => handleUpdate(qId, e.target.value)} required={q.required} placeholder="Your answer" />
                )}
              </div>
            )})}
          </div>
        ))}

        {formConfig.poQuestions?.length > 0 && (
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Program Outcomes (PO) mapping</h3>
            {formConfig.poQuestions.map((q, idx) => {
              const qId = q._id || `poq_${idx}`;
              return (
              <div key={qId} style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  {q.text} {q.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                </p>
                {q.type === 'mcq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options?.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name={qId} value={i} checked={String(answers[qId]) === String(i)} onChange={(e) => handleUpdate(qId, e.target.value)} required={q.required} />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'rating_1_5' && (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {[1,2,3,4,5].map(v => (
                      <label key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="radio" name={qId} value={v} checked={String(answers[qId]) === String(v)} onChange={(e) => handleUpdate(qId, e.target.value)} required={q.required} />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'short_text' && (
                  <input type="text" className="form-control" value={answers[qId] || ''} onChange={(e) => handleUpdate(qId, e.target.value)} required={q.required} placeholder="Your answer" />
                )}
              </div>
            )})}
          </div>
        )}

        {formConfig.openEndedQuestions?.length > 0 && (
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Additional Feedback</h3>
            {formConfig.openEndedQuestions.map((q, idx) => {
              const qId = q._id || `oeq_${idx}`;
              return (
              <div key={qId} style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  {q.text} {q.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                </p>
                <textarea className="form-control" rows="3" value={answers[qId] || ''} onChange={(e) => handleUpdate(qId, e.target.value)} required={q.required} placeholder="Your feedback..." style={{ width: '100%', resize: 'vertical' }}></textarea>
              </div>
            )})}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}
