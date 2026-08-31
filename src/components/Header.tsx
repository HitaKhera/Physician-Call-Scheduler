import React from 'react';
import { 
  Calendar, 
  RotateCw, 
  Users, 
  ArrowLeftRight, 
  BarChart3, 
  Sparkles, 
  AlertTriangle, 
  Download, 
  Printer, 
  ShieldCheck,
  Stethoscope,
  FileSpreadsheet
} from 'lucide-react';
import { ScheduleConflict, TabType } from '../types';

export type ActiveTab = TabType;

interface HeaderProps {
  activeTab: TabType | string;
  onTabChange?: (tab: TabType) => void;
  setActiveTab?: (tab: TabType) => void;
  conflicts?: ScheduleConflict[];
  activeConflictsCount?: number;
  onOpenConflicts?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenAnnouncements?: () => void;
  onExportICS?: () => void;
  onExportCSV?: () => void;
  onPrint?: () => void;
  pendingSwapsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  setActiveTab,
  conflicts = [],
  activeConflictsCount,
  onOpenConflicts,
  onOpenAIAssistant,
  onOpenAnnouncements,
  onExportICS,
  onExportCSV,
  onPrint,
  pendingSwapsCount = 0,
}) => {
  const switchTab = onTabChange || setActiveTab || (() => {});
  const conflictList = conflicts || [];
  const criticalConflicts = conflictList.filter((c) => c.severity === 'CRITICAL');
  const totalConflicts = activeConflictsCount !== undefined ? activeConflictsCount : conflictList.length;
  const handleAssistantClick = onOpenAnnouncements || onOpenAIAssistant || (() => {});
  const handlePrintClick = onPrint || (() => window.print());

  const isTabActive = (t: TabType) => {
    if (activeTab === t) return true;
    if (typeof activeTab === 'string') {
      const upper = activeTab.toUpperCase();
      if (upper === t) return true;
      if (t === 'ENGINE' && (upper === 'AUTO-ROTATION' || upper === 'AUTOROTATION')) return true;
    }
    return false;
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          {/* Brand & Department Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/10">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    Physician Call Scheduler
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      v2.5 Clinical
                    </span>
                  </h1>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Saint Jude Medical Center • Department of Medicine & ICU Rotation
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-2 lg:hidden">
              <button
                id="mobile-ai-btn"
                onClick={handleAssistantClick}
                className="p-2 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
                title="AI Clinical Copilot & Announcements"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center overflow-x-auto py-1 scrollbar-none gap-1.5">
            <button
              id="tab-calendar"
              onClick={() => switchTab('CALENDAR')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isTabActive('CALENDAR')
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>

            <button
              id="tab-auto-rotation"
              onClick={() => switchTab('ENGINE')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isTabActive('ENGINE')
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <RotateCw className="w-4 h-4" />
              <span>Auto Rotation Engine</span>
            </button>

            <button
              id="tab-roster"
              onClick={() => switchTab('ROSTER')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isTabActive('ROSTER')
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Roster & Blackouts</span>
            </button>

            <button
              id="tab-swaps"
              onClick={() => switchTab('SWAPS')}
              className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isTabActive('SWAPS')
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Shift Swaps</span>
              {pendingSwapsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {pendingSwapsCount}
                </span>
              )}
            </button>

            <button
              id="tab-analytics"
              onClick={() => switchTab('ANALYTICS')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isTabActive('ANALYTICS')
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Fairness & Quotas</span>
            </button>
          </nav>

          {/* Action Bar */}
          <div className="flex items-center space-x-2">
            {/* Conflict Alert Pill */}
            {totalConflicts > 0 ? (
              <button
                id="btn-conflict-drawer"
                onClick={onOpenConflicts || (() => switchTab('ENGINE'))}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  criticalConflicts.length > 0
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20 animate-pulse'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{totalConflicts} Rule Alert{totalConflicts > 1 ? 's' : ''}</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Schedule Compliant</span>
              </div>
            )}

            {/* AI Assistant Button */}
            <button
              id="btn-ai-copilot"
              onClick={handleAssistantClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-500 hover:to-purple-500 transition-all border border-indigo-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline">AI Broadcast</span>
            </button>

            {/* Export Menu Buttons */}
            <div className="flex items-center border-l border-slate-700 pl-2 space-x-1">
              {onExportICS && (
                <button
                  id="btn-export-ics"
                  onClick={onExportICS}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Export to iCalendar (.ics)"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              {onExportCSV && (
                <button
                  id="btn-export-csv"
                  onClick={onExportCSV}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Export to CSV / Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              )}
              <button
                id="btn-print-schedule"
                onClick={handlePrintClick}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Print Clinical Roster"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
