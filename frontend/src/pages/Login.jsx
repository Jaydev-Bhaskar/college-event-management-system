import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap, User, Key } from 'lucide-react';
import API from '../api/axios';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'expert'
  const [form, setForm] = useState({ email: '', password: '' });
  const [expertForm, setExpertForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUserLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      addToast('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      addToast(`Welcome back!`, 'success');
      switch (user.role) {
        case 'admin': navigate('/admin'); break;
        case 'organizer': navigate('/organizer'); break;
        default: navigate('/dashboard');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExpertLogin = async (e) => {
    e.preventDefault();
    if (!expertForm.username || !expertForm.password) {
      addToast('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('/expert/login', expertForm);
      const { token, expert } = res.data;
      localStorage.setItem('expert_token', token);
      localStorage.setItem('expert_data', JSON.stringify(expert));
      addToast('Welcome, expert!', 'success');
      navigate('/expert/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid expert credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div style={{ 
            width: 56, height: 56, borderRadius: '50%', 
            background: 'var(--primary-light)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <GraduationCap size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem' }}>UniEvents</h1>
          <p>Your portal to college campus life</p>
        </div>

        {/* Login Mode Toggle */}
        <div className="login-mode-toggle">
          <button
            className={`login-mode-btn ${loginMode === 'user' ? 'active' : ''}`}
            onClick={() => setLoginMode('user')}
          >
            <User size={14} /> Student / Faculty
          </button>
          <button
            className={`login-mode-btn ${loginMode === 'expert' ? 'active' : ''}`}
            onClick={() => setLoginMode('expert')}
          >
            <Key size={14} /> Expert / Resource Person
          </button>
        </div>

        <div className="auth-form">
          {loginMode === 'user' ? (
            <>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.2rem' }}>Welcome Back</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Log in to manage your college events
              </p>

              <form onSubmit={handleUserLogin}>
                <div className="form-group">
                  <label>College Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      type="email"
                      placeholder="name@college.edu"
                      style={{ paddingLeft: '2.5rem' }}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Password</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>
                      Forgot password?
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <input type="checkbox" id="remember" style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                  <label htmlFor="remember" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                    Remember me for 30 days
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}>
                  {loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.2rem' }}>Expert Portal</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Enter the temporary credentials provided by the event organizer
              </p>

              <form onSubmit={handleExpertLogin}>
                <div className="form-group">
                  <label>Username</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. expert_cybersec_a1b2c3"
                      style={{ paddingLeft: '2.5rem' }}
                      value={expertForm.username}
                      onChange={(e) => setExpertForm({ ...expertForm, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Temporary Password</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your access code"
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                      value={expertForm.password}
                      onChange={(e) => setExpertForm({ ...expertForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{
                  background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#92400E',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <Key size={14} />
                  Credentials expire after the event ends
                </div>

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}>
                  {loading ? 'Signing in...' : <>Sign In as Expert <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="auth-footer">
          New to UniEvents? <Link to="/register">Create an account</Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Help</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Privacy</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Terms</span>
        </div>
      </div>
    </div>
  );
}
