export type PhysicianRole = 'Attending' | 'Fellow' | 'Senior Resident' | 'Junior Resident';

export type ShiftCategory = 
  | 'PRIMARY_CALL' 
  | 'BACKUP_CALL' 
  | 'NIGHT_FLOAT' 
  | 'WEEKEND_ROUND' 
  | 'TRAUMA_CALL';

export type ShiftType = ShiftCategory;

export type TabType = 'CALENDAR' | 'ENGINE' | 'ROSTER' | 'SWAPS' | 'ANALYTICS';

export interface Physician {
  id: string;
  name: string;
  title: string; // e.g. "MD, FACC", "DO", "MD, FACS"
  role: PhysicianRole;
  specialty: string;
  department: string;
  email: string;
  phone: string;
  fte: number; // e.g. 1.0, 0.8, 0.5
  maxShiftsPerMonth: number;
  maxWeekendShifts: number;
  avatarColor: string;
  blackoutDates: string[]; // YYYY-MM-DD
  blackoutReasons?: Record<string, string>; // date -> reason (e.g. "Conference", "Vacation")
  preferredWeekdaysOff?: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  notes?: string;
  isChief?: boolean;
}

export interface ShiftDefinition {
  type: ShiftCategory;
  label: string;
  shortCode: string;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    dot: string;
  };
  startTime: string; // e.g. "07:00" or "19:00"
  endTime: string;   // e.g. "07:00 (Next Day)"
  durationHours: number;
  isOvernight: boolean;
  isWeekendOnly: boolean;
  weight: number; // For fairness points calculation
  requiredRoles?: PhysicianRole[];
  description: string;
}

export type ShiftStatus = 'CONFIRMED' | 'PENDING_SWAP' | 'CONFLICT' | 'UNCOVERED';

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  type: ShiftCategory;
  physicianId: string | null; // null if uncovered
  status: ShiftStatus;
  notes?: string;
  isHoliday?: boolean;
  holidayName?: string;
  updatedAt?: string;
}

export type SwapStatus = 
  | 'PENDING_PEER' 
  | 'PENDING_CHIEF' 
  | 'APPROVED' 
  | 'DENIED' 
  | 'CANCELLED';

export type SwapUrgency = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface AISwapAnalysis {
  recommendation: 'APPROVED' | 'REVIEW_REQUIRED' | 'DENIED';
  fatigueRisk: 'LOW' | 'MODERATE' | 'HIGH';
  conflictDetected: boolean;
  conflictReason: string | null;
  fairnessImpact: string;
  clinicalRationale: string;
  alternativeSuggestions?: string[];
}

export interface ShiftSwapRequest {
  id: string;
  requestingPhysicianId: string;
  targetPhysicianId: string | null; // null if posted to Open Board (Giveaway)
  requestingShiftId: string;
  targetShiftId: string | null; // null for pure giveaway
  status: SwapStatus;
  urgency: SwapUrgency;
  reason: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  chiefNotes?: string;
  isOpenBoard?: boolean;
  aiReview?: AISwapAnalysis;
}

export interface SchedulingRules {
  noBackToBackPrimary: boolean;
  maxConsecutiveNights: number;
  minRestHoursBetweenShifts: number;
  balanceWeekends: boolean;
  honorBlackoutsStrictly: boolean;
  balanceHolidays: boolean;
  maxShiftsPerMonthHardCap: boolean;
  preventAttendingJuniorMismatch: boolean;
  equityWeightingFTE: boolean;
}

export type ConflictType = 
  | 'DOUBLE_BOOKING' 
  | 'BACK_TO_BACK' 
  | 'BLACKOUT_VIOLATION' 
  | 'MAX_SHIFTS_EXCEEDED' 
  | 'CONSECUTIVE_NIGHTS_EXCEEDED' 
  | 'UNCOVERED_SLOT' 
  | 'REST_HOURS_VIOLATION';

export interface ScheduleConflict {
  id: string;
  type: ConflictType;
  shiftId: string;
  physicianId: string | null;
  date: string;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  suggestedFix?: string;
}

export interface PhysicianWorkload {
  physicianId: string;
  physician: Physician;
  totalShifts: number;
  totalHours: number;
  weekdayCalls: number;
  weekendCalls: number;
  holidayCalls: number;
  nightFloatCalls: number;
  backupCalls: number;
  quotaPercentage: number;
  equityScore: number;
  hasConflicts: boolean;
}

export interface ScheduleAuditReport {
  timestamp: string;
  month: number;
  year: number;
  totalShifts: number;
  uncoveredCount: number;
  criticalConflictCount: number;
  warningCount: number;
  fairnessGiniIndex: number; // 0 to 1 (0 = perfect equity)
  weekendFairnessScore: number; // 0-100%
  holidayFairnessScore: number; // 0-100%
  executiveSummary: string;
  recommendations: string[];
  identifiedRisks: string[];
  burnoutMitigationTips: string[];
}
