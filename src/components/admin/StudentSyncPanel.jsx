import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Database, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 100;

export const StudentSyncPanel = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleStudents = students.slice(startIndex, startIndex + PAGE_SIZE);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Unable to load students');
      setStudents(data.students || []);
      setCurrentPage(1);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const pageNumbers = getPageNumbers(safePage, totalPages);

  useEffect(() => {
    loadStudents();
  }, []);

  const syncStudents = async () => {
    setIsSyncing(true);
    setMessage('');
    try {
      const headers = user?.syncToken ? { Authorization: `Bearer ${user.syncToken}` } : {};
      const res = await fetch('/api/admin/sync-students', { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Student sync failed');
      setMessage(`Synced ${data.synced} of ${data.scanned} CMS student records.`);
      await loadStudents();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#ef5323]" />
            <h2 className="text-base font-bold text-[#051f40]">Student Database Sync</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            CMS student records are copied into the separate i-test database with LMS ID, name, email, batch, and course.
          </p>
        </div>

        <button
          type="button"
          onClick={syncStudents}
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-2 bg-[#051f40] hover:bg-[#1b2a60] disabled:bg-slate-400 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-orange-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing Students' : 'Sync Students Now'}</span>
        </button>
      </div>

      {message && (
        <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 shadow-xs">
          {message}
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#051f40] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#ef5323]" />
            Synced Students
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold">
            {students.length} Records
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No synced students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">LMS ID</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Batch</th>
                  <th className="p-3.5">Course</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleStudents.map(student => (
                  <tr key={student.lmsId} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-[#051f40]">{student.lmsId}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{student.name}</td>
                    <td className="p-3.5 text-slate-600">{student.email || '-'}</td>
                    <td className="p-3.5 font-mono text-slate-700">{formatList(student.batches || student.batch)}</td>
                    <td className="p-3.5 text-slate-700">{formatList(student.courses || student.course)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-semibold">
                Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, students.length)} of {students.length}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={safePage === 1}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((page, index) => page === 'gap' ? (
                  <span key={`gap-${index}`} className="w-8 h-8 inline-flex items-center justify-center text-slate-400 text-xs font-bold">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg border text-xs font-bold transition ${
                      page === safePage
                        ? 'bg-[#051f40] border-[#051f40] text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={safePage === totalPages}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, 2, totalPages - 1, totalPages]);
  for (let page = currentPage - 1; page <= currentPage + 1; page++) {
    if (page >= 1 && page <= totalPages) pages.add(page);
  }

  return [...pages].sort((a, b) => a - b).reduce((items, page, index, sortedPages) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) items.push('gap');
    items.push(page);
    return items;
  }, []);
}

function formatList(value) {
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '-';
  return value || '-';
}
