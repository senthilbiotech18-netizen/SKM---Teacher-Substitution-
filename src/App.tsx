/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Clock, Calendar, Printer, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';

// --- Constants & Data ---

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
type Day = typeof DAYS[number];

const PERIODS_13 = [
  { label: 'P1', time: '8:55–9:25' },
  { label: 'P2', time: '9:25–10:05' },
  { label: 'P3', time: '10:05–10:45' },
  { label: 'BREAK', time: '10:45–11:00', isBreak: true },
  { label: 'P4', time: '11:00–11:40' },
  { label: 'P5', time: '11:40–12:15' },
  { label: 'P6', time: '12:15–12:50' },
  { label: 'LUNCH', time: '12:50–13:30', isBreak: true },
  { label: 'P7', time: '13:30–14:15' },
];

const PERIODS_45 = [
  { label: 'P1', time: '8:55–9:50' },
  { label: 'P2', time: '9:50–10:45' },
  { label: 'BREAK', time: '10:45–11:00', isBreak: true },
  { label: 'P3', time: '11:00–11:55' },
  { label: 'P4', time: '11:55–12:50' },
  { label: 'LUNCH', time: '12:50–13:35', isBreak: true },
  { label: 'P5', time: '13:35–14:25' },
  { label: 'P6', time: '14:25–15:15' },
];

const TEACHERS = [
  { name: 'Anitha R', init: 'AR', subj: 'Mathematics' },
  { name: 'Babu S', init: 'BS', subj: 'Science' },
  { name: 'Chitra M', init: 'CM', subj: 'English' },
  { name: 'Deepa K', init: 'DK', subj: 'Social Studies' },
  { name: 'Eswaran P', init: 'EP', subj: 'Tamil' },
  { name: 'Fathima Z', init: 'FZ', subj: 'Mathematics' },
  { name: 'Ganesh T', init: 'GT', subj: 'Science' },
  { name: 'Hema L', init: 'HL', subj: 'English' },
  { name: 'Indira V', init: 'IV', subj: 'Hindi' },
  { name: 'Jayanthi N', init: 'JN', subj: 'Arts' },
  { name: 'Kavitha R', init: 'KR', subj: 'Mathematics' },
  { name: 'Lakshmi S', init: 'LS', subj: 'Social Studies' },
  { name: 'Malar P', init: 'MP', subj: 'Tamil' },
  { name: 'Nandini C', init: 'NC', subj: 'Science' },
  { name: 'Oviya B', init: 'OB', subj: 'English' },
  { name: 'Priya D', init: 'PD', subj: 'Mathematics' },
  { name: 'Queen M', init: 'QM', subj: 'Physical Ed' },
  { name: 'Ramya G', init: 'RG', subj: 'Hindi' },
  { name: 'Sangeetha K', init: 'SK', subj: 'Arts' },
  { name: 'Tamilarasi V', init: 'TV', subj: 'Tamil' },
  { name: 'Uma J', init: 'UJ', subj: 'Science' },
  { name: 'Vasantha R', init: 'VR', subj: 'Mathematics' },
  { name: 'Wakeel A', init: 'WA', subj: 'Social Studies' },
  { name: 'Xavier P', init: 'XP', subj: 'Physical Ed' },
  { name: 'Yamuna S', init: 'YS', subj: 'English' },
  { name: 'Zeenath F', init: 'ZF', subj: 'Science' },
  { name: 'Anbu K', init: 'AK', subj: 'Mathematics' },
  { name: 'MDN', init: 'MD', subj: 'Digital Design' },
  { name: 'AVS', init: 'AV', subj: 'Digital Design' },
  { name: 'MSK', init: 'MS', subj: 'Digital Design' },
];

// --- Helpers ---

function parseTime(timeStr: string) {
  const [h, m] = timeStr.trim().split(':').map(Number);
  return h * 60 + m;
}

function parseRange(rangeStr: string) {
  const parts = rangeStr.split(/[–-]/);
  return {
    start: parseTime(parts[0]),
    end: parseTime(parts[1])
  };
}

