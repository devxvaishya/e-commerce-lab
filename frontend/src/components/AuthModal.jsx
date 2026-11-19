import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        const res = await registerUser({ name, email, password });
        setSuccessMessage('Account created successfully! Welcome to VÉLORA.');
        setTimeout(() => {
          onSuccess(res.data.user);
          onClose();
        }, 800);
      } else {
        const res = await loginUser({ email, password });
        setSuccessMessage('Welcome back!');
        setTimeout(() => {
          onSuccess(res.data.user);
          onClose();
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="modal-dialog auth-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '36px 32px' }}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close authentication modal"
        >
          <X size={18} />
        </button>

        {/* Brand Eyebrow */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div className="brand-mark" style={{ margin: '0 auto 10px auto' }}>V</div>
          <span style={{ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            GenZ Fits · Atelier Access
          </span>
          <h2
            id="auth-modal-title"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '28px',
              fontWeight: 500,
              marginTop: '6px',
              color: 'var(--text-primary)'
            }}
          >
            {mode === 'login' ? 'Sign In to Your Wardrobe' : 'Create Your Atelier Account'}
          </h2>
        </div>

        {/* Mode Selector Tabs */}
        <div className="auth-tabs-row" style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '22px' }}>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'login' ? '2px solid var(--burgundy-primary)' : '2px solid transparent',
              color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: mode === 'login' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: mode === 'register' ? '2px solid var(--burgundy-primary)' : '2px solid transparent',
              color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: mode === 'register' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
          >
            Register
          </button>
        </div>

        {/* Feedback Alert Banners */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'var(--burgundy-tint)',
              border: '1px solid var(--burgundy-border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '18px',
              fontSize: '12.5px',
              color: 'var(--burgundy-primary)'
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#e8f5e9',
              border: '1px solid #c8e6c9',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '18px',
              fontSize: '12.5px',
              color: '#2e7d32'
            }}
          >
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13.5px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13.5px',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 36px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13.5px',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-action"
            style={{
              marginTop: '10px',
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              fontSize: '13px',
              letterSpacing: '0.06em',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In to Atelier' : 'Create Account'}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          {mode === 'login' ? (
            <span>
              New to VÉLORA?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={{ background: 'none', border: 'none', color: 'var(--burgundy-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Create an account
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--burgundy-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign in here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
