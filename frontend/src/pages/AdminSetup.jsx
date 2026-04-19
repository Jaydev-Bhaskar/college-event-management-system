import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import { GraduationCap, Shield, UserPlus, Trash2, AlertTriangle } from 'lucide-react';

export default function AdminSetup() {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: 'teacher',
  });
  const [createdAccounts, setCreatedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const departments = [
    'Computer Engineering',
    'Information Technology',
    'Electronics & Telecomm',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'AIDS',
    'AIML',
    'Data Science',
    'IOT',
    'Other'
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.department) {
      addToast('All fields are required', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('/auth/setup-account', form);
      addToast(`Account created: ${form.name} (${form.role})`, 'success');
      setCreatedAccounts(prev => [...prev, { ...form, _id: res.data.user?._id || Date.now() }]);
      setForm({ name: '', email: '', password: '', department: form.department, role: 'teacher' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create account', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(prev => ({ ...prev, password: pwd }));
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Warning Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem 1.25rem', marginBottom: '1.5rem',
          background: '#FEF3C7', border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-lg)', color: '#92400E'
        }}>
          <AlertTriangle size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚠️ DEV ONLY — Admin Setup Page</div>
            <div style={{ fontSize: '0.8rem' }}>This page will be removed before production. Use it to create Teacher and HOD/Admin accounts.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Create Form */}
          <div style={{
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <UserPlus size={20} />
              </div>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Create Account</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Teacher or HOD/Admin</p>
              </div>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" placeholder="e.g. Dr. Vikas Naik"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" placeholder="vikas.naik@college.edu"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="form-input" placeholder="Temp password"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ flex: 1 }} />
                  <button type="button" className="btn btn-ghost" onClick={generatePassword}
                    style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    Generate
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select className="form-input" value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Role</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button"
                    className={`login-mode-btn ${form.role === 'teacher' ? 'active' : ''}`}
                    style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                    onClick={() => setForm({ ...form, role: 'teacher' })}>
                    <GraduationCap size={14} /> Teacher
                  </button>
                  <button type="button"
                    className={`login-mode-btn ${form.role === 'admin' ? 'active' : ''}`}
                    style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                    onClick={() => setForm({ ...form, role: 'admin' })}>
                    <Shield size={14} /> HOD / Admin
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Creating...' : <>
                  <UserPlus size={16} /> Create {form.role === 'admin' ? 'Admin' : 'Teacher'} Account
                </>}
              </button>
            </form>
          </div>

          {/* Created Accounts List */}
          <div style={{
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '1.75rem'
          }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.35rem' }}>Created Accounts</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              This session only — save credentials before leaving!
            </p>

            {createdAccounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Shield size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p>No accounts created yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {createdAccounts.map((acc, idx) => (
                  <div key={idx} style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    background: acc.role === 'admin' ? '#EFF6FF' : 'var(--bg-body)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{acc.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                      </div>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: acc.role === 'admin' ? 'var(--primary)' : 'var(--success)',
                        color: 'white'
                      }}>
                        {acc.role === 'admin' ? 'HOD/Admin' : 'Teacher'}
                      </span>
                    </div>
                    <div style={{
                      marginTop: '0.5rem', padding: '0.35rem 0.65rem',
                      background: 'rgba(0,0,0,0.04)', borderRadius: 'var(--radius-sm)',
                      fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)'
                    }}>
                      📧 {acc.email} &nbsp;|&nbsp; 🔑 {acc.password} &nbsp;|&nbsp; 🏢 {acc.department}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
