import React, { useState, useEffect, useMemo } from 'react';
import {
  ContentPlan,
  ContentPlanPlatform,
  ContentPlanFormat,
  ContentPlanStatus,
} from '../types';
import {
  fetchContentPlans,
  createContentPlan,
  updateContentPlan,
  deleteContentPlan,
} from '../services/storageService';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Clock,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarDays,
  ListFilter,
  FileText,
  Share2,
  Info,
} from 'lucide-react';

interface ContentPlannerProps {
  onBackToChat?: () => void;
}

type ViewMode = 'calendar' | 'weekly' | 'list';

const PLATFORMS: ContentPlanPlatform[] = [
  'Facebook',
  'Instagram',
  'TikTok',
  'YouTube',
  'X',
  'Other',
];

const FORMATS: ContentPlanFormat[] = [
  'Post',
  'Reel',
  'Story',
  'Video',
  'Carousel',
  'Article',
  'Other',
];

const STATUSES: ContentPlanStatus[] = [
  'Draft',
  'Scheduled',
  'Published',
  'Cancelled',
];

// Helper to get platform styling
export const getPlatformColor = (platform: ContentPlanPlatform | string) => {
  switch (platform) {
    case 'Instagram':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'TikTok':
      return 'bg-slate-900 text-white border-slate-800';
    case 'Facebook':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'YouTube':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'X':
      return 'bg-neutral-100 text-neutral-900 border-neutral-300';
    case 'Other':
    default:
      return 'bg-purple-50 text-purple-700 border-purple-200';
  }
};

