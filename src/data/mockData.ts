import { Physician, ShiftCategory, ShiftDefinition, Shift, ShiftSwapRequest, SchedulingRules } from '../types';

export const SHIFT_DEFINITIONS: Record<ShiftCategory, ShiftDefinition> = {
  PRIMARY_CALL: {
    type: 'PRIMARY_CALL',
    label: 'Primary Call (24h/14h)',
    shortCode: 'PRI',
    color: {
      bg: 'bg-emerald-950/80 hover:bg-emerald-900/90',
      border: 'border-emerald-500/60',
      text: 'text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      dot: 'bg-emerald-400',
    },
    startTime: '07:00',
    endTime: '07:00 (+1d)',
    durationHours: 24,
    isOvernight: true,
    isWeekendOnly: false,
    weight: 3.0,
    requiredRoles: ['Attending', 'Fellow', 'Senior Resident'],
    description: 'First responder for acute clinical emergencies, code calls, and admissions.',
  },
  BACKUP_CALL: {
    type: 'BACKUP_CALL',
    label: 'Backup / Second Call',
    shortCode: 'BAK',
    color: {
      bg: 'bg-sky-950/80 hover:bg-sky-900/90',
      border: 'border-sky-500/60',
      text: 'text-sky-300',
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      dot: 'bg-sky-400',
    },
    startTime: '17:00',
    endTime: '07:00 (+1d)',
    durationHours: 14,
    isOvernight: true,
    isWeekendOnly: false,
    weight: 1.5,
    requiredRoles: ['Attending', 'Fellow'],
    description: 'Senior backup coverage available within 20 mins for complex surgical/ICU escalation.',
  },
  NIGHT_FLOAT: {
    type: 'NIGHT_FLOAT',
    label: 'Night Float (12h)',
    shortCode: 'NFT',
    color: {
      bg: 'bg-indigo-950/80 hover:bg-indigo-900/90',
      border: 'border-indigo-500/60',
      text: 'text-indigo-300',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      dot: 'bg-indigo-400',
    },
    startTime: '19:00',
    endTime: '07:00 (+1d)',
    durationHours: 12,
    isOvernight: true,
    isWeekendOnly: false,
    weight: 2.0,
    requiredRoles: ['Senior Resident', 'Junior Resident', 'Fellow'],
    description: 'Overnight cross-cover management for inpatient floors and intermediate care units.',
  },
  WEEKEND_ROUND: {
    type: 'WEEKEND_ROUND',
    label: 'Weekend Attending Rounds',
    shortCode: 'WND',
    color: {
      bg: 'bg-amber-950/80 hover:bg-amber-900/90',
      border: 'border-amber-500/60',
      text: 'text-amber-300',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dot: 'bg-amber-400',
    },
    startTime: '08:00',
    endTime: '17:00',
    durationHours: 9,
    isOvernight: false,
    isWeekendOnly: true,
    weight: 2.2,
    requiredRoles: ['Attending', 'Fellow'],
    description: 'Comprehensive morning and afternoon rounding on all admitted inpatients.',
  },
  TRAUMA_CALL: {
    type: 'TRAUMA_CALL',
    label: 'Trauma / Acute Response',
    shortCode: 'TRM',
    color: {
      bg: 'bg-rose-950/80 hover:bg-rose-900/90',
      border: 'border-rose-500/60',
      text: 'text-rose-300',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      dot: 'bg-rose-400',
    },
    startTime: '07:00',
    endTime: '19:00',
    durationHours: 12,
    isOvernight: false,
    isWeekendOnly: false,
    weight: 2.5,
    requiredRoles: ['Attending', 'Fellow', 'Senior Resident'],
    description: 'Level 1 trauma bay activations, emergency surgical consultations, and resuscitations.',
  },
};

