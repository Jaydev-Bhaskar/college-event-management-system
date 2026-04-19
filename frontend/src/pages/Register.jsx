import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, ArrowRight, Building2, Hash, GraduationCap } from 'lucide-react';

const departments = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Electronics & Communication', 'Information Technology',
  'Business Admin', 'Arts & Humanities', 'Physics', 'Mathematics', 'Chemistry', 'Biology'
];

export default function Register() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', studentId: '', email: '', department: '', password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      addToast('Name, email, and password are required', 'warning');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, department: form.department });
      addToast('Account created! Welcome to UniEvents 🎉', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
      {/* Mini navbar */}
      <nav className="navbar" style={{ background: 'var(--bg-white)' }}>
        <Link to="/" className="navbar-logo">
          <div className="logo-icon"><GraduationCap size={16} /></div>
          EventHub
        </Link>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Join the campus community</span>
      </nav>

      <div className="auth-page" style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
        <div className="auth-container" style={{ maxWidth: 480 }}>
          <div className="auth-form" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', padding: 0 }}>
            {/* Blue gradient header */}
            <div style={{
              padding: '2rem 2rem 1.5rem',
              background: 'linear-gradient(135deg, #60A5FA, #3B82F6, #818CF8)',
              color: 'white'
            }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Create Account</h1>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Start organizing and attending college events</p>
            </div>

            {/* Form */}
            <div style={{ padding: '1.75rem 2rem 2rem' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input className="form-input" placeholder="John Doe" style={{ paddingLeft: '2.2rem' }}
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Student ID</label>
                    <div style={{ position: 'relative' }}>
                      <Hash size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input className="form-input" placeholder="STU-12345" style={{ paddingLeft: '2.2rem' }}
                        value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>College Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" type="email" placeholder="student@university.edu" style={{ paddingLeft: '2.2rem' }}
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select className="form-input" style={{ paddingLeft: '2.2rem' }}
                      value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" type="password" placeholder="••••••••" style={{ paddingLeft: '2.2rem' }}
                      value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>At least 8 characters with numbers and symbols</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <input type="checkbox" id="terms" style={{ width: 16, height: 16, accentColor: 'var(--primary)', marginTop: 2 }} />
                  <label htmlFor="terms" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                    I agree to the <a href="#" style={{ color: 'var(--primary)', fontWeight: 500 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', fontWeight: 500 }}>Privacy Policy</a>.
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}>
                  {loading ? 'Creating Account...' : <>Register Account <ArrowRight size={16} /></>}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Login here</Link>
                  </span>
                </div>
              </form>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
            © {new Date().getFullYear()} EventHub Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
