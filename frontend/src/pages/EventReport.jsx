import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Image as ImageIcon, Upload, Trash2, Download, Edit3, Save, X } from 'lucide-react';

export default function EventReport() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    targetClass: '',
    subjectName: '',
    sessionCoordinator: '',
    department: '',
    agenda: '',
    objectives: '',
    activitySummary: '',
    outcomes: '',
    studentParticipationCount: '',
    keyHighlights: '',
    challenges: '',
    conclusion: '',
    futureScope: '',
    selectedCOs: [],
    hodName: '',
    actionTaken: '',
    programmeCoordinator: ''
  });

  const [availablePOs, setAvailablePOs] = useState([]);
  const [availablePSOs, setAvailablePSOs] = useState([]);

  const CO_OPTIONS = [
    { id: 'CO1', label: 'CO1: Understand basic concepts' },
    { id: 'CO2', label: 'CO2: Analyze system requirements' },
    { id: 'CO3', label: 'CO3: Design solutions' },
    { id: 'CO4', label: 'CO4: Implement and test' },
    { id: 'CO5', label: 'CO5: Evaluate performance' },
    { id: 'CO6', label: 'CO6: Demonstrate professional ethics' }
  ];

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resEvent, resAnalytics] = await Promise.all([
        API.get(`/events/${eventId}`),
        API.get(`/feedback/analytics/${eventId}`).catch(() => ({ data: null }))
      ]);
      const eventData = resEvent.data;
      setEvent(eventData);
      setEditForm({
        targetClass: eventData.targetClass || '',
        subjectName: eventData.subjectName || '',
        sessionCoordinator: eventData.sessionCoordinator || eventData.organizerId?.name || '',
        department: eventData.department || eventData.organizerId?.department || '',
        agenda: eventData.agenda || '',
        objectives: eventData.objectives || '',
        activitySummary: eventData.activitySummary || '',
        outcomes: eventData.outcomes || '',
        studentParticipationCount: eventData.studentParticipationCount || '',
        keyHighlights: eventData.keyHighlights || '',
        challenges: eventData.challenges || '',
        conclusion: eventData.conclusion || '',
        futureScope: eventData.futureScope || '',
        selectedCOs: eventData.selectedCOs || [],
        hodName: eventData.hodName || 'Dr. B. S. Tarle',
        actionTaken: eventData.actionTaken || '',
        programmeCoordinator: eventData.programmeCoordinator || 'Programme Coordinator'
      });

      // Load available POs/PSOs for this department
      const dept = eventData.department || user.department;
      if (dept) {
        API.get(`/po-bank?department=${dept}`).then(res => {
          setAvailablePOs(res.data.pos || []);
          setAvailablePSOs(res.data.psos || []);
        }).catch(() => {});
      }

      if (resAnalytics.data) {
        setAnalytics(resAnalytics.data);
      }
    } catch (err) {
      addToast('Failed to load event report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMetadata = async () => {
    try {
      await API.put(`/events/${eventId}`, editForm);
      setEvent({ ...event, ...editForm });
      setIsEditing(false);
      addToast('Report metadata updated!', 'success');
    } catch (err) {
      addToast('Failed to update metadata', 'error');
    }
  };

  const toggleCO = (coId) => {
    setEditForm(prev => {
      const selectedCOs = prev.selectedCOs.includes(coId)
        ? prev.selectedCOs.filter(id => id !== coId)
        : [...prev.selectedCOs, coId];
      return { ...prev, selectedCOs };
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const getBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      const base64Images = await Promise.all(files.map(f => getBase64(f)));
      const currentImages = event.reportImages || [];
      const newImages = [...currentImages, ...base64Images];

      await API.put(`/events/${eventId}`, { reportImages: newImages });
      setEvent({ ...event, reportImages: newImages });
      addToast('Images uploaded successfully!', 'success');
    } catch (err) {
      addToast('Failed to upload images', 'error');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const removeImage = async (indexMatch) => {
    try {
      const newImages = event.reportImages.filter((_, idx) => idx !== indexMatch);
      await API.put(`/events/${eventId}`, { reportImages: newImages });
      setEvent({ ...event, reportImages: newImages });
      addToast('Image removed', 'success');
    } catch (err) {
      addToast('Failed to remove image', 'error');
    }
  };

  if (loading) return <div className="loading-center">Loading Report...</div>;
  if (!event) return null;

  const isOrganizerOrAdmin = user?.role === 'admin' || user?._id === event.organizerId?._id || user?._id === event.organizerId;

  return (
    <div style={{ maxWidth: 1000, margin: 'calc(var(--navbar-height) + 2rem) auto 2rem', padding: '0 1rem' }}>
      <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isOrganizerOrAdmin && (
            <button className={`btn ${isEditing ? 'btn-ghost' : 'btn-outline'}`} onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <><X size={16} /> Cancel</> : <><Edit3 size={16} /> Edit Report Info</>}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Download size={16} /> Download Formal PDF
          </button>
        </div>
      </div>

      {/* Report Editing Form (Organizer Only) */}
      {isEditing && (
        <div className="glass-card no-print" style={{ padding: '2rem', marginBottom: '2rem', background: 'var(--primary-light)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Edit Final Report Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Target Class</label>
              <input className="form-input" value={editForm.targetClass} onChange={(e) => setEditForm({...editForm, targetClass: e.target.value})} placeholder="e.g. Second Year B. Tech" />
            </div>
            <div className="form-group">
              <label>Subject Name</label>
              <input className="form-input" value={editForm.subjectName} onChange={(e) => setEditForm({...editForm, subjectName: e.target.value})} placeholder="e.g. Introduction to Cyber Security" />
            </div>
            <div className="form-group">
              <label>Session Coordinator</label>
              <input className="form-input" value={editForm.sessionCoordinator} onChange={(e) => setEditForm({...editForm, sessionCoordinator: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input className="form-input" value={editForm.department} onChange={(e) => setEditForm({...editForm, department: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Student Participation Count</label>
              <input className="form-input" value={editForm.studentParticipationCount} onChange={(e) => setEditForm({...editForm, studentParticipationCount: e.target.value})} placeholder="e.g. 60 (approx.)" />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Course Outcomes (COs)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
              {CO_OPTIONS.map(co => (
                <label key={co.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.selectedCOs.includes(co.id)} onChange={() => toggleCO(co.id)} />
                  {co.id}
                </label>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              POs and PSOs are automatically linked from the Feedback Form structure.
            </p>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Event Objectives (One per line)</label>
            <textarea className="form-input" rows="3" value={editForm.objectives} onChange={(e) => setEditForm({...editForm, objectives: e.target.value})} placeholder="To create awareness about...&#10;To motivate students to..." />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Summary of Activity</label>
            <textarea className="form-input" rows="4" value={editForm.activitySummary} onChange={(e) => setEditForm({...editForm, activitySummary: e.target.value})} placeholder="Detailed description of what happened..." />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Outcomes (One per line)</label>
            <textarea className="form-input" rows="3" value={editForm.outcomes} onChange={(e) => setEditForm({...editForm, outcomes: e.target.value})} placeholder="Students understood...&#10;Awareness increased..." />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Key Highlights (One per line)</label>
            <textarea className="form-input" rows="3" value={editForm.keyHighlights} onChange={(e) => setEditForm({...editForm, keyHighlights: e.target.value})} placeholder="Interactive session...&#10;Real-life case studies..." />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Challenges</label>
            <textarea className="form-input" rows="2" value={editForm.challenges} onChange={(e) => setEditForm({...editForm, challenges: e.target.value})} />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Conclusion</label>
            <textarea className="form-input" rows="2" value={editForm.conclusion} onChange={(e) => setEditForm({...editForm, conclusion: e.target.value})} />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Future Scope</label>
            <textarea className="form-input" rows="2" value={editForm.futureScope} onChange={(e) => setEditForm({...editForm, futureScope: e.target.value})} />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Action Taken (Based on Feedback)</label>
            <textarea className="form-input" rows="3" value={editForm.actionTaken} onChange={(e) => setEditForm({...editForm, actionTaken: e.target.value})} placeholder="Describe the steps planned based on student/expert feedback..." />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Programme Coordinator Name</label>
            <input className="form-input" value={editForm.programmeCoordinator} onChange={(e) => setEditForm({...editForm, programmeCoordinator: e.target.value})} placeholder="Name of Programme Coordinator" />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>HOD's Name</label>
            <input className="form-input" value={editForm.hodName} onChange={(e) => setEditForm({...editForm, hodName: e.target.value})} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={handleUpdateMetadata}>
              <Save size={16} /> Save Final Report
            </button>
          </div>
        </div>
      )}

      {/* FORMAL REPORT VIEW (Visible in Print) */}
      <div className="formal-report glass-card" style={{ padding: '2rem', border: '1px solid #000', background: '#fff' }}>
        
        {/* Banner Header - Main */}
        <div style={{ width: '100%', marginBottom: '1.5rem' }}>
          <img 
            src="/banner.png" 
            alt="College Banner" 
            style={{ width: '100%', borderBottom: '1px solid #000' }} 
            onError={(e) => { 
              e.target.src = "https://replicate.delivery/xqz/8410298a-7848-479a-8c88-e9a9f029393c/image.png";
              e.target.onerror = null; 
            }}
          />
        </div>

        {/* ---------------- ACTIVITY REPORT SECTION ---------------- */}
        <div className="report-title" style={{ marginTop: '1rem' }}>
          ACTIVITY REPORT
        </div>
        <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: '1.5rem' }}>
          Department of {event.department || 'Computer Engineering'}
        </div>

        <table className="report-table">
          <tbody>
            <tr>
              <th style={{ width: '25%' }}>Title of Activity:</th>
              <td colSpan="3">{event.title}</td>
            </tr>
            <tr>
              <th>Date:</th>
              <td style={{ width: '25%' }}>{new Date(event.date).toLocaleDateString('en-GB')}</td>
              <th style={{ width: '25%' }}>Class:</th>
              <td>{event.targetClass || 'N/A'}</td>
            </tr>
            <tr>
              <th>Resource Person:</th>
              <td colSpan="3">
                {analytics?.expertFeedbacks?.[0]?.expertName || 'N/A'} 
                {analytics?.expertFeedbacks?.[0]?.designation && `, ${analytics.expertFeedbacks[0].designation}`}
                {analytics?.expertFeedbacks?.[0]?.organization && `, ${analytics.expertFeedbacks[0].organization}`}
              </td>
            </tr>
            <tr>
              <th>Subject:</th>
              <td colSpan="3">{event.subjectName || 'N/A'}</td>
            </tr>
            <tr>
              <th>Coordinator:</th>
              <td colSpan="3">{event.sessionCoordinator || 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        <div className="report-section-title">Objective</div>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          {(event.objectives || 'To impart knowledge on ' + event.title).split('\n').map((obj, i) => (
            <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>{obj}</li>
          ))}
        </ul>

        <div className="report-section-title">Summary of Activity</div>
        <p style={{ fontSize: '0.9rem', textAlign: 'justify', marginBottom: '1rem' }}>
          {event.activitySummary || 'An expert talk on ' + event.title + ' was conducted for ' + (event.targetClass || 'students') + '. The session provided practical knowledge and real-world insights.'}
        </p>

        <div className="report-section-title">Outcomes</div>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          {(event.outcomes || 'Students gained knowledge about ' + event.title).split('\n').map((out, i) => (
            <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>{out}</li>
          ))}
        </ul>

        <div className="report-section-title">Student Participation</div>
        <p style={{ fontSize: '0.9rem' }}>Total number of students attended: {event.studentParticipationCount || analytics?.totalResponses || 'N/A'}</p>

        <div className="report-section-title">Key Highlights</div>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          {(event.keyHighlights || 'Interactive session with expert').split('\n').map((high, i) => (
            <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>{high}</li>
          ))}
        </ul>

        {event.challenges && (
          <>
            <div className="report-section-title">Challenges</div>
            <p style={{ fontSize: '0.9rem' }}>{event.challenges}</p>
          </>
        )}

        <div className="report-section-title">Conclusion</div>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{event.conclusion || 'The session was highly beneficial and informative for the participants.'}</p>

        {event.futureScope && (
          <>
            <div className="report-section-title">Future Scope</div>
            <p style={{ fontSize: '0.9rem' }}>{event.futureScope}</p>
          </>
        )}

        <div className="page-break"></div>

        {/* ---------------- FEEDBACK ANALYSIS SECTION ---------------- */}
        <div style={{ width: '100%', marginBottom: '1.5rem' }} className="print-only">
          <img 
            src="/banner.png" 
            alt="College Banner" 
            style={{ width: '100%', borderBottom: '1px solid #000' }} 
            onError={(e) => { 
              e.target.src = "https://replicate.delivery/xqz/8410298a-7848-479a-8c88-e9a9f029393c/image.png";
              e.target.onerror = null; 
            }}
          />
        </div>

        <div className="report-title">
          EXPERT FEEDBACK ANALYSIS
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <div><strong>COs Covered:</strong> {event.selectedCOs?.join(', ') || 'N/A'}</div>
          <div><strong>Mission Tags:</strong> M2</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <div>
            <strong>POs covered:</strong> {analytics?.formStructure?.poMapping?.join(', ') || 'N/A'}
          </div>
          <div>
            <strong>PSOs covered:</strong> {analytics?.formStructure?.psoMapping?.join(', ') || 'N/A'}
          </div>
        </div>

        {/* Expert Feedback Table */}
        {analytics?.expertFeedbacks?.length > 0 && analytics?.formStructure?.expertSection?.questions?.length > 0 && (
          <>
            <div className="report-section-title">Expert's Feedback Analysis:</div>
            <table className="report-table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  <th>Particular</th>
                  {analytics.formStructure.expertSection.questions.map((q, idx) => (
                    <th key={idx}>{idx + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left' }}>Response</td>
                  {analytics.formStructure.expertSection.questions.map((q, idx) => (
                    <td key={idx}>{analytics.expertFeedbacks[0].responses?.find(r => r.questionIndex === idx)?.value || 'NA'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '1rem' }}>
              ({analytics.formStructure.expertSection.questions.map((q, idx) => `${idx + 1}: ${q.text}`).join(', ')})
            </p>
          </>
        )}

        {/* Students Feedback Section */}
        {analytics?.formStructure?.sections?.length > 0 && (
          <>
            <div className="report-section-title">Students Feedback Analysis:</div>
            <table className="report-table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Section / Question</th>
                  <th>Avg. Rating (out of 5)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.formStructure.sections.map(section => {
                  if (!section.questions || section.questions.length === 0) return null;
                  const sectionKey = section.title;
                  const rows = [];
                  rows.push(
                    <tr key={section._id} style={{ backgroundColor: '#f3f4f6' }}>
                      <td style={{ textAlign: 'left' }}><strong>{section.title}</strong></td>
                      <td><strong>{analytics.sectionAverages?.[sectionKey]?.average || '0.00'}</strong></td>
                    </tr>
                  );
                  section.questions.forEach((q, idx) => {
                    rows.push(
                      <tr key={q._id || `${section._id}_q${idx}`}>
                        <td style={{ textAlign: 'left', paddingLeft: '2rem' }}>{q.text}</td>
                        <td>{analytics.sectionAverages?.[sectionKey]?.questions?.[`${sectionKey}_q${idx}`]?.average || '0.00'}</td>
                      </tr>
                    );
                  });
                  return rows;
                })}
                <tr style={{ background: '#e5e7eb' }}>
                  <td style={{ textAlign: 'left' }}><strong>Overall Satisfaction</strong></td>
                  <td><strong>{analytics?.overallAverage || 'N/A'}</strong></td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* PO Mapping Table */}
        {analytics?.formStructure?.poQuestions?.length > 0 && (
          <>
            <div className="report-section-title">PO / PSO Mapping Analysis:</div>
            <table className="report-table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  {analytics.formStructure.poQuestions.map((q, idx) => (
                    <th key={q._id || idx}>{q.poCode}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {analytics.formStructure.poQuestions.map((q, idx) => (
                    <td key={q._id || idx}>{analytics.poAverages?.[q.poCode] || '0'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </>
        )}

        <div className="report-section-title">Action Taken</div>
        <p style={{ fontSize: '0.9rem' }}>
          {event.actionTaken || `Based on the feedback (Avg. Satisfaction: ${analytics?.overallAverage || '4.5'}/5), the session was highly rated. We will continue to organize such industry-relevant expert talks.`}
        </p>

        {/* Signatures */}
        <div className="report-footer-sigs">
          <div className="sig-box">
            <p>{event.sessionCoordinator || 'Coordinator Name'}</p>
            <p>Session Coordinator</p>
          </div>
          <div className="sig-box">
            <p>{event.programmeCoordinator || 'Programme Coordinator'}</p>
            <p>Programme Coordinator</p>
          </div>
          <div className="sig-box">
            <p>{event.hodName || 'Dr. B. S. Tarle'}</p>
            <p>HOD - {event.department || 'Computer Engineering'}</p>
          </div>
        </div>

        {/* ---------------- IMAGES SECTION ---------------- */}
        <div className="page-break">
          <div style={{ width: '100%', marginBottom: '1.5rem' }} className="print-only">
            <img 
              src="/banner.png" 
              alt="College Banner" 
              style={{ width: '100%', borderBottom: '1px solid #000' }} 
              onError={(e) => { 
                e.target.src = "https://replicate.delivery/xqz/8410298a-7848-479a-8c88-e9a9f029393c/image.png";
                e.target.onerror = null; 
              }}
            />
          </div>
          
          <div className="report-section-title" style={{ borderBottom: '2px solid black' }}>Event Gallery & Evidence</div>
          
          {!event.reportImages || event.reportImages.length === 0 ? (
            <p style={{ fontStyle: 'italic', marginTop: '1rem' }}>No event images attached to this report.</p>
          ) : (
            <div className="report-images-grid" style={{ marginTop: '1.5rem' }}>
              {event.reportImages.map((imgUrl, idx) => (
                <div key={idx} className="report-image-item" style={{ marginBottom: '2rem' }}>
                  <img src={imgUrl} alt={`Event photo ${idx+1}`} style={{ width: '100%', height: '220px', objectFit: 'cover', border: '1px solid #000', marginBottom: '0.5rem' }} />
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }}>Figure {idx + 1}: Event Highlight</p>
                  
                  <div className="no-print" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeImage(idx)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isOrganizerOrAdmin && (
            <div className="no-print" style={{ marginTop: '2rem', padding: '2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <ImageIcon size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
              <h4>Add proof of event</h4>
              <p style={{ marginBottom: '1rem' }}>Upload images to include in the official report.</p>
              <input type="file" id="img-upload-footer" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
              <label htmlFor="img-upload-footer" className="btn btn-primary">
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Gallery Images'}
              </label>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
