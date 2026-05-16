"use client";

import { useAuth } from "@/components/AuthProvider";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

interface SidebarProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

const DEFAULT_GOALS = [
  "M1: 500 followers",
  "M2: 12+ bookings",
  "M3: 1000 followers",
  "M3: 15+ bookings",
  "M3: 4.5★ Google"
];

export function Sidebar({ activePanel, setActivePanel }: SidebarProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<string[]>(DEFAULT_GOALS);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoals, setEditedGoals] = useState("");

  useEffect(() => {
    if (user) {
      const fetchGoals = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().goals) {
            setGoals(docSnap.data().goals);
          }
        } catch (error) {
          console.error("Error fetching goals:", error);
        }
      };
      fetchGoals();
    }
  }, [user]);

  const handleEdit = () => {
    setEditedGoals(goals.join("\n"));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    const newGoals = editedGoals.split("\n").filter(g => g.trim() !== "");
    try {
      await setDoc(doc(db, "users", user.uid), { goals: newGoals }, { merge: true });
      setGoals(newGoals);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving goals:", error);
      alert("Failed to save goals");
    }
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>Goals</div>
          {!isEditing ? (
            <button 
              onClick={handleEdit}
              style={{ background: 'none', border: 'none', fontSize: '10px', color: 'var(--muted)', cursor: 'pointer', padding: '0' }}
            >
              Edit
            </button>
          ) : (
            <button 
              onClick={handleSave}
              style={{ background: 'none', border: 'none', fontSize: '10px', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', padding: '0' }}
            >
              Save
            </button>
          )}
        </div>
        
        {isEditing ? (
          <textarea
            value={editedGoals}
            onChange={(e) => setEditedGoals(e.target.value)}
            style={{ 
              width: '100%', 
              fontSize: '11px', 
              background: 'var(--surface)', 
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px',
              minHeight: '100px',
              fontFamily: 'inherit',
              color: 'var(--text)'
            }}
          />
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--accent)', lineHeight: 1.7 }}>
            {goals.map((goal, i) => (
              <div key={i}>{goal}</div>
            ))}
          </div>
        )}
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
