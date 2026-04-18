import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Ticket, LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to authenticate.');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    // Note: Use actual firebase signInWithPopup(auth, googleProvider) in production
    setError("Google Identity integration is in simulated mode for this preview environment.");
    setTimeout(() => setError(""), 3000);
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card animate-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--primary)', padding: '16px', borderRadius: '50%', boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}>
              <Ticket size={32} color="white" />
            </div>
          </div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>StadiumSync</h1>
          <p style={{ opacity: 0.8, marginTop: '8px', fontWeight: 500 }}>Premium Venue Logistics.</p>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} aria-labelledby="auth-form-title">
          <h2 id="auth-form-title" style={{ display: 'none' }}>{isLogin ? "Login" : "Sign Up"}</h2>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.9, fontWeight: 600 }}>Email Address</label>
            <input 
              type="email" 
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="fan@stadium.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.9, fontWeight: 600 }}>Security Password</label>
            <input 
              type="password" 
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {loading ? 'Processing Securely...' : (isLogin ? 'Log In to StadiumSync' : 'Create My Account')}
          </button>
        </form>

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        {/* Google Identity Integration Point */}
        <button 
          onClick={handleGoogleSignIn}
          className="auth-button"
          style={{ background: 'white', color: '#1f2937', marginTop: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem' }}>
          <p style={{ opacity: 0.8 }}>
            {isLogin ? "New to the platform? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '800', cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? "Register Now" : "Back to Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