export const INITIAL_PHYSICIANS: Physician[] = [
  {
    id: 'phy-1',
    name: 'Dr. Marcus Vance',
    title: 'MD, FACC',
    role: 'Attending',
    specialty: 'Cardiovascular Medicine',
    department: 'Department of Medicine',
    email: 'm.vance@saintjude-health.org',
    phone: '(555) 234-8901',
    fte: 1.0,
    maxShiftsPerMonth: 6,
    maxWeekendShifts: 2,
    avatarColor: 'from-blue-500 to-indigo-600',
    blackoutDates: ['2026-09-12', '2026-09-13', '2026-09-14'],
    blackoutReasons: {
      '2026-09-12': 'AHA Scientific Sessions Conference',
      '2026-09-13': 'AHA Scientific Sessions Conference',
      '2026-09-14': 'AHA Scientific Sessions Conference',
    },
    isChief: true,
    notes: 'Program Director & Division Chief. Available for urgent clinical backup.',
  },
  {
    id: 'phy-2',
    name: 'Dr. Elena Rostova',
    title: 'MD, PhD',
    role: 'Attending',
    specialty: 'Pulmonary & Critical Care',
    department: 'Department of Medicine',
    email: 'e.rostova@saintjude-health.org',
    phone: '(555) 456-1122',
    fte: 1.0,
    maxShiftsPerMonth: 6,
    maxWeekendShifts: 2,
    avatarColor: 'from-emerald-500 to-teal-600',
    blackoutDates: ['2026-09-25', '2026-09-26', '2026-09-27'],
    blackoutReasons: {
      '2026-09-25': 'Annual Vacation',
      '2026-09-26': 'Annual Vacation',
      '2026-09-27': 'Annual Vacation',
    },
    notes: 'ICU team leader. Prefers primary calls on Tuesdays and Thursdays.',
  },
  {
    id: 'phy-3',
    name: 'Dr. Jordan Chen',
    title: 'DO, FACP',
    role: 'Attending',
    specialty: 'Gastroenterology & Hepatology',
    department: 'Department of Medicine',
    email: 'j.chen@saintjude-health.org',
    phone: '(555) 789-3344',
    fte: 0.8,
    maxShiftsPerMonth: 5,
    maxWeekendShifts: 2,
    avatarColor: 'from-amber-500 to-orange-600',
    blackoutDates: ['2026-09-04', '2026-09-05'],
    blackoutReasons: {
      '2026-09-04': 'Academic Research Grant Meeting',
      '2026-09-05': 'Academic Research Grant Meeting',
    },
    notes: '0.8 FTE allocation. Enjoys weekend rounding coverage.',
  },
  {
    id: 'phy-4',
    name: 'Dr. Aisha Patel',
    title: 'MD',
    role: 'Fellow',
    specialty: 'Interventional Cardiology',
    department: 'Department of Medicine',
    email: 'a.patel@saintjude-health.org',
    phone: '(555) 678-9012',
    fte: 1.0,
    maxShiftsPerMonth: 7,
    maxWeekendShifts: 2,
    avatarColor: 'from-rose-500 to-pink-600',
    blackoutDates: ['2026-09-18', '2026-09-19', '2026-09-20'],
    blackoutReasons: {
      '2026-09-18': 'Fellowship Board Prep Course',
      '2026-09-19': 'Fellowship Board Prep Course',
      '2026-09-20': 'Fellowship Board Prep Course',
    },
    notes: 'Fellowship Year 3. Certified for primary independent emergency call.',
  },
  {
    id: 'phy-5',
    name: 'Dr. Samuel Kim',
    title: 'MD',
    role: 'Fellow',
    specialty: 'Nephrology & Renal Transplant',
    department: 'Department of Medicine',
    email: 's.kim@saintjude-health.org',
    phone: '(555) 890-3456',
    fte: 1.0,
    maxShiftsPerMonth: 7,
    maxWeekendShifts: 3,
    avatarColor: 'from-cyan-500 to-blue-600',
    blackoutDates: ['2026-09-07'],
    blackoutReasons: {
      '2026-09-07': 'Labor Day Holiday Leave',
    },
    notes: 'Transplant call trained.',
  },
  {
    id: 'phy-6',
    name: 'Dr. Olivia Taylor',
    title: 'DO',
    role: 'Senior Resident',
    specialty: 'Internal Medicine (PGY-3)',
    department: 'Department of Medicine',
    email: 'o.taylor@saintjude-health.org',
    phone: '(555) 321-6549',
    fte: 1.0,
    maxShiftsPerMonth: 8,
    maxWeekendShifts: 3,
    avatarColor: 'from-purple-500 to-violet-600',
    blackoutDates: ['2026-09-15'],
    blackoutReasons: {
      '2026-09-15': 'In-Training Examination (ITE)',
    },
    isChief: true,
    notes: 'Chief Resident for Clinical Scheduling. Handles peer swap workflows.',
  },
  {
    id: 'phy-7',
    name: 'Dr. Carlos Mendez',
    title: 'MD',
    role: 'Senior Resident',
    specialty: 'Internal Medicine (PGY-3)',
    department: 'Department of Medicine',
    email: 'c.mendez@saintjude-health.org',
    phone: '(555) 654-9871',
    fte: 1.0,
    maxShiftsPerMonth: 8,
    maxWeekendShifts: 3,
    avatarColor: 'from-teal-500 to-emerald-600',
    blackoutDates: ['2026-09-01', '2026-09-02'],
    blackoutReasons: {
      '2026-09-01': 'Post-Night Float Mandatory Rest',
      '2026-09-02': 'Post-Night Float Mandatory Rest',
    },
    notes: 'Senior code team leader.',
  },
  {
    id: 'phy-8',
    name: 'Dr. Sarah Jenkins',
    title: 'MD',
    role: 'Senior Resident',
    specialty: 'Internal Medicine (PGY-3)',
    department: 'Department of Medicine',
    email: 's.jenkins@saintjude-health.org',
    phone: '(555) 987-4321',
    fte: 1.0,
    maxShiftsPerMonth: 8,
    maxWeekendShifts: 3,
    avatarColor: 'from-fuchsia-500 to-pink-600',
    blackoutDates: ['2026-09-28', '2026-09-29', '2026-09-30'],
    blackoutReasons: {
      '2026-09-28': 'Fellowship Interview Travel',
      '2026-09-29': 'Fellowship Interview Travel',
      '2026-09-30': 'Fellowship Interview Travel',
    },
    notes: 'Applying for Cardiology fellowships.',
  },
  {
    id: 'phy-9',
    name: 'Dr. Priya Sharma',
    title: 'MD',
    role: 'Junior Resident',
    specialty: 'Internal Medicine (PGY-2)',
    department: 'Department of Medicine',
    email: 'p.sharma@saintjude-health.org',
    phone: '(555) 123-7788',
    fte: 1.0,
    maxShiftsPerMonth: 8,
    maxWeekendShifts: 3,
    avatarColor: 'from-lime-500 to-green-600',
    blackoutDates: ['2026-09-21', '2026-09-22'],
    blackoutReasons: {
      '2026-09-21': 'Personal Wellness Day',
      '2026-09-22': 'Personal Wellness Day',
    },
    notes: 'Eligible for Night Float and Trauma assist calls under senior supervision.',
  },
  {
    id: 'phy-10',
    name: 'Dr. David Morales',
    title: 'MD',
    role: 'Junior Resident',
    specialty: 'Internal Medicine (PGY-2)',
    department: 'Department of Medicine',
    email: 'd.morales@saintjude-health.org',
    phone: '(555) 432-8899',
    fte: 1.0,
    maxShiftsPerMonth: 8,
    maxWeekendShifts: 3,
    avatarColor: 'from-yellow-500 to-amber-600',
    blackoutDates: [],
    blackoutReasons: {},
    notes: 'No blackout requests submitted this block.',
  },
];

