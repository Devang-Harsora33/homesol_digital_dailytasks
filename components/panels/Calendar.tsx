"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Plus, Trash2, X, FileText, LayoutList } from "lucide-react";
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

  // Modal active tab
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.customTasks) setCustomTasks(data.customTasks);
        if (data.dayNotes) setDayNotes(data.dayNotes);
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

    const newTask: CustomTask = {
      id: Date.now().toString(),
      t: newTaskTitle,
      d: clearHtml,
      isDone: false,
      targetType: newTaskTag.label,
      targetBadge: newTaskTag.badge
    };

    const list = customTasks[selectedIsoDate] || [];
    const newCt = { ...customTasks, [selectedIsoDate]: [...list, newTask] };
    setCustomTasks(newCt);
    setNewTaskTitle("");
    setNewTaskDetail("");
    setNewTaskTag(TAG_OPTIONS[0]);
    setIsAdding(false);
    await saveCustomTasks(newCt);
  };

  const toggleCustomTask = async (taskId: string) => {
    if (!user || !selectedIsoDate) return;
    const list = customTasks[selectedIsoDate] || [];
    const newCt = {
      ...customTasks,
      [selectedIsoDate]: list.map(t => t.id === taskId ? { ...t, isDone: !t.isDone } : t)
    };
    setCustomTasks(newCt);
    await saveCustomTasks(newCt);
  };

  const deleteCustomTask = async (taskId: string) => {
    if (!user || !selectedIsoDate) return;
    const list = customTasks[selectedIsoDate] || [];
    const newCt = {
      ...customTasks,
      [selectedIsoDate]: list.filter(t => t.id !== taskId)
    };
    setCustomTasks(newCt);
    await saveCustomTasks(newCt);
  };

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const dayTasks = customTasks[iso] || [];
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
    const totalTasks = cTasks.length;
    const tasksDoneCount = cTasks.filter(t => t.isDone).length;
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
                            <span className={`badge ${ct.targetBadge}`} style={{ marginLeft: '6px', fontSize: '10px' }}>{ct.targetType}</span>
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
    </div>
  );
}
