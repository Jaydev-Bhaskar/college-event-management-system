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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/events/${eventId}`);
      setEvent(res.data);
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
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem' }}>
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

        {/* Existing report sections would go here (e.g. charts, analytics, feedback summaries) */}
        <div style={{ marginBottom: '3rem', padding: '2rem', background: 'var(--bg-body)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem' }}>Feedback Analytics Area</h3>
          <p className="text-secondary" style={{ fontStyle: 'italic' }}>Charts, graphs, and PO/PSO mapping data will render here.</p>
        </div>

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
