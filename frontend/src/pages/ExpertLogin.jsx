import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';

export default function ExpertLogin() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState(searchParams.get('username') || '');
  const [password, setPassword] = useState(searchParams.get('password') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/expert/login', { username, password });
      const { token, expert } = res.data;

      // Store expert session separately
      localStorage.setItem('expert_token', token);
      localStorage.setItem('expert_data', JSON.stringify(expert));

      navigate('/expert/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="expert-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Expert Portal
            </div>
            <h1>Resource Person Login</h1>
            <p className="text-secondary">Enter the credentials provided by the event organizer</p>
          </div>

          {error && (
            <div className="auth-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. expert_cybersec_a1b2c3"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your temporary password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ width: '100%', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}>
              {loading ? 'Signing in...' : 'Sign In as Expert'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Not an expert? <a href="/login">Student/Teacher login →</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
