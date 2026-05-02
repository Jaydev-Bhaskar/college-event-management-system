import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Award, ShieldCheck, MapPin, Calendar } from 'lucide-react';

const Certificate = ({ registration, event, onDownloadComplete }) => {
  const certificateRef = useRef();

  const downloadCertificate = async () => {
    const element = certificateRef.current;
    const canvas = await html2canvas(element, {
      scale: 3, // High quality
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`Certificate_${registration.userId?.name || 'Student'}_${event.title}.pdf`);
    if (onDownloadComplete) onDownloadComplete();
  };

  if (!registration || !event) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Hidden Certificate for Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
          ref={certificateRef}
          style={{
            width: '1122px', // A4 Landscape ratio
            height: '794px',
            padding: '40px',
            background: 'white',
            position: 'relative',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '20px solid #1E293B',
            boxSizing: 'border-box'
          }}
        >
          {/* Inner Border */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            border: '2px solid #D4AF37',
            pointerEvents: 'none'
          }} />

          {/* Corner Elements */}
          <div style={{ position: 'absolute', top: '40px', left: '40px', width: '100px', height: '100px', borderTop: '4px solid #D4AF37', borderLeft: '4px solid #D4AF37' }} />
          <div style={{ position: 'absolute', top: '40px', right: '40px', width: '100px', height: '100px', borderTop: '4px solid #D4AF37', borderRight: '4px solid #D4AF37' }} />
          <div style={{ position: 'absolute', bottom: '40px', left: '40px', width: '100px', height: '100px', borderBottom: '4px solid #D4AF37', borderLeft: '4px solid #D4AF37' }} />
          <div style={{ position: 'absolute', bottom: '40px', right: '40px', width: '100px', height: '100px', borderBottom: '4px solid #D4AF37', borderRight: '4px solid #D4AF37' }} />

          {/* Content */}
          <div style={{ textAlign: 'center', zIndex: 10 }}>
            <div style={{ color: '#1E293B', fontSize: '18px', fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px' }}>
              University Events Portal
            </div>
            
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '64px', color: '#1E293B', margin: '20px 0', fontWeight: 900 }}>
              CERTIFICATE
            </h1>
            <div style={{ fontSize: '20px', color: '#64748B', fontStyle: 'italic', marginBottom: '30px' }}>
              of Achievement
            </div>

            <div style={{ fontSize: '18px', color: '#64748B', marginBottom: '10px' }}>
              This is to certify that
            </div>
            
            <div style={{ fontSize: '42px', fontWeight: 800, color: '#1E293B', borderBottom: '2px solid #D4AF37', display: 'inline-block', padding: '0 40px', marginBottom: '30px' }}>
              {registration.userId?.name || 'VALUED STUDENT'}
            </div>

            <div style={{ fontSize: '18px', color: '#64748B', maxWidth: '700px', lineHeight: 1.6, margin: '0 auto 40px auto' }}>
              has successfully participated in the event <strong style={{color: '#1E293B'}}>"{event.title}"</strong> 
              held at <strong style={{color: '#1E293B'}}>{event.location || 'Campus Main Grounds'}</strong> 
              on <strong style={{color: '#1E293B'}}>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
              Their contribution and active participation are highly appreciated.
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '800px', margin: '40px auto 0 auto' }}>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ borderBottom: '1px solid #1E293B', marginBottom: '10px', padding: '10px 0', height: '40px' }}>
                   {/* Placeholder for Signature */}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>Event Coordinator</div>
              </div>

              <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px dashed #D4AF37', borderRadius: '50%', animation: 'spin 20s linear infinite' }} />
                 <Award size={60} style={{ color: '#D4AF37' }} />
              </div>

              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ borderBottom: '1px solid #1E293B', marginBottom: '10px', padding: '10px 0', height: '40px' }}>
                  {/* Placeholder for Signature */}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>Faculty In-charge</div>
              </div>
            </div>

            {/* Verification Tag */}
            <div style={{ position: 'absolute', bottom: '45px', right: '45px', fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={12} />
              VERIFIED CERTIFICATE ID: {registration._id.toString().toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button 
          onClick={downloadCertificate}
          className="btn btn-primary btn-sm"
          disabled={registration.disabled}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.7rem 1.25rem',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            justifyContent: 'center',
            opacity: registration.disabled ? 0.6 : 1,
            cursor: registration.disabled ? 'not-allowed' : 'pointer',
            background: registration.disabled ? 'var(--bg-body)' : 'var(--primary)',
            color: registration.disabled ? 'var(--text-muted)' : 'white',
            border: registration.disabled ? '1px solid var(--border)' : 'none'
          }}
        >
          <Download size={16} /> 
          {registration.disabled ? 'Locked' : 'Download Certificate'}
        </button>

        {registration.disabled ? (
          <p style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 500 }}>
            {registration.disabledReason}
          </p>
        ) : (
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            High-resolution PDF (A4 Landscape)
          </p>
        )}
      </div>
    </div>
  );
};

export default Certificate;
