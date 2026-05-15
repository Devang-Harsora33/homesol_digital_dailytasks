"use client";

import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";

interface SidebarProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

export function Sidebar({ activePanel, setActivePanel }: SidebarProps) {
  const { user } = useAuth();

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="nav-section">Plan</div>
      <div className={`nav-item ${activePanel === 'days' ? 'active' : ''}`} onClick={() => setActivePanel('days')}>
        <span className="nav-icon">📅</span> Daily Tasks
      </div>
      <div className={`nav-item ${activePanel === 'calendar' ? 'active' : ''}`} onClick={() => setActivePanel('calendar')}>
        <span className="nav-icon">🗓</span> Content Calendar
      </div>

      <div className="nav-section">Outreach</div>
      <div className={`nav-item ${activePanel === 'messages' ? 'active' : ''}`} onClick={() => setActivePanel('messages')}>
        <span className="nav-icon">✉️</span> What to Send
      </div>
      <div className={`nav-item ${activePanel === 'contacts' ? 'active' : ''}`} onClick={() => setActivePanel('contacts')}>
        <span className="nav-icon">🔍</span> Find Contacts
      </div>

      <div className="nav-section">Track</div>
      <div className={`nav-item ${activePanel === 'stats' ? 'active' : ''}`} onClick={() => setActivePanel('stats')}>
        <span className="nav-icon">📈</span> Analytics
      </div>
      <div className={`nav-item ${activePanel === 'report' ? 'active' : ''}`} onClick={() => setActivePanel('report')}>
        <span className="nav-icon">📊</span> Daily Report
      </div>
      <div className={`nav-item ${activePanel === 'mistakes' ? 'active' : ''}`} onClick={() => setActivePanel('mistakes')}>
        <span className="nav-icon">🛠</span> Mistake Fixer
      </div>

      <div className="nav-section">AI</div>
      <div className={`nav-item ${activePanel === 'agent' ? 'active' : ''}`} onClick={() => setActivePanel('agent')}>
        <span className="nav-icon">✨</span> Ask AI
      </div>

      <div style={{ marginTop: '20px', padding: '12px', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>Goals</div>
        <div style={{ fontSize: '11px', color: 'var(--accent)', lineHeight: 1.7 }}>
          M1: 500 followers<br />
          M2: 12+ bookings<br />
          M3: 1000 followers<br />
          M3: 15+ bookings<br />
          M3: 4.5★ Google
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', wordBreak: 'break-all' }}>
          {user?.email}
        </div>
        <button
          className="btn btn-sm"
          onClick={() => auth.signOut()}
          style={{ width: '100%', borderColor: 'var(--warn)', color: 'var(--warn)' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
