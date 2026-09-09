import React, { useState, useMemo } from 'react';
import { useExam } from '../../context/ExamContext';
import { CodeEvaluatorModal } from './CodeEvaluatorModal';
import { 
  Search, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  CheckSquare,
  Square,
  MinusSquare,
  Filter,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export const StudentSubmissions = () => {
  const { submissions, deleteSubmission, deleteSubmissions } = useExam();
  
  // Evaluation modal
  const [selectedSub, setSelectedSub] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'clean' | 'warnings' | 'disqualified'
  const [testFilter, setTestFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name-asc'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection states (array of submission IDs)
  const [selectedIds, setSelectedIds] = useState([]);

  // Delete confirmation modal state: null | { type: 'single' | 'bulk', target: sub | ids }
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derive unique assessment titles for the filter dropdown
  const uniqueTestTitles = useMemo(() => {
    const titles = new Set();
    submissions.forEach(s => {
      if (s.testTitle) titles.add(s.testTitle);
    });
    return Array.from(titles).sort();
  }, [submissions]);

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      // 1. Proctoring status filter
      if (statusFilter === 'clean') {
        if (!sub.cheatingStatus?.toLowerCase().includes('clean')) return false;
      } else if (statusFilter === 'warnings') {
        const isWarning = sub.cheatingStatus?.toLowerCase().includes('warning');
        const isClean = sub.cheatingStatus?.toLowerCase().includes('clean');
        if (!isWarning || isClean) return false;
      } else if (statusFilter === 'disqualified') {
        if (!sub.cheatingStatus?.toLowerCase().includes('disqualified')) return false;
      }

      // 2. Assessment title filter
      if (testFilter !== 'all' && sub.testTitle !== testFilter) {
        return false;
      }

      // 3. Search query filter (matches student name, LMS ID, submission ID, test title, score, or proctor logs!)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = sub.studentName?.toLowerCase().includes(q);
        const matchId = sub.studentId?.toLowerCase().includes(q);
        const matchSubId = sub.id?.toLowerCase().includes(q);
        const matchTest = sub.testTitle?.toLowerCase().includes(q);
        const matchScore = sub.score?.toLowerCase().includes(q);
        const matchCheating = sub.cheatingStatus?.toLowerCase().includes(q);
        const matchCompiler = sub.compilerStatus?.toLowerCase().includes(q);
        const matchLogs = sub.proctorLogs?.some(log => 
          log.message?.toLowerCase().includes(q) || log.type?.toLowerCase().includes(q)
        );

        if (!matchName && !matchId && !matchSubId && !matchTest && !matchScore && !matchCheating && !matchCompiler && !matchLogs) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name-asc') {
        return (a.studentName || '').localeCompare(b.studentName || '');
      }
      if (sortBy === 'oldest') {
        return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0);
      }
      // default 'newest'
      return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
    });
  }, [submissions, statusFilter, testFilter, searchQuery, sortBy]);

  // Reset pagination when filters change
  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedSubmissions = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredSubmissions.slice(start, start + pageSize);
  }, [filteredSubmissions, validCurrentPage, pageSize]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || testFilter !== 'all' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTestFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Selection handlers
  const visibleIds = paginatedSubmissions.map(s => s.id || s.sessionId);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const isSomeVisibleSelected = visibleIds.some(id => selectedIds.includes(id)) && !isAllVisibleSelected;

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      // Unselect visible items
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible items
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredSubmissions.map(s => s.id || s.sessionId);
    setSelectedIds(allFilteredIds);
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const toggleRowSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Delete action handlers
  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);

    try {
      if (deleteModal.type === 'single') {
        const idToDelete = deleteModal.target.id || deleteModal.target.sessionId;
        await deleteSubmission(idToDelete);
        setSelectedIds(prev => prev.filter(id => id !== idToDelete));
      } else if (deleteModal.type === 'bulk') {
        await deleteSubmissions(deleteModal.target);
        setSelectedIds(prev => prev.filter(id => !deleteModal.target.includes(id)));
      }
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Student Submissions & Proctoring Monitor</h2>
            <span className="bg-sky-100 text-sky-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              {submissions.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and inspect detailed student logs, code submissions, and security audits.
          </p>
        </div>

        {/* Quick count chips */}
        <div className="flex items-center gap-2 text-xs">
          {hasActiveFilters && (
            <span className="text-slate-500 text-xs">
              Showing <strong className="text-slate-800 font-bold">{filteredSubmissions.length}</strong> of {submissions.length}
            </span>
          )}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search student, LMS ID, test, or log record..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Proctoring Status Dropdown */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium transition cursor-pointer"
            >
              <option value="all">All Proctoring Statuses</option>
              <option value="clean">🟢 Clean (0 Warnings)</option>
              <option value="warnings">🟡 Warnings Logged</option>
              <option value="disqualified">🔴 Disqualified (Cheating)</option>
            </select>
          </div>

          {/* Assessment Filter Dropdown */}
          <div className="md:col-span-2">
            <select
              value={testFilter}
              onChange={(e) => {
                setTestFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium transition cursor-pointer truncate"
            >
              <option value="all">All Assessments</option>
              {uniqueTestTitles.map((title, idx) => (
                <option key={idx} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium transition cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Student Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar (appears when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-sky-50 border border-sky-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-xs text-sky-900 bg-sky-200/70 px-2.5 py-1 rounded-lg">
              <CheckSquare className="w-3.5 h-3.5 text-sky-700" />
              {selectedIds.length} {selectedIds.length === 1 ? 'record' : 'records'} selected
            </span>

            {selectedIds.length < filteredSubmissions.length && (
              <button
                onClick={selectAllFiltered}
                className="text-xs text-sky-700 hover:text-sky-900 hover:underline font-semibold"
              >
                Select all {filteredSubmissions.length} filtered records
              </button>
            )}

            <button
              onClick={deselectAll}
              className="text-xs text-slate-500 hover:text-slate-800 hover:underline font-medium"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteModal({ type: 'bulk', target: selectedIds })}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                {/* Checkbox Header */}
                <th className="p-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAllVisible}
                    title={isAllVisibleSelected ? "Deselect visible" : "Select all visible"}
                    className="p-1 text-slate-500 hover:text-slate-800 rounded transition"
                  >
                    {isAllVisibleSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-600" />
                    ) : isSomeVisibleSelected ? (
                      <MinusSquare className="w-4 h-4 text-sky-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3">Student Name (LMS ID)</th>
                <th className="p-3">Assessment Title</th>
                <th className="p-3">Score</th>
                <th className="p-3">Proctoring Status</th>
                <th className="p-3">Code Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">No submissions found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {hasActiveFilters 
                          ? "No records match your active search or filters. Try adjusting your query or resetting filters." 
                          : "No student assessment submissions recorded yet."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="mt-2 text-sky-600 hover:text-sky-800 text-xs font-bold underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSubmissions.map((sub) => {
                  const subId = sub.id || sub.sessionId;
                  const isSelected = selectedIds.includes(subId);
                  const isDisqualified = sub.cheatingStatus?.includes('DISQUALIFIED');
                  const isClean = sub.cheatingStatus?.includes('Clean');

                  return (
                    <tr
                      key={subId}
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-sky-50/70 border-l-4 border-l-sky-500' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleRowSelect(subId)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* Student Name & ID */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{sub.studentName}</div>
                        <span className="font-mono text-[11px] text-slate-500">{sub.studentId}</span>
                        {sub.id && (
                          <span className="ml-2 font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {sub.id}
                          </span>
                        )}
                      </td>

                      {/* Assessment Title */}
                      <td className="p-3 text-slate-700 font-medium max-w-xs truncate" title={sub.testTitle}>
                        {sub.testTitle}
                      </td>

                      {/* Score */}
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                        {sub.score}
                      </td>

                      {/* Proctoring Status */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isDisqualified
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isClean
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {sub.cheatingStatus}
                        </span>
                      </td>

                      {/* Code Status */}
                      <td className="p-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {sub.compilerStatus}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Evaluate Code & Logs button */}
                          <button
                            onClick={() => setSelectedSub(sub)}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 transition"
                            title="Evaluate candidate code and inspect proctoring audit log"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Evaluate Code & Logs</span>
                          </button>

                          {/* Delete Single Submission button */}
                          <button
                            onClick={() => setDeleteModal({ type: 'single', target: sub })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition"
                            title="Delete this submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer Controls */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400">|</span>
            <span>
              {filteredSubmissions.length > 0 ? (
                <>
                  Showing <strong>{(validCurrentPage - 1) * pageSize + 1}</strong> -{' '}
                  <strong>{Math.min(validCurrentPage * pageSize, filteredSubmissions.length)}</strong> of{' '}
                  <strong>{filteredSubmissions.length}</strong> records
                </>
              ) : (
                '0 records'
              )}
            </span>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-slate-700 font-semibold">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Code Evaluator Modal */}
      <CodeEvaluatorModal
        submission={selectedSub}
        onClose={() => setSelectedSub(null)}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {deleteModal.type === 'single'
                    ? 'Delete Submission Record?'
                    : `Delete ${deleteModal.target.length} Selected Submissions?`}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {deleteModal.type === 'single' ? (
                    <>
                      Are you sure you want to delete the submission for{' '}
                      <strong className="text-slate-800 font-semibold">
                        {deleteModal.target.studentName}
                      </strong>{' '}
                      ({deleteModal.target.studentId}) on{' '}
                      <em className="text-slate-700 font-medium">
                        "{deleteModal.target.testTitle}"
                      </em>
                      ?
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete{' '}
                      <strong className="text-slate-800 font-semibold">
                        {deleteModal.target.length}
                      </strong>{' '}
                      selected student submission records?
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/60 rounded-xl p-3 text-[11px] text-rose-800 leading-relaxed">
              <strong>Warning:</strong> This action cannot be undone. All assessment scores, candidate code, and security proctoring audit logs for these entries will be permanently deleted.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
