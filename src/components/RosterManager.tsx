import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  CalendarOff, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Check,
  AlertCircle
} from 'lucide-react';
import { Physician, PhysicianRole, Shift } from '../types';
import { formatFriendlyDate } from '../utils/schedulerEngine';

interface RosterManagerProps {
  physicians: Physician[];
  shifts: Shift[];
  currentDate: Date;
  onAddPhysician: (newPhysician: Physician) => void;
  onUpdatePhysician: (updatedPhysician: Physician) => void;
  onDeletePhysician: (physicianId: string) => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  physicians,
  shifts,
  currentDate,
  onAddPhysician,
  onUpdatePhysician,
  onDeletePhysician,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  
  // Modal states
  const [editingPhysician, setEditingPhysician] = useState<Physician | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [blackoutEditorDoc, setBlackoutEditorDoc] = useState<Physician | null>(null);
  const [newBlackoutDate, setNewBlackoutDate] = useState<string>('');
  const [newBlackoutReason, setNewBlackoutReason] = useState<string>('Vacation Leave');

  // Form states for new physician
  const [formData, setFormData] = useState<Omit<Physician, 'id'>>({
    name: '',
    title: 'MD',
    role: 'Attending',
    specialty: 'Internal Medicine',
    department: 'Department of Medicine',
    email: '',
    phone: '',
    fte: 1.0,
    maxShiftsPerMonth: 6,
    maxWeekendShifts: 2,
    avatarColor: 'from-blue-500 to-indigo-600',
    blackoutDates: [],
    blackoutReasons: {},
    notes: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Filtered physicians
  const filteredPhysicians = physicians.filter((p) => {
    if (selectedRoleFilter !== 'ALL' && p.role !== selectedRoleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSpecialty = p.specialty.toLowerCase().includes(q);
      const matchEmail = p.email.toLowerCase().includes(q);
      if (!matchName && !matchSpecialty && !matchEmail) return false;
    }
    return true;
  });

  const handleSaveNewPhysician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newPhysician: Physician = {
      ...formData,
      id: `phy-${Date.now()}`,
    };

    onAddPhysician(newPhysician);
    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      title: 'MD',
      role: 'Attending',
      specialty: 'Internal Medicine',
      department: 'Department of Medicine',
      email: '',
      phone: '',
      fte: 1.0,
      maxShiftsPerMonth: 6,
      maxWeekendShifts: 2,
      avatarColor: 'from-cyan-500 to-blue-600',
      blackoutDates: [],
      blackoutReasons: {},
      notes: '',
    });
  };

  const handleUpdatePhysician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhysician) return;
    onUpdatePhysician(editingPhysician);
    setEditingPhysician(null);
  };

  // Blackout Management
  const handleAddBlackout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blackoutEditorDoc || !newBlackoutDate) return;

    const currentDates = blackoutEditorDoc.blackoutDates || [];
    if (!currentDates.includes(newBlackoutDate)) {
      const updatedDates = [...currentDates, newBlackoutDate].sort();
      const updatedReasons = {
        ...(blackoutEditorDoc.blackoutReasons || {}),
        [newBlackoutDate]: newBlackoutReason || 'Approved Leave',
      };

      const updatedDoc: Physician = {
        ...blackoutEditorDoc,
        blackoutDates: updatedDates,
        blackoutReasons: updatedReasons,
      };

      onUpdatePhysician(updatedDoc);
      setBlackoutEditorDoc(updatedDoc);
      setNewBlackoutDate('');
    }
  };

  const handleRemoveBlackout = (dateToRemove: string) => {
    if (!blackoutEditorDoc) return;
    const updatedDates = (blackoutEditorDoc.blackoutDates || []).filter((d) => d !== dateToRemove);
    const updatedReasons = { ...(blackoutEditorDoc.blackoutReasons || {}) };
    delete updatedReasons[dateToRemove];

    const updatedDoc: Physician = {
      ...blackoutEditorDoc,
      blackoutDates: updatedDates,
      blackoutReasons: updatedReasons,
    };

    onUpdatePhysician(updatedDoc);
    setBlackoutEditorDoc(updatedDoc);
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Physician Roster & Constraint Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage clinical appointments, FTE quotas, and blackout unavailability dates
          </p>
        </div>

        <button
          id="btn-add-physician-open"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Clinician</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-roster-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clinician by name, specialty, or email..."
            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
          />
        </div>

        <select
          value={selectedRoleFilter}
          onChange={(e) => setSelectedRoleFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
        >
          <option value="ALL">All Roles ({physicians.length})</option>
          <option value="Attending">Attending Faculty</option>
          <option value="Fellow">Clinical Fellows</option>
          <option value="Senior Resident">Senior Residents (PGY-3)</option>
          <option value="Junior Resident">Junior Residents (PGY-2)</option>
        </select>

        <span className="text-xs text-slate-400 font-medium ml-auto">
          Showing {filteredPhysicians.length} of {physicians.length} Clinicians
        </span>
      </div>

      {/* Physician Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPhysicians.map((physician) => {
          const docMonthShifts = shifts.filter(
            (s) => s.physicianId === physician.id && s.date.startsWith(monthPrefix)
          );
          const quotaPercent = Math.min(
            100,
            Math.round((docMonthShifts.length / (physician.maxShiftsPerMonth || 1)) * 100)
          );
          const blackoutCount = physician.blackoutDates?.length || 0;

          return (
            <div
              key={physician.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${physician.avatarColor} flex items-center justify-center font-bold text-white text-base shadow-md`}
                    >
                      {physician.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-bold text-white text-sm">{physician.name}</h3>
                        {physician.isChief && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            CHIEF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-medium">
                        {physician.role} • {physician.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {physician.specialty}
                      </p>
                    </div>
                  </div>

                  {/* Actions dropdown/buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingPhysician(physician)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Clinician Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${physician.name} from the clinical roster?`)) {
                          onDeletePhysician(physician.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Physician"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quota & Load Progress */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Monthly Call Quota:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {docMonthShifts.length} / {physician.maxShiftsPerMonth} Shifts
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        quotaPercent >= 100
                          ? 'bg-amber-500'
                          : quotaPercent >= 70
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${quotaPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Contact and Leave Summary */}
                <div className="mt-3 bg-slate-950/60 rounded-xl p-3 space-y-1.5 text-xs text-slate-300 font-mono">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[11px]">{physician.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[11px] truncate">{physician.email}</span>
                  </div>
                </div>
              </div>

              {/* Blackout dates trigger button */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setBlackoutEditorDoc(physician)}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-slate-700/60"
                >
                  <CalendarOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    Blackout Dates ({blackoutCount} {blackoutCount === 1 ? 'day' : 'days'})
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BLACKOUT DATES EDITOR MODAL */}
      {blackoutEditorDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${blackoutEditorDoc.avatarColor} flex items-center justify-center font-bold text-white text-sm`}
                >
                  {blackoutEditorDoc.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{blackoutEditorDoc.name}</h3>
                  <p className="text-xs text-slate-400">Blackout & Leave Dates Management</p>
                </div>
              </div>
              <button
                onClick={() => setBlackoutEditorDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Add Blackout Form */}
              <form onSubmit={handleAddBlackout} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5 text-blue-400" /> Add Unavailability Date
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Date</label>
                    <input
                      type="date"
                      required
                      value={newBlackoutDate}
                      onChange={(e) => setNewBlackoutDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Reason / Category</label>
                    <select
                      value={newBlackoutReason}
                      onChange={(e) => setNewBlackoutReason(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs font-medium"
                    >
                      <option value="Vacation Leave">Annual Vacation</option>
                      <option value="CME / Scientific Conference">CME / Scientific Conference</option>
                      <option value="Academic Board Examination">Board / ITE Examination</option>
                      <option value="Post-Night Mandatory Rest">Post-Night Mandatory Rest</option>
                      <option value="Personal Wellness Day">Personal Wellness Day</option>
                      <option value="Fellowship Interview">Fellowship Interview Travel</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-md shadow-blue-600/20"
                >
                  Block This Date
                </button>
              </form>

              {/* Current Blackout Dates List */}
              <div>
                <h4 className="font-bold text-slate-200 mb-2 flex items-center justify-between">
                  <span>Currently Blocked Dates ({(blackoutEditorDoc.blackoutDates || []).length})</span>
                  {blackoutEditorDoc.blackoutDates?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updatedDoc = {
                          ...blackoutEditorDoc,
                          blackoutDates: [],
                          blackoutReasons: {},
                        };
                        onUpdatePhysician(updatedDoc);
                        setBlackoutEditorDoc(updatedDoc);
                      }}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </h4>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {(blackoutEditorDoc.blackoutDates || []).length === 0 ? (
                    <p className="text-slate-500 italic py-4 text-center">
                      No blackout dates submitted for this clinician.
                    </p>
                  ) : (
                    (blackoutEditorDoc.blackoutDates || []).map((dateStr) => {
                      const reason = blackoutEditorDoc.blackoutReasons?.[dateStr] || 'Requested Leave';
                      return (
                        <div
                          key={dateStr}
                          className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-slate-200"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span className="font-mono font-bold text-xs">{formatFriendlyDate(dateStr)}</span>
                            <span className="text-slate-400 text-[11px]">({reason})</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveBlackout(dateStr)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Remove date"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setBlackoutEditorDoc(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
              >
                Close & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PHYSICIAN MODAL */}
      {(isAddModalOpen || editingPhysician) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                {editingPhysician ? 'Edit Clinician Profile' : 'Add New Physician to Roster'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPhysician(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingPhysician ? handleUpdatePhysician : handleSaveNewPhysician}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Full Name & Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jordan Chen"
                    value={editingPhysician ? editingPhysician.name : formData.name}
                    onChange={(e) => {
                      if (editingPhysician) {
                        setEditingPhysician({ ...editingPhysician, name: e.target.value });
                      } else {
                        setFormData({ ...formData, name: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Clinical Role / Rank</label>
                  <select
                    value={editingPhysician ? editingPhysician.role : formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as PhysicianRole;
                      if (editingPhysician) {
                        setEditingPhysician({ ...editingPhysician, role: newRole });
                      } else {
                        setFormData({ ...formData, role: newRole });
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Attending">Attending Faculty</option>
                    <option value="Fellow">Clinical Fellow</option>
                    <option value="Senior Resident">Senior Resident (PGY-3)</option>
                    <option value="Junior Resident">Junior Resident (PGY-2)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiovascular Medicine"
                    value={editingPhysician ? editingPhysician.specialty : formData.specialty}
                    onChange={(e) => {
                      if (editingPhysician) {
                        setEditingPhysician({ ...editingPhysician, specialty: e.target.value });
                      } else {
                        setFormData({ ...formData, specialty: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">FTE Ratio (0.1 - 1.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1.0"
                    value={editingPhysician ? editingPhysician.fte : formData.fte}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 1.0;
                      if (editingPhysician) {
                        setEditingPhysician({ ...editingPhysician, fte: val });
                      } else {
                        setFormData({ ...formData, fte: val });
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Max Shifts per Month</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editingPhysician ? editingPhysician.maxShiftsPerMonth : formData.maxShiftsPerMonth}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 6;
                      if (editingPhysician) {
                        setEditingPhysician({ ...editingPhysician, maxShiftsPerMonth: val });
                      } else {
                        setFormData({ ...formData, maxShiftsPerMonth: val });
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Max Weekend Calls</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={editingPhysician ? editingPhysician.maxWeekendShifts : formData.maxWeekendShifts}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 2;
                      if (editingPhysician) {
                        setEditingPhysician({ ...editingPhysician, maxWeekendShifts: val });
                      } else {
                        setFormData({ ...formData, maxWeekendShifts: val });
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="doctor@hospital.org"
                    value={editingPhysician ? editingPhysician.email : formData.email}
                    onChange={(e) => {
                      if (editingPhysician) {
                        setEditingPhysician({ ...editingPhysician, email: e.target.value });
                      } else {
                        setFormData({ ...formData, email: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Emergency On-Call Phone</label>
                  <input
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={editingPhysician ? editingPhysician.phone : formData.phone}
                    onChange={(e) => {
                      if (editingPhysician) {
                        setEditingPhysician({ ...editingPhysician, phone: e.target.value });
                      } else {
                        setFormData({ ...formData, phone: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingPhysician(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  {editingPhysician ? 'Save Changes' : 'Add to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
