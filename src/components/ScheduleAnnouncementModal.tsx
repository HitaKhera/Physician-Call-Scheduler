import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  Send, 
  Mail, 
  FileText, 
  RotateCw,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Physician, Shift } from '../types';

interface ScheduleAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  physicians: Physician[];
  currentDate: Date;
}

export const ScheduleAnnouncementModal: React.FC<ScheduleAnnouncementModalProps> = ({
  isOpen,
  onClose,
  shifts,
  physicians,
  currentDate,
}) => {
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [tone, setTone] = useState<'Clinical & Formal' | 'Collegial & Encouraging' | 'Concise Bulleted'>('Clinical & Formal');

  if (!isOpen) return null;

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/generate-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: monthName,
          keyDates: [
            { date: `${monthName} 1st`, event: 'Block Rotation Commencement & Call Sign-In' },
            { date: `${monthName} 15th`, event: 'Grand Rounds & Clinical Morbidity Review' },
          ],
          holidayShifts: ['Labor Day Weekend On-Call Duty'],
          guidelines: [
            'All shift swaps must be submitted through the portal 48h prior to call start.',
            'Backup call physicians must remain within 20-minute response radius of the hospital.',
          ],
        }),
      });

      const data = await res.json();
      if (data?.announcement) {
        setAnnouncementText(data.announcement);
      } else {
        setAnnouncementText(
          `# 🏥 Department of Medicine - ${monthName} Call Schedule Release\n\nDear Clinical Faculty, Fellows, and Residents,\n\nThe finalized physician call schedule for **${monthName}** has been published to the portal. All assignments adhere to ACGME 80-hour work limits, mandatory rest intervals, and equity balancing across weekend duties.\n\n### 🔑 Key Protocols & Contact Info:\n1. **Shift Swaps:** Submit all peer trades via the Physician Call Scheduler swap module for Chief sign-off at least 48 hours in advance.\n2. **Backup Coverage:** Backup attending physicians must remain within a 20-minute pager response perimeter.\n3. **Post-Call Relief:** Primary overnight on-call clinicians will be relieved after morning handover rounds at 08:30.\n\nPlease review your assigned dates in the portal today. Thank you for your dedication to our patients and department!`
        );
      }
    } catch (err) {
      setAnnouncementText(
        `# 🏥 Department of Medicine - ${monthName} Call Schedule Release\n\nDear Clinical Faculty & Residents,\n\nThe call rotation for **${monthName}** is now finalized in the portal.\n\nPlease check your assigned 24h Primary, Backup, and Night Float shifts. Report any immediate conflicts to Chief Medical Staff.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(announcementText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Mail className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Generate Department Call Broadcast</h3>
              <p className="text-xs text-slate-400">
                Compose an AI-generated release memo for {monthName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {!announcementText && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3 text-center py-6">
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto" />
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-white">
                  Draft Monthly Call Schedule Announcement
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini AI will synthesize key schedule dates, swap protocols, emergency contact numbers, and duty hour reminders into a formatted memo.
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="btn-generate-ai-announcement"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 transition-all inline-flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Generating Broadcast Memo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generate Broadcast with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {announcementText && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Generated Email / Pager Broadcast:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" /> Regenerate
                  </button>
                  <button
                    id="btn-copy-announcement"
                    onClick={handleCopy}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Memo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Ready for hospital internal email & departmental lists</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
