"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, collection, query, onSnapshot, or, where } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Download, Activity, Clock, CheckCircle2 } from "lucide-react";
// @ts-ignore
import html2pdf from 'html2pdf.js';

type CustomTask = {
  id: string;
  t: string;
  isDone: boolean;
  targetType?: string;
  targetBadge?: string;
  isShared?: boolean;
  assignedBy?: string;
  assignedTo?: string[];
  createdAt?: number;
  completedAt?: number | null;
  date?: string;
  companyName?: string | null;
};

const TAG_OPTIONS = [
  { label: "All Tags", badge: "b-navy" },
  { label: "Instagram", badge: "b-pink" },
  { label: "WhatsApp", badge: "b-green" },
  { label: "LinkedIn", badge: "b-blue" },
  { label: "Content", badge: "b-amber" },
  { label: "Check/Fix", badge: "b-red" },
  { label: "Creative", badge: "b-orange" },
  { label: "Brochure", badge: "b-yellow" },
  { label: "Printable", badge: "b-lime" },
  { label: "Site Branding", badge: "b-indigo" },
  { label: "Video Editing", badge: "b-purple" },
  { label: "AI Walkthrough", badge: "b-cyan" },
];

export function Stats() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<CustomTask[]>([]);
  const [activeTag, setActiveTag] = useState("All Tags");
  const [activeCompany, setActiveCompany] = useState("All Companies");
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Load personal tasks
    const unsubPersonal = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      let t: CustomTask[] = [];
      if (docSnap.exists()) {
        const ct = docSnap.data().customTasks || {};
        Object.values(ct).forEach((arr: any) => {
          t = [...t, ...arr];
        });
      }

      // Load shared
      const qShared = query(
        collection(db, "sharedTasks"), 
        or(where("assignedTo", "array-contains", user.uid), where("assignedBy", "==", user.uid))
      );
      
      onSnapshot(qShared, (snap) => {
        let s: CustomTask[] = [];
        snap.forEach(d => s.push({ ...d.data(), id: d.id, isShared: true } as CustomTask));
        
        // Merge without duplicates (edge case protection)
        const all = [...t, ...s];
        // Ensure consistent rendering order
        all.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
        setTasks(all);
      });
    });

    // Fetch companies
    const unsubCompanies = onSnapshot(collection(db, "companies"), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, name: d.data().name }));
      list.sort((a,b) => a.name.localeCompare(b.name));
      setCompanies(list);
    });

    return () => {
      unsubPersonal();
      unsubCompanies();
    };
  }, [user]);

  const downloadPDF = () => {
    if (!reportRef.current) return;
    const opt = {
      margin: 0.5,
      filename: 'Homesol_Digital_Analytics.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(reportRef.current).save();
  };

  // Compute metrics
  let displayTasks = activeTag === "All Tags" 
    ? tasks 
    : tasks.filter(t => (t.targetType || "Custom") === activeTag);

  if (activeCompany !== "All Companies") {
    displayTasks = displayTasks.filter(t => t.companyName === activeCompany);
  }

  const total = displayTasks.length;
  const done = displayTasks.filter(t => t.isDone).length;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

  // Time calculations
  let validTimeTasks = 0;
  let totalTimeMs = 0;
  
  displayTasks.forEach(t => {
    let cre = t.createdAt;
    // Fallback: if it's personal and has an ID that is a timestamp
    if (!cre && !t.isShared && t.id.length > 10) {
      const c = parseInt(t.id);
      if (!isNaN(c)) cre = c;
    }

    if (t.isDone && cre && t.completedAt) {
      if (t.completedAt >= cre) {
        totalTimeMs += (t.completedAt - cre);
        validTimeTasks++;
      }
    }
  });

  const avgMs = validTimeTasks === 0 ? 0 : totalTimeMs / validTimeTasks;
  const totalHours = Math.floor(avgMs / (1000 * 60 * 60));
  const d = Math.floor(totalHours / 24);
  const h = totalHours % 24;

  // Group by Tag for chart
  const tagData = TAG_OPTIONS.filter(t => t.label !== "All Tags").map(tag => {
    const list = displayTasks.filter(t => (t.targetType || "Custom") === tag.label);
    return {
      name: tag.label,
      created: list.length,
      completed: list.filter(t => t.isDone).length
    };
  });

  // 3 Month Timeline (12 weeks)
  const timelineData: {date: string, created: number, completed: number}[] = [];
  const now = Date.now();
  const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;
  
  for (let i = 11; i >= 0; i--) {
    const endMs = now - (i * ONE_WEEK_MS);
    const startMs = endMs - ONE_WEEK_MS;
    
    // label will be the start of the week for display
    const startObj = new Date(startMs);
    const weekLabel = startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    let wCreated = 0;
    let wCompleted = 0;

    displayTasks.forEach(t => {
      let cre = t.createdAt;
      if (!cre && !t.isShared && t.id.length > 10) {
        const c = parseInt(t.id);
        if (!isNaN(c)) cre = c;
      }
      
      if (cre && cre >= startMs && cre < endMs) {
        wCreated++;
      }
      if (t.isDone && t.completedAt && t.completedAt >= startMs && t.completedAt < endMs) {
        wCompleted++;
      }
    });

    timelineData.push({
      date: weekLabel,
      created: wCreated,
      completed: wCompleted
    });
  }

  return (
    <div className="panel active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div className="section-title">Analytics & Overview</div>
          <div className="section-sub">Track operational velocity and completion rates.</div>
        </div>
        <button 
          onClick={downloadPDF}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(2, 0, 29, 0.15)' }}
        >
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        {TAG_OPTIONS.map(tag => (
          <button
            key={tag.label}
            onClick={() => setActiveTag(tag.label)}
            className={`badge ${activeTag === tag.label ? tag.badge : 'b-gray'}`}
            style={{ 
              padding: '8px 16px', 
              fontSize: '13px',
              opacity: activeTag === tag.label ? 1 : 0.5,
              cursor: 'pointer',
              border: activeTag === tag.label ? '1px solid currentColor' : '1px solid transparent',
              boxShadow: activeTag === tag.label ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {tag.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveCompany("All Companies")}
          className={`badge ${activeCompany === "All Companies" ? "b-navy" : "b-gray"}`}
          style={{ 
            padding: '8px 16px', 
            fontSize: '13px',
            opacity: activeCompany === "All Companies" ? 1 : 0.5,
            cursor: 'pointer',
            border: activeCompany === "All Companies" ? '1px solid currentColor' : '1px solid transparent',
            boxShadow: activeCompany === "All Companies" ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          All Profiles
        </button>
        {companies.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCompany(c.name)}
            className={`badge ${activeCompany === c.name ? "b-indigo" : "b-gray"}`}
            style={{ 
              padding: '8px 16px', 
              fontSize: '13px',
              opacity: activeCompany === c.name ? 1 : 0.5,
              cursor: 'pointer',
              border: activeCompany === c.name ? '1px solid currentColor' : '1px solid transparent',
              boxShadow: activeCompany === c.name ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            🏢 {c.name}
          </button>
        ))}
      </div>

      {/* The Printable Area */}
      <div ref={reportRef} style={{ background: 'var(--bg)', padding: '2px', borderRadius: '16px' }}>
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card" style={{ flex: 1, padding: '24px', background: 'var(--surface2)', borderTop: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '10px', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
              <Activity size={16} /> Volume {activeTag !== "All Tags" && `(${activeTag})`}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800 }}>{total}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>Total tasks registered.</div>
          </motion.div>
          
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card" style={{ flex: 1, padding: '24px', background: 'var(--surface2)', borderTop: '4px solid var(--green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '10px', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
              <CheckCircle2 size={16} color="var(--green)" /> Completion Rate
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--green)' }}>{completionRate}%</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>{done} tasks finished.</div>
          </motion.div>

          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="card" style={{ flex: 1, padding: '24px', background: 'var(--surface2)', borderTop: '4px solid var(--amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '10px', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
              <Clock size={16} color="var(--amber)" /> Avg. Completion Speed
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, display: 'flex', alignItems: 'baseline' }}>
              {validTimeTasks === 0 ? '--' : (
                <>
                  {d > 0 && <>{d}<span style={{ fontSize: '16px', color: 'var(--muted)', marginLeft: '4px', marginRight: '12px' }}>{d === 1 ? 'day' : 'days'}</span></>}
                  {h >= 0 && <>{h}<span style={{ fontSize: '16px', color: 'var(--muted)', marginLeft: '4px' }}>{h === 1 ? 'hr' : 'hrs'}</span></>}
                </>
              )}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>Time from creation to checking in.</div>
          </motion.div>
        </div>

        {/* Charts */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <div className="card-title" style={{ marginBottom: '24px' }}>3-Month Trajectory: Created vs Completed</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--navy)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--navy)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} stroke="var(--muted)" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickMargin={10} stroke="var(--muted)" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                <Area type="monotone" dataKey="created" stroke="var(--navy)" strokeWidth={3} fillOpacity={1} fill="url(#colorCreated)" name="Tasks Created" />
                <Area type="monotone" dataKey="completed" stroke="var(--green)" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" name="Tasks Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <div className="card-title" style={{ marginBottom: '24px' }}>{activeTag === "All Tags" ? "Tag-based Pipeline Analysis" : `Volume Analysis for ${activeTag}`}</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} stroke="var(--muted)" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickMargin={10} stroke="var(--muted)" />
                <Tooltip cursor={{fill: 'var(--surface2)'}} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                <Bar dataKey="created" fill="var(--navy)" radius={[4, 4, 0, 0]} name="Tasks Created" barSize={30} />
                <Bar dataKey="completed" fill="var(--green)" radius={[4, 4, 0, 0]} name="Tasks Completed" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
