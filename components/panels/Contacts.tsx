"use client";

import { useState } from "react";
import { DIRS } from "@/lib/data";

export function Contacts() {
  const [contSeg, setContSeg] = useState("influencer");
  const [contNeed, setContNeed] = useState("search");
  const [results, setResults] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFindContacts = async () => {
    setLoading(true);
    setResults("");
    setError("");

    try {
      const prompt = `The user wants to find and contact: ${contSeg}
They need: ${contNeed}

For search strategy: Give exact LinkedIn search URLs (with filters), Instagram hashtags to search, free directories to use, Facebook group names. Be very specific with real platform names and real keywords.

For scripts: Ready-to-copy messages for WhatsApp, Instagram DM, LinkedIn. Warm, specific, with [Name] placeholders.

Format clearly with headers. Be practical — no generic advice. Real terms, real URLs where possible.`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setResults(data.result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel active">
      <div className="section-title">Find Contacts</div>
      <div className="section-sub">AI finds exact search strategies, platforms, and scripts for each segment.</div>

      <div className="card">
        <div className="form-row" style={{ marginBottom: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Segment</label>
            <select className="form-select" value={contSeg} onChange={(e) => setContSeg(e.target.value)}>
              <option value="influencer">Mumbai travel/lifestyle micro-influencers</option>
              <option value="hr">HR managers — corporate offsites</option>
              <option value="filmmaker">Film & ad production houses Mumbai</option>
              <option value="travel">Travel agents Mumbai / Palghar</option>
              <option value="photographer">Wedding photographers Mumbai</option>
              <option value="party">Party planners / event organizers</option>
              <option value="yoga">Yoga instructors / wellness coaches</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">What do you need?</label>
            <select className="form-select" value={contNeed} onChange={(e) => setContNeed(e.target.value)}>
              <option value="search">Search strategy — where + how to find them</option>
              <option value="scripts">Outreach scripts for all platforms</option>
              <option value="both">Both — search + scripts</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleFindContacts} disabled={loading}>
          {loading ? "Finding..." : "Find Contacts + Scripts →"}
        </button>
      </div>
      
      {loading && (
        <div className="card"><div className="loading"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div> <span style={{ fontSize: '13px', color: 'var(--muted)', marginLeft: '8px' }}>Finding contacts...</span></div>
      )}

      {error && (
        <div className="card" style={{ borderColor: '#f09595', background: '#fcebeb' }}>
          <div style={{ fontSize: '13px', color: '#a32d2d' }}>Error: {error}. Check your API key and try again.</div>
        </div>
      )}

      {results && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: '10px' }}>Results: {contSeg}</div>
          <div style={{ fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{results}</div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Free Contact Directories</div>
        <div className="card-sub">Best free platforms to find real contacts right now</div>
        <div>
          {DIRS.map((d: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '13px' }}>{d.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{d.what}</div>
              </div>
              <a href={d.url} target="_blank" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', whiteSpace: 'nowrap', marginTop: '2px' }}>Open ↗</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
