"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  minWidth?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CustomDatePicker({ value, onChange, placeholder = "Select a date...", minWidth }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Date currently shown in the calendar view
  // If no value, default to today
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  useEffect(() => {
    if (isOpen && value) {
      setViewDate(new Date(value));
    }
  }, [isOpen, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelectDate = (e: React.MouseEvent, day: number) => {
    e.stopPropagation();
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    onChange(`${viewYear}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  // Convert to local date string parsing safely
  let displayDateText = placeholder;
  if (value) {
    const [y, m, d] = value.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (!isNaN(dateObj.getTime())) {
      displayDateText = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  }

  // Determine accent color from context or default
  const accentColor = 'var(--accent, #3b82f6)'; 

  return (
    <div style={{ position: 'relative', width: '100%', minWidth }} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '10px 14px',
          background: 'var(--surface)',
          width: '100%',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: value ? 'var(--text)' : 'var(--muted)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <CalendarIcon size={16} color={accentColor} />
        <span style={{ fontSize: '14px', fontWeight: 500, flex: 1, whiteSpace: 'nowrap' }}>{displayDateText}</span>
        <ChevronDown size={14} color="var(--muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 1000,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              width: '280px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button type="button" onClick={handlePrevMonth} style={{ background: 'var(--surface2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={16} color="var(--text)" />
              </button>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
              <button type="button" onClick={handleNextMonth} style={{ background: 'var(--surface2)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={16} color="var(--text)" />
              </button>
            </div>

            {/* Days Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
              {DAY_NAMES.map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const currentDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                
                // Get today's local string
                const t = new Date();
                const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
                
                const isSelected = value === currentDateStr;
                const isToday = todayStr === currentDateStr;

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={(e) => handleSelectDate(e, d)}
                    style={{
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: isSelected || isToday ? 600 : 400,
                      color: isSelected ? '#fff' : (isToday ? accentColor : 'var(--text)'),
                      background: isSelected ? accentColor : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 4px 12px ${accentColor}40` : 'none',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--surface2)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onChange(""); setIsOpen(false); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
              >
                Clear
              </button>
              <button 
                type="button" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const today = new Date();
                  const str = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  onChange(str);
                  setIsOpen(false);
                }} 
                style={{ background: 'transparent', border: 'none', color: accentColor, fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
