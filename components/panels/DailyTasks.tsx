"use client";

import { useState, useEffect, useRef } from "react";
import { DAYS } from "@/lib/data";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Plus, Trash2, X, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { StrategyEditor } from "./StrategyEditor";

type CustomTask = {
  id: string;
  t: string;
  d: string;
  isDone: boolean;
  targetType?: string;
  targetBadge?: string;
};

const TAG_OPTIONS = [
  { label: "Custom", badge: "b-gray" },
  { label: "Instagram", badge: "b-blue" },
  { label: "WhatsApp", badge: "b-green" },
  { label: "LinkedIn", badge: "b-purple" },
  { label: "Content", badge: "b-amber" },
  { label: "Check/Fix", badge: "b-red" }
];

export function DailyTasks() {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weekAnchorDate, setWeekAnchorDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customTasks, setCustomTasks] = useState<Record<string, CustomTask[]>>({});
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDetail, setNewTaskDetail] = useState("");
  const [newTaskTag, setNewTaskTag] = useState(TAG_OPTIONS[0]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.customTasks) setCustomTasks(data.customTasks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveCustomTasks = async (newCt: any) => {
    try {
      const docRef = doc(db, "users", user!.uid);
      await updateDoc(docRef, { customTasks: newCt });
    } catch (e) {
      console.error(e);
    }
  };

  const addCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;

    const clearHtml = newTaskDetail === '<p></p>' || newTaskDetail === '<p><br></p>' ? '' : newTaskDetail;

    const newTask: CustomTask = {
      id: Date.now().toString(),
      t: newTaskTitle,
      d: clearHtml,
      isDone: false,
      targetType: newTaskTag.label,
      targetBadge: newTaskTag.badge
    };

    const list = customTasks[selectedDate] || [];
    const newCt = { ...customTasks, [selectedDate]: [...list, newTask] };
    setCustomTasks(newCt);
    setNewTaskTitle("");
    setNewTaskDetail("");
    setNewTaskTag(TAG_OPTIONS[0]);
    setIsAdding(false);
    await saveCustomTasks(newCt);
  };

  const toggleCustomTask = async (taskId: string) => {
    if (!user) return;
    const list = customTasks[selectedDate] || [];
    const newCt = {
      ...customTasks,
      [selectedDate]: list.map(t => t.id === taskId ? { ...t, isDone: !t.isDone } : t)
    };
    setCustomTasks(newCt);
    await saveCustomTasks(newCt);
  };

  const deleteCustomTask = async (taskId: string) => {
    if (!user) return;
    const list = customTasks[selectedDate] || [];
    const newCt = {
      ...customTasks,
      [selectedDate]: list.filter(t => t.id !== taskId)
    };
    setCustomTasks(newCt);
    await saveCustomTasks(newCt);
  };

  const cTasks = customTasks[selectedDate] || [];

  const totalTasks = cTasks.length;
  const tasksDoneCount = cTasks.filter(t => t.isDone).length;
  const pct = totalTasks === 0 ? 0 : Math.round((tasksDoneCount / totalTasks) * 100);

  const PCT_FORMATTER = new Intl.NumberFormat('en-US', { style: 'percent' });

  const generateNext7Days = (startIso: string) => {
    const days = [];
    // Ensure we parse the ISO string locally so it doesn't jump days via UTC offset
    const [y, m, d] = startIso.split('-').map(Number);
    const start = new Date(y, m - 1, d);

    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      days.push(current);
    }
    return days;
  };
  const upcomingWeek = generateNext7Days(weekAnchorDate);

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = new Date();
  const nextMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1);
  const thirdMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + 2, 1);

  const formatMonthOnly = (d: Date) => d.toLocaleDateString('en-US', { month: 'long' });

  // Animation variants
  const dayVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const taskVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="panel active">
      <div className="section-title">Daily Execution Plan</div>
      <div className="section-sub">Build your own personal schedule. Pick a date to manage its tasks.</div>

      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

          {/* PREMIUM DATE PICKER */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <div
              onClick={() => {
                if (dateInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
                  try {
                    dateInputRef.current.showPicker();
                  } catch (e) { console.error(e) }
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 18px',
                background: 'var(--surface)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <CalendarIcon size={18} color="var(--accent)" />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', minWidth: '110px' }}>
                {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <ChevronDown size={14} color="var(--muted)" style={{ marginLeft: '4px' }} />
            </div>

            {/* Invisible native overlay */}
            <input
              type="date"
              ref={dateInputRef}
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setWeekAnchorDate(e.target.value);
                }
              }}
              style={{
                position: 'absolute',
                width: '0',
                height: '0',
                opacity: 0,
                pointerEvents: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: 'var(--surface2)', padding: '4px', borderRadius: '12px' }}>
            <button
              className="btn btn-sm"
              onClick={() => {
                const d = getLocalDateString(todayDate);
                setSelectedDate(d); setWeekAnchorDate(d);
              }}
              style={{ background: selectedDate === getLocalDateString(todayDate) ? 'var(--surface)' : 'transparent', color: selectedDate === getLocalDateString(todayDate) ? 'var(--text)' : 'var(--muted)', borderColor: 'transparent', boxShadow: selectedDate === getLocalDateString(todayDate) ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', fontWeight: 600 }}
            >
              Today
            </button>
            <div style={{ width: '1px', height: '16px', background: 'var(--border)' }}></div>
            <button
              className="btn btn-sm"
              onClick={() => {
                const d = getLocalDateString(todayDate);
                setSelectedDate(d); setWeekAnchorDate(d);
              }}
              style={{ background: 'transparent', color: '#1b4332', borderColor: 'transparent', fontWeight: 600, display: 'flex', gap: '6px' }}
            >
              <span style={{ opacity: 0.6 }}>MONTH 1</span> {formatMonthOnly(todayDate)}
            </button>
            <div style={{ width: '1px', height: '16px', background: 'var(--border)' }}></div>
            <button
              className="btn btn-sm"
              onClick={() => {
                const d = getLocalDateString(nextMonthDate);
                setSelectedDate(d); setWeekAnchorDate(d);
              }}
              style={{ background: 'transparent', color: '#1e3a5f', borderColor: 'transparent', fontWeight: 600, display: 'flex', gap: '6px' }}
            >
              <span style={{ opacity: 0.6 }}>MONTH 2</span> {formatMonthOnly(nextMonthDate)}
            </button>
            <div style={{ width: '1px', height: '16px', background: 'var(--border)' }}></div>
            <button
              className="btn btn-sm"
              onClick={() => {
                const d = getLocalDateString(thirdMonthDate);
                setSelectedDate(d); setWeekAnchorDate(d);
              }}
              style={{ background: 'transparent', color: '#78350f', borderColor: 'transparent', fontWeight: 600, display: 'flex', gap: '6px' }}
            >
              <span style={{ opacity: 0.6 }}>MONTH 3</span> {formatMonthOnly(thirdMonthDate)}
            </button>
          </div>
        </div>

        <div className="day-nav" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          <style dangerouslySetInnerHTML={{
            __html: `
            .day-nav::-webkit-scrollbar { height: 4px; }
            .day-nav::-webkit-scrollbar-track { background: transparent; }
            .day-nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
          `}} />
          {upcomingWeek.map((d, i) => {
            const iso = getLocalDateString(d);
            const isSelected = selectedDate === iso;

            // Check if date is literally today
            const isLiterallyToday = iso === getLocalDateString(todayDate);
            const label = isLiterallyToday ? "Today" : d.toLocaleDateString('en-US', { weekday: 'short' });
            const dateNum = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`day-btn ${isSelected ? 'active' : ''}`}
                style={{ flexShrink: 0, padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '85px', borderRadius: '12px' }}
              >
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: isSelected ? 1 : 0.6 }}>{label}</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{dateNum}</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          variants={dayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="card shadow-md transition-shadow"
          style={{ borderLeft: `4px solid var(--accent)` }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div className="card-title" style={{ fontSize: '18px' }}>
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{tasksDoneCount} / {totalTasks} tasks done</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{pct}%</div>
          </div>

          <div className="progress" style={{ height: '8px', background: 'var(--surface2)', overflow: 'hidden' }}>
            <motion.div
              className="prog-fill"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ background: 'var(--accent)' }}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column' }}>
            {/* Custom Tasks */}
            {cTasks.map(ct => (
              <motion.div variants={taskVariants} initial="hidden" animate="show" key={ct.id}>
                <div
                  className="task-row"
                  style={{ cursor: 'pointer', opacity: ct.isDone ? 0.6 : 1, transition: 'opacity 0.2s', position: 'relative' }}
                >
                  <div
                    style={{ flexShrink: 0, marginTop: '2px', color: ct.isDone ? 'var(--accent)' : 'var(--border)' }}
                    onClick={() => toggleCustomTask(ct.id)}
                  >
                    {ct.isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </div>
                  <div
                    className="task-text"
                    onClick={() => toggleCustomTask(ct.id)}
                  >
                    <div className="task-name" style={{ textDecoration: ct.isDone ? 'line-through' : 'none' }}>
                      {ct.t}
                      <span className={`badge ${ct.targetBadge || 'b-gray'}`} style={{ marginLeft: '6px', fontSize: '10px' }}>{ct.targetType || 'Custom'}</span>
                    </div>
                    {ct.d && <div className="task-detail tiptap-content text-xs" dangerouslySetInnerHTML={{ __html: ct.d }} />}
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => deleteCustomTask(ct.id)}
                    style={{ position: 'absolute', right: '0', top: '10px', background: 'var(--warn-light)', color: 'var(--warn)', borderColor: 'var(--warn-light)', padding: '4px 8px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}

            <AnimatePresence>
              {isAdding ? (
                <motion.form
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onSubmit={addCustomTask}
                  className="card"
                  style={{ marginTop: '24px', borderLeft: '4px solid var(--navy)', background: 'var(--surface2)', padding: '24px', boxShadow: '0 10px 30px -10px rgba(2, 0, 29, 0.1)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Plus size={16} /> Prioritize Tasks for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <button type="button" onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><X size={16} /></button>
                  </div>

                  <div className="form-group">
                    <input
                      autoFocus
                      type="text"
                      className="form-input"
                      placeholder="Task overview (e.g. Call specific client)..."
                      style={{ fontSize: '14px', padding: '10px 14px', border: '1px solid var(--border)' }}
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {TAG_OPTIONS.map(tag => (
                      <button
                        type="button"
                        key={tag.label}
                        onClick={() => setNewTaskTag(tag)}
                        className={`badge ${tag.badge}`}
                        style={{
                          opacity: newTaskTag.label === tag.label ? 1 : 0.5,
                          cursor: 'pointer',
                          padding: '4px 10px',
                          fontSize: '11px',
                          boxShadow: newTaskTag.label === tag.label ? '0 0 0 1px currentColor' : 'none',
                          border: 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <StrategyEditor 
                      initialContent={newTaskDetail}
                      onChange={(val) => setNewTaskDetail(val)}
                      minHeight={150}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setIsAdding(false)} className="btn">Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Save Task <CheckCircle2 size={14} />
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="btn btn-primary"
                    style={{ fontWeight: 600, padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(2, 0, 29, 0.15)' }}
                  >
                    <Plus size={16} /> Add New Task
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