function rangesOverlap(r1: { start: number, end: number }, r2: { start: number, end: number }) {
  return r1.start < r2.end && r2.start < r1.end;
}

function genSchedule(teacherIdx: number, numSlots: number) {
  const seed = teacherIdx * 31 + numSlots * 7;
  const slots = [];
  for (let i = 0; i < numSlots; i++) {
    slots.push(((seed * (i + 3) * 17 + i * 13) % 3 === 0) ? 0 : 1);
  }
  let frees = slots.filter(x => x === 0).length;
  let busys = slots.filter(x => x === 1).length;
  if (frees < 2) { slots[0] = 0; slots[2] = 0; }
  if (busys < 2) { slots[1] = 1; slots[3] = 1; }
  return slots;
}

// Generate fallback base timetables
const TT13_BASE = Object.fromEntries(TEACHERS.map((t, i) => [t.name, genSchedule(i, 7)]));
const TT45_BASE = Object.fromEntries(TEACHERS.map((t, i) => [t.name, genSchedule(i + 100, 6)]));

export default function App() {
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; init: string; subj: string; isHomeBlock: boolean }>>(() => {
    const saved = localStorage.getItem('tsf_teachers');
    const base = TEACHERS.map((t, i) => ({ ...t, id: `t-${i}`, isHomeBlock: true }));
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure existing teachers have the new property
      const mapped = parsed.map((t: any) => ({
        ...t,
        isHomeBlock: t.isHomeBlock !== undefined ? t.isHomeBlock : true
      }));
      if (mapped.length < base.length) {
        return [...mapped, ...base.slice(mapped.length)];
      }
      return mapped;
    }
    return base;
  });

  const [timetables, setTimetables] = useState<Record<string, Record<Day, { myp13: number[], myp45: number[] }>>>(() => {
    const saved = localStorage.getItem('tsf_timetables');
    const parsed = saved ? JSON.parse(saved) : {};
    
    // Ensure every teacher in the current list has a timetable entry
    const baseTeachers = TEACHERS.map((t, i) => ({ ...t, id: `t-${i}` }));
    baseTeachers.forEach((t, i) => {
      if (!parsed[t.id]) {
        parsed[t.id] = {} as any;
        DAYS.forEach((day, dIdx) => {
          parsed[t.id][day] = {
            myp13: genSchedule(i + dIdx * 7, 7),
            myp45: genSchedule(i + dIdx * 11 + 100, 6)
          };
        });
      }
    });

    return parsed;
  });

  // Ensure all teachers have timetables (sync missing ones)
  useEffect(() => {
    setTimetables(prev => {
      let changed = false;
      const next = { ...prev };
      teachers.forEach((t, i) => {
        if (!next[t.id]) {
          changed = true;
          next[t.id] = {} as any;
          DAYS.forEach((day, dIdx) => {
            next[t.id][day] = {
              myp13: genSchedule(i + dIdx * 7, 7),
              myp45: genSchedule(i + dIdx * 11 + 100, 6)
            };
          });
        }
      });
      return changed ? next : prev;
    });
  }, [teachers]);

  const [selectedDay, setSelectedDay] = useState<Day>('Monday');
  const [isEditMode, setIsEditMode] = useState(false);
  const [absentTeacher, setAbsentTeacher] = useState('');
  const [ttGroup, setTtGroup] = useState<'myp13' | 'myp45'>('myp13');
  const [periodIdx, setPeriodIdx] = useState<number | ''>('');
  const [assignments, setAssignments] = useState<Record<string, Record<string, boolean>>>({});
  const [assignmentLog, setAssignmentLog] = useState<Array<{
    absent: string;
    sub: string;
    group: string;
    periodLabel: string;
    periodTime: string;
    day: Day;
  }>>([]);
  const [activeTab, setActiveTab] = useState<'myp13' | 'myp45'>('myp13');
  const [selectedSub, setSelectedSub] = useState('');

  // Persistence
  useEffect(() => {
    localStorage.setItem('tsf_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('tsf_timetables', JSON.stringify(timetables));
  }, [timetables]);

  const currentPeriods = ttGroup === 'myp13' ? PERIODS_13 : PERIODS_45;
  const realPeriods = useMemo(() => currentPeriods.filter(p => !p.isBreak), [currentPeriods]);

  const availableSubs = useMemo(() => {
    if (!absentTeacher || periodIdx === '') return [];
    const targetPeriod = realPeriods[Number(periodIdx)];
    const targetRange = parseRange(targetPeriod.time);
    const targetKey = `${selectedDay}_${ttGroup}_${targetPeriod.label}`;

    return teachers.filter(t => {
      // 1. Only Home Block teachers can be substitutes
      if (!t.isHomeBlock) return false;
      
      // 2. Cannot substitute themselves
      if (t.name === absentTeacher) return false;
      
      // 3. Check if already assigned for this period
      if (assignments[t.id]?.[targetKey]) return false;
      
      const dayTT = timetables[t.id]?.[selectedDay];
      if (!dayTT) return false;

      // 4. Unified Conflict Check: Look for any overlapping "Occupied" periods in BOTH groups
      const allPeriodSets = [
        { periods: PERIODS_13, slots: dayTT.myp13 },
        { periods: PERIODS_45, slots: dayTT.myp45 }
      ];

      for (const set of allPeriodSets) {
        let realIdx = 0;
        for (const p of set.periods) {
          if (p.isBreak) continue;
          
          const currentIdx = realIdx++;
          const isOccupied = set.slots[currentIdx] === 1;
          
          if (isOccupied) {
            const pRange = parseRange(p.time);
            if (rangesOverlap(targetRange, pRange)) {
              return false; // Conflict found!
            }
          }
        }
      }

      return true; // No conflicts, is Home Block staff
    });
  }, [absentTeacher, ttGroup, periodIdx, assignments, realPeriods, teachers, timetables, selectedDay]);

  const handleAssign = () => {
    if (!selectedSub || !absentTeacher || periodIdx === '') return;
    const periodInfo = realPeriods[Number(periodIdx)];
    const key = `${selectedDay}_${ttGroup}_${periodInfo.label}`;
    const subTeacher = teachers.find(t => t.name === selectedSub);
    if (!subTeacher) return;

    setAssignments(prev => ({
      ...prev,
      [subTeacher.id]: {
        ...(prev[subTeacher.id] || {}),
        [key]: true,
      }
    }));

    setAssignmentLog(prev => [
      ...prev,
      {
        absent: absentTeacher,
        sub: selectedSub,
        group: ttGroup === 'myp13' ? 'MYP 1–3' : 'MYP 4–5',
        periodLabel: periodInfo.label,
        periodTime: periodInfo.time,
        day: selectedDay,
      }
    ]);

    setAbsentTeacher('');
    setPeriodIdx('');
    setSelectedSub('');
  };

  const handleReset = () => {
    setAbsentTeacher('');
    setPeriodIdx('');
    setSelectedSub('');
  };

  const clearLog = () => {
    setAssignmentLog([]);
    setAssignments({});
  };

  const handleUpdateTeacher = (id: string, name: string, subj: string, isHomeBlock?: boolean) => {
    setTeachers(prev => prev.map(t => t.id === id ? { 
      ...t, 
      name, 
      subj, 
      isHomeBlock: isHomeBlock !== undefined ? isHomeBlock : t.isHomeBlock 
    } : t));
  };

  const handleToggleSlot = (teacherId: string, group: 'myp13' | 'myp45', idx: number) => {
    setTimetables(prev => {
      const newTT = { ...prev };
      const teacherTT = { ...newTT[teacherId] };
      const dayTT = { ...teacherTT[selectedDay] };
      const slots = [...dayTT[group]];
      slots[idx] = slots[idx] === 0 ? 1 : 0;
      dayTT[group] = slots;
      teacherTT[selectedDay] = dayTT;
      newTT[teacherId] = teacherTT;
      return newTT;
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] px-8 py-5 flex items-center justify-between sticky top-0 z-20 print:relative">
        <div className="flex items-center gap-4">
          <h1 className="text-[20px] font-semibold tracking-tight">Teacher Substitution Finder</h1>
          <div className="flex no-print bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)] gap-1">
            <button 
              onClick={() => setIsEditMode(false)}
              className={`px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${!isEditMode ? 'bg-white shadow-sm text-[var(--accent)] border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
            >
              Substitution Finder
            </button>
            <button 
              onClick={() => setIsEditMode(true)}
              className={`px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${isEditMode ? 'bg-white shadow-sm text-[var(--accent)] border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
            >
              Edit Timetable
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 no-print">
          <div className="flex items-center h-9 px-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`h-7 px-3 text-[11px] font-semibold rounded-md transition-all ${selectedDay === day ? 'bg-white shadow-sm text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[11px] font-mono text-[var(--text-muted)] overflow-hidden">
            <span className="px-3 py-1 border-r border-[var(--border)]">MYP 1–3</span>
            <span className="px-3 py-1 text-[var(--text-faint)]">|</span>
            <span className="px-3 py-1">MYP 4–5</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-8 py-7">
        {!isEditMode && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Control Panel */}
            <section className="bg-white border border-[var(--border)] rounded-[12px] p-8 mb-6 flex flex-wrap gap-6 items-end no-print">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Absent Teacher</label>
                <select 
                  value={absentTeacher} 
                  onChange={(e) => {
                    setAbsentTeacher(e.target.value);
                    setSelectedSub('');
                  }}
                  className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                >
                  <option value="">— select absent teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.subj})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 min-w-[220px]">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Timetable Group</label>
                <select 
                  value={ttGroup} 
                  onChange={(e) => {
                    setTtGroup(e.target.value as 'myp13' | 'myp45');
                    setPeriodIdx('');
                    setSelectedSub('');
                  }}
                  className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                >
                  <option value="myp13">MYP 1 – 3 (7 periods)</option>
                  <option value="myp45">MYP 4 – 5 (6 periods)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 min-w-[220px]">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Period to Cover</label>
                <select 
                  value={periodIdx} 
                  onChange={(e) => {
                    setPeriodIdx(e.target.value === '' ? '' : Number(e.target.value));
                    setSelectedSub('');
                  }}
                  className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                >
                  <option value="">— select period —</option>
                  {realPeriods.map((p, i) => (
                    <option key={p.label} value={i}>{p.label} — {p.time}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {}}
                  className="px-8 py-2.5 bg-[#534AB7] text-white rounded-lg text-sm font-medium hover:bg-[#3C3489] active:scale-95 transition-all shadow-sm"
                >
                  Find Substitutes
                </button>
                <button 
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-white border border-[var(--border-strong)] rounded-lg text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all outline-none"
                >
                  Reset
                </button>
              </div>
            </section>
          </motion.div>
        )}

        {isEditMode && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-[var(--accent-light)] border border-[var(--purple-border)] rounded-xl flex items-center justify-between no-print"
          >
            <div>
              <h2 className="text-[15px] font-bold text-[var(--purple-text)] mb-1">Edit Timetable Mode</h2>
              <p className="text-[12px] text-[var(--purple-strong)] opacity-80">Click on teacher names/subjects to edit, or toggle status pills in the grid for {selectedDay}.</p>
            </div>
            <button 
              onClick={() => setIsEditMode(false)}
              className="px-6 py-2 bg-white border border-[var(--purple-border)] text-[var(--purple-text)] rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white shadow-sm active:scale-95 transition-all"
            >
              Done Editing
            </button>
          </motion.div>
        )}

        {/* Floating Action Buttons */}
        {!isEditMode && (
          <div className="flex justify-end gap-3 mb-6 no-print">
            <button onClick={() => window.print()} className="px-6 py-2 bg-white border border-[var(--border-strong)] rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors shadow-sm">
              Print / Save PDF
            </button>
            <button onClick={clearLog} className="px-6 py-2 bg-white border border-[var(--border-strong)] rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors shadow-sm">
              Clear Log
            </button>
          </div>
        )}

        {/* Results Panel */}
        <AnimatePresence>
          {!isEditMode && absentTeacher && periodIdx !== '' && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white border border-[var(--border)] rounded-xl p-6 mb-6 no-print shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold">
                  {availableSubs.length} teacher(s) available to substitute for {absentTeacher}
                </h3>
                <div className="flex gap-2">
                   <div className="text-xs bg-[var(--accent-light)] border border-[var(--purple-border)] px-3 py-1 rounded-full text-[var(--purple-text)] font-semibold">
                    {selectedDay}
                  </div>
                  <div className="text-xs bg-[var(--bg)] border border-[var(--border)] px-3 py-1 rounded-full text-[var(--text-muted)]">
                    {realPeriods[Number(periodIdx)].label} · {realPeriods[Number(periodIdx)].time} · {ttGroup === 'myp13' ? 'MYP 1–3' : 'MYP 4–5'}
                  </div>
                </div>
              </div>

              {availableSubs.length > 0 ? (
                <>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5 mb-6">
                    {availableSubs.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedSub(t.name)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          selectedSub === t.name 
                          ? 'border-[var(--accent)] bg-[var(--purple-bg)] shadow-sm' 
                          : 'border-[var(--green-border)] bg-[var(--green-bg)] hover:border-[#3B6D11]'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${
                          selectedSub === t.name ? 'bg-[#AFA9EC] text-[#3C3489]' : 'bg-[#C0DD97] text-[#27500A]'
                        }`}>
                          {t.init}
                        </div>
                        <div>
                          <p className={`text-[13px] font-medium transition-colors ${selectedSub === t.name ? 'text-[var(--purple-text)]' : 'text-[var(--green-text)]'}`}>
                            {t.name}
                          </p>
                          <p className={`text-[11px] transition-colors ${selectedSub === t.name ? 'text-[var(--accent)]' : 'text-[#3B6D11]'}`}>
                            {t.subj}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[var(--border)] flex items-center gap-3">
                    <select 
                      value={selectedSub}
                      onChange={(e) => setSelectedSub(e.target.value)}
                      className="min-w-[220px] bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                    >
                      <option value="">Pick a substitute...</option>
                      {availableSubs.map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.subj})</option>
                      ))}
                    </select>
                    <button 
                      onClick={handleAssign}
                      disabled={!selectedSub}
                      className="px-8 py-2.5 bg-[#534AB7] text-white rounded-lg text-sm font-medium hover:bg-[#3C3489] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 size={16} />
                      Assign Substitute
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)] text-[13px] border-2 border-dashed border-[var(--border)] rounded-lg">
                  All teachers are occupied during this period. Consider splitting the class.
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Assignment Log */}
        {!isEditMode && assignmentLog.length > 0 && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-[var(--border)] rounded-xl p-8 mb-6 shadow-sm"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-5">
              Assignments for {selectedDay}
            </div>
            <div className="space-y-0 text-[13px]">
              {assignmentLog.filter(l => l.day === selectedDay).map((log, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-x-0 first:pt-0 last:pb-0">
                  <span className="font-mono text-[11px] bg-[var(--bg)] px-3 py-1 rounded border border-[var(--border)] min-w-[100px] text-center">
                    {log.periodLabel} · {log.periodTime}
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)] whitespace-nowrap">{log.group}</span>
                  <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />
                  <span className="font-medium whitespace-nowrap">Absent: {log.absent}</span>
                  <ArrowRight size={16} className="text-[var(--text-faint)]" />
                  <span className="inline-flex items-center gap-1.5 bg-[var(--purple-bg)] text-[var(--purple-text)] border border-[var(--purple-border)] rounded-full px-4 py-1 text-[12px] font-medium transition-all hover:border-[var(--purple-strong)]">
                    Sub: {log.sub}
                  </span>
                </div>
              ))}
              {assignmentLog.filter(l => l.day === selectedDay).length === 0 && (
                <div className="py-2 text-[var(--text-faint)] italic">No assignments for {selectedDay} yet.</div>
              )}
            </div>
          </motion.section>
        )}

        {/* Legend */}
        {!isEditMode && (
          <div className="flex flex-wrap gap-5 mb-5 no-print">
            <LegendItem color="bg-[#FAECE7]" borderColor="border-[#F0997B]" label="Occupied" />
            <LegendItem color="bg-[#EAF3DE]" borderColor="border-[#97C459]" label="Free" />
            <LegendItem color="bg-[#EEEDFE]" borderColor="border-[#534AB7]" label="Available to Substitute" highlighted />
            <LegendItem color="bg-[#FAEEDA]" borderColor="border-[#EF9F27]" label="Break" />
            <LegendItem color="bg-[#AFA9EC]" borderColor="border-[#534AB7]" label="Assigned" />
          </div>
        )}

        {/* Timetable Tabs */}
        {!isEditMode && (
          <div className="flex border-b border-[var(--border)] mb-6 no-print">
            <button 
              onClick={() => setActiveTab('myp13')}
              className={`px-5 py-3 text-[13px] font-medium transition-all relative ${
                activeTab === 'myp13' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              MYP 1 – 3 Timetable
              {activeTab === 'myp13' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('myp45')}
              className={`px-5 py-3 text-[13px] font-medium transition-all relative ${
                activeTab === 'myp45' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              MYP 4 – 5 Timetable
              {activeTab === 'myp45' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />}
            </button>
          </div>
        )}

        {/* Timetable Content */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-8 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {activeTab === 'myp13' ? 'MYP 1–3 — 7 Periods' : 'MYP 4–5 — 6 Periods'} — {selectedDay}
            </div>
            {isEditMode && <div className="text-[10px] font-bold bg-[#EF9F27] text-white px-2 py-0.5 rounded uppercase">Editing Timetable</div>}
          </div>
          <div className="overflow-x-auto">
            <TimetableGrid 
              activeTab={activeTab} 
              periods={activeTab === 'myp13' ? PERIODS_13 : PERIODS_45}
              teachers={teachers}
              timetables={timetables}
              selectedDay={selectedDay}
              assignments={assignments}
              highlightTeachers={isEditMode ? [] : availableSubs.map(t => t.name)}
              highlightPeriodIdx={isEditMode ? -1 : (periodIdx === '' ? -1 : Number(periodIdx))}
              highlightGroup={isEditMode ? null : ttGroup}
              isEditMode={isEditMode}
              onUpdateTeacher={handleUpdateTeacher}
              onToggleSlot={handleToggleSlot}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function LegendItem({ color, borderColor, label, highlighted = false }: { color: string; borderColor: string; label: string; highlighted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px] text-[var(--text-muted)] font-normal">
      <div className={`legend-square ${color} ${borderColor} ${highlighted ? 'border-[1.5px]' : ''}`} />
      {label}
    </div>
  );
}

interface TimetableGridProps {
  activeTab: 'myp13' | 'myp45';
  periods: typeof PERIODS_13;
  teachers: Array<{ id: string; name: string; subj: string; isHomeBlock: boolean }>;
  timetables: Record<string, Record<Day, { myp13: number[], myp45: number[] }>>;
  selectedDay: Day;
  assignments: Record<string, Record<string, boolean>>;
  highlightTeachers: string[];
  highlightPeriodIdx: number;
  highlightGroup: string | null;
  isEditMode: boolean;
  onUpdateTeacher: (id: string, name: string, subj: string, isHomeBlock?: boolean) => void;
  onToggleSlot: (teacherId: string, group: 'myp13' | 'myp45', idx: number) => void;
}

function TimetableGrid({ 
  activeTab, 
  periods, 
  teachers, 
  timetables, 
  selectedDay, 
  assignments, 
  highlightTeachers, 
  highlightPeriodIdx, 
  highlightGroup,
  isEditMode,
  onUpdateTeacher,
  onToggleSlot
}: TimetableGridProps) {
  return (
    <table className="w-full border-collapse text-[11px] min-w-[1000px]">
      <thead>
        <tr>
          <th className="bg-[#fcfbf9] p-3 text-left font-semibold text-[var(--text-muted)] border border-[var(--border)] w-40">Teacher</th>
          <th className="bg-[#fcfbf9] p-3 text-left font-semibold text-[var(--text-muted)] border border-[var(--border)] w-28">Subject</th>
          {periods.map((p, i) => (
            <th 
              key={i} 
              className={`p-3 text-center border border-[var(--border)] ${p.isBreak ? 'bg-[#fdf9f2]' : 'bg-[#fcfbf9]'}`}
            >
              <div className="font-semibold text-[var(--text)]">{p.label}</div>
              <div className="font-normal text-[9px] text-[var(--text-faint)] leading-tight">{p.time}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {teachers.map(teacher => {
          const teacherTT = timetables[teacher.id];
          const dayTT = teacherTT?.[selectedDay];
          const teacherSlots = dayTT ? (activeTab === 'myp13' ? dayTT.myp13 : dayTT.myp45) : [];
          let realPeriodIdx = 0;
          return (
            <tr key={teacher.id} className="hover:bg-[#fafaf8]">
              <td className="p-2 border border-[var(--border)] whitespace-nowrap">
                {isEditMode ? (
                  <div className="flex flex-col gap-1">
                    <input 
                      value={teacher.name}
                      onChange={(e) => onUpdateTeacher(teacher.id, e.target.value, teacher.subj)}
                      className="w-full bg-transparent border-none outline-none font-medium text-[var(--text)] p-1 hover:bg-white rounded transition-all focus:bg-white focus:shadow-sm"
                    />
                    <label className="flex items-center gap-1.5 px-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={teacher.isHomeBlock} 
                        onChange={(e) => onUpdateTeacher(teacher.id, teacher.name, teacher.subj, e.target.checked)}
                        className="w-3 h-3 accent-[var(--accent)]"
                      />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Home Block Staff</span>
                    </label>
                  </div>
                ) : (
                  <div className="p-1 flex items-center gap-2">
                    <span className="font-medium text-[var(--text)]">{teacher.name}</span>
                    {!teacher.isHomeBlock && (
                      <span className="text-[8px] font-bold uppercase py-0.5 px-1.5 bg-gray-100 text-gray-400 border border-gray-200 rounded tracking-tighter">External</span>
                    )}
                  </div>
                )}
              </td>
              <td className="p-2 border border-[var(--border)]">
                {isEditMode ? (
                  <input 
                    value={teacher.subj}
                    onChange={(e) => onUpdateTeacher(teacher.id, teacher.name, e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[var(--text-muted)] text-[11px] font-normal p-1 hover:bg-white rounded transition-all focus:bg-white focus:shadow-sm"
                  />
                ) : (
                  <span className="p-1 block text-[var(--text-muted)] text-[11px] font-normal">{teacher.subj}</span>
                )}
              </td>
              {periods.map((p, i) => {
                if (p.isBreak) {
                  return <td key={i} className="p-1.5 border border-[var(--border)]">
                    <span className="status-pill status-break">Break</span>
                  </td>;
                }

                const currentRealIdx = realPeriodIdx++;
                const key = `${selectedDay}_${activeTab}_${p.label}`;
                const isAssigned = assignments[teacher.id]?.[key];
                const isHighlighted = highlightTeachers.includes(teacher.name) && activeTab === highlightGroup && currentRealIdx === highlightPeriodIdx;
                const isBusy = teacherSlots[currentRealIdx] === 1;

                const handleClick = () => {
                  if (isEditMode) {
                    onToggleSlot(teacher.id, activeTab, currentRealIdx);
                  }
                };

                if (isAssigned) {
                  return <td key={i} className="p-1.5 border border-[var(--border)]">
                    <span className="status-pill status-assigned">Assigned</span>
                  </td>;
                }
                if (isHighlighted) {
                  return <td key={i} className="p-1.5 border border-[var(--border)]">
                    <span className="status-pill status-highlighted">Free ★</span>
                  </td>;
                }
                if (isBusy) {
                  return <td key={i} className="p-1.5 border border-[var(--border)]">
                    <span 
                      onClick={handleClick}
                      className={`status-pill status-occupied ${isEditMode ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
                    >
                      Occupied
                    </span>
                  </td>;
                }
                return <td key={i} className="p-1.5 border border-[var(--border)]">
                  <span 
                    onClick={handleClick}
                    className={`status-pill status-free ${isEditMode ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
                  >
                    Free
                  </span>
                </td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
