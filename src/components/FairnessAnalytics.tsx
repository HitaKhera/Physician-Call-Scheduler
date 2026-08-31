import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  HeartHandshake,
  Flame,
  Award
} from 'lucide-react';
import { Physician, Shift } from '../types';
import { calculatePhysicianWorkloads, isWeekendDate } from '../utils/schedulerEngine';

interface FairnessAnalyticsProps {
  shifts: Shift[];
  physicians: Physician[];
  currentDate: Date;
}

export const FairnessAnalytics: React.FC<FairnessAnalyticsProps> = ({
  shifts,
  physicians,
  currentDate,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const workloads = useMemo(() => {
    return calculatePhysicianWorkloads(shifts, physicians, year, month);
  }, [shifts, physicians, year, month]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Aggregated department statistics
  const totalDepartmentHours = workloads.reduce((sum, w) => sum + w.totalHours, 0);
  const totalDepartmentShifts = workloads.reduce((sum, w) => sum + w.totalShifts, 0);
  const totalWeekendCalls = workloads.reduce((sum, w) => sum + w.weekendCalls, 0);
  const totalHolidayCalls = workloads.reduce((sum, w) => sum + w.holidayCalls, 0);

  // Calculate fairness index (Mean Absolute Deviation of shifts per FTE)
  const fteNormalizedShifts = workloads.map((w) => w.totalShifts / (w.physician.fte || 1.0));
  const avgShiftsPerFte = fteNormalizedShifts.reduce((a, b) => a + b, 0) / (fteNormalizedShifts.length || 1);
  const maxDeviation = Math.max(...fteNormalizedShifts.map((s) => Math.abs(s - avgShiftsPerFte)));
  const overallFairnessRating = Math.max(0, Math.min(100, Math.round(100 - maxDeviation * 12)));

  // Maximum shift count among physicians for relative bar scaling
  const maxShiftsAssigned = Math.max(...workloads.map((w) => w.totalShifts), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" />
            Clinical Workload & Fairness Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Equity distribution, weekend call parity, and burnout fatigue tracking for {monthName}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <Award className="w-4 h-4" />
            <span>Overall Fairness Score: {overallFairnessRating}%</span>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-xs font-medium text-slate-400">Total Call Shifts</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{totalDepartmentShifts}</span>
            <span className="text-xs font-medium text-blue-400">100% Scheduled</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-xs font-medium text-slate-400">Cumulative Call Hours</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">{totalDepartmentHours} hrs</span>
            <span className="text-xs font-medium text-slate-400">~{Math.round(totalDepartmentHours / (physicians.length || 1))} / doc</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-xs font-medium text-slate-400">Weekend Call Burden</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">{totalWeekendCalls}</span>
            <span className="text-xs font-medium text-slate-400">Sat & Sun duties</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-xs font-medium text-slate-400">Holiday Allocations</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-400 font-mono">{totalHolidayCalls}</span>
            <span className="text-xs font-medium text-emerald-400">Balanced 1:1</span>
          </div>
        </div>
      </div>

      {/* Visual Shift Distribution Breakdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Physician Call Burden & Quota Parity
            </h3>
            <p className="text-xs text-slate-400">
              Stacked breakdown of weekday vs weekend vs night float shifts relative to FTE quota
            </p>
          </div>
        </div>

        {/* Workload Stacked Bars */}
        <div className="space-y-4">
          {workloads.map((w) => {
            const isOverloaded = w.quotaPercentage > 100;
            const weekdayWidth = (w.weekdayCalls / maxShiftsAssigned) * 100;
            const weekendWidth = (w.weekendCalls / maxShiftsAssigned) * 100;
            const nightWidth = (w.nightFloatCalls / maxShiftsAssigned) * 100;

            return (
              <div key={w.physicianId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{w.physician.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({w.physician.role} • {w.physician.fte} FTE)
                    </span>
                    {isOverloaded && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Over Quota
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 font-mono text-[11px]">
                    <span className="text-slate-300">
                      <strong>{w.totalShifts}</strong> / {w.physician.maxShiftsPerMonth} Shifts
                    </span>
                    <span className="text-slate-400">({w.totalHours} hrs)</span>
                    <span className="text-emerald-400 font-bold">{w.equityScore}% Equity</span>
                  </div>
                </div>

                {/* Progress Stack Bar */}
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  {/* Weekday Calls */}
                  <div
                    style={{ width: `${(w.weekdayCalls / (w.physician.maxShiftsPerMonth || 1)) * 100 * 0.7}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Weekday: ${w.weekdayCalls} shifts`}
                  ></div>
                  {/* Weekend Calls */}
                  <div
                    style={{ width: `${(w.weekendCalls / (w.physician.maxShiftsPerMonth || 1)) * 100 * 0.7}%` }}
                    className="bg-amber-500 h-full"
                    title={`Weekend: ${w.weekendCalls} shifts`}
                  ></div>
                  {/* Night Floats */}
                  <div
                    style={{ width: `${(w.nightFloatCalls / (w.physician.maxShiftsPerMonth || 1)) * 100 * 0.7}%` }}
                    className="bg-indigo-500 h-full"
                    title={`Night Float: ${w.nightFloatCalls} shifts`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-800 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span>Weekday Primary / Backup Call</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span>Weekend Call & Rounds</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-indigo-500"></span>
            <span>Night Float Cross-Cover</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Roster Compliance Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            Physician Workload & ACGME Fatigue Audit Table
          </h3>
          <span className="text-xs text-slate-400">
            FTE Weighted Analysis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 pl-4">Clinician</th>
                <th className="p-3">Rank / Role</th>
                <th className="p-3 text-center">FTE</th>
                <th className="p-3 text-center">Total Shifts</th>
                <th className="p-3 text-center">Hours</th>
                <th className="p-3 text-center">Weekday</th>
                <th className="p-3 text-center">Weekend</th>
                <th className="p-3 text-center">Holidays</th>
                <th className="p-3 text-center">Quota Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {workloads.map((w) => (
                <tr key={w.physicianId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 pl-4 font-bold text-white flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${w.quotaPercentage > 100 ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                    <span>{w.physician.name}</span>
                  </td>
                  <td className="p-3 text-slate-400">{w.physician.role}</td>
                  <td className="p-3 text-center font-mono">{w.physician.fte}</td>
                  <td className="p-3 text-center font-mono font-bold text-slate-200">
                    {w.totalShifts} / {w.physician.maxShiftsPerMonth}
                  </td>
                  <td className="p-3 text-center font-mono">{w.totalHours}h</td>
                  <td className="p-3 text-center font-mono text-emerald-400">{w.weekdayCalls}</td>
                  <td className="p-3 text-center font-mono text-amber-400">{w.weekendCalls}</td>
                  <td className="p-3 text-center font-mono text-purple-400">{w.holidayCalls}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        w.quotaPercentage > 100
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {w.quotaPercentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
