"use client";

import { useState } from "react";
import { TEMPLATES, CAPTIONS } from "@/lib/data";

export function Messages() {
  const [msgTarget, setMsgTarget] = useState("");
  const [msgPlatform, setMsgPlatform] = useState("whatsapp");
  const [reelType, setReelType] = useState("");

  const renderMessage = () => {
    if (!msgTarget) return null;
    const tmpl: Record<string, string> = (TEMPLATES as any)[msgTarget];
    if (!tmpl) return null;
    const msg = tmpl[msgPlatform];

    if (!msg) {
      return (
        <div style={{ fontSize: '13px', color: 'var(--muted)', padding: '12px', background: 'var(--surface2)', borderRadius: '6px' }}>
          No template for this platform — use WhatsApp or Instagram DM for this contact type.
        </div>
      );
    }

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>{msgPlatform.toUpperCase()} — COPY & SEND</div>
          <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(msg)}>Copy</button>
        </div>
        <div className="msg-box">{msg}</div>
      </>
    );
  };

  const renderCaption = () => {
    if (!reelType) return null;
    const cap = (CAPTIONS as any)[reelType];
    if (!cap) return null;

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>CAPTION + HASHTAGS — COPY & POST</div>
          <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(cap)}>Copy</button>
        </div>
        <div className="msg-box">{cap}</div>
      </>
    );
  };

  return (
    <div className="panel active">
      <div className="section-title">What to Send</div>
      <div className="section-sub">Ready-to-copy messages for every situation + captions for every Reel type.</div>

      <div className="card">
        <div className="card-title">Message Templates</div>
        <div className="card-sub">Select who you're contacting and which platform — get a ready message</div>
        <div className="form-row" style={{ marginBottom: '10px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Who are you messaging?</label>
            <select className="form-select" value={msgTarget} onChange={(e) => setMsgTarget(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="influencer">Instagram micro-influencer</option>
              <option value="hr">HR Manager (corporate offsite)</option>
              <option value="filmmaker">Film production house</option>
              <option value="travel">Travel agent</option>
              <option value="photographer">Wedding photographer</option>
              <option value="pastguest_review">Past guest — Google review ask</option>
              <option value="pastguest_return">Past guest — return booking offer</option>
              <option value="inquiry_followup">New inquiry follow-up (Day 2)</option>
              <option value="bachelorette">Bachelor / bachelorette party</option>
              <option value="booking_confirm">Booking confirmation</option>
              <option value="pre_arrival">Pre-arrival reminder (day before)</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Platform</label>
            <select className="form-select" value={msgPlatform} onChange={(e) => setMsgPlatform(e.target.value)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram DM</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>
        </div>
        {renderMessage()}
      </div>

      <div className="card">
        <div className="card-title">Caption Generator</div>
        <div className="card-sub">Select your Reel type — get a ready-to-post caption with all hashtags</div>
        <div className="form-group">
          <label className="form-label">Reel type</label>
          <select className="form-select" value={reelType} onChange={(e) => setReelType(e.target.value)}>
            <option value="">-- Select Reel type --</option>
            <option value="views">Mountain / valley views</option>
            <option value="pool">Pool party vibe</option>
            <option value="location">1.5hr from Mumbai hook</option>
            <option value="nocurfew">No curfew / 24hr music</option>
            <option value="corporate">Corporate offsite</option>
            <option value="bachelorette">Bachelor/bachelorette</option>
            <option value="film">Film shoot location</option>
            <option value="prewedding">Pre-wedding shoot</option>
          </select>
        </div>
        {renderCaption()}
      </div>
    </div>
  );
}
