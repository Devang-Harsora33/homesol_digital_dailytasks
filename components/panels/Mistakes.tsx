"use client";

import { useState } from "react";
import { MISTAKES } from "@/lib/data";

export function Mistakes() {
  const [mistakeQ, setMistakeQ] = useState("");
  const [mistakeAns, setMistakeAns] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askMistake = async () => {
    if (!mistakeQ.trim()) return;

    setLoading(true);
    setMistakeAns("");
    setError("");

    try {
      const prompt = `Marketing problem: ${mistakeQ}\n\nGive a specific, practical 3-4 step fix. Be direct and actionable. No fluff.`;
      
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMistakeAns(data.result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel active">
      <div className="section-title">Mistake Fixer</div>
      <div className="section-sub">Common problems and exactly how to fix them — plus ask about any new issue.</div>

      <div id="mistakesList">
        {MISTAKES.map((m: any, idx: number) => (
          <div key={idx} className="card" style={{ borderLeft: `3px solid ${m.sev === 'high' ? '#b5451b' : '#92400e'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="card-title">{m.q}</div>
              <span className={`badge ${m.sev === 'high' ? 'b-red' : 'b-amber'}`}>{m.sev} priority</span>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '6px', padding: '12px', fontSize: '13px', lineHeight: 1.7, color: '#1b4332', border: '1px solid #bbf7d0' }}>
              <strong>Fix:</strong> {m.fix}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Ask about a specific problem</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <input 
            type="text" 
            className="form-input" 
            value={mistakeQ} 
            onChange={(e) => setMistakeQ(e.target.value)} 
            placeholder="e.g. Influencer posted but didn't tag us..." 
          />
          <button className="btn btn-primary" onClick={askMistake} disabled={loading}>
            Fix it →
          </button>
        </div>

        {loading && (
          <div style={{ padding: '12px', fontSize: '13px', color: 'var(--muted)' }}>
            <div className="loading">
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
            </div> Getting fix...
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', fontSize: '13px', color: '#a32d2d' }}>
            Error: {error}
          </div>
        )}

        {mistakeAns && (
          <div style={{ background: '#f0fdf4', borderRadius: '6px', padding: '14px', fontSize: '13px', lineHeight: 1.7, color: '#1b4332', border: '1px solid #bbf7d0', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
            {mistakeAns}
          </div>
        )}
      </div>
    </div>
  );
}
