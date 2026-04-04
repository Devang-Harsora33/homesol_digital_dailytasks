"use client";

import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function Agent() {
  const [inputMsg, setInputMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your Homesol Digital marketing agent powered by Gemini. Ask me anything — I'll write scripts, find contacts, fix problems, and plan your content. What do you need?" }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (presetTarget?: string) => {
    const text = presetTarget || inputMsg;
    if (!text.trim()) return;

    const newMsgs: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInputMsg("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Passing the full history
        body: JSON.stringify({ prompt: newMsgs.map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`).join('\n\n') + '\n\nAgent:' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessages([...newMsgs, { role: "assistant", content: data.result }]);
    } catch (err: any) {
      setMessages([...newMsgs, { role: "assistant", content: `Error: ${err.message}. Make sure the API route is working.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel active">
      <div className="section-title">AI Marketing Agent</div>
      <div className="section-sub">Powered by model running via Next.js backend — ask anything, get instant scripts, contacts, strategies and fixes.</div>

      <div className="card" style={{ padding: '16px' }}>
        <div className="quick-btns">
          <button className="qbtn" onClick={() => sendMessage('Give me 10 B2B lead generation strategies I can implement today for Homesol Digital')}>B2B Lead Generation</button>
          <button className="qbtn" onClick={() => sendMessage('Give me 10 local business contacts with email or LinkedIn to pitch Homesol Digital services')}>Local business contacts</button>
          <button className="qbtn" onClick={() => sendMessage('Write a full WhatsApp script to convert an inquiry into a confirmed booking — include all follow-up messages')}>Full booking script</button>
          <button className="qbtn" onClick={() => sendMessage('My Reel got only 200 views. Give me a step-by-step fix to improve reach')}>Fix low Reel reach</button>
          <button className="qbtn" onClick={() => sendMessage('Give me this week full Instagram content plan with exact captions, hashtags and posting times')}>This week content plan</button>
          <button className="qbtn" onClick={() => sendMessage('Write a LinkedIn pitch message offering digital transformation services from Homesol Digital')}>Digital Agency Pitch</button>
          <button className="qbtn" onClick={() => sendMessage('Weekday bookings are zero. What exactly should I do this week to fix it?')}>Fix weekday bookings</button>
          <button className="qbtn" onClick={() => sendMessage('Write a WhatsApp broadcast message to past guests for summer offer and Google review request')}>Past guest broadcast</button>
        </div>
        
        <div className="chat-messages" style={{ display: 'flex', flexDirection: 'column', height: '420px', overflowY: 'auto' }}>
          {messages.map((m, idx) => (
            <div key={idx} className={`msg-${m.role === 'user' ? 'user' : 'ai'}`} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: m.role === 'user' ? '80%' : '88%' }}>
              <div className="bubble" style={m.role === 'user' ? { 
                background: 'var(--accent)', color: '#fff', padding: '9px 14px', borderRadius: '14px 14px 3px 14px', fontSize: '13px', lineHeight: 1.6 
              } : { 
                background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '3px 14px 14px 14px', fontSize: '13px', lineHeight: 1.7 
              }} dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          ))}
          {loading && (
            <div className="msg-ai" style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
              <div className="bubble" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '3px 14px 14px 14px' }}>
                <div className="loading"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="chat-input-row" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input 
            type="text" 
            className="form-input" 
            value={inputMsg} 
            onChange={(e) => setInputMsg(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
            placeholder="Ask anything about your marketing plan..." 
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading}>Send</button>
        </div>
      </div>
    </div>
  );
}
