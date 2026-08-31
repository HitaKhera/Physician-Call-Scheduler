import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  User, 
  ShieldCheck, 
  MessageSquare, 
  Filter, 
  Flame, 
  Check, 
  X,
  Send,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Physician, 
  Shift, 
  ShiftSwapRequest, 
  SwapStatus, 
  SwapUrgency, 
  AISwapAnalysis 
} from '../types';
import { SHIFT_DEFINITIONS } from '../data/mockData';
import { formatFriendlyDate } from '../utils/schedulerEngine';

interface ShiftSwapModuleProps {
  swapRequests: ShiftSwapRequest[];
  shifts: Shift[];
  physicians: Physician[];
  onApproveSwap: (swapId: string, chiefNotes?: string) => void;
  onDenySwap: (swapId: string, chiefNotes?: string) => void;
  onCreateSwapRequest: (newSwap: Omit<ShiftSwapRequest, 'id' | 'createdAt'>) => void;
  initialPreselectedShift?: Shift | null;
}

export const ShiftSwapModule: React.FC<ShiftSwapModuleProps> = ({
  swapRequests,
  shifts,
  physicians,
  onApproveSwap,
  onDenySwap,
  onCreateSwapRequest,
  initialPreselectedShift,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(!!initialPreselectedShift);
  const [selectedSwapForDetail, setSelectedSwapForDetail] = useState<ShiftSwapRequest | null>(null);
  const [isAiReviewing, setIsAiReviewing] = useState<boolean>(false);

  // Form states for new swap request
  const [requestingPhysicianId, setRequestingPhysicianId] = useState<string>(
    initialPreselectedShift?.physicianId || (physicians[0]?.id || '')
  );
  const [requestingShiftId, setRequestingShiftId] = useState<string>(
    initialPreselectedShift?.id || ''
  );
  const [targetPhysicianId, setTargetPhysicianId] = useState<string>('');
  const [targetShiftId, setTargetShiftId] = useState<string>('');
  const [swapType, setSwapType] = useState<'DIRECT_TRADE' | 'OPEN_GIVEAWAY'>('DIRECT_TRADE');
  const [urgency, setUrgency] = useState<SwapUrgency>('ROUTINE');
  const [reason, setReason] = useState<string>('');
  const [chiefReviewNote, setChiefReviewNote] = useState<string>('');

  const physicianMap = new Map<string, Physician>(physicians.map((p) => [p.id, p]));
  const shiftMap = new Map<string, Shift>(shifts.map((s) => [s.id, s]));

  // Eligible shifts owned by requesting physician
  const myAssignedShifts = shifts.filter((s) => s.physicianId === requestingPhysicianId);
  // Eligible shifts owned by target physician
  const targetAssignedShifts = shifts.filter((s) => s.physicianId === targetPhysicianId);

  // Filtered swap requests
  const filteredSwaps = swapRequests.filter((swap) => {
    if (statusFilter === 'PENDING' && swap.status !== 'PENDING_CHIEF' && swap.status !== 'PENDING_PEER') {
      return false;
    }
    if (statusFilter === 'APPROVED' && swap.status !== 'APPROVED') return false;
    if (statusFilter === 'OPEN_BOARD' && !swap.isOpenBoard) return false;
    return true;
  });

  // Handle New Swap Submission
  const handleSubmitSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingPhysicianId || !requestingShiftId) return;

    const reqDoc = physicianMap.get(requestingPhysicianId);
    const tarDoc = targetPhysicianId ? physicianMap.get(targetPhysicianId) : null;
    const reqShift = shiftMap.get(requestingShiftId);
    const tarShift = targetShiftId ? shiftMap.get(targetShiftId) : null;

    let aiReviewData: AISwapAnalysis | undefined = undefined;

    // Optional quick AI check
    try {
      const res = await fetch('/api/ai/swap-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestingPhysician: reqDoc,
          targetPhysician: tarDoc,
          requestingShift: reqShift,
          targetShift: tarShift,
        }),
      });
      const data = await res.json();
      if (data?.analysis) {
        aiReviewData = data.analysis;
      }
    } catch (err) {
      console.warn('AI Swap review fallback used');
    }

    onCreateSwapRequest({
      requestingPhysicianId,
      targetPhysicianId: swapType === 'DIRECT_TRADE' ? targetPhysicianId : null,
      requestingShiftId,
      targetShiftId: swapType === 'DIRECT_TRADE' ? (targetShiftId || null) : null,
      status: 'PENDING_CHIEF',
      urgency,
      reason,
      isOpenBoard: swapType === 'OPEN_GIVEAWAY',
      aiReview: aiReviewData,
    });

    setIsCreateModalOpen(false);
    setReason('');
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 },
    });
  };

  const handleApproveWithEffect = (swapId: string) => {
    onApproveSwap(swapId, chiefReviewNote || 'Approved by Chief Medical Officer');
    setSelectedSwapForDetail(null);
    setChiefReviewNote('');
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.5 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-400" />
            Internal Shift Swap & Trade Portal
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Peer-to-peer call trades, giveaway coverage board, and administrative approval workflow
          </p>
        </div>

        <button
          id="btn-open-create-swap"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Request Shift Swap</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            statusFilter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          All Swaps ({swapRequests.length})
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Pending Chief Approval ({swapRequests.filter((s) => s.status === 'PENDING_CHIEF' || s.status === 'PENDING_PEER').length})
        </button>
        <button
          onClick={() => setStatusFilter('OPEN_BOARD')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            statusFilter === 'OPEN_BOARD'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Open Coverage Board ({swapRequests.filter((s) => s.isOpenBoard).length})
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Approved Trades ({swapRequests.filter((s) => s.status === 'APPROVED').length})
        </button>
      </div>

      {/* Swaps List */}
      <div className="space-y-4">
        {filteredSwaps.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <ArrowLeftRight className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No shift trade requests found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Clinicians can initiate peer trades or post open giveaway shifts to the coverage board anytime.
            </p>
          </div>
        ) : (
          filteredSwaps.map((swap) => {
            const reqDoc = physicianMap.get(swap.requestingPhysicianId);
            const tarDoc = swap.targetPhysicianId ? physicianMap.get(swap.targetPhysicianId) : null;
            const reqShift = shiftMap.get(swap.requestingShiftId);
            const tarShift = swap.targetShiftId ? shiftMap.get(swap.targetShiftId) : null;

            const reqDef = reqShift ? SHIFT_DEFINITIONS[reqShift.type] : null;
            const tarDef = tarShift ? SHIFT_DEFINITIONS[tarShift.type] : null;

            return (
              <div
                key={swap.id}
                className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg transition-all space-y-4 ${
                  swap.status === 'PENDING_CHIEF'
                    ? 'border-amber-500/40 bg-slate-900'
                    : swap.status === 'APPROVED'
                    ? 'border-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        swap.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : swap.status === 'DENIED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {swap.status.replace('_', ' ')}
                    </span>

                    {swap.urgency === 'URGENT' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        URGENT
                      </span>
                    )}

                    {swap.isOpenBoard && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        OPEN GIVEAWAY
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Submitted: {new Date(swap.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Trade Visualizer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Requesting Side */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Trading Out (Requesting)
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${reqDoc?.avatarColor || 'from-blue-500 to-indigo-600'} flex items-center justify-center font-bold text-white text-xs`}>
                        {reqDoc?.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-bold text-white">{reqDoc?.name}</div>
                        <div className="text-[11px] text-slate-400">{reqDoc?.role} • {reqDoc?.specialty}</div>
                      </div>
                    </div>

                    {reqShift && (
                      <div className={`p-2 rounded-lg border font-semibold ${reqDef?.color?.bg} ${reqDef?.color?.border} ${reqDef?.color?.text}`}>
                        <div className="flex justify-between">
                          <span>{reqDef?.label}</span>
                          <span>{formatFriendlyDate(reqShift.date)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Target Receiving Side */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Receiving / Covering Colleague
                    </div>
                    {tarDoc ? (
                      <>
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${tarDoc?.avatarColor || 'from-teal-500 to-emerald-600'} flex items-center justify-center font-bold text-white text-xs`}>
                            {tarDoc?.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-white">{tarDoc?.name}</div>
                            <div className="text-[11px] text-slate-400">{tarDoc?.role} • {tarDoc?.specialty}</div>
                          </div>
                        </div>

                        {tarShift ? (
                          <div className={`p-2 rounded-lg border font-semibold ${tarDef?.color?.bg} ${tarDef?.color?.border} ${tarDef?.color?.text}`}>
                            <div className="flex justify-between">
                              <span>{tarDef?.label}</span>
                              <span>{formatFriendlyDate(tarShift.date)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 italic text-[11px]">
                            Pure Shift Assumption (No trade-back required)
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 text-center rounded-lg bg-purple-950/20 border border-purple-500/30 text-purple-300">
                        <span className="font-bold block text-xs">Posted to Open Board</span>
                        <span className="text-[11px] text-slate-400">Any eligible resident or attending may claim this shift.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-slate-300">
                  <span className="font-bold text-slate-400 mr-2">Clinical Justification:</span>
                  <span>{swap.reason}</span>
                </div>

                {/* AI Review Badge & Rationale */}
                {swap.aiReview && (
                  <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Safety & Fatigue Analysis
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                        Recommendation: {swap.aiReview.recommendation}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {swap.aiReview.clinicalRationale}
                    </p>
                  </div>
                )}

                {/* Chief Admin Actions */}
                {swap.status === 'PENDING_CHIEF' && (
                  <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Chief admin sign-off notes (optional)..."
                        value={chiefReviewNote}
                        onChange={(e) => setChiefReviewNote(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        onClick={() => onDenySwap(swap.id, chiefReviewNote || 'Declined due to coverage constraints')}
                        className="px-3.5 py-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
                      >
                        Decline Trade
                      </button>
                      <button
                        onClick={() => handleApproveWithEffect(swap.id)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Apply to Schedule</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE SWAP REQUEST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                Submit Shift Swap Proposal
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSwap} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Swap Type Selector */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Trade Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSwapType('DIRECT_TRADE')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                      swapType === 'DIRECT_TRADE'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold">Peer Direct Swap</div>
                    <div className="text-[10px] font-normal text-slate-400">Trade with specific colleague</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSwapType('OPEN_GIVEAWAY')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
                      swapType === 'OPEN_GIVEAWAY'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold">Open Board Giveaway</div>
                    <div className="text-[10px] font-normal text-slate-400">Post for anyone to claim</div>
                  </button>
                </div>
              </div>

              {/* Requesting Physician */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Your Name (Requesting Physician)</label>
                <select
                  value={requestingPhysicianId}
                  onChange={(e) => {
                    setRequestingPhysicianId(e.target.value);
                    setRequestingShiftId('');
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-blue-500"
                >
                  {physicians.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift to Trade Away */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Shift to Trade Away</label>
                <select
                  required
                  value={requestingShiftId}
                  onChange={(e) => setRequestingShiftId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose your assigned shift --</option>
                  {myAssignedShifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatFriendlyDate(s.date)} • {SHIFT_DEFINITIONS[s.type]?.label || s.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Physician if direct trade */}
              {swapType === 'DIRECT_TRADE' && (
                <>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Target Trade Partner</label>
                    <select
                      value={targetPhysicianId}
                      onChange={(e) => {
                        setTargetPhysicianId(e.target.value);
                        setTargetShiftId('');
                      }}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Choose colleague --</option>
                      {physicians
                        .filter((p) => p.id !== requestingPhysicianId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role} - {p.specialty})
                          </option>
                        ))}
                    </select>
                  </div>

                  {targetPhysicianId && (
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Partner's Shift to Take in Return (Optional)
                      </label>
                      <select
                        value={targetShiftId}
                        onChange={(e) => setTargetShiftId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="">No return shift (Partner takes on call coverage)</option>
                        {targetAssignedShifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {formatFriendlyDate(s.date)} • {SHIFT_DEFINITIONS[s.type]?.label || s.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Urgency */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Urgency Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as SwapUrgency)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="ROUTINE">Routine (&gt;72 hours notice)</option>
                  <option value="URGENT">Urgent (24 - 72 hours notice)</option>
                  <option value="EMERGENCY">Acute Clinical Emergency (&lt;24h notice)</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Reason for Swap Request</label>
                <textarea
                  required
                  placeholder="e.g. CME lecture travel, academic conference, personal emergency..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Proposal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