export const RECOGNIZED_HOLIDAYS: Record<string, string> = {
  '2026-01-01': "New Year's Day",
  '2026-01-19': 'Martin Luther King Jr. Day',
  '2026-02-16': "Presidents' Day",
  '2026-05-25': 'Memorial Day',
  '2026-06-19': 'Juneteenth National Independence Day',
  '2026-07-04': 'Independence Day',
  '2026-09-07': 'Labor Day',
  '2026-10-12': 'Columbus / Indigenous Peoples Day',
  '2026-11-11': 'Veterans Day',
  '2026-11-26': 'Thanksgiving Day',
  '2026-11-27': 'Day After Thanksgiving',
  '2026-12-24': 'Christmas Eve',
  '2026-12-25': 'Christmas Day',
  '2026-12-31': "New Year's Eve",
};

export const DEFAULT_SCHEDULING_RULES: SchedulingRules = {
  noBackToBackPrimary: true,
  maxConsecutiveNights: 3,
  minRestHoursBetweenShifts: 24,
  balanceWeekends: true,
  honorBlackoutsStrictly: true,
  balanceHolidays: true,
  maxShiftsPerMonthHardCap: true,
  preventAttendingJuniorMismatch: true,
  equityWeightingFTE: true,
};

// Generates an initial sample schedule for September 2026
export function generateInitialSampleShifts(): Shift[] {
  const shifts: Shift[] = [];
  const year = 2026;
  const month = 8; // September is 8 (0-indexed)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Primary Call Physician Pool
  const primaryPool = ['phy-1', 'phy-2', 'phy-3', 'phy-4', 'phy-5', 'phy-6', 'phy-7', 'phy-8'];
  // Backup Call Pool
  const backupPool = ['phy-1', 'phy-2', 'phy-3', 'phy-4', 'phy-5'];
  // Night Float Pool
  const nightPool = ['phy-6', 'phy-7', 'phy-8', 'phy-9', 'phy-10'];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-09-${dayStr}`;
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = !!RECOGNIZED_HOLIDAYS[dateStr];
    const holidayName = RECOGNIZED_HOLIDAYS[dateStr];

    // Primary Call (Every day)
    const primaryPhysician = primaryPool[(day * 3 + 1) % primaryPool.length];
    shifts.push({
      id: `shift-pri-${dateStr}`,
      date: dateStr,
      type: 'PRIMARY_CALL',
      physicianId: primaryPhysician,
      status: day === 14 ? 'PENDING_SWAP' : 'CONFIRMED',
      isHoliday,
      holidayName,
      notes: isHoliday ? `Holiday coverage: ${holidayName}` : undefined,
      updatedAt: new Date().toISOString(),
    });

    // Backup Call (Every day)
    const backupPhysician = backupPool[(day * 2 + 3) % backupPool.length];
    shifts.push({
      id: `shift-bak-${dateStr}`,
      date: dateStr,
      type: 'BACKUP_CALL',
      physicianId: backupPhysician !== primaryPhysician ? backupPhysician : backupPool[(day + 4) % backupPool.length],
      status: 'CONFIRMED',
      isHoliday,
      holidayName,
      updatedAt: new Date().toISOString(),
    });

    // Night Float (Every day)
    const nightPhysician = nightPool[(day + 2) % nightPool.length];
    shifts.push({
      id: `shift-nft-${dateStr}`,
      date: dateStr,
      type: 'NIGHT_FLOAT',
      physicianId: nightPhysician,
      status: 'CONFIRMED',
      isHoliday,
      holidayName,
      updatedAt: new Date().toISOString(),
    });

    // Weekend Rounding (Saturdays & Sundays only)
    if (isWeekend) {
      const weekendAttending = ['phy-1', 'phy-2', 'phy-3'][(day) % 3];
      shifts.push({
        id: `shift-wnd-${dateStr}`,
        date: dateStr,
        type: 'WEEKEND_ROUND',
        physicianId: weekendAttending,
        status: 'CONFIRMED',
        isHoliday,
        holidayName,
        updatedAt: new Date().toISOString(),
      });
    }

    // Trauma Call (Fridays, Saturdays, and Holidays)
    if (dayOfWeek === 5 || dayOfWeek === 6 || isHoliday) {
      const traumaDoc = ['phy-4', 'phy-6', 'phy-7', 'phy-8'][(day * 2) % 4];
      shifts.push({
        id: `shift-trm-${dateStr}`,
        date: dateStr,
        type: 'TRAUMA_CALL',
        physicianId: traumaDoc,
        status: 'CONFIRMED',
        isHoliday,
        holidayName,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return shifts;
}

export const INITIAL_SWAP_REQUESTS: ShiftSwapRequest[] = [
  {
    id: 'swap-1',
    requestingPhysicianId: 'phy-4', // Dr. Aisha Patel
    targetPhysicianId: 'phy-7', // Dr. Carlos Mendez
    requestingShiftId: 'shift-pri-2026-09-14',
    targetShiftId: 'shift-pri-2026-09-22',
    status: 'PENDING_CHIEF',
    urgency: 'ROUTINE',
    reason: 'Attending CME Cardiology conference presentation out of state.',
    createdAt: '2026-08-28T14:30:00Z',
    aiReview: {
      recommendation: 'APPROVED',
      fatigueRisk: 'LOW',
      conflictDetected: false,
      conflictReason: null,
      fairnessImpact: 'Equal 1:1 weekday primary call trade. No impact on weekend equity.',
      clinicalRationale: 'Both Dr. Patel and Dr. Mendez have adequate rest (>48h) between surrounding shifts and are eligible for Primary Call duties.',
    },
  },
  {
    id: 'swap-2',
    requestingPhysicianId: 'phy-8', // Dr. Sarah Jenkins
    targetPhysicianId: null, // Open Board Giveaway
    requestingShiftId: 'shift-trm-2026-09-26',
    targetShiftId: null,
    status: 'PENDING_PEER',
    urgency: 'URGENT',
    reason: 'Unexpected family commitment during fellowship interview cycle.',
    createdAt: '2026-08-30T09:15:00Z',
    isOpenBoard: true,
    aiReview: {
      recommendation: 'REVIEW_REQUIRED',
      fatigueRisk: 'LOW',
      conflictDetected: false,
      conflictReason: null,
      fairnessImpact: 'Giveaway will reduce Dr. Jenkins total call burden by 1 shift. Recipient will receive +2.5 equity weight.',
      clinicalRationale: 'Eligible candidates without blackout conflicts on Sept 26: Dr. Vance, Dr. Chen, Dr. Patel, Dr. Morales.',
      alternativeSuggestions: ['Offer direct trade with Dr. David Morales', 'Post to Trauma Emergency coverage pool'],
    },
  },
];

export const INITIAL_SHIFTS = generateInitialSampleShifts();
export const MOCK_PHYSICIANS = INITIAL_PHYSICIANS;
export const MOCK_SHIFTS = INITIAL_SHIFTS;
export const MOCK_SWAP_REQUESTS = INITIAL_SWAP_REQUESTS;
