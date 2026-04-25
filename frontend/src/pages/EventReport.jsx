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
    objectives: ''
  });

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
      setEvent(resEvent.data);
      setEditForm({
        targetClass: resEvent.data.targetClass || '',
        subjectName: resEvent.data.subjectName || '',
        sessionCoordinator: resEvent.data.sessionCoordinator || resEvent.data.organizerId?.name || '',
        department: resEvent.data.department || resEvent.data.organizerId?.department || '',
        agenda: resEvent.data.agenda || '',
        objectives: resEvent.data.objectives || ''
      });
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
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Edit Report Metadata</h3>
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
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Event Objectives (One per line)</label>
            <textarea className="form-input" rows="3" value={editForm.objectives} onChange={(e) => setEditForm({...editForm, objectives: e.target.value})} placeholder="To create awareness about...&#10;To motivate students to..." />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Session Agenda / Schedule</label>
            <textarea className="form-input" rows="2" value={editForm.agenda} onChange={(e) => setEditForm({...editForm, agenda: e.target.value})} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={handleUpdateMetadata}>
              <Save size={16} /> Save Report Info
            </button>
          </div>
        </div>
      )}

      {/* FORMAL REPORT VIEW (Visible in Print) */}
      <div className="formal-report glass-card" style={{ padding: '3rem' }}>
        {/* Header with Logo Placeholders */}
        <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 60, height: 60, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>LOGO</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', margin: 0 }}>Maratha Vidya Prasarak Samaj's</p>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Karmaveer Adv. Baburao Ganpatrao Thakare</p>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>College of Engineering, Nashik</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: 120, height: 40, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', marginLeft: 'auto' }}>NBA/NAAC</div>
            <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>Permanently Affiliated to Savitribai Phule Pune University</p>
          </div>
        </div>

        <div className="report-title" style={{ marginTop: '1.5rem' }}>
          Department of {event.department || 'Computer Engineering'}
        </div>
        
        <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: '2rem' }}>
          EXPERT FEEDBACK ANALYSIS
        </div>

        <table className="report-table">
          <tbody>
            <tr>
              <th style={{ width: '20%' }}>Title:</th>
              <td colSpan="3">{event.title}</td>
            </tr>
            <tr>
              <th>Date:</th>
              <td style={{ width: '30%' }}>{new Date(event.date).toLocaleDateString('en-GB')}</td>
              <th style={{ width: '20%' }}>Class:</th>
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
              <th>Subject Name:</th>
              <td colSpan="3">{event.subjectName || 'N/A'}</td>
            </tr>
            <tr>
              <th>Coordinator:</th>
              <td colSpan="3">{event.sessionCoordinator || 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        <div className="report-section-title">Objective</div>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          {(event.objectives || 'To impart knowledge on ' + event.title).split('\n').map((obj, i) => (
            <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{obj}</li>
          ))}
        </ul>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <strong>POs covered:</strong> {analytics?.formStructure?.poMapping?.join(', ') || 'N/A'}
          </div>
          <div>
            <strong>PSOs covered:</strong> {analytics?.formStructure?.psoMapping?.join(', ') || 'N/A'}
          </div>
        </div>

        {/* Expert Feedback Section */}
        {analytics?.expertFeedbacks?.length > 0 && (
          <>
            <div className="report-section-title">Expert's Feedback Analysis:</div>
            <table className="report-table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  <th>Particular</th>
                  {[1,2,3,4,5,6,7,8].map(n => <th key={n}>{n}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left' }}>Response</td>
                  {[0,1,2,3,4,5,6,7].map(idx => (
                    <td key={idx}>{analytics.expertFeedbacks[0].responses?.find(r => r.questionIndex === idx)?.value || 'NA'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '1rem' }}>
              (1: Audio Visual, 2: Cooperation, 3: Understanding Level, 4: Interaction, 5: Question Level, 6: Food, 7: Accommodation, 8: Overall)
            </p>
            {analytics.expertFeedbacks[0].comments && (
              <p style={{ fontSize: '0.9rem' }}><strong>Expert Comments:</strong> {analytics.expertFeedbacks[0].comments}</p>
            )}
          </>
        )}

        {/* Students Feedback Section */}
        <div className="report-section-title">Students Feedback Analysis:</div>
        <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Total Responses: {analytics?.totalResponses || 0}</p>
        
        <table className="report-table" style={{ textAlign: 'center' }}>
          <thead>
            <tr>
              <th>Section / Question</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>5</th>
              <th>Avg.</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.sectionAverages && Object.keys(analytics.sectionAverages).map(sectionTitle => (
              <tr key={sectionTitle}>
                <td style={{ textAlign: 'left' }}><strong>{sectionTitle}</strong></td>
                <td colSpan="5">-- Section Averages --</td>
                <td>{analytics.sectionAverages[sectionTitle].average}</td>
              </tr>
            ))}
            <tr>
              <td style={{ textAlign: 'left' }}><strong>Overall Satisfaction</strong></td>
              <td colSpan="5">-- Scale 1-5 --</td>
              <td><strong>{analytics?.overallAverage || 'N/A'}</strong></td>
            </tr>
          </tbody>
        </table>

        {/* PO Mapping Table */}
        <div className="report-section-title">PO / PSO Mapping Analysis:</div>
        <table className="report-table" style={{ textAlign: 'center' }}>
          <thead>
            <tr>
              {analytics?.poAverages && Object.keys(analytics.poAverages).map(code => <th key={code}>{code}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              {analytics?.poAverages && Object.keys(analytics.poAverages).map(code => (
                <td key={code}>{analytics.poAverages[code]}</td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Qualitative Responses */}
        <div className="report-section-title">Key Feedback Observations:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Useful Elements / Strengths:</p>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
              {analytics?.openEndedResponses?.slice(0, 5).map((r, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{r.answer}</li>
              )) || <li>No qualitative data available</li>}
            </ul>
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Suggestions / Action Taken:</p>
            <p style={{ fontSize: '0.85rem' }}>
              <strong>Observation:</strong> Students generally appreciated the {event.title} session. Average satisfaction is {analytics?.overallAverage}/5.
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <strong>Action Taken:</strong> Plan more interactive sessions with real-life case studies in future.
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="report-footer-sigs">
          <div className="sig-box">
            <p>{event.sessionCoordinator || 'Coordinator Name'}</p>
            <p>Session Coordinator</p>
          </div>
          <div className="sig-box">
            <p>Programme Coordinator</p>
          </div>
          <div className="sig-box">
            <p>Dr. B. S. Tarle</p>
            <p>HOD - {event.department || 'Computer'}</p>
          </div>
        </div>

        {/* ATTACHED IMAGES - Starts on new page in print */}
        <div className="page-break" style={{ marginTop: '3rem' }}>
          <div className="report-section-title" style={{ borderBottom: '2px solid black' }}>Event Gallery & Evidence</div>
          
          {!event.reportImages || event.reportImages.length === 0 ? (
            <p style={{ fontStyle: 'italic', marginTop: '1rem' }}>No event images attached to this report.</p>
          ) : (
            <div className="report-images-grid" style={{ marginTop: '1.5rem' }}>
              {event.reportImages.map((imgUrl, idx) => (
                <div key={idx} className="report-image-item" style={{ marginBottom: '2rem' }}>
                  <img src={imgUrl} alt={`Event photo ${idx+1}`} style={{ width: '100%', height: '220px', objectFit: 'cover', border: '1px solid #000', marginBottom: '0.5rem' }} />
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }}>Figure {idx + 1}: Event Highlight</p>
                  
                  {/* Remove button only visible in UI, not print */}
                  <div className="no-print" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeImage(idx)}>
                      <Trash2 size={14} /> Remove from report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isOrganizerOrAdmin && (
            <div className="no-print" style={{ marginTop: '2rem', padding: '2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <ImageIcon size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
              <h4>Add more proof of event</h4>
              <p style={{ marginBottom: '1rem' }}>Upload high-quality images to include in the official report.</p>
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
