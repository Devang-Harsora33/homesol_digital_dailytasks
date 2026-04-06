"use client";

import { useState, useEffect, useRef } from "react";
import { DAYS } from "@/lib/data";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, getDocs, or } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Plus, Trash2, X, Calendar as CalendarIcon, ChevronDown, UserPlus } from "lucide-react";
import { StrategyEditor } from "./StrategyEditor";

type CustomTask = {
  id: string;
  t: string;
  d: string;
  isDone: boolean;
  targetType?: string;
  targetBadge?: string;
  isShared?: boolean;
  assignedBy?: string;
  assignedTo?: string[];
  assignedByEmail?: string;
  assignedToEmails?: string[];
  checkedInByEmail?: string | null;
  date?: string;
  createdAt?: number;
  completedAt?: number | null;
};

const TAG_OPTIONS = [
  { label: "Custom", badge: "b-gray" },
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
  const [sharedTasks, setSharedTasks] = useState<CustomTask[]>([]);
  const [allUsers, setAllUsers] = useState<{uid: string, email: string}[]>([]);
  const [assignTo, setAssignTo] = useState<string[]>([]);
  const [editingAssignTask, setEditingAssignTask] = useState<string | null>(null);
  const [editAssignTo, setEditAssignTo] = useState<string[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<CustomTask | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch users (once)
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const list: any[] = [];
        snap.forEach(d => {
          if (d.id !== user.uid && d.data().email) {
            list.push({ uid: d.id, email: d.data().email });
          }
        });
        setAllUsers(list);
      } catch (e) {
        console.error("Failed to fetch users", e);
      }
    };
    fetchUsers();

    // Personal tasks
    const docRef = doc(db, "users", user.uid);
    const unsubPersonal = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.customTasks) setCustomTasks(data.customTasks);
      }
    });

    // Shared tasks
    const qShared = query(
      collection(db, "sharedTasks"), 
      or(where("assignedTo", "array-contains", user.uid), where("assignedBy", "==", user.uid))
    );
    const unsubShared = onSnapshot(qShared, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ ...d.data(), id: d.id, isShared: true }));
      setSharedTasks(list);
    });

    return () => {
      unsubPersonal();
      unsubShared();
    };
  }, [user]);

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

    if (assignTo.length > 0) {
      const targetEmails = allUsers.filter(u => assignTo.includes(u.uid)).map(u => u.email);
      await addDoc(collection(db, "sharedTasks"), {
        t: newTaskTitle,
        d: clearHtml,
        isDone: false,
        targetType: newTaskTag.label,
        targetBadge: newTaskTag.badge,
        date: selectedDate,
        assignedBy: user.uid,
        assignedByEmail: user.email,
        assignedTo: assignTo,
        assignedToEmails: targetEmails,
        checkedInByEmail: null,
        createdAt: Date.now(),
        completedAt: null
      });
    } else {
      const newTask: CustomTask = {
        id: Date.now().toString(),
        t: newTaskTitle,
        d: clearHtml,
        isDone: false,
        targetType: newTaskTag.label,
        targetBadge: newTaskTag.badge,
        createdAt: Date.now(),
        completedAt: null
      };
      const list = customTasks[selectedDate] || [];
      const newCt = { ...customTasks, [selectedDate]: [...list, newTask] };
      setCustomTasks(newCt);
      await saveCustomTasks(newCt);
    }

    setNewTaskTitle("");
    setNewTaskDetail("");
    setNewTaskTag(TAG_OPTIONS[0]);
    setAssignTo([]);
    setIsAdding(false);
  };

  const toggleCustomTask = async (task: CustomTask) => {
    if (!user) return;
    
    if (task.isShared) {
      const ref = doc(db, "sharedTasks", task.id);
      await updateDoc(ref, { 
         isDone: !task.isDone,
         checkedInByEmail: !task.isDone ? user.email : null,
         completedAt: !task.isDone ? Date.now() : null
      });
    } else {
      const list = customTasks[selectedDate] || [];
      const newCt = {
        ...customTasks,
        [selectedDate]: list.map(t => t.id === task.id ? { ...t, isDone: !t.isDone, completedAt: !t.isDone ? Date.now() : null } : t)
      };
      setCustomTasks(newCt);
      await saveCustomTasks(newCt);
    }
  };

  const deleteCustomTask = async (task: CustomTask) => {
    if (!user) return;
    
    if (task.isShared) {
      if (task.assignedBy === user.uid) {
        await deleteDoc(doc(db, "sharedTasks", task.id));
      }
    } else {
      const list = customTasks[selectedDate] || [];
      const newCt = {
        ...customTasks,
        [selectedDate]: list.filter(t => t.id !== task.id)
      };
      setCustomTasks(newCt);
      await saveCustomTasks(newCt);
    }
  };

  const saveTaskAssignment = async (task: CustomTask) => {
    if (!user) return;
    const targetEmails = allUsers.filter(u => editAssignTo.includes(u.uid)).map(u => u.email);

    if (task.isShared) {
      const ref = doc(db, "sharedTasks", task.id);
      await updateDoc(ref, {
         assignedTo: editAssignTo,
         assignedToEmails: targetEmails
      });
    } else {
      if (editAssignTo.length > 0) {
          await addDoc(collection(db, "sharedTasks"), {
            t: task.t,
            d: task.d,
            isDone: task.isDone,
            targetType: task.targetType,
            targetBadge: task.targetBadge,
            date: selectedDate,
            assignedBy: user.uid,
            assignedByEmail: user.email,
            assignedTo: editAssignTo,
            assignedToEmails: targetEmails,
            checkedInByEmail: task.checkedInByEmail || null,
            createdAt: task.createdAt || Date.now(),
            completedAt: task.completedAt || null
          });

          const list = customTasks[selectedDate] || [];
          const newCt = {
            ...customTasks,
            [selectedDate]: list.filter(t => t.id !== task.id)
          };
          setCustomTasks(newCt);
          await saveCustomTasks(newCt);
      }
    }
    setEditingAssignTask(null);
  };

  const cTasks = customTasks[selectedDate] || [];
  const sTasks = sharedTasks.filter(t => t.date === selectedDate);
  const mergedTasks = [...cTasks, ...sTasks];

  const totalTasks = mergedTasks.length;
  const tasksDoneCount = mergedTasks.filter(t => t.isDone).length;
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

  const getCreationString = (ct: CustomTask) => {
    let cre = ct.createdAt;
    if (!cre && !ct.isShared && ct.id.length > 10) {
      const c = parseInt(ct.id);
      if (!isNaN(c)) cre = c;
    }
    if (!cre) return "";
    return new Date(cre).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

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
            {mergedTasks.map(ct => (
              <motion.div variants={taskVariants} initial="hidden" animate="show" key={ct.id}>
                <div
                  className="task-row"
                  style={{ cursor: 'pointer', opacity: ct.isDone ? 0.6 : 1, transition: 'opacity 0.2s', position: 'relative', paddingRight: '40px' }}
                >
                  <div
                    style={{ flexShrink: 0, marginTop: '2px', color: ct.isDone ? 'var(--accent)' : 'var(--border)' }}
                    onClick={() => toggleCustomTask(ct)}
                  >
                    {ct.isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </div>
                  <div
                    className="task-text"
                    onClick={() => toggleCustomTask(ct)}
                  >
                    <div className="task-name" style={{ textDecoration: ct.isDone ? 'line-through' : 'none' }}>
                      {ct.t}
                      <span className={`badge ${ct.targetBadge || 'b-gray'}`} style={{ marginLeft: '6px', fontSize: '10px' }}>{ct.targetType || 'Custom'}</span>
                      {ct.isShared && (
                        <span className="badge b-indigo" style={{ marginLeft: '6px', fontSize: '9px' }}>
                          {ct.assignedBy === user?.uid 
                            ? `Assigned to ${(ct.assignedToEmails || []).join(', ')}` 
                            : `From ${ct.assignedByEmail}`}
                        </span>
                      )}
                      {getCreationString(ct) && (
                        <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 'normal', marginLeft: '8px' }}>
                          Added {getCreationString(ct)}
                        </span>
                      )}
                    </div>
                    {ct.d && <div className="task-detail tiptap-content text-xs" dangerouslySetInnerHTML={{ __html: ct.d }} />}
                    {ct.isDone && ct.checkedInByEmail && (
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', fontStyle: 'italic' }}>
                        ✓ Checked in by {ct.checkedInByEmail}
                      </div>
                    )}
                    
                    {/* INLINE ASSIGNMENT EDIT */}
                    {editingAssignTask === ct.id && (
                      <div style={{ marginTop: '10px', padding: '10px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Assign Task</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {allUsers.map(u => {
                            const isSel = editAssignTo.includes(u.uid);
                            return (
                              <button
                                type="button"
                                key={u.uid}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSel) setEditAssignTo(prev => prev.filter(id => id !== u.uid));
                                  else setEditAssignTo(prev => [...prev, u.uid]);
                                }}
                                className="badge b-gray"
                                style={{
                                  opacity: isSel ? 1 : 0.6,
                                  boxShadow: isSel ? '0 0 0 1px var(--text)' : 'none',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {u.email}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            type="button" 
                            className="btn btn-sm" 
                            onClick={(e) => { e.stopPropagation(); setEditingAssignTask(null); }}
                          >Cancel</button>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-primary" 
                            onClick={(e) => { e.stopPropagation(); saveTaskAssignment(ct); }}
                          >Save</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {(!ct.isShared || ct.assignedBy === user?.uid) && (
                    <div style={{ position: 'absolute', right: '0', top: '10px', display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingAssignTask === ct.id) {
                            setEditingAssignTask(null);
                          } else {
                            setEditingAssignTask(ct.id);
                            setEditAssignTo(ct.assignedTo || []);
                          }
                        }}
                        style={{ background: 'var(--surface2)', color: 'var(--text)', border: 'none', padding: '4px 8px' }}
                      >
                        <UserPlus size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={(e) => { e.stopPropagation(); setTaskToDelete(ct); }}
                        style={{ background: 'var(--warn-light)', color: 'var(--warn)', borderColor: 'var(--warn-light)', padding: '4px 8px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
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

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px' }}>Assign To (Optional)</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {allUsers.map(u => {
                        const isSel = assignTo.includes(u.uid);
                        return (
                          <button
                            type="button"
                            key={u.uid}
                            onClick={() => {
                              if (isSel) setAssignTo(prev => prev.filter(id => id !== u.uid));
                              else setAssignTo(prev => [...prev, u.uid]);
                            }}
                            className="badge b-gray"
                            style={{
                              opacity: isSel ? 1 : 0.6,
                              boxShadow: isSel ? '0 0 0 1px var(--text)' : 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {u.email}
                          </button>
                        );
                      })}
                    </div>
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

      <AnimatePresence>
        {taskToDelete && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }} onClick={() => setTaskToDelete(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '30px', background: 'var(--bg)', borderRadius: '20px' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--warn-light)', color: 'var(--warn)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Delete Task?</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Are you sure you want to delete "{taskToDelete.t}"? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn" onClick={() => setTaskToDelete(null)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { deleteCustomTask(taskToDelete); setTaskToDelete(null); }} style={{ flex: 1, background: 'var(--warn)', border: 'none', borderColor: 'var(--warn)' }}>Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
