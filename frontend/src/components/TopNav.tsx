'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function TopNav() {
  const { user, logout } = useAuth();

  return (
    <nav className="topnav" id="topnav">
      <Link href="/hosted-zones" className="topnav__logo">
        <span className="topnav__logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.9"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8"/>
          </svg>
        </span>
        <span>Route 53</span>
      </Link>

      <div className="topnav__search">
        <span className="topnav__search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search [Alt+S]"
          aria-label="Search services"
          id="topnav-search"
        />
      </div>

      <div className="topnav__actions">
        <button className="topnav__btn topnav__btn--region" id="region-selector">
          <span>🌐</span>
          <span>US East (N. Virginia)</span>
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>

        <div className="topnav__divider" />

        {user && (
          <button className="topnav__btn" id="account-menu">
            <span>👤</span>
            <span>{user.username} @ {user.account_id}</span>
            <span style={{ fontSize: '10px' }}>▼</span>
          </button>
        )}

        <div className="topnav__divider" />

        <button className="topnav__btn" onClick={logout} id="sign-out-btn">
          Sign out
        </button>
      </div>
    </nav>
  );
}
