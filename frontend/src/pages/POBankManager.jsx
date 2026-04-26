import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPOBank, addPO, removePO } from '../api/services';
import Sidebar from '../components/Sidebar';
import {
  LayoutDashboard, Users, Calendar, BarChart3, Settings,
  UserPlus, FileText
} from 'lucide-react';

export default function POBankManager() {
  const { user } = useAuth();
  const [poBank, setPOBank] = useState({ pos: [], psos: [] });
  const [activeTab, setActiveTab] = useState('po');

  const isSuperAdmin = (!user || !user.department) || user.department === 'Global' || user.department === 'Central';
  const [selectedDept, setSelectedDept] = useState((user && user.department) ? user.department : 'Global');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
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
    loadPOBank();
  }, [selectedDept]);

  const loadPOBank = async () => {
    try {
      setLoading(true);
      const res = await getPOBank(selectedDept);
      setPOBank(res.data);
    } catch (err) {
      console.error('Failed to load PO bank:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addPO({
        department: selectedDept,
        code: newCode,
        description: newDescription,
        type: activeTab === 'pso' ? 'pso' : 'po'
      });
      setNewCode('');
      setNewDescription('');
      setShowAddModal(false);
      loadPOBank();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add');
    }
  };

  const handleRemove = async (code) => {
    if (!confirm(`Remove ${code}? This may affect existing feedback forms.`)) return;
    try {
      await removePO({
        department: selectedDept,
        code,
        type: activeTab === 'pso' ? 'pso' : 'po'
      });
      loadPOBank();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove');
    }
  };

  const items = activeTab === 'pso' ? poBank.psos : poBank.pos;
  const label = activeTab === 'pso' ? 'PSO' : 'PO';

  return (
    <div className="dashboard-layout">
      <Sidebar links={sidebarLinks} />
      <main className="dashboard-content">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>PO/PSO Bank</h1>
            <p className="text-secondary">
              {isSuperAdmin ? 'Global Admin overrides and access' : `Manage Programme Outcomes for ${selectedDept}`}
            </p>
          </div>
          <div>
            <select
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: !isSuperAdmin ? 'var(--bg-body)' : 'white' }}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              disabled={!isSuperAdmin}
            >
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electronics and Telecommunication Engineering">Electronics and Telecommunication Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Instrumentation and Control Engineering">Instrumentation and Control Engineering</option>
              <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="MBA">MBA</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Global">Global / Institutional</option>
            </select>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="po-tabs">
          <button
            className={`po-tab ${activeTab === 'po' ? 'active' : ''}`}
            onClick={() => setActiveTab('po')}
          >
            Programme Outcomes (PO)
            <span className="po-tab-count">{poBank.pos?.length || 0}</span>
          </button>
          <button
            className={`po-tab ${activeTab === 'pso' ? 'active' : ''}`}
            onClick={() => setActiveTab('pso')}
          >
            PSOs
            <span className="po-tab-count">{poBank.psos?.length || 0}</span>
          </button>
        </div>

        {/* Items List */}
        <div className="po-list">
          {loading ? (
            <div className="po-empty">Loading...</div>
          ) : items && items.length > 0 ? (
            items.map((item, idx) => (
              <div key={idx} className="po-item">
                <div className="po-item-header">
                  <span className="po-item-code">{item.code}</span>
                  <button className="po-item-remove" onClick={() => handleRemove(item.code)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
                <p className="po-item-desc">{item.description}</p>
              </div>
            ))
          ) : (
            <div className="po-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No {label}s added yet</p>
              <p className="text-secondary">Click the button below to add your first {label}</p>
            </div>
          )}
        </div>

        {/* Add Button */}
        <button className="po-add-btn" onClick={() => setShowAddModal(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add {label}
        </button>

        {/* Add Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content po-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New {label}</h2>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleAdd}>
                <div className="form-group mb-3">
                  <label className="form-label">{label} Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={activeTab === 'pso' ? 'e.g. PSO1' : 'e.g. PO1'}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-4">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder={`Describe what this ${label} measures...`}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add {label}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
