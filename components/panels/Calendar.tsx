"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, getDocs, or } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Plus, Trash2, X, FileText, LayoutList, UserPlus } from "lucide-react";
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

export function Calendar() {
  const { user } = useAuth();
  const [customTasks, setCustomTasks] = useState<Record<string, CustomTask[]>>({});
  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);
  
  // Adding Task State
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

  // Modal active tab
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");

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

    // Personal tasks & daynotes
    const docRef = doc(db, "users", user.uid);
    const unsubPersonal = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.customTasks) setCustomTasks(data.customTasks);
        if (data.dayNotes) setDayNotes(data.dayNotes);
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

  const saveDayNotes = async (newNotes: Record<string, string>) => {
    try {
      const docRef = doc(db, "users", user!.uid);
      await updateDoc(docRef, { dayNotes: newNotes });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotesChange = (val: string) => {
    if (!selectedIsoDate) return;
    const newNotes = { ...dayNotes, [selectedIsoDate]: val };
    setDayNotes(newNotes);
    // Usually debounce this, but onBlur works for strong sync
  };

  const handleNotesBlur = () => {
    saveDayNotes(dayNotes);
  };

  const addCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim() || !selectedIsoDate) return;

    const clearHtml = newTaskDetail === '<p></p>' || newTaskDetail === '<p><br></p>' ? '' : newTaskDetail;

    if (assignTo.length > 0) {
      const targetEmails = allUsers.filter(u => assignTo.includes(u.uid)).map(u => u.email);
      await addDoc(collection(db, "sharedTasks"), {
        t: newTaskTitle,
        d: clearHtml,
        isDone: false,
        targetType: newTaskTag.label,
        targetBadge: newTaskTag.badge,
        date: selectedIsoDate,
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
      const list = customTasks[selectedIsoDate] || [];
      const newCt = { ...customTasks, [selectedIsoDate]: [...list, newTask] };
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
    if (!user || !selectedIsoDate) return;
    
    if (task.isShared) {
      const ref = doc(db, "sharedTasks", task.id);
      await updateDoc(ref, { 
         isDone: !task.isDone,
         checkedInByEmail: !task.isDone ? user.email : null,
         completedAt: !task.isDone ? Date.now() : null
      });
    } else {
      const list = customTasks[selectedIsoDate] || [];
      const newCt = {
        ...customTasks,
        [selectedIsoDate]: list.map(t => t.id === task.id ? { ...t, isDone: !t.isDone, completedAt: !t.isDone ? Date.now() : null } : t)
      };
      setCustomTasks(newCt);
      await saveCustomTasks(newCt);
    }
  };

  const deleteCustomTask = async (task: CustomTask) => {
    if (!user || !selectedIsoDate) return;
    
    if (task.isShared) {
      if (task.assignedBy === user.uid) {
        await deleteDoc(doc(db, "sharedTasks", task.id));
      }
    } else {
      const list = customTasks[selectedIsoDate] || [];
      const newCt = {
        ...customTasks,
        [selectedIsoDate]: list.filter(t => t.id !== task.id)
      };
      setCustomTasks(newCt);
      await saveCustomTasks(newCt);
    }
  };

  const saveTaskAssignment = async (task: CustomTask) => {
    if (!user || !selectedIsoDate) return;
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
            date: selectedIsoDate,
            assignedBy: user.uid,
            assignedByEmail: user.email,
            assignedTo: editAssignTo,
            assignedToEmails: targetEmails,
            checkedInByEmail: task.checkedInByEmail || null,
            createdAt: task.createdAt || Date.now(),
            completedAt: task.completedAt || null
          });

          const list = customTasks[selectedIsoDate] || [];
          const newCt = {
            ...customTasks,
            [selectedIsoDate]: list.filter(t => t.id !== task.id)
          };
          setCustomTasks(newCt);
          await saveCustomTasks(newCt);
      }
    }
    setEditingAssignTask(null);
  };

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCreationString = (ct: CustomTask) => {
    let cre = ct.createdAt;
    if (!cre && !ct.isShared && ct.id.length > 10) {
      const c = parseInt(ct.id);
      if (!isNaN(c)) cre = c;
    }
    if (!cre) return "";
    return new Date(cre).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const todayDate = new Date();
  
  const startDow = (todayDate.getDay() + 6) % 7;
  let cells = [];
  for (let i = 0; i < startDow; i++) {
    cells.push(<div key={`empty-${i}`}></div>);
  }

  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    d.setDate(todayDate.getDate() + dayOffset);
    const iso = getLocalDateString(d);
    const sTasksForDay = sharedTasks.filter(t => t.date === iso);
    const dayTasks = [...(customTasks[iso] || []), ...sTasksForDay];
    const hasNote = !!dayNotes[iso]?.trim();
    
    cells.push(
      <div 
        key={iso} 
        className={`cal-cell ${(dayTasks.length > 0 || hasNote) ? 'has-post' : ''}`} 
        onClick={() => { setSelectedIsoDate(iso); setIsAdding(false); setActiveTab("tasks"); }}
        style={{ position: 'relative' }}
      >
        <div className="cal-num">{dayOffset === 0 ? "Today" : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          {dayTasks.map((t, idx) => (
             <span key={idx} className={`cal-pill badge ${t.targetBadge}`} style={{ fontSize: '9px', padding: '2px 4px', textTransform: 'uppercase' }}>
               {(t.targetType || "Custom").slice(0, 3)}
             </span>
          ))}
          {hasNote && (
             <span className={`cal-pill badge b-gray`} style={{ fontSize: '9px', padding: '2px 4px', textTransform: 'uppercase' }}>
               NOTE
             </span>
          )}
        </div>
      </div>
    );
  }

  const taskVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const renderModal = () => {
    if (!selectedIsoDate) return null;
    const cTasks = customTasks[selectedIsoDate] || [];
    const sTasks = sharedTasks.filter(t => t.date === selectedIsoDate);
    const mergedTasks = [...cTasks, ...sTasks];
    const totalTasks = mergedTasks.length;
    const tasksDoneCount = mergedTasks.filter(t => t.isDone).length;
    const pct = totalTasks === 0 ? 0 : Math.round((tasksDoneCount / totalTasks) * 100);

    return (
      <div 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
        onClick={() => setSelectedIsoDate(null)}
      >
        <motion.div 
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="card shadow-2xl" 
          style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg)', borderRadius: '20px', position: 'relative', border: '1px solid var(--border)' }}
        >
          <button 
            onClick={() => setSelectedIsoDate(null)} 
            style={{ position: 'absolute', top: 16, right: 16, background: 'var(--surface2)', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', zIndex: 10, color: 'var(--muted)' }}
          >
            <X size={18} />
          </button>

          <div style={{ padding: '0px 8px 16px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
            <div className="card-title" style={{ fontSize: '20px', color: 'var(--accent)' }}>
              {new Date(selectedIsoDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            {totalTasks === 0 ? (
              <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>No tasks planned for this day yet.</div>
            ) : (
              <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>{tasksDoneCount} of {totalTasks} tasks completed</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--surface)', padding: '4px', borderRadius: '12px' }}>
            <button 
               onClick={() => setActiveTab('tasks')}
               style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'tasks' ? 'var(--accent)' : 'transparent', color: activeTab === 'tasks' ? 'white' : 'var(--muted)', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
               <LayoutList size={16} /> Checklist
            </button>
            <button 
               onClick={() => setActiveTab('notes')}
               style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'notes' ? 'var(--accent)' : 'transparent', color: activeTab === 'notes' ? 'white' : 'var(--muted)', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
               <FileText size={16} /> Strategy Notes
            </button>
          </div>

          {activeTab === 'tasks' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 8px' }}>
              {totalTasks > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{tasksDoneCount} / {totalTasks} tasks done</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{pct}%</div>
                  </div>
                  
                  <div className="progress" style={{ height: '8px', background: 'var(--surface2)', overflow: 'hidden', marginBottom: '20px' }}>
                    <motion.div 
                      className="prog-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{ background: 'var(--accent)' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                            <span className={`badge ${ct.targetBadge}`} style={{ marginLeft: '6px', fontSize: '10px' }}>{ct.targetType}</span>
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
                        style={{ marginTop: '16px', background: 'var(--surface)', borderLeft: '4px solid var(--navy)', padding: '16px', borderRadius: '8px', boxShadow: '0 10px 30px -10px rgba(2, 0, 29, 0.1)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <Plus size={16} /> New Task
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
                        
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
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
                                border: 'none'
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
                            Add Task
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
                          <Plus size={16} /> Add Task
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'notes' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                Use this space strictly for overarching day strategies, unstructured thoughts, or notes that don't fit into bulleted tasks.
              </div>
              <StrategyEditor 
                 initialContent={dayNotes[selectedIsoDate] || ""}
                 onChange={(val) => handleNotesChange(val)}
                 onBlur={handleNotesBlur}
              />
            </motion.div>
          )}

        </motion.div>
      </div>
    );
  };

  return (
    <div className="panel active">
      <div className="section-title">90-Day Execution Calendar</div>
      <div className="section-sub">Map out a long-term 90-day trajectory. Click any day to manage its tasks.</div>

      <div className="card">
        <div className="cal-header">
          <div className="cal-dow">Mon</div>
          <div className="cal-dow">Tue</div>
          <div className="cal-dow">Wed</div>
          <div className="cal-dow">Thu</div>
          <div className="cal-dow">Fri</div>
          <div className="cal-dow">Sat</div>
          <div className="cal-dow">Sun</div>
        </div>
        <div className="cal-grid">
          {cells}
        </div>
      </div>
      
      <AnimatePresence>
        {selectedIsoDate && renderModal()}
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
