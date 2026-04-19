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
        <div className="dashboard-header">
          <div>
            <h1>System Settings</h1>
            <p className="text-secondary">Configure platform settings for {user.department}</p>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="settings-grid">
          {/* Institution */}
          <div className="settings-card">
            <h3>🏫 Institution</h3>
            <div className="form-group">
              <label>Institution Name</label>
              <input
                type="text"
                value={settings.institutionName || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, institutionName: e.target.value }))}
                placeholder="e.g. XYZ College of Engineering"
              />
            </div>
          </div>

          {/* Event Managers */}
          <div className="settings-card">
            <h3>👥 Event Managers</h3>
            <div className="form-group">
              <label>Maximum Event Managers per Event</label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxEventManagers}
                onChange={(e) => setSettings(prev => ({ ...prev, maxEventManagers: parseInt(e.target.value) || 5 }))}
              />
              <p className="form-hint">Organizers can assign up to this many managers per event</p>
            </div>
          </div>

          {/* Grace Period */}
          <div className="settings-card">
            <h3>⏱️ Organizer Grace Period</h3>
            <div className="form-group">
              <label>Days after last event ends</label>
              <input
                type="number"
                min="7"
                max="90"
                value={settings.organizerGracePeriodDays}
                onChange={(e) => setSettings(prev => ({ ...prev, organizerGracePeriodDays: parseInt(e.target.value) || 30 }))}
              />
              <p className="form-hint">Organizer privilege is auto-reverted after this many days with no active events</p>
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
            <div className="settings-add-category">
              <input
                type="text"
                placeholder="New category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              />
              <button className="btn-secondary" onClick={addCategory}>Add</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
