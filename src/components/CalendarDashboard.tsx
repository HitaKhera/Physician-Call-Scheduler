import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Filter, 
  Plus, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeftRight, 
  Search,
  Eye,
  CalendarDays,
  CalendarRange,
  ListOrdered,
  Layers,
  Phone,
  Mail,
  Shield,
  HelpCircle,
  X,
  Sparkles
} from 'lucide-react';
import { 
  Physician, 
  Shift, 
  ShiftCategory, 
  PhysicianRole, 
  ScheduleConflict, 
  ShiftStatus 
} from '../types';
import { SHIFT_DEFINITIONS, RECOGNIZED_HOLIDAYS } from '../data/mockData';
import { formatFriendlyDate, isWeekendDate } from '../utils/schedulerEngine';

type CalendarViewMode = 'month' | 'week' | 'day' | 'timeline';

interface CalendarDashboardProps {
  shifts: Shift[];
  physicians: Physician[];
  conflicts?: ScheduleConflict[];
  currentDate: Date;
  currentDateState?: Date;
  setCurrentDate?: (date: Date) => void;
  onDateChange?: (date: Date) => void;
  onUpdateShift?: (updatedShift: Shift) => void;
  onAssignShift?: (shiftId: string, physicianId: string | null) => void;
  onAddShift?: (newShift: Omit<Shift, 'id' | 'updatedAt'>) => void;
  onCreateShift?: (date: string, type: ShiftCategory, physicianId: string | null, notes?: string) => void;
  onDeleteShift: (shiftId: string) => void;
  onRequestSwapForShift?: (shift: Shift) => void;
  onTriggerSwap?: (shift: Shift) => void;
  onOpenEngine?: () => void;
}

