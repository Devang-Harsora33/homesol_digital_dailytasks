"use client";

import { useAuth } from "@/components/AuthProvider";

export function Header() {
  const { user } = useAuth();

  return (
    <div className="header">
      <div className="header-left">
        <img src="/logo.png" alt="Homesol Digital" style={{ height: '36px', objectFit: 'contain' }} />
        <div>
          <div className="header-title">Homesol Digital</div>
          <div className="header-sub">Daily Digital Tasks</div>
        </div>
      </div>
      <div className="api-row">
        {user ? (
          <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>
            🟢 Logged In
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Not logged in
          </div>
        )}
      </div>
    </div>
  );
}
