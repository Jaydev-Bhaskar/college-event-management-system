import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Image as ImageIcon, Upload, Trash2, Download } from 'lucide-react';

export default function EventReport() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
      if (resAnalytics.data) {
        setAnalytics(resAnalytics.data);
      }
    } catch (err) {
      addToast('Failed to load event report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      // Convert files to base64
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
      console.error(err);
      addToast('Failed to upload images', 'error');
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input
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
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }} className="text-gradient">
              Final Feedback Report
            </h1>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {event.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Date: {new Date(event.date).toLocaleDateString()} | Department: {event.department || 'N/A'}
            </p>
          </div>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Download size={16} /> Print/PDF
          </button>
        </div>

        {analytics ? (
          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Student Feedback Overview
            </h3>
            
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '2rem' }}>
              <div className="stat-card blue">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Responses</span>
                <div className="stat-value">{analytics.totalResponses}</div>
              </div>
              <div className="stat-card amber">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Overall Satisfaction</span>
                <div className="stat-value">{analytics.overallAverage} <span style={{ fontSize: '1rem' }}>/ 5</span></div>
              </div>
            </div>

            {analytics.expertFeedbacks && analytics.expertFeedbacks.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎓 Expert Feedback & Review
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {analytics.expertFeedbacks.map((ef, idx) => (
                    <div key={ef._id || idx} className="glass-card-static" style={{ padding: '1.5rem', background: 'var(--bg-active)' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>{ef.expertName || 'Expert Reviewer'}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{ef.designation || ef.expertEmail || ''}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        {ef.responses?.map((r, rIdx) => (
                          <div key={rIdx} style={{ background: 'var(--bg-body)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              {r.questionText || analytics.formStructure?.expertSection?.questions?.[r.questionIndex]?.text || `Question ${r.questionIndex + 1}`}
                            </p>
                            <p style={{ fontWeight: 500 }}>{r.value}</p>
                          </div>
                        ))}
                      </div>

                      {ef.comments && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Final Comments / Suggestions:</p>
                          <p style={{ fontStyle: 'italic' }}>"{ef.comments}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '3rem', padding: '2rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>No Feedback Data Available</h3>
            <p className="text-secondary" style={{ fontStyle: 'italic' }}>Feedback form hasn't been created or no reviews have been submitted yet.</p>
          </div>
        )}

        {/* Event Photos Section */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={24} color="var(--primary)" /> Event Gallery & Proof
            </h3>
            
            {isOrganizerOrAdmin && (
              <div>
                <input 
                  type="file" 
                  id="imageUpload" 
                  multiple 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <label htmlFor="imageUpload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Images'}
                </label>
              </div>
            )}
          </div>

          {!event.reportImages || event.reportImages.length === 0 ? (
            <div className="glass-card-static empty-state" style={{ padding: '3rem', background: 'var(--bg-body)' }}>
              <ImageIcon size={48} />
              <h4>No event images added yet</h4>
              <p>Upload photos from the event to be included in the final report.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {event.reportImages.map((imgUrl, idx) => (
                <div key={idx} style={{ 
                  position: 'relative', 
                  borderRadius: 'var(--radius-lg)', 
                  overflow: 'hidden',
                  aspectRatio: '16/9',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}>
                  <img src={imgUrl} alt={`Event photo ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {isOrganizerOrAdmin && (
                    <button 
                      className="btn-icon"
                      onClick={() => removeImage(idx)}
                      style={{ 
                        position: 'absolute', top: 8, right: 8, 
                        background: 'rgba(239, 68, 68, 0.9)', color: 'white', 
                        padding: '0.5rem', borderRadius: '50%',
                        border: 'none', cursor: 'pointer'
                      }}
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
