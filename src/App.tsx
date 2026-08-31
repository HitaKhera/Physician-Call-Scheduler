import React, { useState, useMemo, useEffect } from 'react';
import { 
  MOCK_PHYSICIANS, 
  MOCK_SHIFTS, 
  MOCK_SWAP_REQUESTS, 
  DEFAULT_SCHEDULING_RULES 
} from './data/mockData';
import { 
  Physician, 
  Shift, 
  ShiftSwapRequest, 
  SchedulingRules, 
  TabType, 
  ShiftType 
} from './types';
import { detectScheduleConflicts } from './utils/schedulerEngine';
import { Header } from './components/Header';
import { CalendarDashboard } from './components/CalendarDashboard';
import { AutoRotationEngine } from './components/AutoRotationEngine';
import { RosterManager } from './components/RosterManager';
import { ShiftSwapModule } from './components/ShiftSwapModule';
import { FairnessAnalytics } from './components/FairnessAnalytics';
import { ScheduleAnnouncementModal } from './components/ScheduleAnnouncementModal';

export default function App() {
  // Navigation & Date State
  const [activeTab, setActiveTab] = useState<TabType>('CALENDAR');
  // Default to September 2026 (the active schedule dataset month)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 1));
  
  // Core Data State
  const [physicians, setPhysicians] = useState<Physician[]>(() => {
    const saved = localStorage.getItem('physician_call_roster');
    return saved ? JSON.parse(saved) : MOCK_PHYSICIANS;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('physician_call_shifts');
    return saved ? JSON.parse(saved) : MOCK_SHIFTS;
  });

  const [rules, setRules] = useState<SchedulingRules>(() => {
    const saved = localStorage.getItem('physician_call_rules');
    return saved ? JSON.parse(saved) : DEFAULT_SCHEDULING_RULES;
  });

  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>(() => {
    const saved = localStorage.getItem('physician_call_swaps');
    return saved ? JSON.parse(saved) : MOCK_SWAP_REQUESTS;
  });

  // Modals & Sub-state
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState<boolean>(false);
  const [swapPreselectedShift, setSwapPreselectedShift] = useState<Shift | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('physician_call_roster', JSON.stringify(physicians));
  }, [physicians]);

  useEffect(() => {
    localStorage.setItem('physician_call_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('physician_call_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('physician_call_swaps', JSON.stringify(swapRequests));
  }, [swapRequests]);

  // Compute live conflicts across all active shifts and rules
  const conflicts = useMemo(() => {
    return detectScheduleConflicts(shifts, physicians, rules);
  }, [shifts, physicians, rules]);

  // Handlers for Shifts
  const handleAssignShift = (shiftId: string, physicianId: string | null) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === shiftId ? { ...s, physicianId, status: 'CONFIRMED' } : s))
    );
  };

  const handleCreateShift = (date: string, type: ShiftType, physicianId: string | null, notes?: string) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date,
      type,
      physicianId,
      status: physicianId ? 'CONFIRMED' : 'UNCOVERED',
      notes,
    };
    setShifts((prev) => [...prev, newShift]);
  };

  const handleDeleteShift = (shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
  };

  const handleApplyGeneratedSchedule = (newShifts: Shift[]) => {
    setShifts(newShifts);
    setActiveTab('CALENDAR');
  };

  // Handlers for Physicians
  const handleAddPhysician = (newPhysician: Physician) => {
    setPhysicians((prev) => [...prev, newPhysician]);
  };

  const handleUpdatePhysician = (updatedPhysician: Physician) => {
    setPhysicians((prev) =>
      prev.map((p) => (p.id === updatedPhysician.id ? updatedPhysician : p))
    );
  };

  const handleDeletePhysician = (physicianId: string) => {
    setPhysicians((prev) => prev.filter((p) => p.id !== physicianId));
    // Unassign shifts belonging to deleted doc
    setShifts((prev) =>
      prev.map((s) => (s.physicianId === physicianId ? { ...s, physicianId: null, status: 'UNCOVERED' } : s))
    );
  };

  // Handlers for Swaps
  const handleApproveSwap = (swapId: string, chiefNotes?: string) => {
    const swap = swapRequests.find((s) => s.id === swapId);
    if (!swap) return;

    // Execute the shift exchange
    setShifts((prev) => {
      return prev.map((shift) => {
        // The requesting physician's shift is reassigned to target physician
        if (shift.id === swap.requestingShiftId && swap.targetPhysicianId) {
          return { ...shift, physicianId: swap.targetPhysicianId, status: 'CONFIRMED' };
        }
        // If target had a return shift, reassign to requesting physician
        if (swap.targetShiftId && shift.id === swap.targetShiftId) {
          return { ...shift, physicianId: swap.requestingPhysicianId, status: 'CONFIRMED' };
        }
        return shift;
      });
    });

    setSwapRequests((prev) =>
      prev.map((s) =>
        s.id === swapId
          ? { ...s, status: 'APPROVED', chiefNotes, resolvedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const handleDenySwap = (swapId: string, chiefNotes?: string) => {
    setSwapRequests((prev) =>
      prev.map((s) =>
        s.id === swapId
          ? { ...s, status: 'DENIED', chiefNotes, resolvedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const handleCreateSwapRequest = (newSwap: Omit<ShiftSwapRequest, 'id' | 'createdAt'>) => {
    const swapEntry: ShiftSwapRequest = {
      ...newSwap,
      id: `swap-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSwapRequests((prev) => [swapEntry, ...prev]);
  };

  const handleTriggerSwapFromShift = (shift: Shift) => {
    setSwapPreselectedShift(shift);
    setActiveTab('SWAPS');
  };

  // Exports
  const handleExportCSV = () => {
    const phyMap = new Map<string, Physician>(physicians.map((p) => [p.id, p]));
    const headers = ['Shift ID', 'Date', 'Shift Type', 'Assigned Physician', 'Role', 'Status', 'Notes'];
    const rows = shifts.map((s) => {
      const doc = s.physicianId ? phyMap.get(s.physicianId) : null;
      return [
        s.id,
        s.date,
        s.type,
        doc ? `"${doc.name}"` : 'Unassigned',
        doc ? doc.role : 'N/A',
        s.status,
        `"${s.notes || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `physician_call_schedule_${currentDate.toISOString().slice(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportICS = () => {
    const phyMap = new Map<string, Physician>(physicians.map((p) => [p.id, p]));
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Department of Medicine//Physician Call Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    shifts.forEach((s) => {
      if (!s.physicianId) return;
      const doc = phyMap.get(s.physicianId);
      const cleanDate = s.date.replace(/-/g, '');
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${s.id}@hospital.org`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `SUMMARY:On-Call: ${s.type.replace(/_/g, ' ')} - ${doc ? doc.name : 'Staff'}`,
        `DESCRIPTION:Physician Call Duty: ${s.type}\\nPhysician: ${doc ? doc.name : 'Staff'}\\nPhone: ${doc ? doc.phone : 'Hospital Operator'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `call_rotation_${currentDate.toISOString().slice(0, 7)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header & Global Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingSwapsCount={(swapRequests || []).filter((s) => s.status === 'PENDING_CHIEF').length}
        conflicts={conflicts}
        activeConflictsCount={conflicts.length}
        onOpenAnnouncements={() => setIsAnnouncementModalOpen(true)}
        onOpenAIAssistant={() => setIsAnnouncementModalOpen(true)}
        onExportCSV={handleExportCSV}
        onExportICS={handleExportICS}
        onPrint={() => window.print()}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'CALENDAR' && (
          <CalendarDashboard
            shifts={shifts}
            physicians={physicians}
            conflicts={conflicts}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onAssignShift={handleAssignShift}
            onCreateShift={handleCreateShift}
            onDeleteShift={handleDeleteShift}
            onTriggerSwap={handleTriggerSwapFromShift}
            onOpenEngine={() => setActiveTab('ENGINE')}
          />
        )}

        {activeTab === 'ENGINE' && (
          <AutoRotationEngine
            shifts={shifts}
            physicians={physicians}
            rules={rules}
            onUpdateRules={setRules}
            currentDate={currentDate}
            onApplyGeneratedSchedule={handleApplyGeneratedSchedule}
          />
        )}

        {activeTab === 'ROSTER' && (
          <RosterManager
            physicians={physicians}
            shifts={shifts}
            currentDate={currentDate}
            onAddPhysician={handleAddPhysician}
            onUpdatePhysician={handleUpdatePhysician}
            onDeletePhysician={handleDeletePhysician}
          />
        )}

        {activeTab === 'SWAPS' && (
          <ShiftSwapModule
            swapRequests={swapRequests}
            shifts={shifts}
            physicians={physicians}
            onApproveSwap={handleApproveSwap}
            onDenySwap={handleDenySwap}
            onCreateSwapRequest={handleCreateSwapRequest}
            initialPreselectedShift={swapPreselectedShift}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <FairnessAnalytics
            shifts={shifts}
            physicians={physicians}
            currentDate={currentDate}
          />
        )}
      </main>

      {/* Footer Notice */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Physician Call Scheduler • ACGME Work-Hour Compliant Rotation Engine • For Clinical Departmental Operations
        </p>
      </footer>

      {/* Broadcast Announcement Modal */}
      <ScheduleAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        shifts={shifts}
        physicians={physicians}
        currentDate={currentDate}
      />
    </div>
  );
}
