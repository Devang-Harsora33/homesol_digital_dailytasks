"use client";

import { useState } from "react";

export function Report() {
  const [rDate, setRDate] = useState("");
  const [rDay, setRDay] = useState("");
  const [rDMs, setRDMs] = useState("");
  const [rInfl, setRInfl] = useState("");
  const [rLinkedin, setRLinkedin] = useState("");
  const [rBook, setRBook] = useState("");
  const [rContent, setRContent] = useState("");
  const [rDone, setRDone] = useState("✅ Yes — fully done");
  const [rBlock, setRBlock] = useState("");
  const [rTomorrow, setRTomorrow] = useState("");

  const [reportText, setReportText] = useState("");

  const genReport = () => {
    const report = `📊 HomeSol Digital 
Daily Marketing Report
Date: ${rDate || 'Today'} | ${rDay || 'Day X'}
────────────────────────
${rDone}

TODAY'S WORK
────────────────────────
📱 Instagram DMs sent: ${rDMs || '0'}
🤝 Influencers contacted: ${rInfl || '0'}
💼 LinkedIn outreach: ${rLinkedin || 'none'}
📥 Bookings / Inquiries: ${rBook || 'none'}
🎬 Content posted: ${rContent || 'none'}

BLOCKERS / ISSUES
────────────────────────
${rBlock || 'None'}

TOMORROW'S PLAN
────────────────────────
${rTomorrow || 'Continue daily tasks'}

— HomeSol Digital Marketing Team`;

    setReportText(report);
  };

  return (
    <div className="panel active">
      <div className="section-title">Daily Client Report</div>
      <div className="section-sub">Fill in today's numbers — copy the report and send to your client on WhatsApp.</div>

      <div className="card">
        <div className="form-row">
          <div className="form-group"><label className="form-label">Date</label><input type="text" className="form-input" value={rDate} onChange={e => setRDate(e.target.value)} placeholder="e.g. 28 March 2026" /></div>
          <div className="form-group"><label className="form-label">Day of Plan</label><input type="text" className="form-input" value={rDay} onChange={e => setRDay(e.target.value)} placeholder="e.g. Day 3" /></div>
          <div className="form-group"><label className="form-label">Instagram DMs sent</label><input type="text" className="form-input" value={rDMs} onChange={e => setRDMs(e.target.value)} placeholder="e.g. 12" /></div>
          <div className="form-group"><label className="form-label">Influencers contacted</label><input type="text" className="form-input" value={rInfl} onChange={e => setRInfl(e.target.value)} placeholder="e.g. 5" /></div>
          <div className="form-group"><label className="form-label">LinkedIn outreach</label><input type="text" className="form-input" value={rLinkedin} onChange={e => setRLinkedin(e.target.value)} placeholder="e.g. 10 HR managers" /></div>
          <div className="form-group"><label className="form-label">Bookings / Inquiries</label><input type="text" className="form-input" value={rBook} onChange={e => setRBook(e.target.value)} placeholder="e.g. 2 inquiries, 1 booking" /></div>
          <div className="form-group"><label className="form-label">Content posted</label><input type="text" className="form-input" value={rContent} onChange={e => setRContent(e.target.value)} placeholder="e.g. 1 Reel, 3 Stories" /></div>
          <div className="form-group">
            <label className="form-label">Daily target achieved?</label>
            <select className="form-select" value={rDone} onChange={e => setRDone(e.target.value)}>
              <option>✅ Yes — fully done</option>
              <option>⚠️ Partially done</option>
              <option>❌ Not done today</option>
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Blockers / Issues</label><input type="text" className="form-input" value={rBlock} onChange={e => setRBlock(e.target.value)} placeholder="e.g. No reply from influencers yet" /></div>
        <div className="form-group"><label className="form-label">Tomorrow's plan</label><input type="text" className="form-input" value={rTomorrow} onChange={e => setRTomorrow(e.target.value)} placeholder="e.g. Follow up all DMs, post Reel #2" /></div>
        <button className="btn btn-primary" onClick={genReport}>Generate Report →</button>
      </div>

      {reportText && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div className="card-title">Client Report Ready</div>
            <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(reportText)}>Copy to WhatsApp</button>
          </div>
          <div className="report-preview" style={{ whiteSpace: 'pre-wrap' }}>
            {reportText}
          </div>
        </div>
      )}
    </div>
  );
}
