import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSettings, updateSettings } from '../api/services';
import Sidebar from '../components/Sidebar';
import {
  LayoutDashboard, Users, Calendar, BarChart3, Settings,
  UserPlus, FileText
} from 'lucide-react';

export default function SystemSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    maxEventManagers: 5,
    organizerGracePeriodDays: 30,
    categories: [],
    institutionName: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const sidebarLinks = [
    {
      title: '',
      items: [
        { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
        { path: '/admin/requests', label: 'Organizer Requests', icon: <UserPlus size={18} /> },
        { path: '/admin/events', label: 'Events', icon: <Calendar size={18} /> },
        { path: '/admin/students', label: 'Students', icon: <Users size={18} /> },
        { path: '/admin/po-bank', label: 'PO/PSO Bank', icon: <BarChart3 size={18} /> },
        { path: '/admin/reports', label: 'Reports', icon: <FileText size={18} /> },
      ]
    },
    { title: '', items: [
      { path: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
    ]}
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings(user.department);
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        department: user.department,
        ...settings
      });
      alert('Settings saved successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    setSettings(prev => ({
      ...prev,
      categories: [...(prev.categories || []), newCategory.trim()]
    }));
    setNewCategory('');
  };

  const removeCategory = (idx) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== idx)
    }));
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar links={sidebarLinks} />
        <main className="dashboard-content"><div className="loading-center">Loading settings...</div></main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar links={sidebarLinks} />
      <main className="dashboard-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>System Settings</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure platform settings for {user.department}</p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="settings-grid">
          {/* Institution */}
          <div className="settings-card">
            <h3>🏫 Institution</h3>
            <div className="form-group">
              <label className="form-label">Institution Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.institutionName || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, institutionName: e.target.value }))}
                placeholder="e.g. XYZ College of Engineering"
              />
            </div>
          </div>

          {/* Communications */}
          <div className="settings-card">
            <h3>💬 Communications</h3>
            <div className="form-group">
              <label className="form-label">Global Notification WhatsApp Group Link</label>
              <input
                type="url"
                className="form-input"
                value={settings.globalWhatsappLink || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, globalWhatsappLink: e.target.value }))}
                placeholder="https://chat.whatsapp.com/..."
              />
              <p className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Students will see this link to join the central notification group.</p>
            </div>
          </div>

          {/* Payments */}
          <div className="settings-card">
            <h3>💰 Payments</h3>
            <div className="form-group mb-3">
              <label className="form-label">UPI ID</label>
              <input
                type="text"
                className="form-input"
                value={settings.upiId || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, upiId: e.target.value }))}
                placeholder="college@upi"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment QR Code</label>
              <div style={{ 
                border: '2px dashed var(--border)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1rem', 
                textAlign: 'center',
                background: 'var(--bg-body)',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onloadend = () => setSettings(prev => ({ ...prev, paymentQRCode: r.result }));
                    r.readAsDataURL(file);
                  }}
                />
                {settings.paymentQRCode ? (
                  <img src={settings.paymentQRCode} alt="Payment QR" style={{ maxHeight: 100, display: 'block', margin: '0 auto' }} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Click to upload payment QR code</div>
                )}
              </div>
            </div>
          </div>

          {/* Event Managers */}
          <div className="settings-card">
            <h3>👥 Event Managers</h3>
            <div className="form-group">
              <label className="form-label">Maximum Event Managers per Event</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="20"
                value={settings.maxEventManagers}
                onChange={(e) => setSettings(prev => ({ ...prev, maxEventManagers: parseInt(e.target.value) || 5 }))}
              />
              <p className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Organizers can assign up to this many managers per event</p>
            </div>
          </div>

          {/* Grace Period */}
          <div className="settings-card">
            <h3>⏱️ Organizer Grace Period</h3>
            <div className="form-group">
              <label className="form-label">Days after last event ends</label>
              <input
                type="number"
                className="form-input"
                min="7"
                max="90"
                value={settings.organizerGracePeriodDays}
                onChange={(e) => setSettings(prev => ({ ...prev, organizerGracePeriodDays: parseInt(e.target.value) || 30 }))}
              />
              <p className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Organizer privilege is auto-reverted after this many days with no active events</p>
            </div>
          </div>

          {/* Event Categories */}
          <div className="settings-card settings-card-wide">
            <h3>🏷️ Event Categories</h3>
            <div className="settings-categories">
              {(settings.categories || []).map((cat, idx) => (
                <span key={idx} className="settings-category-tag">
                  {cat}
                  <button onClick={() => removeCategory(idx)}>&times;</button>
                </span>
              ))}
            </div>
            <div className="settings-add-category" style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="New category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              />
              <button className="btn btn-secondary" onClick={addCategory}>Add</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
