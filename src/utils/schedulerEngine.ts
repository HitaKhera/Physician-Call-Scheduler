import { 
  Physician, 
  Shift, 
  ShiftCategory, 
  SchedulingRules, 
  ScheduleConflict, 
  PhysicianWorkload,
  ScheduleAuditReport
} from '../types';
import { SHIFT_DEFINITIONS, RECOGNIZED_HOLIDAYS } from '../data/mockData';

// Helper to get all dates in a month formatted as YYYY-MM-DD
export function getDaysInMonthArray(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = String(i).padStart(2, '0');
    const mStr = String(month + 1).padStart(2, '0');
    dates.push(`${year}-${mStr}-${dStr}`);
  }
  return dates;
}

// Checks if a given date string is a weekend (Saturday or Sunday)
export function isWeekendDate(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Format date into human friendly string e.g. "Mon, Sep 14"
export function formatFriendlyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Real-Time Conflict Detection Engine
export function detectScheduleConflicts(
  shifts: Shift[],
  physicians: Physician[],
  rules: SchedulingRules
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const physicianMap = new Map(physicians.map((p) => [p.id, p]));

  // Group shifts by date and by physician
  const shiftsByDate = new Map<string, Shift[]>();
  const shiftsByPhysician = new Map<string, Shift[]>();

  for (const shift of shifts) {
    if (!shiftsByDate.has(shift.date)) {
      shiftsByDate.set(shift.date, []);
    }
    shiftsByDate.get(shift.date)!.push(shift);

    if (shift.physicianId) {
      if (!shiftsByPhysician.has(shift.physicianId)) {
        shiftsByPhysician.set(shift.physicianId, []);
      }
      shiftsByPhysician.get(shift.physicianId)!.push(shift);
    } else {
      // Uncovered slot warning
      conflicts.push({
        id: `uncovered-${shift.id}`,
        type: 'UNCOVERED_SLOT',
        shiftId: shift.id,
        physicianId: null,
        date: shift.date,
        severity: 'CRITICAL',
        message: `Uncovered ${SHIFT_DEFINITIONS[shift.type]?.label || shift.type} on ${formatFriendlyDate(shift.date)}`,
        suggestedFix: 'Assign an eligible clinician to maintain department coverage minimums.',
      });
    }
  }

  // 1. Check double bookings on the same date
  for (const [date, dayShifts] of shiftsByDate.entries()) {
    const assignedDocs = new Map<string, Shift[]>();
    for (const shift of dayShifts) {
      if (shift.physicianId) {
        if (!assignedDocs.has(shift.physicianId)) {
          assignedDocs.set(shift.physicianId, []);
        }
        assignedDocs.get(shift.physicianId)!.push(shift);
      }
    }

    for (const [physicianId, docShifts] of assignedDocs.entries()) {
      if (docShifts.length > 1) {
        const doc = physicianMap.get(physicianId);
        // If primary call + night float or 2 heavy calls, flag critical double-booking
        const primaryCount = docShifts.filter(s => s.type === 'PRIMARY_CALL' || s.type === 'NIGHT_FLOAT' || s.type === 'TRAUMA_CALL').length;
        if (primaryCount > 1) {
          conflicts.push({
            id: `dbl-${physicianId}-${date}`,
            type: 'DOUBLE_BOOKING',
            shiftId: docShifts[0].id,
            physicianId,
            date,
            severity: 'CRITICAL',
            message: `${doc?.name || 'Physician'} has ${docShifts.length} overlapping call duties on ${formatFriendlyDate(date)} (${docShifts.map(s => SHIFT_DEFINITIONS[s.type]?.shortCode).join(', ')})`,
            suggestedFix: 'Reassign one of the simultaneous shifts to an available peer.',
          });
        }
      }
    }
  }

  // 2. Check Physician Blackouts & Rules
  for (const physician of physicians) {
    const docShifts = (shiftsByPhysician.get(physician.id) || []).sort((a, b) => a.date.localeCompare(b.date));

    // A. Blackout Dates Violation
    if (rules.honorBlackoutsStrictly) {
      for (const shift of docShifts) {
        if (physician.blackoutDates?.includes(shift.date)) {
          const reason = physician.blackoutReasons?.[shift.date] || 'Pre-requested Leave';
          conflicts.push({
            id: `blackout-${shift.id}`,
            type: 'BLACKOUT_VIOLATION',
            shiftId: shift.id,
            physicianId: physician.id,
            date: shift.date,
            severity: 'CRITICAL',
            message: `${physician.name} is scheduled on a requested blackout date (${formatFriendlyDate(shift.date)} - ${reason})`,
            suggestedFix: 'Swap shift with an available colleague without scheduled leave.',
          });
        }
      }
    }

    // B. Back-to-Back Primary Call Violation
    if (rules.noBackToBackPrimary) {
      const primaryShifts = docShifts.filter((s) => s.type === 'PRIMARY_CALL');
      for (let i = 0; i < primaryShifts.length - 1; i++) {
        const currDate = new Date(primaryShifts[i].date);
        const nextDate = new Date(primaryShifts[i + 1].date);
        const diffDays = Math.round((nextDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          conflicts.push({
            id: `b2b-${primaryShifts[i + 1].id}`,
            type: 'BACK_TO_BACK',
            shiftId: primaryShifts[i + 1].id,
            physicianId: physician.id,
            date: primaryShifts[i + 1].date,
            severity: 'CRITICAL',
            message: `${physician.name} has back-to-back 24h Primary Call on ${formatFriendlyDate(primaryShifts[i].date)} and ${formatFriendlyDate(primaryShifts[i + 1].date)} (violates 24h rest rule)`,
            suggestedFix: 'Separate shifts by at least 48 hours to prevent severe cognitive fatigue.',
          });
        }
      }
    }

    // C. Consecutive Night Floats Exceeded
    const nightShifts = docShifts.filter((s) => s.type === 'NIGHT_FLOAT');
    let consecutiveCount = 1;
    for (let i = 0; i < nightShifts.length - 1; i++) {
      const currDate = new Date(nightShifts[i].date);
      const nextDate = new Date(nightShifts[i + 1].date);
      const diffDays = Math.round((nextDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        consecutiveCount++;
        if (consecutiveCount > rules.maxConsecutiveNights) {
          conflicts.push({
            id: `consec-night-${nightShifts[i + 1].id}`,
            type: 'CONSECUTIVE_NIGHTS_EXCEEDED',
            shiftId: nightShifts[i + 1].id,
            physicianId: physician.id,
            date: nightShifts[i + 1].date,
            severity: 'WARNING',
            message: `${physician.name} exceeds max consecutive nights limit (${consecutiveCount} nights in a row, max allowed: ${rules.maxConsecutiveNights})`,
            suggestedFix: 'Insert a rest transition or alternate with another resident.',
          });
        }
      } else {
        consecutiveCount = 1;
      }
    }

    // D. Max Shifts per Month Exceeded
    if (rules.maxShiftsPerMonthHardCap) {
      if (docShifts.length > physician.maxShiftsPerMonth) {
        conflicts.push({
          id: `max-shifts-${physician.id}`,
          type: 'MAX_SHIFTS_EXCEEDED',
          shiftId: docShifts[docShifts.length - 1].id,
          physicianId: physician.id,
          date: docShifts[docShifts.length - 1].date,
          severity: 'WARNING',
          message: `${physician.name} assigned ${docShifts.length} shifts (exceeds monthly quota of ${physician.maxShiftsPerMonth})`,
          suggestedFix: 'Redistribute excess call shifts to physicians under quota.',
        });
      }
    }
  }

  return conflicts;
}

// Workload and Equity Analytics Calculator
export function calculatePhysicianWorkloads(
  shifts: Shift[],
  physicians: Physician[],
  year: number,
  month: number
): PhysicianWorkload[] {
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthShifts = shifts.filter((s) => s.date.startsWith(monthStr));

  return physicians.map((physician) => {
    const docShifts = monthShifts.filter((s) => s.physicianId === physician.id);
    
    let totalHours = 0;
    let weekdayCalls = 0;
    let weekendCalls = 0;
    let holidayCalls = 0;
    let nightFloatCalls = 0;
    let backupCalls = 0;
    let totalWeight = 0;

    for (const shift of docShifts) {
      const def = SHIFT_DEFINITIONS[shift.type];
      totalHours += def?.durationHours || 12;
      totalWeight += def?.weight || 1.0;

      const isWeekend = isWeekendDate(shift.date);
      if (isWeekend) weekendCalls++;
      else weekdayCalls++;

      if (shift.isHoliday) holidayCalls++;
      if (shift.type === 'NIGHT_FLOAT') nightFloatCalls++;
      if (shift.type === 'BACKUP_CALL') backupCalls++;
    }

    const quotaPercentage = Math.round((docShifts.length / (physician.maxShiftsPerMonth || 1)) * 100);
    // Normalized equity score based on FTE & weight
    const expectedWeight = (physician.fte || 1.0) * 15;
    const equityScore = Math.min(100, Math.max(0, Math.round(100 - Math.abs(totalWeight - expectedWeight) * 4)));

    return {
      physicianId: physician.id,
      physician,
      totalShifts: docShifts.length,
      totalHours,
      weekdayCalls,
      weekendCalls,
      holidayCalls,
      nightFloatCalls,
      backupCalls,
      quotaPercentage,
      equityScore,
      hasConflicts: false,
    };
  });
}

// Deterministic Rotation Solver (Constraint Satisfier)
export function runDeterministicScheduleSolver(
  existingShifts: Shift[],
  physicians: Physician[],
  year: number,
  month: number,
  rules: SchedulingRules,
  fillOnlyUncovered: boolean = false
): { updatedShifts: Shift[]; generatedCount: number; resolvedConflictCount: number } {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Clone or build base shift slots for the month
  let schedule: Shift[] = [];

  if (fillOnlyUncovered) {
    schedule = existingShifts.map((s) => ({ ...s }));
  } else {
    // Generate fresh required slots for the entire month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${monthPrefix}-${dayStr}`;
      const isWeekend = isWeekendDate(dateStr);
      const isHoliday = !!RECOGNIZED_HOLIDAYS[dateStr];
      const holidayName = RECOGNIZED_HOLIDAYS[dateStr];

      // Daily Primary Call
      schedule.push({
        id: `shift-pri-${dateStr}`,
        date: dateStr,
        type: 'PRIMARY_CALL',
        physicianId: null,
        status: 'UNCOVERED',
        isHoliday,
        holidayName,
        updatedAt: new Date().toISOString(),
      });

      // Daily Backup Call
      schedule.push({
        id: `shift-bak-${dateStr}`,
        date: dateStr,
        type: 'BACKUP_CALL',
        physicianId: null,
        status: 'UNCOVERED',
        isHoliday,
        holidayName,
        updatedAt: new Date().toISOString(),
      });

      // Daily Night Float
      schedule.push({
        id: `shift-nft-${dateStr}`,
        date: dateStr,
        type: 'NIGHT_FLOAT',
        physicianId: null,
        status: 'UNCOVERED',
        isHoliday,
        holidayName,
        updatedAt: new Date().toISOString(),
      });

      // Weekend Rounds
      if (isWeekend) {
        schedule.push({
          id: `shift-wnd-${dateStr}`,
          date: dateStr,
          type: 'WEEKEND_ROUND',
          physicianId: null,
          status: 'UNCOVERED',
          isHoliday,
          holidayName,
          updatedAt: new Date().toISOString(),
        });
      }

      // Trauma Call (Fri, Sat, Holiday)
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6 || isHoliday) {
        schedule.push({
          id: `shift-trm-${dateStr}`,
          date: dateStr,
          type: 'TRAUMA_CALL',
          physicianId: null,
          status: 'UNCOVERED',
          isHoliday,
          holidayName,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Physician shift counters to maintain balance
  const shiftCounts = new Map<string, number>();
  const weekendCounts = new Map<string, number>();
  const holidayCounts = new Map<string, number>();
  const lastAssignedDate = new Map<string, string>();

  for (const p of physicians) {
    shiftCounts.set(p.id, 0);
    weekendCounts.set(p.id, 0);
    holidayCounts.set(p.id, 0);
  }

  // Tally already locked shifts if filling uncovered
  if (fillOnlyUncovered) {
    for (const s of schedule) {
      if (s.physicianId) {
        shiftCounts.set(s.physicianId, (shiftCounts.get(s.physicianId) || 0) + 1);
        if (isWeekendDate(s.date)) {
          weekendCounts.set(s.physicianId, (weekendCounts.get(s.physicianId) || 0) + 1);
        }
        if (s.isHoliday) {
          holidayCounts.set(s.physicianId, (holidayCounts.get(s.physicianId) || 0) + 1);
        }
        lastAssignedDate.set(s.physicianId, s.date);
      }
    }
  }

  let filledCount = 0;

  // Sort shifts chronologically by date
  schedule.sort((a, b) => a.date.localeCompare(b.date));

  for (const shift of schedule) {
    if (shift.physicianId) continue; // already assigned

    const shiftDef = SHIFT_DEFINITIONS[shift.type];
    const isWeekend = isWeekendDate(shift.date);
    const isHoliday = !!shift.isHoliday;

    // Filter eligible physicians
    const eligiblePhysicians = physicians.filter((p) => {
      // 1. Role requirements
      if (shiftDef.requiredRoles && !shiftDef.requiredRoles.includes(p.role)) {
        return false;
      }

      // 2. Blackout dates
      if (rules.honorBlackoutsStrictly && p.blackoutDates?.includes(shift.date)) {
        return false;
      }

      // 3. Max shifts cap
      if (rules.maxShiftsPerMonthHardCap && (shiftCounts.get(p.id) || 0) >= p.maxShiftsPerMonth) {
        return false;
      }

      // 4. Max weekend shifts cap
      if (isWeekend && rules.balanceWeekends && (weekendCounts.get(p.id) || 0) >= p.maxWeekendShifts) {
        return false;
      }

      // 5. Same day double-booking check
      const alreadyAssignedToday = schedule.some(
        (s) => s.date === shift.date && s.physicianId === p.id && s.id !== shift.id
      );
      if (alreadyAssignedToday) return false;

      // 6. Back-to-back primary call check
      if (rules.noBackToBackPrimary && shift.type === 'PRIMARY_CALL') {
        const prevDay = new Date(new Date(shift.date).getTime() - 86400000).toISOString().split('T')[0];
        const nextDay = new Date(new Date(shift.date).getTime() + 86400000).toISOString().split('T')[0];
        
        const hadCallYesterday = schedule.some(
          (s) => (s.date === prevDay || s.date === nextDay) && s.physicianId === p.id && s.type === 'PRIMARY_CALL'
        );
        if (hadCallYesterday) return false;
      }

      return true;
    });

    if (eligiblePhysicians.length > 0) {
      // Sort candidates by fairness score: least assigned shifts first, then least weekend shifts
      eligiblePhysicians.sort((a, b) => {
        const countA = (shiftCounts.get(a.id) || 0) / (a.fte || 1.0);
        const countB = (shiftCounts.get(b.id) || 0) / (b.fte || 1.0);
        if (countA !== countB) return countA - countB;

        if (isWeekend) {
          const wkdA = weekendCounts.get(a.id) || 0;
          const wkdB = weekendCounts.get(b.id) || 0;
          if (wkdA !== wkdB) return wkdA - wkdB;
        }

        if (isHoliday) {
          const holA = holidayCounts.get(a.id) || 0;
          const holB = holidayCounts.get(b.id) || 0;
          if (holA !== holB) return holA - holB;
        }

        return Math.random() - 0.5;
      });

      const selected = eligiblePhysicians[0];
      shift.physicianId = selected.id;
      shift.status = 'CONFIRMED';
      shift.updatedAt = new Date().toISOString();

      shiftCounts.set(selected.id, (shiftCounts.get(selected.id) || 0) + 1);
      if (isWeekend) {
        weekendCounts.set(selected.id, (weekendCounts.get(selected.id) || 0) + 1);
      }
      if (isHoliday) {
        holidayCounts.set(selected.id, (holidayCounts.get(selected.id) || 0) + 1);
      }
      lastAssignedDate.set(selected.id, shift.date);
      filledCount++;
    }
  }

  return {
    updatedShifts: schedule,
    generatedCount: filledCount,
    resolvedConflictCount: filledCount,
  };
}

// Export schedule to standard RFC 5545 iCalendar format (.ics)
export function exportToICalendar(shifts: Shift[], physicians: Physician[], departmentName = 'Hospital Medicine'): string {
  const physicianMap = new Map(physicians.map((p) => [p.id, p]));
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Physician Call Scheduler//Clinical Roster//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${departmentName} Physician Call Schedule`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const shift of shifts) {
    if (!shift.physicianId) continue;
    const doc = physicianMap.get(shift.physicianId);
    const def = SHIFT_DEFINITIONS[shift.type];
    
    // Parse date
    const dateFormatted = shift.date.replace(/-/g, '');
    const startTime = def.startTime.replace(':', '') + '00';
    const endTime = (def.isOvernight ? '070000' : def.endTime.replace(':', '') + '00');
    
    const dtStart = `${dateFormatted}T${startTime}`;
    // If overnight, add 1 day
    let dtEnd = `${dateFormatted}T${endTime}`;
    if (def.isOvernight) {
      const nextD = new Date(shift.date);
      nextD.setDate(nextD.getDate() + 1);
      const nextDStr = nextD.toISOString().split('T')[0].replace(/-/g, '');
      dtEnd = `${nextDStr}T${endTime}`;
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:shift-${shift.id}@physicianscheduler.med`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${def.label} - ${doc ? doc.name : 'Unassigned'} (${doc?.role || ''})`);
    lines.push(`DESCRIPTION:Clinical Call Shift: ${def.label}\\nPhysician: ${doc?.name || 'Unassigned'}\\nRole: ${doc?.role || ''}\\nSpecialty: ${doc?.specialty || ''}\\nPhone: ${doc?.phone || ''}\\nNotes: ${shift.notes || 'None'}`);
    lines.push(`LOCATION:Main Medical Center / ICU`);
    lines.push(`STATUS:CONFIRMED`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// Export schedule to clean CSV for Payroll / Admin
export function exportToCSV(shifts: Shift[], physicians: Physician[]): string {
  const physicianMap = new Map(physicians.map((p) => [p.id, p]));
  const headers = [
    'Date',
    'Day of Week',
    'Shift Type',
    'Shift Code',
    'Hours',
    'Physician Name',
    'Role',
    'Specialty',
    'Physician Phone',
    'Status',
    'Holiday',
  ];

  const rows = shifts.map((shift) => {
    const doc = shift.physicianId ? physicianMap.get(shift.physicianId) : null;
    const def = SHIFT_DEFINITIONS[shift.type];
    const [y, m, d] = shift.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    return [
      shift.date,
      dayOfWeek,
      `"${def?.label || shift.type}"`,
      def?.shortCode || shift.type,
      def?.durationHours || 12,
      `"${doc?.name || 'UNCOVERED'}"`,
      `"${doc?.role || ''}"`,
      `"${doc?.specialty || ''}"`,
      `"${doc?.phone || ''}"`,
      shift.status,
      `"${shift.holidayName || ''}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