// Helper to get status styling
export const getStatusBadge = (status: ContentPlanStatus | string) => {
  switch (status) {
    case 'Published':
    case 'Diposting':
      return {
        label: 'Published',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'Scheduled':
    case 'Siap Diposting':
      return {
        label: 'Scheduled',
        classes: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'Cancelled':
    case 'Ditunda':
      return {
        label: 'Cancelled',
        classes: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'Draft':
    case 'Ide':
    default:
      return {
        label: 'Draft',
        classes: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
};

export const ContentPlanner: React.FC<ContentPlannerProps> = ({ onBackToChat }) => {
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Month navigation for calendar view
  const [currentDate, setCurrentDate] = useState(new Date());

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [platformFilter, setPlatformFilter] = useState<string>('Semua');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContentPlan | null>(null);
  const [detailPlan, setDetailPlan] = useState<ContentPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formPlatform, setFormPlatform] = useState<ContentPlanPlatform>('Instagram');
  const [formFormat, setFormFormat] = useState<ContentPlanFormat>('Post');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('10:00');
  const [formStatus, setFormStatus] = useState<ContentPlanStatus>('Draft');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Load Content Plans
  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchContentPlans();
      setPlans(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal memuat rencana konten.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Reset & Open Form for New Plan
  const handleOpenNewForm = (presetDate?: string) => {
    setEditingPlan(null);
    setFormTitle('');
    setFormTopic('');
    setFormPlatform('Instagram');
    setFormFormat('Post');
    setFormDate(presetDate || new Date().toISOString().split('T')[0]);
    setFormTime('10:00');
    setFormStatus('Draft');
    setFormNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (plan: ContentPlan) => {
    setEditingPlan(plan);
    setFormTitle(plan.title);
    setFormTopic(plan.topic || '');
    setFormPlatform(plan.platform);
    setFormFormat(plan.format);
    setFormDate(plan.scheduledDate || new Date().toISOString().split('T')[0]);
    setFormTime(plan.scheduledTime || '10:00');
    setFormStatus(plan.status);
    setFormNotes(plan.notes || '');
    setFormError(null);
    setDetailPlan(null);
    setIsFormOpen(true);
  };

  // Submit Save/Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Judul konten wajib diisi.');
      return;
    }
    if (!formTopic.trim()) {
      setFormError('Topik konten wajib diisi.');
      return;
    }
    if (!formDate) {
      setFormError('Tanggal rilis konten wajib dipilih.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingPlan) {
        const updated = await updateContentPlan(editingPlan.id, {
          title: formTitle.trim(),
          topic: formTopic.trim(),
          platform: formPlatform,
          format: formFormat,
          scheduledDate: formDate,
          scheduledTime: formTime,
          status: formStatus,
          notes: formNotes.trim(),
        });
        setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await createContentPlan({
          title: formTitle.trim(),
          topic: formTopic.trim(),
          platform: formPlatform,
          format: formFormat,
          scheduledDate: formDate,
          scheduledTime: formTime,
          status: formStatus,
          notes: formNotes.trim(),
        });
        setPlans((prev) => [created, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan rencana konten.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (id: string) => {
    try {
      await deleteContentPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (detailPlan?.id === id) {
        setDetailPlan(null);
      }
      setDeletingPlanId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus rencana konten.');
    }
  };

  // Filtered plans list
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        plan.title.toLowerCase().includes(q) ||
        (plan.topic && plan.topic.toLowerCase().includes(q)) ||
        (plan.notes && plan.notes.toLowerCase().includes(q));

      // Status
      const matchesStatus =
        statusFilter === 'Semua' ||
        plan.status.toLowerCase() === statusFilter.toLowerCase();

      // Platform
      const matchesPlatform =
        platformFilter === 'Semua' || plan.platform === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [plans, searchQuery, statusFilter, platformFilter]);

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
    // Adjust for Monday start (0=Monday, 6=Sunday)
    const startOffset = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dayNumber: number;
      dateString: string;
      isCurrentMonth: boolean;
      plans: ContentPlan[];
    }> = [];

    // Empty previous days
    for (let i = 0; i < startOffset; i++) {
      days.push({
        dayNumber: 0,
        dateString: '',
        isCurrentMonth: false,
        plans: [],
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayPlans = plans.filter((p) => p.scheduledDate === dateStr);
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: true,
        plans: dayPlans,
      });
    }

    return days;
  }, [year, month, plans]);

  // Weekly view days (current week around currentDate)
  const weekDays = useMemo(() => {
    const current = new Date(currentDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(current.setDate(diff));

    const result = [];
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(monday);
      nextDate.setDate(monday.getDate() + i);
      const dateStr = nextDate.toISOString().split('T')[0];
      const dayPlans = plans.filter((p) => p.scheduledDate === dateStr);
      result.push({
        date: nextDate,
        dateStr,
        dayName: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i],
        dayNumber: nextDate.getDate(),
        plans: dayPlans,
      });
    }
    return result;
  }, [currentDate, plans]);

  // Formatted date helper
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      {/* Action Bar & Controls */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title & Stats */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Content Planner
                </h1>
                <p className="text-xs text-slate-500">
                  {plans.length} konten terencana
                </p>
              </div>
            </div>

            {/* View Mode Toggle Buttons on mobile */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 sm:hidden">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-1.5 rounded-md text-xs font-semibold ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <ListFilter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                aria-label="Calendar view"
                className={`p-1.5 rounded-md text-xs font-semibold ${
                  viewMode === 'calendar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Controls: Search, View Switcher & Add Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* View Mode Switcher (Desktop) */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daftar Agenda
              </button>
              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mingguan
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kalender Bulanan
              </button>
            </div>

            {/* Add Content Button */}
            <button
              id="btn-add-content-plan"
              type="button"
              onClick={() => handleOpenNewForm()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Konten</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-5">
        {/* Error message if any */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
            <button
              type="button"
              onClick={loadPlans}
              className="ml-auto underline font-medium text-xs hover:text-rose-900"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul, topik, arahan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
              >
                <option value="Semua">Semua Status</option>
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Published">Published</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Platform:
              </span>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
              >
                <option value="Semua">Semua Platform</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse flex flex-col gap-3"
              >
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="flex gap-2 pt-2">
                  <div className="h-5 bg-slate-200 rounded-full w-16" />
                  <div className="h-5 bg-slate-200 rounded-full w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* VIEW 1: LIST / AGENDA CARDS VIEW */}
            {viewMode === 'list' && (
              <div className="flex-1 flex flex-col gap-4">
                {filteredPlans.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800">
                        {searchQuery || statusFilter !== 'Semua' || platformFilter !== 'Semua'
                          ? 'Tidak ada rencana konten yang cocok'
                          : 'Belum ada rencana konten'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchQuery || statusFilter !== 'Semua' || platformFilter !== 'Semua'
                          ? 'Coba ganti kata kunci pencarian atau bersihkan filter di atas.'
                          : 'Mulai rencanakan jadwal publikasi, reels, video, dan konten media sosialmu.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenNewForm()}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Rencana Konten Pertama</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlans.map((plan) => {
                      const statusInfo = getStatusBadge(plan.status);
                      const platformColor = getPlatformColor(plan.platform);

                      return (
                        <div
                          key={plan.id}
                          className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative"
                        >
                          {/* Top row: Platform & Status Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${platformColor}`}
                            >
                              {plan.platform}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusInfo.classes}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}
                                />
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Middle: Title & Topic */}
                          <div
                            className="cursor-pointer"
                            onClick={() => setDetailPlan(plan)}
                          >
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-slate-800">
                              {plan.title}
                            </h3>
                            {plan.topic && (
                              <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">
                                Topik: {plan.topic}
                              </p>
                            )}
                          </div>

                          {/* Meta: Format & Scheduled time */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium text-[11px]">
                                {plan.format}
                              </span>
                              <div className="flex items-center gap-1 text-slate-600 text-[11px] font-medium">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>
                                  {formatDateDisplay(plan.scheduledDate)} •{' '}
                                  {plan.scheduledTime || '10:00'}
                                </span>
                              </div>
                            </div>

                            {/* Actions: View, Edit, Delete */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailPlan(plan)}
                                title="Lihat Detail"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(plan)}
                                title="Edit Rencana"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingPlanId(plan.id)}
                                title="Hapus"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: WEEKLY VIEW */}
            {viewMode === 'weekly' && (
              <div className="flex-1 flex flex-col gap-4">
                {/* Week Header Navigator */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 px-4 flex items-center justify-between shadow-xs">
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Jadwal Minggu Ini ({monthNames[month]} {year})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(currentDate);
                        prev.setDate(prev.getDate() - 7);
                        setCurrentDate(prev);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleToday}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(currentDate);
                        next.setDate(next.getDate() + 7);
                        setCurrentDate(next);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 7 Days Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {weekDays.map((w) => {
                    const isToday =
                      w.dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={w.dateStr}
                        className={`bg-white border rounded-2xl p-3 flex flex-col gap-2 min-h-[160px] shadow-xs ${
                          isToday
                            ? 'border-indigo-300 ring-2 ring-indigo-100'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase">
                              {w.dayName}
                            </span>
                            <h4
                              className={`text-sm font-bold ${
                                isToday ? 'text-indigo-600' : 'text-slate-800'
                              }`}
                            >
                              {w.dayNumber}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenNewForm(w.dateStr)}
                            title="Tambah di tanggal ini"
                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* List of plans in this day */}
                        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-60">
                          {w.plans.length === 0 ? (
                            <div className="text-[11px] text-slate-400 italic py-2 text-center">
                              Kosong
                            </div>
                          ) : (
                            w.plans.map((p) => {
                              const statusInfo = getStatusBadge(p.status);
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => setDetailPlan(p)}
                                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 cursor-pointer transition-all flex flex-col gap-1 text-left"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[9px] font-bold text-slate-500">
                                      {p.platform}
                                    </span>
                                    <span
                                      className={`w-2 h-2 rounded-full ${statusInfo.dot}`}
                                      title={statusInfo.label}
                                    />
                                  </div>
                                  <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
                                    {p.title}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    {p.scheduledTime}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 3: MONTHLY CALENDAR GRID */}
            {viewMode === 'calendar' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
                {/* Month Navigator Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {monthNames[month]} {year}
                    </h3>
                    <button
                      type="button"
                      onClick={handleToday}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Hari Ini
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      aria-label="Bulan Sebelumnya"
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      aria-label="Bulan Berikutnya"
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day Names Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center border-b border-slate-100 pb-2">
                  {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
                    <div
                      key={day}
                      className="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Cells */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {calendarDays.map((cell, i) => {
                    if (!cell.isCurrentMonth) {
                      return (
                        <div
                          key={`empty-${i}`}
                          className="min-h-[70px] sm:min-h-[90px] p-1 bg-slate-50/50 rounded-xl border border-transparent"
                        />
                      );
                    }

                    const isToday =
                      cell.dateString === new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={cell.dateString}
                        className={`min-h-[70px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all group ${
                          isToday
                            ? 'border-indigo-300 bg-indigo-50/30'
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                              isToday
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-700'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenNewForm(cell.dateString)}
                            title="Tambah konten di tanggal ini"
                            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-opacity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Badges / dots of plans */}
                        <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                          {cell.plans.slice(0, 2).map((plan) => {
                            const statusInfo = getStatusBadge(plan.status);
                            return (
                              <div
                                key={plan.id}
                                onClick={() => setDetailPlan(plan)}
                                title={`${plan.title} (${plan.platform})`}
                                className="truncate text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer flex items-center gap-1 border border-slate-200/60"
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dot}`}
                                />
                                <span className="truncate">{plan.title}</span>
                              </div>
                            );
                          })}

                          {cell.plans.length > 2 && (
                            <span
                              onClick={() => {
                                setStatusFilter('Semua');
                                setPlatformFilter('Semua');
                                setSearchQuery(cell.dateString);
                                setViewMode('list');
                              }}
                              className="text-[9px] font-bold text-indigo-600 cursor-pointer pl-1 hover:underline"
                            >
                              +{cell.plans.length - 2} lagi
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================================================= */}
      {/* MODAL: CREATE / EDIT CONTENT PLAN */}
      {/* ================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingPlan ? 'Edit Rencana Konten' : 'Tambah Rencana Konten'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Jadwalkan dan kelola strategi posting media sosialmu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Judul Konten <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: 5 Tips Menghemat Anggaran Mingguan"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Topic */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Topik / Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Finansial Pribadi, Kuliner, Bisnis UMKM"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Platform & Format (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Platform
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as ContentPlanPlatform)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Format Konten
                  </label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value as ContentPlanFormat)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scheduled Date, Time & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tanggal Rilis <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Waktu
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ContentPlanStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Catatan Kreatif / Arahan
                </label>
                <textarea
                  rows={3}
                  placeholder="Ide visual, referensi musik, CTA yang ingin dipakai..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Rencana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL: DETAIL CONTENT PLAN */}
      {/* ================================================= */}
      {detailPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getPlatformColor(
                    detailPlan.platform
                  )}`}
                >
                  {detailPlan.platform}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    getStatusBadge(detailPlan.status).classes
                  }`}
                >
                  {getStatusBadge(detailPlan.status).label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailPlan(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Detail Content Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {detailPlan.title}
                </h2>
                {detailPlan.topic && (
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Topik: {detailPlan.topic}
                  </p>
                )}
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Format</span>
                  <span className="font-semibold text-slate-800">
                    {detailPlan.format}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Platform</span>
                  <span className="font-semibold text-slate-800">
                    {detailPlan.platform}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">
                    Jadwal Rilis
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatDateDisplay(detailPlan.scheduledDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Waktu</span>
                  <span className="font-semibold text-slate-800">
                    {detailPlan.scheduledTime || '10:00'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {detailPlan.notes && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700">
                    Catatan / Arahan Kreatif
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {detailPlan.notes}
                  </div>
                </div>
              )}

              {/* Timestamp Info */}
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>
                  Dibuat:{' '}
                  {detailPlan.createdAt
                    ? new Date(detailPlan.createdAt).toLocaleDateString('id-ID')
                    : '-'}
                </span>
                <span>ID: {detailPlan.id.substring(0, 10)}...</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingPlanId(detailPlan.id);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailPlan(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditForm(detailPlan)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Rencana</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* CONFIRMATION DIALOG: DELETE */}
      {/* ================================================= */}
      {deletingPlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-5 text-center flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Rencana Konten?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah kamu yakin ingin menghapus rencana konten ini? Tindakan
                ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full pt-2">
              <button
                type="button"
                onClick={() => setDeletingPlanId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeletePlan(deletingPlanId)}
                className="flex-1 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-xs"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