export const CalendarDashboard: React.FC<CalendarDashboardProps> = ({
  shifts = [],
  physicians = [],
  conflicts = [],
  currentDate,
  setCurrentDate,
  onDateChange,
  onUpdateShift,
  onAssignShift,
  onAddShift,
  onCreateShift,
  onDeleteShift,
  onRequestSwapForShift,
  onTriggerSwap,
  onOpenEngine,
}) => {
  const handleDateChange = onDateChange || setCurrentDate || (() => {});
  
  const handleUpdateShift = (updatedShift: Shift) => {
    if (onUpdateShift) {
      onUpdateShift(updatedShift);
    } else if (onAssignShift) {
      onAssignShift(updatedShift.id, updatedShift.physicianId);
    }
  };

  const handleAddShift = (newShiftData: Omit<Shift, 'id' | 'updatedAt'>) => {
    if (onAddShift) {
      onAddShift(newShiftData);
    } else if (onCreateShift) {
      onCreateShift(newShiftData.date, newShiftData.type, newShiftData.physicianId, newShiftData.notes);
    }
  };

  const handleTriggerSwap = (shift: Shift) => {
    if (onRequestSwapForShift) {
      onRequestSwapForShift(shift);
    } else if (onTriggerSwap) {
      onTriggerSwap(shift);
    }
  };

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedPhysicianFilter, setSelectedPhysicianFilter] = useState<string>('ALL');
  const [selectedShiftTypeFilter, setSelectedShiftTypeFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Shift Modal State
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newShiftDate, setNewShiftDate] = useState<string>('');
  const [newShiftType, setNewShiftType] = useState<ShiftCategory>('PRIMARY_CALL');
  const [newShiftPhysicianId, setNewShiftPhysicianId] = useState<string>('');
  const [newShiftNotes, setNewShiftNotes] = useState<string>('');

  // Selected Day View state
  const [selectedDayDate, setSelectedDayDate] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`
  );

  const physicianMap = useMemo(() => new Map((physicians || []).map((p) => [p.id, p])), [physicians]);

  // Conflict lookup sets
  const conflictShiftIdMap = useMemo(() => {
    const map = new Map<string, ScheduleConflict[]>();
    for (const c of (conflicts || [])) {
      if (c.shiftId) {
        if (!map.has(c.shiftId)) map.set(c.shiftId, []);
        map.get(c.shiftId)!.push(c);
      }
    }
    return map;
  }, [conflicts]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    handleDateChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    handleDateChange(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    handleDateChange(new Date());
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      // Physician filter
      if (selectedPhysicianFilter !== 'ALL' && shift.physicianId !== selectedPhysicianFilter) {
        return false;
      }
      // Shift type filter
      if (selectedShiftTypeFilter !== 'ALL' && shift.type !== selectedShiftTypeFilter) {
        return false;
      }
      // Role filter
      if (selectedRoleFilter !== 'ALL') {
        const doc = shift.physicianId ? physicianMap.get(shift.physicianId) : null;
        if (!doc || doc.role !== selectedRoleFilter) return false;
      }
      // Conflicts only
      if (showConflictsOnly) {
        const hasConflict = conflictShiftIdMap.has(shift.id) || !shift.physicianId;
        if (!hasConflict) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const doc = shift.physicianId ? physicianMap.get(shift.physicianId) : null;
        const shiftDef = SHIFT_DEFINITIONS[shift.type];
        const matchName = doc?.name.toLowerCase().includes(q);
        const matchType = shiftDef?.label.toLowerCase().includes(q);
        const matchRole = doc?.role.toLowerCase().includes(q);
        if (!matchName && !matchType && !matchRole) return false;
      }
      return true;
    });
  }, [shifts, selectedPhysicianFilter, selectedShiftTypeFilter, selectedRoleFilter, showConflictsOnly, searchQuery, physicianMap, conflictShiftIdMap]);

  // Calendar Grid builder for Month View
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      holidayName?: string;
    }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: isWeekendDate(dateStr),
        holidayName: RECOGNIZED_HOLIDAYS[dateStr],
      });
    }

    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: isWeekendDate(dateStr),
        holidayName: RECOGNIZED_HOLIDAYS[dateStr],
      });
    }

    // Next month padding to fill complete 35 or 42 grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: isWeekendDate(dateStr),
        holidayName: RECOGNIZED_HOLIDAYS[dateStr],
      });
    }

    return days;
  }, [year, month]);

  // Group shifts by date for rapid rendering
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const shift of filteredShifts) {
      if (!map.has(shift.date)) map.set(shift.date, []);
      map.get(shift.date)!.push(shift);
    }
    return map;
  }, [filteredShifts]);

  // Quick Add Shift handler
  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftDate) return;
    handleAddShift({
      date: newShiftDate,
      type: newShiftType,
      physicianId: newShiftPhysicianId ? newShiftPhysicianId : null,
      status: newShiftPhysicianId ? 'CONFIRMED' : 'UNCOVERED',
      notes: newShiftNotes || undefined,
      isHoliday: !!RECOGNIZED_HOLIDAYS[newShiftDate],
      holidayName: RECOGNIZED_HOLIDAYS[newShiftDate],
    });
    setIsAddModalOpen(false);
    setNewShiftNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Date Navigation, View Mode, Filters */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Date Navigator */}
        <div className="flex items-center justify-between sm:justify-start space-x-3">
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="btn-prev-month"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-today"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              id="btn-next-month"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl font-bold tracking-tight text-white">{monthName}</h2>
            <span className="text-xs text-slate-400 font-medium">
              ({filteredShifts.length} Shifts Visible)
            </span>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center justify-center sm:justify-start bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-center xl:self-auto">
          <button
            id="view-month"
            onClick={() => setViewMode('month')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Month Grid</span>
          </button>
          <button
            id="view-week"
            onClick={() => setViewMode('week')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Week Roster</span>
          </button>
          <button
            id="view-day"
            onClick={() => setViewMode('day')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'day'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Daily Call Board</span>
          </button>
          <button
            id="view-timeline"
            onClick={() => setViewMode('timeline')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'timeline'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Physician Gantt</span>
          </button>
        </div>

        {/* Quick Add Shift Button */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-add-shift-open"
            onClick={() => {
              setNewShiftDate(`${year}-${String(month + 1).padStart(2, '0')}-01`);
              setIsAddModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shift Slot</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold uppercase tracking-wider text-[10px]">Filter Roster:</span>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-filter-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search physician, shift, role..."
            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Physician Filter */}
        <select
          id="filter-physician"
          value={selectedPhysicianFilter}
          onChange={(e) => setSelectedPhysicianFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 font-medium"
        >
          <option value="ALL">All Physicians ({physicians.length})</option>
          {physicians.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.role})
            </option>
          ))}
        </select>

        {/* Shift Type Filter */}
        <select
          id="filter-shift-type"
          value={selectedShiftTypeFilter}
          onChange={(e) => setSelectedShiftTypeFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 font-medium"
        >
          <option value="ALL">All Call Types</option>
          {Object.values(SHIFT_DEFINITIONS).map((def) => (
            <option key={def.type} value={def.type}>
              {def.label}
            </option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          id="filter-role"
          value={selectedRoleFilter}
          onChange={(e) => setSelectedRoleFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 font-medium"
        >
          <option value="ALL">All Clinical Ranks</option>
          <option value="Attending">Attending Faculty</option>
          <option value="Fellow">Clinical Fellows</option>
          <option value="Senior Resident">Senior Residents (PGY-3+)</option>
          <option value="Junior Resident">Junior Residents (PGY-2)</option>
        </select>

        {/* Conflict / Uncovered Toggle */}
        <button
          id="toggle-conflict-filter"
          onClick={() => setShowConflictsOnly(!showConflictsOnly)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-semibold transition-all ${
            showConflictsOnly
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Issues Only ({conflicts.length})</span>
        </button>
      </div>

      {/* VIEW 1: MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold text-center">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
              <div key={d} className={`py-2.5 ${i === 0 || i === 6 ? 'text-amber-400/90 bg-amber-950/10' : ''}`}>
                <span className="hidden md:inline">{d}</span>
                <span className="md:hidden">{d.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Month Cells Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80 bg-slate-950/40">
            {calendarDays.map((cell) => {
              const dayShifts = shiftsByDate.get(cell.dateStr) || [];
              const hasUncovered = dayShifts.some((s) => !s.physicianId);
              const dayConflicts = conflicts.filter((c) => c.date === cell.dateStr);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    setSelectedDayDate(cell.dateStr);
                  }}
                  className={`min-h-[125px] sm:min-h-[145px] p-1.5 sm:p-2 transition-all flex flex-col justify-between group relative ${
                    cell.isCurrentMonth
                      ? cell.isWeekend
                        ? 'bg-slate-900/40 hover:bg-slate-800/40'
                        : 'bg-slate-900/80 hover:bg-slate-800/60'
                      : 'bg-slate-950/70 opacity-40 hover:opacity-75'
                  } ${cell.isToday ? 'ring-1 ring-blue-500/80 bg-blue-950/20' : ''}`}
                >
                  {/* Cell Header: Date Number + Holiday + Conflict Alert */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                          cell.isToday
                            ? 'bg-blue-600 text-white shadow-sm'
                            : cell.isWeekend
                            ? 'text-amber-300 font-semibold'
                            : 'text-slate-300'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {cell.holidayName && (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 truncate max-w-[85px] sm:max-w-[120px]"
                          title={cell.holidayName}
                        >
                          🎉 {cell.holidayName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      {dayConflicts.length > 0 && (
                        <span
                          className="p-0.5 rounded text-rose-400 bg-rose-500/10 border border-rose-500/20"
                          title={dayConflicts.map((c) => c.message).join('\n')}
                        >
                          <AlertCircle className="w-3 h-3" />
                        </span>
                      )}
                      {/* Plus button to add shift to this day */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewShiftDate(cell.dateStr);
                          setIsAddModalOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-opacity"
                        title="Add shift on this date"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Shift Badges in Day */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[110px] scrollbar-none">
                    {dayShifts.map((shift) => {
                      const doc = shift.physicianId ? physicianMap.get(shift.physicianId) : null;
                      const def = SHIFT_DEFINITIONS[shift.type];
                      const shiftConflict = conflictShiftIdMap.get(shift.id);

                      return (
                        <div
                          key={shift.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveShift(shift);
                          }}
                          className={`px-1.5 py-1 rounded-md border text-[11px] font-medium cursor-pointer transition-all flex items-center justify-between group/shift shadow-sm ${
                            shift.physicianId
                              ? `${def?.color?.bg} ${def?.color?.border} ${def?.color?.text}`
                              : 'bg-rose-950/60 border-rose-600/60 text-rose-300 animate-pulse'
                          } ${shiftConflict ? 'ring-1 ring-rose-500' : ''}`}
                        >
                          <div className="flex items-center space-x-1 truncate">
                            <span className="font-bold text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-200">
                              {def?.shortCode || shift.type}
                            </span>
                            <span className="truncate font-semibold text-slate-100">
                              {doc ? doc.name.replace('Dr. ', '') : '⚠️ UNCOVERED'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 opacity-80 group-hover/shift:opacity-100">
                            {shift.status === 'PENDING_SWAP' && (
                              <ArrowLeftRight className="w-3 h-3 text-amber-400" title="Pending Swap" />
                            )}
                            {doc?.role && (
                              <span className="text-[8px] text-slate-300 font-mono hidden xl:inline">
                                {doc.role === 'Senior Resident' ? 'SR' : doc.role === 'Junior Resident' ? 'JR' : doc.role.slice(0, 3)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {dayShifts.length === 0 && cell.isCurrentMonth && (
                      <div className="text-[10px] text-slate-600 italic text-center py-2">
                        No calls scheduled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK ROSTER VIEW */}
      {viewMode === 'week' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-blue-400" />
              Weekly Clinical Duty Roster
            </h3>
            <span className="text-xs text-slate-400">
              Complete on-call rotation grid with hours & handover notes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {calendarDays.slice(0, 7).map((cell, idx) => {
              // Get shifts for this weekday across the month
              const dayShifts = shifts.filter((s) => {
                const d = new Date(s.date);
                return d.getDay() === idx && s.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
              });

              return (
                <div key={cell.dateStr} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-bold text-slate-200">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx]}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {dayShifts.length} Calls
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-none">
                    {dayShifts.map((shift) => {
                      const doc = shift.physicianId ? physicianMap.get(shift.physicianId) : null;
                      const def = SHIFT_DEFINITIONS[shift.type];

                      return (
                        <div
                          key={shift.id}
                          onClick={() => setActiveShift(shift)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.02] ${
                            shift.physicianId
                              ? `${def?.color?.bg} ${def?.color?.border} ${def?.color?.text}`
                              : 'bg-rose-950/80 border-rose-600 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-200">
                              {shift.date.slice(5)} • {def?.shortCode}
                            </span>
                            <span className="text-[10px] text-slate-300">
                              {def?.startTime} - {def?.endTime}
                            </span>
                          </div>

                          <div className="font-semibold text-white truncate">
                            {doc ? doc.name : '⚠️ UNCOVERED'}
                          </div>
                          {doc && (
                            <div className="text-[10px] text-slate-300 truncate">
                              {doc.role} • {doc.specialty}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: DAILY CALL BOARD */}
      {viewMode === 'day' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">
                  Daily Clinical Call Board: {formatFriendlyDate(selectedDayDate)}
                </h3>
                {RECOGNIZED_HOLIDAYS[selectedDayDate] && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {RECOGNIZED_HOLIDAYS[selectedDayDate]}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time physician handover contact roster & acute response directory
              </p>
            </div>

            {/* Date selector for day view */}
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400 font-medium">Select Date:</label>
              <input
                type="date"
                value={selectedDayDate}
                onChange={(e) => setSelectedDayDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Shifts on this selected date */}
          {(() => {
            const dayShifts = shifts.filter((s) => s.date === selectedDayDate);

            if (dayShifts.length === 0) {
              return (
                <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No shifts scheduled for this date</p>
                  <p className="text-xs text-slate-500 mt-1">Use the "Add Shift Slot" or Auto-Rotation engine to schedule coverage.</p>
                  <button
                    onClick={() => {
                      setNewShiftDate(selectedDayDate);
                      setIsAddModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    Add Shift for {formatFriendlyDate(selectedDayDate)}
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dayShifts.map((shift) => {
                  const doc = shift.physicianId ? physicianMap.get(shift.physicianId) : null;
                  const def = SHIFT_DEFINITIONS[shift.type];

                  return (
                    <div
                      key={shift.id}
                      className={`rounded-xl border p-4 shadow-md transition-all flex flex-col justify-between ${
                        shift.physicianId
                          ? `${def?.color?.bg} ${def?.color?.border}`
                          : 'bg-rose-950/60 border-rose-600/80 ring-1 ring-rose-500'
                      }`}
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${def?.color?.badge}`}>
                            {def?.label}
                          </span>
                          <span className="text-xs font-mono text-slate-300">
                            {def?.startTime} → {def?.endTime}
                          </span>
                        </div>

                        {/* Physician Contact Block */}
                        {doc ? (
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${doc.avatarColor} flex items-center justify-center font-bold text-white text-sm shadow-md`}>
                                {doc.name.split(' ').map((n) => n[0]).join('')}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm">{doc.name}</h4>
                                <p className="text-xs text-slate-300 font-medium">
                                  {doc.role} • {doc.specialty}
                                </p>
                              </div>
                            </div>

                            <div className="bg-black/30 rounded-lg p-2.5 space-y-1 text-xs text-slate-300 font-mono">
                              <div className="flex items-center space-x-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{doc.phone}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate">{doc.email}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-rose-900/30 border border-rose-500/40 rounded-lg p-3 text-center my-3">
                            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto mb-1" />
                            <p className="text-xs font-bold text-rose-200">CRITICAL: Uncovered Duty Slot</p>
                            <p className="text-[11px] text-rose-300 mt-0.5">Please assign an on-call clinician immediately.</p>
                          </div>
                        )}

                        <p className="text-xs text-slate-400 italic mb-3">
                          {def?.description}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 pt-3 border-t border-slate-700/60">
                        <button
                          onClick={() => setActiveShift(shift)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                        >
                          Edit / Reassign
                        </button>
                        {shift.physicianId && (
                          <button
                            onClick={() => handleTriggerSwap(shift)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Swap</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW 4: TIMELINE / PHYSICIAN GANTT VIEW */}
      {viewMode === 'timeline' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Monthly Rotation Timeline by Physician
              </h3>
              <p className="text-xs text-slate-400">
                Visual timeline showing duty shifts and approved blackout leaves
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Primary
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Backup
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Night Float
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60 border border-rose-400"></span> Blackout / Leave
              </span>
            </div>
          </div>

          <div className="min-w-[900px]">
            {/* Timeline Header with Day numbers */}
            <div className="grid grid-cols-[200px_repeat(31,1fr)] gap-1 pb-2 border-b border-slate-800 text-center text-xs font-semibold text-slate-400">
              <div className="text-left pl-2">Physician / Role</div>
              {Array.from({ length: new Date(year, month + 1, 0).getDate() }).map((_, i) => {
                const dayStr = String(i + 1).padStart(2, '0');
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${dayStr}`;
                const isW = isWeekendDate(dateStr);
                return (
                  <div key={i} className={`py-1 rounded ${isW ? 'text-amber-400 bg-amber-950/20' : ''}`}>
                    {i + 1}
                  </div>
                );
              })}
            </div>

            {/* Rows for each physician */}
            <div className="divide-y divide-slate-800/80">
              {physicians.map((physician) => {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const docShifts = shifts.filter(
                  (s) => s.physicianId === physician.id && s.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
                );

                return (
                  <div key={physician.id} className="grid grid-cols-[200px_repeat(31,1fr)] gap-1 py-2 items-center hover:bg-slate-800/30 transition-colors">
                    {/* Physician Name & Role */}
                    <div className="flex items-center space-x-2 pl-2 truncate pr-2">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${physician.avatarColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                        {physician.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-200 truncate">{physician.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{physician.role}</div>
                      </div>
                    </div>

                    {/* Day Slots */}
                    {Array.from({ length: 31 }).map((_, i) => {
                      if (i >= daysInMonth) {
                        return <div key={i} className="h-7 bg-slate-950/40 rounded"></div>;
                      }

                      const dayStr = String(i + 1).padStart(2, '0');
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${dayStr}`;
                      const shift = docShifts.find((s) => s.date === dateStr);
                      const isBlackout = physician.blackoutDates?.includes(dateStr);
                      const def = shift ? SHIFT_DEFINITIONS[shift.type] : null;

                      if (shift) {
                        return (
                          <div
                            key={i}
                            onClick={() => setActiveShift(shift)}
                            className={`h-7 rounded flex items-center justify-center text-[9px] font-bold cursor-pointer transition-transform hover:scale-110 shadow-sm ${def?.color?.bg} ${def?.color?.border} ${def?.color?.text}`}
                            title={`${shift.type} on ${dateStr}`}
                          >
                            {def?.shortCode}
                          </div>
                        );
                      }

                      if (isBlackout) {
                        return (
                          <div
                            key={i}
                            className="h-7 rounded bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-[9px] font-bold text-rose-300"
                            title={`Blackout Leave: ${physician.blackoutReasons?.[dateStr] || 'Requested Off'}`}
                          >
                            OFF
                          </div>
                        );
                      }

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            setNewShiftDate(dateStr);
                            setNewShiftPhysicianId(physician.id);
                            setIsAddModalOpen(true);
                          }}
                          className="h-7 rounded border border-transparent hover:border-slate-700/60 hover:bg-slate-800/40 cursor-pointer"
                        ></div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SHIFT DETAILS & REASSIGN MODAL */}
      {activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Shift Inspector</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  {SHIFT_DEFINITIONS[activeShift.type]?.label || activeShift.type}
                </h3>
              </div>
              <button
                onClick={() => setActiveShift(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Date and Time Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Date</span>
                  <span className="font-semibold text-slate-200 text-sm">{formatFriendlyDate(activeShift.date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Shift Hours</span>
                  <span className="font-semibold text-slate-200 text-sm">
                    {SHIFT_DEFINITIONS[activeShift.type]?.startTime} - {SHIFT_DEFINITIONS[activeShift.type]?.endTime}
                  </span>
                </div>
              </div>

              {/* Physician Assignment */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Assigned Clinician</label>
                <select
                  value={activeShift.physicianId || ''}
                  onChange={(e) => {
                    const newId = e.target.value || null;
                    handleUpdateShift({
                      ...activeShift,
                      physicianId: newId,
                      status: newId ? 'CONFIRMED' : 'UNCOVERED',
                      updatedAt: new Date().toISOString(),
                    });
                    setActiveShift({
                      ...activeShift,
                      physicianId: newId,
                      status: newId ? 'CONFIRMED' : 'UNCOVERED',
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">-- UNCOVERED / OPEN SLOT --</option>
                  {physicians.map((p) => {
                    const isBlackout = p.blackoutDates?.includes(activeShift.date);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role}) {isBlackout ? '⚠️ ON BLACKOUT LEAVE' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Shift Category */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Shift Duty Type</label>
                <select
                  value={activeShift.type}
                  onChange={(e) => {
                    const newType = e.target.value as ShiftCategory;
                    handleUpdateShift({
                      ...activeShift,
                      type: newType,
                      updatedAt: new Date().toISOString(),
                    });
                    setActiveShift({ ...activeShift, type: newType });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                >
                  {Object.values(SHIFT_DEFINITIONS).map((def) => (
                    <option key={def.type} value={def.type}>
                      {def.label} ({def.durationHours} hrs)
                    </option>
                  ))}
                </select>
              </div>

              {/* Handover Notes */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Clinical Handover / Shift Notes</label>
                <textarea
                  value={activeShift.notes || ''}
                  onChange={(e) => {
                    const newNotes = e.target.value;
                    handleUpdateShift({
                      ...activeShift,
                      notes: newNotes,
                      updatedAt: new Date().toISOString(),
                    });
                    setActiveShift({ ...activeShift, notes: newNotes });
                  }}
                  placeholder="e.g. ICU Bed #4 pending bedside thoracentesis, Trauma code backup coverage..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>

              {/* Associated Conflicts */}
              {conflictShiftIdMap.get(activeShift.id) && (
                <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 space-y-1">
                  <div className="flex items-center space-x-1.5 text-rose-300 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Rule Conflicts Detected</span>
                  </div>
                  {conflictShiftIdMap.get(activeShift.id)!.map((c) => (
                    <p key={c.id} className="text-[11px] text-rose-200">
                      • {c.message}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onDeleteShift(activeShift.id);
                  setActiveShift(null);
                }}
                className="px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
              >
                Delete Slot
              </button>

              <div className="flex items-center space-x-2">
                {activeShift.physicianId && (
                  <button
                    onClick={() => {
                      handleTriggerSwap(activeShift);
                      setActiveShift(null);
                    }}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Initiate Swap</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveShift(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW SHIFT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Add Shift Slot to Roster
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={newShiftDate}
                  onChange={(e) => setNewShiftDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Shift Duty Type</label>
                <select
                  value={newShiftType}
                  onChange={(e) => setNewShiftType(e.target.value as ShiftCategory)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-medium"
                >
                  {Object.values(SHIFT_DEFINITIONS).map((def) => (
                    <option key={def.type} value={def.type}>
                      {def.label} ({def.startTime} - {def.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Assign Clinician (Optional)</label>
                <select
                  value={newShiftPhysicianId}
                  onChange={(e) => setNewShiftPhysicianId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">Leave Uncovered (Assign later)</option>
                  {physicians.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role} - {p.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Special Handover Instructions</label>
                <textarea
                  value={newShiftNotes}
                  onChange={(e) => setNewShiftNotes(e.target.value)}
                  placeholder="e.g. Inpatient code leader, cardiac arrest pager holder..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Create Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
