import React from 'react';
import { ShoppingBag, User, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({
  health,
  user,
  cartItemCount = 0,
  onOpenAuth,
  onLogout,
  onToggleCart,
  activeView = 'catalog',
  onResetFilters
}) {
  const isConnected = health?.database?.connected;
  const isHealthy = health?.status === 'ok';

  return (
    <>
      {/* Top micro announcement bar */}
      <div className="announcement-bar">
        <div className="announcement-content">
          <span className="announcement-dot"></span>
          <span>COMPLIMENTARY EXPRESS SHIPPING ACROSS INDIA | VÉLORA ATELIER EDITIONS</span>
        </div>
      </div>

      {/* Main sticky navigation header */}
      <header className="site-header">
        <div className="header-inner">
          {/* Brand mark */}
          <div
            className="brand-wrapper"
            onClick={onResetFilters}
            role="button"
            tabIndex={0}
            aria-label="GenZ Fits Home"
          >
            <div className="brand-mark">V</div>
            <div className="brand-text-block">
              <span className="brand-title">GENZ FITS</span>
              <span className="brand-subtext">VÉLORA EDITIONS · ATELIER</span>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* System / Database connection indicator */}
            <div
              className="status-indicator-badge"
              title={health?.database?.statusMessage || 'Checking API connection...'}
            >
              <span
                className={`status-dot ${
                  isConnected ? 'online' : isHealthy ? 'fallback' : 'offline'
                }`}
              ></span>
              <span>
                {isConnected
                  ? 'PostgreSQL Active'
                  : isHealthy
                  ? 'Catalog Live'
                  : 'Connecting...'}
              </span>
            </div>

            {/* Authentication Control: Logged In vs Guest */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--taupe-light)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    fontWeight: 500
                  }}
                  title={`Logged in as ${user.email}`}
                >
                  <User size={13} style={{ color: 'var(--burgundy-primary)' }} />
                  <span>{user.name.split(' ')[0]}</span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    background: 'none',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11.5px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  title="Sign out of account"
                  aria-label="Log out"
                >
                  <LogOut size={12} />
                  <span>Exit</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="card-view-btn"
                style={{ padding: '7px 12px', fontSize: '11.5px', backgroundColor: 'transparent' }}
                onClick={() => onOpenAuth('login')}
                aria-label="Sign in to your account"
              >
                <User size={13} />
                <span>Sign In</span>
              </button>
            )}

            {/* Interactive Wardrobe / Cart Button */}
            <button
              className={`card-view-btn ${activeView === 'cart' ? 'active-cart-btn' : ''}`}
              style={{
                padding: '8px 14px',
                fontSize: '11.5px',
                backgroundColor: activeView === 'cart' ? 'var(--burgundy-primary)' : 'var(--text-primary)',
                color: '#ffffff',
                border: 'none',
                position: 'relative'
              }}
              onClick={onToggleCart}
              aria-label={`View fashion wardrobe with ${cartItemCount} items`}
            >
              <ShoppingBag size={14} />
              <span>Wardrobe ({cartItemCount})</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
