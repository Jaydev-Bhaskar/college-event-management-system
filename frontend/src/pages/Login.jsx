import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      addToast('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      addToast(`Welcome back!`, 'success');
      
      const from = location.state?.from;
      if (from) {
         navigate(from.pathname || from, { replace: true });
      } else {
         switch (user.role) {
           case 'admin': navigate('/admin'); break;
           case 'organizer': navigate('/organizer'); break;
           default: navigate('/dashboard');
         }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid credentials', 'error');
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

        <div className="auth-form">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.2rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Log in to manage your college events
          </p>

          <form onSubmit={handleLogin}>
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
